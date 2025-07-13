import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BiometricCredential {
  id: string;
  userId: string;
  publicKey: string; // Base64 encoded
  credentialId: string; // Base64url encoded
  counter: number;
  createdAt: Date;
  lastUsed?: Date;
  deviceInfo?: string;
}

// GET - Fetch biometric credentials for a user or find user by credential ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const credentialId = searchParams.get("credentialId");

    if (!userId && !credentialId) {
      return NextResponse.json(
        { error: "Either userId or credentialId is required" },
        { status: 400 }
      );
    }

    let credentialsQuery;
    if (credentialId) {
      // Find user by credential ID (for authentication)
      credentialsQuery = query(
        collection(db, "biometricCredentials"),
        where("credentialId", "==", credentialId)
      );
    } else {
      // Get all credentials for a user
      credentialsQuery = query(
        collection(db, "biometricCredentials"),
        where("userId", "==", userId)
      );
    }

    const querySnapshot = await getDocs(credentialsQuery);
    const credentials: BiometricCredential[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      credentials.push({
        id: doc.id,
        userId: data.userId,
        publicKey: data.publicKey,
        credentialId: data.credentialId,
        counter: data.counter || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUsed: data.lastUsed?.toDate(),
        deviceInfo: data.deviceInfo,
      });
    });

    return NextResponse.json(credentials);
  } catch (error) {
    console.error("Error fetching biometric credentials:", error);
    return NextResponse.json(
      { error: "Failed to fetch biometric credentials" },
      { status: 500 }
    );
  }
}

// POST - Store a new biometric credential
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, publicKey, credentialId, counter = 0, deviceInfo } = body;

    if (!userId || !publicKey || !credentialId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, publicKey, credentialId" },
        { status: 400 }
      );
    }

    // Check if credential already exists
    const existingQuery = query(
      collection(db, "biometricCredentials"),
      where("credentialId", "==", credentialId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { error: "Credential already exists" },
        { status: 409 }
      );
    }

    const credentialData = {
      userId,
      publicKey,
      credentialId,
      counter,
      deviceInfo,
      createdAt: new Date(),
    };

    // Filter out undefined values before storing in Firebase
    const filteredCredentialData = Object.fromEntries(
      Object.entries(credentialData).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(
      collection(db, "biometricCredentials"),
      filteredCredentialData
    );

    return NextResponse.json(
      { id: docRef.id, message: "Biometric credential stored successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error storing biometric credential:", error);
    return NextResponse.json(
      { error: "Failed to store biometric credential" },
      { status: 500 }
    );
  }
}

// PUT - Update credential counter after authentication
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentialId, counter } = body;

    if (!credentialId || typeof counter !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: credentialId, counter" },
        { status: 400 }
      );
    }

    // Find and update the credential
    const credentialsQuery = query(
      collection(db, "biometricCredentials"),
      where("credentialId", "==", credentialId)
    );
    const querySnapshot = await getDocs(credentialsQuery);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    const credentialDoc = querySnapshot.docs[0];
    await updateDoc(credentialDoc.ref, {
      counter,
      lastUsed: new Date(),
    });

    return NextResponse.json(
      { message: "Credential updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating biometric credential:", error);
    return NextResponse.json(
      { error: "Failed to update biometric credential" },
      { status: 500 }
    );
  }
}

// DELETE - Remove biometric credentials for a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const credentialId = searchParams.get("credentialId");

    if (!userId && !credentialId) {
      return NextResponse.json(
        { error: "Either userId or credentialId is required" },
        { status: 400 }
      );
    }

    let credentialsQuery;
    if (credentialId) {
      credentialsQuery = query(
        collection(db, "biometricCredentials"),
        where("credentialId", "==", credentialId)
      );
    } else {
      credentialsQuery = query(
        collection(db, "biometricCredentials"),
        where("userId", "==", userId)
      );
    }

    const querySnapshot = await getDocs(credentialsQuery);
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    return NextResponse.json(
      { message: `Deleted ${querySnapshot.size} biometric credential(s)` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting biometric credentials:", error);
    return NextResponse.json(
      { error: "Failed to delete biometric credentials" },
      { status: 500 }
    );
  }
}
