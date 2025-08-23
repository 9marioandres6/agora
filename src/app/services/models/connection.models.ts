export interface ConnectionState {
  isOnline: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  lastCheck: Date | null;
  isChecking: boolean;
  connectionSpeed: number | null;
}
