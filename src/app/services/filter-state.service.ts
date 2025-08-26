import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FilterStateService {
  private _selectedScope = signal<string>('all');
  
  selectedScope = this._selectedScope.asReadonly();
  
  setSelectedScope(scope: string) {
    this._selectedScope.set(scope);
  }
  
  getSelectedScope(): string {
    return this._selectedScope();
  }
}
