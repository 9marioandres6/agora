import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { NavController, ViewWillEnter } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { ProjectsService } from '../services/projects.service';
import { Project } from '../services/models/project.models';
import { ConnectionService } from '../services/connection.service';
import { Router } from '@angular/router';
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
  private userSearchService = inject(UserSearchService);
  private firebaseQueryService = inject(FirebaseQueryService);
  private filterStateService = inject(FilterStateService);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  isDark = this.themeService.isDark;
  
  allProjects = this.projectsService.projects;
  filteredProjects = this.projectsService.filteredProjects;
  isLoadingFiltered = this.projectsService.isLoadingFiltered;
  hasMoreFiltered = this.projectsService.hasMoreFiltered;
  expandedComments = signal<string | null>(null);
  expandedCollaborators = signal<string | null>(null);
  currentScope = signal('all');
  isLoadingMore = false;
  userLocation = signal<any>(null);

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
  
  async loadUserLocation() {
    try {
      const currentUser = this.user();
      if (currentUser) {
        const userProfile = await this.userSearchService.getUserProfile(currentUser.uid);
        if (userProfile?.location) {
          this.userLocation.set(userProfile.location);
        } else {
          // Set default location if user doesn't have one
          this.userLocation.set({
            city: 'Córdoba Capital',
            country: 'Argentina'
          });
        }
      }
    } catch (error) {
      console.error('Error loading user location:', error);
      // Set default location on error
      this.userLocation.set({
        city: 'Córdoba Capital',
        country: 'Argentina'
      });
    }
  }
  
  getFormattedAddress(): string {
    const location = this.userLocation();
    if (!location) {
      return 'Córdoba Capital, Argentina';
    }
    
    const parts = [];
    if (location.city) {
      parts.push(location.city);
    }
    if (location.country) {
      parts.push(location.country);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Córdoba Capital, Argentina';
  }

  navigateToLocation() {
    this.navCtrl.navigateForward('/location');
  }

  async ionViewWillEnter() {
    this.checkConnection();
    
    const selectedScope = this.filterStateService.getSelectedScope();
    const previousScope = this.currentScope();
    
    // Update current scope
    this.currentScope.set(selectedScope);
    
    // Check if we need to query Firebase
    const shouldQueryFirebase = this.shouldQueryFirebase(selectedScope, previousScope);
    
    if (shouldQueryFirebase) {
      // Update filter state with current values
      this.filterStateService.setSelectedScope(selectedScope);
      this.filterStateService.updateLastQueryTime();
      
      // Load projects only if filters have changed
      if (selectedScope !== 'all') {
        await this.projectsService.setFilteredProjects(selectedScope);
      } else {
        await this.projectsService.resetFilteredProjects();
      }
    }
  }

  private shouldQueryFirebase(selectedScope: string, previousScope: string): boolean {
    // Query Firebase if:
    // 1. No filtered projects are loaded, OR
    // 2. The scope has changed, OR
    // 3. It's been more than 5 minutes since last query (optional refresh)
    
    const hasFilteredProjects = this.projectsService.hasFilteredProjectsLoaded();
    const scopeChanged = previousScope !== selectedScope;
    const anyFilterChanged = this.filterStateService.hasAnyFilterChanged();
    
    // Always query if no projects are loaded
    if (!hasFilteredProjects) {
      return true;
    }
    
    // Query if scope changed
    if (scopeChanged) {
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




}
