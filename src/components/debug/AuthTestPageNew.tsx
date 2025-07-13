"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Fingerprint,
  Mail,
  AlertCircle,
  CheckCircle,
  Link,
  UserCheck,
} from "lucide-react";
import { biometricAuthClient } from "@/utils/biometricAuthClient";

export const AuthTestPageNew: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [hasCredentials, setHasCredentials] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { signInWithGoogle, signInWithFace, user, signOut } = useAuth();

  // Ensure component is mounted before checking biometric status
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user has biometric credentials
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

  // Prevent hydration mismatch by not rendering dynamic content until mounted
  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Biometric Authentication Test & Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const testGoogleAuth = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, google: true }));
      setTestResults((prev) => ({ ...prev, google: null }));

      await signInWithGoogle();

      setTestResults((prev) => ({
        ...prev,
        google: {
          success: true,
          message: "Google authentication successful!",
        },
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

      // Register biometric credentials for the current user
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

      // Check credentials status
      await checkUserCredentials();

      setTestResults((prev) => ({
        ...prev,
        enable: {
          success: true,
          message: `Biometric authentication enabled for ${user.email}! You can now use biometric sign-in.`,
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
    // Pre-flight checks
    if (!user) {
      setTestResults((prev) => ({
        ...prev,
        biometric: {
          success: false,
          message:
            "Please sign in with Google first before testing biometric authentication.",
        },
      }));
      return;
    }

    if (!hasCredentials) {
      setTestResults((prev) => ({
        ...prev,
        biometric: {
          success: false,
          message:
            "Please enable biometric authentication first by clicking 'Enable Biometric Authentication' button.",
        },
      }));
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, biometric: true }));
      setTestResults((prev) => ({ ...prev, biometric: null }));

      console.log("Testing biometric authentication with linked account...");
      await signInWithFace();

      setTestResults((prev) => ({
        ...prev,
        biometric: {
          success: true,
          message:
            "Biometric authentication successful! You are now signed in via Touch ID.",
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

  const handleClearBiometricCredentials = () => {
    biometricAuth.unlinkAccount();
    setTestResults({});
    alert(
      "Biometric credentials cleared! You can now test the setup flow again."
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setTestResults({});
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Debug function to test Touch ID directly
  const debugTouchID = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, debug: true }));
      console.log("Starting Touch ID debug test...");

      await biometricAuth.debugBiometricCapabilities();

      setTestResults((prev) => ({
        ...prev,
        debug: {
          success: true,
          message: "Debug test completed! Check browser console for details.",
        },
      }));
    } catch (error) {
      console.error("Debug test failed:", error);
      setTestResults((prev) => ({
        ...prev,
        debug: {
          success: false,
          message: error instanceof Error ? error.message : "Debug test failed",
        },
      }));
    } finally {
      setIsLoading((prev) => ({ ...prev, debug: false }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Biometric Authentication Test & Setup
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete the 3-step workflow to enable Touch ID authentication
        </p>
      </div>

      {/* Workflow Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
          📋 Workflow Status
        </h3>
        <div className="space-y-2 text-sm">
          <div
            className={`flex items-center space-x-2 ${
              user
                ? "text-green-700 dark:text-green-300"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            <span>{user ? "✅" : "⏳"}</span>
            <span>
              Step 1: Sign in with Google {user ? `(${user.email})` : ""}
            </span>
          </div>
          <div
            className={`flex items-center space-x-2 ${
              isLinked
                ? "text-green-700 dark:text-green-300"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            <span>{isLinked ? "✅" : "⏳"}</span>
            <span>Step 2: Enable Biometric Authentication</span>
          </div>
          <div
            className={`flex items-center space-x-2 ${
              isLinked
                ? "text-blue-700 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            <span>{isLinked ? "🔓" : "🔒"}</span>
            <span>
              Step 3: Test Biometric Sign-In {isLinked ? "(Ready)" : "(Locked)"}
            </span>
          </div>
        </div>
        {!user && (
          <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
            👆 Start by signing in with Google first!
          </div>
        )}
        {user && !isLinked && (
          <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
            👆 Next, enable biometric authentication to link Touch ID to your
            Google account!
          </div>
        )}
        {isLinked && (
          <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-sm text-green-800 dark:text-green-200">
            🎉 Ready! You can now test biometric sign-in with Touch ID!
          </div>
        )}
      </div>

      {/* Debug State Panel */}
      <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
        <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Debug State
        </h4>
        <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
          <div>User: {user ? `✅ ${user.email}` : "❌ Not signed in"}</div>
          <div>isLinked State: {isLinked ? "✅ True" : "❌ False"}</div>
          <div>
            LinkedAccount:{" "}
            {linkedAccount ? `✅ ${linkedAccount.email}` : "❌ None"}
          </div>
          <div>
            Button Disabled:{" "}
            {!isLinked ? "🔒 Yes (waiting for isLinked)" : "🔓 No"}
          </div>
        </div>
      </div>

      {/* Debug Touch ID Button */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Debug Touch ID
        </h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
          Test Touch ID functionality directly and check browser console for
          detailed logs.
        </p>
        <Button
          onClick={debugTouchID}
          loading={isLoading.debug}
          disabled={isLoading.debug}
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Debug Touch ID Now
        </Button>
        {testResults.debug && (
          <div
            className={`mt-3 p-3 rounded flex items-start space-x-2 ${
              testResults.debug.success
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {testResults.debug.success ? (
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}
            <span className="text-sm">{testResults.debug.message}</span>
          </div>
        )}
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

      {/* Biometric Link Status */}
      {linkedAccount && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200">
                  Biometric Authentication Linked
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Linked to: {linkedAccount.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Steps */}
      <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Authentication Workflow
        </h2>

        <div className="space-y-4">
          {/* Step 1: Google Sign-In */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <h3 className="font-medium">Sign in with Google</h3>
              </div>
              {user && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>

            <Button
              onClick={testGoogleAuth}
              loading={isLoading.google}
              disabled={isLoading.google || !!user}
              className="w-full flex items-center justify-center mb-3"
            >
              <Mail className="h-4 w-4 mr-2" />
              {user ? "Already Signed In" : "Sign In with Google"}
            </Button>

            {testResults.google && (
              <div
                className={`p-3 rounded flex items-start space-x-2 ${
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

          {/* Step 2: Enable Biometric */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <h3 className="font-medium">Enable Biometric Authentication</h3>
              </div>
              {isLinked && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>

            <Button
              onClick={enableBiometricAuth}
              loading={isLoading.enable}
              disabled={isLoading.enable || !user || isLinked}
              className="w-full flex items-center justify-center mb-3"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {isLinked
                ? "Biometric Auth Enabled"
                : "Enable Biometric Authentication"}
            </Button>

            {testResults.enable && (
              <div
                className={`p-3 rounded flex items-start space-x-2 ${
                  testResults.enable.success
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {testResults.enable.success ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-sm">{testResults.enable.message}</span>
              </div>
            )}
          </div>

          {/* Step 3: Test Biometric Sign-In */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <h3 className="font-medium">Test Biometric Sign-In</h3>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={testBiometricAuth}
                loading={isLoading.biometric}
                disabled={isLoading.biometric || !isLinked}
                className="w-full flex items-center justify-center"
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                {!isLinked
                  ? "Enable Biometric Auth First"
                  : "Test Biometric Sign-In"}
              </Button>

              <Button
                onClick={handleClearBiometricCredentials}
                variant="outline"
                className="w-full text-sm"
              >
                Reset & Test Setup Flow Again
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
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          How It Works
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Step 1: Sign in with your Google account first</li>
          <li>
            • Step 2: Enable biometric authentication to link it to your Google
            account
          </li>
          <li>
            • Step 3: Now biometric sign-in will log you into your Google
            account (not a separate biometric account)
          </li>
          <li>
            • Future biometric authentication will automatically sign you into
            your Google account
          </li>
        </ul>
      </div>

      {/* Environment Info */}
      <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-4">
        <h3 className="font-medium mb-2">Environment Status</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>
            WebAuthn Support:{" "}
            {typeof window !== "undefined" && window.PublicKeyCredential
              ? "✅ Supported"
              : "❌ Not Supported"}
          </div>
          <div>
            Linked Account:{" "}
            {linkedAccount ? `✅ ${linkedAccount.email}` : "❌ Not Linked"}
          </div>
          <div>
            Current User: {user ? `✅ ${user.email}` : "❌ Not Signed In"}
          </div>
        </div>
      </div>
    </div>
  );
};
