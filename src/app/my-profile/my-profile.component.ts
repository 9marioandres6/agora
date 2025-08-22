import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule]
})
export class MyProfileComponent {
  private authService = inject(AuthService);
  private navCtrl = inject(NavController);
  private themeService = inject(ThemeService);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  isDark = signal(this.themeService.isDarkMode());

  displayName = '';
  email = '';
  photoURL = '';

  constructor() {
    this.initializeProfile();
  }

  private initializeProfile(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.displayName = currentUser.displayName || '';
      this.email = currentUser.email || '';
      this.photoURL = currentUser.photoURL || '';
    }
  }

  async saveProfile(): Promise<void> {
    try {
      const currentUser = this.user();
      if (currentUser) {
        await this.authService.updateProfile({
          displayName: this.displayName,
          photoURL: this.photoURL
        });
        this.navCtrl.back();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }

  goBack(): void {
    this.navCtrl.back();
  }
}
