import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, NavController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule, LanguageSelectorComponent]
})
export class SettingsModalComponent {
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
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
      this.modalCtrl.dismiss();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  editProfile() {
    this.modalCtrl.dismiss();
    this.navCtrl.navigateForward('/my-profile');
  }
}
