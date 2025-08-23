import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectsService } from '../services/projects.service';
import { Project } from '../services/models/project.models';

@Component({
  selector: 'app-public-inner-project',
  templateUrl: './public-inner-project.component.html',
  styleUrls: ['./public-inner-project.component.scss'],
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class PublicInnerProjectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectsService = inject(ProjectsService);
  
  projectId = this.route.snapshot.paramMap.get('id');
  project = signal<Project | null>(null);
  isLoading = signal(true);
  
  ngOnInit() {
    if (this.projectId) {
      this.loadProject();
    }
  }
  
  async loadProject() {
    try {
      this.isLoading.set(true);
      const projectData = await this.projectsService.getProject(this.projectId!);
      this.project.set(projectData);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  getScopeIcon(scope: string): string {
    const scopeIcons: { [key: string]: string } = {
      'grupal': 'people',
      'local': 'home',
      'state': 'business',
      'national': 'flag',
      'global': 'globe'
    };
    return scopeIcons[scope] || 'help-circle';
  }
  
  getStateColor(state: string): string {
    const stateColors: { [key: string]: string } = {
      'building': 'warning',
      'implementing': 'primary',
      'done': 'success'
    };
    return stateColors[state] || 'medium';
  }
  
  getStateLabel(state: string): string {
    const stateLabels: { [key: string]: string } = {
      'building': 'HOME.STATE_BUILDING',
      'implementing': 'HOME.STATE_IMPLEMENTING',
      'done': 'HOME.STATE_DONE'
    };
    return stateLabels[state] || 'HOME.STATE_BUILDING';
  }
}
