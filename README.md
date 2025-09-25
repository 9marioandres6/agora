# MiApp20 - Ionic Angular 20 Project

A modern Ionic Angular 20 application with **Firebase** (authentication + database) and **Supabase** (file storage) integration, internationalization, dynamic theming, and real-time connection monitoring.

## Core Features
- **Angular 20 Signals**: Reactive state management
- **Firebase**: Authentication (Email/Google OAuth) + Firestore database
- **Supabase**: File storage for images and videos
- **Ionic UI**: Mobile-first components
- **Internationalization**: English/Spanish support
- **Dynamic Theming**: Light/dark mode with CSS custom properties
- **Connection Monitoring**: Real-time connectivity with offline handling
- **Reactivity**: Real-time interaction with other users
- **Advanced Filtering**: Server-side Firestore queries with real-time updates

## Tech Stack
- Angular 20.0.0 + Ionic 8.0.0 + TypeScript 5.8.0
- SCSS with CSS Custom Properties
- @ngx-translate/core for i18n
- Firebase 11.10.0 (Auth + Firestore)
- Supabase 2.56.0 (File Storage)

## Quick Setup

```bash
npm install firebase @angular/fire @ngx-translate/core @supabase/supabase-js
npm start
```

## Firebase Setup

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login and Initialize
```bash
firebase login
firebase init
```

**Select these options:**
- Choose "Firestore" when prompted for features
- Select your existing Firebase project
- Accept the default `firestore.rules` file location
- Accept the default `firestore.indexes.json` file location

### 3. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Update Environment
Update `src/environments/environment.ts` with your Firebase config.

## Supabase Setup

This project uses **Supabase for file storage** (images and videos). See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for complete setup instructions.

**Quick Overview:**
- Create storage bucket: `agora-project`
- Set public access policies
- Configure file size limits (10MB max)
- Support for images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, OGG)

## Architecture

**Core Principles**: Angular 20 signals, standalone components, centralized services, theme-aware design, i18n

**Key Services**:
- `AuthService`: Firebase authentication with signals
- `ThemeService`: Light/dark mode management
- `TranslationService`: English/Spanish i18n
- `ConnectionService`: Real-time connectivity monitoring
- `ProjectsService`: Project/Chapter management with real-time updates
- `FirebaseQueryService`: Centralized Firestore querying with advanced filtering
- `FilterStateService`: Filter state management
- `SupabaseService`: File storage for images and videos

## Firebase Query System

### Filter Options
```typescript
interface FilterOptions {
  scope: string;           // 'all', 'local', 'national', 'global', 'grupal', 'my-projects'
  userId?: string;         // Current user ID for permission checks
  location?: LocationData; // User's location for distance-based filters
  searchTerm?: string;     // Text search term
  state?: 'building' | 'implementing' | 'done';
  status?: 'active' | 'completed' | 'cancelled';
  limitCount?: number;     // Default: 8 projects per page
}
```

### Query Types

#### Scope-Based Queries
- **Public Scopes**: `local`, `national`, `global` (no permission restrictions)
- **Private Scopes**: `grupal` (permission-based), `my-projects` (user's own)

#### Search Queries
```typescript
// Title-based prefix search
where('title', '>=', searchTerm)
where('title', '<=', searchTerm + '\uf8ff')
orderBy('title')
```

#### Pagination
- **Initial Load**: `limit(8)` with `orderBy('createdAt', 'desc')`
- **Load More**: `startAfter(lastDocument)` for cursor-based pagination

### Permission System
- **Grupal Projects**: Only visible to creators and collaborators
- **Public Projects**: Visible to all authenticated users
- **Automatic Filtering**: Applied in both initial queries and real-time updates

### Required Firestore Indexes
```json
{
  "collectionGroup": "projects",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "scope.scope", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "projects",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "createdBy", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "projects",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "title", "order": "ASCENDING" }
  ]
}
```

## Reactive Service Architecture

### Real-Time Updates
The `ProjectsService` provides reactive signals that automatically update when data changes:
```typescript
// Reactive data - automatically updates
projects = this.projectsService.projects;
userProjects = this.projectsService.userProjects;
currentProject = this.projectsService.currentProject;
filteredProjects = this.projectsService.filteredProjects;
```

### Listener Management
```typescript
// Set up real-time listener
this.projectsService.setupProjectListener('project-id');

// Clean up listener
this.projectsService.cleanupProjectListener('project-id');
```

### Benefits
- **Real-time Updates**: Changes appear immediately across all users
- **Simplified Code**: No manual state management needed
- **Better Performance**: Automatic change detection and rendering
- **Consistent UI**: All components show the same data

## Components

**Core Pages**: Login, Register, Home, My Profile, New Item, Private/Public Inner Project
**UI Components**: Theme Toggle, Language Selector, Settings Modal/Button/Popover, Scope Selector
**Features**: Project management, Chapter editing, Media upload (images/videos), Collaboration system

## Usage Examples

**Auth Service**: `inject(AuthService)` → `user()`, `isAuthenticated()`, `signIn()`, `signInWithGoogle()`
**Connection Service**: `inject(ConnectionService)` → `isOnline()`, `connectionQuality()`, `isConnectionStable()`
**Projects Service**: `inject(ProjectsService)` → `projects()`, `filteredProjects()`, `setupProjectListener()`
**Firebase Query**: `inject(FirebaseQueryService)` → `queryProjects()`, `setupRealTimeListener()`

## Key Features

**Authentication**: Email/password + Google OAuth via Firebase
**Signals**: `signal()`, `computed()`, `effect()`, `inject()` for reactive state
**Firebase**: Auth, Firestore, real-time updates, server-side filtering
**Connection**: Real-time monitoring, offline detection, quality assessment
**Filtering**: Advanced server-side filtering with real-time updates

## Styling & Theming

**CSS Custom Properties**: `--app-background`, `--app-text`, `--app-card-background`, etc.
**Theme Support**: Light/dark mode with smooth transitions
**Usage**: Always use CSS custom properties, never hardcoded colors

## Security & UX

**Security**: Route guards, auth-based redirects, Firebase security rules, OAuth 2.0 compliance
**UX**: Loading states, error handling, responsive design, auto-navigation, connection monitoring

## Development Guidelines

### Core Rules
- **No comments**: Code should be self-documenting
- **No console.log**: Use proper logging services
- **Simple implementation**: Avoid unnecessary complexity
- **Standalone components**: Use standalone components (default in Angular 20)
- **Signals**: Prefer signals over traditional observables for state
- **Native features first**: Prefer ionic components over scss code

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

## Performance Features

- **Server-side filtering**: 10x faster than client-side processing
- **Real-time updates**: Immediate synchronization across all users
- **Efficient pagination**: Cursor-based with proper Firestore indexes
- **Automatic cleanup**: Listeners are cleaned up to prevent memory leaks
- **Optimized queries**: All queries use composite indexes for maximum performance

## Contributing

**Guidelines**: Maintain backward compatibility, add error handling, follow Angular 20 best practices, use signals for state management

## License

This project follows standard open-source licensing terms.
