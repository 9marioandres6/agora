import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { UserSearchService, UserProfile } from '../services/user-search.service';
import { ProjectsService } from '../services/projects.service';
import { Project } from '../services/models/project.models';

@Component({
  selector: 'app-public-profile',
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class PublicProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private navCtrl = inject(NavController);
  private route = inject(ActivatedRoute);
  private themeService = inject(ThemeService);
  private userSearchService = inject(UserSearchService);
  private projectsService = inject(ProjectsService);
  private firestore = inject(Firestore);

  isAuthenticated = this.authService.isAuthenticated;
  isDark = signal(this.themeService.isDarkMode());

  userId: string | null = null;
  userProfile: UserProfile | null = null;
  loading = signal(true);
  error = signal(false);
  currentUser = this.authService.user;
  
  // Projects data
  createdProjects = signal<Project[]>([]);
  collaboratedProjects = signal<Project[]>([]);
  projectsLoading = signal(false);

  constructor() {}

  ngOnInit(): void {
    this.route.params.subscribe((params: any) => {
      this.userId = params['userId'];
      if (this.userId) {
        this.loadUserProfile();
      } else {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  private async loadUserProfile(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);
      
      if (this.userId) {
        this.userProfile = await this.userSearchService.getUserProfile(this.userId);
        if (!this.userProfile) {
          this.error.set(true);
        } else {
          await this.loadUserProjects();
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private   async loadUserProjects(): Promise<void> {
    if (!this.userId) return;
    
    try {
      this.projectsLoading.set(true);
      
      // Get created projects
      const createdProjects = await this.projectsService.getProjectsByUserAsync(this.userId);
      this.createdProjects.set(createdProjects);
      
      // Get collaborated projects
      const collaboratedProjects = await this.getCollaboratedProjects(this.userId);
      this.collaboratedProjects.set(collaboratedProjects);
      
      // Save project counts to Firebase
      await this.saveProjectCountsToFirebase();
      
    } catch (error) {
      console.error('Error loading user projects:', error);
    } finally {
      this.projectsLoading.set(false);
    }
  }

  // Method to manually recalculate and save project counts
  async recalculateProjectCounts(): Promise<void> {
    if (!this.userId) return;
    
    // Only allow recalculation for the current user
    const currentUser = this.authService.user();
    if (!currentUser || currentUser.uid !== this.userId) {
      return;
    }
    
    try {
      await this.userSearchService.recalculateAndUpdateUserProjectCounts(this.userId);
      
      // Reload the projects to refresh the display
      await this.loadUserProjects();
    } catch (error) {
      console.error('Error recalculating project counts:', error);
    }
  }

  private async saveProjectCountsToFirebase(): Promise<void> {
    if (!this.userId) return;
    
    // Only update project counts for the current user (for performance)
    const currentUser = this.authService.user();
    if (!currentUser || currentUser.uid !== this.userId) {
      return;
    }
    
    try {
      const projectCounts = {
        createdBuilding: this.getCreatedProjectsByState('building').length,
        createdImplementing: this.getCreatedProjectsByState('implementing').length,
        createdDone: this.getCreatedProjectsByState('done').length,
        collaboratedBuilding: this.getCollaboratedProjectsByState('building').length,
        collaboratedImplementing: this.getCollaboratedProjectsByState('implementing').length,
        collaboratedDone: this.getCollaboratedProjectsByState('done').length
      };
      
      await this.userSearchService.updateUserProjectCounts(this.userId, projectCounts);
    } catch (error) {
      console.error('❌ Error saving project counts to Firebase:', error);
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

  goBack(): void {
    this.navCtrl.back();
  }

  isCurrentUserProfile(): boolean {
    const currentUser = this.currentUser();
    return currentUser ? currentUser.uid === this.userId : false;
  }

  editProfile(): void {
    this.navCtrl.navigateForward('/my-profile');
  }

  getProjectsByState(projects: Project[], state: 'building' | 'implementing' | 'done'): Project[] {
    return projects.filter(project => project.state === state);
  }

  getCreatedProjectsByState(state: 'building' | 'implementing' | 'done'): Project[] {
    return this.getProjectsByState(this.createdProjects(), state);
  }

  getCollaboratedProjectsByState(state: 'building' | 'implementing' | 'done'): Project[] {
    return this.getProjectsByState(this.collaboratedProjects(), state);
  }

  getTotalProjectsByState(state: 'building' | 'implementing' | 'done'): number {
    const createdCount = this.getCreatedProjectsByState(state).length;
    const collaboratedCount = this.getCollaboratedProjectsByState(state).length;
    return createdCount + collaboratedCount;
  }

  navigateToProject(projectId: string): void {
    this.navCtrl.navigateForward(`/project/${projectId}/public`);
  }

  navigateToProjectsByState(role: 'creator' | 'collaborator', state: 'building' | 'implementing' | 'done'): void {
    // For now, navigate to home with a filter - this could be enhanced later
    // to show a filtered view of projects by this user and state
    this.navCtrl.navigateForward('/home');
  }
}
