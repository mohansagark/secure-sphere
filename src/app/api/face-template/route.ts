import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// POST - Store face template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, templateData } = body;

    if (!userId || !templateData) {
      return NextResponse.json(
        { error: "User ID and template data are required" },
        { status: 400 }
      );
    }

    // Validate template data format
    if (typeof templateData !== "string") {
      return NextResponse.json(
        { error: "Template data must be a string" },
        { status: 400 }
      );
    }

    const faceTemplateRef = doc(db, "faceTemplates", userId);
    const existingTemplate = await getDoc(faceTemplateRef);

    const templateDoc = {
      userId,
      templateData,
      isActive: true,
      createdAt: existingTemplate.exists()
        ? existingTemplate.data()?.createdAt
        : new Date(),
      updatedAt: new Date(),
    };

    if (existingTemplate.exists()) {
      await updateDoc(faceTemplateRef, {
        templateData,
        updatedAt: new Date(),
      });
    } else {
      await setDoc(faceTemplateRef, templateDoc);
    }

    return NextResponse.json(
      { message: "Face template stored successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error storing face template:", error);
    return NextResponse.json(
      { error: "Failed to store face template" },
      { status: 500 }
    );
  }
}

// GET - Retrieve face template
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const faceTemplateRef = doc(db, "faceTemplates", userId);
    const templateDoc = await getDoc(faceTemplateRef);

    if (!templateDoc.exists()) {
      return NextResponse.json(
        { error: "Face template not found" },
        { status: 404 }
      );
    }

    const data = templateDoc.data();

    return NextResponse.json({
      templateData: data?.templateData,
      isActive: data?.isActive,
      createdAt: data?.createdAt?.toDate(),
      updatedAt: data?.updatedAt?.toDate(),
    });
  } catch (error) {
    console.error("Error retrieving face template:", error);
    return NextResponse.json(
      { error: "Failed to retrieve face template" },
      { status: 500 }
    );
  }
}

// DELETE - Remove face template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const faceTemplateRef = doc(db, "faceTemplates", userId);
    await updateDoc(faceTemplateRef, {
      isActive: false,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      message: "Face template deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating face template:", error);
    return NextResponse.json(
      { error: "Failed to deactivate face template" },
      { status: 500 }
    );
  }
}
