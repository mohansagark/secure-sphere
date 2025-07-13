"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Shield, Eye, EyeOff, Fingerprint, Mail } from "lucide-react";
import { biometricAuthClient } from "@/utils/biometricAuthClient";

export const AuthenticationPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);
  const [enableBiometricAuth, setEnableBiometricAuth] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, signInWithGoogle, signInWithFace, setupFaceAuth } =
    useAuth();

  // Check biometric availability on component mount
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      // Set device info with basic browser information
      setDeviceInfo({
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        webAuthnSupported: !!window.PublicKeyCredential,
      });

      const available = await biometricAuthClient.isBiometricAvailable();
      setBiometricAvailable(available);
    } catch (error) {
      console.error("Error checking biometric support:", error);
      setBiometricAvailable(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        // Sign up the user first
        await signUp(formData.email, formData.password, formData.displayName);

        // If biometric authentication is enabled and available, set it up automatically
        if (enableBiometricAuth && biometricAvailable) {
          try {
            console.log("Setting up biometric authentication after signup...");
            const biometricSetupSuccess = await setupFaceAuth();
            if (biometricSetupSuccess) {
              console.log(
                "Biometric authentication setup completed successfully"
              );
            } else {
              console.log(
                "Biometric authentication setup failed, but signup was successful"
              );
              setErrors({
                general:
                  "Account created successfully! Biometric authentication setup failed, but you can set it up later from your dashboard.",
              });
            }
          } catch (biometricError) {
            console.log(
              "Biometric authentication setup error:",
              biometricError
            );
            // Don't fail the entire signup process if biometric setup fails
            setErrors({
              general:
                "Account created successfully! Biometric authentication setup encountered an issue, but you can set it up later from your dashboard.",
            });
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const success = await signInWithFace();
      if (!success) {
        setErrors({
          general: "Biometric authentication failed. Please try again.",
        });
      }
    } catch (error: unknown) {
      let errorMessage = "An error occurred";
      if (error instanceof Error) {
        if (error.message === "Biometric authentication not set up") {
          errorMessage =
            "Biometric authentication is not set up for your account. Please sign in with email and password first, then set up biometric authentication from your dashboard.";
        } else {
          errorMessage = error.message;
        }
      }
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isLogin
              ? "Sign in to your SecureSphere account"
              : "Join SecureSphere and secure your digital life"}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.general}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Full Name"
                name="displayName"
                type="text"
                required
                value={formData.displayName}
                onChange={handleInputChange}
                error={errors.displayName}
                placeholder="Enter your full name"
              />
            )}

            <Input
              label="Email Address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="Enter your email"
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Biometric Authentication Setup Option for Signup */}
            {!isLogin && biometricAvailable && (
              <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="enableBiometricAuth"
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={enableBiometricAuth}
                    onChange={(e) => setEnableBiometricAuth(e.target.checked)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="enableBiometricAuth"
                      className="text-sm font-medium text-blue-800 dark:text-blue-200 cursor-pointer"
                    >
                      Enable Biometric Authentication
                    </label>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      Set up{" "}
                      {deviceInfo?.hasTouchID
                        ? "Touch ID"
                        : deviceInfo?.hasFingerprint
                        ? "fingerprint"
                        : "biometric"}{" "}
                      authentication for quick and secure login after account
                      creation
                    </p>
                  </div>
                  <Fingerprint className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Auth */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Mail className="h-4 w-4 mr-2" />
              Google
            </Button>

            {isLogin && biometricAvailable && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowBiometricAuth(!showBiometricAuth)}
                disabled={isLoading}
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                {deviceInfo?.hasTouchID
                  ? "Touch ID"
                  : deviceInfo?.hasFingerprint
                  ? "Fingerprint"
                  : "Biometric"}{" "}
                Authentication
              </Button>
            )}
          </div>

          {/* Biometric Authentication */}
          {showBiometricAuth && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-center space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4">
                  <Fingerprint className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {deviceInfo?.hasTouchID
                      ? "Place your finger on the Touch ID sensor"
                      : deviceInfo?.hasFingerprint
                      ? "Place your finger on the fingerprint sensor"
                      : "Use your device's biometric authentication"}
                  </p>
                </div>
                <Button
                  onClick={handleBiometricAuth}
                  loading={isLoading}
                  disabled={isLoading}
                  className="w-full"
                >
                  Start{" "}
                  {deviceInfo?.hasTouchID
                    ? "Touch ID"
                    : deviceInfo?.hasFingerprint
                    ? "Fingerprint"
                    : "Biometric"}{" "}
                  Authentication
                </Button>
              </div>
            </div>
          )}

          {/* Toggle Auth Mode */}
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setShowBiometricAuth(false);
                setEnableBiometricAuth(true); // Reset to default enabled state
              }}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="text-center space-y-4">
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex flex-col items-center">
              <Shield className="h-6 w-6 mb-1" />
              <span>Secure</span>
            </div>
            <div className="flex flex-col items-center">
              <Fingerprint className="h-6 w-6 mb-1" />
              <span>Biometric</span>
            </div>
            <div className="flex flex-col items-center">
              <Eye className="h-6 w-6 mb-1" />
              <span>Private</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
