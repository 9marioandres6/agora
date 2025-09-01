import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { LocationData } from './location.service';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  location?: LocationData | null;
  city?: string;
  state?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  projectCounts?: {
    createdBuilding: number;
    createdImplementing: number;
    createdDone: number;
    collaboratedBuilding: number;
    collaboratedImplementing: number;
    collaboratedDone: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserSearchService {
  private firestore = inject(Firestore);

  private _searchResults = signal<UserProfile[]>([]);
  private _isSearching = signal(false);

  searchResults = this._searchResults.asReadonly();
  isSearching = this._isSearching.asReadonly();

  private get usersCollection() {
    return collection(this.firestore, 'users');
  }

  async searchUsers(searchTerm: string): Promise<UserProfile[]> {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      this._searchResults.set([]);
      return [];
    }

    try {
      this._isSearching.set(true);
      const searchLower = searchTerm.toLowerCase();

      const q = query(this.usersCollection);
      const querySnapshot = await getDocs(q);
      
      const users: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as UserProfile;
        if (userData.displayName?.toLowerCase().includes(searchLower) || 
            userData.email?.toLowerCase().includes(searchLower)) {
          users.push(userData);
        }
      });

      this._searchResults.set(users);
      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      this._searchResults.set([]);
      return [];
    } finally {
      this._isSearching.set(false);
    }
  }

  async createOrUpdateUserProfile(user: any, location?: LocationData | null): Promise<void> {
    try {
      // Add timeout protection to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User profile operation timeout')), 15000)
      );

      const profilePromise = (async () => {
        const userRef = doc(this.usersCollection, user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          const userProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            email: user.email || '',
            photoURL: user.photoURL || '',
            location: location,
            city: location?.city || '',
            state: location?.state || '',
            country: location?.country || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await setDoc(userRef, userProfile);
        } else {
          const existingData = userDoc.data() as UserProfile;
          const updatedProfile: UserProfile = {
            ...existingData,
            displayName: user.displayName || existingData.displayName,
            email: user.email || existingData.email,
            photoURL: user.photoURL || existingData.photoURL,
            location: location || existingData.location,
            city: location?.city || existingData.city || '',
            state: location?.state || existingData.state || '',
            country: location?.country || existingData.country || '',
            updatedAt: new Date().toISOString()
          };
          
          await setDoc(userRef, updatedProfile);
        }
      })();

      // Race between profile operation and timeout
      await Promise.race([profilePromise, timeoutPromise]);
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      // Don't throw - let the auth flow continue even if profile creation fails
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(this.usersCollection, uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  clearSearchResults(): void {
    this._searchResults.set([]);
  }

  async updateUserProjectCounts(uid: string, projectCounts: {
    createdBuilding: number;
    createdImplementing: number;
    createdDone: number;
    collaboratedBuilding: number;
    collaboratedImplementing: number;
    collaboratedDone: number;
  }): Promise<void> {
    try {
      const userRef = doc(this.usersCollection, uid);
      await setDoc(userRef, {
        projectCounts: projectCounts,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user project counts:', error);
      throw error;
    }
  }

  async recalculateAndUpdateUserProjectCounts(uid: string): Promise<void> {
    try {
      // Use the already injected firestore instance
      const { collection, query, where, getDocs } = await import('@angular/fire/firestore');
      const projectsCollection = collection(this.firestore, 'projects');
      
      // Get created projects
      const createdQuery = query(
        projectsCollection,
        where('createdBy', '==', uid)
      );
      const createdSnapshot = await getDocs(createdQuery);
      const createdProjects = createdSnapshot.docs.map(doc => doc.data());
      
      // Get collaborated projects - need to query for the full collaborator object
      // Since we can't query nested fields in array-contains, we'll get all projects and filter
      const allProjectsQuery = query(projectsCollection);
      const allProjectsSnapshot = await getDocs(allProjectsQuery);
      const collaboratedProjects = allProjectsSnapshot.docs
        .map(doc => doc.data())
        .filter(project => 
          project['collaborators'] && 
          project['collaborators'].some((collab: any) => collab.uid === uid)
        );
      
      // Calculate counts
      const projectCounts = {
        createdBuilding: createdProjects.filter(p => p['state'] === 'building').length,
        createdImplementing: createdProjects.filter(p => p['state'] === 'implementing').length,
        createdDone: createdProjects.filter(p => p['state'] === 'done').length,
        collaboratedBuilding: collaboratedProjects.filter(p => p['state'] === 'building').length,
        collaboratedImplementing: collaboratedProjects.filter(p => p['state'] === 'implementing').length,
        collaboratedDone: collaboratedProjects.filter(p => p['state'] === 'done').length
      };
      
      // Update in Firebase
      await this.updateUserProjectCounts(uid, projectCounts);
    } catch (error) {
      console.error('Error recalculating user project counts:', error);
      throw error;
    }
  }

}
