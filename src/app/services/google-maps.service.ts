import { Injectable, signal } from '@angular/core';

declare var google: any;

export interface AddressComponents {
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  formattedAddress?: string;
}

export interface CoordinateLocation {
  latitude: number;
  longitude: number;
  geohash?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private geocodingCache = new Map<string, AddressComponents>();
  private geocodingInProgress = new Set<string>();
  private lastGeocodingTime = 0;
  private readonly GEOCODING_RATE_LIMIT = 1000;

  private _isLoading = signal(false);
  isLoading = this._isLoading.asReadonly();

  async coordinatesToAddress(latitude: number, longitude: number): Promise<AddressComponents | null> {
    const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    
    if (this.geocodingCache.has(cacheKey)) {
      return this.geocodingCache.get(cacheKey)!;
    }
    
    if (this.geocodingInProgress.has(cacheKey)) {
      return null;
    }
    
    const now = Date.now();
    if (now - this.lastGeocodingTime < this.GEOCODING_RATE_LIMIT) {
      await new Promise(resolve => setTimeout(resolve, this.GEOCODING_RATE_LIMIT));
    }
    
    this.geocodingInProgress.add(cacheKey);
    this.lastGeocodingTime = Date.now();
    this._isLoading.set(true);
    
    try {
      if (typeof google === 'undefined' || !google.maps) {
        throw new Error('Google Maps API not loaded');
      }

      const geocoder = new google.maps.Geocoder();
      const latlng = { lat: latitude, lng: longitude };

      return new Promise((resolve) => {
        geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const addressComponents = this.parseAddressComponents(result);
            
            this.geocodingCache.set(cacheKey, addressComponents);
            resolve(addressComponents);
          } else {
            console.warn('Geocoding failed:', status);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error in coordinatesToAddress:', error);
      return null;
    } finally {
      this.geocodingInProgress.delete(cacheKey);
      this._isLoading.set(false);
    }
  }

  async addressToCoordinates(address: string): Promise<CoordinateLocation | null> {
    if (!address.trim()) {
      return null;
    }

    this._isLoading.set(true);
    
    try {
      if (typeof google === 'undefined' || !google.maps) {
        throw new Error('Google Maps API not loaded');
      }

      const geocoder = new google.maps.Geocoder();

      return new Promise((resolve) => {
        geocoder.geocode({ address }, (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const location = result.geometry.location;
            
            const coordinates: CoordinateLocation = {
              latitude: location.lat(),
              longitude: location.lng(),
              geohash: this.generateGeohash(location.lat(), location.lng())
            };
            
            resolve(coordinates);
          } else {
            console.warn('Geocoding failed:', status);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error in addressToCoordinates:', error);
      return null;
    } finally {
      this._isLoading.set(false);
    }
  }

  private parseAddressComponents(result: any): AddressComponents {
    const components: AddressComponents = {
      formattedAddress: result.formatted_address
    };

    if (result.address_components) {
      for (const component of result.address_components) {
        const types = component.types;
        
        if (types.includes('locality')) {
          components.city = component.long_name;
        } else if (types.includes('administrative_area_level_2') && !components.city) {
          components.city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          components.state = component.long_name;
        } else if (types.includes('country')) {
          components.country = component.long_name;
          components.countryCode = component.short_name;
        }
      }
    }

    return components;
  }

  generateGeohash(latitude: number, longitude: number, precision: number = 7): string {
    const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let lat = latitude;
    let lon = longitude;
    let latRange = [-90, 90];
    let lonRange = [-180, 180];
    let geohash = '';
    let bits = 0;
    let bit = 0;
    let even = true;

    while (geohash.length < precision) {
      if (even) {
        const mid = (lonRange[0] + lonRange[1]) / 2;
        if (lon >= mid) {
          bit = (bit << 1) + 1;
          lonRange[0] = mid;
        } else {
          bit = bit << 1;
          lonRange[1] = mid;
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (lat >= mid) {
          bit = (bit << 1) + 1;
          latRange[0] = mid;
        } else {
          bit = bit << 1;
          latRange[1] = mid;
        }
      }

      even = !even;
      bits++;

      if (bits === 5) {
        geohash += BASE32[bit];
        bits = 0;
        bit = 0;
      }
    }

    return geohash;
  }

  getGeohashRange(geohash: string): { min: string; max: string } {
    const lastChar = geohash.slice(-1);
    const prefix = geohash.slice(0, -1);
    const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    const index = BASE32.indexOf(lastChar);
    
    return {
      min: prefix + BASE32[index],
      max: prefix + BASE32[Math.min(index + 1, BASE32.length - 1)]
    };
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  clearCache(): void {
    this.geocodingCache.clear();
    this.geocodingInProgress.clear();
  }

  getCacheSize(): number {
    return this.geocodingCache.size;
  }
}
