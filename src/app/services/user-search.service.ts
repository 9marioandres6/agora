import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { LocationData } from './location.service';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  location?: LocationData | null;
  createdAt: string;
  updatedAt: string;
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
      const userRef = doc(this.usersCollection, user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        const userProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || '',
          location: location,
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
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(userRef, updatedProfile);
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
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


}
