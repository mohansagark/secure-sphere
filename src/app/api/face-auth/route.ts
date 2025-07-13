import { NextRequest, NextResponse } from "next/server";

// Face authentication verification endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, faceDescriptor, threshold = 70 } = body;

    if (!userId || !faceDescriptor) {
      return NextResponse.json(
        { error: "User ID and face descriptor are required" },
        { status: 400 }
      );
    }

    // Get stored face template
    const templateResponse = await fetch(
      `${request.nextUrl.origin}/api/face-template?userId=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!templateResponse.ok) {
      return NextResponse.json(
        {
          error:
            "Face template not found. Please set up face authentication first.",
        },
        { status: 404 }
      );
    }

    const templateData = await templateResponse.json();

    if (!templateData.isActive) {
      return NextResponse.json(
        { error: "Face authentication is disabled for this user" },
        { status: 403 }
      );
    }

    // Parse stored template
    const storedDescriptor = templateData.templateData.split(",").map(Number);
    const currentDescriptor = Array.isArray(faceDescriptor)
      ? faceDescriptor
      : faceDescriptor.split(",").map(Number);

    // Calculate Euclidean distance
    const distance = calculateEuclideanDistance(
      storedDescriptor,
      currentDescriptor
    );

    // Convert distance to similarity percentage
    const similarity = Math.max(0, Math.min(100, (1 - distance) * 100));

    const isAuthenticated = similarity >= threshold;

    // Log the authentication attempt
    await fetch(`${request.nextUrl.origin}/api/security-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        action: "face_auth",
        method: "face",
        success: isAuthenticated,
        details: `Face recognition similarity: ${similarity.toFixed(2)}%`,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }),
    });

    return NextResponse.json({
      authenticated: isAuthenticated,
      similarity: Math.round(similarity * 100) / 100, // Round to 2 decimal places
      threshold,
      message: isAuthenticated
        ? "Face authentication successful"
        : "Face authentication failed - similarity below threshold",
    });
  } catch (error) {
    console.error("Error in face authentication:", error);
    return NextResponse.json(
      { error: "Face authentication failed due to server error" },
      { status: 500 }
    );
  }
}

// Helper function to calculate Euclidean distance between two face descriptors
function calculateEuclideanDistance(
  descriptor1: number[],
  descriptor2: number[]
): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error("Face descriptors must have the same length");
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}
