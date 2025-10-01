import { User } from '@angular/fire/auth';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LocationData {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}
