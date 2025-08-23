import { Component, inject, OnInit, signal } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { SettingsModalComponent } from '../components/settings-modal/settings-modal.component';
import { ProjectsService } from '../services/projects.service';
import { Project } from '../services/models/project.models';
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
  expandedCollaborators = signal<string | null>(null);
  newCommentText = '';
  collaborationMessage = '';

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

  async opposeProject(projectId: string) {
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
      const currentUser = this.user();
      if (!currentUser?.uid) return;

      const newComment = {
        id: this.generateCommentId(),
        text: this.newCommentText.trim(),
        createdBy: currentUser.uid,
        creatorName: currentUser.displayName || 'Anonymous',
        createdAt: new Date().toISOString()
      };

      await this.projectsService.addComment(projectId, this.newCommentText.trim());
      
      this.addCommentToProject(projectId, newComment);
      this.newCommentText = '';
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  onCommentKeydown(event: Event, projectId: string) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.addComment(projectId);
    }
  }

  toggleCollaborators(projectId: string) {
    if (this.expandedCollaborators() === projectId) {
      this.expandedCollaborators.set(null);
    } else {
      this.expandedCollaborators.set(projectId);
    }
  }

  isProjectCreator(project: Project): boolean {
    const currentUser = this.user();
    if (!currentUser?.uid) return false;
    return project.createdBy === currentUser.uid;
  }

  hasCollaborationRequest(project: Project): boolean {
    const currentUser = this.user();
    if (!currentUser?.uid) return false;
    return project.collaborationRequests?.some(req => req.uid === currentUser.uid) || false;
  }

  async requestCollaboration(projectId: string) {
    try {
      await this.projectsService.requestCollaboration(projectId, this.collaborationMessage.trim());
      this.collaborationMessage = '';
      await this.loadProjects();
    } catch (error) {
      console.error('Error requesting collaboration:', error);
    }
  }

  async acceptCollaboration(projectId: string, requestUid: string) {
    try {
      await this.projectsService.acceptCollaboration(projectId, requestUid);
      await this.loadProjects();
    } catch (error) {
      console.error('Error accepting collaboration:', error);
    }
  }

  async rejectCollaboration(projectId: string, requestUid: string) {
    try {
      await this.projectsService.rejectCollaboration(projectId, requestUid);
      await this.loadProjects();
    } catch (error) {
      console.error('Error rejecting collaboration:', error);
    }
  }

  async removeCollaborator(projectId: string, collaboratorUid: string) {
    try {
      await this.projectsService.removeCollaborator(projectId, collaboratorUid);
      await this.loadProjects();
    } catch (error) {
      console.error('Error removing collaborator:', error);
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

  private addCommentToProject(projectId: string, newComment: any) {
    this.projects.update(projects => 
      projects.map(project => 
        project.id === projectId 
          ? { ...project, comments: [...(project.comments || []), newComment] }
          : project
      )
    );
  }

  private generateCommentId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  isUserSupported(project: Project): boolean {
    const currentUser = this.user();
    if (!currentUser?.uid) return false;
    return project.supports?.includes(currentUser.uid) || false;
  }

  isUserOpposed(project: Project): boolean {
    const currentUser = this.user();
    if (!currentUser?.uid) return false;
    return project.opposes?.includes(currentUser.uid) || false;
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
}
