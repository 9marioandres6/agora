import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { UserSearchService, UserProfile } from '../services/user-search.service';

@Component({
  selector: 'app-public-profile',
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class PublicProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private navCtrl = inject(NavController);
  private route = inject(ActivatedRoute);
  private themeService = inject(ThemeService);
  private userSearchService = inject(UserSearchService);

  isAuthenticated = this.authService.isAuthenticated;
  isDark = signal(this.themeService.isDarkMode());

  userId: string | null = null;
  userProfile: UserProfile | null = null;
  loading = signal(true);
  error = signal(false);
  currentUser = this.authService.user;

  constructor() {}

  ngOnInit(): void {
    this.route.params.subscribe((params: any) => {
      this.userId = params['userId'];
      if (this.userId) {
        this.loadUserProfile();
      } else {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  private async loadUserProfile(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);
      
      if (this.userId) {
        this.userProfile = await this.userSearchService.getUserProfile(this.userId);
        if (!this.userProfile) {
          this.error.set(true);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.navCtrl.back();
  }

  isCurrentUserProfile(): boolean {
    const currentUser = this.currentUser();
    return currentUser ? currentUser.uid === this.userId : false;
  }

  editProfile(): void {
    this.navCtrl.navigateForward('/my-profile');
  }
}
