import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private _authLoading = signal<boolean>(true);
  private _projectsLoading = signal<boolean>(false);
  private _globalLoading = signal<boolean>(false);

  authLoading = this._authLoading.asReadonly();
  projectsLoading = this._projectsLoading.asReadonly();
  globalLoading = this._globalLoading.asReadonly();

  isLoading = computed(() => 
    this._authLoading() || 
    this._projectsLoading() || 
    this._globalLoading()
  );

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

