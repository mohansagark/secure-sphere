"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Fingerprint, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { biometricAuthClient } from "@/utils/biometricAuthClient";

export const AuthTestPageSimple: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [hasCredentials, setHasCredentials] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { signInWithGoogle, signInWithFace, user, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user && typeof window !== "undefined") {
      checkUserCredentials();
    }
  }, [user, mounted]);

  const checkUserCredentials = async () => {
    if (!user) return;
    try {
      const hasCredentials = await biometricAuthClient.hasRegisteredCredentials(
        user.uid
      );
      setHasCredentials(hasCredentials);
    } catch (error) {
      console.error("Error checking credentials:", error);
      setHasCredentials(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, signOut: true }));
      await signOut();
      setTestResults((prev) => ({
        ...prev,
        signOut: { success: true, message: "Successfully signed out!" },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        signOut: {
          success: false,
          message: error instanceof Error ? error.message : "Sign out failed",
        },
      }));
    } finally {
      setIsLoading((prev) => ({ ...prev, signOut: false }));
    }
  };

  if (!mounted) {
    return <div className="max-w-3xl mx-auto p-6">Loading...</div>;
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, google: true }));
      await signInWithGoogle();
      setTestResults((prev) => ({
        ...prev,
        google: { success: true, message: "Google sign-in successful!" },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        google: {
          success: false,
          message:
            error instanceof Error ? error.message : "Google auth failed",
        },
      }));
    } finally {
      setIsLoading((prev) => ({ ...prev, google: false }));
    }
  };

  const enableBiometricAuth = async () => {
    if (!user) {
      alert(
        "Please sign in with Google first to enable biometric authentication."
      );
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, enable: true }));

      const result = await biometricAuthClient.registerBiometric(
        user.uid,
        user.email!,
        user.displayName || "User"
      );

      if (!result.success) {
        throw new Error(
          result.error || "Failed to register biometric credentials"
        );
      }

      await checkUserCredentials();

      setTestResults((prev) => ({
        ...prev,
        enable: {
          success: true,
          message: `Biometric authentication enabled for ${user.email}!`,
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        enable: {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to enable biometric auth",
        },
      }));
    } finally {
      setIsLoading((prev) => ({ ...prev, enable: false }));
    }
  };

  const testBiometricAuth = async () => {
    if (!hasCredentials) {
      alert("Please enable biometric authentication first.");
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, biometric: true }));
      const success = await signInWithFace();

      setTestResults((prev) => ({
        ...prev,
        biometric: {
          success,
          message: success
            ? "Biometric authentication successful!"
            : "Biometric authentication failed",
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        biometric: {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Biometric auth test failed",
        },
      }));
    } finally {
      setIsLoading((prev) => ({ ...prev, biometric: false }));
    }
  };

  const debugBiometricCapabilities = async () => {
    try {
      const isAvailable = await biometricAuthClient.isBiometricAvailable();

      const debugInfo = {
        webAuthnSupported: !!window.PublicKeyCredential,
        biometricAvailable: isAvailable,
        platform: navigator.platform,
        hasCredentials: hasCredentials,
        currentUser: user?.email || "None",
      };

      setTestResults((prev) => ({
        ...prev,
        debug: {
          success: true,
          message: "Debug info collected",
          data: debugInfo,
        },
      }));

      console.log("Biometric Debug Info:", debugInfo);
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        debug: {
          success: false,
          message:
            error instanceof Error ? error.message : "Debug check failed",
        },
      }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          🔐 Biometric Authentication Test
        </h1>

        {/* Status Overview */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
            Status Overview
          </h3>
          <div className="space-y-2">
            <div
              className={`flex items-center space-x-2 ${
                user
                  ? "text-green-700 dark:text-green-300"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <span>{user ? "✅" : "⏳"}</span>
              <span>
                Step 1: Google Sign-In {user ? "(Complete)" : "(Pending)"}
              </span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                hasCredentials
                  ? "text-green-700 dark:text-green-300"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <span>{hasCredentials ? "✅" : "⏳"}</span>
              <span>
                Step 2: Enable Biometric Auth{" "}
                {hasCredentials ? "(Complete)" : "(Pending)"}
              </span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                hasCredentials
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <span>{hasCredentials ? "🔓" : "🔒"}</span>
              <span>
                Step 3: Test Biometric Sign-In{" "}
                {hasCredentials ? "(Ready)" : "(Locked)"}
              </span>
            </div>
          </div>
        </div>

        {/* Current User Info */}
        {user && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">
              Current User
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <div>Email: {user.email}</div>
              <div>Name: {user.displayName || "Not set"}</div>
              <div>
                Biometric Credentials:{" "}
                {hasCredentials ? "✅ Registered" : "❌ Not registered"}
              </div>
            </div>
          </div>
        )}

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1: Google Sign-In */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Step 1: Google Sign-In</span>
              {user && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading.google || !!user}
              className="w-full"
            >
              {isLoading.google
                ? "Signing in..."
                : user
                ? "✅ Signed In"
                : "Sign in with Google"}
            </Button>
          </div>

          {/* Step 2: Enable Biometric */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Fingerprint className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Step 2: Enable Biometric</span>
              {hasCredentials && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
            <Button
              onClick={enableBiometricAuth}
              disabled={isLoading.enable || !user || hasCredentials}
              className="w-full"
            >
              {isLoading.enable
                ? "Setting up..."
                : hasCredentials
                ? "✅ Enabled"
                : "Enable Biometric Auth"}
            </Button>
          </div>

          {/* Step 3: Test Biometric Sign-In */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Fingerprint className="h-5 w-5 text-green-600" />
              <span className="font-medium">Step 3: Test Biometric</span>
            </div>
            <Button
              onClick={testBiometricAuth}
              disabled={isLoading.biometric || !hasCredentials}
              className="w-full"
            >
              {isLoading.biometric
                ? "Authenticating..."
                : "🔐 Test Biometric Sign-In"}
            </Button>
          </div>

          {/* Debug Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Debug Info</span>
            </div>
            <Button onClick={debugBiometricCapabilities} className="w-full">
              🔍 Check Debug Info
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Test Results
            </h3>
            {Object.entries(testResults).map(([key, result]) => (
              <div
                key={key}
                className={`p-3 rounded-lg ${
                  result?.success
                    ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                    : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                }`}
              >
                <div className="font-medium">
                  {key.charAt(0).toUpperCase() + key.slice(1)} Test
                </div>
                <div className="text-sm">{result?.message}</div>
                {result?.data && (
                  <pre className="text-xs mt-2 bg-black/10 dark:bg-white/10 p-2 rounded">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
            Instructions
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <div>• Step 1: Sign in with Google to create a user account</div>
            <div>
              • Step 2: Enable biometric authentication to register your
              fingerprint/Touch ID
            </div>
            <div>
              • Step 3: Test biometric sign-in to verify everything works
            </div>
            <div>• Debug: Use debug info to troubleshoot issues</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex space-x-4">
          {user && (
            <Button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading.signOut}
            >
              {isLoading.signOut ? "Signing out..." : "Sign Out"}
            </Button>
          )}
          <Button
            onClick={() => setTestResults({})}
            className="bg-gray-600 hover:bg-gray-700"
          >
            Clear Results
          </Button>
        </div>
      </div>
    </div>
  );
};
