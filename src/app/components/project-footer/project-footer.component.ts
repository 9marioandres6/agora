import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Project } from '../../services/models/project.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-project-footer',
  templateUrl: './project-footer.component.html',
  styleUrls: ['./project-footer.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class ProjectFooterComponent {
  private authService = inject(AuthService);

  project = input.required<Project>();
  expandedComments = input<boolean>(false);
  expandedCollaborators = input<boolean>(false);

  onSupportClick = output<{ projectId: string, event: Event }>();
  onOpposeClick = output<{ projectId: string, event: Event }>();
  onVerifyClick = output<{ projectId: string, event: Event }>();
  onFollowClick = output<{ projectId: string, event: Event }>();
  onCommentsToggle = output<{ projectId: string, event: Event }>();
  onCollaboratorsToggle = output<{ projectId: string, event: Event }>();

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

  onSupportButtonClick(event: Event) {
    this.onSupportClick.emit({ projectId: this.project().id!, event });
  }

  onOpposeButtonClick(event: Event) {
    this.onOpposeClick.emit({ projectId: this.project().id!, event });
  }

  onVerifyButtonClick(event: Event) {
    this.onVerifyClick.emit({ projectId: this.project().id!, event });
  }

  onFollowButtonClick(event: Event) {
    this.onFollowClick.emit({ projectId: this.project().id!, event });
  }

  onCommentsButtonClick(event: Event) {
    this.onCommentsToggle.emit({ projectId: this.project().id!, event });
  }

  onCollaboratorsButtonClick(event: Event) {
    this.onCollaboratorsToggle.emit({ projectId: this.project().id!, event });
  }
}
