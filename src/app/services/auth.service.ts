import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Auth, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AuthState } from './models/auth.models';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private loadingService = inject(LoadingService);
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
      this.loadingService.setAuthLoading(false);
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
        this.loadingService.setAuthLoading(false);
      }
    } catch (error: any) {
      this.authState.update(state => ({
        ...state,
        error: error.message,
        loading: false
      }));
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
}
