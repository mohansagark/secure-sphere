# Firebase Setup Instructions

## Overview

SecureSphere uses Firebase for authentication and data storage. Follow these steps to set up your Firebase project and configure the app for real authentication.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `secure-sphere-prod` (or your preferred name)
4. Enable Google Analytics (optional)
5. Wait for project creation to complete

## 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Go to the **Sign-in method** tab
4. Enable the following providers:
   - **Email/Password**: Click and toggle "Enable"
   - **Google**: Click, toggle "Enable", and configure:
     - Project support email: Your email
     - Save the configuration

## 3. Create Web App

1. In project overview, click the **Web app** icon (`</>`)
2. Register app:
   - App nickname: `SecureSphere Web`
   - Check "Also set up Firebase Hosting" (optional)
3. Copy the Firebase configuration object

## 4. Configure Environment Variables

1. Open your `.env.local` file in the project root
2. Replace the placeholder values with your actual Firebase config:

```bash
# Replace these with your actual Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Update other settings as needed
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_ENCRYPTION_KEY=your_32_character_encryption_key_here
```

## 5. Set up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location closest to your users
5. The database will be created automatically

## 6. Configure Security Rules

**🚨 CRITICAL STEP**: You MUST update the Firestore security rules in Firebase Console for the app to work.

### Quick Fix for Development (Current Issue)

If you're getting "Missing or insufficient permissions" errors:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Firestore Database** → **Rules**
3. Copy the contents from `firestore.rules` in your project directory
4. Paste into the rules editor and click **Publish**

**Note**: The current `firestore.rules` file is configured for development with more permissive rules to allow API routes to work. For production, you'll need to implement proper server-side authentication.

### Development Rules (Current)

The provided `firestore.rules` file contains development-friendly rules that allow the API routes to function. These rules are more permissive than production rules to facilitate testing.

### Option 1: Use the provided rules file (Recommended for Development)

1. In your project directory, you'll find `firestore.rules`
2. In Firebase Console, go to **Firestore Database** → **Rules**
3. Copy the contents of `firestore.rules` and paste into the rules editor
4. Click **Publish**

### Option 2: Manual setup

1. In Firebase Console, go to **Firestore Database** → **Rules**
2. Replace the default rules with:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Security logs - users can read/write their own logs
    match /securityLogs/{logId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.userId || request.auth.uid == request.resource.data.userId);
    }

    // Biometric credentials - users can read/write their own credentials
    match /biometricCredentials/{credentialId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.userId || request.auth.uid == request.resource.data.userId);
    }

    // Credit cards - users can read/write their own cards
    match /creditCards/{cardId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.userId || request.auth.uid == request.resource.data.userId);
    }

    // Professional info - users can read/write their own info
    match /professionalInfo/{infoId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.userId || request.auth.uid == request.resource.data.userId);
    }
  }
}
```

3. Click **Publish**

### Testing the Rules

After setting up the rules, test them:

1.  Sign in to your app
2.  Try the biometric authentication setup
3.  Check the Firebase Console logs for any rule violations
    allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }

        // Security logs - user's own data only
        match /securityLogs/{document} {
          allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
        }

    }
    }

```

## 7. Test Authentication

1. Start your development server: `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Try the authentication methods:
   - **Google Sign-in**: Should open a real Google login popup
   - **Biometric Authentication**: Should prompt for Touch ID/fingerprint

## 8. Biometric Authentication Setup

The app uses WebAuthn for biometric authentication (Touch ID, fingerprint, Windows Hello). This works out of the box with HTTPS or localhost, no additional setup required.

**🔧 How It Works:**

- **First Use**: When you click "Biometric Sign-In" for the first time, the app will automatically register your biometric credentials
- **Subsequent Uses**: The app will authenticate you using your previously registered biometric data
- **No Manual Setup**: The registration happens seamlessly during your first biometric sign-in attempt

### Device Requirements:

- **macOS**: Touch ID enabled MacBook or external Touch ID
- **iOS/iPadOS**: Face ID or Touch ID
- **Android**: Fingerprint sensor
- **Windows**: Windows Hello (fingerprint, face, or PIN)

### Browser Support:

- Chrome/Edge: Full support
- Safari: Full support
- Firefox: Limited support

## 9. Production Deployment

For production deployment:

1. Update `NEXT_PUBLIC_APP_URL` in `.env.local` to your production URL
2. Configure Firebase Authentication authorized domains:
   - Go to Firebase Console → Authentication → Settings
   - Add your production domain to "Authorized domains"
3. Update Firestore security rules for production
4. Deploy to your hosting platform (Vercel, Netlify, etc.)

## Troubleshooting

### Google Sign-in Issues:

- Check that Google provider is enabled in Firebase Console
- Verify your domain is in authorized domains
- Check browser console for detailed error messages

### Biometric Authentication Issues:

- Ensure you're using HTTPS or localhost
- Check that biometric authentication is set up on your device
- Verify browser supports WebAuthn
- Check browser console for detailed error messages

### Firebase Connection Issues:

- Double-check all environment variables
- Ensure Firebase project is active
- Check browser network tab for failed requests

## Security Notes

- Never commit real Firebase credentials to version control
- Use different Firebase projects for development and production
- Enable App Check for production to prevent abuse
- Regular security audits and monitoring
- Consider implementing additional security measures like rate limiting

## Support

For issues specific to SecureSphere, check the project documentation or create an issue in the repository.

For Firebase-specific issues, refer to the [Firebase Documentation](https://firebase.google.com/docs).
```
