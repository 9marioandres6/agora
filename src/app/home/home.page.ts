import { Component, inject, OnInit, signal } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { SettingsModalComponent } from '../components/settings-modal/settings-modal.component';
import { ProjectsService, Project } from '../services/projects.service';
import { ViewWillEnter } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, ViewWillEnter {
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private themeService = inject(ThemeService);
  private navCtrl = inject(NavController);
  private projectsService = inject(ProjectsService);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  isDark = this.themeService.isDark;
  
  projects = signal<Project[]>([]);
  isLoading = signal(false);
  expandedComments = signal<string | null>(null);
  newCommentText = '';

  async presentSettingsModal() {
    const modal = await this.modalCtrl.create({
      component: SettingsModalComponent,
      cssClass: 'settings-modal'
    });
    await modal.present();
  }

  async logout() {
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  createNew() {
    this.navCtrl.navigateForward('/new-item');
  }

  ngOnInit() {
    this.loadProjects();
  }

  ionViewWillEnter() {
    this.loadProjects();
  }

  async loadProjects() {
    try {
      this.isLoading.set(true);
      const projects = await this.projectsService.getProjects();
      this.projects.set(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshProjects(event?: any) {
    await this.loadProjects();
    if (event) {
      event.target.complete();
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

  getScopeLabel(scope: string): string {
    const scopeLabels: { [key: string]: string } = {
      'grupal': 'Grupal - Small Group Collaboration',
      'local': 'Local - Neighbourhood/Community',
      'state': 'State - State/Province level',
      'national': 'National - Country level',
      'global': 'Global - International level'
    };
    return scopeLabels[scope] || scope;
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

  async supportProject(projectId: string) {
    try {
      await this.projectsService.supportProject(projectId);
      await this.loadProjects();
    } catch (error) {
      console.error('Error supporting project:', error);
    }
  }

  async opposeProject(projectId: string) {
    try {
      await this.projectsService.opposeProject(projectId);
      await this.loadProjects();
    } catch (error) {
      console.error('Error opposing project:', error);
    }
  }

  toggleComments(projectId: string) {
    if (this.expandedComments() === projectId) {
      this.expandedComments.set(null);
    } else {
      this.expandedComments.set(projectId);
    }
  }

  async addComment(projectId: string) {
    if (!this.newCommentText.trim()) return;
    
    try {
      await this.projectsService.addComment(projectId, this.newCommentText.trim());
      this.newCommentText = '';
      await this.loadProjects();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }
}
