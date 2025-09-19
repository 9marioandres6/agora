import { Component, input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Firestore } from '@angular/fire/firestore';
import { ProjectsService } from '../../services/projects.service';
import { Project } from '../../services/models/project.models';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';

export interface UserAvatarData {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  joinedAt?: string;
  projectSummary?: string; // Format: "4/4/1" for building/implementing/done
}

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, ImageFallbackDirective]
})
export class UserAvatarComponent implements OnInit {
  private navCtrl = inject(NavController);
  private projectsService = inject(ProjectsService);
  private firestore = inject(Firestore);

  user = input.required<UserAvatarData>();
  showRole = input<boolean>(true);
  showJoinedDate = input<boolean>(false);
  showProjectSummary = input<boolean>(true);
  avatarSize = input<'small' | 'large'>('small');
  variant = input<'default' | 'creator' | 'collaborator'>('default');
  clickable = input<boolean>(true);

  // Project summary data
  createdProjects = signal<Project[]>([]);
  collaboratedProjects = signal<Project[]>([]);
  projectSummary = signal<string>('');

  ngOnInit(): void {
    this.loadProjectSummary();
  }

  private async loadProjectSummary(): Promise<void> {
    const userData = this.user();
    if (!userData?.uid) return;

    try {
      // First try to get cached project counts from user profile
      const userProfile = await this.getUserProfile(userData.uid);
      if (userProfile?.projectCounts) {
        this.setProjectSummaryFromCounts(userProfile.projectCounts);
        return;
      }

      // If no cached data, calculate from projects
      await this.loadUserProjects();
    } catch (error) {
      console.error('Error loading project summary for avatar:', error);
    }
  }

  private async getUserProfile(uid: string): Promise<any> {
    try {
      const { doc, getDoc } = await import('@angular/fire/firestore');
      const userRef = doc(this.firestore, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  private setProjectSummaryFromCounts(projectCounts: any): void {
    const building = projectCounts.createdBuilding + projectCounts.collaboratedBuilding;
    const implementing = projectCounts.createdImplementing + projectCounts.collaboratedImplementing;
    const done = projectCounts.createdDone + projectCounts.collaboratedDone;
    
    this.projectSummary.set(`${building}·${implementing}·${done}`);
  }

  private async loadUserProjects(): Promise<void> {
    const userData = this.user();
    if (!userData?.uid) return;

    try {
      // Get created projects
      const createdProjects = await this.projectsService.getProjectsByUserAsync(userData.uid);
      this.createdProjects.set(createdProjects);

      // Get collaborated projects
      const collaboratedProjects = await this.getCollaboratedProjects(userData.uid);
      this.collaboratedProjects.set(collaboratedProjects);

      // Calculate and set project summary
      this.calculateProjectSummary();
    } catch (error) {
      console.error('Error loading user projects for avatar:', error);
    }
  }

  private async getCollaboratedProjects(userId: string): Promise<Project[]> {
    try {
      const { collection, query, getDocs } = await import('@angular/fire/firestore');
      const projectsCollection = collection(this.firestore, 'projects');
      
      // Get all projects and filter for collaborations
      // Since collaborators are stored as objects with uid property, we need to filter manually
      const allProjectsQuery = query(projectsCollection);
      const querySnapshot = await getDocs(allProjectsQuery);
      const allProjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      
      // Filter projects where user is a collaborator
      return allProjects.filter(project => 
        project.collaborators && 
        project.collaborators.some(collab => collab.uid === userId)
      );
    } catch (error) {
      console.error('Error getting collaborated projects:', error);
      return [];
    }
  }

  private calculateProjectSummary(): void {
    const building = this.getTotalProjectsByState('building');
    const implementing = this.getTotalProjectsByState('implementing');
    const done = this.getTotalProjectsByState('done');
    
    this.projectSummary.set(`${building}·${implementing}·${done}`);
  }

  private getTotalProjectsByState(state: 'building' | 'implementing' | 'done'): number {
    const createdCount = this.getProjectsByState(this.createdProjects(), state).length;
    const collaboratedCount = this.getProjectsByState(this.collaboratedProjects(), state).length;
    return createdCount + collaboratedCount;
  }

  private getProjectsByState(projects: Project[], state: 'building' | 'implementing' | 'done'): Project[] {
    return projects.filter(project => project.state === state);
  }

  onAvatarClick(): void {
    if (this.clickable() && this.user().uid) {
      this.navCtrl.navigateForward(`/profile/${this.user().uid}`);
    }
  }
}
