import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { LanguageSelectorComponent } from '../components/language-selector/language-selector.component';
import { ImageFallbackDirective } from '../directives/image-fallback.directive';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule, LanguageSelectorComponent, ImageFallbackDirective]
})
export class SettingsPage {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private navCtrl = inject(NavController);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  
  isDark = signal(this.themeService.isDarkMode());
  currentTheme = computed(() => this.isDark() ? 'dark' : 'light');

  constructor() {
    // Initialize theme state
    this.updateThemeState();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.updateThemeState();
  }

  private updateThemeState(): void {
    this.isDark.set(this.themeService.isDarkMode());
  }

  async logout() {
    try {
      await this.authService.signOut();
      this.navCtrl.navigateRoot('/home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  viewProfile() {
    const currentUser = this.user();
    if (currentUser) {
      this.navCtrl.navigateForward(`/profile/${currentUser.uid}`);
    }
  }

  goBack() {
    this.navCtrl.back();
  }
}
