import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Project } from '../../services/models/project.models';
import { AuthService } from '../../services/auth.service';
import { ProjectsService } from '../../services/projects.service';
import { UserAvatarComponent, UserAvatarData } from '../user-avatar/user-avatar.component';

@Component({
  selector: 'app-project-footer',
  templateUrl: './project-footer.component.html',
  styleUrls: ['./project-footer.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, FormsModule, UserAvatarComponent]
})
export class ProjectFooterComponent {
  private authService = inject(AuthService);
  private projectsService = inject(ProjectsService);

  project = input.required<Project>();
  expandedComments = signal<boolean>(false);
  expandedCollaborators = signal<boolean>(false);
  newCommentText = '';

  get user() {
    return this.authService.user();
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

  isUserVerified(project: Project): boolean {
    const currentUser = this.user;
    if (!currentUser?.uid) return false;
    return project.verifies?.includes(currentUser.uid) || false;
  }

  isUserFollowing(project: Project): boolean {
    const currentUser = this.user;
    if (!currentUser?.uid) return false;
    return project.followers?.includes(currentUser.uid) || false;
  }

  async onSupportButtonClick(event: Event) {
    event.stopPropagation();
    try {
      const currentUser = this.user;
      if (!currentUser?.uid) return;

      await this.projectsService.toggleSupport(this.project().id!, currentUser.uid);
    } catch (error) {
      console.error('Error supporting project:', error);
    }
  }

  async onOpposeButtonClick(event: Event) {
    event.stopPropagation();
    try {
      const currentUser = this.user;
      if (!currentUser?.uid) return;

      await this.projectsService.toggleOppose(this.project().id!, currentUser.uid);
    } catch (error) {
      console.error('Error opposing project:', error);
    }
  }

  async onVerifyButtonClick(event: Event) {
    event.stopPropagation();
    try {
      const currentUser = this.user;
      if (!currentUser?.uid) return;

      await this.projectsService.toggleVerify(this.project().id!, currentUser.uid);
    } catch (error) {
      console.error('Error verifying project:', error);
    }
  }

  async onFollowButtonClick(event: Event) {
    event.stopPropagation();
    try {
      const currentUser = this.user;
      if (!currentUser?.uid) return;

      await this.projectsService.toggleFollow(this.project().id!, currentUser.uid);
    } catch (error) {
      console.error('Error following project:', error);
    }
  }

  onCommentsButtonClick(event: Event) {
    event.stopPropagation();
    // Close collaborators if it's open
    if (this.expandedCollaborators()) {
      this.expandedCollaborators.set(false);
    }
    // Toggle comments
    this.expandedComments.update(expanded => !expanded);
  }

  onCollaboratorsButtonClick(event: Event) {
    event.stopPropagation();
    // Close comments if it's open
    if (this.expandedComments()) {
      this.expandedComments.set(false);
    }
    // Toggle collaborators
    this.expandedCollaborators.update(expanded => !expanded);
  }

  async addComment(projectId: string, commentText: string) {
    try {
      const currentUser = this.user;
      if (!currentUser?.uid) return;

      await this.projectsService.addComment(projectId, commentText);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
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
    this.addComment(this.project().id!, this.newCommentText.trim());
    this.newCommentText = '';
  }

  getCreatorData(): UserAvatarData {
    const project = this.project();
    if (!project?.creator) {
      return {
        uid: '',
        displayName: 'Anonymous',
        email: '',
        photoURL: '',
        role: 'creator'
      };
    }

    return {
      uid: project.creator.uid,
      displayName: project.creator.displayName || 'Anonymous',
      email: project.creator.email || '',
      photoURL: project.creator.photoURL || '',
      role: 'creator'
    };
  }

  getCollaboratorData(collaborator: any): UserAvatarData {
    return {
      uid: collaborator.uid,
      displayName: collaborator.displayName || 'Anonymous',
      email: collaborator.email || '',
      photoURL: collaborator.photoURL || '',
      role: 'collaborator'
    };
  }
}
