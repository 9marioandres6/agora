import { Injectable, signal } from '@angular/core';
import { FilterOptions } from './firebase-query.service';
import { LocationData } from './location.service';

@Injectable({
  providedIn: 'root'
})
export class FilterStateService {
  private _selectedScope = signal<string>('all');
  private _filterOptions = signal<FilterOptions>({
    scope: 'all'
  });
  private _lastLocation = signal<LocationData | null>(null);
  private _lastQueryTime = signal<number>(0);
  
  selectedScope = this._selectedScope.asReadonly();
  filterOptions = this._filterOptions.asReadonly();
  lastLocation = this._lastLocation.asReadonly();
  lastQueryTime = this._lastQueryTime.asReadonly();
  
  setSelectedScope(scope: string) {
    this._selectedScope.set(scope);
    this._filterOptions.update(current => ({
      ...current,
      scope
    }));
  }
  
  getSelectedScope(): string {
    return this._selectedScope();
  }

  setFilterOptions(options: Partial<FilterOptions>) {
    this._filterOptions.update(current => ({
      ...current,
      ...options
    }));
  }

  getFilterOptions(): FilterOptions {
    return this._filterOptions();
  }

  setLastLocation(location: LocationData | null) {
    this._lastLocation.set(location);
  }

  getLastLocation(): LocationData | null {
    return this._lastLocation();
  }

  updateLastQueryTime() {
    this._lastQueryTime.set(Date.now());
  }

  getLastQueryTime(): number {
    return this._lastQueryTime();
  }

  hasLocationChanged(currentLocation: LocationData | null): boolean {
    const lastLocation = this._lastLocation();
    
    // If both are null, no change
    if (!lastLocation && !currentLocation) {
      return false;
    }
    
    // If one is null and the other isn't, there's a change
    if (!lastLocation || !currentLocation) {
      return true;
    }
    
    // Compare relevant location properties
    return (
      lastLocation.city !== currentLocation.city ||
      lastLocation.state !== currentLocation.state ||
      lastLocation.country !== currentLocation.country
    );
  }

  hasFiltersChanged(currentScope: string, currentLocation: LocationData | null): boolean {
    const lastScope = this._selectedScope();
    const lastLocation = this._lastLocation();
    
    // Check if scope has changed
    const scopeChanged = lastScope !== currentScope;
    
    // Check if location has changed
    const locationChanged = this.hasLocationChanged(currentLocation);
    
    return scopeChanged || locationChanged;
  }

  hasAnyFilterChanged(): boolean {
    const currentScope = this._selectedScope();
    const lastQueryTime = this._lastQueryTime();
    const timeSinceLastQuery = Date.now() - lastQueryTime;
    const shouldRefreshByTime = timeSinceLastQuery > 5 * 60 * 1000; // 5 minutes
    
    return lastQueryTime === 0 || shouldRefreshByTime;
  }

  resetFilters() {
    this._selectedScope.set('all');
    this._filterOptions.set({
      scope: 'all'
    });
    this._lastLocation.set(null);
    this._lastQueryTime.set(0);
  }
}
