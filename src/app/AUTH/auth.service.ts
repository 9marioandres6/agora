import { Injectable, signal, computed, effect } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  UserCredential,
  User,
  authState,
  signOut as firebaseSignOut,
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { AuthUser, AuthState, AuthStatus } from './auth.models';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _authState = signal<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  readonly authState = this._authState.asReadonly();
  readonly user = computed(() => this._authState().user);
  readonly loading = computed(() => this._authState().loading);
  readonly error = computed(() => this._authState().error);
  readonly isAuthenticated = computed(() => !!this._authState().user);
  readonly authStatus = computed<AuthStatus>(() => {
    const state = this._authState();
    if (state.loading) return 'loading';
    return state.user ? 'authenticated' : 'unauthenticated';
  });

  private readonly firebaseUser: any;

  constructor(private auth: Auth) {
    this.firebaseUser = toSignal(authState(this.auth));
    effect(() => {
      const fbUser = this.firebaseUser();

      if (fbUser === undefined) {
        this._authState.update((state) => ({ ...state, loading: true }));
      } else if (fbUser === null) {
        this._authState.set({
          user: null,
          loading: false,
          error: null,
        });
      } else {
        const authUser: AuthUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName,
          emailVerified: fbUser.emailVerified,
          email: fbUser.email,
          phoneNumber: fbUser.phoneNumber,
          photoURL: fbUser.photoURL,
          providerData: fbUser.providerData,
          providerId: fbUser.providerId,
          isAnonymous: fbUser.isAnonymous,
          creationTime: fbUser.metadata.creationTime,
          lastSignInTime: fbUser.metadata.lastSignInTime,
        };

        this._authState.set({
          user: authUser,
          loading: false,
          error: null,
        });
      }
    });
  }

  async registerWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<UserCredential> {
    try {
      this._setLoading(true);
      this._clearError();
      const result = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      return result;
    } catch (error: any) {
      this._setError(error.message || 'Registration failed');
      throw error;
    } finally {
      this._setLoading(false);
    }
  }

  async signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<UserCredential> {
    try {
      this._setLoading(true);
      this._clearError();
      const result = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      return result;
    } catch (error: any) {
      this._setError(error.message || 'Sign in failed');
      throw error;
    } finally {
      this._setLoading(false);
    }
  }

  async registerWithGoogle(): Promise<UserCredential> {
    try {
      this._setLoading(true);
      this._clearError();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      return result;
    } catch (error: any) {
      this._setError(error.message || 'Google authentication failed');
      throw error;
    } finally {
      this._setLoading(false);
    }
  }

  async signOut(): Promise<void> {
    try {
      this._setLoading(true);
      this._clearError();
      await firebaseSignOut(this.auth);
    } catch (error: any) {
      this._setError(error.message || 'Sign out failed');
      throw error;
    } finally {
      this._setLoading(false);
    }
  }

  getCurrentUser(): Observable<User | null> {
    return authState(this.auth);
  }

  registerWithEmailAndPasswordObservable(
    email: string,
    password: string,
  ): Observable<UserCredential> {
    return from(this.registerWithEmailAndPassword(email, password));
  }

  registerWithGoogleObservable(): Observable<UserCredential> {
    return from(this.registerWithGoogle());
  }

  signOutObservable(): Observable<void> {
    return from(this.signOut());
  }

  private _setLoading(loading: boolean): void {
    this._authState.update((state) => ({ ...state, loading }));
  }

  private _setError(error: string): void {
    this._authState.update((state) => ({ ...state, error, loading: false }));
  }

  private _clearError(): void {
    this._authState.update((state) => ({ ...state, error: null }));
  }

  clearError(): void {
    this._clearError();
  }
}
