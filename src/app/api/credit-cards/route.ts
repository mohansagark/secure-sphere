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
import { encryptObject, decryptObject } from "@/utils/encryption";
import { CreditCard } from "@/types";

// GET - Fetch all credit cards for a user
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

    const cardsQuery = query(
      collection(db, "creditCards"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(cardsQuery);
    const cards: CreditCard[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Decrypt sensitive fields
      const decryptedData = {
        cardNumber: data.cardNumber,
        cardholderName: data.cardholderName,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cvv: data.cvv,
      };

      try {
        const decrypted = decryptObject(decryptedData);
        cards.push({
          id: doc.id,
          ...data,
          ...decrypted,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as CreditCard);
      } catch (error) {
        console.error("Failed to decrypt card data:", error);
        // Skip this card if decryption fails
      }
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching credit cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit cards" },
      { status: 500 }
    );
  }
}

// POST - Add a new credit card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      cardNumber,
      cardholderName,
      expiryMonth,
      expiryYear,
      cvv,
      bankName,
      cardType,
      nickname,
      isDefault = false,
    } = body;

    if (
      !userId ||
      !cardNumber ||
      !cardholderName ||
      !expiryMonth ||
      !expiryYear ||
      !cvv
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Encrypt sensitive data
    const sensitiveData = {
      cardNumber,
      cardholderName,
      expiryMonth,
      expiryYear,
      cvv,
    };

    const encryptedData = encryptObject(sensitiveData);

    const cardData = {
      userId,
      ...encryptedData,
      bankName: bankName || "",
      cardType: cardType || "other",
      nickname: nickname || "",
      isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Filter out undefined values before storing in Firebase
    const filteredCardData = Object.fromEntries(
      Object.entries(cardData).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(
      collection(db, "creditCards"),
      filteredCardData
    );

    return NextResponse.json(
      { id: docRef.id, message: "Credit card added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding credit card:", error);
    return NextResponse.json(
      { error: "Failed to add credit card" },
      { status: 500 }
    );
  }
}

// PUT - Update a credit card
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, ...updateData } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Card ID and User ID are required" },
        { status: 400 }
      );
    }

    // Encrypt sensitive data if provided
    const sensitiveFields = [
      "cardNumber",
      "cardholderName",
      "expiryMonth",
      "expiryYear",
      "cvv",
    ];
    const hassensitiveData = sensitiveFields.some((field) => updateData[field]);

    let dataToUpdate = { ...updateData };

    if (hassensitiveData) {
      const sensitiveData: Record<string, string> = {};
      sensitiveFields.forEach((field) => {
        if (updateData[field]) {
          sensitiveData[field] = updateData[field];
          delete dataToUpdate[field];
        }
      });

      const encryptedData = encryptObject(sensitiveData);
      dataToUpdate = { ...dataToUpdate, ...encryptedData };
    }

    dataToUpdate.updatedAt = new Date();

    await updateDoc(doc(db, "creditCards", id), dataToUpdate);

    return NextResponse.json({ message: "Credit card updated successfully" });
  } catch (error) {
    console.error("Error updating credit card:", error);
    return NextResponse.json(
      { error: "Failed to update credit card" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a credit card
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Card ID and User ID are required" },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, "creditCards", id));

    return NextResponse.json({ message: "Credit card deleted successfully" });
  } catch (error) {
    console.error("Error deleting credit card:", error);
    return NextResponse.json(
      { error: "Failed to delete credit card" },
      { status: 500 }
    );
  }
}
