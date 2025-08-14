export interface AuthUser {
  uid: string;
  displayName: string | null;
  emailVerified: boolean;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  providerData: any[];
  providerId?: string;
  isAnonymous: boolean;
  creationTime?: string;
  lastSignInTime?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';
