import { Component, inject, signal, OnInit, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, IonInput } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { LocationService } from '../services/location.service';
import { UserSearchService } from '../services/user-search.service';
import { ProjectsService } from '../services/projects.service';
import { GoogleMapsService } from '../services/google-maps.service';
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
  private projectsService = inject(ProjectsService);
  private googleMapsService = inject(GoogleMapsService);
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
          }
          
          // Always check for location change when loading user location
          await this.checkForLocationChange();
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
        // Check if city has changed - normalize cities for comparison
        const currentCity = (currentLocation.city || '').toLowerCase().trim();
        const savedCity = (savedLocation.city || '').toLowerCase().trim();
        
        // Also check if coordinates are significantly different (more than ~1km)
        let coordinatesChanged = false;
        if (currentLocation.latitude && currentLocation.longitude && 
            savedLocation.latitude && savedLocation.longitude) {
          const distance = this.googleMapsService.calculateDistance(
            currentLocation.latitude, currentLocation.longitude,
            savedLocation.latitude, savedLocation.longitude
          );
          coordinatesChanged = distance > 1; // More than 1km difference
        }
        
        // Show location change if cities are different OR coordinates changed significantly
        if ((currentCity && savedCity && currentCity !== savedCity) || coordinatesChanged) {
          this.newLocation = currentLocation;
          this.showLocationChangeFlag.set(true);
        } else {
          // If cities match and coordinates are close, ensure the flag is false
          this.showLocationChangeFlag.set(false);
        }
      }
    } catch (error) {
      console.error('Error checking for location change:', error);
    }
  }

  async acceptLocationChange() {
    // Store the new location before clearing it
    const locationToAccept = this.newLocation;
    
    // Hide the location change element immediately
    this.showLocationChangeFlag.set(false);
    this.newLocation = null;
    this.locationChangeDismissed.set(true);
    
    try {
      if (locationToAccept) {
        // Ensure location has geohash
        const locationWithGeohash = this.locationService.ensureLocationHasGeohash(locationToAccept);
        
        this.locationService.setUserLocation(locationWithGeohash);
        
        // Save to user profile in Firebase
        const currentUser = this.user();
        if (currentUser) {
          await this.userSearchService.updateUserLocation(currentUser.uid, locationWithGeohash);
        }
        
        // Update cache
        if (this.userProfileCache) {
          this.userProfileCache.location = locationWithGeohash;
        }
        
        // Refresh projects with the new location
        await this.projectsService.refreshProjectsWithCurrentLocation();
      }
    } catch (error) {
      console.error('Error accepting location change:', error);
    }
  }

  dismissLocationChange() {
    this.showLocationChangeFlag.set(false);
    this.newLocation = null;
    this.locationChangeDismissed.set(true);
  }

  chooseLocation() {
    // Hide the location change notification
    this.showLocationChangeFlag.set(false);
    this.newLocation = null;
    this.locationChangeDismissed.set(true);
    
    // Show the address input to let user choose a different location
    this.toggleAddressInput();
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
      const geohash = this.googleMapsService.generateGeohash(
        place.geometry.location.lat(),
        place.geometry.location.lng()
      );

      const locationData = {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        geohash,
        address: place.formatted_address,
        city: this.extractAddressComponent(place, 'locality') || this.extractAddressComponent(place, 'administrative_area_level_2'),
        state: this.extractAddressComponent(place, 'administrative_area_level_1'),
        country: this.extractAddressComponent(place, 'country'),
        countryCode: this.extractAddressComponent(place, 'country', true),
        accuracy: 0,
        timestamp: Date.now()
      };

      this.locationService.setUserLocation(locationData);
      
      // Save to user profile in Firebase
      const currentUser = this.user();
      if (currentUser) {
        await this.userSearchService.updateUserLocation(currentUser.uid, locationData);
      }
      
      // Update cache
      if (this.userProfileCache) {
        this.userProfileCache.location = locationData;
      }
      
      // Close the input immediately
      this.cancelAddressChange();

      // Refresh projects with the new location
      await this.projectsService.refreshProjectsWithCurrentLocation();
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

  private extractAddressComponent(place: any, type: string, useShortName: boolean = false): string {
    const component = place.address_components?.find((comp: any) => 
      comp.types.includes(type)
    );
    return useShortName ? (component?.short_name || '') : (component?.long_name || '');
  }
}
