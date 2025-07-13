import { BiometricAuthUtil } from "@/types";

// WebAuthn/Biometric Authentication Utility
// Supports Touch ID on MacBook, fingerprint on mobile, and other biometric methods

interface BiometricCredential {
  id: string;
  publicKey: ArrayBuffer;
  userId: string;
  timestamp: string;
}

interface BiometricAuthResult {
  success: boolean;
  credentialId?: string;
  userId?: string;
  error?: string;
}

class BiometricAuthentication implements BiometricAuthUtil {
  private isInitialized = false;
  private rpId: string;
  private rpName: string;

  constructor() {
    this.rpId =
      typeof window !== "undefined" ? window.location.hostname : "localhost";
    this.rpName = "SecureSphere";
  }

  async initialize(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("WebAuthn is only available in browser environment");
    }

    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error("WebAuthn is not supported in this browser");
    }

    // Check if biometric authentication is available
    const available = await this.isBiometricAvailable();
    if (!available) {
      throw new Error(
        "Biometric authentication is not available on this device"
      );
    }

    this.isInitialized = true;
    console.log("Biometric authentication initialized successfully");
  }

  async isBiometricAvailable(): Promise<boolean> {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      console.log(
        "WebAuthn not supported: window or PublicKeyCredential unavailable"
      );
      return false;
    }

    try {
      // Check if platform authenticator (Touch ID, Windows Hello, etc.) is available
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log("Platform authenticator available:", available);

      // Additional check for conditional UI support (helps with platform detection)
      if (available && PublicKeyCredential.isConditionalMediationAvailable) {
        const conditionalAvailable =
          await PublicKeyCredential.isConditionalMediationAvailable();
        console.log("Conditional mediation available:", conditionalAvailable);
      }

      return available;
    } catch (error) {
      console.error("Error checking biometric availability:", error);
      return false;
    }
  }

  async registerCredential(userId?: string): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error("Biometric authentication not initialized");
    }

    // Create a simple, WebAuthn-friendly user ID
    const simpleUserId = userId || `user${Date.now()}`;
    const userIdBytes = new TextEncoder().encode(simpleUserId);

    const user = {
      id: userIdBytes,
      name: simpleUserId,
      displayName: "SecureSphere User",
    };

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
      {
        challenge,
        rp: {
          name: this.rpName,
          id: this.rpId,
        },
        user,
        pubKeyCredParams: [
          {
            type: "public-key",
            alg: -7, // ES256
          },
          {
            type: "public-key",
            alg: -257, // RS256
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Force built-in authenticators (Touch ID, fingerprint)
          userVerification: "required", // Require biometric verification
          requireResidentKey: false, // Changed from true - this was causing the barcode issue
          residentKey: "preferred", // Prefer resident key but don't require
        },
        timeout: 60000,
        attestation: "direct",
      };

    try {
      console.log("Creating WebAuthn credential with options:", {
        rp: publicKeyCredentialCreationOptions.rp,
        user: {
          id: Array.from(
            new Uint8Array(
              publicKeyCredentialCreationOptions.user.id as ArrayBuffer
            )
          ),
          name: publicKeyCredentialCreationOptions.user.name,
          displayName: publicKeyCredentialCreationOptions.user.displayName,
        },
        authenticatorSelection:
          publicKeyCredentialCreationOptions.authenticatorSelection,
      });

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to create credential");
      }

      console.log("WebAuthn credential created successfully:", credential.id);

      // Store credential info (in a real app, you'd store this securely)
      const credentialData: BiometricCredential = {
        id: credential.id,
        publicKey: (credential.response as AuthenticatorAttestationResponse)
          .attestationObject,
        userId: new TextDecoder().decode(user.id),
        timestamp: new Date().toISOString(),
      };

      // Store in localStorage for demo (in production, use secure server storage)
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `biometric_credential_${credential.id}`,
          JSON.stringify({
            ...credentialData,
            publicKey: Array.from(new Uint8Array(credentialData.publicKey)), // Convert to serializable format
          })
        );
      }

      console.log(
        "Biometric credential registered successfully:",
        credential.id
      );
      return credential.id;
    } catch (error) {
      console.error("Biometric registration failed:", error);
      throw new Error(
        `Biometric registration failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async authenticateFace(): Promise<BiometricAuthResult> {
    return await this.authenticateUser();
  }

  async authenticateUser(): Promise<BiometricAuthResult> {
    if (!this.isInitialized) {
      throw new Error("Biometric authentication not initialized");
    }

    // Get stored credentials
    const storedCredentials = this.getStoredCredentials();
    console.log("🔍 Debug - Stored credentials:", storedCredentials.length);

    if (storedCredentials.length === 0) {
      console.log("❌ No stored credentials found");
      return {
        success: false,
        error: "No biometric credentials found. Please register first.",
      };
    }

    console.log(`✅ Found ${storedCredentials.length} stored credential(s)`);

    // Create allowCredentials array from stored credentials
    const allowCredentials = storedCredentials.map((cred) => {
      // Convert base64url string to ArrayBuffer
      // WebAuthn credential IDs are base64url encoded, not regular base64
      const credentialIdString = cred.id;

      // Convert base64url to ArrayBuffer
      // First convert base64url to base64 by replacing characters and adding padding
      let base64 = credentialIdString.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }

      let binaryString;
      try {
        binaryString = atob(base64);
      } catch (error) {
        console.log(
          "Failed to decode credential ID, using direct string conversion:",
          credentialIdString
        );
        // If base64 decoding fails, the ID might already be in the right format
        // Convert string to Uint8Array directly
        const encoder = new TextEncoder();
        return {
          id: encoder.encode(credentialIdString).buffer as ArrayBuffer,
          type: "public-key" as const,
        };
      }

      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return {
        id: bytes.buffer as ArrayBuffer,
        type: "public-key" as const,
      };
    });

    console.log(
      "📋 AllowCredentials for authentication:",
      allowCredentials.length
    );

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
      {
        challenge,
        allowCredentials, // Include the stored credentials
        userVerification: "required",
        timeout: 60000,
        rpId: this.rpId,
      };

    try {
      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (!assertion) {
        console.log("❌ No assertion received");
        return {
          success: false,
          error: "Authentication failed - no assertion received",
        };
      }

      console.log("✅ Assertion received, ID:", assertion.id);

      // Find the corresponding stored credential
      const credentialId = assertion.id;
      console.log("🔍 Looking for credential ID:", credentialId);
      console.log(
        "🔍 Available stored credential IDs:",
        storedCredentials.map((c) => c.id)
      );

      const storedCredential = storedCredentials.find(
        (cred) => cred.id === credentialId
      );

      if (!storedCredential) {
        console.log("❌ Credential not found in stored credentials");
        console.log(
          "❌ This suggests a credential ID mismatch between registration and authentication"
        );
        return {
          success: false,
          error: "Authentication failed - credential not found",
        };
      }

      console.log("✅ Biometric authentication successful:", credentialId);
      return {
        success: true,
        credentialId,
        userId: storedCredential.userId,
      };
    } catch (error) {
      console.error("Biometric authentication failed:", error);
      return {
        success: false,
        error: `Authentication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  getStoredCredentials(): BiometricCredential[] {
    if (typeof window === "undefined") return [];

    const credentials: BiometricCredential[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("biometric_credential_")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          // Convert publicKey back to ArrayBuffer
          data.publicKey = new Uint8Array(data.publicKey).buffer;
          credentials.push(data);
        } catch (error) {
          console.error("Error parsing stored credential:", error);
        }
      }
    }

    return credentials;
  }

  async testModels(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!window.PublicKeyCredential) {
        return {
          success: false,
          error: "WebAuthn not supported",
        };
      }

      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: "Biometric authentication not available",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  restartSession(): boolean {
    // Clear any temporary session data
    console.log("Biometric session restarted");
    return true;
  }

  // Helper method to get device info
  getDeviceInfo(): {
    platform: string;
    hasTouchID: boolean;
    hasFingerprint: boolean;
    supportsBiometric: boolean;
  } {
    const platform = navigator.platform || "Unknown";
    const userAgent = navigator.userAgent || "";

    const isMac = platform.toLowerCase().includes("mac");
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = userAgent.toLowerCase().includes("android");
    const isWindows = platform.toLowerCase().includes("win");

    return {
      platform,
      hasTouchID: isMac || isIOS,
      hasFingerprint: isAndroid || isWindows,
      supportsBiometric: !!window.PublicKeyCredential,
    };
  }

  // Helper method to clear all stored credentials (for testing)
  clearAllCredentials(): void {
    if (typeof window === "undefined") return;

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("biometric_credential_")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} biometric credentials`);
  }

  // Enhanced device detection method
  async detectBiometricCapabilities(): Promise<{
    hasWebAuthn: boolean;
    hasPlatformAuthenticator: boolean;
    deviceType: string;
    recommendedAction: string;
  }> {
    const result = {
      hasWebAuthn: false,
      hasPlatformAuthenticator: false,
      deviceType: "unknown",
      recommendedAction: "Biometric authentication not available",
    };

    // Check WebAuthn support
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      result.recommendedAction =
        "Browser does not support WebAuthn. Try using Chrome, Safari, or Edge.";
      return result;
    }

    result.hasWebAuthn = true;

    try {
      // Check platform authenticator
      const platformAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      result.hasPlatformAuthenticator = platformAvailable;

      // Detect device type
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;

      if (platform.includes("Mac") || userAgent.includes("Mac")) {
        result.deviceType = "macOS";
        result.recommendedAction = platformAvailable
          ? "Touch ID should work. Make sure Touch ID is enabled in System Preferences."
          : "Touch ID not available. Enable Touch ID in System Preferences or use a MacBook with Touch ID.";
      } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
        result.deviceType = "iOS";
        result.recommendedAction = platformAvailable
          ? "Face ID or Touch ID should work."
          : "Face ID/Touch ID not available. Enable in Settings > Face ID & Passcode or Touch ID & Passcode.";
      } else if (userAgent.includes("Android")) {
        result.deviceType = "Android";
        result.recommendedAction = platformAvailable
          ? "Fingerprint authentication should work."
          : "Fingerprint not available. Enable fingerprint lock in device settings.";
      } else if (platform.includes("Win")) {
        result.deviceType = "Windows";
        result.recommendedAction = platformAvailable
          ? "Windows Hello should work (fingerprint, face, or PIN)."
          : "Windows Hello not available. Enable Windows Hello in Settings > Accounts > Sign-in options.";
      }

      if (!platformAvailable) {
        result.recommendedAction +=
          " Alternatively, use Google sign-in or email/password authentication.";
      }
    } catch (error) {
      console.error("Error detecting biometric capabilities:", error);
      result.recommendedAction =
        "Error detecting biometric capabilities. Try refreshing the page.";
    }

    return result;
  }

  // Account linking functionality
  linkToAccount(user: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    provider: string;
    createdAt: string;
  }): void {
    const linkData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "User",
      photoURL: user.photoURL,
      provider: user.provider,
      createdAt: user.createdAt,
      linkedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "biometric_linked_account",
        JSON.stringify(linkData)
      );
    }
    console.log("Biometric authentication linked to account:", user.email);
  }

  getLinkedAccount(): {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    provider: string;
    createdAt: string;
    linkedAt: string;
  } | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("biometric_linked_account");
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error("Error parsing linked account data:", error);
      return null;
    }
  }

  unlinkAccount(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("biometric_linked_account");
    }
    this.clearAllCredentials();
    console.log("Biometric authentication unlinked from account");
  }

  isLinkedToAccount(): boolean {
    return this.getLinkedAccount() !== null;
  }

  // Debug method to test biometric authentication capabilities
  async debugBiometricCapabilities(): Promise<void> {
    console.log("=== BIOMETRIC DEBUG INFORMATION ===");

    // Check basic WebAuthn support
    console.log("WebAuthn supported:", !!window.PublicKeyCredential);

    if (!window.PublicKeyCredential) {
      console.log("❌ WebAuthn not supported in this browser");
      return;
    }

    try {
      // Check platform authenticator availability
      const platformAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log("Platform authenticator available:", platformAvailable);

      if (!platformAvailable) {
        console.log(
          "❌ No platform authenticator (Touch ID, Windows Hello, etc.) available"
        );
        return;
      }

      // Check conditional mediation
      if (PublicKeyCredential.isConditionalMediationAvailable) {
        const conditionalAvailable =
          await PublicKeyCredential.isConditionalMediationAvailable();
        console.log("Conditional mediation available:", conditionalAvailable);
      }

      // Test creating a simple credential to see if Touch ID prompt appears
      console.log("🔍 Testing credential creation...");

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const testOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: { name: "Test", id: this.rpId },
        user: {
          id: new TextEncoder().encode("test-user"),
          name: "test@example.com",
          displayName: "Test User",
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 30000,
      };

      console.log("Attempting to create credential with Touch ID prompt...");
      const credential = await navigator.credentials.create({
        publicKey: testOptions,
      });

      if (credential) {
        console.log("✅ Touch ID credential creation successful!");
        console.log("Credential ID:", credential.id);
      }
    } catch (error) {
      console.error("❌ Error testing biometric capabilities:", error);
      if (error instanceof Error) {
        console.log("Error name:", error.name);
        console.log("Error message:", error.message);
      }
    }

    console.log("=== END BIOMETRIC DEBUG ===");
  }
}

// Export singleton instance
export const biometricAuth = new BiometricAuthentication();

// Export class for direct instantiation if needed
export { BiometricAuthentication };

// Export types
export type { BiometricCredential, BiometricAuthResult };
