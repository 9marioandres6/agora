import { Injectable } from '@angular/core';

declare var google: any;

export interface PlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private autocompleteService: any;
  private placesService: any;
  private isLoaded = false;

  constructor() {
    this.initializeGoogleMaps();
  }

  private initializeGoogleMaps() {
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      try {
        this.autocompleteService = new google.maps.places.AutocompleteService();
        this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
        this.isLoaded = true;
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        setTimeout(() => this.initializeGoogleMaps(), 1000);
      }
    } else {
      setTimeout(() => this.initializeGoogleMaps(), 1000);
    }
  }

  async searchPlaces(input: string, type: 'city' | 'country' = 'city'): Promise<PlaceResult[]> {
    if (!this.isLoaded || !this.autocompleteService) {
      await this.waitForGoogleMaps();
    }

    return new Promise((resolve, reject) => {
      if (!this.autocompleteService) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const request = {
        input: input,
        types: type === 'city' ? ['(cities)'] : ['country'],
        language: 'en'
      };

      this.autocompleteService.getPlacePredictions(request, (predictions: any[], status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          const results: PlaceResult[] = predictions.map(prediction => ({
            place_id: prediction.place_id,
            description: prediction.description,
            structured_formatting: prediction.structured_formatting
          }));
          resolve(results);
        } else {
          resolve([]);
        }
      });
    });
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    if (!this.isLoaded || !this.placesService) {
      await this.waitForGoogleMaps();
    }

    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const request = {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'address_components', 'geometry']
      };

      this.placesService.getDetails(request, (place: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(new Error('Place details not found'));
        }
      });
    });
  }

  private async waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve) => {
      const checkGoogleMaps = () => {
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
          this.autocompleteService = new google.maps.places.AutocompleteService();
          this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
          this.isLoaded = true;
          resolve();
        } else {
          setTimeout(checkGoogleMaps, 100);
        }
      };
      checkGoogleMaps();
    });
  }

  isGoogleMapsLoaded(): boolean {
    return this.isLoaded;
  }
}
