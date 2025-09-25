import { Component, inject, signal, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ModalController, IonInput, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { ProjectsService } from '../services/projects.service';
import { SupabaseService } from '../services/supabase.service';
import { UserSearchService, UserProfile } from '../services/user-search.service';
import { ScopeSelectorModalComponent } from '../scope-selector-modal/scope-selector-modal.component';
import { ScopeOption } from './models/new-item.models';
import { Need, Media, Collaborator, Scope } from '../services/models/project.models';
import { LocationService } from '../services/location.service';
import { ImageFallbackDirective } from '../directives/image-fallback.directive';

@Component({
  selector: 'app-new-item',
  templateUrl: './new-item.component.html',
  styleUrls: ['./new-item.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule, ImageFallbackDirective]
})
export class NewItemComponent implements OnInit, AfterViewInit {
  @ViewChild('titleInput', { static: false }) titleInput!: IonInput;

  private authService = inject(AuthService);
  private navCtrl = inject(NavController);
  private themeService = inject(ThemeService);
  private projectsService = inject(ProjectsService);
  private modalCtrl = inject(ModalController);
  private supabaseService = inject(SupabaseService);
  private userSearchService = inject(UserSearchService);
  private toastCtrl = inject(ToastController);
  private locationService = inject(LocationService);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  isDark = signal(this.themeService.isDarkMode());

  title = '';
  description = '';
  needs: Need[] = [];
  scope = '';
  isSaving = false;
  projectMedia: Media[] = [];
  
  searchTerm = '';
  searchResults: UserProfile[] = [];
  isSearching = false;
  selectedCollaborators: Collaborator[] = [];
  userLocation: any = null;

  scopeOptions: ScopeOption[] = [
    { value: 'grupal', label: 'Grupal - Small Group Collaboration', icon: 'people' },
    { value: 'local', label: 'Local - Neighbourhood/Community', icon: 'home' },
    { value: 'state', label: 'State - State/Province level', icon: 'business' },
    { value: 'national', label: 'National - Country level', icon: 'flag' },
    { value: 'global', label: 'Global - International level', icon: 'globe' }
  ];



  async searchUsers() {
    if (!this.searchTerm.trim() || this.searchTerm.length < 2) {
      this.searchResults = [];
      return;
    }

    try {
      this.isSearching = true;
      const allUsers = await this.userSearchService.searchUsers(this.searchTerm);
      
      // Filter out users who are already selected as collaborators and the current user
      const currentUser = this.user();
      this.searchResults = allUsers.filter(user => 
        user.uid !== currentUser?.uid && 
        !this.selectedCollaborators.some(collaborator => collaborator.uid === user.uid)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      this.searchResults = [];
    } finally {
      this.isSearching = false;
    }
  }

  addCollaborator(user: UserProfile) {
    if (this.selectedCollaborators.some(c => c.uid === user.uid)) {
      this.showToast('User is already a collaborator', 'warning');
      return;
    }

    const collaborator: Collaborator = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      joinedAt: new Date().toISOString(),
      role: 'collaborator'
    };

    this.selectedCollaborators.push(collaborator);
    this.searchTerm = '';
    
    // Refresh search results to remove the added user
    if (this.searchTerm.trim().length >= 2) {
      this.searchUsers();
    } else {
      this.searchResults = [];
    }
    
    this.showToast('Collaborator added successfully', 'success');
  }

  removeCollaborator(collaborator: Collaborator) {
    this.selectedCollaborators = this.selectedCollaborators.filter(c => c.uid !== collaborator.uid);
    
    // Refresh search results to show the removed user again if there's an active search
    if (this.searchTerm.trim().length >= 2) {
      this.searchUsers();
    }
    
    this.showToast('Collaborator removed successfully', 'success');
  }

  clearSearch() {
    this.searchTerm = '';
  }



  onSearchInput() {
    if (this.searchTerm.trim().length >= 2) {
      this.searchUsers();
    } else {
      this.searchResults = [];
    }
  }

  getScopeIcon(scope: string): string {
    const scopeOption = this.scopeOptions.find(option => option.value === scope);
    return scopeOption ? scopeOption.icon : 'help-circle';
  }

  getScopeLabel(scope: string): string {
    const scopeOption = this.scopeOptions.find(option => option.value === scope);
    return scopeOption ? scopeOption.value : scope;
  }

  async openScopeModal() {
    const modal = await this.modalCtrl.create({
      component: ScopeSelectorModalComponent,
      componentProps: {
        scopeOptions: this.scopeOptions,
        selectedScope: this.scope
      },
      cssClass: 'scope-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.selectedScope) {
        this.scope = result.data.selectedScope;
      }
    });

    await modal.present();
  }

  showAddMediaModal() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*';
    fileInput.multiple = false;
    
    fileInput.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        this.handleFileUpload(Array.from(files));
      }
    };
    
    fileInput.click();
  }

  replaceMedia() {
    this.showAddMediaModal();
  }

  async handleFileUpload(files: File[]) {
    const maxFileSize = 10 * 1024 * 1024;
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    for (const file of files) {
      try {
        if (file.size > maxFileSize) {
          await this.showToast(`File ${file.name} is too large. Maximum size is 10MB.`, 'warning');
          continue;
        }
        
        const isValidImage = allowedImageTypes.includes(file.type);
        const isValidVideo = allowedVideoTypes.includes(file.type);
        
        if (!isValidImage && !isValidVideo) {
          await this.showToast(`File ${file.name} has an unsupported type.`, 'warning');
          continue;
        }
        
        await this.showToast(`Uploading ${file.name}...`, 'success');
        
        const uploadResult = await this.supabaseService.uploadFile(
          file, 
          'agora-project', 
          'projects'
        );
        
        if (!uploadResult) {
          await this.showToast(`Failed to upload ${file.name}`, 'danger');
          continue;
        }
        
        const mediaType = isValidImage ? 'image' : 'video';
        
        const newMedia: Media = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: mediaType,
          url: uploadResult.url,
          caption: file.name || `Uploaded ${mediaType}`,
          storagePath: uploadResult.path,
          fileName: file.name,
          fileSize: file.size
        };
        
        this.projectMedia = [newMedia];
        await this.showToast(`Successfully uploaded ${file.name}`, 'success');
        
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        await this.showToast(`Error processing ${file.name}`, 'danger');
      }
    }
  }

  async deleteMedia(media: Media) {
    if (media.storagePath) {
      try {
        const deleted = await this.supabaseService.deleteFile(media.storagePath);
        if (!deleted) {
          await this.showToast(`Warning: Could not delete file from storage`, 'warning');
        }
      } catch (error) {
        console.error('Error deleting file from storage:', error);
        await this.showToast(`Warning: Could not delete file from storage`, 'warning');
      }
    }
    
    this.projectMedia = this.projectMedia.filter(m => m.id !== media.id);
    await this.showToast(`Successfully deleted ${media.caption}`, 'success');
  }

  async saveItem() {
    if (!this.title.trim() || !this.scope) {
      return;
    }

    try {
      this.isSaving = true;
      const currentUser = this.user();
      if (!currentUser?.uid) {
        console.error('User not authenticated');
        return;
      }

      // Use the already loaded user location
      const userLocation = this.userLocation;

      // Create scope object
      const scopeObject: Scope = {
        scope: this.scope,
        place: await this.determinePlaceFromScope(this.scope, userLocation),
        image: ''
      };

      const projectData: any = {
        title: this.title.trim(),
        description: this.description.trim() || '',
        needs: this.needs,
        scope: scopeObject,
        createdBy: currentUser.uid,
        collaborators: this.selectedCollaborators,
        collaborationRequests: [],
        media: this.projectMedia,
        location: userLocation || undefined
      };

      if (userLocation?.address) {
        projectData.locationAddress = userLocation.address;
      }

      const projectId = await this.projectsService.createProject(projectData);

      this.navCtrl.back();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      this.isSaving = false;
    }
  }

  goBack(): void {
    this.navCtrl.back();
  }

  private async determinePlaceFromScope(scope: string, userLocation: any): Promise<string> {
    if (scope === 'grupal') {
      return '';
    }

    if (!userLocation?.latitude || !userLocation?.longitude) {
      return '';
    }

    switch (scope) {
      case 'local':
        return userLocation.city || '';
      case 'state':
        return userLocation.state || '';
      case 'national':
        return userLocation.country || '';
      case 'global':
        return 'Global';
      default:
        return '';
    }
  }

  async ngOnInit() {
    await this.loadUserLocation();
  }

  async loadUserLocation() {
    try {
      const currentUser = this.user();
      if (currentUser) {
        const userProfile = await this.userSearchService.getUserProfile(currentUser.uid);
        if (userProfile?.location) {
          this.userLocation = userProfile.location;
        } else {
          await this.requestLocationAccess();
        }
      }
    } catch (error) {
      console.error('Error loading user location:', error);
      await this.requestLocationAccess();
    }
  }

  async requestLocationAccess() {
    try {
      const hasPermission = await this.locationService.requestLocationPermission();
      if (hasPermission) {
        const locationData = await this.locationService.getLocationWithAddress();
        if (locationData) {
          this.userLocation = locationData;
        }
      }
    } catch (error) {
      console.error('Error requesting location access:', error);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.titleInput) {
        this.titleInput.setFocus();
      }
    }, 300);
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
}
