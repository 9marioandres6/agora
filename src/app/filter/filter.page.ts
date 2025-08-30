import { Component, inject, signal } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ProjectsService } from '../services/projects.service';
import { FirebaseQueryService } from '../services/firebase-query.service';
import { FilterStateService } from '../services/filter-state.service';
import { FormsModule } from '@angular/forms';
import { Project } from '../services/models/project.models';

@Component({
  selector: 'app-filter',
  templateUrl: 'filter.page.html',
  styleUrls: ['filter.page.scss'],
  standalone: false,
})
export class FilterPage {
  private navCtrl = inject(NavController);
  private authService = inject(AuthService);
  private projectsService = inject(ProjectsService);
  private firebaseQueryService = inject(FirebaseQueryService);
  private filterStateService = inject(FilterStateService);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  searchTerm = signal('');
  searchResults = signal<Project[]>([]);
  isSearching = signal(false);

  applyFilter(scope: string) {
    this.filterStateService.setSelectedScope(scope);
    
    if (scope === 'all') {
      this.projectsService.resetFilteredProjects();
    } else {
      this.projectsService.setFilteredProjects(scope);
    }
    
    this.navCtrl.back();
  }

  goBack() {
    this.navCtrl.back();
  }

  async onSearchChange(event: any) {
    const term = event.detail.value;
    this.searchTerm.set(term);
    
    if (!term || term.trim().length === 0) {
      this.searchResults.set([]);
      this.isSearching.set(false);
      return;
    }
    
    this.isSearching.set(true);
    
    try {
      const results = await this.firebaseQueryService.searchProjects(term);
      this.searchResults.set(results);
    } catch (error) {
      console.error('Error searching projects:', error);
      this.searchResults.set([]);
    } finally {
      this.isSearching.set(false);
    }
  }

  clearSearch() {
    this.searchTerm.set('');
    this.searchResults.set([]);
  }

  selectProject(project: Project) {
    this.searchTerm.set(project.title);
    this.searchResults.set([]);
  }
}
