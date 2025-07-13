import { FaceRecognitionUtil } from "@/types";

// FaceIO error codes based on documentation
export const FaceIOErrorCodes = {
  PERMISSION_REFUSED: 1,
  NO_FACES_DETECTED: 2,
  UNRECOGNIZED_FACE: 3,
  MANY_FACES: 4,
  FACE_DUPLICATION: 5,
  MINORS_NOT_ALLOWED: 6,
  PAD_ATTACK: 7,
  FACE_MISMATCH: 8,
  NETWORK_IO: 9,
  WRONG_PIN_CODE: 10,
  PROCESSING_ERR: 11,
  UNAUTHORIZED: 12,
  TERMS_NOT_ACCEPTED: 13,
  UI_NOT_READY: 14,
  SESSION_EXPIRED: 15,
  TIMEOUT: 16,
  TOO_MANY_REQUESTS: 17,
  EMPTY_ORIGIN: 18,
  FORBIDDEN_ORIGIN: 19,
  FORBIDDEN_COUNTRY: 20,
  SESSION_IN_PROGRESS: 21,
} as const;

// FaceIO user data structure
interface FaceIOUserInfo {
  facialId: string;
  timestamp: string;
  details: {
    gender: string;
    age: number;
  };
}

interface FaceIOUserData {
  facialId: string;
  payload?: any;
}

// FaceIO class declaration for TypeScript
declare global {
  interface Window {
    faceIO: any;
  }
}

class FaceIOAuthentication implements FaceRecognitionUtil {
  private faceio: any = null;
  private isInitialized = false;
  private appId: string;

  constructor() {
    // For demo purposes, we'll use a placeholder app ID
    // In production, this should be from environment variables
    this.appId = process.env.NEXT_PUBLIC_FACEIO_APP_ID || "demo-app-id";
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.faceio) return;

    try {
      // Check if we're in browser environment
      if (typeof window === "undefined") {
        throw new Error(
          "FaceIO can only be initialized in browser environment"
        );
      }

      // Load FaceIO script dynamically
      await this.loadFaceIOScript();

      // Initialize FaceIO
      if (window.faceIO) {
        this.faceio = new window.faceIO(this.appId);
        this.isInitialized = true;
        console.log("FaceIO initialized successfully");
      } else {
        throw new Error("FaceIO script failed to load");
      }
    } catch (error) {
      console.error("FaceIO initialization failed:", error);
      throw new Error(
        `FaceIO initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private loadFaceIOScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (
        document.querySelector('script[src="https://cdn.faceio.net/fio.js"]')
      ) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.faceio.net/fio.js";
      script.async = true;

      script.onload = () => {
        console.log("FaceIO script loaded successfully");
        resolve();
      };

      script.onerror = () => {
        reject(new Error("Failed to load FaceIO script"));
      };

      document.head.appendChild(script);
    });
  }

  async captureFace(): Promise<Float32Array | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.faceio) {
      throw new Error("FaceIO not initialized");
    }

    try {
      console.log("Starting FaceIO enrollment...");

      const userInfo: FaceIOUserInfo = await this.faceio.enroll({
        locale: "auto",
        payload: {
          timestamp: new Date().toISOString(),
          source: "SecureSphere",
        },
      });

      console.log("FaceIO enrollment successful:", userInfo);

      // Convert facial ID to Float32Array for compatibility
      // In a real implementation, you'd use the facialId directly
      const descriptor = new Float32Array(128);
      const facialId = userInfo.facialId;

      // Create a simple hash-like representation
      for (let i = 0; i < 128; i++) {
        const charCode = facialId.charCodeAt(i % facialId.length);
        descriptor[i] = (charCode / 255) * 2 - 1; // Normalize to [-1, 1]
      }

      return descriptor;
    } catch (errCode: unknown) {
      console.error("FaceIO enrollment failed:", errCode);
      const errorCode =
        typeof errCode === "number" ? errCode : FaceIOErrorCodes.PROCESSING_ERR;
      throw new Error(this.getErrorMessage(errorCode));
    }
  }

  async authenticateFace(): Promise<{
    success: boolean;
    facialId?: string;
    payload?: any;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.faceio) {
      throw new Error("FaceIO not initialized");
    }

    try {
      console.log("Starting FaceIO authentication...");

      const userData: FaceIOUserData = await this.faceio.authenticate({
        locale: "auto",
      });

      console.log("FaceIO authentication successful:", userData);

      return {
        success: true,
        facialId: userData.facialId,
        payload: userData.payload,
      };
    } catch (errCode: unknown) {
      console.error("FaceIO authentication failed:", errCode);
      return {
        success: false,
      };
    }
  }

  compareFaces(template1: Float32Array, template2: Float32Array): number {
    // For FaceIO, comparison happens on their servers
    // This method calculates a simple similarity for demo purposes
    try {
      let similarity = 0;
      for (let i = 0; i < Math.min(template1.length, template2.length); i++) {
        const diff = Math.abs(template1[i] - template2[i]);
        similarity += 1 - diff;
      }

      return Math.max(0, Math.min(100, (similarity / template1.length) * 100));
    } catch (error) {
      console.error("Face comparison error:", error);
      return 0;
    }
  }

  isModelLoaded(): boolean {
    return this.isInitialized && !!this.faceio;
  }

  // Test method to verify FaceIO is working
  async testModels(): Promise<{
    success: boolean;
    details: Record<string, boolean>;
    error?: string;
  }> {
    try {
      await this.initialize();

      return {
        success: this.isInitialized,
        details: {
          faceIO: this.isInitialized,
          scriptLoaded: !!window.faceIO,
          instanceCreated: !!this.faceio,
        },
        error: this.isInitialized ? undefined : "FaceIO initialization failed",
      };
    } catch (error) {
      return {
        success: false,
        details: {
          faceIO: false,
          scriptLoaded: false,
          instanceCreated: false,
        },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Quick test without enrollment/authentication
  async quickDetectionTest(): Promise<{
    success: boolean;
    detections: any[];
    error?: string;
  }> {
    try {
      await this.initialize();

      return {
        success: this.isInitialized,
        detections: [
          {
            type: "FaceIO Service",
            status: this.isInitialized ? "Ready" : "Not Ready",
          },
        ],
        error: this.isInitialized ? undefined : "FaceIO not ready",
      };
    } catch (error) {
      return {
        success: false,
        detections: [],
        error: error instanceof Error ? error.message : "Test failed",
      };
    }
  }

  // Utility method to restart FaceIO session
  restartSession(): boolean {
    if (this.faceio && typeof this.faceio.restartSession === "function") {
      return this.faceio.restartSession();
    }
    return false;
  }

  private getErrorMessage(errCode: number): string {
    switch (errCode) {
      case FaceIOErrorCodes.PERMISSION_REFUSED:
        return "Camera access was denied. Please allow camera access and try again.";
      case FaceIOErrorCodes.NO_FACES_DETECTED:
        return "No face detected. Please ensure your face is clearly visible and well-lit.";
      case FaceIOErrorCodes.UNRECOGNIZED_FACE:
        return "Face not recognized. Please enroll first or try again.";
      case FaceIOErrorCodes.MANY_FACES:
        return "Multiple faces detected. Please ensure only one face is visible.";
      case FaceIOErrorCodes.FACE_DUPLICATION:
        return "This face is already enrolled. Cannot enroll the same face twice.";
      case FaceIOErrorCodes.MINORS_NOT_ALLOWED:
        return "Minors are not allowed to enroll on this application.";
      case FaceIOErrorCodes.PAD_ATTACK:
        return "Presentation attack detected. Please use your real face, not a photo or video.";
      case FaceIOErrorCodes.FACE_MISMATCH:
        return "Facial features do not match. Please try again.";
      case FaceIOErrorCodes.WRONG_PIN_CODE:
        return "Wrong PIN code entered. Please try again.";
      case FaceIOErrorCodes.TERMS_NOT_ACCEPTED:
        return "Terms and conditions must be accepted to continue.";
      case FaceIOErrorCodes.TIMEOUT:
        return "Operation timed out. Please try again.";
      case FaceIOErrorCodes.NETWORK_IO:
        return "Network error. Please check your connection and try again.";
      case FaceIOErrorCodes.UNAUTHORIZED:
        return "Application not authorized. Please contact support.";
      case FaceIOErrorCodes.TOO_MANY_REQUESTS:
        return "Too many requests. Please wait and try again later.";
      case FaceIOErrorCodes.SESSION_IN_PROGRESS:
        return "Another session is in progress. Please wait and try again.";
      default:
        return `Face authentication failed with error code: ${errCode}`;
    }
  }

  // Compatibility methods for existing interface
  async authenticateWithAPI(
    userId: string,
    faceDescriptor: Float32Array
  ): Promise<{
    authenticated: boolean;
    similarity: number;
    message: string;
  }> {
    try {
      const result = await this.authenticateFace();

      return {
        authenticated: result.success,
        similarity: result.success ? 95 : 0, // FaceIO handles matching internally
        message: result.success
          ? "Authentication successful"
          : "Authentication failed",
      };
    } catch (error) {
      return {
        authenticated: false,
        similarity: 0,
        message:
          error instanceof Error ? error.message : "Authentication error",
      };
    }
  }

  async storeFaceTemplate(
    userId: string,
    faceDescriptor: Float32Array
  ): Promise<boolean> {
    // FaceIO handles storage automatically during enrollment
    // This method is for compatibility with existing interface
    try {
      await this.captureFace();
      return true;
    } catch (error) {
      console.error("Error storing face template:", error);
      return false;
    }
  }
}

export const faceIOAuth = new FaceIOAuthentication();

// Constants for face recognition
export const FACE_RECOGNITION_THRESHOLD = 70; // Minimum similarity percentage for authentication
export const FACE_SETUP_ATTEMPTS = 3; // Number of attempts for initial face setup
export const FACE_AUTH_TIMEOUT = 30000; // Timeout for face authentication in milliseconds
