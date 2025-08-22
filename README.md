# Ionic Angular 20 Firebase Authentication

This project demonstrates Firebase authentication integration with Ionic Angular 20 using the latest signal features.

## Features

- **Angular 20 Signals**: Uses the latest signal-based reactive programming
- **Firebase Authentication**: Email/password and Google authentication
- **Route Guards**: Protected routes based on authentication status
- **Ionic UI**: Beautiful mobile-first interface components
- **Standalone Components**: Modern Angular architecture

## Setup

### 1. Install Dependencies

```bash
npm install firebase @angular/fire
```

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication with Email/Password and Google providers
4. Get your Firebase config from Project Settings
5. Update `src/environments/environment.ts` with your Firebase config:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
  }
};
```

### 3. Google Authentication Setup

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable Google provider
3. Add your authorized domain (localhost for development)
4. Configure OAuth consent screen if needed

### 4. Run the Application

```bash
npm start
```

## Architecture

### Auth Service (`src/app/services/auth.service.ts`)

The core authentication service using Angular 20 signals:

- **Signals**: `user`, `loading`, `error`, `isAuthenticated`
- **Effects**: Automatic navigation based on auth state
- **Methods**: 
  - `signIn()` - Email/password sign in
  - `signUp()` - Email/password sign up
  - `signInWithGoogle()` - Google popup authentication
  - `signInWithGoogleRedirect()` - Google redirect authentication
  - `signOut()` - Sign out
  - `clearError()` - Clear error messages

### Route Guards (`src/app/guards/auth.guard.ts`)

- **`authGuard`**: Protects routes requiring authentication
- **`publicGuard`**: Prevents authenticated users from accessing public routes

### Components

- **Login Component**: Authentication form with email/password and Google options
- **Home Component**: Protected page showing user information and provider details

## Usage

### Using the Auth Service

```typescript
import { AuthService } from './services/auth.service';

export class MyComponent {
  private authService = inject(AuthService);
  
  // Access auth state
  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  
  // Email/Password authentication
  async login() {
    await this.authService.signIn('email@example.com', 'password');
  }
  
  // Google authentication
  async googleLogin() {
    await this.authService.signInWithGoogle();
  }
}
```

### Route Protection

```typescript
const routes: Routes = [
  {
    path: 'protected',
    component: ProtectedComponent,
    canActivate: [authGuard]
  },
  {
    path: 'public',
    component: PublicComponent,
    canActivate: [publicGuard]
  }
];
```

## Authentication Methods

### Email/Password
- Traditional email and password authentication
- User registration with display name
- Password-based sign in

### Google Authentication
- **Popup Method**: `signInWithGoogle()` - Opens Google sign-in popup
- **Redirect Method**: `signInWithGoogleRedirect()` - Redirects to Google and back
- Automatic profile information retrieval
- Profile picture display

## Signal Features Used

- **`signal()`**: Reactive state management
- **`computed()`**: Derived state calculations
- **`effect()`**: Side effects based on signal changes
- **`inject()`**: Modern dependency injection

## Firebase Services

- **Authentication**: User sign in/up/out with multiple providers
- **User Profile**: Display name and photo management
- **Real-time Updates**: Automatic auth state synchronization
- **Provider Data**: Access to authentication provider information

## Security

- Route protection with guards
- Automatic redirects based on auth state
- Error handling and user feedback
- Secure Firebase configuration
- OAuth 2.0 compliance for Google authentication

## User Experience

- Loading states during authentication
- Error handling with clear messages
- Provider-specific information display
- Responsive design for mobile and desktop
- Automatic navigation after successful authentication
