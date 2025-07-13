"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Fingerprint, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { biometricAuth } from "@/utils/biometricAuth";

export const AuthTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const { signInWithGoogle, signInWithFace, user, signOut } = useAuth();

  const testGoogleAuth = async () => {
    setIsLoading((prev) => ({ ...prev, google: true }));
    try {
      await signInWithGoogle();
      setTestResults((prev) => ({
        ...prev,
        google: { success: true, message: "Google authentication successful!" },
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

  const testBiometricAuth = async () => {
    setIsLoading((prev) => ({ ...prev, biometric: true }));
    try {
      const success = await signInWithFace();
      setTestResults((prev) => ({
        ...prev,
        biometric: {
          success,
          message: success
            ? "Biometric authentication successful!"
            : "Biometric auth failed",
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        biometric: {
          success: false,
          message:
            error instanceof Error ? error.message : "Biometric auth failed",
        },
      }));
    } finally {
      setIsLoading((prev) => ({ ...prev, biometric: false }));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setTestResults({});
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleClearBiometricCredentials = () => {
    biometricAuth.clearAllCredentials();
    alert(
      "Biometric credentials cleared! You can now test the registration flow."
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Authentication Test Page
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test Google and Biometric authentication methods
        </p>
      </div>

      {/* Current User Status */}
      {user && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-200">
                Currently Signed In
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                {user.email} ({user.displayName})
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Test Buttons */}
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">Google Authentication Test</h3>
          <Button
            onClick={testGoogleAuth}
            loading={isLoading.google}
            disabled={isLoading.google}
            className="w-full flex items-center justify-center"
          >
            <Mail className="h-4 w-4 mr-2" />
            Test Google Sign-In
          </Button>

          {testResults.google && (
            <div
              className={`mt-3 p-3 rounded flex items-start space-x-2 ${
                testResults.google.success
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {testResults.google.success ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{testResults.google.message}</span>
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">Biometric Authentication Test</h3>
          <div className="space-y-3">
            <Button
              onClick={testBiometricAuth}
              loading={isLoading.biometric}
              disabled={isLoading.biometric}
              className="w-full flex items-center justify-center"
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              Test Biometric Sign-In
            </Button>

            <Button
              onClick={handleClearBiometricCredentials}
              variant="outline"
              className="w-full text-sm"
            >
              Clear Stored Credentials (Test Registration)
            </Button>
          </div>

          {testResults.biometric && (
            <div
              className={`mt-3 p-3 rounded flex items-start space-x-2 ${
                testResults.biometric.success
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {testResults.biometric.success ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{testResults.biometric.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          Test Instructions
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Google auth opens a real Firebase authentication popup</li>
          <li>
            • Biometric auth uses real WebAuthn (Touch ID, fingerprint, etc.)
          </li>
          <li>
            • First biometric use will automatically register your biometric
            credentials
          </li>
          <li>
            • Use "Clear Stored Credentials" to test the registration flow again
          </li>
          <li>• Ensure your device has biometric authentication enabled</li>
          <li>• Check browser console for detailed logs</li>
        </ul>
      </div>

      {/* Environment Info */}
      <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-4">
        <h3 className="font-medium mb-2">Environment</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>Mode: Demo (Firebase API Key: demo_key)</div>
          <div>
            Browser:{" "}
            {typeof window !== "undefined"
              ? navigator.userAgent.split(" ").pop()
              : "Server"}
          </div>
          <div>
            WebAuthn Support:{" "}
            {typeof window !== "undefined" && window.PublicKeyCredential
              ? "✅"
              : "❌"}
          </div>
        </div>
      </div>
    </div>
  );
};
