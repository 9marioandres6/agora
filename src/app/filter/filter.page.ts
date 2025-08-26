import { Component, inject, signal } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ProjectsService } from '../services/projects.service';
import { LocationFilterService } from '../services/location-filter.service';
import { FilterStateService } from '../services/filter-state.service';

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
  private locationFilterService = inject(LocationFilterService);
  private filterStateService = inject(FilterStateService);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;



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
}
