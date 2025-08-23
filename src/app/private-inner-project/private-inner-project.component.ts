import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProjectsService, Project, Chapter, Media } from '../services/projects.service';
import { AddSectionModalComponent } from '../components/add-section-modal/add-section-modal.component';


interface PendingCollaborator {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  message?: string;
}

@Component({
  selector: 'app-private-inner-project',
  templateUrl: './private-inner-project.component.html',
  styleUrls: ['./private-inner-project.component.scss'],
  imports: [CommonModule, IonicModule, TranslateModule, FormsModule]
})
export class PrivateInnerProjectComponent {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private projectsService = inject(ProjectsService);
  private modalCtrl = inject(ModalController);
  
  projectId = this.route.snapshot.paramMap.get('id');
  
  // Signals
  readonly project = signal<Project | null>(null);
  readonly isLoading = signal(true);
  readonly isEditingProject = signal(false);
  readonly editingProject = signal<Partial<Project>>({});
  readonly editingChapter = signal<Partial<Chapter>>({});
  readonly pendingCollaborators = signal<PendingCollaborator[]>([]);
  
  // Computed properties
  readonly currentUser = computed(() => this.authService.user());
  readonly isOwner = computed(() => {
    const user = this.currentUser();
    const proj = this.project();
    // TEMPORARY: Always return true for testing so you can see the buttons
    return true;
  });
  
  constructor() {
    this.loadProject();
  }
  
  async loadProject() {
    if (!this.projectId) return;
    
    try {
      this.isLoading.set(true);
      
      // Try to load real project data first
      try {
        const project = await this.projectsService.getProject(this.projectId);
        this.project.set(project);
      } catch (error) {
        // If no real project exists, create a minimal structure for testing
        const currentUser = this.currentUser();
        if (currentUser) {
          const project: Project = {
            id: this.projectId,
            title: 'New Project',
            description: 'Project description goes here.',
            needs: [],
            scope: 'local',
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString(),
            state: 'building',
            supports: [],
            opposes: [],
            comments: [],
            collaborators: [],
            collaborationRequests: [],
            chapters: [],
            creator: {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Anonymous',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || ''
            }
          };
          
          // Save the test project to the database first
          try {
            // Use the ProjectsService to create the project
            const { id, createdAt, state, supports, opposes, comments, ...projectData } = project;
            await this.projectsService.createProject(projectData);
          } catch (saveError) {
            console.error('Error saving test project:', saveError);
          }
          
          this.project.set(project);
        }
      }
      
      // Load pending collaborators if owner
      if (this.isOwner()) {
        await this.loadPendingCollaborators();
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async loadPendingCollaborators() {
    // This would load pending collaboration requests from the database
    // For now, start with empty array - only show section when there are actual requests
    this.pendingCollaborators.set([]);
  }
  
  editProject() {
    const proj = this.project();
    if (proj) {
      this.editingProject.set({
        title: proj.title,
        description: proj.description,
        scope: proj.scope,
        needs: [...(proj.needs || [])]
      });
      this.isEditingProject.set(true);
    }
  }
  
  async saveProject() {
    if (!this.projectId) return;
    
    try {
      const updates = this.editingProject();
      await this.projectsService.updateProject(this.projectId, updates);
      
      // Reload project
      await this.loadProject();
      
      // Reset editing state
      this.isEditingProject.set(false);
      this.editingProject.set({});
    } catch (error) {
      console.error('Error saving project:', error);
    }
  }

  async saveProjectChanges() {
    if (!this.projectId) return;
    
    try {
      const currentProject = this.project();
      if (currentProject) {
        await this.projectsService.updateProject(this.projectId, {
          chapters: currentProject.chapters
        });
      }
    } catch (error) {
      console.error('Error saving project changes:', error);
      throw error;
    }
  }
  
  cancelEdit() {
    this.isEditingProject.set(false);
    this.editingProject.set({});
  }
  
  addNeed() {
    const currentNeeds = this.editingProject().needs || [];
    this.editingProject.update(project => ({
      ...project,
      needs: [...currentNeeds, '']
    }));
  }
  
  removeNeed(index: number) {
    const currentNeeds = this.editingProject().needs || [];
    const newNeeds = currentNeeds.filter((_, i) => i !== index);
    this.editingProject.update(project => ({
      ...project,
      needs: newNeeds
    }));
  }
  
  async acceptCollaborator(collaborator: PendingCollaborator) {
    // Implementation for accepting collaborator
  }
  
  async rejectCollaborator(collaborator: PendingCollaborator) {
    // Implementation for rejecting collaborator
  }
  
  async showAddChapterModal() {
    const modal = await this.modalCtrl.create({
      component: AddSectionModalComponent,
      componentProps: {}
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      await this.addSection(data);
    }
  }

  async addSection(newSection?: Chapter) {
    if (!newSection) {
      newSection = {
        id: Date.now().toString(),
        title: '',
        description: '',
        media: []
      };
    }
    
    const currentChapters = this.project()?.chapters || [];
    
    // Update local state immediately using signals for instant UI update
    this.project.update(project => {
      if (project) {
        return {
          ...project,
          chapters: [...currentChapters, newSection!]
        };
      }
      return project;
    });
    
    // If it's a new section from modal, don't start editing
    if (!newSection.title && !newSection.description) {
      this.editChapter(newSection);
    }
    
    // Save to database in background without blocking UI
    try {
      await this.saveProjectChanges();
    } catch (error) {
      console.error('Error saving new section:', error);
      // Optionally show error toast/notification here
    }
  }

  async deleteSection(chapter: Chapter) {
    const currentChapters = this.project()?.chapters || [];
    const updatedChapters = currentChapters.filter(c => c.id !== chapter.id);
    
    // Update local state immediately using signals for instant UI update
    this.project.update(project => {
      if (project) {
        return {
          ...project,
          chapters: updatedChapters
        };
      }
      return project;
    });
    
    // Save to database in background without blocking UI
    try {
      await this.saveProjectChanges();
    } catch (error) {
      console.error('Error deleting section:', error);
      // Optionally show error toast/notification here
    }
  }
  
  editChapter(chapter: Chapter) {
    this.editingChapter.set({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description
    });
  }
  
  async saveChapter() {
    const editing = this.editingChapter();
    if (!editing.id) return;
    
    const currentChapters = this.project()?.chapters || [];
    const updatedChapters = currentChapters.map(chapter => 
      chapter.id === editing.id 
        ? { ...chapter, title: editing.title || '', description: editing.description || '' }
        : chapter
    );
    
    // Update local state immediately using signals for instant UI update
    this.project.update(project => {
      if (project) {
        return {
          ...project,
          chapters: updatedChapters
        };
      }
      return project;
    });
    
    // Clear editing state immediately for better UX
    this.editingChapter.set({});
    
    // Save to database in background without blocking UI
    try {
      await this.saveProjectChanges();
    } catch (error) {
      console.error('Error saving chapter:', error);
      // Optionally show error toast/notification here
    }
  }
  
  cancelChapterEdit() {
    this.editingChapter.set({});
  }
  
  canEditChapter(chapter: Chapter): boolean {
    const user = this.currentUser();
    const proj = this.project();
    // TEMPORARY: Always return true for testing so you can see the buttons
    return true;
  }
  
  isEditingChapter(chapterId: string): boolean {
    const isEditing = this.editingChapter().id === chapterId;
    return isEditing;
  }
  
  showAddMediaModal(chapter: Chapter) {
    // For now, we'll add mock media
    // Later this can be enhanced with file upload functionality
    this.addMockMedia(chapter);
  }

  async addMockMedia(chapter: Chapter) {
    // For testing purposes, add a placeholder media item
    // In a real app, this would open a file picker
    const mediaType = Math.random() > 0.5 ? 'image' : 'video';
    const newMedia: Media = {
      id: Date.now().toString(),
      type: mediaType,
      url: mediaType === 'image' 
        ? 'https://via.placeholder.com/400x300/007acc/ffffff?text=Sample+Image'
        : 'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4',
      caption: `Sample ${mediaType} - Click to replace with real content`
    };
    
    const currentChapters = this.project()?.chapters || [];
    const updatedChapters = currentChapters.map(c => 
      c.id === chapter.id 
        ? { ...c, media: [...(c.media || []), newMedia] }
        : c
    );
    
    // Update local state immediately using signals for instant UI update
    this.project.update(project => {
      if (project) {
        return {
          ...project,
          chapters: updatedChapters
        };
      }
      return project;
    });
    
    // Save to database in background without blocking UI
    try {
      await this.saveProjectChanges();
    } catch (error) {
      console.error('Error adding media:', error);
      // Optionally show error toast/notification here
    }
  }

  async deleteMedia(chapter: Chapter, media: Media) {
    const currentChapters = this.project()?.chapters || [];
    const updatedChapters = currentChapters.map(c => 
      c.id === chapter.id 
        ? { ...c, media: (c.media || []).filter(m => m.id !== media.id) }
        : c
    );
    
    // Update local state immediately using signals for instant UI update
    this.project.update(project => {
      if (project) {
        return {
          ...project,
          chapters: updatedChapters
        };
      }
      return project;
    });
    
    // Save to database in background without blocking UI
    try {
      await this.saveProjectChanges();
    } catch (error) {
      console.error('Error deleting media:', error);
      // Optionally show error toast/notification here
    }
  }

  previewMedia(media: Media) {
    // For now, just log the media
    // Later this can be enhanced with a modal preview
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
}
