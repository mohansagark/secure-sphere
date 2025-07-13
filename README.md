# SecureSphere - Personal Security Manager

A production-ready personal security management application built with Next.js 14, TypeScript, and Firebase. SecureSphere provides secure tools for managing sensitive information with biometric authentication.

## 🚀 Features

### Authentication & Security

- **Multi-Modal Authentication**: Email/password, Google OAuth, and biometric authentication
- **Biometric Authentication**: WebAuthn-based Touch ID, fingerprint, Windows Hello support
- **Client-Side Encryption**: All sensitive data encrypted before storage
- **Security Audit Logs**: Track all access attempts and activities
- **Progressive Web App (PWA)**: Mobile-friendly with offline capabilities

### Security Tools (In Development)

- **Credit Card Manager**: Securely store and manage payment information
- **Professional Info Tracker**: Manage licenses, certifications, and credentials
- **Password Manager**: Generate and store secure passwords (Coming Soon)
- **Document Vault**: Encrypted document storage (Coming Soon)

### Technology Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Authentication**: Firebase Auth + WebAuthn Biometric Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Encryption**: CryptoJS for client-side data encryption
- **UI**: Custom components with Lucide React icons
- **PWA**: Next.js PWA capabilities

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Firebase project (free tier sufficient)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd secure-sphere
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Firebase Setup**

   **🔥 For detailed Firebase setup instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

   Quick setup:

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Enable Firestore Database
   - Update `.env.local` with your Firebase configuration:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_ENCRYPTION_KEY=your_32_character_encryption_key
   ```

4. **Biometric Authentication**

   The app uses WebAuthn for biometric authentication (Touch ID, fingerprint, Windows Hello).
   No additional setup required - works out of the box with HTTPS or localhost.

   - Place model files in `public/models/` directory
   - See `public/models/README.md` for detailed instructions

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 PWA Features

SecureSphere is built as a Progressive Web App with:

- **Offline Capability**: Core functionality works without internet
- **Mobile Installation**: Can be installed on mobile devices
- **Push Notifications**: Security alerts and reminders (Coming Soon)
- **Background Sync**: Data synchronization when connection is restored

## 🔒 Security Features

### Data Protection

- **Client-Side Encryption**: Sensitive data encrypted before Firebase storage
- **Face Recognition Templates**: Biometric data stored securely
- **No Plain Text Storage**: All user data encrypted at rest
- **Environment Variables**: API keys and secrets in environment variables

### Privacy

- **Local Processing**: Face recognition runs entirely on device
- **Minimal Data Collection**: Only essential user information stored
- **User Control**: Complete data export and deletion capabilities
- **No Third-Party Tracking**: Privacy-focused design

## 🚀 Deployment

### Vercel (Recommended - Free Tier)

1. Push code to GitHub repository
2. Connect to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Build project: `npm run build`
4. Deploy: `firebase deploy`

## 🗂️ Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/         # Reusable UI components
│   ├── auth/          # Authentication components
│   ├── dashboard/     # Dashboard components
│   └── ui/            # Base UI components
├── contexts/          # React contexts (Auth, etc.)
├── lib/              # Configuration and utilities
├── types/            # TypeScript type definitions
└── utils/            # Helper functions and utilities
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

This application handles sensitive personal information. Please:

- Use strong, unique encryption keys in production
- Regularly update dependencies for security patches
- Implement proper backup and recovery procedures
- Monitor security logs for suspicious activity
- Follow Firebase security best practices

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join GitHub Discussions for feature requests

---

**SecureSphere** - Securing your digital life, one tool at a time. 🛡️
