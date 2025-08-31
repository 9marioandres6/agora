import { Injectable, inject, signal } from '@angular/core';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private locationState = signal<LocationState>({
    location: null,
    loading: false,
    error: null,
    permissionGranted: false
  });

  location = this.locationState.asReadonly();

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
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          const address = data.display_name;
          const addressDetails = data.address;
          
          const locationWithAddress: LocationData = {
            ...location,
            address,
            city: addressDetails?.city || addressDetails?.town || addressDetails?.village || '',
            state: addressDetails?.state || addressDetails?.province || addressDetails?.region || '',
            country: addressDetails?.country_code?.toUpperCase() || addressDetails?.country || ''
          };

          this.locationState.update(state => ({
            ...state,
            location: locationWithAddress
          }));

          return locationWithAddress;
        }
      } catch (error) {
        console.warn('Could not get address for location:', error);
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
}
