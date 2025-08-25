import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { ConnectionService } from './connection.service';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private connectionService = inject(ConnectionService);
  
  private _authLoading = signal<boolean>(true);
  private _projectsLoading = signal<boolean>(false);
  private _globalLoading = signal<boolean>(false);

  authLoading = this._authLoading.asReadonly();
  projectsLoading = this._projectsLoading.asReadonly();
  globalLoading = this._globalLoading.asReadonly();

  isLoading = computed(() => {
    // Don't show loading if there's no internet connection
    if (!this.connectionService.isOnline()) {
      return false;
    }
    
    return this._authLoading() || 
           this._projectsLoading() || 
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
        this._globalLoading.set(false);
      }
    });
  }

  setAuthLoading(loading: boolean) {
    this._authLoading.set(loading);
  }

  setProjectsLoading(loading: boolean) {
    this._projectsLoading.set(loading);
  }

  setGlobalLoading(loading: boolean) {
    this._globalLoading.set(loading);
  }
}

