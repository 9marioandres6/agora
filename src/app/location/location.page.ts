import { Component, inject, signal, OnInit, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, IonInput } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { LocationService } from '../services/location.service';
import { UserSearchService } from '../services/user-search.service';
import { ActivatedRoute } from '@angular/router';

declare var google: any;

@Component({
  selector: 'app-location',
  templateUrl: './location.page.html',
  styleUrls: ['./location.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule]
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
  
  userLocation = this.locationService.userLocation;
  showLocationChangeFlag = signal(false);
  newLocation: any = null;
  locationChangeDismissed = signal(false);
  private isGettingAddress = false;
  private userProfileCache: any = null;

  @ViewChild('addressInput', { static: false }) addressInput!: IonInput;
  
  showAddressInputFlag = signal(false);
  newAddress = '';
  selectedPlace: any = null;

  userLocationData = computed(() => {
    return this.userLocation().userLocation || this.userProfileCache?.location || null;
  });

  showAddressInput = computed(() => this.showAddressInputFlag());

  ngOnInit() {
            // Check if we have navigation state data first
            const navigationState = history.state;
            if (navigationState && navigationState.userLocation) {
              this.locationService.setUserLocation(navigationState.userLocation);
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
          this.locationService.setUserLocation(this.userProfileCache.location);
          
          // Only get address if we don't have it and we have coordinates
          const currentLocation = this.userLocation().userLocation;
          if (currentLocation?.latitude && currentLocation?.longitude && !currentLocation?.address) {
            const locationWithAddress = await this.locationService.getLocationWithAddress();
            if (locationWithAddress) {
              this.locationService.setUserLocation(locationWithAddress);
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
            this.locationService.setUserLocation(currentLocationState.location);
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
                  this.locationService.setUserLocation(locationData);
                  
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
      const savedLocation = this.userLocation().userLocation;
      if (currentLocation && savedLocation) {
        const currentCity = currentLocation.city || '';
        const savedCity = savedLocation.city || '';
        
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
        this.locationService.setUserLocation(this.newLocation);
        
        // Update cache
        if (this.userProfileCache) {
          this.userProfileCache.location = this.newLocation;
        }
        
        const currentUser = this.user();
        if (currentUser) {
          await this.userSearchService.createOrUpdateUserProfile(currentUser, this.newLocation);
          // Clear cache to ensure fresh data is fetched
          this.userSearchService.invalidateUserProfileCache(currentUser.uid);
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

  toggleAddressInput() {
    this.showAddressInputFlag.set(!this.showAddressInputFlag());
    if (this.showAddressInputFlag()) {
      // Initialize autocomplete after a short delay to ensure the input is rendered
      setTimeout(() => {
        this.initializeAutocomplete();
      }, 100);
    }
  }

  cancelAddressChange() {
    this.showAddressInputFlag.set(false);
    this.newAddress = '';
    this.selectedPlace = null;
  }

  async saveNewAddress() {
    if (!this.selectedPlace || !this.newAddress.trim()) {
      return;
    }

    try {
      const place = this.selectedPlace;
      const locationData = {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        address: place.formatted_address,
        city: this.extractAddressComponent(place, 'locality') || this.extractAddressComponent(place, 'administrative_area_level_2'),
        state: this.extractAddressComponent(place, 'administrative_area_level_1'),
        country: this.extractAddressComponent(place, 'country'),
        accuracy: 0,
        timestamp: Date.now()
      };

              this.locationService.setUserLocation(locationData);
      
      // Update cache
      if (this.userProfileCache) {
        this.userProfileCache.location = locationData;
      }
      
              // Close the input immediately
              this.cancelAddressChange();

              // Save to database
              const currentUser = this.user();
              if (currentUser) {
                await this.userSearchService.createOrUpdateUserProfile(currentUser, locationData);
                // Clear cache to ensure fresh data is fetched
                this.userSearchService.invalidateUserProfileCache(currentUser.uid);
              }
    } catch (error) {
      console.error('Error saving new address:', error);
    }
  }

  private initializeAutocomplete() {
    if (!this.addressInput || typeof google === 'undefined') {
      return;
    }

    this.addressInput.getInputElement().then((element) => {
      const autocomplete = new google.maps.places.Autocomplete(element, {
        types: ['geocode']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          this.selectedPlace = place;
          this.newAddress = place.formatted_address;
        }
      });
    });
  }

  private extractAddressComponent(place: any, type: string): string {
    const component = place.address_components?.find((comp: any) => 
      comp.types.includes(type)
    );
    return component?.long_name || '';
  }
}
