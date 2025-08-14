# Centralized Light/Dark Mode Theme System

## Overview

This project implements a comprehensive, centralized theme system using **Angular 20** and modern **SCSS** features. The system provides seamless light/dark mode switching with system preference detection, persistence, and full component integration.

## Features

### 🎨 **Modern Theme Architecture**
- **CSS Custom Properties** for dynamic theming
- **Angular 20 Signals** for reactive state management
- **Injection Tokens** for dependency injection
- **System preference detection** with `prefers-color-scheme`
- **Persistent theme storage** in localStorage
- **Smooth transitions** between themes

### 🎯 **Key Components**

#### 1. **ThemeService** (`src/app/shared/services/theme.service.ts`)
- Reactive theme management using Angular 20 signals
- System preference detection and monitoring
- Automatic CSS custom property updates
- Theme persistence with localStorage
- Three theme modes: `light`, `dark`, `system`

#### 2. **Theme Toggle Component** (`src/app/shared/components/theme-toggle/`)
- Modern toggle with icon animations
- Dropdown mode for all three theme options
- Accessibility features (ARIA labels, keyboard navigation)
- Configurable display options (label/dropdown)
- Responsive design with mobile optimization

#### 3. **SCSS Theme System** (`src/app/shared/styles/_theme-mixins.scss`)
- Comprehensive mixin library
- CSS custom properties for all design tokens
- Utility class generators
- Responsive design helpers
- Accessibility considerations

## 🚀 **Usage**

### Basic Theme Toggle
```html
<app-theme-toggle></app-theme-toggle>
```

### Dropdown Theme Selector
```typescript
// In component
export class MyComponent {
  @ViewChild(ThemeToggleComponent) themeToggle!: ThemeToggleComponent;
  
  ngAfterViewInit() {
    this.themeToggle.configure({ 
      showLabel: true, 
      showDropdown: true 
    });
  }
}
```

### Using Theme Service
```typescript
import { ThemeService } from './shared/services/theme.service';

export class MyComponent {
  private themeService = inject(ThemeService);
  
  // Reactive theme access
  readonly currentTheme = this.themeService.activeTheme;
  readonly themeConfig = this.themeService.themeConfig;
  
  // Theme manipulation
  toggleTheme() {
    this.themeService.toggleTheme();
  }
  
  setSpecificTheme() {
    this.themeService.setTheme('dark');
  }
}
```

## 🎨 **SCSS Mixins & Utilities**

### Color Theming
```scss
.my-component {
  // Use themed colors
  @include themed-color(background-color, surface);
  @include themed-color(color, text);
  
  // Themed gradients
  @include themed-gradient(135deg, primary, secondary);
}
```

### Component Styling
```scss
.card {
  @include card(); // Auto-themed card with hover effects
}

.button {
  @include button-primary(); // Themed primary button
}

.input {
  @include input-base(); // Themed form input
}
```

### Layout Helpers
```scss
.container {
  @include container(1200px);
  @include flex-center();
}

.responsive-grid {
  @include mobile {
    grid-template-columns: 1fr;
  }
  
  @include desktop {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Typography
```scss
.heading {
  @include heading(2); // Auto-themed heading level 2
}

.text {
  @include text('large');
  @include text-secondary(); // Muted color
}
```

## 📱 **Design Tokens**

### Color Palette
```css
:root {
  /* Primary Colors */
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --color-accent: #3182ce;
  
  /* Semantic Colors */
  --color-success: #38a169;
  --color-warning: #d69e2e;
  --color-error: #e53e3e;
  
  /* Neutral Colors */
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #1a202c;
  --color-text-secondary: #4a5568;
  --color-border: #e2e8f0;
}
```

### Spacing Scale
```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
}
```

### Typography Scale
```css
:root {
  --font-size-xs: 0.75rem;     /* 12px */
  --font-size-sm: 0.875rem;    /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.25rem;     /* 20px */
  --font-size-2xl: 1.5rem;     /* 24px */
  --font-size-3xl: 1.875rem;   /* 30px */
  --font-size-4xl: 2.25rem;    /* 36px */
}
```

## ♿ **Accessibility Features**

### Color Contrast
- Automatic high contrast mode support
- WCAG AA compliant color combinations
- Enhanced focus indicators

### Motion & Animation
- Respects `prefers-reduced-motion`
- Smooth, non-disruptive transitions
- Optional animation disabling

### Keyboard Navigation
- Full keyboard support for theme toggle
- Proper ARIA labels and roles
- Screen reader friendly

### System Integration
- Automatic system theme detection
- Seamless switching between preferences
- No flash of unstyled content (FOUC)

## 🔧 **Customization**

### Adding New Colors
```typescript
// In theme.service.ts
private readonly lightThemeConfig: ThemeConfig = {
  theme: 'light',
  colors: {
    // ... existing colors
    customColor: '#your-color',
  }
};
```

```scss
// In _theme-mixins.scss
:root {
  --color-custom-color: #your-color;
}
```

### Creating Custom Mixins
```scss
@mixin my-custom-component() {
  @include surface();
  @include themed-color(border-color, accent);
  
  // Your custom styles
  padding: var(--spacing-lg);
  border-radius: var(--radius-xl);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}
```

### Extending Theme Modes
```typescript
// Add new theme mode
export type Theme = 'light' | 'dark' | 'system' | 'high-contrast';

// Add configuration
private readonly highContrastThemeConfig: ThemeConfig = {
  theme: 'high-contrast',
  colors: {
    // High contrast color definitions
  }
};
```

## 📂 **File Structure**

```
src/app/shared/
├── services/
│   └── theme.service.ts           # Core theme service
├── components/
│   └── theme-toggle/
│       ├── theme-toggle.component.ts
│       └── theme-toggle.component.scss
├── styles/
│   └── _theme-mixins.scss         # SCSS mixin library
└── demo/
    └── theme-demo/                # Demo component (optional)
```

## 🛠 **Development Guidelines**

### Best Practices
1. **Always use theme variables** instead of hardcoded colors
2. **Leverage mixins** for consistent styling patterns
3. **Test both themes** during development
4. **Consider accessibility** in all design decisions
5. **Use semantic color names** (success, warning, error)

### Performance Considerations
- CSS custom properties update instantly
- Minimal JavaScript execution
- No runtime CSS generation
- Optimized for SSR compatibility

### Browser Support
- Modern browsers supporting CSS custom properties
- Graceful degradation for older browsers
- Angular 20 browser requirements

## 🔄 **Migration Guide**

### From Hardcoded Styles
```scss
// Before
.component {
  background: #ffffff;
  color: #1a202c;
  border: 1px solid #e2e8f0;
}

// After
.component {
  @include themed-color(background-color, background);
  @include themed-color(color, text);
  @include themed-color(border-color, border);
}
```

### From CSS Classes
```scss
// Before
.light-theme .component { background: white; }
.dark-theme .component { background: #1a202c; }

// After
.component {
  @include themed-color(background-color, background);
}
```

## 📈 **Future Enhancements**

- [ ] **Theme presets** (e.g., corporate, creative, minimal)
- [ ] **Color customization UI** for user-defined themes
- [ ] **Automatic contrast adjustment** based on ambient light
- [ ] **Theme synchronization** across browser tabs
- [ ] **Advanced animation controls** per theme
- [ ] **Component-specific theme overrides**

## 🤝 **Contributing**

When contributing to the theme system:

1. Maintain consistent naming conventions
2. Update design tokens for new colors/spacing
3. Test accessibility compliance
4. Document new mixins and utilities
5. Ensure SSR compatibility

## 📄 **License & Credits**

This theme system uses modern web standards and Angular 20 features for optimal performance and developer experience.
