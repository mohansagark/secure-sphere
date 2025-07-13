"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AuthContextType, User, UserProfile, SecurityLog } from "@/types";
import { biometricAuthClient } from "@/utils/biometricAuthClient";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize biometric authentication on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      checkBiometricSupport();
    }
  }, []);

  const checkBiometricSupport = useCallback(async () => {
    try {
      const isAvailable = await biometricAuthClient.isBiometricAvailable();
      if (isAvailable) {
        console.log("Biometric authentication available");
      } else {
        console.log("Biometric authentication not available on this device");
      }
    } catch (error) {
      console.error("Biometric initialization failed:", error);
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUser(firebaseUser as User);
          setUserProfile(profile);

          // Update last login time
          await updateDoc(doc(db, "users", firebaseUser.uid), {
            lastLoginAt: new Date(),
          });
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUser(firebaseUser as User);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          profileCompleted: data.profileCompleted || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
          authMethods: data.authMethods || [],
          securitySettings: data.securitySettings || {
            twoFactorEnabled: false,
            faceRecognitionEnabled: false,
            sessionTimeout: 30,
            autoLogout: true,
            encryptionEnabled: true,
          },
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const createUserProfile = async (user: FirebaseUser): Promise<void> => {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || "",
      photoURL: user.photoURL || undefined,
      profileCompleted: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      authMethods: [
        {
          type: user.email ? "email" : "google",
          enabled: true,
          setupAt: new Date(),
        },
      ],
      securitySettings: {
        twoFactorEnabled: false,
        faceRecognitionEnabled: false,
        sessionTimeout: 30,
        autoLogout: true,
        encryptionEnabled: true,
      },
    };

    await setDoc(doc(db, "users", user.uid), profile);
    setUserProfile(profile);
  };

  const logSecurityEvent = async (
    action: string,
    method: string,
    success: boolean,
    details?: string
  ): Promise<void> => {
    try {
      const logData = {
        userId: user?.uid || "anonymous",
        action,
        method,
        success,
        ipAddress: "unknown",
        userAgent: navigator?.userAgent || "unknown",
        timestamp: new Date(),
        details,
      };

      // Filter out undefined values before storing in Firebase
      const filteredLogData = Object.fromEntries(
        Object.entries(logData).filter(([_, value]) => value !== undefined)
      );

      await addDoc(collection(db, "securityLogs"), filteredLogData);
    } catch (error) {
      console.error("Error logging security event:", error);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await logSecurityEvent("login", "email", true);

      let profile = await getUserProfile(result.user.uid);
      if (!profile) {
        await createUserProfile(result.user);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign in failed";
      await logSecurityEvent("login", "email", false, errorMessage);
      throw new Error(`Sign in failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<void> => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(result.user, { displayName });
      await createUserProfile(result.user);
      await logSecurityEvent("signup", "email", true);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign up failed";
      await logSecurityEvent("signup", "email", false, errorMessage);
      throw new Error(`Sign up failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      let profile = await getUserProfile(result.user.uid);
      if (!profile) {
        await createUserProfile(result.user);
      }

      await logSecurityEvent("login", "google", true);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Google sign in failed";
      await logSecurityEvent("login", "google", false, errorMessage);
      throw new Error(`Google sign-in failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const setupFaceAuth = async (): Promise<boolean> => {
    if (!user) throw new Error("User not authenticated");

    try {
      setLoading(true);

      // Ensure user profile exists in Firestore before updating
      let profile = await getUserProfile(user.uid);
      if (!profile) {
        console.log("User profile not found, creating one...");
        await createUserProfile(user);
        profile = await getUserProfile(user.uid);
      }

      const result = await biometricAuthClient.registerBiometric(
        user.uid,
        user.email!,
        user.displayName || "User"
      );

      if (!result.success) {
        throw new Error(
          result.error || "Failed to register biometric credential"
        );
      }

      console.log("Biometric authentication registered for user:", user.email);

      // Update user profile in Firestore (now we know it exists)
      await updateDoc(doc(db, "users", user.uid), {
        "securitySettings.faceRecognitionEnabled": true,
        biometricCredentialId: result.credentialId,
      });

      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          securitySettings: {
            ...userProfile.securitySettings,
            faceRecognitionEnabled: true,
          },
        });
      }

      await logSecurityEvent(
        "face_auth",
        "face",
        true,
        "Biometric authentication setup completed"
      );
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      await logSecurityEvent("face_auth", "face", false, errorMessage);
      console.error("Biometric auth setup error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signInWithFace = async (): Promise<boolean> => {
    try {
      setLoading(true);

      console.log("Starting biometric authentication...");

      const isAvailable = await biometricAuthClient.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error(
          "Biometric authentication is not available on this device"
        );
      }

      const result = await biometricAuthClient.authenticateUser();

      if (!result.success) {
        throw new Error(result.error || "Biometric authentication failed");
      }

      if (!result.userId) {
        throw new Error("No user ID returned from biometric authentication");
      }

      console.log(
        "Biometric authentication successful for user:",
        result.userId
      );

      // Fetch user data via API endpoint (avoids Firestore permission issues)
      const userResponse = await fetch("/api/biometric-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: result.userId,
        }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || "Failed to fetch user data");
      }

      const { user: userData } = await userResponse.json();

      // Create user object (simplified for biometric auth)
      const authenticatedUser: User = {
        uid: result.userId,
        email: userData.email,
        displayName: userData.displayName,
        emailVerified: true,
        isAnonymous: false,
        phoneNumber: null,
        photoURL: userData.photoURL || null,
        providerId: "biometric",
        metadata: {
          creationTime:
            userData.createdAt?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [],
        refreshToken: "biometric-refresh-token",
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => "biometric-id-token",
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
      };

      // Create user profile
      const authenticatedProfile: UserProfile = {
        uid: result.userId,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        profileCompleted: userData.profileCompleted || false,
        createdAt: userData.createdAt
          ? new Date(userData.createdAt.seconds * 1000)
          : new Date(),
        lastLoginAt: new Date(),
        authMethods: userData.authMethods || [],
        securitySettings: userData.securitySettings,
      };

      setUser(authenticatedUser);
      setUserProfile(authenticatedProfile);

      await logSecurityEvent(
        "login",
        "face",
        true,
        "Biometric authentication successful"
      );

      console.log("Biometric sign-in completed successfully");
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      console.error("Biometric authentication error:", error);

      await logSecurityEvent("login", "face", false, errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await logSecurityEvent("logout", "manual", true);
      await firebaseSignOut(auth);

      // Clear local state immediately to ensure UI updates
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    } catch (error: unknown) {
      console.error("Sign out error:", error);
      await logSecurityEvent(
        "logout",
        "manual",
        false,
        error instanceof Error ? error.message : "Unknown error"
      );

      // Still clear state even if there was an error
      setUser(null);
      setUserProfile(null);
      setLoading(false);

      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await updateDoc(doc(db, "users", user.uid), data);

      if (userProfile) {
        setUserProfile({ ...userProfile, ...data });
      }
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFace,
    setupFaceAuth,
    signOut,
    updateProfile: updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
