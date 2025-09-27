import { Injectable, inject, signal } from '@angular/core';
import { GoogleMapsService } from './google-maps.service';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  geohash?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
}

export interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

export interface UserLocationState {
  userLocation: LocationData | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private googleMapsService = inject(GoogleMapsService);
  private locationState = signal<LocationState>({
    location: null,
    loading: false,
    error: null,
    permissionGranted: false
  });

  location = this.locationState.asReadonly();
  
  private userLocationState = signal<UserLocationState>({
    userLocation: null,
    loading: false,
    error: null
  });

  userLocation = this.userLocationState.asReadonly();

  async requestLocationPermission(): Promise<boolean> {
    try {
      if (!navigator.geolocation) {
        this.locationState.update(state => ({
          ...state,
          error: 'Geolocation is not supported by this browser',
          permissionGranted: false
        }));
        return false;
      }

      this.locationState.update(state => ({ ...state, loading: true, error: null }));

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };

            this.locationState.update(state => ({
              ...state,
              location: locationData,
              loading: false,
              permissionGranted: true,
              error: null
            }));

            resolve(true);
          },
          (error) => {
            let errorMessage = 'Unknown error occurred';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out';
                break;
            }

            this.locationState.update(state => ({
              ...state,
              error: errorMessage,
              loading: false,
              permissionGranted: false
            }));

            resolve(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      });
    } catch (error) {
      this.locationState.update(state => ({
        ...state,
        error: 'Error requesting location permission',
        loading: false,
        permissionGranted: false
      }));
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      this.locationState.update(state => ({ ...state, loading: true, error: null }));

      if (!navigator.geolocation) {
        this.locationState.update(state => ({
          ...state,
          error: 'Geolocation is not supported by this browser',
          loading: false
        }));
        return null;
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };

            this.locationState.update(state => ({
              ...state,
              location: locationData,
              loading: false,
              permissionGranted: true
            }));

            resolve(locationData);
          },
          (error) => {
            let errorMessage = 'Unknown error occurred';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out';
                break;
            }

            this.locationState.update(state => ({
              ...state,
              error: errorMessage,
              loading: false,
              permissionGranted: false
            }));

            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      });
    } catch (error) {
      this.locationState.update(state => ({
        ...state,
        error: 'Error getting location',
        loading: false
      }));
      return null;
    }
  }

  async getLocationWithAddress(): Promise<LocationData | null> {
    const location = await this.getCurrentLocation();
    
    if (location) {
      try {
        const addressComponents = await this.googleMapsService.coordinatesToAddress(
          location.latitude, 
          location.longitude
        );
        
        const geohash = this.googleMapsService.generateGeohash(
          location.latitude, 
          location.longitude
        );
        
        const locationWithAddress: LocationData = {
          ...location,
          geohash,
          address: addressComponents?.formattedAddress,
          city: addressComponents?.city,
          state: addressComponents?.state,
          country: addressComponents?.country,
          countryCode: addressComponents?.countryCode
        };
        
        this.locationState.update(state => ({
          ...state,
          location: locationWithAddress
        }));
        
        return locationWithAddress;
      } catch (error) {
        console.warn('Could not get address for location:', error);
        // If geocoding fails, still add geohash and return the location
        const locationWithGeohash: LocationData = {
          ...location,
          geohash: this.googleMapsService.generateGeohash(location.latitude, location.longitude)
        };
        return locationWithGeohash;
      }
    }

    return location;
  }


  clearError() {
    this.locationState.update(state => ({ ...state, error: null }));
  }

  resetLocation() {
    this.locationState.update(state => ({
      ...state,
      location: null,
      error: null
    }));
  }

  clearGeocodingCache() {
    this.googleMapsService.clearCache();
  }

  getCacheSize(): number {
    return this.googleMapsService.getCacheSize();
  }

  // User location management methods
  setUserLocation(location: LocationData | null) {
    this.userLocationState.update(state => ({
      ...state,
      userLocation: location,
      error: null
    }));
    
    // Persist to localStorage to survive page refreshes
    if (location) {
      localStorage.setItem('userLocation', JSON.stringify(location));
    } else {
      localStorage.removeItem('userLocation');
    }
  }

  async loadUserLocation(userSearchService: any, currentUser: any): Promise<LocationData | null> {
    try {
      this.userLocationState.update(state => ({ ...state, loading: true, error: null }));
      
      // First check localStorage for persisted location
      const persistedLocation = this.getPersistedLocation();
      if (persistedLocation) {
        this.userLocationState.update(state => ({
          ...state,
          userLocation: persistedLocation,
          loading: false
        }));
        return persistedLocation;
      }
      
      // Then check current location in service
      const currentLocation = this.userLocationState().userLocation;
      if (currentLocation) {
        this.userLocationState.update(state => ({ ...state, loading: false }));
        return currentLocation;
      }
      
      // Finally load from database if no current location
      if (currentUser) {
        const userProfile = await userSearchService.getUserProfile(currentUser.uid);
        if (userProfile?.location) {
          this.setUserLocation(userProfile.location);
          return userProfile.location;
        }
      }
      
      this.userLocationState.update(state => ({ ...state, loading: false }));
      return null;
    } catch (error) {
      this.userLocationState.update(state => ({
        ...state,
        loading: false,
        error: 'Error loading user location'
      }));
      return this.userLocationState().userLocation;
    }
  }

  private getPersistedLocation(): LocationData | null {
    try {
      const persisted = localStorage.getItem('userLocation');
      return persisted ? JSON.parse(persisted) : null;
    } catch (error) {
      console.warn('Error reading persisted location:', error);
      return null;
    }
  }

  clearUserLocation() {
    this.userLocationState.update(state => ({
      ...state,
      userLocation: null,
      error: null
    }));
    localStorage.removeItem('userLocation');
  }

  async addressToCoordinates(address: string): Promise<LocationData | null> {
    try {
      const coordinates = await this.googleMapsService.addressToCoordinates(address);
      
      if (coordinates) {
        const addressComponents = await this.googleMapsService.coordinatesToAddress(
          coordinates.latitude,
          coordinates.longitude
        );

        const locationData: LocationData = {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracy: 0,
          timestamp: Date.now(),
          geohash: coordinates.geohash,
          address: addressComponents?.formattedAddress,
          city: addressComponents?.city,
          state: addressComponents?.state,
          country: addressComponents?.country,
          countryCode: addressComponents?.countryCode
        };

        return locationData;
      }
      
      return null;
    } catch (error) {
      console.error('Error converting address to coordinates:', error);
      return null;
    }
  }

  ensureLocationHasGeohash(location: LocationData): LocationData {
    if (!location.geohash) {
      return {
        ...location,
        geohash: this.googleMapsService.generateGeohash(location.latitude, location.longitude)
      };
    }
    return location;
  }
}
