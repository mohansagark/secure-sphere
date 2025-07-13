import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { encrypt, decrypt } from "@/utils/encryption";
import { ProfessionalInfo } from "@/types";

// GET - Fetch all professional info for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const category = searchParams.get("category");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    let infoQuery = query(
      collection(db, "professionalInfo"),
      where("userId", "==", userId)
    );

    if (category) {
      infoQuery = query(infoQuery, where("category", "==", category));
    }

    const querySnapshot = await getDocs(infoQuery);
    const professionalInfo: ProfessionalInfo[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      try {
        // Decrypt sensitive fields
        const decryptedFullName = data.fullName ? decrypt(data.fullName) : "";
        const decryptedEmail = data.email ? decrypt(data.email) : "";
        const decryptedPhone = data.phone ? decrypt(data.phone) : "";

        professionalInfo.push({
          id: doc.id,
          fullName: decryptedFullName,
          jobTitle: data.jobTitle || "",
          company: data.company || "",
          email: decryptedEmail,
          phone: decryptedPhone,
          linkedIn: data.linkedIn || "",
          address: data.address || "",
          skills: data.skills || [],
          notes: data.notes || "",
          category: data.category,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      } catch (error) {
        console.error("Failed to decrypt professional info:", error);
        // Skip this item if decryption fails
      }
    });

    return NextResponse.json(professionalInfo);
  } catch (error) {
    console.error("Error fetching professional info:", error);
    return NextResponse.json(
      { error: "Failed to fetch professional information" },
      { status: 500 }
    );
  }
}

// POST - Add new professional information
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      fullName,
      jobTitle,
      company,
      email,
      phone,
      linkedIn,
      address,
      skills,
      notes,
      category,
    } = body;

    if (!userId || !fullName || !jobTitle || !company || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Encrypt sensitive fields
    const encryptedFullName = encrypt(fullName);
    const encryptedEmail = encrypt(email);
    const encryptedPhone = phone ? encrypt(phone) : "";

    const infoData = {
      userId,
      fullName: encryptedFullName,
      jobTitle,
      company,
      email: encryptedEmail,
      phone: encryptedPhone,
      linkedIn: linkedIn || "",
      address: address || "",
      skills: skills || [],
      notes: notes || "",
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Filter out undefined values before storing in Firebase
    const filteredInfoData = Object.fromEntries(
      Object.entries(infoData).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(
      collection(db, "professionalInfo"),
      filteredInfoData
    );

    return NextResponse.json(
      { id: docRef.id, message: "Professional information added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding professional info:", error);
    return NextResponse.json(
      { error: "Failed to add professional information" },
      { status: 500 }
    );
  }
}

// PUT - Update professional information
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const body = await request.json();

    if (!id || !userId) {
      return NextResponse.json(
        { error: "ID and User ID are required" },
        { status: 400 }
      );
    }

    const {
      fullName,
      jobTitle,
      company,
      email,
      phone,
      linkedIn,
      address,
      skills,
      notes,
      category,
    } = body;

    const updateData: { [key: string]: unknown } = { updatedAt: new Date() };

    // Encrypt sensitive fields if provided
    if (fullName) updateData.fullName = encrypt(fullName);
    if (email) updateData.email = encrypt(email);
    if (phone) updateData.phone = encrypt(phone);

    // Non-sensitive fields
    if (jobTitle) updateData.jobTitle = jobTitle;
    if (company) updateData.company = company;
    if (linkedIn !== undefined) updateData.linkedIn = linkedIn;
    if (address !== undefined) updateData.address = address;
    if (skills) updateData.skills = skills;
    if (notes !== undefined) updateData.notes = notes;
    if (category) updateData.category = category;

    await updateDoc(doc(db, "professionalInfo", id), updateData as never);

    return NextResponse.json({
      message: "Professional information updated successfully",
    });
  } catch (error) {
    console.error("Error updating professional info:", error);
    return NextResponse.json(
      { error: "Failed to update professional information" },
      { status: 500 }
    );
  }
}

// DELETE - Delete professional information
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json(
        { error: "ID and User ID are required" },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, "professionalInfo", id));

    return NextResponse.json({
      message: "Professional information deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting professional info:", error);
    return NextResponse.json(
      { error: "Failed to delete professional information" },
      { status: 500 }
    );
  }
}
