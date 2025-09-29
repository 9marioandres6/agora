import { Injectable, signal, computed, effect } from '@angular/core';
import { Theme } from './models/theme.models';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSignal = signal<Theme>('light');
  
  public theme = this.themeSignal.asReadonly();
  public isDark = computed(() => this.themeSignal() === 'dark');

  constructor() {
    this.loadTheme();
    
    // Effect to ensure theme changes are properly tracked
    effect(() => {
      const currentTheme = this.themeSignal();
    });
  }

  public loadTheme(): void {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else if (prefersDark) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
  }

  getCurrentTheme(): Theme {
    return this.themeSignal();
  }

  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light-theme');
    }
  }

  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);    
  }

  isDarkMode(): boolean {
    return this.isDark();
  }
}
