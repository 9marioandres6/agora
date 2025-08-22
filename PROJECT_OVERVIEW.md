# MiApp20 - Angular 20 Project Overview

## Project Structure
- **Framework**: Angular 20 with Ionic 8
- **Architecture**: Standalone components with signals
- **Styling**: SCSS with CSS custom properties for theming
- **State Management**: Angular signals for reactive state

## Core Features

### Authentication System
- Firebase authentication integration
- Separate login/register components
- Auth guards for route protection
- Google OAuth support

### Theme System
- Centralized dark/light mode management
- CSS custom properties for consistent theming
- Theme service with signal-based state
- Automatic theme persistence in localStorage

### Component Architecture
- Standalone components (Angular 20 standard)
- Signal-based reactivity
- Dependency injection with `inject()` function
- No NgModules for components

## Angular 20 Best Practices

### Signals Usage
```typescript
private themeSignal = signal<Theme>('light');
public theme = this.themeSignal.asReadonly();
public isDark = computed(() => this.themeSignal() === 'dark');
```

### Standalone Components
```typescript
@Component({
  standalone: true,
  imports: [IonicModule, CommonModule]
})
```

### Modern Injection
```typescript
private authService = inject(AuthService);
private themeService = inject(ThemeService);
```

### Signal Computed Values
```typescript
isDark = computed(() => this.themeService.isDark());
```

## Key Services

### ThemeService
- Manages application-wide theme state
- Uses signals for reactive updates
- Handles theme persistence
- Automatic system preference detection

### AuthService
- Firebase authentication wrapper
- User state management
- Sign in/up/out operations
- Google OAuth integration

## Styling Approach

### CSS Custom Properties
```scss
:root {
  --app-background: #ffffff;
  --app-text: #000000;
  --app-card-background: #ffffff;
}

.dark-theme {
  --app-background: #1a1a1a;
  --app-text: #ffffff;
}
```

### Theme-Aware Components
- All components automatically adapt to current theme
- Smooth transitions between themes
- Consistent color scheme across the app

## File Organization
```
src/
├── app/
│   ├── components/          # Reusable UI components
│   ├── services/           # Business logic services
│   ├── guards/             # Route protection
│   ├── home/               # Main application page
│   ├── login/              # Authentication pages
│   └── register/
├── environments/           # Configuration files
└── global.scss            # Global styles and theme variables
```

## Development Guidelines

### Code Style
- No comments in code
- No console.log statements
- Use descriptive variable names
- Follow Angular style guide

### Component Design
- Single responsibility principle
- Standalone architecture
- Signal-based state management
- Reactive template bindings

### State Management
- Prefer signals over observables
- Use computed values for derived state
- Centralize state in services
- Avoid component-level state when possible

## Key Technologies
- **Angular 20**: Latest framework features
- **Ionic 8**: Mobile-first UI components
- **Firebase**: Authentication and backend
- **Signals**: Modern reactivity system
- **SCSS**: Advanced CSS preprocessing
- **TypeScript**: Strong typing and modern JS features
