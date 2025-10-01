import { Component, inject, signal, computed, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController, IonInput } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { UserSearchService } from '../services/user-search.service';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

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
  private userSearchService = inject(UserSearchService);
  private navCtrl = inject(NavController);
  private firestore = inject(Firestore);
  private toastCtrl = inject(ToastController);

  @ViewChild('addressInput', { static: false }) addressInput!: IonInput;

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  
  userLocation = signal<any>(null);
  isLoading = signal(false);
  showChangeLocation = signal(false);
  isSaving = signal(false);
  
  // New location input
  newAddress = '';
  selectedPlace: any = null;

  userLocationData = computed(() => {
    return this.userLocation();
  });

  async ngOnInit() {
    await this.loadUserLocation();
  }

  async loadUserLocation() {
    try {
      this.isLoading.set(true);
      const currentUser = this.user();
      if (currentUser) {
        const userProfile = await this.userSearchService.getUserProfile(currentUser.uid);
        if (userProfile?.location) {
          this.userLocation.set(userProfile.location);
        } else {
          // Set default location
          this.userLocation.set({
            city: 'Córdoba Capital',
            state: 'Córdoba',
            country: 'Argentina'
          });
        }
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleChangeLocation() {
    const currentShow = this.showChangeLocation();
    this.showChangeLocation.set(!currentShow);
    
    if (!currentShow) {
      // Initialize Google Places Autocomplete after view is ready
      setTimeout(() => {
        this.initializeAutocomplete();
      }, 100);
    }
  }

  cancelChange() {
    this.showChangeLocation.set(false);
    this.newAddress = '';
    this.selectedPlace = null;
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

  async saveNewLocation() {
    if (!this.selectedPlace || !this.newAddress.trim()) {
      await this.showToast('Please select a location from the suggestions', 'warning');
      return;
    }

    try {
      this.isSaving.set(true);
      const currentUser = this.user();
      
      if (currentUser) {
        const place = this.selectedPlace;
        const newLocation = {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          address: place.formatted_address,
          city: this.extractAddressComponent(place, 'locality') || this.extractAddressComponent(place, 'administrative_area_level_2'),
          state: this.extractAddressComponent(place, 'administrative_area_level_1'),
          country: this.extractAddressComponent(place, 'country'),
          accuracy: 0,
          timestamp: Date.now()
        };

        // Update in Firestore
        const userRef = doc(this.firestore, `users/${currentUser.uid}`);
        await updateDoc(userRef, {
          location: newLocation,
          updatedAt: new Date().toISOString()
        });

        // Update local state
        this.userLocation.set(newLocation);
        this.showChangeLocation.set(false);
        this.newAddress = '';
        this.selectedPlace = null;
        
        await this.showToast('Location updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      await this.showToast('Error updating location', 'danger');
    } finally {
      this.isSaving.set(false);
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

  goBack() {
    this.navCtrl.back();
  }
}

