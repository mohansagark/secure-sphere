"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  CreditCard,
  User,
  Settings,
  LogOut,
  Camera,
  Plus,
  Eye,
  AlertTriangle,
  Lock,
  Activity,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, userProfile, signOut, setupFaceAuth } = useAuth();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showFaceSetup, setShowFaceSetup] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleFaceSetup = async () => {
    setShowFaceSetup(true);
    try {
      const success = await setupFaceAuth();
      if (success) {
        alert("Face authentication has been set up successfully!");
      } else {
        alert("Failed to set up face authentication. Please try again.");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      alert(`Error: ${errorMessage}`);
    } finally {
      setShowFaceSetup(false);
    }
  };

  const tools = [
    {
      id: "credit-cards",
      name: "Credit Cards",
      description: "Securely store and manage your credit card information",
      icon: CreditCard,
      color: "bg-blue-500",
      comingSoon: false,
    },
    {
      id: "professional-info",
      name: "Professional Info",
      description: "Track licenses, certifications, and professional details",
      icon: User,
      color: "bg-green-500",
      comingSoon: false,
    },
    {
      id: "passwords",
      name: "Password Manager",
      description: "Generate and store secure passwords",
      icon: Lock,
      color: "bg-purple-500",
      comingSoon: true,
    },
    {
      id: "documents",
      name: "Secure Documents",
      description: "Store important documents with encryption",
      icon: Shield,
      color: "bg-red-500",
      comingSoon: true,
    },
  ];

  const quickStats = [
    { label: "Stored Cards", value: "0", icon: CreditCard },
    { label: "Security Score", value: "85%", icon: Shield },
    { label: "Last Login", value: "Now", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  SecureSphere
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome back, {user?.displayName || "User"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {!userProfile?.securitySettings.faceRecognitionEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFaceSetup}
                  loading={showFaceSetup}
                  className="hidden sm:flex"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Setup Face Auth
                </Button>
              )}

              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Alert */}
        {!userProfile?.securitySettings.faceRecognitionEnabled && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Enhanced Security Available
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Set up face recognition for additional security when accessing
                  sensitive tools.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFaceSetup}
                  loading={showFaceSetup}
                  className="mt-3 border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-800"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Setup Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <stat.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Security Tools
            </h2>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Request Tool
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className={`
                  bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 cursor-pointer transition-all duration-200
                  ${
                    tool.comingSoon
                      ? "opacity-75 cursor-not-allowed"
                      : "hover:shadow-md hover:scale-105"
                  }
                `}
                onClick={() => !tool.comingSoon && setSelectedTool(tool.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${tool.color} p-3 rounded-lg`}>
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  {tool.comingSoon && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                      Soon
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  {tool.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {tool.description}
                </p>
                {!tool.comingSoon && (
                  <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm">
                    <span>Open Tool</span>
                    <Eye className="h-4 w-4 ml-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-3">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Account login
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Successfully signed in via email
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Just now
              </span>
            </div>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                More activity will appear here as you use the tools
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Modal Placeholder */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {tools.find((t) => t.id === selectedTool)?.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This tool is under development. Face recognition authentication
              will be required to access this feature once it&apos;s ready.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setSelectedTool(null)}>
                Close
              </Button>
              <Button disabled>Coming Soon</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
