import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Auth, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AuthState } from './models/auth.models';
import { LoadingService } from './loading.service';
import { UserSearchService } from './user-search.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private loadingService = inject(LoadingService);
  private userSearchService = inject(UserSearchService);
  private googleProvider = new GoogleAuthProvider();

  private authState = signal<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  user = computed(() => this.authState().user);
  loading = computed(() => this.authState().loading);
  error = computed(() => this.authState().error);
  isAuthenticated = computed(() => !!this.authState().user);

  constructor() {
    this.loadingService.setAuthLoading(true);
    
    // Check for session storage issues on mobile
    this.checkSessionStorageAvailability();
    
    this.initializeAuth();
    
    effect(() => {
      const user = this.user();
      if (user) {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  private async initializeAuth() {
    onAuthStateChanged(this.auth, async (user) => {
      try {
        if (user) {
          // Add timeout to prevent hanging on user profile creation
          const profilePromise = this.userSearchService.createOrUpdateUserProfile(user);
          
          // Wait for profile creation with timeout
          await Promise.race([
            profilePromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile creation timeout')), 10000)
            )
          ]);
        }
      } catch (error) {
        console.warn('Error during user profile setup:', error);
        // Continue with auth even if profile creation fails
      } finally {
        // Always update auth state and loading, regardless of profile creation success
        this.authState.update(state => ({
          ...state,
          user,
          loading: false,
          error: null
        }));
        this.loadingService.setAuthLoading(false);
      }
    });

    // Handle redirect result with better error handling
    try {
      await this.handleRedirectResult();
    } catch (error) {
      console.warn('Error in auth initialization:', error);
      // Don't let redirect errors break the auth flow
      this.authState.update(state => ({
        ...state,
        loading: false,
        error: null
      }));
      this.loadingService.setAuthLoading(false);
    }
  }

  private async handleRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        try {
          // Add timeout to prevent hanging on user profile creation
          const profilePromise = this.userSearchService.createOrUpdateUserProfile(result.user);
          
          // Wait for profile creation with timeout
          await Promise.race([
            profilePromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile creation timeout')), 10000)
            )
          ]);
        } catch (error) {
          console.warn('Error during redirect result profile setup:', error);
          // Continue with auth even if profile creation fails
        }
        
        this.authState.update(state => ({
          ...state,
          user: result.user,
          loading: false,
          error: null
        }));
        this.loadingService.setAuthLoading(false);
      }
    } catch (error: any) {
      console.error('Error handling redirect result:', error);
      
      // Handle specific session storage errors
      if (error.message && error.message.includes('sessionStorage')) {
        console.warn('Session storage error detected, clearing auth state and continuing...');
        this.authState.update(state => ({
          ...state,
          error: null, // Don't show session storage errors to user
          loading: false
        }));
      } else {
        this.authState.update(state => ({
          ...state,
          error: error.message,
          loading: false
        }));
      }
      this.loadingService.setAuthLoading(false);
    }
  }


  async signInWithGoogle() {
    try {
      this.authState.update(state => ({ ...state, loading: true, error: null }));
      this.loadingService.setAuthLoading(true);
      await signInWithPopup(this.auth, this.googleProvider);
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message,
        loading: false
      }));
      this.loadingService.setAuthLoading(false);
      throw error;
    }
  }

  async signInWithGoogleRedirect() {
    try {
      this.authState.update(state => ({ ...state, loading: true, error: null }));
      this.loadingService.setAuthLoading(true);
      await signInWithRedirect(this.auth, this.googleProvider);
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message,
        loading: false
      }));
      this.loadingService.setAuthLoading(false);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      this.authState.update(state => ({ ...state, loading: true, error: null }));
      this.loadingService.setAuthLoading(true);
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message,
        loading: false
      }));
      this.loadingService.setAuthLoading(false);
      throw error;
    }
  }

  async signUp(email: string, password: string, displayName?: string) {
    try {
      this.authState.update(state => ({ ...state, loading: true, error: null }));
      this.loadingService.setAuthLoading(true);
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }
      
      await this.userSearchService.createOrUpdateUserProfile(credential.user);
      this.loadingService.setAuthLoading(false);
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message,
        loading: false
      }));
      this.loadingService.setAuthLoading(false);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
      this.loadingService.setAuthLoading(false);
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message
      }));
      this.loadingService.setAuthLoading(false);
      throw error;
    }
  }

  async updateProfile(profileData: { displayName?: string; photoURL?: string }) {
    try {
      this.loadingService.setAuthLoading(true);
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, profileData);
        await this.userSearchService.createOrUpdateUserProfile(currentUser);
        this.authState.update(state => ({
          ...state,
          user: currentUser
        }));
      }
      this.loadingService.setAuthLoading(false);
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message
      }));
      this.loadingService.setAuthLoading(false);
      throw error;
    }
  }

  clearError() {
    this.authState.update(state => ({ ...state, error: null }));
  }

  // Check if session storage is available and working
  private checkSessionStorageAvailability() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        // Test session storage
        const testKey = 'auth_test_' + Date.now();
        sessionStorage.setItem(testKey, 'test');
        sessionStorage.removeItem(testKey);
      }
    } catch (error) {
      console.warn('Session storage not available, clearing auth state:', error);
      this.clearSessionStorage();
    }
  }

  // Method to clear session storage and reset auth state
  clearSessionStorage() {
    try {
      // Clear Firebase auth persistence
      if (typeof window !== 'undefined' && window.sessionStorage) {
        // Clear only Firebase-related session storage
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.includes('firebase') || key.includes('auth')) {
            sessionStorage.removeItem(key);
          }
        });
      }
      
      // Reset auth state
      this.authState.update(state => ({
        ...state,
        user: null,
        loading: false,
        error: null
      }));
      
      this.loadingService.setAuthLoading(false);
    } catch (error) {
      console.warn('Error clearing session storage:', error);
    }
  }
}
