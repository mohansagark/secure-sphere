# SecureSphere - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

SecureSphere is a personal security management application built with Next.js 14, TypeScript, and Firebase. The app provides secure tools for managing sensitive information with face recognition authentication.

## Technology Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Authentication**: Firebase Auth + Face Recognition (face-api.js)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (for face recognition templates)
- **PWA**: Next.js PWA capabilities
- **Encryption**: CryptoJS for client-side data encryption
- **UI Components**: Custom components with Tailwind CSS
- **State Management**: React Context + localStorage for offline capability

## Key Features

1. **Multi-Modal Authentication**:

   - Email/password registration and login
   - Google OAuth integration
   - Face recognition for initial setup and subsequent logins
   - Multi-factor authentication combining methods

2. **Security Tools**:

   - Credit card details manager (encrypted)
   - Professional information tracker
   - Password manager integration
   - Security audit logs

3. **Security Features**:
   - Client-side data encryption before storage
   - Face recognition templates stored securely
   - Offline capability with encrypted local storage
   - Progressive Web App (PWA) features

## Development Guidelines

- **Security First**: Always encrypt sensitive data before storage
- **Type Safety**: Use TypeScript strictly, avoid `any` types
- **Component Structure**: Create reusable components in `/src/components`
- **API Routes**: Use Next.js API routes in `/src/app/api` for server-side logic
- **Error Handling**: Implement comprehensive error boundaries and validation
- **Accessibility**: Ensure WCAG 2.1 compliance for all UI components
- **Performance**: Optimize for Core Web Vitals and mobile performance

## File Structure Conventions

- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and configurations
- `/src/hooks` - Custom React hooks
- `/src/types` - TypeScript type definitions
- `/src/contexts` - React context providers
- `/src/utils` - Helper functions and constants

## Security Best Practices

- Never store sensitive data in plain text
- Use environment variables for all API keys and secrets
- Implement proper input validation and sanitization
- Use HTTPS only in production
- Follow OWASP security guidelines
- Implement rate limiting for authentication attempts

## Testing Strategy

- Unit tests for utility functions
- Component testing with React Testing Library
- Integration tests for authentication flows
- E2E tests for critical user journeys
- Security testing for encryption/decryption flows

## Deployment

- Target platform: Vercel (free tier)
- Environment: Production-ready configuration
- PWA: Service worker for offline functionality
- Performance: Optimized for mobile and desktop
