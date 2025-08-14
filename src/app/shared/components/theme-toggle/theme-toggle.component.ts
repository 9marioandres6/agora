import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleButtonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  readonly selectedTheme = this.themeService.selectedTheme;
  readonly activeTheme = this.themeService.activeTheme;
  readonly themeOptions = this.themeService.getThemeOptions();

  private readonly _showDropdown = signal(false);
  private readonly _isDropdownOpen = signal(false);

  readonly showDropdown = this._showDropdown.asReadonly();
  readonly isDropdownOpen = this._isDropdownOpen.asReadonly();
  
  get isDarkMode(): boolean {
    const active = this.activeTheme();
    return active === 'dark';
  }

  set isDarkMode(value: boolean) {
  }

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('click', () => {
        this._isDropdownOpen.set(false);
      });
    }
  }

  configure(options: { showDropdown?: boolean } = {}): void {
    if (options.showDropdown !== undefined) {
      this._showDropdown.set(options.showDropdown);
    }
  }

  toggleDropdown(): void {
    this._isDropdownOpen.update(open => !open);
  }

  selectTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
    this._isDropdownOpen.set(false);
  }

  onToggleChange(): void {
    this.themeService.toggleTheme();
  }

  getThemeIcon(theme: Theme): string {
    switch (theme) {
      case 'light':
        return 'pi pi-sun';
      case 'dark':
        return 'pi pi-moon';
      case 'system':
        return 'pi pi-desktop';
      default:
        return 'pi pi-sun';
    }
  }

  getThemeLabel(theme: Theme): string {
    return this.themeOptions.find(option => option.value === theme)?.label || '';
  }
}
