import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { NavController, ViewWillEnter } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { ProjectsService } from '../services/projects.service';
import { Project } from '../services/models/project.models';
import { ConnectionService } from '../services/connection.service';
import { Router } from '@angular/router';
import { LocationService } from '../services/location.service';
import { UserSearchService } from '../services/user-search.service';
import { FirebaseQueryService } from '../services/firebase-query.service';
import { FilterStateService } from '../services/filter-state.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, ViewWillEnter {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private navCtrl = inject(NavController);
  private projectsService = inject(ProjectsService);
  private connectionService = inject(ConnectionService);
  private router = inject(Router);
  private locationService = inject(LocationService);
  private userSearchService = inject(UserSearchService);
  private firebaseQueryService = inject(FirebaseQueryService);
  private filterStateService = inject(FilterStateService);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  isDark = this.themeService.isDark;
  location = this.locationService.location;
  
  allProjects = this.projectsService.projects;
  filteredProjects = this.projectsService.filteredProjects;
  isLoadingFiltered = this.projectsService.isLoadingFiltered;
  hasMoreFiltered = this.projectsService.hasMoreFiltered;
  expandedComments = signal<string | null>(null);
  expandedCollaborators = signal<string | null>(null);
  userLocation = this.locationService.userLocation;
  currentScope = signal('all');
  isLoadingMore = false;
  isRequestingLocation = signal(false);
  private isGettingAddress = false;
  showLocationChangeFlag = signal(false);
  newLocation: any = null;
  locationChangeDismissed = signal(false);

  projects = computed(() => {
    const filteredProjects = this.projectsService.filteredProjects();
    const allProjects = this.projectsService.projects();
    const isFilterActive = this.currentScope() !== 'all';
    

    
    if (isFilterActive && filteredProjects.length > 0) {
      return filteredProjects;
    } else if (isFilterActive && filteredProjects.length === 0) {
      return []; // Show empty when filter is active but no results
    } else {
      // When no filter is active, use filteredProjects which contains properly filtered "all" projects
      // This ensures grupal projects are only shown if user has access
      const result = filteredProjects.length > 0 ? filteredProjects : allProjects;
      

      
      return result;
    }
  });

  isFilterActive = computed(() => {
    return this.currentScope() !== 'all';
  });

  constructor() {
    // Remove the automatic loading effect that was causing unnecessary queries
    // Projects will now only be loaded when explicitly needed in ionViewWillEnter
  }

  async presentSettingsModal() {
    this.navCtrl.navigateForward('/settings');
  }

  async logout() {
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  createNew() {
    this.navCtrl.navigateForward('/new-item');
  }

  navigateToProject(project: Project) {
    // If project is done, always navigate to public page
    if (project.state === 'done') {
      this.navCtrl.navigateForward(`/project/${project.id}/public`);
      return;
    }
    
    const currentUser = this.user();
    if (currentUser && (project.creator?.uid === currentUser.uid || 
        (project.collaborators || []).some(c => c.uid === currentUser.uid))) {
      this.navCtrl.navigateForward(`/project/${project.id}/private`);
    } else {
      this.navCtrl.navigateForward(`/project/${project.id}/public`);
    }
  }

  ngOnInit() {
    this.checkConnection();
    this.loadUserLocation();
  }

  async ionViewWillEnter() {
    this.checkConnection();
    
    const selectedScope = this.filterStateService.getSelectedScope();
    const previousScope = this.currentScope();
    
    // Update current scope
    this.currentScope.set(selectedScope);
    
    // Always load user location first to get the most current location
    await this.loadUserLocation();
    
    // Get the current location after loading
    const currentLocation = this.locationService.userLocation().userLocation;
    
    // Check if we need to query Firebase
    const shouldQueryFirebase = this.shouldQueryFirebase(selectedScope, previousScope, currentLocation);
    
    if (shouldQueryFirebase) {
      // Update filter state with current values
      this.filterStateService.setSelectedScope(selectedScope);
      if (currentLocation) {
        this.filterStateService.setLastLocation(currentLocation);
      }
      this.filterStateService.updateLastQueryTime();
      
      // Load projects only if filters have changed
      if (selectedScope !== 'all') {
        await this.projectsService.setFilteredProjects(selectedScope);
      } else {
        await this.projectsService.resetFilteredProjects();
      }
    }
  }

  private shouldQueryFirebase(selectedScope: string, previousScope: string, currentLocation: any): boolean {
    // Query Firebase if:
    // 1. No filtered projects are loaded, OR
    // 2. The scope has changed, OR
    // 3. The location has changed (which affects local/national filtering), OR
    // 4. It's been more than 5 minutes since last query (optional refresh)
    
    const hasFilteredProjects = this.projectsService.hasFilteredProjectsLoaded();
    const scopeChanged = previousScope !== selectedScope;
    const locationChanged = this.filterStateService.hasLocationChanged(currentLocation);
    const anyFilterChanged = this.filterStateService.hasAnyFilterChanged();
    
    // Always query if no projects are loaded
    if (!hasFilteredProjects) {
      return true;
    }
    
    // Query if scope changed
    if (scopeChanged) {
      return true;
    }
    
    // Query if location changed (important for local/national filtering)
    if (locationChanged) {
      return true;
    }
    
    // Query if any other filter changed or it's been a while
    if (anyFilterChanged) {
      return true;
    }
    
    // Don't query if nothing has changed
    return false;
  }

  navigateToFilterPage() {
    this.navCtrl.navigateForward('/filter');
  }

  applyFilter() {
    if (this.currentScope() === 'all') {
      this.projectsService.resetFilteredProjects();
    } else {
      this.projectsService.setFilteredProjects(this.currentScope());
    }
    this.navCtrl.back();
  }

  resetFilter() {
    this.currentScope.set('all');
    this.projectsService.resetFilteredProjects();
    this.navCtrl.back();
  }

  async loadUserLocation() {
    try {
      const currentUser = this.user();
      if (currentUser) {
        // Use centralized location service
        const userLocation = await this.locationService.loadUserLocation(this.userSearchService, currentUser);
        
        if (userLocation) {
          // If we have coordinates but no address, get the address using the existing service
          if (userLocation.latitude && userLocation.longitude && !userLocation.address) {
            const locationWithAddress = await this.locationService.getLocationWithAddress();
            if (locationWithAddress) {
              this.locationService.setUserLocation(locationWithAddress);
            }
          }
          
          // Always check for location change when loading user location
          await this.checkForLocationChange();
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
      this.isRequestingLocation.set(true);
      const hasPermission = await this.locationService.requestLocationPermission();
      if (hasPermission) {
        const locationData = await this.locationService.getLocationWithAddress();
        if (locationData) {
          this.locationService.setUserLocation(locationData);
        }
      }
    } catch (error) {
      console.error('Error requesting location access:', error);
    } finally {
      this.isRequestingLocation.set(false);
    }
  }

  private checkConnection() {
    if (!this.connectionService.isOnline()) {
      this.router.navigate(['/no-connection']);
      return;
    }
  }

  async refreshProjects(event?: any) {
    if (event) {
      event.target.complete();
    }
    
    // Force refresh by querying Firebase again
    const selectedScope = this.filterStateService.getSelectedScope();
    this.currentScope.set(selectedScope);
    
    // Update filter state to force refresh
    this.filterStateService.updateLastQueryTime();
    
    if (selectedScope !== 'all') {
      await this.projectsService.setFilteredProjects(selectedScope);
    } else {
      await this.projectsService.resetFilteredProjects();
    }
  }

  async loadMoreProjects(event: any) {
    if (this.isLoadingMore) {
      event.target.complete();
      return;
    }

    this.isLoadingMore = true;
    
    try {
      let hasMore = false;
      
      if (this.isFilterActive()) {
        hasMore = await this.projectsService.loadMoreFilteredProjects();
      } else {
        // For 'all' scope, also load more projects
        hasMore = await this.projectsService.loadMoreAllProjects();
      }
      
      if (!hasMore) {
        event.target.disabled = true;
      }
    } catch (error) {
      console.error('Error loading more projects:', error);
    } finally {
      this.isLoadingMore = false;
      event.target.complete();
    }
  }

  changeScope(scope: string) {
    this.currentScope.set(scope);
  }

  async supportProject(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    try {
      const currentUser = this.user();
      if (!currentUser?.uid) return;

      await this.projectsService.toggleSupport(projectId, currentUser.uid);
    } catch (error) {
      console.error('Error supporting project:', error);
    }
  }

  async opposeProject(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    try {
      const currentUser = this.user();
      if (!currentUser?.uid) return;

      await this.projectsService.toggleOppose(projectId, currentUser.uid);
    } catch (error) {
      console.error('Error opposing project:', error);
    }
  }

  async verifyProject(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    try {
      const currentUser = this.user();
      if (!currentUser?.uid) return;

      await this.projectsService.toggleVerify(projectId, currentUser.uid);
    } catch (error) {
      console.error('Error verifying project:', error);
    }
  }

  async followProject(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    try {
      const currentUser = this.user();
      if (!currentUser?.uid) return;

      await this.projectsService.toggleFollow(projectId, currentUser.uid);
    } catch (error) {
      console.error('Error following project:', error);
    }
  }

  toggleComments(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    // Close collaborators if it's open for the same project
    if (this.expandedCollaborators() === projectId) {
      this.expandedCollaborators.set(null);
    }
    // Toggle comments
    if (this.expandedComments() === projectId) {
      this.expandedComments.set(null);
    } else {
      this.expandedComments.set(projectId);
    }
  }

  async addComment(projectId: string, commentText: string) {
    try {
      const currentUser = this.user();
      if (!currentUser?.uid) return;

      await this.projectsService.addComment(projectId, commentText);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  toggleCollaborators(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    // Close comments if it's open for the same project
    if (this.expandedComments() === projectId) {
      this.expandedComments.set(null);
    }
    // Toggle collaborators
    if (this.expandedCollaborators() === projectId) {
      this.expandedCollaborators.set(null);
    } else {
      this.expandedCollaborators.set(projectId);
    }
  }

  async requestCollaboration(projectId: string, message: string) {
    try {
      await this.projectsService.requestCollaboration(projectId, message);
    } catch (error) {
      console.error('Error requesting collaboration:', error);
    }
  }

  showLocationModal() {
    this.navCtrl.navigateForward('/location', {
      state: {
        userLocation: this.userLocation().userLocation,
        showLocationChangeFlag: this.showLocationChangeFlag(),
        newLocation: this.newLocation,
        locationChangeDismissed: this.locationChangeDismissed()
      }
    });
  }

  getFormattedAddress(): string {
    const userLocation = this.userLocation().userLocation;
    if (!userLocation) {
      return 'Location not available';
    }

    // If we have coordinates but no address, trigger address retrieval and show loading message
    if (userLocation.latitude && userLocation.longitude && !userLocation.address) {
      this.ensureLocationHasAddress();
      return 'Getting address...';
    }

    const parts = [];
    
    if (userLocation.address) {
      const addressParts = userLocation.address.split(',');
      
      if (addressParts.length > 0) {
        parts.push(addressParts[0].trim());
      }
    }
    
    // Add city from userLocation object
    if (userLocation.city) {
      parts.push(userLocation.city);
    }
    
    // Add country from userLocation object
    if (userLocation.country) {
      parts.push(userLocation.country);
    }
    
    return parts.length > 0 ? parts.join(', ') : (userLocation.address || 'Location not available');
  }

  async checkForLocationChange() {
    try {
      // Only check if user hasn't already dismissed the location change
      if (this.locationChangeDismissed()) {
        return;
      }
      
      const currentLocation = await this.locationService.getLocationWithAddress();
      const userLocation = this.userLocation().userLocation;
      
      if (currentLocation && userLocation) {
        // Check if city has changed - normalize cities for comparison
        const currentCity = (currentLocation.city || '').toLowerCase().trim();
        const savedCity = (userLocation.city || '').toLowerCase().trim();
        
        // Only show location change if cities are different and both are valid
        if (currentCity && savedCity && currentCity !== savedCity) {
          this.newLocation = currentLocation;
          this.showLocationChangeFlag.set(true);
        } else {
          // If cities match, ensure the flag is false
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
        this.locationService.setUserLocation(locationToAccept);
        
        // Update filter state service to track location change
        this.filterStateService.setLastLocation(locationToAccept);
        
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


  async ensureLocationHasAddress() {
    if (this.isGettingAddress) {
      return; // Already getting address, don't call again
    }
    
    const userLocation = this.userLocation().userLocation;
    if (userLocation && userLocation.latitude && userLocation.longitude && !userLocation.address) {
      this.isGettingAddress = true;
      try {
        const locationWithAddress = await this.locationService.getLocationWithAddress();
        if (locationWithAddress && locationWithAddress.address) {
          this.locationService.setUserLocation(locationWithAddress);
        }
      } catch (error) {
        console.warn('Could not get address for location, using coordinates only:', error);
        // Don't log as error since this is expected behavior when geocoding fails
      } finally {
        this.isGettingAddress = false;
      }
    }
  }


}
