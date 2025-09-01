import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Unsubscribe,
  QueryConstraint,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Project } from './models/project.models';
import { LocationData } from './location.service';
import { UserSearchService } from './user-search.service';

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
  providedIn: 'root',
})
export class FirebaseQueryService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private userSearchService = inject(UserSearchService);

  private _filteredProjects = signal<Project[]>([]);
  private _isLoading = signal(false);
  private _hasMore = signal(true);
  private _currentFilter = signal<FilterOptions | null>(null);
  private _lastDocument = signal<
    QueryDocumentSnapshot<DocumentData> | undefined
  >(undefined);

  filteredProjects = this._filteredProjects.asReadonly();
  isLoading = this._isLoading.asReadonly();
  hasMore = this._hasMore.asReadonly();
  currentFilter = this._currentFilter.asReadonly();

  private readonly DEFAULT_LIMIT = 8;
  private listeners: Map<string, Unsubscribe> = new Map();

  private get projectsCollection() {
    return collection(this.firestore, 'projects');
  }

  // Helper function to create grupal query for a specific user
  private createGrupalUserQuery(userId: string, limitCount?: number) {
    if (limitCount) {
      return query(
        this.projectsCollection,
        where('scope.scope', '==', 'grupal'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      return query(
        this.projectsCollection,
        where('scope.scope', '==', 'grupal'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
  }

  async queryProjects(filterOptions: FilterOptions): Promise<QueryResult> {
    try {
      this._isLoading.set(true);
      this._currentFilter.set(filterOptions);

      const constraints: QueryConstraint[] = [];

      // Add scope filter
      if (filterOptions.scope !== 'all') {
        if (filterOptions.scope === 'my-projects') {
          // For "my-projects", we need to get ALL projects and then filter by createdBy OR collaborators
          // Firestore doesn't support OR queries easily, so we'll get all projects and filter in post-processing
        } else if (filterOptions.scope === 'grupal') {
          constraints.push(where('scope.scope', '==', 'grupal'));
          // Note: We'll handle grupal permissions in post-processing
          // since we need to check both createdBy and collaborators
        } else {
          constraints.push(where('scope.scope', '==', filterOptions.scope));
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
      if (
        filterOptions.searchTerm &&
        filterOptions.searchTerm.trim().length > 0
      ) {
        const term = filterOptions.searchTerm.trim();
        constraints.push(where('title', '>=', term));
        constraints.push(where('title', '<=', term + '\uf8ff'));
      }

      // Add ordering and limit
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(filterOptions.limitCount || this.DEFAULT_LIMIT));

      const q = query(this.projectsCollection, ...constraints);
      const querySnapshot = await getDocs(q);

      let projects = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];

      // Post-process grupal projects to ensure user has access
      if (filterOptions.scope === 'grupal' && filterOptions.userId) {
        projects = projects.filter(
          (project) =>
            project.createdBy === filterOptions.userId ||
            project.collaborators?.some(
              (collab) => collab.uid === filterOptions.userId
            )
        );
      }

      // Post-process my-projects to include both created and collaborated projects
      if (filterOptions.scope === 'my-projects' && filterOptions.userId) {
        projects = projects.filter(
          (project) =>
            project.createdBy === filterOptions.userId ||
            project.collaborators?.some(
              (collab) => collab.uid === filterOptions.userId
            )
        );
      }

      // Apply location-based filtering
      projects = this.filterProjectsByLocation(projects, filterOptions.location);

      const processedProjects = this.processProjects(projects);
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore =
        projects.length === (filterOptions.limitCount || this.DEFAULT_LIMIT);

      this._filteredProjects.set(processedProjects);
      this._hasMore.set(hasMore);
      this._lastDocument.set(lastDoc);

      return {
        projects: processedProjects,
        hasMore,
        lastDoc,
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
          // For "my-projects", we need to get ALL projects and then filter by createdBy OR collaborators
          // Firestore doesn't support OR queries easily, so we'll get all projects and filter in post-processing
        } else if (currentFilter.scope === 'grupal') {
          constraints.push(where('scope.scope', '==', 'grupal'));
          // Note: We'll handle grupal permissions in post-processing
        } else {
          constraints.push(where('scope.scope', '==', currentFilter.scope));
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
      if (
        currentFilter.searchTerm &&
        currentFilter.searchTerm.trim().length > 0
      ) {
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

      let newProjects = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];

      // Post-process grupal projects to ensure user has access
      if (currentFilter.scope === 'grupal' && currentFilter.userId) {
        newProjects = newProjects.filter(
          (project) =>
            project.createdBy === currentFilter.userId ||
            project.collaborators?.some(
              (collab) => collab.uid === currentFilter.userId
            )
        );
      }

      // Post-process my-projects to include both created and collaborated projects
      if (currentFilter.scope === 'my-projects' && currentFilter.userId) {
        newProjects = newProjects.filter(
          (project) =>
            project.createdBy === currentFilter.userId ||
            project.collaborators?.some(
              (collab) => collab.uid === currentFilter.userId
            )
        );
      }

      // Apply location-based filtering
      newProjects = this.filterProjectsByLocation(newProjects, currentFilter.location);

      const processedNewProjects = this.processProjects(newProjects);
      const allProjects = [
        ...this._filteredProjects(),
        ...processedNewProjects,
      ];

      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore =
        querySnapshot.docs.length ===
        (currentFilter.limitCount || this.DEFAULT_LIMIT);

      this._filteredProjects.set(allProjects);
      this._hasMore.set(hasMore);
      this._lastDocument.set(newLastDoc);

      return {
        projects: allProjects,
        hasMore,
        lastDoc: newLastDoc,
      };
    } catch (error) {
      console.error('Error loading more projects:', error);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  setupRealTimeListener(
    filterOptions: FilterOptions,
    onLoadingComplete?: () => void
  ): void {
    const listenerKey = this.generateListenerKey(filterOptions);

    // Clean up existing listener
    this.cleanupListener(listenerKey);

    // Set loading to true when starting to listen
    this._isLoading.set(true);

    const constraints: QueryConstraint[] = [];

    // Add scope filter
    if (filterOptions.scope !== 'all') {
      if (filterOptions.scope === 'my-projects') {
        // For "my-projects", we need to get ALL projects and then filter by createdBy OR collaborators
        // Firestore doesn't support OR queries easily, so we'll get all projects and filter in post-processing
      } else if (filterOptions.scope === 'grupal') {
        constraints.push(where('scope.scope', '==', 'grupal'));
        // Note: We'll handle grupal permissions in post-processing
        // since we need to check both createdBy and collaborators
      } else {
        constraints.push(where('scope.scope', '==', filterOptions.scope));
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

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        let projects = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[];

        // Post-process grupal projects to ensure user has access
        if (filterOptions.scope === 'grupal' && filterOptions.userId) {
          projects = projects.filter(
            (project) =>
              project.createdBy === filterOptions.userId ||
              project.collaborators?.some(
                (collab) => collab.uid === filterOptions.userId
              )
          );
        }

        // Post-process my-projects to include both created and collaborated projects
        if (filterOptions.scope === 'my-projects' && filterOptions.userId) {
          projects = projects.filter(
            (project) =>
              project.createdBy === filterOptions.userId ||
              project.collaborators?.some(
                (collab) => collab.uid === filterOptions.userId
              )
          );
        }

        // For 'all' scope, also filter grupal projects to ensure user has access
        if (filterOptions.scope === 'all' && filterOptions.userId) {
          projects = projects.filter((project) => {
            if (
              typeof project.scope === 'object' &&
              project.scope?.scope === 'grupal'
            ) {
              return (
                project.createdBy === filterOptions.userId ||
                project.collaborators?.some(
                  (collab) => collab.uid === filterOptions.userId
                )
              );
            }
            return true; // Keep all public projects
          });
        }

        // Apply location-based filtering
        projects = this.filterProjectsByLocation(projects, filterOptions.location);

        const processedProjects = this.processProjects(projects);
        this._filteredProjects.set(processedProjects);
        this._hasMore.set(
          projects.length === (filterOptions.limitCount || this.DEFAULT_LIMIT)
        );

        if (querySnapshot.docs.length > 0) {
          this._lastDocument.set(
            querySnapshot.docs[querySnapshot.docs.length - 1]
          );
        }

        // Set loading to false only after we receive data
        this._isLoading.set(false);

        // Notify that loading is complete
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      },
      (error) => {
        console.error('Error in real-time listener:', error);
        // Set loading to false even on error
        this._isLoading.set(false);

        // Notify that loading is complete even on error
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      }
    );

    this.listeners.set(listenerKey, unsubscribe);
  }

  private generateListenerKey(filterOptions: FilterOptions): string {
    return `${filterOptions.scope}_${filterOptions.userId || 'anonymous'}_${
      filterOptions.state || 'all'
    }_${filterOptions.status || 'all'}`;
  }

  private cleanupListener(key: string): void {
    const listener = this.listeners.get(key);
    if (listener) {
      listener();
      this.listeners.delete(key);
    }
  }

  cleanupAllListeners(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }

  reset(): void {
    this._filteredProjects.set([]);
    this._isLoading.set(false);
    this._hasMore.set(true);
    this._currentFilter.set(null);
    this._lastDocument.set(undefined);
    this.cleanupAllListeners();
  }

  setCurrentFilter(filter: FilterOptions): void {
    this._currentFilter.set(filter);
  }

  private processProjects(projects: Project[]): Project[] {
    return projects.map((project) => {
      // Ensure all required fields have default values
      if (!project.creator) {
        project.creator = {
          uid: project.createdBy,
          displayName: 'Anonymous',
          email: '',
          photoURL: '',
        };
      }
      if (!project.creator.photoURL) {
        project.creator.photoURL = '';
      }
      if (project.state === undefined) {
        project.state = 'building';
      }
      if (
        project.supports === undefined ||
        typeof project.supports === 'number'
      ) {
        project.supports = [];
      }
      if (
        project.opposes === undefined ||
        typeof project.opposes === 'number'
      ) {
        project.opposes = [];
      }
      if (project.verifies === undefined) {
        project.verifies = [];
      }
      if (project.followers === undefined) {
        project.followers = [];
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

  private filterProjectsByLocation(projects: Project[], userLocation?: LocationData): Project[] {
    if (!userLocation) {
      return projects;
    }

    return projects.filter(project => {
      if (project.scope?.scope === 'grupal' || project.scope?.scope === 'global') {
        return true;
      }

      if (!project.scope?.place) {
        return true;
      }

      const projectPlace = project.scope.place.toLowerCase();

      switch (project.scope.scope) {
        case 'local':
          return userLocation.city && userLocation.city.toLowerCase() === projectPlace;
        case 'state':
          return userLocation.state && userLocation.state.toLowerCase() === projectPlace;
        case 'national':
          return userLocation.country && userLocation.country.toLowerCase() === projectPlace;
        default:
          return true;
      }
    });
  }

  async loadAllProjects(limitCount: number = 8): Promise<QueryResult> {
    try {
      this._isLoading.set(true);

      const currentUser = this.authService.user();
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      // For "all" projects, we need to handle grupal projects specially
      // We'll load public projects first, then add grupal projects where user is creator/collaborator
      const publicScopes = ['local', 'state', 'national', 'global'];

      // Query for public projects
      const publicQuery = query(
        this.projectsCollection,
        where('scope.scope', 'in', publicScopes),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const publicSnapshot = await getDocs(publicQuery);
      let allProjects = publicSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];

      // If we have space, add grupal projects where user is creator or collaborator
      if (allProjects.length < limitCount) {
        const remainingLimit = limitCount - allProjects.length;

        // Query for grupal projects where user is creator
        const creatorQuery = this.createGrupalUserQuery(
          currentUser.uid,
          remainingLimit
        );

        const creatorSnapshot = await getDocs(creatorQuery);
        const creatorProjects = creatorSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[];

        allProjects = [...allProjects, ...creatorProjects];

        // If still have space, add grupal projects where user is collaborator
        if (allProjects.length < limitCount) {
          const newRemainingLimit = limitCount - allProjects.length;

          // Note: We can't easily query for array-contains with object properties
          // So we'll query all grupal projects and filter them
          const allGrupalQuery = query(
            this.projectsCollection,
            where('scope.scope', '==', 'grupal'),
            orderBy('createdAt', 'desc'),
            limit(newRemainingLimit * 3) // Get more to account for filtering
          );

          const allGrupalSnapshot = await getDocs(allGrupalQuery);
          const allGrupalProjects = allGrupalSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Project[];

          // Filter to only include projects where user is collaborator
          const collaboratorProjects = allGrupalProjects
            .filter((project) =>
              project.collaborators?.some(
                (collab) => collab.uid === currentUser.uid
              )
            )
            .slice(0, newRemainingLimit);

          allProjects = [...allProjects, ...collaboratorProjects];
        }
      }

      // Sort all projects by creation date (newest first)
      allProjects.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      // Apply location-based filtering - get user location from profile
      const currentUserForLocation = this.authService.user();
      let userLocation: LocationData | undefined;
      if (currentUserForLocation?.uid) {
        try {
          const userProfile = await this.userSearchService.getUserProfile(currentUserForLocation.uid);
          userLocation = userProfile?.location || undefined;
        } catch (error) {
          console.warn('Could not get user location for filtering:', error);
        }
      }
      allProjects = this.filterProjectsByLocation(allProjects, userLocation);

      // Limit to requested amount
      allProjects = allProjects.slice(0, limitCount);

      const processedProjects = this.processProjects(allProjects);
      const lastDoc =
        allProjects.length > 0
          ? publicSnapshot.docs[publicSnapshot.docs.length - 1]
          : undefined;
      const hasMore = allProjects.length === limitCount;

      this._filteredProjects.set(processedProjects);
      this._hasMore.set(hasMore);
      this._lastDocument.set(lastDoc);
      this._currentFilter.set({ scope: 'all' });

      return {
        projects: processedProjects,
        hasMore,
        lastDoc,
      };
    } catch (error) {
      console.error('Error loading all projects:', error);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async searchProjects(
    searchTerm: string,
    limitCount: number = 8
  ): Promise<Project[]> {
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
      const projects = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];

      // Filter results to include only projects that actually contain the search term
      const filteredResults = projects.filter(
        (project) =>
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
