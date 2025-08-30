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
  
  selectedScope = this._selectedScope.asReadonly();
  filterOptions = this._filterOptions.asReadonly();
  
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

  resetFilters() {
    this._selectedScope.set('all');
    this._filterOptions.set({
      scope: 'all'
    });
  }
}
