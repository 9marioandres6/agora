import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, collection, query, where, orderBy, limit, getDocs, onSnapshot, Unsubscribe, QueryConstraint, startAfter, QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Project } from './models/project.models';
import { LocationService, LocationData } from './location.service';

export interface FilterOptions {
  scope: string;
  userId?: string;
  location?: LocationData;
  searchTerm?: string;
  state?: 'building' | 'implementing' | 'done';
  status?: 'active' | 'completed' | 'cancelled';
  limitCount?: number;
}

export interface QueryResult {
  projects: Project[];
  hasMore: boolean;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseQueryService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private locationService = inject(LocationService);

  private _filteredProjects = signal<Project[]>([]);
  private _isLoading = signal(false);
  private _hasMore = signal(true);
  private _currentFilter = signal<FilterOptions | null>(null);
  private _lastDocument = signal<QueryDocumentSnapshot<DocumentData> | null>(null);

  filteredProjects = this._filteredProjects.asReadonly();
  isLoading = this._isLoading.asReadonly();
  hasMore = this._hasMore.asReadonly();
  currentFilter = this._currentFilter.asReadonly();

  private readonly DEFAULT_LIMIT = 20;
  private listeners: Map<string, Unsubscribe> = new Map();

  private get projectsCollection() {
    return collection(this.firestore, 'projects');
  }

  async queryProjects(filterOptions: FilterOptions): Promise<QueryResult> {
    try {
      this._isLoading.set(true);
      this._currentFilter.set(filterOptions);

      const constraints: QueryConstraint[] = [];
      
      // Add scope filter
      if (filterOptions.scope !== 'all') {
        if (filterOptions.scope === 'my-projects') {
          constraints.push(where('createdBy', '==', filterOptions.userId));
        } else if (filterOptions.scope === 'grupal') {
          constraints.push(where('scope', '==', 'grupal'));
          if (filterOptions.userId) {
            constraints.push(where('collaborators', 'array-contains', filterOptions.userId));
          }
        } else {
          constraints.push(where('scope', '==', filterOptions.scope));
        }
      }

      // Add state filter
      if (filterOptions.state) {
        constraints.push(where('state', '==', filterOptions.state));
      }

      // Add status filter
      if (filterOptions.status) {
        constraints.push(where('status', '==', filterOptions.status));
      }

      // Add search filter (title-based)
      if (filterOptions.searchTerm && filterOptions.searchTerm.trim().length > 0) {
        const term = filterOptions.searchTerm.trim();
        constraints.push(where('title', '>=', term));
        constraints.push(where('title', '<=', term + '\uf8ff'));
      }

      // Add ordering and limit
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(filterOptions.limitCount || this.DEFAULT_LIMIT));

      const q = query(this.projectsCollection, ...constraints);
      const querySnapshot = await getDocs(q);

      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      const processedProjects = this.processProjects(projects);
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore = querySnapshot.docs.length === (filterOptions.limitCount || this.DEFAULT_LIMIT);

      this._filteredProjects.set(processedProjects);
      this._hasMore.set(hasMore);
      this._lastDocument.set(lastDoc);

      return {
        projects: processedProjects,
        hasMore,
        lastDoc
      };
    } catch (error) {
      console.error('Error querying projects:', error);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadMoreProjects(): Promise<QueryResult> {
    const currentFilter = this._currentFilter();
    const lastDoc = this._lastDocument();
    
    if (!currentFilter || !lastDoc || !this._hasMore()) {
      return { projects: [], hasMore: false };
    }

    try {
      this._isLoading.set(true);

      const constraints: QueryConstraint[] = [];
      
      // Add scope filter
      if (currentFilter.scope !== 'all') {
        if (currentFilter.scope === 'my-projects') {
          constraints.push(where('createdBy', '==', currentFilter.userId));
        } else if (currentFilter.scope === 'grupal') {
          constraints.push(where('scope', '==', 'grupal'));
          if (currentFilter.userId) {
            constraints.push(where('collaborators', 'array-contains', currentFilter.userId));
          }
        } else {
          constraints.push(where('scope', '==', currentFilter.scope));
        }
      }

      // Add state filter
      if (currentFilter.state) {
        constraints.push(where('state', '==', currentFilter.state));
      }

      // Add status filter
      if (currentFilter.status) {
        constraints.push(where('status', '==', currentFilter.status));
      }

      // Add search filter
      if (currentFilter.searchTerm && currentFilter.searchTerm.trim().length > 0) {
        const term = currentFilter.searchTerm.trim();
        constraints.push(where('title', '>=', term));
        constraints.push(where('title', '<=', term + '\uf8ff'));
      }

      // Add ordering, pagination, and limit
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(startAfter(lastDoc));
      constraints.push(limit(currentFilter.limitCount || this.DEFAULT_LIMIT));

      const q = query(this.projectsCollection, ...constraints);
      const querySnapshot = await getDocs(q);

      const newProjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      const processedNewProjects = this.processProjects(newProjects);
      const allProjects = [...this._filteredProjects(), ...processedNewProjects];
      
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore = querySnapshot.docs.length === (currentFilter.limitCount || this.DEFAULT_LIMIT);

      this._filteredProjects.set(allProjects);
      this._hasMore.set(hasMore);
      this._lastDocument.set(newLastDoc);

      return {
        projects: allProjects,
        hasMore,
        lastDoc: newLastDoc
      };
    } catch (error) {
      console.error('Error loading more projects:', error);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  setupRealTimeListener(filterOptions: FilterOptions): void {
    const listenerKey = this.generateListenerKey(filterOptions);
    
    // Clean up existing listener
    this.cleanupListener(listenerKey);

    const constraints: QueryConstraint[] = [];
    
    // Add scope filter
    if (filterOptions.scope !== 'all') {
      if (filterOptions.scope === 'my-projects') {
        constraints.push(where('createdBy', '==', filterOptions.userId));
      } else if (filterOptions.scope === 'grupal') {
        constraints.push(where('scope', '==', 'grupal'));
        if (filterOptions.userId) {
          constraints.push(where('collaborators', 'array-contains', filterOptions.userId));
        }
      } else {
        constraints.push(where('scope', '==', filterOptions.scope));
      }
    }

    // Add state filter
    if (filterOptions.state) {
      constraints.push(where('state', '==', filterOptions.state));
    }

    // Add status filter
    if (filterOptions.status) {
      constraints.push(where('status', '==', filterOptions.status));
    }

          // Add ordering and limit
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(filterOptions.limitCount || this.DEFAULT_LIMIT));

    const q = query(this.projectsCollection, ...constraints);
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      const processedProjects = this.processProjects(projects);
      this._filteredProjects.set(processedProjects);
      this._hasMore.set(projects.length === (filterOptions.limitCount || this.DEFAULT_LIMIT));
      
      if (querySnapshot.docs.length > 0) {
        this._lastDocument.set(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
    }, (error) => {
      console.error('Error in real-time listener:', error);
    });

    this.listeners.set(listenerKey, unsubscribe);
  }

  private generateListenerKey(filterOptions: FilterOptions): string {
    return `${filterOptions.scope}_${filterOptions.userId || 'anonymous'}_${filterOptions.state || 'all'}_${filterOptions.status || 'all'}`;
  }

  private cleanupListener(key: string): void {
    const listener = this.listeners.get(key);
    if (listener) {
      listener();
      this.listeners.delete(key);
    }
  }

  cleanupAllListeners(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  reset(): void {
    this._filteredProjects.set([]);
    this._isLoading.set(false);
    this._hasMore.set(true);
    this._currentFilter.set(null);
    this._lastDocument.set(null);
    this.cleanupAllListeners();
  }

  private processProjects(projects: Project[]): Project[] {
    return projects.map(project => {
      // Ensure all required fields have default values
      if (!project.creator) {
        project.creator = {
          uid: project.createdBy,
          displayName: 'Anonymous',
          email: '',
          photoURL: ''
        };
      }
      if (!project.creator.photoURL) {
        project.creator.photoURL = '';
      }
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
  }

  async loadAllProjects(limitCount: number = 20): Promise<QueryResult> {
    try {
      this._isLoading.set(true);
      
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

      const processedProjects = this.processProjects(projects);
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore = querySnapshot.docs.length === limitCount;

      this._filteredProjects.set(processedProjects);
      this._hasMore.set(hasMore);
      this._lastDocument.set(lastDoc);
      this._currentFilter.set({ scope: 'all' });

      return {
        projects: processedProjects,
        hasMore,
        lastDoc
      };
    } catch (error) {
      console.error('Error loading all projects:', error);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async searchProjects(searchTerm: string, limitCount: number = 20): Promise<Project[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    try {
      const term = searchTerm.trim();
      
      const q = query(
        this.projectsCollection,
        where('title', '>=', term),
        where('title', '<=', term + '\uf8ff'),
        orderBy('title'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Filter results to include only projects that actually contain the search term
      const filteredResults = projects.filter(project => 
        project.title?.toLowerCase().includes(term.toLowerCase()) ||
        project.description?.toLowerCase().includes(term.toLowerCase())
      );

      return this.processProjects(filteredResults);
    } catch (error) {
      console.error('Error searching projects:', error);
      return [];
    }
  }
}
