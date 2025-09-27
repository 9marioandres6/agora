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

export interface UserLocationState {
  userLocation: LocationData | null;
  loading: boolean;
  error: string | null;
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
  
  private userLocationState = signal<UserLocationState>({
    userLocation: null,
    loading: false,
    error: null
  });

  userLocation = this.userLocationState.asReadonly();
  
  private geocodingCache = new Map<string, LocationData>();
  private geocodingInProgress = new Set<string>();
  private lastGeocodingTime = 0;
  private readonly GEOCODING_RATE_LIMIT = 1000; // 1 second between requests

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
        // Try multiple geocoding services with fallbacks
        const locationWithAddress = await this.geocodeLocation(location);
        
        if (locationWithAddress) {
          this.locationState.update(state => ({
            ...state,
            location: locationWithAddress
          }));
          return locationWithAddress;
        }
      } catch (error) {
        console.warn('Could not get address for location:', error);
        // If geocoding fails, return the location without address
        return location;
      }
    }

    return location;
  }

  private async geocodeLocation(location: LocationData): Promise<LocationData | null> {
    const lat = location.latitude;
    const lon = location.longitude;
    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    // Check cache first
    if (this.geocodingCache.has(cacheKey)) {
      const cached = this.geocodingCache.get(cacheKey)!;
      return {
        ...location,
        address: cached.address,
        city: cached.city,
        state: cached.state,
        country: cached.country
      };
    }
    
    // Check if geocoding is already in progress for this location
    if (this.geocodingInProgress.has(cacheKey)) {
      return null;
    }
    
    // Rate limiting
    const now = Date.now();
    if (now - this.lastGeocodingTime < this.GEOCODING_RATE_LIMIT) {
      return null;
    }
    
    this.geocodingInProgress.add(cacheKey);
    this.lastGeocodingTime = now;
    
    try {
      // Try multiple geocoding services in order of preference
      const geocodingServices = [
        () => this.tryNominatimDirect(lat, lon),
        () => this.tryNominatimProxy(lat, lon),
        () => this.tryAlternativeGeocoding(lat, lon)
      ];

      for (const service of geocodingServices) {
        try {
          const result = await service();
          if (result) {
            const locationWithAddress = {
              ...location,
              ...result
            };
            
            // Cache the result
            this.geocodingCache.set(cacheKey, locationWithAddress);
            
            return locationWithAddress;
          }
        } catch (error) {
          console.warn('Geocoding service failed:', error);
          continue;
        }
      }

      return null;
    } finally {
      this.geocodingInProgress.delete(cacheKey);
    }
  }

  private async tryNominatimDirect(lat: number, lon: number): Promise<Partial<LocationData> | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AgoraApp/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return this.parseNominatimResponse(data);
    }
    
    return null;
  }

  private async tryNominatimProxy(lat: number, lon: number): Promise<Partial<LocationData> | null> {
    const proxyUrls = [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://api.codetabs.com/v1/proxy?quest='
    ];

    for (const proxyUrl of proxyUrls) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
        const response = await fetch(proxyUrl + encodeURIComponent(nominatimUrl), {
          headers: {
            'User-Agent': 'AgoraApp/1.0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return this.parseNominatimResponse(data);
        }
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  private async tryAlternativeGeocoding(lat: number, lon: number): Promise<Partial<LocationData> | null> {
    // Fallback to a simple coordinate-based address
    return {
      address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown'
    };
  }

  private parseNominatimResponse(data: any): Partial<LocationData> {
    const address = data.display_name;
    const addressDetails = data.address;
    
    return {
      address,
      city: addressDetails?.city || addressDetails?.town || addressDetails?.village || '',
      state: addressDetails?.state || addressDetails?.province || addressDetails?.region || '',
      country: addressDetails?.country_code?.toUpperCase() || addressDetails?.country || ''
    };
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
    this.geocodingCache.clear();
    this.geocodingInProgress.clear();
  }

  getCacheSize(): number {
    return this.geocodingCache.size;
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
}
