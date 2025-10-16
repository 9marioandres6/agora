import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Project, Need, Scope } from '../../services/models/project.models';
import { AuthService } from '../../services/auth.service';
import { UserSearchService } from '../../services/user-search.service';
import { UserAvatarComponent, UserAvatarData } from '../user-avatar/user-avatar.component';
import { ProjectFooterComponent } from '../project-footer/project-footer.component';

@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslateModule, ProjectFooterComponent]
})
export class ProjectCardComponent implements OnInit {
  private authService = inject(AuthService);
  private userSearchService = inject(UserSearchService);
  private translateService = inject(TranslateService);

  project = input.required<Project>();
  expandedComments = input<boolean>(false);
  expandedCollaborators = input<boolean>(false);

  onProjectClick = output<Project>();
  onSupportClick = output<{ projectId: string, event: Event }>();
  onOpposeClick = output<{ projectId: string, event: Event }>();
  onVerifyClick = output<{ projectId: string, event: Event }>();
  onFollowClick = output<{ projectId: string, event: Event }>();
  onCommentsToggle = output<{ projectId: string, event: Event }>();
  onCollaboratorsToggle = output<{ projectId: string, event: Event }>();
  onCommentSubmit = output<{ projectId: string, comment: string }>();
  onCollaborationRequest = output<{ projectId: string, message: string }>();

  newCommentText = '';
  collaborationMessage = '';
  creatorData = signal<UserAvatarData | null>(null);
  totalProjectStats = signal<string>('');
  needsExpanded = signal<boolean>(false);

  get user() {
    return this.authService.user();
  }

  ngOnInit() {
    this.loadCreatorData();
    this.loadTotalProjectStats();
  }

  async loadCreatorData() {
    try {
      const data = await this.getCreatorData();
      this.creatorData.set(data);
    } catch (error) {
      console.error('Error loading creator data:', error);
    }
  }

  async loadTotalProjectStats() {
    try {
      const project = this.project();
      if (!project) return;

      let totalBuilding = 0;
      let totalImplementing = 0;
      let totalDone = 0;

      // Get creator stats
      const creatorData = await this.getCreatorData();
      if (creatorData?.projectSummary) {
        const creatorStats = this.parseProjectSummary(creatorData.projectSummary);
        totalBuilding += creatorStats.building;
        totalImplementing += creatorStats.implementing;
        totalDone += creatorStats.done;
      }

      // Get collaborator stats
      if (project.collaborators && project.collaborators.length > 0) {
        for (const collaborator of project.collaborators) {
          try {
            const collaboratorProfile = await this.userSearchService.getUserProfile(collaborator.uid);
            if (collaboratorProfile?.projectCounts) {
              const collaboratorStats = this.calculateProjectSummaryFromCounts(collaboratorProfile.projectCounts);
              const parsedStats = this.parseProjectSummary(collaboratorStats);
              totalBuilding += parsedStats.building;
              totalImplementing += parsedStats.implementing;
              totalDone += parsedStats.done;
            }
          } catch (error) {
            console.warn('Could not load collaborator stats for:', collaborator.uid, error);
          }
        }
      }

      this.totalProjectStats.set(`${totalBuilding}·${totalImplementing}·${totalDone}`);
    } catch (error) {
      console.error('Error loading total project stats:', error);
    }
  }

  getScopeIcon(scope: string | Scope): string {
    const scopeValue = typeof scope === 'string' ? scope : scope?.scope || '';
    const scopeIcons: { [key: string]: string } = {
      'grupal': 'people',
      'local': 'business-outline',
      'state': 'business',
      'national': 'flag',
      'global': 'globe'
    };
    return scopeIcons[scopeValue] || 'help-circle';
  }

  getScopeValue(scope: string | Scope): string {
    return typeof scope === 'string' ? scope : scope?.scope || '';
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

  getStateIcon(state: string): string {
    const stateIcons: { [key: string]: string } = {
      'building': 'construct',
      'implementing': 'build',
      'done': 'checkmark-circle'
    };
    return stateIcons[state] || 'construct';
  }

  getNeedIcon(need: Need): string {
    return need.state === 'obtained' ? 'checkmark' : 'time';
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

  isUserProject(project: Project): boolean {
    return this.isProjectCreator(project) || this.isProjectCollaborator(project);
  }

  async getCreatorData(): Promise<UserAvatarData> {
    const project = this.project();
    if (project.creator) {
      try {
        // Try to get the current user profile data
        const userProfile = await this.userSearchService.getUserProfile(project.creator.uid);
        if (userProfile) {
          return {
            uid: project.creator.uid,
            displayName: userProfile.displayName || project.creator.displayName,
            email: userProfile.email || project.creator.email,
            photoURL: userProfile.photoURL || project.creator.photoURL,
            role: 'PROJECT.CREATOR',
            projectSummary: userProfile.projectCounts ? this.calculateProjectSummaryFromCounts(userProfile.projectCounts) : undefined
          };
        }
      } catch (error) {
        console.warn('Could not fetch current creator profile, using stored data:', error);
      }
      
      // Fallback to stored creator data
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

  private calculateProjectSummaryFromCounts(projectCounts: any): string {
    const building = projectCounts.createdBuilding + projectCounts.collaboratedBuilding;
    const implementing = projectCounts.createdImplementing + projectCounts.collaboratedImplementing;
    const done = projectCounts.createdDone + projectCounts.collaboratedDone;
    
    return `${building}·${implementing}·${done}`;
  }

  private parseProjectSummary(summary: string): { building: number; implementing: number; done: number } {
    const parts = summary.split('·');
    return {
      building: parseInt(parts[0]) || 0,
      implementing: parseInt(parts[1]) || 0,
      done: parseInt(parts[2]) || 0
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




  onProjectCardClick() {
    this.onProjectClick.emit(this.project());
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

  toggleNeedsExpansion(event: Event) {
    event.stopPropagation();
    this.needsExpanded.set(!this.needsExpanded());
  }

  getDisplayedNeeds() {
    const needs = this.project().needs || [];
    if (needs.length <= 3) {
      return needs;
    }
    return this.needsExpanded() ? needs : needs.slice(0, 3);
  }

  hasMoreNeeds() {
    return (this.project().needs || []).length > 3;
  }

  getFormattedDate(): string {
    const project = this.project();
    if (!project) return '';
    
    const createdDate = new Date(project.createdAt);
    const now = new Date();
    
    // Format creation date
    const createdDiffTime = Math.abs(now.getTime() - createdDate.getTime());
    const createdDiffDays = Math.ceil(createdDiffTime / (1000 * 60 * 60 * 24));
    const createdFormatted = this.formatRelativeTime(createdDiffDays);
    
    // Format last update date if available
    if (project.updatedAt && project.updatedAt !== project.createdAt) {
      const updatedDate = new Date(project.updatedAt);
      const updatedDiffTime = Math.abs(now.getTime() - updatedDate.getTime());
      const updatedDiffDays = Math.ceil(updatedDiffTime / (1000 * 60 * 60 * 24));
      const updatedFormatted = this.formatRelativeTime(updatedDiffDays);
      return updatedFormatted;
      return `${this.translateService.instant('PROJECT.CREATED')} ${createdFormatted} - ${this.translateService.instant('PROJECT.LAST_UPDATED')} ${updatedFormatted}`;
    }
    
    return `${this.translateService.instant('PROJECT.CREATED')} ${createdFormatted}`;
  }

  private formatRelativeTime(diffDays: number): string {
    if (diffDays === 1) {
      return this.translateService.instant('TIME.ONE_DAY_AGO');
    } else if (diffDays < 7) {
      return this.translateService.instant('TIME.DAYS_AGO', { days: diffDays });
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? 
        this.translateService.instant('TIME.ONE_WEEK_AGO') : 
        this.translateService.instant('TIME.WEEKS_AGO', { weeks });
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? 
        this.translateService.instant('TIME.ONE_MONTH_AGO') : 
        this.translateService.instant('TIME.MONTHS_AGO', { months });
    } else {
      const years = Math.floor(diffDays / 365);
      return years === 1 ? 
        this.translateService.instant('TIME.ONE_YEAR_AGO') : 
        this.translateService.instant('TIME.YEARS_AGO', { years });
    }
  }
}
