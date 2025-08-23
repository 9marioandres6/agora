# MiApp20 - Ionic Angular 20 Project

A modern Ionic Angular 20 application with Firebase integration, internationalization, dynamic theming, and real-time connection monitoring.

## Core Features
- **Angular 20 Signals**: Reactive state management
- **Firebase**: Authentication (Email/Google OAuth) + Firestore
- **Ionic UI**: Mobile-first components
- **Internationalization**: English/Spanish support
- **Dynamic Theming**: Light/dark mode with CSS custom properties
- **Connection Monitoring**: Real-time connectivity with offline handling

## Tech Stack
- Angular 20.0.0 + Ionic 8.0.0 + TypeScript 5.8.0
- SCSS with CSS Custom Properties
- @ngx-translate/core for i18n
- Firebase 11.10.0 (Auth + Firestore)

## Quick Setup

```bash
npm install firebase @angular/fire @ngx-translate/core
npm start
```

**Firebase Setup**: Enable Auth (Email/Google) + Firestore, update `src/environments/environment.ts`

## Architecture

**Core Principles**: Angular 20 signals, standalone components, centralized services, theme-aware design, i18n

**Key Services**:
- `AuthService`: Firebase authentication with signals
- `ThemeService`: Light/dark mode management
- `TranslationService`: English/Spanish i18n
- `ConnectionService`: Real-time connectivity monitoring
- `ProjectsService`: Project/Chapter management

## Components

**Core Pages**: Login, Register, Home, My Profile, New Item, Private/Public Inner Project
**UI Components**: Theme Toggle, Language Selector, Settings Modal/Button/Popover, Scope Selector
**Features**: Project management, Chapter editing, Media upload (images/videos), Collaboration system

## Usage Examples

**Auth Service**: `inject(AuthService)` → `user()`, `isAuthenticated()`, `signIn()`, `signInWithGoogle()`
**Connection Service**: `inject(ConnectionService)` → `isOnline()`, `connectionQuality()`, `isConnectionStable()`
**Route Guards**: `authGuard` for protected routes, `publicGuard` for public routes
**Project Navigation**: Role-based routing to private (creator/collaborator) or public (viewer) project pages

## Key Features

**Authentication**: Email/password + Google OAuth via Firebase
**Signals**: `signal()`, `computed()`, `effect()`, `inject()` for reactive state
**Firebase**: Auth, Firestore, real-time updates
**Connection**: Real-time monitoring, offline detection, quality assessment

## Styling & Theming

**CSS Custom Properties**: `--app-background`, `--app-text`, `--app-card-background`, etc.
**Theme Support**: Light/dark mode with smooth transitions
**Usage**: Always use CSS custom properties, never hardcoded colors

## Security & UX

**Security**: Route guards, auth-based redirects, Firebase security, OAuth 2.0 compliance
**UX**: Loading states, error handling, responsive design, auto-navigation, connection monitoring


## Development Guidelines

### Core Rules
- **No comments**: Code should be self-documenting
- **No console.log**: Use proper logging services
- **Simple implementation**: Avoid unnecessary complexity
- **Standalone components**: Use standalone components (default in Angular 20)
- **Signals**: Prefer signals over traditional observables for state

### CRITICAL: Feature Development
- **ONLY implement explicitly requested features**
- **DO NOT add extra features, UI elements, or functionality unless specifically asked**
- **Keep implementations minimal and focused on exactly what was asked for**

### Mandatory Integration
- **Translation**: ALWAYS use `{{ 'KEY.NAME' | translate }}` syntax, add keys to `TranslationService.loadTranslations()` with both English and Spanish
- **Theming**: ALWAYS use CSS custom properties (`--app-background`, `--app-text`, etc.), never hardcoded colors
- **Test both light and dark themes** for all new components

### Patterns
- **Components**: Separate HTML/SCSS files, standalone architecture, signals for state
- **Services**: Single responsibility, reactive patterns with signals, `providedIn: 'root'`

## Contributing

**Guidelines**: Maintain backward compatibility, add error handling, follow Angular 20 best practices, use signals for state management

## License

This project follows standard open-source licensing terms.
