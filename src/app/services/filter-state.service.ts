import { Injectable, signal } from '@angular/core';
import { FilterOptions } from './firebase-query.service';

@Injectable({
  providedIn: 'root'
})
export class FilterStateService {
  private _selectedScope = signal<string>('all');
  private _filterOptions = signal<FilterOptions>({
    scope: 'all'
  });
  private _lastQueryTime = signal<number>(0);
  
  selectedScope = this._selectedScope.asReadonly();
  filterOptions = this._filterOptions.asReadonly();
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

  updateLastQueryTime() {
    this._lastQueryTime.set(Date.now());
  }

  getLastQueryTime(): number {
    return this._lastQueryTime();
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
    this._lastQueryTime.set(0);
  }
}
