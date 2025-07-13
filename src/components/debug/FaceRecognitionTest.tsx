"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { faceRecognitionUtil } from "@/utils/faceRecognition";
import { Camera, Check, X, AlertCircle, Eye } from "lucide-react";
import * as faceapi from "face-api.js";

export const FaceRecognitionTest: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [status, setStatus] = useState<string>("Ready to test");
  const [error, setError] = useState<string>("");
  const [faceTemplate, setFaceTemplate] = useState<Float32Array | null>(null);
  const [modelTestResult, setModelTestResult] = useState<any>(null);
  const [showVisualTest, setShowVisualTest] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const initializeFaceAPI = async () => {
    setIsInitializing(true);
    setError("");
    setStatus("Initializing face recognition models...");

    try {
      await faceRecognitionUtil.initialize();

      // Test models after initialization
      const testResult = await faceRecognitionUtil.testModels();
      setModelTestResult(testResult);

      if (testResult.success) {
        setIsInitialized(true);
        setStatus("Face recognition initialized successfully! ✅");
      } else {
        setError(`Model test failed: ${testResult.error}`);
        setStatus("Initialization failed ❌");
      }
    } catch (err) {
      setError(
        `Initialization failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Initialization failed ❌");
    } finally {
      setIsInitializing(false);
    }
  };

  const startCamera = async () => {
    setError("");
    setStatus("Testing camera access...");

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access not supported in this browser");
      }

      console.log("Requesting camera permissions...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      });

      setStream(mediaStream);
      console.log("Camera access granted");

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Add event listeners for better debugging
        videoRef.current.onloadeddata = () => {
          console.log("Video data loaded successfully");
          setStatus("Camera started! Video is playing. ✅");
        };

        videoRef.current.onerror = (e) => {
          console.error("Video element error:", e);
          setError("Video playback failed");
        };

        videoRef.current.onloadstart = () => {
          console.log("Video loading started...");
        };

        try {
          await videoRef.current.play();
          console.log("Video play() called successfully");
        } catch (playError) {
          console.error("Video play error:", playError);
          setError(
            `Video play failed: ${
              playError instanceof Error ? playError.message : "Unknown error"
            }`
          );
        }
      }
    } catch (err) {
      console.error("Camera access error:", err);
      let errorMessage = "Camera access failed";

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage =
            "Camera permission denied. Please allow camera access and refresh the page.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found. Please connect a camera device.";
        } else if (err.name === "NotSupportedError") {
          errorMessage =
            "Camera not supported. Please use HTTPS or a modern browser.";
        } else {
          errorMessage = `Camera error: ${err.message}`;
        }
      }

      setError(errorMessage);
      setStatus("Camera failed ❌");
    }
  };

  const captureface = async () => {
    setIsCapturing(true);
    setError("");
    setStatus("Capturing face template...");

    try {
      console.log("Starting face capture with enhanced debugging...");

      // Use the face recognition utility's capture method directly
      const template = await faceRecognitionUtil.captureFace();

      if (template) {
        setFaceTemplate(template);
        setStatus(
          `Face captured successfully! Template length: ${template.length} ✅`
        );
      } else {
        setError(
          "No face detected. Please ensure your face is clearly visible and well-lit. Try adjusting lighting or camera angle."
        );
        setStatus("Face capture failed ❌");
      }
    } catch (err) {
      setError(
        `Face capture failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Face capture failed ❌");

      // Log additional debugging info
      console.error("Detailed face capture error:", err);
      console.log("Tips for successful face capture:");
      console.log("1. Ensure good lighting (avoid backlighting)");
      console.log("2. Position face directly in front of camera");
      console.log("3. Remove glasses or masks if possible");
      console.log("4. Try moving closer or further from camera");
    } finally {
      setIsCapturing(false);
    }
  };

  const captureBasicFace = async () => {
    setIsCapturing(true);
    setError("");
    setStatus("Testing simplified face capture...");

    try {
      console.log("Starting simplified face capture test...");

      // Use the new basic capture method
      const template = await faceRecognitionUtil.captureBasicFace();

      if (template) {
        setFaceTemplate(template);
        setStatus(
          `Simplified capture succeeded! Template length: ${template.length} ✅`
        );
        console.log("Simplified capture template:", template.slice(0, 10)); // Log first 10 values
      } else {
        setError("Simplified capture failed - no face detected");
        setStatus("Simplified capture failed ❌");
      }
    } catch (err) {
      setError(
        `Simplified capture error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Simplified capture failed ❌");
      console.error("Simplified capture error:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("Camera stopped");
  };

  const testApiCall = async () => {
    if (!faceTemplate) {
      setError("Please capture a face template first");
      return;
    }

    setStatus("Testing API storage...");
    setError("");

    try {
      const response = await fetch("/api/face-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "test-user-123",
          templateData: Array.from(faceTemplate).join(","),
        }),
      });

      if (response.ok) {
        setStatus("API test successful! Template stored ✅");
      } else {
        const errorData = await response.json();
        setError(`API test failed: ${errorData.error || "Unknown error"}`);
        setStatus("API test failed ❌");
      }
    } catch (err) {
      setError(
        `API test failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("API test failed ❌");
    }
  };

  const startVisualTest = async () => {
    if (!isInitialized) {
      setError("Please initialize face recognition first");
      return;
    }

    setError("");
    setStatus("Starting visual face detection test...");
    setShowVisualTest(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      });

      setStream(mediaStream);

      if (videoRef.current && canvasRef.current) {
        videoRef.current.srcObject = mediaStream;

        videoRef.current.onloadeddata = () => {
          setStatus("Visual test active - watch for face detection boxes");
          startDetectionLoop();
        };

        await videoRef.current.play();
      }
    } catch (err) {
      setError(
        `Visual test failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Visual test failed ❌");
      setShowVisualTest(false);
    }
  };

  const startDetectionLoop = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const detectFaces = async () => {
      if (!video || video.paused || video.ended || !isInitialized) return;

      try {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Detect faces with multiple methods
        const detections = await Promise.all([
          faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 416,
              scoreThreshold: 0.3,
            })
          ),
          faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.2,
            })
          ),
          faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.1,
            })
          ),
        ]);

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw detection results
        const colors = ["red", "orange", "yellow"];
        let hasDetection = false;

        detections.forEach((dets, index) => {
          if (dets.length > 0) {
            hasDetection = true;
            dets.forEach((detection) => {
              const { x, y, width, height } = detection.box;
              ctx.strokeStyle = colors[index];
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, width, height);

              // Add label
              ctx.fillStyle = colors[index];
              ctx.fillText(
                `Method ${index + 1}: ${detection.score.toFixed(2)}`,
                x,
                y - 5
              );
            });
          }
        });

        setDetectionResult({
          timestamp: new Date().toLocaleTimeString(),
          detections: detections.map((dets, index) => ({
            method: index + 1,
            count: dets.length,
            faces: dets.map((d) => ({ score: d.score.toFixed(3), box: d.box })),
          })),
          hasDetection,
        });
      } catch (error) {
        console.error("Detection loop error:", error);
      }

      // Continue loop if visual test is active
      if (showVisualTest) {
        setTimeout(detectFaces, 500); // Run every 500ms
      }
    };

    // Wait for video to be ready
    setTimeout(detectFaces, 1000);
  };

  const stopVisualTest = () => {
    setShowVisualTest(false);
    stopCamera();
    setDetectionResult(null);
    setStatus("Visual test stopped");
  };

  const testFaceDetectionBasics = async () => {
    setStatus("Testing basic face detection...");
    setError("");

    try {
      const result = await faceRecognitionUtil.testFaceDetectionBasics();

      if (result.success) {
        setStatus(`Basic detection test: ${result.details.message} ✅`);
        console.log("Basic detection test details:", result.details);
      } else {
        setError(`Basic detection test failed: ${result.error}`);
        setStatus("Basic detection test failed ❌");
      }
    } catch (err) {
      setError(
        `Basic detection test error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Basic detection test failed ❌");
    }
  };

  const testCameraBasics = async () => {
    setStatus("Testing camera basics...");
    setError("");

    try {
      const result = await faceRecognitionUtil.testCameraBasics();

      if (result.success) {
        setStatus(`Camera test: ${result.details.message} ✅`);
        console.log("Camera test details:", result.details);
      } else {
        setError(`Camera test failed: ${result.error}`);
        setStatus("Camera test failed ❌");
      }
    } catch (err) {
      setError(
        `Camera test error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Camera test failed ❌");
    }
  };

  const testMinimalFaceAPI = async () => {
    setStatus("Testing minimal face-api functionality...");
    setError("");

    try {
      const result = await faceRecognitionUtil.testMinimalFaceAPI();

      if (result.success) {
        setStatus(`Minimal face-api test: ${result.details.message} ✅`);
        console.log("Minimal face-api test details:", result.details);
      } else {
        setError(`Minimal face-api test failed: ${result.error}`);
        setStatus("Minimal face-api test failed ❌");
      }
    } catch (err) {
      setError(
        `Minimal face-api test error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setStatus("Minimal face-api test failed ❌");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Camera className="h-6 w-6 mr-2" />
        Face Recognition Diagnostic
      </h2>

      {/* Status Display */}
      <div className="mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-800 dark:text-blue-200">{status}</span>
          </div>
        </div>

        {error && (
          <div className="mt-2 bg-red-50 dark:bg-red-900/50 rounded-lg p-4">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Test Steps */}
      <div className="space-y-4">
        {/* Step 1: Initialize */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">1. Initialize Face Recognition</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Load face recognition models
            </p>
          </div>
          <Button
            onClick={initializeFaceAPI}
            loading={isInitializing}
            disabled={isInitialized}
            className="flex items-center"
          >
            {isInitialized ? <Check className="h-4 w-4 mr-2" /> : null}
            {isInitialized ? "Initialized" : "Initialize"}
          </Button>
        </div>

        {/* Step 2: Start Camera */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">2. Test Camera Access</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verify camera permissions and preview (optional test)
            </p>
          </div>
          <div className="space-x-2">
            <Button onClick={startCamera} disabled={!!stream} variant="outline">
              Start Camera
            </Button>
            <Button onClick={stopCamera} disabled={!stream} variant="outline">
              Stop Camera
            </Button>
          </div>
        </div>

        {/* Step 2.5: Basic Diagnostics */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">2.5. Basic Diagnostics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Test basic components without camera
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={testMinimalFaceAPI}
              disabled={!isInitialized}
              variant="outline"
              className="flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              Test API
            </Button>
            <Button
              onClick={testFaceDetectionBasics}
              disabled={!isInitialized}
              variant="outline"
              className="flex items-center"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Test Detection
            </Button>
            <Button
              onClick={testCameraBasics}
              disabled={!isInitialized}
              variant="outline"
              className="flex items-center"
            >
              <Camera className="h-4 w-4 mr-2" />
              Test Camera
            </Button>
          </div>
        </div>

        {/* Step 3: Visual Face Detection Test */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">3. Visual Face Detection Test</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              See live detection boxes overlaid on camera feed
            </p>
          </div>
          <div className="space-x-2">
            <Button
              onClick={startVisualTest}
              disabled={!isInitialized || showVisualTest}
              variant="outline"
              className="flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              Start Visual Test
            </Button>
            <Button
              onClick={stopVisualTest}
              disabled={!showVisualTest}
              variant="outline"
            >
              Stop Test
            </Button>
          </div>
        </div>

        {/* Visual Test Display */}
        {showVisualTest && (
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Live Face Detection</h3>
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full max-w-md rounded-lg"
                autoPlay
                muted
                playsInline
                style={{ display: "none" }}
              />
              <canvas
                ref={canvasRef}
                className="w-full max-w-md rounded-lg border"
              />
            </div>
            {detectionResult && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                <div>
                  Status:{" "}
                  {detectionResult.hasDetection
                    ? "✅ Face detected"
                    : "❌ No face detected"}
                </div>
                <div>Last update: {detectionResult.timestamp}</div>
                {detectionResult.detections.map((det: any, i: number) => (
                  <div key={i} className="text-xs">
                    Method {det.method}: {det.count} faces{" "}
                    {det.faces.map((f: any, j: number) => (
                      <span key={j}>(score: {f.score}) </span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video Preview */}
        {stream && !showVisualTest && (
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Camera Preview</h3>
            <video
              ref={videoRef}
              className="w-full max-w-md mx-auto rounded-lg"
              autoPlay
              muted
              playsInline
            />
          </div>
        )}

        {/* Step 4: Capture Face */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">4. Capture Face Template</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Extract face features for recognition (will request camera access)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={captureface}
              loading={isCapturing}
              disabled={!isInitialized}
              className="flex items-center"
            >
              {faceTemplate ? <Check className="h-4 w-4 mr-2" /> : null}
              {faceTemplate ? "Captured" : "Capture Face"}
            </Button>
            <Button
              onClick={captureBasicFace}
              loading={isCapturing}
              disabled={!isInitialized}
              variant="outline"
              className="flex items-center"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Simple Test
            </Button>
          </div>
        </div>

        {/* Step 5: Test API */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">5. Test API Storage</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verify template can be stored
            </p>
          </div>
          <Button
            onClick={testApiCall}
            disabled={!faceTemplate}
            variant="outline"
          >
            Test API
          </Button>
        </div>

        {/* Diagnostic Tests */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Diagnostic Tests</h3>
          <div className="space-y-2">
            <Button
              onClick={testFaceDetectionBasics}
              variant="outline"
              className="w-full"
            >
              Test Face Detection Basics
            </Button>
            <Button
              onClick={testCameraBasics}
              variant="outline"
              className="w-full"
            >
              Test Camera Basics
            </Button>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information</h3>
        <div className="text-sm space-y-1">
          <div>Models Initialized: {isInitialized ? "✅" : "❌"}</div>
          {modelTestResult && (
            <div className="ml-4 text-xs space-y-1">
              <div>
                • TinyFaceDetector:{" "}
                {modelTestResult.details.tinyFaceDetector ? "✅" : "❌"}
              </div>
              <div>
                • FaceLandmark68:{" "}
                {modelTestResult.details.faceLandmark68Net ? "✅" : "❌"}
              </div>
              <div>
                • FaceRecognition:{" "}
                {modelTestResult.details.faceRecognitionNet ? "✅" : "❌"}
              </div>
              <div>
                • FaceExpression:{" "}
                {modelTestResult.details.faceExpressionNet ? "✅" : "❌"}
              </div>
            </div>
          )}
          <div>Camera Access: {stream ? "✅" : "❌"}</div>
          <div>
            Face Template:{" "}
            {faceTemplate ? `✅ (${faceTemplate.length} features)` : "❌"}
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
            HTTPS/Localhost:{" "}
            {typeof window !== "undefined" &&
            (window.location.protocol === "https:" ||
              window.location.hostname === "localhost")
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
          <div className="mt-2 text-xs text-gray-500 break-all">
            User Agent:{" "}
            {typeof window !== "undefined"
              ? navigator.userAgent.slice(0, 100) + "..."
              : "Not available on server"}
          </div>
        </div>
      </div>

      {/* Troubleshooting Tips */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg">
        <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
          Face Detection Troubleshooting
        </h3>
        <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <div>
            • <strong>Lighting:</strong> Ensure your face is well-lit, avoid
            backlighting from windows
          </div>
          <div>
            • <strong>Position:</strong> Look directly at the camera, center
            your face in view
          </div>
          <div>
            • <strong>Distance:</strong> Sit 2-3 feet from camera, not too close
            or far
          </div>
          <div>
            • <strong>Accessories:</strong> Remove glasses, masks, or hats if
            possible
          </div>
          <div>
            • <strong>Movement:</strong> Stay still during capture (1.5 second
            process)
          </div>
          <div>
            • <strong>Camera quality:</strong> Higher resolution cameras work
            better
          </div>
          <div>
            • <strong>Browser:</strong> Chrome and Firefox typically work best
          </div>
        </div>
      </div>
    </div>
  );
};
