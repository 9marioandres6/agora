import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Auth, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from '@angular/fire/auth';
import { Router } from '@angular/router';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
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

  private initializeAuth() {
    onAuthStateChanged(this.auth, (user) => {
      this.authState.update(state => ({
        ...state,
        user,
        loading: false,
        error: null
      }));
    });

    this.handleRedirectResult();
  }

  private async handleRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        this.authState.update(state => ({
          ...state,
          user: result.user,
          loading: false,
          error: null
        }));
      }
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message,
        loading: false
      }));
    }
  }

  async signInWithGoogle() {
    try {
      this.authState.update(state => ({ ...state, loading: true, error: null }));
      await signInWithPopup(this.auth, this.googleProvider);
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message,
        loading: false
      }));
      throw error;
    }
  }

  async signInWithGoogleRedirect() {
    try {
      this.authState.update(state => ({ ...state, loading: true, error: null }));
      await signInWithRedirect(this.auth, this.googleProvider);
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message,
        loading: false
      }));
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      this.authState.update(state => ({ ...state, loading: true, error: null }));
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message,
        loading: false
      }));
      throw error;
    }
  }

  async signUp(email: string, password: string, displayName?: string) {
    try {
      this.authState.update(state => ({ ...state, loading: true, error: null }));
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message,
        loading: false
      }));
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message
      }));
      throw error;
    }
  }

  async updateProfile(profileData: { displayName?: string; photoURL?: string }) {
    try {
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, profileData);
        this.authState.update(state => ({
          ...state,
          user: currentUser
        }));
      }
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message
      }));
      throw error;
    }
  }

  clearError() {
    this.authState.update(state => ({ ...state, error: null }));
  }
}
