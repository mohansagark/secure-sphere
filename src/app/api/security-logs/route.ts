import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SecurityLog } from "@/types";

// GET - Fetch security logs for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limitCount = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Simple query without orderBy to avoid composite index requirement
    // For development, we'll fetch without ordering and sort in memory
    let logsQuery = query(
      collection(db, "securityLogs"),
      where("userId", "==", userId)
    );

    if (action) {
      logsQuery = query(logsQuery, where("action", "==", action));
    }

    const querySnapshot = await getDocs(logsQuery);
    const logs: SecurityLog[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        userId: data.userId,
        action: data.action,
        method: data.method,
        success: data.success,
        timestamp: data.timestamp?.toDate() || new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        details: data.details,
      });
    });

    // Sort by timestamp in memory (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit after sorting
    const limitedLogs =
      limitCount > 0 && limitCount <= 100 ? logs.slice(0, limitCount) : logs;

    return NextResponse.json(limitedLogs);
  } catch (error) {
    console.error("Error fetching security logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch security logs" },
      { status: 500 }
    );
  }
}

// POST - Add a new security log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      action,
      method,
      success,
      ipAddress = "unknown",
      userAgent = "unknown",
      location,
      details,
    } = body;

    if (!userId || !action || !method || typeof success !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: userId, action, method, success" },
        { status: 400 }
      );
    }

    const logData = {
      userId,
      action,
      method,
      success,
      ipAddress,
      userAgent,
      location,
      details,
      timestamp: new Date(),
    };

    // Filter out undefined values before storing in Firebase
    const filteredLogData = Object.fromEntries(
      Object.entries(logData).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(
      collection(db, "securityLogs"),
      filteredLogData
    );

    return NextResponse.json(
      { id: docRef.id, message: "Security log added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding security log:", error);
    return NextResponse.json(
      { error: "Failed to add security log" },
      { status: 500 }
    );
  }
}
