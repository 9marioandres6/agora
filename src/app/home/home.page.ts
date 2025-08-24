import { Component, inject, OnInit, signal } from '@angular/core';
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
  expandedCollaborators = signal<string | null>(null);


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



  async supportProject(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    try {
      const currentUser = this.user();
      if (!currentUser?.uid) return;

      const result = await this.projectsService.toggleSupport(projectId, currentUser.uid);
      this.updateProjectVoting(projectId, 'supports', result.action, currentUser.uid);
      
      // If support was added, also remove from opposes array in UI
      if (result.action === 'added') {
        this.removeUserFromOpposes(projectId, currentUser.uid);
      }
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

      const result = await this.projectsService.toggleOppose(projectId, currentUser.uid);
      this.updateProjectVoting(projectId, 'opposes', result.action, currentUser.uid);
      
      // If oppose was added, also remove from supports array in UI
      if (result.action === 'added') {
        this.removeUserFromSupports(projectId, currentUser.uid);
      }
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

      const newComment = await this.projectsService.addComment(projectId, commentText);
      this.addCommentToProject(projectId, newComment);
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
      const newRequest = await this.projectsService.requestCollaboration(projectId, message);
      this.addCollaborationRequestToProject(projectId, newRequest);
    } catch (error) {
      console.error('Error requesting collaboration:', error);
    }
  }

  private updateProjectVoting(projectId: string, field: 'supports' | 'opposes', action: 'added' | 'removed', userId: string) {
    this.projects.update(projects => 
      projects.map(project => {
        if (project.id !== projectId) return project;
        
        const currentArray = project[field] || [];
        let newArray: string[];
        
        if (action === 'added') {
          newArray = [...currentArray, userId];
        } else {
          newArray = currentArray.filter(id => id !== userId);
        }
        
        return { ...project, [field]: newArray };
      })
    );
  }

  private removeUserFromSupports(projectId: string, userId: string) {
    this.projects.update(projects => 
      projects.map(project => {
        if (project.id !== projectId) return project;
        const newSupports = (project.supports || []).filter(id => id !== userId);
        return { ...project, supports: newSupports };
      })
    );
  }

  private removeUserFromOpposes(projectId: string, userId: string) {
    this.projects.update(projects => 
      projects.map(project => {
        if (project.id !== projectId) return project;
        const newOpposes = (project.opposes || []).filter(id => id !== userId);
        return { ...project, opposes: newOpposes };
      })
    );
  }

  private addCommentToProject(projectId: string, newComment: Comment) {
    this.projects.update(projects => 
      projects.map(project => 
        project.id === projectId 
          ? { ...project, comments: [...(project.comments || []), newComment] }
          : project
      )
    );
  }

  private addCollaborationRequestToProject(projectId: string, newRequest: CollaborationRequest) {
    this.projects.update(projects => 
      projects.map(project => 
        project.id === projectId 
          ? { ...project, collaborationRequests: [...(project.collaborationRequests || []), newRequest] }
          : project
      )
    );
  }
}
