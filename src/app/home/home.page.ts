import { Component, inject, OnInit, signal } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
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
}
