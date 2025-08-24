import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { SettingsModalComponent } from '../components/settings-modal/settings-modal.component';
import { ProjectsService } from '../services/projects.service';
import { Project, Comment, CollaborationRequest } from '../services/models/project.models';
import { ViewWillEnter } from '@ionic/angular';
import { ProjectCardComponent } from '../components/project-card/project-card.component';
import { ConnectionService } from '../services/connection.service';
import { Router } from '@angular/router';

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
  private connectionService = inject(ConnectionService);
  private router = inject(Router);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  isDark = this.themeService.isDark;
  
  // Use reactive signals from ProjectsService
  projects = this.projectsService.projects;
  isLoading = signal(false);
  expandedComments = signal<string | null>(null);
  expandedCollaborators = signal<string | null>(null);

  // Computed values for reactive filtering
  filteredProjects = computed(() => {
    const allProjects = this.projects();
    // Add any filtering logic here if needed
    return allProjects;
  });


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

  navigateToProject(project: Project) {
    // Check if user is creator or editor of the project
    const currentUser = this.user();
    if (currentUser && (project.creator?.uid === currentUser.uid || 
        (project.collaborators || []).some(c => c.uid === currentUser.uid))) {
      // User is creator or editor - navigate to private page
      this.navCtrl.navigateForward(`/project/${project.id}/private`);
    } else {
      // User is viewer - navigate to public page
      this.navCtrl.navigateForward(`/project/${project.id}/public`);
    }
  }

    ngOnInit() {
    this.checkConnection();
  }

  ionViewWillEnter() {
    this.checkConnection();
  }

  private checkConnection() {
    // Check connection status
    if (!this.connectionService.isOnline()) {
      this.router.navigate(['/no-connection']);
      return;
    }
    
    // Projects are now automatically loaded via real-time listeners
    // No need to manually load them
  }

  async refreshProjects(event?: any) {
    // Projects are automatically updated via real-time listeners
    // Just complete the refresh event
    if (event) {
      event.target.complete();
    }
  }



  async supportProject(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    try {
      const currentUser = this.user();
      if (!currentUser?.uid) return;

      // The real-time listener will automatically update the UI
      await this.projectsService.toggleSupport(projectId, currentUser.uid);
    } catch (error) {
      console.error('Error supporting project:', error);
    }
  }

  async opposeProject(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    try {
      const currentUser = this.user();
      if (!currentUser?.uid) return;

      // The real-time listener will automatically update the UI
      await this.projectsService.toggleOppose(projectId, currentUser.uid);
    } catch (error) {
      console.error('Error opposing project:', error);
    }
  }

  toggleComments(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedComments() === projectId) {
      this.expandedComments.set(null);
    } else {
      this.expandedComments.set(projectId);
    }
  }

  async addComment(projectId: string, commentText: string) {
    try {
      const currentUser = this.user();
      if (!currentUser?.uid) return;

      // The real-time listener will automatically update the UI
      await this.projectsService.addComment(projectId, commentText);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }



  toggleCollaborators(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedCollaborators() === projectId) {
      this.expandedCollaborators.set(null);
    } else {
      this.expandedCollaborators.set(projectId);
    }
  }



  async requestCollaboration(projectId: string, message: string) {
    try {
      // The real-time listener will automatically update the UI
      await this.projectsService.requestCollaboration(projectId, message);
    } catch (error) {
      console.error('Error requesting collaboration:', error);
    }
  }

  // Project voting updates are now handled automatically by real-time listeners

  // User support updates are now handled automatically by real-time listeners

  // User oppose updates are now handled automatically by real-time listeners

  // Comment updates are now handled automatically by real-time listeners

  // Collaboration request updates are now handled automatically by real-time listeners
}
