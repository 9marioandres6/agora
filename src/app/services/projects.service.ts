import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, getDocs, getDoc, DocumentData, arrayUnion, arrayRemove, onSnapshot, Unsubscribe } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Project, Chapter, Media, Collaborator, CollaborationRequest, Comment, Need } from './models/project.models';
import { MessagesService } from './messages.service';
import { LoadingService } from './loading.service';
import { FirebaseQueryService, FilterOptions } from './firebase-query.service';
import { FilterStateService } from './filter-state.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private messagesService = inject(MessagesService);
  private loadingService = inject(LoadingService);
  private firebaseQueryService = inject(FirebaseQueryService);
  private filterStateService = inject(FilterStateService);

  // Reactive signals for real-time data
  private _projects = signal<Project[]>([]);
  private _userProjects = signal<Project[]>([]);
  private _projectsByScope = signal<Map<string, Project[]>>(new Map());
  private _currentProject = signal<Project | null>(null);
  
  // Public computed signals
  public readonly projects = this._projects.asReadonly();
  public readonly userProjects = this._userProjects.asReadonly();
  public readonly projectsByScope = this._projects.asReadonly();
  public readonly currentProject = this._currentProject.asReadonly();
  public readonly filteredProjects = this.firebaseQueryService.filteredProjects;
  public readonly isLoadingFiltered = this.firebaseQueryService.isLoading;
  public readonly hasMoreFiltered = this.firebaseQueryService.hasMore;

  // Active listeners to clean up
  private listeners: Map<string, Unsubscribe> = new Map();

  private get projectsCollection() {
    return collection(this.firestore, 'projects');
  }

  // Initialize real-time listeners
  constructor() {
    try {
      this.loadingService.setProjectsLoading(true);
      
      // Set up user projects listener when user changes
      effect(() => {
        const user = this.authService.user();
        
        if (user?.uid) {
          this.setupUserProjectsListener(user.uid);
        } else {
          this.cleanupUserProjectsListener();
          // Only set loading to false when there's no user
          this.loadingService.setProjectsLoading(false);
        }
      });
      
      // Don't mark loading as complete here - wait for actual data
    } catch (error) {
      this.loadingService.setProjectsLoading(false);
    }
  }

  private hasProjectsLoaded(): boolean {
    // Check if we have any projects loaded in any of our signals
    return this._userProjects().length > 0 || 
           this._projectsByScope().size > 0 || 
           this._currentProject() !== null;
  }

  private updateLoadingState(): void {
    // Only set loading to false if we actually have projects loaded
    if (this.hasProjectsLoaded()) {
      this.loadingService.setProjectsLoading(false);
    }
  }

  private setupUserProjectsListener(userId: string) {
    this.cleanupUserProjectsListener();
    
    const q = query(
      this.projectsCollection,
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Ensure new fields have default values for existing projects
      const processedProjects = projects.map(project => {
        if (project.state === undefined) project.state = 'building';
        if (project.supports === undefined || typeof project.supports === 'number') project.supports = [];
        if (project.opposes === undefined || typeof project.opposes === 'number') project.opposes = [];
        if (project.comments === undefined) project.comments = [];
        if (project.collaborators === undefined) project.collaborators = [];
        if (project.collaborationRequests === undefined) project.collaborationRequests = [];
        
        return project;
      });

      this._userProjects.set(processedProjects);
      
      // Update loading state based on whether we actually have projects
      this.updateLoadingState();
    }, (error) => {
      console.error('Error in user projects listener:', error);
      // Set loading to false even on error
      this.loadingService.setProjectsLoading(false);
    });

    this.listeners.set('user', unsubscribe);
  }

  private cleanupUserProjectsListener() {
    const userListener = this.listeners.get('user');
    if (userListener) {
      userListener();
      this.listeners.delete('user');
    }
  }

  public setupProjectListener(projectId: string) {
    try {
      // Clean up existing listener for this project
      const existingListener = this.listeners.get(`project_${projectId}`);
      if (existingListener) {
        existingListener();
      }

      const projectRef = doc(this.firestore, 'projects', projectId);
      
      const unsubscribe = onSnapshot(projectRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as Project;
          const project = {
            ...data,
            id: projectId
          };
          this._currentProject.set(project);
        } else {
          this._currentProject.set(null);
        }
      }, (error) => {
        // Handle listener errors silently
        this._currentProject.set(null);
      });

      this.listeners.set(`project_${projectId}`, unsubscribe);
    } catch (error) {
      // Handle setup errors silently
      this._currentProject.set(null);
    }
  }

  public cleanupProjectListener(projectId: string) {
    const listener = this.listeners.get(`project_${projectId}`);
    if (listener) {
      listener();
      this.listeners.delete(`project_${projectId}`);
    }
  }

  public setupScopeProjectsListener(scope: string) {
    // Clean up existing listener for this scope
    const existingListener = this.listeners.get(`scope_${scope}`);
    if (existingListener) {
      existingListener();
    }

    if (scope === 'grupal') {
      // For Groupal projects, we need to query separately for creator and collaborator projects
      this.setupGrupalProjectsListener();
    } else {
      // For other scopes, use the standard query
      const q = query(
        this.projectsCollection,
        where('scope.scope', '==', scope),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const projects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];

        // Ensure new fields have default values for existing projects
        const processedProjects = projects.map(project => {
          if (project.state === undefined) project.state = 'building';
          if (project.supports === undefined || typeof project.supports === 'number') project.supports = [];
          if (project.opposes === undefined || typeof project.opposes === 'number') project.opposes = [];
          if (project.comments === undefined) project.comments = [];
          if (project.collaborators === undefined) project.collaborators = [];
          if (project.collaborationRequests === undefined) project.collaborationRequests = [];
          return project;
        });

        const currentScopeMap = this._projectsByScope();
        currentScopeMap.set(scope, processedProjects);
        this._projectsByScope.set(new Map(currentScopeMap));
        
        // Set loading to false only after we receive data
        this.loadingService.setProjectsLoading(false);
      }, (error) => {
        console.error(`Error in scope ${scope} projects listener:`, error);
        // Set loading to false even on error
        this.loadingService.setProjectsLoading(false);
      });

      this.listeners.set(`scope_${scope}`, unsubscribe);
    }
  }

  private setupGrupalProjectsListener() {
    const currentUser = this.authService.user();
    if (!currentUser?.uid) {
      // No user logged in, set empty projects for Groupal scope
      const currentScopeMap = this._projectsByScope();
      currentScopeMap.set('grupal', []);
      this._projectsByScope.set(new Map(currentScopeMap));
      // Set loading to false when no user
      this.loadingService.setProjectsLoading(false);
      return;
    }

    // Query 1: Projects where user is creator
    const creatorQuery = query(
      this.projectsCollection,
      where('scope.scope', '==', 'grupal'),
      where('createdBy', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    // Query 2: Projects where user is collaborator
    const collaboratorQuery = query(
      this.projectsCollection,
      where('scope.scope', '==', 'grupal'),
      where('collaborators', 'array-contains', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    // Listen to both queries
    const unsubscribeCreator = onSnapshot(creatorQuery, (creatorSnapshot) => {
      const creatorProjects = creatorSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Listen to collaborator projects
      const unsubscribeCollaborator = onSnapshot(collaboratorQuery, (collaboratorSnapshot) => {
        const collaboratorProjects = collaboratorSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];

        // Combine and deduplicate projects
        const allProjects = [...creatorProjects, ...collaboratorProjects];
        const uniqueProjects = allProjects.filter((project, index, self) => 
          index === self.findIndex(p => p.id === project.id)
        );

        // Ensure new fields have default values for existing projects
        const processedProjects = uniqueProjects.map(project => {
          if (project.state === undefined) project.state = 'building';
          if (project.supports === undefined || typeof project.supports === 'number') project.supports = [];
          if (project.opposes === undefined || typeof project.opposes === 'number') project.opposes = [];
          if (project.comments === undefined) project.comments = [];
          if (project.collaborators === undefined) project.collaborators = [];
          if (project.collaborationRequests === undefined) project.collaborationRequests = [];
          return project;
        });

        const currentScopeMap = this._projectsByScope();
        currentScopeMap.set('grupal', processedProjects);
        this._projectsByScope.set(new Map(currentScopeMap));

        // Set loading to false only after we receive data
        this.loadingService.setProjectsLoading(false);

        // Clean up collaborator listener
        unsubscribeCollaborator();
      }, (error) => {
        console.error('Error in Groupal collaborator projects listener:', error);
        // Set loading to false even on error
        this.loadingService.setProjectsLoading(false);
      });

      // Clean up creator listener
      unsubscribeCreator();
    }, (error) => {
      console.error('Error in Groupal creator projects listener:', error);
      // Set loading to false even on error
      this.loadingService.setProjectsLoading(false);
    });

    this.listeners.set(`scope_grupal`, () => {
      unsubscribeCreator();
    });
  }

  public cleanupScopeProjectsListener(scope: string) {
    const listener = this.listeners.get(`scope_${scope}`);
    if (listener) {
      listener();
      this.listeners.delete(`scope_${scope}`);
    }
  }

  // Clean up all listeners when service is destroyed
  public cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'state' | 'supports' | 'opposes' | 'comments'>): Promise<string> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const project: Omit<Project, 'id'> = {
        ...projectData,
        createdAt: new Date().toISOString(),
        status: 'active',
        state: 'building',
        supports: [],
        opposes: [],
        comments: [],
        participants: [projectData.createdBy],
        tags: this.generateTags(projectData.title, projectData.description, projectData.needs),
        creator: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Anonymous',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || ''
        }
      };
      
      const docRef = await addDoc(this.projectsCollection, project);
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Reactive getter - returns current signal value
  getProjects(): Project[] {
    return this.projects();
  }

  // Legacy async method for backward compatibility
  async getProjectsAsync(limitCount: number = 50): Promise<Project[]> {
    try {
      const q = query(
        this.projectsCollection,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Ensure all projects have creator info and new fields
      return projects.map(project => {
        if (!project.creator) {
          project.creator = {
            uid: project.createdBy,
            displayName: 'Anonymous',
            email: '',
            photoURL: ''
          };
        }
        // Ensure photoURL is always available
        if (!project.creator.photoURL) {
          project.creator.photoURL = '';
        }
        // Ensure new fields have default values for existing projects
        if (project.state === undefined) {
          project.state = 'building';
        }
        if (project.supports === undefined || typeof project.supports === 'number') {
          project.supports = [];
        }
        if (project.opposes === undefined || typeof project.opposes === 'number') {
          project.opposes = [];
        }
        if (project.comments === undefined) {
          project.comments = [];
        }
        if (project.collaborators === undefined) {
          project.collaborators = [];
        }
        if (project.collaborationRequests === undefined) {
          project.collaborationRequests = [];
        }
        return project;
      });
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  // Reactive getter - returns current signal value
  getProject(projectId: string): Project | null {
    // Set up listener if not already listening
    this.setupProjectListener(projectId);
    return this.currentProject();
  }

  // Legacy async method for backward compatibility
  async getProjectAsync(projectId: string): Promise<Project> {
    try {
      const projectDoc = doc(this.firestore, 'projects', projectId);
      const projectSnapshot = await getDoc(projectDoc);
      
      if (!projectSnapshot.exists()) {
        throw new Error('Project not found');
      }
      
      const data = projectSnapshot.data() as Project;
      return {
        ...data,
        id: projectId
      };
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  }

  // Reactive getter - returns current signal value
  getProjectsByUser(userId: string): Project[] {
    return this.userProjects();
  }

  // Legacy async method for backward compatibility
  async getProjectsByUserAsync(userId: string): Promise<Project[]> {
    try {
      const q = query(
        this.projectsCollection,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Ensure new fields have default values for existing projects
      return projects.map(project => {
        if (project.state === undefined) project.state = 'building';
        if (project.opposes === undefined || typeof project.opposes === 'number') project.opposes = [];
        if (project.comments === undefined) project.comments = [];
        if (project.collaborators === undefined) project.collaborators = [];
        if (project.collaborationRequests === undefined) project.collaborationRequests = [];
        return project;
      });
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  }

  // Reactive getter - returns current signal value
  getProjectsByScope(scope: string): Project[] {
    // Set up listener if not already listening
    this.setupScopeProjectsListener(scope);
    
    // Return projects from the scope-specific signal
    const scopeProjects = this._projectsByScope().get(scope) || [];
    return scopeProjects;
  }

  // Legacy async method for backward compatibility
  async getProjectsByScopeAsync(scope: string): Promise<Project[]> {
    try {
      if (scope === 'grupal') {
        // For Groupal projects, query separately for creator and collaborator projects
        return await this.getGrupalProjectsAsync();
      } else {
        // For other scopes, use the standard query
        const q = query(
          this.projectsCollection,
          where('scope.scope', '==', scope),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const projects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];

        // Ensure new fields have default values for existing projects
        const processedProjects = projects.map(project => {
          if (project.state === undefined) project.state = 'building';
          if (project.supports === undefined || typeof project.supports === 'number') project.supports = [];
          if (project.opposes === undefined || typeof project.opposes === 'number') project.opposes = [];
          if (project.comments === undefined) project.comments = [];
          if (project.collaborators === undefined) project.collaborators = [];
          if (project.collaborationRequests === undefined) project.collaborationRequests = [];
          return project;
        });

        return processedProjects;
      }
    } catch (error) {
      console.error('Error getting projects by scope:', error);
      throw error;
    }
  }

  private async getGrupalProjectsAsync(): Promise<Project[]> {
    const currentUser = this.authService.user();
    if (!currentUser?.uid) {
      return []; // No user logged in, return no Groupal projects
    }

    try {
      // Query 1: Projects where user is creator
      const creatorQuery = query(
        this.projectsCollection,
        where('scope.scope', '==', 'grupal'),
        where('createdBy', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      // Query 2: Projects where user is collaborator
      const collaboratorQuery = query(
        this.projectsCollection,
        where('scope.scope', '==', 'grupal'),
        where('collaborators', 'array-contains', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      // Execute both queries
      const [creatorSnapshot, collaboratorSnapshot] = await Promise.all([
        getDocs(creatorQuery),
        getDocs(collaboratorQuery)
      ]);

      // Process creator projects
      const creatorProjects = creatorSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Process collaborator projects
      const collaboratorProjects = collaboratorSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Combine and deduplicate projects
      const allProjects = [...creatorProjects, ...collaboratorProjects];
      const uniqueProjects = allProjects.filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id)
      );

      // Ensure new fields have default values for existing projects
      const processedProjects = uniqueProjects.map(project => {
        if (project.state === undefined) project.state = 'building';
        if (project.supports === undefined || typeof project.supports === 'number') project.supports = [];
        if (project.opposes === undefined || typeof project.opposes === 'number') project.opposes = [];
        if (project.comments === undefined) project.comments = [];
        if (project.collaborators === undefined) project.collaborators = [];
        if (project.collaborationRequests === undefined) project.collaborationRequests = [];
        return project;
      });

      return processedProjects;
    } catch (error) {
      console.error('Error getting Groupal projects:', error);
      return [];
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  async joinProject(projectId: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        participants: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error joining project:', error);
      throw error;
    }
  }

  async leaveProject(projectId: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        participants: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error leaving project:', error);
      throw error;
    }
  }

  async updateProjectState(projectId: string, newState: 'building' | 'implementing' | 'done'): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        state: newState,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating project state:', error);
      throw error;
    }
  }

  async supportProject(projectId: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      
      // First, remove any existing oppose vote from this user
      await updateDoc(projectRef, {
        opposes: arrayRemove(userId)
      });
      
      // Then add the support vote
      await updateDoc(projectRef, {
        supports: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error supporting project:', error);
      throw error;
    }
  }

  async opposeProject(projectId: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      
      // First, remove any existing support vote from this user
      await updateDoc(projectRef, {
        supports: arrayRemove(userId)
      });
      
      // Then add the oppose vote
      await updateDoc(projectRef, {
        opposes: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error opposing project:', error);
      throw error;
    }
  }

  async removeSupport(projectId: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        supports: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error removing support:', error);
      throw error;
    }
  }

  async removeOppose(projectId: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        opposes: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error removing oppose:', error);
      throw error;
    }
  }

  async toggleSupport(projectId: string, userId: string): Promise<{ action: 'added' | 'removed' }> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      const projectDoc = await getDocs(query(this.projectsCollection, where('__name__', '==', projectId)));
      
      if (projectDoc.empty) {
        throw new Error('Project not found');
      }
      
      const project = projectDoc.docs[0].data() as Project;
      
      // Ensure supports is an array (handle old numeric data)
      if (typeof project.supports === 'number') {
        project.supports = [];
      }
      if (!Array.isArray(project.supports)) {
        project.supports = [];
      }
      
      const hasSupported = project.supports.includes(userId);
      
      if (hasSupported) {
        await this.removeSupport(projectId, userId);
        return { action: 'removed' };
      } else {
        await this.supportProject(projectId, userId);
        return { action: 'added' };
      }
    } catch (error) {
      console.error('Error toggling support:', error);
      throw error;
    }
  }

  async toggleOppose(projectId: string, userId: string): Promise<{ action: 'added' | 'removed' }> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      const projectDoc = doc(this.firestore, 'projects', projectId);
      const projectDocSnap = await getDocs(query(this.projectsCollection, where('__name__', '==', projectId)));
      
      if (projectDocSnap.empty) {
        throw new Error('Project not found');
      }
      
      const project = projectDocSnap.docs[0].data() as Project;
      
      // Ensure opposes is an array (handle old numeric data)
      if (typeof project.opposes === 'number') {
        project.opposes = [];
      }
      if (!Array.isArray(project.opposes)) {
        project.opposes = [];
      }
      
      const hasOpposed = project.opposes.includes(userId);
      
      if (hasOpposed) {
        await this.removeOppose(projectId, userId);
        return { action: 'removed' };
      } else {
        await this.opposeProject(projectId, userId);
        return { action: 'added' };
      }
    } catch (error) {
      console.error('Error toggling oppose:', error);
      throw error;
    }
  }

  async addComment(projectId: string, commentText: string): Promise<Comment> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const comment: Comment = {
        id: this.generateCommentId(),
        text: commentText,
        createdBy: currentUser.uid,
        creatorName: currentUser.displayName || 'Anonymous',
        createdAt: new Date().toISOString()
      };

      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        comments: arrayUnion(comment)
      });

      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async requestCollaboration(projectId: string, message?: string): Promise<CollaborationRequest> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const project = await this.getProjectAsync(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const request: CollaborationRequest = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || '',
        requestedAt: new Date().toISOString(),
        status: 'pending',
        message: message || ''
      };

      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        collaborationRequests: arrayUnion(request)
      });

      const messageId = await this.messagesService.sendMessage({
        recipientUid: project.createdBy,
        senderUid: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        senderEmail: currentUser.email || '',
        senderPhotoURL: currentUser.photoURL || '',
        projectId: projectId,
        projectTitle: project.title,
        type: 'collaboration_request',
        title: 'New Collaboration Request',
        content: `${currentUser.displayName || 'Anonymous'} wants to collaborate in your project "${project.title}"`
      });

      return request;
    } catch (error) {
      console.error('Error requesting collaboration:', error);
      throw error;
    }
  }

  async acceptCollaboration(projectId: string, requestUid: string): Promise<{ request: CollaborationRequest; collaborator: Collaborator }> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      
      // Get the project to find the request
      const projectDoc = await getDocs(query(this.projectsCollection, where('__name__', '==', projectId)));
      if (projectDoc.empty) {
        throw new Error('Project not found');
      }
      
      const project = projectDoc.docs[0].data() as Project;
      const request = project.collaborationRequests?.find(r => r.uid === requestUid);
      
      if (!request) {
        throw new Error('Collaboration request not found');
      }

      // Create collaborator from request
      const collaborator: Collaborator = {
        uid: request.uid,
        displayName: request.displayName,
        email: request.email,
        photoURL: request.photoURL,
        joinedAt: new Date().toISOString(),
        role: 'collaborator'
      };

      // Update the project
      await updateDoc(projectRef, {
        collaborators: arrayUnion(collaborator),
        collaborationRequests: arrayRemove(request)
      });

      const messageId = await this.messagesService.sendMessage({
        recipientUid: request.uid,
        senderUid: project.createdBy,
        senderName: project.creator?.displayName || 'Project Creator',
        senderEmail: project.creator?.email || '',
        senderPhotoURL: project.creator?.photoURL || '',
        projectId: projectId,
        projectTitle: project.title,
        type: 'collaboration_accepted',
        title: 'Collaboration Request Accepted',
        content: `Your collaboration request for "${project.title}" has been accepted!`
      });

      return { request, collaborator };
    } catch (error) {
      console.error('Error accepting collaboration:', error);
      throw error;
    }
  }

  async rejectCollaboration(projectId: string, requestUid: string): Promise<CollaborationRequest> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      
      // Get the project to find the request
      const projectDoc = await getDocs(query(this.projectsCollection, where('__name__', '==', projectId)));
      if (projectDoc.empty) {
        throw new Error('Project not found');
      }
      
      const project = projectDoc.docs[0].data() as Project;
      const request = project.collaborationRequests?.find(r => r.uid === requestUid);
      
      if (!request) {
        throw new Error('Collaboration request not found');
      }

      // Remove the request
      await updateDoc(projectRef, {
        collaborationRequests: arrayRemove(request)
      });

      const messageId = await this.messagesService.sendMessage({
        recipientUid: request.uid,
        senderUid: project.createdBy,
        senderName: project.creator?.displayName || 'Project Creator',
        senderEmail: project.creator?.email || '',
        senderPhotoURL: project.creator?.photoURL || '',
        projectId: projectId,
        projectTitle: project.title,
        type: 'collaboration_rejected',
        title: 'Collaboration Request Rejected',
        content: `Your collaboration request for "${project.title}" has been rejected.`
      });

      return request;
    } catch (error) {
      console.error('Error rejecting collaboration:', error);
      throw error;
    }
  }

  async removeCollaborator(projectId: string, collaboratorUid: string): Promise<Collaborator> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      
      // Get the project to find the collaborator
      const projectDoc = await getDocs(query(this.projectsCollection, where('__name__', '==', projectId)));
      if (projectDoc.empty) {
        throw new Error('Project not found');
      }
      
      const project = projectDoc.docs[0].data() as Project;
      const collaborator = project.collaborators?.find(c => c.uid === collaboratorUid);
      
      if (!collaborator) {
        throw new Error('Collaborator not found');
      }

      // Remove the collaborator
      await updateDoc(projectRef, {
        collaborators: arrayRemove(collaborator)
      });

      return collaborator;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  }

  private generateTags(title: string, description: string, needs: Need[]): string[] {
    const needNames = needs.map(need => need.name).join(' ');
    const allText = `${title} ${description} ${needNames}`.toLowerCase();
    const words = allText.split(/\s+/).filter(word => word.length > 3);
    const tagCount: { [key: string]: number } = {};
    
    words.forEach(word => {
      tagCount[word] = (tagCount[word] || 0) + 1;
    });
    
    return Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private generateCommentId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public refreshProjects() {
  }

  public refreshUserProjects() {
  }

  public refreshProject(projectId: string) {
  }

  public refreshScopeProjects(scope: string) {
  }

  public async setFilteredProjects(scope: string) {
    const currentUser = this.authService.user();
    if (!currentUser?.uid) return;

    // Set filtered projects loading to true
    this.loadingService.setFilteredProjectsLoading(true);

    if (scope === 'all') {
      try {
        await this.firebaseQueryService.loadAllProjects();
        this.firebaseQueryService.setupRealTimeListener(
          { scope: 'all', userId: currentUser.uid },
          () => this.loadingService.setFilteredProjectsLoading(false)
        );
      } catch (error) {
        console.error('Error loading all projects:', error);
        this.loadingService.setFilteredProjectsLoading(false);
      }
    } else {
      const filterOptions: FilterOptions = {
        scope,
        userId: currentUser.uid
      };

      try {
        await this.firebaseQueryService.queryProjects(filterOptions);
        this.firebaseQueryService.setupRealTimeListener(
          filterOptions,
          () => this.loadingService.setFilteredProjectsLoading(false)
        );
      } catch (error) {
        console.error('Error setting filtered projects:', error);
        this.loadingService.setFilteredProjectsLoading(false);
      }
    }
  }

  public async loadMoreFilteredProjects(): Promise<boolean> {
    try {
      // Set filtered projects loading to true when loading more
      this.loadingService.setFilteredProjectsLoading(true);
      
      const result = await this.firebaseQueryService.loadMoreProjects();
      
      // Set loading to false after operation completes
      this.loadingService.setFilteredProjectsLoading(false);
      
      return result.hasMore;
    } catch (error) {
      console.error('Error loading more filtered projects:', error);
      // Set loading to false even on error
      this.loadingService.setFilteredProjectsLoading(false);
      return false;
    }
  }

  public async resetFilteredProjects() {
    const currentUser = this.authService.user();
    if (!currentUser?.uid) return;
    
    // Set filtered projects loading to true
    this.loadingService.setFilteredProjectsLoading(true);
    
    try {
      await this.firebaseQueryService.loadAllProjects();
      this.firebaseQueryService.setupRealTimeListener(
        { scope: 'all', userId: currentUser.uid },
        () => this.loadingService.setFilteredProjectsLoading(false)
      );
    } catch (error) {
      console.error('Error resetting to all projects:', error);
      this.loadingService.setFilteredProjectsLoading(false);
    }
  }

  public getFilteredProjectsCount(): number {
    return this.firebaseQueryService.filteredProjects().length;
  }

  public refreshUserLocation() {
    // This is now handled by the FirebaseQueryService
  }

  public getProjectsByTag(tag: string): Project[] {
    return this.projects().filter(project => 
      project.tags?.includes(tag)
    );
  }

  public getProjectsByState(state: 'building' | 'implementing' | 'done'): Project[] {
    return this.projects().filter(project => project.state === state);
  }

  public getProjectsByStatus(status: 'active' | 'completed' | 'cancelled'): Project[] {
    return this.projects().filter(project => project.status === status);
  }

  public refreshFilteredProjects() {
    const currentUser = this.authService.user();
    if (!currentUser?.uid) return;
    
    const currentScope = this.filterStateService?.getSelectedScope() || 'all';
    if (currentScope !== 'all') {
      // Set filtered projects loading to true when refreshing
      this.loadingService.setFilteredProjectsLoading(true);
      
      this.setFilteredProjects(currentScope);
    }
  }

  public handleNewProjectsAdded() {
    this.refreshFilteredProjects();
  }

  public async searchProjectsByName(searchTerm: string): Promise<Project[]> {
    return this.firebaseQueryService.searchProjects(searchTerm);
  }
}
