import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController, AlertController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProjectsService, Project, Chapter, Media } from '../services/projects.service';
import { SupabaseService } from '../services/supabase.service';


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
export class PrivateInnerProjectComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private projectsService = inject(ProjectsService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private supabaseService = inject(SupabaseService);
  private translateService = inject(TranslateService);
  private alertCtrl = inject(AlertController);
  
  projectId = this.route.snapshot.paramMap.get('id');
  
  // Auto-save timer
  private autoSaveTimer: any;
  
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
            title: this.translateService.instant('PROJECT.NEW_PROJECT'),
            description: this.translateService.instant('PROJECT.PROJECT_DESCRIPTION_PLACEHOLDER'),
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
    await this.addSection();
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
    // Delete all media files from Supabase storage for this section
    if (chapter.media && chapter.media.length > 0) {
      try {
        const deleted = await this.supabaseService.deleteSectionFiles(chapter.id);
        if (!deleted) {
          await this.showToast(`Warning: Could not delete some media files from storage`, 'warning');
        }
      } catch (error) {
        console.error('Error deleting section files from storage:', error);
        await this.showToast(`Warning: Could not delete media files from storage`, 'warning');
      }
    }
    
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
      await this.showToast(`Successfully deleted section`, 'success');
    } catch (error) {
      console.error('Error deleting section:', error);
      await this.showToast(`Error deleting section from database`, 'danger');
    }
  }
  
  editChapter(chapter: Chapter) {
    this.editingChapter.set({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description
    });
    
    // Start auto-save timer
    this.startAutoSave();
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
    this.stopAutoSave();
    
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
    this.stopAutoSave();
  }
  
  private startAutoSave() {
    // Clear any existing timer
    this.stopAutoSave();
    
    // Set up auto-save every 1 second
    this.autoSaveTimer = setInterval(() => {
      this.autoSaveChapter();
    }, 1000);
  }
  
  private stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
  
  private async autoSaveChapter() {
    const editing = this.editingChapter();
    if (!editing.id) return;
    
    const currentChapters = this.project()?.chapters || [];
    const updatedChapters = currentChapters.map(chapter => 
      chapter.id === editing.id 
        ? { ...chapter, title: editing.title || '', description: editing.description || '' }
        : chapter
    );
    
    // Update local state immediately
    this.project.update(project => {
      if (project) {
        return {
          ...project,
          chapters: updatedChapters
        };
      }
      return project;
    });
    
    // Save to database in background
    try {
      await this.saveProjectChanges();
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }
  
  async showDeleteConfirmation(chapter: Chapter) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete the section "${chapter.title || 'Untitled'}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteSection(chapter);
          }
        }
      ]
    });
    
    await alert.present();
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
    // If section already has media, replace it instead of adding
    if (chapter.media && chapter.media.length > 0) {
      this.replaceMedia(chapter);
    } else {
      // Create a hidden file input for file selection
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*,video/*';
      fileInput.multiple = false; // Only one file at a time
      
      fileInput.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          this.handleFileUpload(chapter, Array.from(files));
        }
      };
      
      fileInput.click();
    }
  }

  replaceMedia(chapter: Chapter) {
    // Create a hidden file input for file selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*';
    fileInput.multiple = false; // Only one file at a time
    
    fileInput.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // Delete existing media first
        if (chapter.media && chapter.media.length > 0) {
          for (const media of chapter.media) {
            await this.deleteMedia(chapter, media);
          }
        }
        // Upload new media
        this.handleFileUpload(chapter, Array.from(files));
      }
    };
    
    fileInput.click();
  }

  async handleFileUpload(chapter: Chapter, files: File[]) {
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    for (const file of files) {
      try {
        // Validate file size
        if (file.size > maxFileSize) {
          await this.showToast(`File ${file.name} is too large. Maximum size is 10MB.`, 'warning');
          continue;
        }
        
        // Validate file type
        const isValidImage = allowedImageTypes.includes(file.type);
        const isValidVideo = allowedVideoTypes.includes(file.type);
        
        if (!isValidImage && !isValidVideo) {
          await this.showToast(`File ${file.name} has an unsupported type.`, 'warning');
          continue;
        }
        
        // Show upload progress
        await this.showToast(`Uploading ${file.name}...`, 'success');
        
        // Upload file to Supabase storage in sections folder with section ID subfolder
        const uploadResult = await this.supabaseService.uploadFile(
          file, 
          'agora-project', 
          `sections/${chapter.id}`
        );
        
        if (!uploadResult) {
          await this.showToast(`Failed to upload ${file.name}`, 'danger');
          continue;
        }
        
        // Determine media type
        const mediaType = isValidImage ? 'image' : 'video';
        
        // Create media object with Supabase URL
        const newMedia: Media = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: mediaType,
          url: uploadResult.url,
          caption: file.name || `Uploaded ${mediaType}`,
          storagePath: uploadResult.path,
          fileName: file.name,
          fileSize: file.size
        };
        
        // Update local state immediately using signals
        const currentChapters = this.project()?.chapters || [];
        const updatedChapters = currentChapters.map(c => 
          c.id === chapter.id 
            ? { ...c, media: [...(c.media || []), newMedia] }
            : c
        );
        
        this.project.update(project => {
          if (project) {
            return {
              ...project,
              chapters: updatedChapters
            };
          }
          return project;
        });
        
        // Save to database in background
        try {
          await this.saveProjectChanges();
          await this.showToast(`Successfully uploaded ${file.name}`, 'success');
        } catch (error) {
          console.error('Error saving media to database:', error);
          await this.showToast(`Error saving ${file.name} to database`, 'danger');
        }
        
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        await this.showToast(`Error processing ${file.name}`, 'danger');
      }
    }
  }



  async deleteMedia(chapter: Chapter, media: Media) {
    // Clean up object URL to prevent memory leaks (for local files)
    if (media.url.startsWith('blob:')) {
      URL.revokeObjectURL(media.url);
    }
    
    // Delete file from Supabase storage if it exists there
    if (media.storagePath) {
      try {
        const deleted = await this.supabaseService.deleteFile(media.storagePath);
        if (!deleted) {
          await this.showToast(`Warning: Could not delete file from storage`, 'warning');
        }
      } catch (error) {
        console.error('Error deleting file from storage:', error);
        await this.showToast(`Warning: Could not delete file from storage`, 'warning');
      }
    }
    
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
      await this.showToast(`Successfully deleted ${media.caption}`, 'success');
    } catch (error) {
      console.error('Error deleting media:', error);
      await this.showToast(`Error deleting media from database`, 'danger');
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

  ngOnDestroy() {
    // Stop auto-save timer
    this.stopAutoSave();
    
    // Clean up all object URLs to prevent memory leaks
    const project = this.project();
    if (project?.chapters) {
      project.chapters.forEach(chapter => {
        chapter.media?.forEach(media => {
          if (media.url.startsWith('blob:')) {
            URL.revokeObjectURL(media.url);
          }
        });
      });
    }
  }

  // Helper method to check if media is from Supabase storage
  isSupabaseMedia(media: Media): boolean {
    return media.url.includes('supabase.co') || !!media.storagePath;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
