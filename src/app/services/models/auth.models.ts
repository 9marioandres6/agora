import { User } from '@angular/fire/auth';
import { LocationData } from '../location.service';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}
