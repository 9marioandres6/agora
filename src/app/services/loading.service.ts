import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { ConnectionService } from './connection.service';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private connectionService = inject(ConnectionService);
  
  private _authLoading = signal<boolean>(true);
  private _projectsLoading = signal<boolean>(false);
  private _filteredProjectsLoading = signal<boolean>(false);
  private _globalLoading = signal<boolean>(false);

  authLoading = this._authLoading.asReadonly();
  projectsLoading = this._projectsLoading.asReadonly();
  filteredProjectsLoading = this._filteredProjectsLoading.asReadonly();
  globalLoading = this._globalLoading.asReadonly();

  isLoading = computed(() => {
    // Don't show loading if there's no internet connection
    if (!this.connectionService.isOnline()) {
      return false;
    }
    
    return this._authLoading() || 
           this._projectsLoading() || 
           this._filteredProjectsLoading() ||
           this._globalLoading();
  });

  constructor() {
    // Effect to automatically stop loading when connection goes offline
    effect(() => {
      const isOnline = this.connectionService.isOnline();
      if (!isOnline) {
        // Stop all loading states when offline
        this._authLoading.set(false);
        this._projectsLoading.set(false);
        this._filteredProjectsLoading.set(false);
        this._globalLoading.set(false);
      }
    });

    // Safety timeout to prevent loading from getting stuck indefinitely
    this.setupSafetyTimeouts();
  }

  private setupSafetyTimeouts() {
    // Auth loading safety timeout (30 seconds)
    effect(() => {
      if (this._authLoading()) {
        setTimeout(() => {
          if (this._authLoading()) {
            console.warn('Auth loading timeout - forcing to false');
            this._authLoading.set(false);
          }
        }, 30000);
      }
    });

    // Projects loading safety timeout (45 seconds)
    effect(() => {
      if (this._projectsLoading()) {
        setTimeout(() => {
          if (this._projectsLoading()) {
            console.warn('Projects loading timeout - forcing to false');
            this._projectsLoading.set(false);
          }
        }, 45000);
      }
    });

    // Filtered projects loading safety timeout (30 seconds)
    effect(() => {
      if (this._filteredProjectsLoading()) {
        setTimeout(() => {
          if (this._filteredProjectsLoading()) {
            console.warn('Filtered projects loading timeout - forcing to false');
            this._filteredProjectsLoading.set(false);
          }
        }, 30000);
      }
    });

    // Global loading safety timeout (60 seconds)
    effect(() => {
      if (this._globalLoading()) {
        setTimeout(() => {
          if (this._globalLoading()) {
            console.warn('Global loading timeout - forcing to false');
            this._globalLoading.set(false);
          }
        }, 60000);
      }
    });
  }

  setAuthLoading(loading: boolean) {
    this._authLoading.set(loading);
  }

  setProjectsLoading(loading: boolean) {
    this._projectsLoading.set(loading);
  }

  setFilteredProjectsLoading(loading: boolean) {
    this._filteredProjectsLoading.set(loading);
  }

  setGlobalLoading(loading: boolean) {
    this._globalLoading.set(loading);
  }
}

