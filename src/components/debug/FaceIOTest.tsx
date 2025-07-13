"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { faceIOAuth } from "@/utils/faceioAuth";
import {
  Camera,
  Check,
  X,
  AlertCircle,
  Eye,
  User,
  UserCheck,
} from "lucide-react";

export const FaceIOTest: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [status, setStatus] = useState<string>("Ready to test FaceIO");
  const [error, setError] = useState<string>("");
  const [enrollmentResult, setEnrollmentResult] = useState<any>(null);
  const [authResult, setAuthResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const initializeFaceIO = async () => {
    setIsInitializing(true);
    setError("");
    setStatus("Initializing FaceIO...");

    try {
      await faceIOAuth.initialize();

      // Test the service
      const testResult = await faceIOAuth.testModels();
      setTestResult(testResult);

      if (testResult.success) {
        setIsInitialized(true);
        setStatus("FaceIO initialized successfully! ✅");
      } else {
        setError(`FaceIO initialization test failed: ${testResult.error}`);
        setStatus("Initialization failed ❌");
      }
    } catch (err) {
      setError(
        `FaceIO initialization failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Initialization failed ❌");
    } finally {
      setIsInitializing(false);
    }
  };

  const enrollUser = async () => {
    setIsEnrolling(true);
    setError("");
    setStatus("Starting face enrollment...");

    try {
      console.log("Starting FaceIO enrollment...");

      // Use the capture method which internally calls FaceIO enroll
      const faceTemplate = await faceIOAuth.captureFace();

      if (faceTemplate) {
        setEnrollmentResult({
          success: true,
          templateLength: faceTemplate.length,
          timestamp: new Date().toISOString(),
        });
        setStatus(
          `Face enrolled successfully! Template length: ${faceTemplate.length} ✅`
        );
      } else {
        setError("Enrollment failed - no face template received");
        setStatus("Enrollment failed ❌");
      }
    } catch (err) {
      setError(
        `Face enrollment failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Enrollment failed ❌");
      console.error("Enrollment error:", err);
    } finally {
      setIsEnrolling(false);
    }
  };

  const authenticateUser = async () => {
    setIsAuthenticating(true);
    setError("");
    setStatus("Starting face authentication...");

    try {
      console.log("Starting FaceIO authentication...");

      // Use the FaceIO authentication method
      const result = await faceIOAuth.authenticateFace();

      setAuthResult(result);

      if (result.success) {
        setStatus(
          `Authentication successful! Facial ID: ${result.facialId} ✅`
        );
      } else {
        setError("Authentication failed - face not recognized");
        setStatus("Authentication failed ❌");
      }
    } catch (err) {
      setError(
        `Face authentication failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Authentication failed ❌");
      console.error("Authentication error:", err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const restartSession = () => {
    const success = faceIOAuth.restartSession();
    if (success) {
      setStatus("Session restarted successfully ✅");
      setEnrollmentResult(null);
      setAuthResult(null);
      setError("");
    } else {
      setError("Failed to restart session (feature requires Premium plan)");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          FaceIO Authentication Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Professional facial authentication powered by FaceIO
        </p>
      </div>

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
        {/* Step 1: Initialize FaceIO */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
          <div>
            <h3 className="font-semibold">1. Initialize FaceIO</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Load and initialize the FaceIO service
            </p>
          </div>
          <Button
            onClick={initializeFaceIO}
            loading={isInitializing}
            className="flex items-center"
          >
            {isInitialized ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {isInitialized ? "Initialized" : "Initialize"}
          </Button>
        </div>

        {/* Step 2: Enroll User */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
          <div>
            <h3 className="font-semibold">2. Enroll New User</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Register a new face for authentication
            </p>
          </div>
          <Button
            onClick={enrollUser}
            loading={isEnrolling}
            disabled={!isInitialized}
            className="flex items-center"
          >
            {enrollmentResult ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <User className="h-4 w-4 mr-2" />
            )}
            {enrollmentResult ? "Enrolled" : "Enroll Face"}
          </Button>
        </div>

        {/* Step 3: Authenticate User */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
          <div>
            <h3 className="font-semibold">3. Authenticate User</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verify an enrolled face
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
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            {authResult?.success ? "Authenticated" : "Authenticate"}
          </Button>
        </div>

        {/* Step 4: Restart Session */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
          <div>
            <h3 className="font-semibold">4. Restart Session</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Clear session to test multiple users (Premium feature)
            </p>
          </div>
          <Button
            onClick={restartSession}
            disabled={!isInitialized}
            variant="outline"
            className="flex items-center"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Restart Session
          </Button>
        </div>
      </div>

      {/* Results Display */}
      {(testResult || enrollmentResult || authResult) && (
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

          {enrollmentResult && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Enrollment Result</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(enrollmentResult, null, 2)}
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
          <div>FaceIO Service: {isInitialized ? "✅" : "❌"}</div>
          <div>
            HTTPS/Localhost:{" "}
            {typeof window !== "undefined" &&
            (window.location.protocol === "https:" ||
              window.location.hostname === "localhost")
              ? "✅"
              : "❌"}
          </div>
          <div>
            getUserMedia Support:{" "}
            {typeof window !== "undefined" &&
            navigator?.mediaDevices &&
            typeof navigator.mediaDevices.getUserMedia === "function"
              ? "✅"
              : "❌"}
          </div>
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
          <li>Click "Initialize" to load FaceIO service</li>
          <li>
            Click "Enroll Face" to register your face (requires camera
            permission)
          </li>
          <li>Click "Authenticate" to verify your enrolled face</li>
          <li>Use "Restart Session" to test with different users</li>
        </ol>
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> This demo uses a placeholder FaceIO App ID.
            For production use:
            <br />
            1. Create an account at{" "}
            <a
              href="https://console.faceio.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              console.faceio.net
            </a>
            <br />
            2. Create a new application and get your App ID
            <br />
            3. Update NEXT_PUBLIC_FACEIO_APP_ID in .env.local
          </p>
        </div>
      </div>
    </div>
  );
};
