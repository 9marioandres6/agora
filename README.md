# MiApp20 - Ionic Angular 20 Project

A modern Ionic Angular 20 application demonstrating advanced Angular patterns, internationalization, theme management, Firebase integration, and real-time connection monitoring using the latest signal features.

## Features

- **Angular 20 Signals**: Latest signal-based reactive programming
- **Firebase Authentication**: Email/password and Google OAuth integration
- **Route Guards**: Protected routes based on authentication status
- **Ionic UI**: Beautiful mobile-first interface components
- **Standalone Components**: Modern Angular architecture (default in Angular 20)
- **Internationalization**: Multi-language support (English/Spanish)
- **Dynamic Theming**: Light/dark mode with system preference detection
- **Connection Monitoring**: Real-time internet connectivity monitoring with automatic offline handling
- **Real-time Data**: Firestore integration for live updates
- **Responsive Design**: Mobile-first design with Ionic components

## Technology Stack
- **Frontend Framework**: Angular 20.0.0
- **Mobile Framework**: Ionic 8.0.0
- **Language**: TypeScript 5.8.0
- **Styling**: SCSS with CSS Custom Properties
- **Internationalization**: @ngx-translate/core 17.0.0
- **Backend**: Firebase 11.10.0 (Auth, Firestore)
- **State Management**: Angular Signals (built-in)
- **Build Tool**: Angular CLI 20.0.0

## Setup

### 1. Install Dependencies

```bash
npm install firebase @angular/fire @ngx-translate/core
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

## Project Architecture

### Core Principles
1. **Modern Angular Patterns**: Full utilization of Angular 20 features
2. **Reactive Architecture**: Signals-based state management
3. **Standalone Components**: Modular, self-contained components (default in Angular 20)
4. **Centralized Services**: Single source of truth for app-wide functionality
5. **Theme-Aware Design**: Dynamic light/dark mode switching
6. **Internationalization**: Multi-language support (English/Spanish)

### File Structure
```
src/
├── app/
│   ├── components/          # Reusable UI components
│   ├── guards/             # Route protection
│   ├── home/               # Main application page
│   ├── login/              # Authentication pages
│   ├── register/
│   ├── my-profile/
│   ├── new-item/
│   ├── scope-selector-modal/
│   ├── no-connection/      # Offline page
│   ├── connection-test/    # Connection testing interface
│   ├── services/           # Business logic and data
│   └── app.module.ts       # Main application module
├── assets/
│   ├── i18n/              # Translation files (JSON)
│   └── icon/              # Application icons
├── environments/           # Configuration files
├── global.scss            # Global styles and theme variables
└── main.ts               # Application entry point
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

### Connection Service (`src/app/services/connection.service.ts`)

Advanced internet connectivity monitoring using Angular 20 signals:

- **Signals**: `isOnline`, `connectionQuality`, `lastCheck`, `isChecking`, `connectionSpeed`
- **Computed Signals**: `isConnectionStable`, `connectionStatusText`
- **Effects**: Automatic offline detection and weak connection notifications
- **Methods**:
  - `testConnectionManually()` - Manual connection testing
  - `getConnectionStatus()` - Get current connection status
  - `simulateConnectionIssue(quality)` - Simulate connection problems for testing
  - `resetConnection()` - Reset to normal connection state

### Translation Service (`src/app/services/translation.service.ts`)

Centralized internationalization management:

- **Hardcoded translations** for English and Spanish
- **Reactive language switching** with BehaviorSubject
- **Local storage persistence**
- **Automatic language detection**

### Theme Service (`src/app/services/theme.service.ts`)

Dynamic theme management (light/dark mode):

- **CSS custom properties** for consistent theming
- **System preference detection** (`prefers-color-scheme`)
- **Local storage persistence**
- **Smooth transitions** between themes

### Route Guards (`src/app/guards/auth.guard.ts`)

- **`authGuard`**: Protects routes requiring authentication
- **`publicGuard`**: Prevents authenticated users from accessing public routes

### Components

#### Core Components
- **Login Component**: Authentication form with email/password and Google options
- **Register Component**: User registration interface
- **Home Component**: Protected page showing user information and provider details
- **My Profile Component**: User profile management
- **New Item Component**: Project creation interface
- **Private Inner Project Component**: Project detail page for creators and editors
  - Project members management (owner + collaborators)
  - Pending collaborators approval (owner only)
  - Project information editing (owner only)
  - Chapter management (owners + collaborators)
  - Media support for chapters (images/videos)
- **Public Inner Project Component**: Project detail page for viewers

#### UI Components
- **Theme Toggle Component**: Toggle between light/dark themes
- **Language Selector Component**: Language switching dropdown
- **Settings Modal Component**: Centralized settings interface
- **Settings Button Component**: Quick access to settings
- **Settings Popover Component**: Alternative settings interface
- **Scope Selector Modal Component**: Project scope selection

#### Connection Components
- **No Connection Component**: Dedicated offline page with troubleshooting tips

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

### Using the Connection Service

```typescript
import { ConnectionService } from './services/connection.service';

export class MyComponent {
  private connectionService = inject(ConnectionService);
  
  // Access connection state using signals
  isOnline = this.connectionService.isOnline;
  connectionQuality = this.connectionService.connectionQuality;
  isConnectionStable = this.connectionService.isConnectionStable;
  
  // React to connection changes
  constructor() {
    effect(() => {
      if (!this.connectionService.isOnline()) {
        this.handleOfflineState();
      }
    });
  }
  
  // Manual connection testing
  async testConnection() {
    await this.connectionService.testConnectionManually();
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

### Project Navigation

```typescript
// Navigate to project based on user role
navigateToProject(project: Project) {
  const currentUser = this.user();
  if (currentUser && (project.creator?.uid === currentUser.uid || 
      (project.collaborators || []).some(c => c.uid === currentUser.uid))) {
    // User is creator or editor - navigate to private page
    this.navCtrl.navigateForward(`/project/${project.id}/private`);
  } else {
    // User is viewer - navigate to public page
    this.navCtrl.navigateForward(`/project/${project.id}/public`);
  }
}
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
- **`DestroyRef`**: Proper cleanup and memory management
- **`readonly`**: Immutable computed properties
- **`takeUntilDestroyed`**: RxJS integration with signals

## Firebase Services

- **Authentication**: User sign in/up/out with multiple providers
- **User Profile**: Display name and photo management
- **Real-time Updates**: Automatic auth state synchronization
- **Provider Data**: Access to authentication provider information

## Connection Monitoring

- **Real-time Detection**: Automatic online/offline status monitoring
- **Quality Assessment**: Connection speed and reliability measurement
- **Smart Routing**: Automatic redirection to offline page when disconnected
- **User Notifications**: Toast alerts for weak or slow connections

- **Testing Tools**: Built-in simulation methods in the connection service

## Styling & Theming

### CSS Custom Properties
The project uses CSS custom properties for dynamic theming:

```scss
:root {
  --app-background: #ffffff;
  --app-text: #000000;
  --app-card-background: #ffffff;
  --app-card-border: #e0e0e0;
  --app-input-background: #f8f9fa;
  --app-input-border: #ced4da;
  --app-divider: #e0e0e0;
  --app-toolbar-background: #ffffff;
  --app-toolbar-text: #000000;
  --app-toolbar-border: #e0e0e0;
}

.dark {
  --app-background: #1a1a1a;
  --app-text: #ffffff;
  --app-card-background: #2d2d2d;
  --app-card-border: #404040;
  --app-input-background: #404040;
  --app-input-border: #555555;
  --app-divider: #404040;
  --app-toolbar-background: #2d2d2d;
  --app-toolbar-text: #ffffff;
  --app-toolbar-border: #404040;
}
```

### Theme Transitions
Smooth transitions between themes:
```scss
body {
  background-color: var(--app-background);
  color: var(--app-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

ion-toolbar,
ion-header,
ion-card,
ion-item {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

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
- Real-time connection status monitoring
- Automatic offline page redirection
- Toast notifications for weak connections


## Development Guidelines

### Code Style
- **No comments**: Code should be self-documenting
- **No console.log statements**: Use proper logging services
- **Simple implementation**: Avoid unnecessary complexity
- **Standalone components**: Use standalone components (default in Angular 20)
- **Signals**: Prefer signals over traditional observables for state
- **Type safety**: Use TypeScript interfaces and types

### IMPORTANT: Feature Development Rules
- **ONLY implement features that are explicitly requested by the user**
- **DO NOT add extra features, UI elements, or functionality unless specifically asked**
- **DO NOT create components, modals, or interfaces that weren't requested**
- **Keep implementations minimal and focused on exactly what was asked for**
- **If you think something might be useful, ask the user first before implementing**

### Centralized Features Integration
- **ALWAYS use centralized translation system** for all user-facing text
  - Use `{{ 'KEY.NAME' | translate }}` syntax for static text
  - Add new translation keys to `TranslationService.loadTranslations()` with both English and Spanish
  - Never hardcode text strings in components
- **ALWAYS support centralized light/dark mode theming**
  - Use CSS custom properties from `ThemeService` for all colors and backgrounds
  - Reference `--app-background`, `--app-text`, `--app-card-background`, etc.
  - Never use hardcoded colors that don't adapt to theme changes
  - Test both light and dark themes for all new components

### Component Structure
- **Separate HTML files** for templates
- **SCSS files** for component-specific styles
- **Standalone components** with explicit imports
- **Reactive state management** with signals

### Service Patterns
- **Single responsibility principle**
- **Reactive state with signals**
- **Computed properties** for derived state
- **Effects for side effects**
- **Local storage for persistence**

### Common Development Tasks

#### Adding New Translations
1. Add keys to `TranslationService.loadTranslations()`
2. Provide both English and Spanish translations
3. Use `{{variable}}` syntax for dynamic content

#### Creating New Components
1. Use standalone components (default in Angular 20)
2. Import required modules explicitly
3. Use signals for reactive state
4. Follow naming convention: `ComponentNameComponent`

#### Adding New Routes
1. Update `app-routing.module.ts`
2. Use lazy loading for feature modules
3. Apply appropriate route guards
4. Consider component-based routing for standalone components

#### Implementing New Services
1. Use `providedIn: 'root'`
2. Implement reactive patterns with signals
3. Use computed properties for derived state
4. Implement proper error handling

## Contributing

When modifying the project:

1. Maintain backward compatibility
2. Add comprehensive error handling
3. Include unit tests for new functionality
4. Update this documentation
5. Test across different network conditions
6. Follow Angular 20 best practices
7. Use signals for state management

## License

This project follows standard open-source licensing terms.
