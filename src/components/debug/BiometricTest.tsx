"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { biometricAuth } from "@/utils/biometricAuth";
import {
  Fingerprint,
  Check,
  X,
  AlertCircle,
  Smartphone,
  Monitor,
  Shield,
  Info,
} from "lucide-react";

export const BiometricTest: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [status, setStatus] = useState<string>(
    "Ready to test biometric authentication"
  );
  const [error, setError] = useState<string>("");
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [authResult, setAuthResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);

  useEffect(() => {
    checkDeviceCapabilities();
  }, []);

  const checkDeviceCapabilities = async () => {
    try {
      const info = biometricAuth.getDeviceInfo();
      setDeviceInfo(info);

      const available = await biometricAuth.isBiometricAvailable();
      setBiometricAvailable(available);

      if (available) {
        setStatus("Device supports biometric authentication! ✅");
      } else {
        setStatus("Biometric authentication not available on this device ❌");
      }
    } catch (error) {
      setError(
        `Error checking device capabilities: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const initializeBiometric = async () => {
    setIsInitializing(true);
    setError("");
    setStatus("Initializing biometric authentication...");

    try {
      await biometricAuth.initialize();

      // Test the service
      const testResult = await biometricAuth.testModels();
      setTestResult(testResult);

      if (testResult.success) {
        setIsInitialized(true);
        setStatus("Biometric authentication initialized successfully! ✅");
      } else {
        setError(`Biometric initialization test failed: ${testResult.error}`);
        setStatus("Initialization failed ❌");
      }
    } catch (err) {
      setError(
        `Biometric initialization failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Initialization failed ❌");
    } finally {
      setIsInitializing(false);
    }
  };

  const registerUser = async () => {
    setIsRegistering(true);
    setError("");
    setStatus("Starting biometric registration...");

    try {
      console.log("Starting biometric registration...");

      const credentialId = await biometricAuth.registerCredential("test_user");

      if (credentialId) {
        setRegistrationResult({
          success: true,
          credentialId,
          timestamp: new Date().toISOString(),
        });
        setStatus(
          `Biometric registered successfully! Credential ID: ${credentialId.substring(
            0,
            20
          )}... ✅`
        );
      } else {
        setError("Registration failed - no credential ID received");
        setStatus("Registration failed ❌");
      }
    } catch (err) {
      setError(
        `Biometric registration failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Registration failed ❌");
      console.error("Registration error:", err);
    } finally {
      setIsRegistering(false);
    }
  };

  const authenticateUser = async () => {
    setIsAuthenticating(true);
    setError("");
    setStatus("Starting biometric authentication...");

    try {
      console.log("Starting biometric authentication...");

      const result = await biometricAuth.authenticateUser();

      setAuthResult(result);

      if (result.success) {
        setStatus(`Authentication successful! User ID: ${result.userId} ✅`);
      } else {
        setError(result.error || "Authentication failed");
        setStatus("Authentication failed ❌");
      }
    } catch (err) {
      setError(
        `Biometric authentication failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Authentication failed ❌");
      console.error("Authentication error:", err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const clearCredentials = () => {
    biometricAuth.clearAllCredentials();
    setStatus("All credentials cleared ✅");
    setRegistrationResult(null);
    setAuthResult(null);
    setError("");
  };

  const restartSession = () => {
    const success = biometricAuth.restartSession();
    if (success) {
      setStatus("Session restarted successfully ✅");
      setError("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Biometric Authentication Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Touch ID, Fingerprint, and other biometric authentication methods
        </p>
      </div>

      {/* Device Capabilities */}
      {deviceInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h2 className="font-semibold mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Device Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg border ${
                biometricAvailable
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <Shield
                  className={`h-5 w-5 mr-2 ${
                    biometricAvailable ? "text-green-600" : "text-red-600"
                  }`}
                />
                <span className="font-medium">Biometric Support</span>
              </div>
              <p
                className={`text-sm ${
                  biometricAvailable ? "text-green-800" : "text-red-800"
                }`}
              >
                {biometricAvailable ? "Available" : "Not Available"}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                deviceInfo.hasTouchID
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <Monitor
                  className={`h-5 w-5 mr-2 ${
                    deviceInfo.hasTouchID ? "text-blue-600" : "text-gray-600"
                  }`}
                />
                <span className="font-medium">Touch ID</span>
              </div>
              <p
                className={`text-sm ${
                  deviceInfo.hasTouchID ? "text-blue-800" : "text-gray-600"
                }`}
              >
                {deviceInfo.hasTouchID
                  ? "Supported (Mac/iOS)"
                  : "Not Available"}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                deviceInfo.hasFingerprint
                  ? "bg-purple-50 border-purple-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <Smartphone
                  className={`h-5 w-5 mr-2 ${
                    deviceInfo.hasFingerprint
                      ? "text-purple-600"
                      : "text-gray-600"
                  }`}
                />
                <span className="font-medium">Fingerprint</span>
              </div>
              <p
                className={`text-sm ${
                  deviceInfo.hasFingerprint
                    ? "text-purple-800"
                    : "text-gray-600"
                }`}
              >
                {deviceInfo.hasFingerprint
                  ? "Supported (Android/Windows)"
                  : "Not Available"}
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
              <div className="flex items-center mb-2">
                <Monitor className="h-5 w-5 mr-2 text-gray-600" />
                <span className="font-medium">Platform</span>
              </div>
              <p className="text-sm text-gray-600">{deviceInfo.platform}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="font-semibold mb-4">Status</h2>
        <div className="space-y-2">
          <div
            className={`p-3 rounded ${
              status.includes("✅")
                ? "bg-green-50 text-green-800 border border-green-200"
                : status.includes("❌")
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            {status}
          </div>
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-800 border border-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      </div>

      {/* Test Steps */}
      <div className="space-y-4">
        {/* Step 1: Initialize */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
          <div>
            <h3 className="font-semibold">1. Initialize Biometric Auth</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Initialize the WebAuthn biometric authentication system
            </p>
          </div>
          <Button
            onClick={initializeBiometric}
            loading={isInitializing}
            disabled={!biometricAvailable}
            className="flex items-center"
          >
            {isInitialized ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            {isInitialized ? "Initialized" : "Initialize"}
          </Button>
        </div>

        {/* Step 2: Register */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
          <div>
            <h3 className="font-semibold">2. Register Biometric</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Register your fingerprint/Touch ID for authentication
            </p>
          </div>
          <Button
            onClick={registerUser}
            loading={isRegistering}
            disabled={!isInitialized}
            className="flex items-center"
          >
            {registrationResult ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Fingerprint className="h-4 w-4 mr-2" />
            )}
            {registrationResult ? "Registered" : "Register"}
          </Button>
        </div>

        {/* Step 3: Authenticate */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
          <div>
            <h3 className="font-semibold">3. Authenticate</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verify your registered biometric
            </p>
          </div>
          <Button
            onClick={authenticateUser}
            loading={isAuthenticating}
            disabled={!isInitialized}
            className="flex items-center"
          >
            {authResult?.success ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Fingerprint className="h-4 w-4 mr-2" />
            )}
            {authResult?.success ? "Authenticated" : "Authenticate"}
          </Button>
        </div>

        {/* Step 4: Clear Credentials */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
          <div>
            <h3 className="font-semibold">4. Clear Credentials</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remove all stored biometric credentials (for testing)
            </p>
          </div>
          <Button
            onClick={clearCredentials}
            disabled={!isInitialized}
            variant="outline"
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Results Display */}
      {(testResult || registrationResult || authResult) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h2 className="font-semibold mb-4">Test Results</h2>

          {testResult && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Initialization Test</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          {registrationResult && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Registration Result</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(registrationResult, null, 2)}
              </pre>
            </div>
          )}

          {authResult && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Authentication Result</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(authResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Environment Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="font-semibold mb-4">Environment Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            WebAuthn Support:{" "}
            {typeof window !== "undefined" && window.PublicKeyCredential
              ? "✅"
              : "❌"}
          </div>
          <div>
            HTTPS/Localhost:{" "}
            {typeof window !== "undefined" &&
            (window.location.protocol === "https:" ||
              window.location.hostname === "localhost")
              ? "✅"
              : "❌"}
          </div>
          <div>Platform Authenticator: {biometricAvailable ? "✅" : "❌"}</div>
          <div>
            Browser:{" "}
            {typeof window !== "undefined"
              ? navigator.userAgent
                  .split(" ")
                  .find(
                    (part) =>
                      part.includes("Chrome") ||
                      part.includes("Firefox") ||
                      part.includes("Safari")
                  ) || "Unknown"
              : "Server"}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h2 className="font-semibold mb-4 text-blue-900 dark:text-blue-100">
          Instructions
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
          <li>Click "Initialize" to set up biometric authentication</li>
          <li>Click "Register" to register your fingerprint/Touch ID</li>
          <li>Click "Authenticate" to verify your registered biometric</li>
          <li>Use "Clear All" to remove credentials for testing</li>
        </ol>
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Supported Devices:</strong>
            <br />• MacBooks with Touch ID
            <br />• iPhones/iPads with Face ID or Touch ID
            <br />• Android devices with fingerprint sensors
            <br />• Windows devices with Windows Hello
            <br />• Any device with platform biometric authentication
          </p>
        </div>
      </div>
    </div>
  );
};
