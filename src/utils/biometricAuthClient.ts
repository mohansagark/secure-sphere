import { BiometricAuthUtil } from "@/types";

// Server-side biometric authentication utility functions
class BiometricAuthClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "/api";
  }

  // Register biometric credential for a user
  async registerBiometric(
    userId: string,
    userName: string,
    userDisplayName: string
  ) {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      // Check if biometric authentication is available
      const available =
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error(
          "Biometric authentication is not available on this device"
        );
      }

      // Generate challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Convert userId to ArrayBuffer
      const userIdBuffer = new TextEncoder().encode(userId);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
        {
          challenge,
          rp: {
            name: "SecureSphere",
            id: window.location.hostname,
          },
          user: {
            id: userIdBuffer,
            name: userName,
            displayName: userDisplayName,
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256
            { type: "public-key", alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            requireResidentKey: false,
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "direct",
        };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to create credential");
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialId = this.arrayBufferToBase64url(credential.rawId);
      const publicKey = this.arrayBufferToBase64(response.getPublicKey()!);

      // Store credential on server
      const storeResponse = await fetch(
        `${this.baseUrl}/biometric-credentials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            publicKey,
            credentialId,
            counter: 0,
            deviceInfo: navigator.userAgent,
          }),
        }
      );

      if (!storeResponse.ok) {
        const errorText = await storeResponse.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || "Failed to store credential";
        } catch {
          errorMessage = `Server error: ${storeResponse.status} ${storeResponse.statusText}`;
        }
        console.error(
          "Store response error:",
          errorMessage,
          "Status:",
          storeResponse.status
        );
        throw new Error(errorMessage);
      }

      return { success: true, credentialId, userId };
    } catch (error: any) {
      console.error("Biometric registration failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Authenticate using biometric credential
  async authenticateUser() {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      // Generate challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
        {
          challenge,
          timeout: 60000,
          rpId: window.location.hostname,
          userVerification: "required",
        };

      const credential = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Authentication failed - no credential provided");
      }

      const credentialId = this.arrayBufferToBase64url(credential.rawId);

      // Look up user by credential ID
      const lookupResponse = await fetch(
        `${this.baseUrl}/biometric-credentials?credentialId=${credentialId}`
      );
      if (!lookupResponse.ok) {
        throw new Error("Failed to lookup credential");
      }

      const credentials = await lookupResponse.json();
      if (!credentials || credentials.length === 0) {
        throw new Error("No user found for this biometric credential");
      }

      const userCredential = credentials[0];

      // Update counter
      const response = credential.response as AuthenticatorAssertionResponse;
      const counter = 0; // Simplified for now

      await fetch(`${this.baseUrl}/biometric-credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId, counter }),
      });

      return { success: true, credentialId, userId: userCredential.userId };
    } catch (error: any) {
      console.error("Biometric authentication failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Check if user has registered credentials
  async hasRegisteredCredentials(userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/biometric-credentials?userId=${userId}`
      );
      if (!response.ok) return false;
      const credentials = await response.json();
      return credentials && credentials.length > 0;
    } catch (error) {
      console.error("Error checking registered credentials:", error);
      return false;
    }
  }

  // Check if biometric authentication is available
  async isBiometricAvailable(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      if (!window.PublicKeyCredential) return false;
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error("Error checking biometric availability:", error);
      return false;
    }
  }

  // Utility functions
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private arrayBufferToBase64url(buffer: ArrayBuffer): string {
    const base64 = this.arrayBufferToBase64(buffer);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
}

// Create singleton instance
export const biometricAuthClient = new BiometricAuthClient();
