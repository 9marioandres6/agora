# Agora - Collaborative Project Platform

A modern Ionic Angular 20 application for collaborative project management with real-time updates.

## Tech Stack
- **Angular 20** + **Ionic 8** + **TypeScript 5.8**
- **Firebase** (Auth + Firestore)
- **Supabase** (File Storage)
- **i18n** (English/Spanish)
- **Dynamic Theming** (Light/Dark)

## Quick Setup

```bash
npm install
npm start
```

## Firebase Setup

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login and initialize: `firebase login && firebase init`
3. Select Firestore, choose your project
4. Deploy rules: `firebase deploy --only firestore:rules`
5. Update `src/environments/environment.ts` with your Firebase config

## Supabase Setup

See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for file storage configuration.

## Core Features

- **Project Management**: Create, collaborate, and track projects
- **Real-time Updates**: Live synchronization across users
- **Scope-based Filtering**: Local, National, Global, Group projects
- **Media Support**: Images and videos via Supabase
- **Offline Support**: Connection monitoring and offline handling
- **Internationalization**: English/Spanish support
- **Responsive Design**: Mobile-first with dark/light themes

## Architecture

**Key Services**:
- `AuthService`: Firebase authentication
- `ProjectsService`: Project management with real-time updates
- `FirebaseQueryService`: Advanced Firestore querying
- `SupabaseService`: File storage
- `ThemeService`: Light/dark mode
- `ConnectionService`: Connectivity monitoring

## Development Guidelines

- Use **Angular 20 signals** for reactive state
- **Standalone components** only
- **CSS custom properties** for theming
- **Translation keys** for all text (`{{ 'KEY' | translate }}`)
- **No console.log** in production code
- **Self-documenting code** (minimal comments)

## Project Structure

- **Pages**: Home, Login, Register, Project Details
- **Components**: Reusable UI components
- **Services**: Business logic and data management
- **Models**: TypeScript interfaces
- **i18n**: Translation files (en.json, es.json)

## License

Open source project following standard licensing terms.