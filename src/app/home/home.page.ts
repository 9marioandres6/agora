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
import { LocationFilterService } from '../services/location-filter.service';

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
  private locationFilterService = inject(LocationFilterService);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  isDark = this.themeService.isDark;
  location = this.locationService.location;
  
  allProjects = this.projectsService.projects;
  filteredProjects = this.projectsService.filteredProjects;
  expandedComments = signal<string | null>(null);
  expandedCollaborators = signal<string | null>(null);
  userLocation: any = null;
  currentScope = signal('all'); // Default to show all projects
  isLoadingMore = false;
  showFilter = false;
  isFilterActive = signal(false);

  projects = computed(() => {
    if (this.isFilterActive()) {
      return this.projectsService.filteredProjects();
    } else {
      return this.projectsService.projects();
    }
  });

  constructor() {
    effect(() => {
      const projects = this.projectsService.projects();
      if (projects.length > 0 && this.isFilterActive()) {
        this.projectsService.setFilteredProjects(this.currentScope());
      }
    });
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
    // Check if user is creator or editor of the project
    const currentUser = this.user();
    if (currentUser && (project.creator?.uid === currentUser.uid || 
        (project.collaborators || []).some(c => c.uid === currentUser.uid))) {
      // User is creator or editor - navigate to private page
      this.navCtrl.navigateForward(`/project/${project.id}/private`);
    } else {
      // User is viewer - navigate to public page
      this.navCtrl.navigateForward(`/project/${project.id}/public`);
    }
  }

  ngOnInit() {
    this.checkConnection();
    this.loadUserLocation();
  }

  ionViewWillEnter() {
    this.checkConnection();
    this.loadUserLocation();
  }

  showFilterModal() {
    this.showFilter = true;
  }

  closeFilterModal() {
    this.showFilter = false;
  }

  applyFilter() {
    if (this.currentScope() === 'all') {
      this.isFilterActive.set(false);
      this.projectsService.resetFilteredProjects();
    } else {
      this.isFilterActive.set(true);
      this.projectsService.setFilteredProjects(this.currentScope());
    }
    this.closeFilterModal();
  }

  resetFilter() {
    this.isFilterActive.set(false);
    this.currentScope.set('all');
    this.projectsService.resetFilteredProjects();
    this.closeFilterModal();
  }

  async loadUserLocation() {
    try {
      const currentUser = this.user();
      if (currentUser) {
        const userProfile = await this.userSearchService.getUserProfile(currentUser.uid);
        if (userProfile?.location) {
          this.userLocation = userProfile.location;
        }
      }
    } catch (error) {
      console.error('Error loading user location:', error);
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
  }

  async loadMoreProjects(event: any) {
    if (this.isLoadingMore) {
      event.target.complete();
      return;
    }

    this.isLoadingMore = true;
    
    try {
      if (this.isFilterActive()) {
        const hasMore = await this.projectsService.loadMoreFilteredProjects(this.currentScope());
        if (!hasMore) {
          event.target.disabled = true;
        }
      } else {
        event.target.complete();
        return;
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

  toggleComments(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
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
