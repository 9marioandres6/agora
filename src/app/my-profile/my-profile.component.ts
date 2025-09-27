import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { LocationService, LocationData } from '../services/location.service';
import { UserSearchService } from '../services/user-search.service';
import { SupabaseService } from '../services/supabase.service';
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
  private supabaseService = inject(SupabaseService);
  private toastCtrl = inject(ToastController);

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
      const location = this.locationService.userLocation().userLocation;
      if (location) {
        this.userLocation = location;
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  }

  async updateLocation(): Promise<void> {
    try {
      const location = await this.locationService.getLocationWithAddress();
      if (location) {
        this.locationService.setUserLocation(location);
        this.userLocation = location;
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

  async changeProfilePhoto(): Promise<void> {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      
      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (file) {
          await this.uploadProfilePhoto(file);
        }
        document.body.removeChild(input);
      };
      
      document.body.appendChild(input);
      input.click();
    } catch (error) {
      console.error('Error opening file picker:', error);
      await this.showToast('Error opening file picker', 'danger');
    }
  }

  async uploadProfilePhoto(file: File): Promise<void> {
    try {
      const maxFileSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      if (file.size > maxFileSize) {
        await this.showToast('File is too large. Maximum size is 5MB.', 'warning');
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        await this.showToast('Invalid file type. Please select an image.', 'warning');
        return;
      }
      
      await this.showToast('Uploading photo...', 'success');
      
      const uploadResult = await this.supabaseService.uploadFile(
        file, 
        'agora-project', 
        'profile-photos'
      );
      
      if (uploadResult) {
        this.photoURL = uploadResult.url;
        await this.showToast('Photo uploaded successfully!', 'success');
      } else {
        await this.showToast('Failed to upload photo', 'danger');
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      await this.showToast('Error uploading photo', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  goBack(): void {
    this.navCtrl.back();
  }
}
