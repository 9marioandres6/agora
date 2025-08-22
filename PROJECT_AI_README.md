# MiApp20 - Ionic Angular 20 Project Documentation for AI

## Project Overview
**MiApp20** is a modern Ionic Angular 20 application that demonstrates advanced Angular patterns, internationalization, theme management, and Firebase integration. This document provides comprehensive information for AI systems to understand and work with the codebase.

## Technology Stack
- **Frontend Framework**: Angular 20.0.0
- **Mobile Framework**: Ionic 8.0.0
- **Language**: TypeScript 5.8.0
- **Styling**: SCSS with CSS Custom Properties
- **Internationalization**: @ngx-translate/core 17.0.0
- **Backend**: Firebase 11.10.0 (Auth, Firestore)
- **State Management**: Angular Signals (built-in)
- **Build Tool**: Angular CLI 20.0.0

## Project Architecture

### Core Principles
1. **Modern Angular Patterns**: Full utilization of Angular 20 features
2. **Reactive Architecture**: Signals-based state management
3. **Standalone Components**: Modular, self-contained components
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
│   ├── services/           # Business logic and data
│   └── app.module.ts       # Main application module
├── assets/
│   ├── i18n/              # Translation files (JSON)
│   └── icon/              # Application icons
├── environments/           # Configuration files
├── global.scss            # Global styles and theme variables
└── main.ts               # Application entry point
```

## Key Services Architecture

### 1. TranslationService (`src/app/services/translation.service.ts`)
**Purpose**: Centralized internationalization management
**Key Features**:
- Hardcoded translations for English and Spanish
- Reactive language switching with BehaviorSubject
- Local storage persistence
- Automatic language detection
- Comprehensive translation keys covering all app sections

**Core Methods**:
- `setLanguage(lang: string)`: Switch application language
- `getCurrentLang()`: Get current language
- `getAvailableLanguages()`: Return supported languages
- `initializeLanguage()`: Load saved language preference

**Translation Structure**:
```typescript
{
  "COMMON": { "LOGIN": "Login", "REGISTER": "Register", ... },
  "AUTH": { "LOGIN_TITLE": "Welcome Back", ... },
  "HOME": { "WELCOME": "Welcome to MiApp20", ... },
  "SETTINGS": { "THEME": "Theme", "LANGUAGE": "Language", ... },
  "PROFILE": { "EDIT_PROFILE": "Edit Profile", ... },
  "NEW_ITEM": { "CREATE_NEW": "Create New", ... },
  "VALIDATION": { "REQUIRED": "This field is required", ... },
  "FORMS": { "DISPLAY_NAME": "Display Name", ... }
}
```

### 2. ThemeService (`src/app/services/theme.service.ts`)
**Purpose**: Dynamic theme management (light/dark mode)
**Key Features**:
- CSS custom properties for consistent theming
- System preference detection (`prefers-color-scheme`)
- Local storage persistence
- Smooth transitions between themes
- CSS class management for light/dark modes

**Core Methods**:
- `setTheme(theme: 'light' | 'dark')`: Apply specific theme
- `toggleTheme()`: Switch between light and dark
- `loadTheme()`: Initialize theme from storage/preferences
- `isDarkMode()`: Check current theme state

**Theme Variables**:
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

### 3. AuthService (`src/app/services/auth.service.ts`)
**Purpose**: Firebase authentication management
**Key Features**:
- Email/password authentication
- Google OAuth integration
- Reactive user state with signals
- Automatic navigation based on auth state
- Error handling and loading states

**Core Methods**:
- `signInWithEmail(email: string, password: string)`
- `signInWithGoogle()`: Google OAuth
- `createUserWithEmail(email: string, password: string)`
- `signOut()`: User logout
- `updateProfile(displayName: string, photoURL?: string)`

**State Management**:
```typescript
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

user = computed(() => this.authState().user);
loading = computed(() => this.authState().loading);
error = computed(() => this.authState().error);
isAuthenticated = computed(() => !!this.authState().user);
```

### 4. ProjectsService (`src/app/services/projects.service.ts`)
**Purpose**: Firestore data management for projects
**Key Features**:
- CRUD operations for projects
- Real-time data synchronization
- Scope-based project categorization
- User association and permissions

## Component Architecture

### Standalone Components
Components marked as `standalone: true` can be imported directly without module declarations:

1. **ThemeToggleComponent** (`src/app/components/theme-toggle/`)
   - Toggle between light/dark themes
   - Reactive theme state display
   - Standalone with IonicModule, CommonModule, TranslateModule

2. **LanguageSelectorComponent** (`src/app/components/language-selector/`)
   - Language switching dropdown
   - Theme-aware styling
   - Integration with TranslationService

3. **SettingsModalComponent** (`src/app/components/settings-modal/`)
   - Centralized settings interface
   - Theme toggle and language selection
   - User profile management

4. **SettingsButtonComponent** (`src/app/components/settings-button/`)
   - Quick access to settings
   - Floating action button design

5. **SettingsPopoverComponent** (`src/app/components/settings-popover/`)
   - Alternative settings interface
   - Popover-based interaction

### Page Components
1. **HomePage** (`src/app/home/`)
   - Main application dashboard
   - Project listing and management
   - User authentication status
   - Settings modal integration

2. **LoginComponent** (`src/app/login/`)
   - User authentication interface
   - Email/password and Google sign-in
   - Form validation and error handling

3. **RegisterComponent** (`src/app/register/`)
   - User registration interface
   - Account creation workflow
   - Password confirmation validation

4. **MyProfileComponent** (`src/app/my-profile/`)
   - User profile management
   - Display name and photo editing
   - Authentication requirement handling

5. **NewItemComponent** (`src/app/new-item/`)
   - Project creation interface
   - Scope selection modal
   - Form validation and submission

6. **ScopeSelectorModalComponent** (`src/app/scope-selector-modal/`)
   - Project scope selection
   - Categorized scope options
   - Modal-based interaction

## Routing & Navigation

### Route Configuration (`src/app/app-routing.module.ts`)
```typescript
const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    canActivate: [authGuard]
  },
  {
    path: 'my-profile',
    loadComponent: () => import('./my-profile/my-profile.component').then(c => c.MyProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'new-item',
    loadComponent: () => import('./new-item/new-item.component').then(c => c.NewItemComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(c => c.RegisterComponent),
    canActivate: [publicGuard]
  }
];
```

### Route Guards
- **authGuard**: Protects authenticated routes
- **publicGuard**: Protects public routes from authenticated users

## State Management Patterns

### Angular Signals Usage
The project extensively uses Angular 20's signals for reactive state management:

```typescript
// Signal declaration
private themeSignal = signal<Theme>('light');

// Computed properties
public isDark = computed(() => this.themeSignal() === 'dark');

// Read-only signals
public theme = this.themeSignal.asReadonly();

// Effects for side effects
effect(() => {
  const currentTheme = this.themeSignal();
  // Handle theme changes
});
```

### Service State Patterns
Services maintain internal state using signals and expose computed values:

```typescript
// Internal state
private authState = signal<AuthState>({
  user: null,
  loading: true,
  error: null
});

// Exposed computed values
user = computed(() => this.authState().user);
isAuthenticated = computed(() => !!this.authState().user);
```

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

## Firebase Integration

### Configuration (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
  }
};
```

### Angular Fire Setup (`src/app/app.module.ts`)
```typescript
providers: [
  { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  provideFirebaseApp(() => initializeApp(environment.firebase)),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore())
]
```

## Development Guidelines

### Code Style
- **No comments**: Code should be self-documenting
- **Simple implementation**: Avoid unnecessary complexity
- **Standalone components**: Use standalone components when possible
- **Signals**: Prefer signals over traditional observables for state
- **Type safety**: Use TypeScript interfaces and types

### Component Structure
- Separate HTML files for templates
- SCSS files for component-specific styles
- Standalone components with explicit imports
- Reactive state management with signals

### Service Patterns
- Single responsibility principle
- Reactive state with signals
- Computed properties for derived state
- Effects for side effects
- Local storage for persistence

## Key Features Summary

1. **Multi-language Support**: English and Spanish with centralized translation management
2. **Dynamic Theming**: Light/dark mode with system preference detection
3. **Firebase Authentication**: Email/password and Google OAuth
4. **Reactive Architecture**: Angular signals for state management
5. **Standalone Components**: Modular, self-contained component architecture
6. **Route Protection**: Authentication-based route guards
7. **Responsive Design**: Ionic-based mobile-first design
8. **Real-time Data**: Firestore integration for live updates
9. **Theme Persistence**: User preference storage
10. **Modern Angular**: Full utilization of Angular 20 features

## Common Development Tasks

### Adding New Translations
1. Add keys to `TranslationService.loadTranslations()`
2. Provide both English and Spanish translations
3. Use `{{variable}}` syntax for dynamic content

### Creating New Components
1. Use `standalone: true` when possible
2. Import required modules explicitly
3. Use signals for reactive state
4. Follow naming convention: `ComponentNameComponent`

### Adding New Routes
1. Update `app-routing.module.ts`
2. Use lazy loading for feature modules
3. Apply appropriate route guards
4. Consider component-based routing for standalone components

### Implementing New Services
1. Use `providedIn: 'root'`
2. Implement reactive patterns with signals
3. Use computed properties for derived state
4. Implement proper error handling

This documentation provides comprehensive information for AI systems to understand, analyze, and work with the MiApp20 codebase effectively.
