import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Project, Need } from '../../services/models/project.models';
import { AuthService } from '../../services/auth.service';
import { UserAvatarComponent, UserAvatarData } from '../user-avatar/user-avatar.component';

@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslateModule, UserAvatarComponent]
})
export class ProjectCardComponent {
  private authService = inject(AuthService);

  project = input.required<Project>();
  expandedComments = input<boolean>(false);
  expandedCollaborators = input<boolean>(false);

  onProjectClick = output<Project>();
  onSupportClick = output<{ projectId: string, event: Event }>();
  onOpposeClick = output<{ projectId: string, event: Event }>();
  onCommentsToggle = output<{ projectId: string, event: Event }>();
  onCollaboratorsToggle = output<{ projectId: string, event: Event }>();
  onCommentSubmit = output<{ projectId: string, comment: string }>();
  onCollaborationRequest = output<{ projectId: string, message: string }>();

  newCommentText = '';
  collaborationMessage = '';

  get user() {
    return this.authService.user();
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

  getNeedIcon(need: Need): string {
    return need.state === 'obtained' ? 'checkmark-circle' : 'time';
  }

  getNeedIconColor(need: Need): string {
    return need.state === 'obtained' ? 'success' : 'warning';
  }

  isProjectCreator(project: Project): boolean {
    const currentUser = this.user;
    if (!currentUser?.uid) return false;
    
    // Check both createdBy field and creator.uid field
    return project.createdBy === currentUser.uid || 
           project.creator?.uid === currentUser.uid;
  }

  hasCollaborationRequest(project: Project): boolean {
    const currentUser = this.user;
    if (!currentUser?.uid) return false;
    return project.collaborationRequests?.some(req => req.uid === currentUser.uid) || false;
  }

  isProjectCollaborator(project: Project): boolean {
    const currentUser = this.user;
    if (!currentUser?.uid) return false;
    return project.collaborators?.some(collaborator => collaborator.uid === currentUser.uid) || false;
  }

  canInteractWithProject(project: Project): boolean {
    return this.isProjectCreator(project) || this.isProjectCollaborator(project);
  }

  getCreatorData(): UserAvatarData {
    const project = this.project();
    if (project.creator) {
      return {
        uid: project.creator.uid,
        displayName: project.creator.displayName,
        email: project.creator.email,
        photoURL: project.creator.photoURL,
        role: 'PROJECT.CREATOR'
      };
    }
    return {
      uid: project.createdBy || 'anonymous',
      displayName: 'Anonymous',
      email: '',
      photoURL: undefined,
              role: 'PROJECT.CREATOR'
    };
  }

  getCollaboratorData(collaborator: any): UserAvatarData {
    return {
      uid: collaborator.uid,
      displayName: collaborator.displayName,
      email: collaborator.email,
      photoURL: collaborator.photoURL,
      role: collaborator.role,
      joinedAt: collaborator.joinedAt
    };
  }



  isUserSupported(project: Project): boolean {
    const currentUser = this.user;
    if (!currentUser?.uid) return false;
    return project.supports?.includes(currentUser.uid) || false;
  }

  isUserOpposed(project: Project): boolean {
    const currentUser = this.user;
    if (!currentUser?.uid) return false;
    return project.opposes?.includes(currentUser.uid) || false;
  }

  onProjectCardClick() {
    this.onProjectClick.emit(this.project());
  }

  onSupportButtonClick(event: Event) {
    this.onSupportClick.emit({ projectId: this.project().id!, event });
  }

  onOpposeButtonClick(event: Event) {
    this.onOpposeClick.emit({ projectId: this.project().id!, event });
  }

  onCommentsButtonClick(event: Event) {
    this.onCommentsToggle.emit({ projectId: this.project().id!, event });
  }

  onCollaboratorsButtonClick(event: Event) {
    this.onCollaboratorsToggle.emit({ projectId: this.project().id!, event });
  }

  onCommentKeydown(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.submitComment();
    }
  }

  submitComment() {
    if (!this.newCommentText.trim()) return;
    this.onCommentSubmit.emit({ 
      projectId: this.project().id!, 
      comment: this.newCommentText.trim() 
    });
    this.newCommentText = '';
  }

  submitCollaborationRequest() {
    if (!this.collaborationMessage.trim()) return;
    this.onCollaborationRequest.emit({ 
      projectId: this.project().id!, 
      message: this.collaborationMessage.trim() 
    });
    this.collaborationMessage = '';
  }
}
