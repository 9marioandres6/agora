import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { LocationService } from '../services/location.service';
import { UserSearchService } from '../services/user-search.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-location',
  templateUrl: './location.page.html',
  styleUrls: ['./location.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class LocationPage implements OnInit {
  private authService = inject(AuthService);
  private locationService = inject(LocationService);
  private userSearchService = inject(UserSearchService);
  private navCtrl = inject(NavController);
  private route = inject(ActivatedRoute);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  locationState = this.locationService.location;
  
  userLocation: any = null;
  showLocationChangeFlag = signal(false);
  newLocation: any = null;
  locationChangeDismissed = signal(false);
  private isGettingAddress = false;
  private userProfileCache: any = null;

  userLocationData = computed(() => {
    return this.userLocation || this.userProfileCache?.location || null;
  });

  ngOnInit() {
    // Check if we have navigation state data first
    const navigationState = history.state;
    if (navigationState && navigationState.userLocation) {
      this.userLocation = navigationState.userLocation;
      this.showLocationChangeFlag.set(navigationState.showLocationChangeFlag || false);
      this.newLocation = navigationState.newLocation;
      this.locationChangeDismissed.set(navigationState.locationChangeDismissed || false);
    } else {
      // If no navigation state or no user location, load from services
      this.loadUserLocation();
    }
  }

  async loadUserLocation() {
    try {
      const currentUser = this.user();
      if (currentUser) {
        // First check if we have cached user profile
        if (!this.userProfileCache) {
          this.userProfileCache = await this.userSearchService.getUserProfile(currentUser.uid);
        }
        
        if (this.userProfileCache?.location) {
          this.userLocation = this.userProfileCache.location;
          
          // Only get address if we don't have it and we have coordinates
          if (this.userLocation.latitude && this.userLocation.longitude && !this.userLocation.address) {
            const locationWithAddress = await this.locationService.getLocationWithAddress();
            if (locationWithAddress) {
              this.userLocation = locationWithAddress;
              // Update the cache
              this.userProfileCache.location = locationWithAddress;
            }
          } else {
            await this.checkForLocationChange();
          }
        } else {
          // If no saved location, check if location service has current location
          const currentLocationState = this.locationState();
          if (currentLocationState.location) {
            this.userLocation = currentLocationState.location;
          }
        }
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  }

  async requestLocationAccess() {
    try {
      const hasPermission = await this.locationService.requestLocationPermission();
      if (hasPermission) {
        const locationData = await this.locationService.getLocationWithAddress();
        if (locationData) {
          this.userLocation = locationData;
          
          // Update cache
          if (this.userProfileCache) {
            this.userProfileCache.location = locationData;
          }
          
          const currentUser = this.user();
          if (currentUser) {
            await this.userSearchService.createOrUpdateUserProfile(currentUser, locationData);
          }
        }
      }
    } catch (error) {
      console.error('Error requesting location access:', error);
    }
  }

  async checkForLocationChange() {
    try {
      if (this.locationChangeDismissed()) {
        return;
      }
      
      const currentLocation = await this.locationService.getLocationWithAddress();
      if (currentLocation && this.userLocation) {
        const currentCity = currentLocation.city || '';
        const savedCity = this.userLocation.city || '';
        
        if (currentCity && savedCity && currentCity !== savedCity) {
          this.newLocation = currentLocation;
          this.showLocationChangeFlag.set(true);
        }
      }
    } catch (error) {
      console.error('Error checking for location change:', error);
    }
  }

  async acceptLocationChange() {
    try {
      if (this.newLocation) {
        this.userLocation = this.newLocation;
        
        // Update cache
        if (this.userProfileCache) {
          this.userProfileCache.location = this.newLocation;
        }
        
        const currentUser = this.user();
        if (currentUser) {
          await this.userSearchService.createOrUpdateUserProfile(currentUser, this.newLocation);
        }
      }
    } catch (error) {
      console.error('Error accepting location change:', error);
    } finally {
      this.showLocationChangeFlag.set(false);
      this.newLocation = null;
      this.locationChangeDismissed.set(true);
    }
  }

  dismissLocationChange() {
    this.showLocationChangeFlag.set(false);
    this.newLocation = null;
    this.locationChangeDismissed.set(true);
  }

  goBack() {
    this.navCtrl.back();
  }
}
