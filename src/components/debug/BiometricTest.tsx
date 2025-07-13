"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

export const BiometricTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold">BiometricTest Component</h1>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-yellow-200">
              This component is temporarily disabled for maintenance. The
              biometric authentication system has been updated to use
              server-side credential storage. Please use the main authentication
              interface or AuthTestPageSimple for biometric testing.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-300">Available alternatives:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Main Dashboard: Biometric registration and authentication</li>
              <li>AuthTestPageSimple: Simplified biometric testing</li>
              <li>AuthenticationPage: Full authentication interface</li>
            </ul>
          </div>

          <div className="mt-6">
            <Button
              onClick={() => (window.location.href = "/auth-test")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to AuthTestPageSimple
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricTest;
