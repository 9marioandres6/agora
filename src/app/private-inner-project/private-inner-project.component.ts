import { Component, computed, inject, signal, OnDestroy, ViewChildren, QueryList, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController, AlertController, IonInput } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProjectsService } from '../services/projects.service';
import { Project, Chapter, Media, Need } from '../services/models/project.models';
import { SupabaseService } from '../services/supabase.service';
import { PendingCollaborator } from './models/private-inner-project.models';

@Component({
  selector: 'app-private-inner-project',
  templateUrl: './private-inner-project.component.html',
  styleUrls: ['./private-inner-project.component.scss'],
  imports: [CommonModule, IonicModule, TranslateModule, FormsModule]
})
export class PrivateInnerProjectComponent implements OnDestroy {
  @ViewChildren('chapterTitleInput') chapterTitleInputs!: QueryList<IonInput>;

  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private projectsService = inject(ProjectsService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private supabaseService = inject(SupabaseService);
  private translateService = inject(TranslateService);
  private alertCtrl = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);
  
  projectId = this.route.snapshot.paramMap.get('id');
  
  // Auto-save timer
  private autoSaveTimer: any;
  
  // Auto-save timer for project fields
  private projectAutoSaveTimer: any;
  
  // New need input
  newNeedText = '';
  
  // Signals
  readonly project = signal<Project | null>(null);
  readonly isLoading = signal(true);
  readonly isEditingProject = signal(false);
  readonly editingProject = signal<Partial<Project>>({});
  readonly editingChapter = signal<Partial<Chapter>>({});
  readonly pendingCollaborators = signal<PendingCollaborator[]>([]);
  readonly membersExpanded = signal(false);
  
  // Computed properties
  readonly currentUser = computed(() => this.authService.user());
  readonly isOwner = computed(() => {
    const user = this.currentUser();
    const proj = this.project();
    return user && proj && user.uid === proj.createdBy;
  });
  
  constructor() {
    // Subscribe to project changes in constructor (injection context)
    effect(() => {
      const project = this.projectsService.currentProject();
      
      if (project) {
        this.project.set(project);
        this.isLoading.set(false);
        
        // Load pending collaborators if owner
        if (this.isOwner()) {
          this.loadPendingCollaborators();
        }
      } else {
        // Project not found or still loading
        this.isLoading.set(true);
      }
    });
    
    this.loadProject();
  }
  
  loadProject() {
    if (!this.projectId) return;
    
    // Set up real-time listener for this project
    this.projectsService.setupProjectListener(this.projectId);
    
    // Add a timeout to handle cases where project doesn't exist
    setTimeout(() => {
      const currentProject = this.projectsService.currentProject();
      if (!currentProject && this.isLoading()) {
        this.createFallbackProject();
      }
    }, 3000); // Wait 3 seconds before creating fallback
  }

  private async createFallbackProject() {
    try {
      const currentUser = this.currentUser();
      if (!currentUser) return;

      const projectData = {
        title: this.translateService.instant('PROJECT.NEW_PROJECT'),
        description: this.translateService.instant('PROJECT.PROJECT_DESCRIPTION_PLACEHOLDER'),
        needs: [],
        scope: 'local',
        createdBy: currentUser.uid,
        collaborators: [],
        collaborationRequests: []
      };

      // Create the project in the database
      await this.projectsService.createProject(projectData);
      
      // The real-time listener will automatically pick up the new project
    } catch (error) {
      console.error('Error creating fallback project:', error);
      this.isLoading.set(false);
    }
  }
  
  loadPendingCollaborators() {
    const currentProject = this.project();
    if (currentProject && currentProject.collaborationRequests) {
      // Filter only pending requests
      const pendingRequests = currentProject.collaborationRequests
        .filter(request => request.status === 'pending')
        .map(request => ({
          uid: request.uid,
          displayName: request.displayName || 'Anonymous',
          email: request.email || '',
          photoURL: request.photoURL || '',
          message: request.message || '',
          requestedAt: request.requestedAt || new Date().toISOString()
        }));
      
      this.pendingCollaborators.set(pendingRequests);
    } else {
      this.pendingCollaborators.set([]);
    }
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
      needs: [...currentNeeds, { name: '', state: 'pending' }]
    }));
  }

  addNewNeed() {
    if (!this.newNeedText?.trim()) return;
    
    const currentNeeds = this.editingProject().needs || [];
    const newNeed = this.newNeedText.trim();
    
    // Check if need already exists
    if (currentNeeds.some(need => need.name === newNeed)) {
      // You could show a toast message here about duplicate needs
      return;
    }
    
    // Add the new need
    this.editingProject.update(project => ({
      ...project,
      needs: [...currentNeeds, { name: newNeed, state: 'pending' }]
    }));
    
    // Clear the input
    this.newNeedText = '';
    
    // Save the changes
    this.saveProjectField('needs');
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
    try {
      if (!this.projectId) return;
      
      const result = await this.projectsService.acceptCollaboration(this.projectId, collaborator.uid);
      
      // Remove from pending list
      this.pendingCollaborators.update(pending => 
        pending.filter(p => p.uid !== collaborator.uid)
      );
      
      // Update local project state
      this.project.update(project => {
        if (project) {
          return {
            ...project,
            collaborators: [...(project.collaborators || []), result.collaborator],
            collaborationRequests: (project.collaborationRequests || []).filter(req => req.uid !== result.request.uid)
          };
        }
        return project;
      });
      
      await this.showToast(
        this.translateService.instant('PROJECT.COLLABORATOR_ACCEPTED', { name: collaborator.displayName }),
        'success'
      );
    } catch (error) {
      console.error('Error accepting collaborator:', error);
      await this.showToast(
        this.translateService.instant('PROJECT.ERROR_ACCEPTING_COLLABORATOR'),
        'danger'
      );
    }
  }
  
  async rejectCollaborator(collaborator: PendingCollaborator) {
    try {
      if (!this.projectId) return;
      
      const rejectedRequest = await this.projectsService.rejectCollaboration(this.projectId, collaborator.uid);
      
      // Remove from pending list
      this.pendingCollaborators.update(pending => 
        pending.filter(p => p.uid !== collaborator.uid)
      );
      
      // Update local project state
      this.project.update(project => {
        if (project) {
          return {
            ...project,
            collaborationRequests: (project.collaborationRequests || []).filter(req => req.uid !== rejectedRequest.uid)
          };
        }
        return project;
      });
      
      await this.showToast(
        this.translateService.instant('PROJECT.COLLABORATOR_REJECTED', { name: collaborator.displayName }),
        'success'
      );
    } catch (error) {
      console.error('Error rejecting collaborator:', error);
      await this.showToast(
        this.translateService.instant('PROJECT.ERROR_REJECTING_COLLABORATOR'),
        'danger'
      );
    }
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

    // Focus on the title input field after the view updates
    this.cdr.detectChanges();
    setTimeout(() => {
      // Get the last (most recently added) title input, which should be the one being edited
      const titleInputs = this.chapterTitleInputs.toArray();
      if (titleInputs.length > 0) {
        const lastInput = titleInputs[titleInputs.length - 1];
        lastInput.setFocus();
      }
    }, 100);
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

  // Project field editing methods
  startEditingProjectField(field: 'title' | 'description' | 'scope' | 'needs') {
    const proj = this.project();
    if (!proj) return;

    switch (field) {
      case 'title':
        this.editingProject.update(project => ({ ...project, title: proj.title || '' }));
        break;
      case 'description':
        this.editingProject.update(project => ({ ...project, description: proj.description || '' }));
        break;
      case 'scope':
        this.editingProject.update(project => ({ ...project, scope: proj.scope || '' }));
        break;
      case 'needs':
        this.editingProject.update(project => ({ ...project, needs: [...(proj.needs || [])] }));
        break;
    }
  }

  async saveProjectField(field: 'title' | 'description' | 'scope' | 'needs') {
    if (!this.projectId) return;

    const proj = this.project();
    if (!proj) return;

    let updates: Partial<Project> = {};

          switch (field) {
        case 'title':
          const newTitle = this.editingProject().title?.trim();
          if (newTitle && newTitle !== proj.title) {
            updates.title = newTitle;
          }
          break;
        case 'description':
          const newDescription = this.editingProject().description?.trim();
          if (newDescription !== proj.description) {
            updates.description = newDescription;
          }
          break;
        case 'scope':
          const newScope = this.editingProject().scope;
          if (newScope && newScope !== proj.scope) {
            updates.scope = newScope;
          }
          break;
        case 'needs':
          const newNeeds = this.editingProject().needs?.filter(need => need.name?.trim()) || [];
          if (JSON.stringify(newNeeds) !== JSON.stringify(proj.needs)) {
            updates.needs = newNeeds;
          }
          break;
      }

    if (Object.keys(updates).length > 0) {
      try {
        await this.projectsService.updateProject(this.projectId, updates);
        
        // Update local state
        this.project.update(project => {
          if (project) {
            return { ...project, ...updates };
          }
          return project;
        });

        // Clear editing state
        this.startEditingProjectField(field);
      } catch (error) {
        console.error(`Error saving project ${field}:`, error);
        await this.showToast(`Error saving ${field}`, 'danger');
      }
    } else {
      this.startEditingProjectField(field);
    }
  }

  cancelProjectFieldEdit(field: 'title' | 'description' | 'scope' | 'needs') {
    this.startEditingProjectField(field);
  }

  // Auto-save for project fields
  private startProjectFieldAutoSave(field: 'title' | 'description' | 'scope' | 'needs') {
    this.stopProjectFieldAutoSave();
    
    this.projectAutoSaveTimer = setInterval(() => {
      this.autoSaveProjectField(field);
    }, 1000);
  }

  private stopProjectFieldAutoSave() {
    if (this.projectAutoSaveTimer) {
      clearInterval(this.projectAutoSaveTimer);
      this.projectAutoSaveTimer = null;
    }
  }

  private async autoSaveProjectField(field: 'title' | 'description' | 'scope' | 'needs') {
    const proj = this.project();
    if (!proj) return;

    let updates: Partial<Project> = {};
    let hasChanges = false;

          switch (field) {
        case 'title':
          const newTitle = this.editingProject().title?.trim();
          if (newTitle && newTitle !== proj.title) {
            updates.title = newTitle;
            hasChanges = true;
          }
          break;
        case 'description':
          const newDescription = this.editingProject().description?.trim();
          if (newDescription !== proj.description) {
            updates.description = newDescription;
            hasChanges = true;
          }
          break;
        case 'scope':
          const newScope = this.editingProject().scope;
          if (newScope && newScope !== proj.scope) {
            updates.scope = newScope;
            hasChanges = true;
          }
          break;
        case 'needs':
          const newNeeds = this.editingProject().needs?.filter(need => need.name?.trim()) || [];
          if (JSON.stringify(newNeeds) !== JSON.stringify(proj.needs)) {
            updates.needs = newNeeds;
            hasChanges = true;
          }
          break;
      }

    if (hasChanges) {
      try {
        await this.projectsService.updateProject(this.projectId!, updates);
        
        // Update local state
        this.project.update(project => {
          if (project) {
            return { ...project, ...updates };
          }
          return project;
        });
      } catch (error) {
        console.error(`Auto-save error for ${field}:`, error);
      }
    }
  }

  // Needs management methods
  addProjectNeed() {
    const currentNeeds = this.editingProject().needs || [];
    this.editingProject.update(project => ({ ...project, needs: [...currentNeeds, { name: '', state: 'pending' }] }));
    this.startProjectFieldAutoSave('needs');
  }

  removeProjectNeed(index: number) {
    const currentNeeds = this.editingProject().needs || [];
    const newNeeds = currentNeeds.filter((_, i) => i !== index);
    this.editingProject.update(project => ({ ...project, needs: newNeeds }));
    this.startProjectFieldAutoSave('needs');
  }

  updateProjectNeed(index: number, value: string) {
    const currentNeeds = this.editingProject().needs || [];
    const newNeeds = [...currentNeeds];
    newNeeds[index] = { ...newNeeds[index], name: value };
    this.editingProject.update(project => ({ ...project, needs: newNeeds }));
    this.startProjectFieldAutoSave('needs');
  }

  updateProjectField(field: 'title' | 'description' | 'scope', value: string) {
    this.editingProject.update(project => ({ ...project, [field]: value }));
    this.startProjectFieldAutoSave(field);
  }

  // Chapter auto-save methods
  private startAutoSave() {
    this.stopAutoSave();
    
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
    return !!(user && proj && (user.uid === proj.createdBy || proj.collaborators?.some(c => c.uid === user.uid)));
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

  showAddProjectMediaModal() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*';
    fileInput.multiple = false;
    
    fileInput.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        this.handleProjectFileUpload(Array.from(files));
      }
    };
    
    fileInput.click();
  }

  replaceProjectMedia() {
    this.showAddProjectMediaModal();
  }

  async handleProjectFileUpload(files: File[]) {
    const maxFileSize = 10 * 1024 * 1024;
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    for (const file of files) {
      try {
        if (file.size > maxFileSize) {
          await this.showToast(`File ${file.name} is too large. Maximum size is 10MB.`, 'warning');
          continue;
        }
        
        const isValidImage = allowedImageTypes.includes(file.type);
        const isValidVideo = allowedVideoTypes.includes(file.type);
        
        if (!isValidImage && !isValidVideo) {
          await this.showToast(`File ${file.name} has an unsupported type.`, 'warning');
          continue;
        }
        
        await this.showToast(`Uploading ${file.name}...`, 'success');
        
        const uploadResult = await this.supabaseService.uploadFile(
          file, 
          'agora-project', 
          'projects'
        );
        
        if (!uploadResult) {
          await this.showToast(`Failed to upload ${file.name}`, 'danger');
          continue;
        }
        
        const mediaType = isValidImage ? 'image' : 'video';
        
        const newMedia: Media = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: mediaType,
          url: uploadResult.url,
          caption: file.name || `Uploaded ${mediaType}`,
          storagePath: uploadResult.path,
          fileName: file.name,
          fileSize: file.size
        };
        
        this.project.update(project => {
          if (project) {
            return {
              ...project,
              media: [newMedia]
            };
          }
          return project;
        });
        
        try {
          await this.projectsService.updateProject(this.projectId!, { media: [newMedia] });
          await this.showToast(`Successfully uploaded ${file.name}`, 'success');
        } catch (error) {
          console.error('Error saving project media to database:', error);
          await this.showToast(`Error saving ${file.name} to database`, 'danger');
        }
        
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        await this.showToast(`Error processing ${file.name}`, 'danger');
      }
    }
  }

  async deleteProjectMedia(media: Media) {
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
    
    this.project.update(project => {
      if (project) {
        return {
          ...project,
          media: []
        };
      }
      return project;
    });
    
    try {
      await this.projectsService.updateProject(this.projectId!, { media: [] });
      await this.showToast(`Successfully deleted ${media.caption}`, 'success');
    } catch (error) {
      console.error('Error deleting project media from database:', error);
      await this.showToast(`Error deleting media from database`, 'danger');
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

  getNeedIcon(need: Need): string {
    return need.state === 'obtained' ? 'checkmark-circle' : 'time';
  }

  getNeedIconColor(need: Need): string {
    return need.state === 'obtained' ? 'success' : 'warning';
  }

  getNeedChipColor(need: Need): string {
    return need.state === 'obtained' ? 'success' : 'warning';
  }

  getNeedStateText(need: Need): string {
    return need.state === 'obtained' ? 'HOME.NEED_OBTAINED' : 'HOME.NEED_PENDING';
  }

  async toggleNeedState(need: Need) {
    if (!this.isOwner() || !this.projectId) return;
    
    const currentProject = this.project();
    if (!currentProject) return;
    
    const currentState = need.state;
    const newState = currentState === 'pending' ? 'obtained' : 'pending';
    
    try {
      // Update local state immediately for instant UI feedback
      this.project.update(project => {
        if (project) {
          return {
            ...project,
            needs: project.needs.map(n => 
              n.name === need.name ? { ...n, state: newState } : n
            )
          };
        }
        return project;
      });
      
      // Update in database
      await this.projectsService.updateProject(this.projectId, {
        needs: currentProject.needs.map(n => 
          n.name === need.name ? { ...n, state: newState } : n
        )
      });
      
    } catch (error) {
      console.error('Error toggling need state:', error);
      await this.showToast('Error updating need state', 'danger');
      
      // Revert local state on error
      this.project.update(project => {
        if (project) {
          return {
            ...project,
            needs: project.needs.map(n => 
              n.name === need.name ? { ...n, state: currentState } : n
            )
          };
        }
        return project;
      });
    }
  }

  getMembersSummary(): string {
    const project = this.project();
    if (!project) return '';
    
    const collaboratorsCount = (project.collaborators || []).length;
    const pendingCount = (project.collaborationRequests || []).length;
    
    if (collaboratorsCount === 0 && pendingCount === 0) {
      return '0 Collaborators yet - No requests';
    } else if (collaboratorsCount === 0) {
      return `0 Collaborators yet - ${pendingCount} request${pendingCount > 1 ? 's' : ''}`;
    } else if (pendingCount === 0) {
      return `${collaboratorsCount} Collaborator${collaboratorsCount > 1 ? 's' : ''} - No requests`;
    } else {
      return `${collaboratorsCount} Collaborator${collaboratorsCount > 1 ? 's' : ''} - ${pendingCount} request${pendingCount > 1 ? 's' : ''}`;
    }
  }

  toggleMembers() {
    this.membersExpanded.update(expanded => !expanded);
  }

  ngOnDestroy() {
    // Stop auto-save timers
    this.stopAutoSave();
    this.stopProjectFieldAutoSave();
    
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
    
    // Clean up the project listener
    if (this.projectId) {
      this.projectsService.cleanupProjectListener(this.projectId);
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
