import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Return user data for biometric authentication
    return NextResponse.json({
      success: true,
      user: {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        profileCompleted: userData.profileCompleted || false,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt,
        authMethods: userData.authMethods || [],
        securitySettings: userData.securitySettings || {
          twoFactorEnabled: false,
          faceRecognitionEnabled: true,
          sessionTimeout: 30,
          autoLogout: true,
          encryptionEnabled: true,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user for biometric auth:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
