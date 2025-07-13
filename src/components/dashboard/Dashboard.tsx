"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  CreditCard,
  User,
  Settings,
  LogOut,
  Eye,
  Plus,
  TrendingUp,
  Lock,
  Monitor,
  Database,
  Fingerprint,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { CreditCardManager } from "@/components/tools/CreditCardManager";
import { ProfessionalInfoManager } from "@/components/tools/ProfessionalInfoManager";
import { SecurityLogViewer } from "@/components/tools/SecurityLogViewer";

type DashboardView =
  | "overview"
  | "credit-cards"
  | "professional-info"
  | "security-logs"
  | "settings";

export const Dashboard: React.FC = () => {
  const { user, userProfile, signOut, setupFaceAuth } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [showFaceSetup, setShowFaceSetup] = useState(false);
  const [stats, setStats] = useState({
    creditCards: 0,
    professionalProfiles: 0,
    securityLogs: 0,
    lastLogin: null as Date | null,
  });

  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch stats from all endpoints
      const [creditCardsRes, professionalInfoRes, securityLogsRes] =
        await Promise.all([
          fetch(`/api/credit-cards?userId=${user.uid}`),
          fetch(`/api/professional-info?userId=${user.uid}`),
          fetch(`/api/security-logs?userId=${user.uid}&limit=1`),
        ]);

      const creditCards = creditCardsRes.ok ? await creditCardsRes.json() : [];
      const professionalInfo = professionalInfoRes.ok
        ? await professionalInfoRes.json()
        : [];

      let securityLogs = [];
      if (securityLogsRes.ok) {
        try {
          securityLogs = await securityLogsRes.json();
        } catch (error) {
          console.log("Security logs not available yet (index being created)");
          securityLogs = [];
        }
      }

      setStats({
        creditCards: creditCards.length,
        professionalProfiles: professionalInfo.length,
        securityLogs: securityLogs.length,
        lastLogin:
          securityLogs.length > 0 ? new Date(securityLogs[0].timestamp) : null,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user, fetchDashboardStats]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleFaceSetup = async () => {
    setShowFaceSetup(true);
    try {
      const success = await setupFaceAuth();
      if (success) {
        alert("Biometric authentication has been set up successfully!");
      } else {
        alert("Failed to set up biometric authentication. Please try again.");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      alert(`Error: ${errorMessage}`);
    } finally {
      setShowFaceSetup(false);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case "credit-cards":
        return <CreditCardManager />;
      case "professional-info":
        return <ProfessionalInfoManager />;
      case "security-logs":
        return <SecurityLogViewer />;
      case "settings":
        return (
          <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Settings
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Account Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Display Name
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {user?.displayName || "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h2 className="text-lg font-semibold mb-4">
                  Security Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Biometric Authentication
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Use fingerprint/Touch ID for authentication
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm ${
                          userProfile?.securitySettings?.faceRecognitionEnabled
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {userProfile?.securitySettings?.faceRecognitionEnabled
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                      {!userProfile?.securitySettings
                        ?.faceRecognitionEnabled && (
                        <Button
                          size="sm"
                          onClick={handleFaceSetup}
                          loading={showFaceSetup}
                        >
                          <Fingerprint className="h-4 w-4 mr-2" />
                          Setup
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Data Encryption
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        All sensitive data is encrypted before storage
                      </p>
                    </div>
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Enabled
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <Button onClick={handleSignOut} variant="outline">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="max-w-7xl mx-auto p-6">
            {/* Security Alert */}
            {!userProfile?.securitySettings?.faceRecognitionEnabled && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Enhanced Security Available
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      Set up biometric authentication for additional security
                      when accessing sensitive tools.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFaceSetup}
                      loading={showFaceSetup}
                      className="mt-3 border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-800"
                    >
                      <Fingerprint className="h-4 w-4 mr-2" />
                      Setup Now
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.displayName || user?.email?.split("@")[0]}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Your secure personal information hub
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Credit Cards
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.creditCards}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                    <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Professional Profiles
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.professionalProfiles}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Security Events
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.securityLogs}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Last Login
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stats.lastLogin
                        ? stats.lastLogin.toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setCurrentView("credit-cards")}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Plus className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Credit Cards
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Securely store and manage your credit card information with
                  encryption.
                </p>
              </div>

              <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setCurrentView("professional-info")}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                    <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <Plus className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Professional Info
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Manage your professional contacts, work information, and
                  networking data.
                </p>
              </div>

              <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setCurrentView("security-logs")}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                    <Monitor className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Eye className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Security Logs
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Monitor your account activity and review security events and
                  login history.
                </p>
              </div>
            </div>

            {/* Security Features */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Security Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                    <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      End-to-End Encryption
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your data is encrypted before storage
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Biometric Authentication
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {userProfile?.securitySettings?.faceRecognitionEnabled
                        ? "Enabled"
                        : "Available to setup"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                    <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Secure Storage
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Firebase with security rules
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h2>
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
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  SecureSphere
                </span>
              </div>

              <div className="hidden md:flex space-x-4">
                <button
                  onClick={() => setCurrentView("overview")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === "overview"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setCurrentView("credit-cards")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === "credit-cards"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Credit Cards
                </button>
                <button
                  onClick={() => setCurrentView("professional-info")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === "professional-info"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Professional
                </button>
                <button
                  onClick={() => setCurrentView("security-logs")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === "security-logs"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Security
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView("settings")}
                className={`p-2 rounded-md transition-colors ${
                  currentView === "settings"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Settings className="h-5 w-5" />
              </button>
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{renderContent()}</main>
    </div>
  );
};
