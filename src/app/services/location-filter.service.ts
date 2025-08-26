import { Injectable, inject, signal, computed } from '@angular/core';
import { LocationService, LocationData } from './location.service';
import { UserSearchService } from './user-search.service';
import { Project } from './models/project.models';
import { AuthService } from './auth.service';

export interface LocationFilter {
  userLocation: LocationData | null;
  scope: string;
  userId: string;
}

export interface FilteredProjects {
  projects: Project[];
  hasMore: boolean;
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocationFilterService {
  private locationService = inject(LocationService);
  private userSearchService = inject(UserSearchService);
  private authService = inject(AuthService);

  private _filteredProjects = signal<Project[]>([]);
  private _currentPage = signal(1);
  private _hasMore = signal(true);
  private _isLoading = signal(false);
  private _userLocation = signal<LocationData | null>(null);

  filteredProjects = this._filteredProjects.asReadonly();
  currentPage = this._currentPage.asReadonly();
  hasMore = this._hasMore.asReadonly();
  isLoading = this._isLoading.asReadonly();
  userLocation = this._userLocation.asReadonly();

  private readonly PROJECTS_PER_PAGE = 5;
  private readonly LOCATION_RADIUS_KM = {
    local: 10,      // 10km for local projects
    state: 100,     // 100km for state projects  
    national: 1000, // 1000km for national projects
    global: Infinity // No limit for global projects
  };

  constructor() {
    this.loadUserLocation();
  }

  private async loadUserLocation() {
    try {
      const currentUser = this.authService.user();
      if (currentUser) {
        const userProfile = await this.userSearchService.getUserProfile(currentUser.uid);
        if (userProfile?.location) {
          this._userLocation.set(userProfile.location);
        }
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  }

  async refreshUserLocation() {
    await this.loadUserLocation();
  }

  filterProjectsByLocation(projects: Project[], scope: string, userId: string): Project[] {
    // If scope is 'all', return all projects
    if (scope === 'all') {
      return projects;
    }
    
    const userLocation = this._userLocation();
    
    if (!userLocation) {
      // If no location, apply basic scope filtering
      return this.filterByScopeOnly(projects, scope, userId);
    }

    switch (scope) {
      case 'my-projects':
        return this.filterMyProjects(projects, userId);
      
      case 'grupal':
        return this.filterGrupalProjects(projects, userId);
      
      case 'local':
      case 'state':
      case 'national':
        return this.filterByLocationAndScope(projects, scope, userLocation);
      
      case 'global':
        return projects; // All projects for global scope
      
      default:
        return projects;
    }
  }

  private filterMyProjects(projects: Project[], userId: string): Project[] {
    return projects.filter(project => 
      project.createdBy === userId || 
      project.collaborators?.some(c => c.uid === userId)
    );
  }

  private filterGrupalProjects(projects: Project[], userId: string): Project[] {
    return projects.filter(project => 
      project.createdBy === userId || 
      project.collaborators?.some(c => c.uid === userId)
    );
  }

  private filterByLocationAndScope(projects: Project[], scope: string, userLocation: LocationData): Project[] {
    const radiusKm = this.LOCATION_RADIUS_KM[scope as keyof typeof this.LOCATION_RADIUS_KM] || Infinity;
    
    return projects.filter(project => {
      if (!project.location) return false;
      
      const distance = this.calculateDistance(
        userLocation.latitude, 
        userLocation.longitude,
        project.location.latitude, 
        project.location.longitude
      );
      
      return distance <= radiusKm;
    });
  }

  private filterByScopeOnly(projects: Project[], scope: string, userId: string): Project[] {
    switch (scope) {
      case 'grupal':
        return this.filterGrupalProjects(projects, userId);
      case 'global':
        return projects;
      default:
        // For local/state/national without location, return empty array
        return [];
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  getPaginatedProjects(projects: Project[], page: number): Project[] {
    const startIndex = (page - 1) * this.PROJECTS_PER_PAGE;
    const endIndex = startIndex + this.PROJECTS_PER_PAGE;
    return projects.slice(startIndex, endIndex);
  }

  async loadMoreProjects(allProjects: Project[], scope: string, userId: string): Promise<boolean> {
    if (this._isLoading()) return false;
    
    this._isLoading.set(true);
    
    try {
      const filteredProjects = this.filterProjectsByLocation(allProjects, scope, userId);
      const nextPage = this._currentPage() + 1;
      const paginatedProjects = this.getPaginatedProjects(filteredProjects, nextPage);
      
      if (paginatedProjects.length > 0) {
        this._filteredProjects.update(current => [...current, ...paginatedProjects]);
        this._currentPage.set(nextPage);
        this._hasMore.set(paginatedProjects.length === this.PROJECTS_PER_PAGE);
        return true;
      } else {
        this._hasMore.set(false);
        return false;
      }
    } catch (error) {
      console.error('Error loading more projects:', error);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  resetPagination() {
    this._currentPage.set(1);
    this._hasMore.set(true);
    this._filteredProjects.set([]);
  }

  setInitialProjects(projects: Project[], scope: string, userId: string) {
    const filteredProjects = this.filterProjectsByLocation(projects, scope, userId);
    const initialProjects = this.getPaginatedProjects(filteredProjects, 1);
    
    this._filteredProjects.set(initialProjects);
    this._currentPage.set(1);
    this._hasMore.set(filteredProjects.length > this.PROJECTS_PER_PAGE);
  }

  getTotalFilteredCount(allProjects: Project[], scope: string, userId: string): number {
    const filteredProjects = this.filterProjectsByLocation(allProjects, scope, userId);
    return filteredProjects.length;
  }
}
