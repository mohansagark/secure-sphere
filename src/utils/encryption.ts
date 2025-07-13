import CryptoJS from "crypto-js";
import { EncryptionUtil } from "@/types";

const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_32_character_key_for_demo";

export const encryptionUtil: EncryptionUtil = {
  encrypt: (data: string): string => {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  },

  decrypt: (encryptedData: string): string => {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error(
          "Failed to decrypt data - invalid key or corrupted data"
        );
      }

      return decryptedString;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  },
};

// Export individual functions for convenience
export const encrypt = encryptionUtil.encrypt;
export const decrypt = encryptionUtil.decrypt;

// Utility functions for encrypting objects
export const encryptObject = (
  obj: Record<string, unknown>
): Record<string, string> => {
  const encrypted: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      encrypted[key] = encryptionUtil.encrypt(String(value));
    }
  }

  return encrypted;
};

export const decryptObject = (
  encryptedObj: Record<string, string>
): Record<string, string> => {
  const decrypted: Record<string, string> = {};

  for (const [key, value] of Object.entries(encryptedObj)) {
    if (value) {
      try {
        decrypted[key] = encryptionUtil.decrypt(value);
      } catch (error) {
        console.error(`Failed to decrypt field ${key}:`, error);
        decrypted[key] = "[DECRYPTION_FAILED]";
      }
    }
  }

  return decrypted;
};

// Generate a secure random encryption key (for development purposes)
export const generateEncryptionKey = (): string => {
  return CryptoJS.lib.WordArray.random(32).toString();
};
