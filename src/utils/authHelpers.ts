import { biometricAuthClient } from "@/utils/biometricAuthClient";

// Simple biometric authentication functions for AuthContext
export const createBiometricAuthFunctions = (
  user: any,
  setUser: any,
  setUserProfile: any,
  setLoading: any,
  logSecurityEvent: any
) => {
  const setupFaceAuth = async (): Promise<boolean> => {
    if (!user) throw new Error("User not authenticated");

    try {
      setLoading(true);

      const result = await biometricAuthClient.registerBiometric(
        user.uid,
        user.email!,
        user.displayName || "User"
      );

      if (!result.success) {
        throw new Error(
          result.error || "Failed to register biometric credential"
        );
      }

      console.log("Biometric authentication registered for user:", user.email);

      await logSecurityEvent(
        "face_auth",
        "face",
        true,
        "Biometric authentication setup completed"
      );
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      await logSecurityEvent("face_auth", "face", false, errorMessage);
      console.error("Biometric auth setup error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signInWithFace = async (): Promise<boolean> => {
    try {
      setLoading(true);

      console.log("Starting biometric authentication...");

      const isAvailable = await biometricAuthClient.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error(
          "Biometric authentication is not available on this device"
        );
      }

      const result = await biometricAuthClient.authenticateUser();

      if (!result.success) {
        throw new Error(result.error || "Biometric authentication failed");
      }

      if (!result.userId) {
        throw new Error("No user ID returned from biometric authentication");
      }

      console.log(
        "Biometric authentication successful for user:",
        result.userId
      );

      await logSecurityEvent(
        "login",
        "face",
        true,
        "Biometric authentication successful"
      );

      console.log("Biometric sign-in completed successfully");
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      console.error("Biometric authentication error:", error);

      await logSecurityEvent("login", "face", false, errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { setupFaceAuth, signInWithFace };
};
