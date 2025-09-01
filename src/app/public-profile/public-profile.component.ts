import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
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

  private async loadUserProjects(): Promise<void> {
    if (!this.userId) return;
    
    try {
      this.projectsLoading.set(true);
      
      // Get created projects
      const createdProjects = await this.projectsService.getProjectsByUserAsync(this.userId);
      this.createdProjects.set(createdProjects);
      
      // Get collaborated projects
      const collaboratedProjects = await this.getCollaboratedProjects(this.userId);
      this.collaboratedProjects.set(collaboratedProjects);
      
    } catch (error) {
      console.error('Error loading user projects:', error);
    } finally {
      this.projectsLoading.set(false);
    }
  }

  private async getCollaboratedProjects(userId: string): Promise<Project[]> {
    try {
      const { Firestore, collection, query, where, getDocs } = await import('@angular/fire/firestore');
      const firestore = inject(Firestore);
      const projectsCollection = collection(firestore, 'projects');
      
      const q = query(
        projectsCollection,
        where('collaborators', 'array-contains-any', [{ uid: userId }])
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
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

  navigateToProject(projectId: string): void {
    this.navCtrl.navigateForward(`/project/${projectId}/public`);
  }

  navigateToProjectsByState(role: 'creator' | 'collaborator', state: 'building' | 'implementing' | 'done'): void {
    // For now, navigate to home with a filter - this could be enhanced later
    // to show a filtered view of projects by this user and state
    this.navCtrl.navigateForward('/home');
  }
}
