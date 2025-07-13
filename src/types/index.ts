import { User as FirebaseUser } from "firebase/auth";

export interface User extends FirebaseUser {
  faceTemplateId?: string;
  isFirstTimeLogin?: boolean;
  profileCompleted?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  profileCompleted: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  authMethods: AuthMethod[];
  securitySettings: SecuritySettings;
}

export interface AuthMethod {
  type: "email" | "google" | "face";
  enabled: boolean;
  setupAt: Date;
  lastUsedAt?: Date;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  faceRecognitionEnabled: boolean;
  sessionTimeout: number; // in minutes
  autoLogout: boolean;
  encryptionEnabled: boolean;
}

export interface CreditCard {
  id: string;
  cardNumber: string; // encrypted
  cardholderName: string; // encrypted
  expiryMonth: string; // encrypted
  expiryYear: string; // encrypted
  cvv: string; // encrypted
  bankName: string;
  cardType: "visa" | "mastercard" | "amex" | "discover" | "other";
  nickname: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfessionalInfo {
  id: string;
  fullName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone?: string;
  linkedIn?: string;
  address?: string;
  skills: string[];
  notes?: string;
  category: "work" | "personal" | "emergency" | "reference";
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityLog {
  id: string;
  userId: string;
  action:
    | "login"
    | "logout"
    | "face_auth"
    | "data_access"
    | "data_create"
    | "data_update"
    | "data_delete";
  method: "email" | "google" | "face" | "manual";
  success: boolean;
  ipAddress: string;
  userAgent: string;
  location?: string;
  timestamp: Date;
  details?: string;
}

export interface FaceTemplate {
  id: string;
  userId: string;
  templateData: string; // Base64 encoded face descriptor
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFace: () => Promise<boolean>;
  setupFaceAuth: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export interface EncryptionUtil {
  encrypt: (data: string) => string;
  decrypt: (encryptedData: string) => string;
}

export interface FaceRecognitionUtil {
  initialize: () => Promise<void>;
  captureFace: () => Promise<Float32Array | null>;
  compareFaces: (template1: Float32Array, template2: Float32Array) => number;
  isModelLoaded: () => boolean;
}

export interface BiometricAuthUtil {
  initialize: () => Promise<void>;
  isBiometricAvailable: () => Promise<boolean>;
  registerBiometric: (
    userId: string,
    userName: string,
    userDisplayName: string
  ) => Promise<{
    success: boolean;
    credentialId?: string;
    userId?: string;
    error?: string;
  }>;
  authenticateUser: () => Promise<{
    success: boolean;
    credentialId?: string;
    userId?: string;
    error?: string;
  }>;
  hasRegisteredCredentials: (userId: string) => Promise<boolean>;
  removeAllCredentials: (userId: string) => Promise<void>;
  getDebugInfo: () => Promise<any>;
}
