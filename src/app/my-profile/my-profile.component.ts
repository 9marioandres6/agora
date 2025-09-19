import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { LocationService, LocationData } from '../services/location.service';
import { UserSearchService } from '../services/user-search.service';
import { ImageFallbackDirective } from '../directives/image-fallback.directive';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule, ImageFallbackDirective]
})
export class MyProfileComponent {
  private authService = inject(AuthService);
  private navCtrl = inject(NavController);
  private themeService = inject(ThemeService);
  private locationService = inject(LocationService);
  private userSearchService = inject(UserSearchService);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  isDark = signal(this.themeService.isDarkMode());
  location = this.locationService.location;

  displayName = '';
  email = '';
  photoURL = '';
  userLocation: LocationData | null = null;

  constructor() {
    this.initializeProfile();
    this.loadUserLocation();
  }

  private initializeProfile(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.displayName = currentUser.displayName || '';
      this.email = currentUser.email || '';
      this.photoURL = currentUser.photoURL || '';
    }
  }

  private async loadUserLocation(): Promise<void> {
    try {
      const currentUser = this.user();
      if (currentUser) {
        const userProfile = await this.userSearchService.getUserProfile(currentUser.uid);
        if (userProfile?.location) {
          this.userLocation = userProfile.location;
        }
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  }

  async updateLocation(): Promise<void> {
    try {
      const location = await this.locationService.getLocationWithAddress();
      if (location) {
        this.userLocation = location;
        const currentUser = this.user();
        if (currentUser) {
          await this.userSearchService.createOrUpdateUserProfile(currentUser, location);
        }
      }
    } catch (error) {
      console.error('Error updating location:', error);
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
