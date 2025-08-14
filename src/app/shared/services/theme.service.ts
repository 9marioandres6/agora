import { Injectable, signal, computed, effect, inject, DOCUMENT } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'agora-theme';


  private readonly _selectedTheme = signal<Theme>(this.getStoredTheme());
  private readonly _systemTheme = signal<'light' | 'dark'>('light');


  readonly selectedTheme = this._selectedTheme.asReadonly();
  readonly systemTheme = this._systemTheme.asReadonly();


  readonly activeTheme = computed(() => {
    const selected = this._selectedTheme();
    return selected === 'system' ? this._systemTheme() : selected;
  });


  readonly themeConfig = computed((): ThemeConfig => {
    const theme = this.activeTheme();
    return theme === 'dark' ? this.darkThemeConfig : this.lightThemeConfig;
  });


  private readonly lightThemeConfig: ThemeConfig = {
    theme: 'light',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1a202c',
      textSecondary: '#4a5568',
      border: '#e2e8f0',
      accent: '#3182ce',
      success: '#38a169',
      warning: '#d69e2e',
      error: '#e53e3e'
    }
  };

  private readonly darkThemeConfig: ThemeConfig = {
    theme: 'dark',
    colors: {
      primary: '#8b5cf6',
      secondary: '#a855f7',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      border: '#334155',
      accent: '#60a5fa',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    }
  };

  constructor() {
    this.initializeSystemThemeDetection();
    this.setupThemeEffects();
  }


  setTheme(theme: Theme): void {
    this._selectedTheme.set(theme);
    this.storeTheme(theme);
  }


  toggleTheme(): void {
    const current = this._selectedTheme();
    if (current === 'system') {

      this.setTheme(this._systemTheme() === 'light' ? 'dark' : 'light');
    } else {

      this.setTheme(current === 'light' ? 'dark' : 'light');
    }
  }


  getThemeOptions(): { value: Theme; label: string }[] {
    return [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'System' }
    ];
  }

  private initializeSystemThemeDetection(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      

      this._systemTheme.set(mediaQuery.matches ? 'dark' : 'light');


      mediaQuery.addEventListener('change', (e) => {
        this._systemTheme.set(e.matches ? 'dark' : 'light');
      });
    }
  }

  private setupThemeEffects(): void {

    effect(() => {
      const config = this.themeConfig();
      this.applyThemeToDOM(config);
    });
  }

  private applyThemeToDOM(config: ThemeConfig): void {
    const root = this.document.documentElement;
    

    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${config.theme}`);


    Object.entries(config.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${this.kebabCase(key)}`, value);
    });


    root.style.setProperty('--theme', config.theme);
  }

  private getStoredTheme(): Theme {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as Theme;
      }
    }
    return 'system';
  }

  private storeTheme(theme: Theme): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, theme);
    }
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }
}
