import { Injectable, computed, effect, inject, signal, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConnectionState } from './models/connection.models';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private router = inject(Router);
  private toastController = inject(ToastController);
  private destroyRef = inject(DestroyRef);

  // Core connection state signal
  private readonly connectionState = signal<ConnectionState>({
    isOnline: navigator.onLine,
    connectionQuality: navigator.onLine ? 'excellent' : 'offline',
    lastCheck: null,
    isChecking: false,
    connectionSpeed: null
  });

  // Computed properties using signals
  readonly isOnline = computed(() => this.connectionState().isOnline);
  readonly connectionQuality = computed(() => this.connectionState().connectionQuality);
  readonly lastCheck = computed(() => this.connectionState().lastCheck);
  readonly isChecking = computed(() => this.connectionState().isChecking);
  readonly connectionSpeed = computed(() => this.connectionState().connectionSpeed);

  // Derived computed properties
  readonly isConnectionStable = computed(() => {
    const quality = this.connectionQuality();
    return quality === 'excellent' || quality === 'good';
  });

  readonly connectionStatusText = computed(() => {
    const quality = this.connectionQuality();
    const speed = this.connectionSpeed();
    
    if (quality === 'offline') return 'Offline';
    if (speed) return `${quality} (${speed}ms)`;
    return quality;
  });

  private readonly testUrls = [
    '/assets/icon/favicon.png',
    'https://www.google.com/favicon.ico',
    'https://www.cloudflare.com/favicon.ico'
  ] as const;

  private qualityCheckInterval: number | undefined;

  constructor() {
    this.initializeConnectionMonitoring();
    
    // Effect to handle offline state and redirect
    effect(() => {
      const isOnline = this.isOnline();
      if (!isOnline) {
        this.handleOfflineState();
      }
    });

    // Effect to handle poor connection quality with debouncing
    effect(() => {
      const quality = this.connectionQuality();
      if (quality === 'poor' || quality === 'fair') {
        // Debounce toast notifications to avoid spam
        setTimeout(() => {
          if (this.connectionQuality() === quality) {
            this.showWeakConnectionToast(quality);
          }
        }, 1000);
      }
    });

    // Effect to automatically redirect from no-connection page when connection is restored
    effect(() => {
      const isOnline = this.isOnline();
      if (isOnline && this.router.url === '/no-connection') {
        // Wait a bit to ensure connection is stable before redirecting
        setTimeout(() => {
          if (this.isOnline() && this.router.url === '/no-connection') {
            this.router.navigate(['/home']);
          }
        }, 1500);
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  private initializeConnectionMonitoring() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnlineEvent());
    window.addEventListener('offline', () => this.handleOfflineEvent());

    // Start periodic connection quality checks
    this.startConnectionQualityMonitoring();
    
    // Initial connection test with immediate check
    this.performInitialConnectionCheck();
  }

  private async testConnection() {
    this.connectionState.update(state => ({ ...state, isChecking: true }));
    
    try {
      const startTime = Date.now();
      
      // Try multiple URLs to get a better connection assessment
      let responseTime = 0;
      let successCount = 0;
      
      for (const url of this.testUrls) {
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            cache: 'no-cache',
            mode: 'no-cors' // Allow cross-origin requests
          });
          
          if (response.ok || response.type === 'opaque') {
            successCount++;
            const endTime = Date.now();
            responseTime += (endTime - startTime);
          }
        } catch (error) {
          // Continue to next URL if one fails
          continue;
        }
      }
      
      if (successCount > 0) {
        const avgResponseTime = responseTime / successCount;
        const quality = this.calculateConnectionQuality(avgResponseTime);
        
        this.connectionState.update(state => ({
          ...state,
          isOnline: true,
          connectionQuality: quality,
          lastCheck: new Date(),
          isChecking: false
        }));
      } else {
        this.connectionState.update(state => ({
          ...state,
          isOnline: false,
          connectionQuality: 'offline',
          lastCheck: new Date(),
          isChecking: false
        }));
      }
    } catch (error) {
      this.connectionState.update(state => ({
        ...state,
        isOnline: false,
        connectionQuality: 'offline',
        lastCheck: new Date(),
        isChecking: false
      }));
    }
  }

  private calculateConnectionQuality(responseTime: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (responseTime < 100) return 'excellent';
    if (responseTime < 300) return 'good';
    if (responseTime < 1000) return 'fair';
    return 'poor';
  }

  private startConnectionQualityMonitoring() {
    // Check connection quality every 30 seconds
    this.qualityCheckInterval = window.setInterval(() => {
      if (this.isOnline()) {
        this.testConnection();
      }
    }, 30000);
  }

  private handleOnlineEvent() {
    this.connectionState.update(state => ({
      ...state,
      isOnline: true,
      connectionQuality: 'excellent'
    }));
    
    // Test connection quality after coming back online
    setTimeout(() => this.testConnection(), 1000);
    
    // If we're on the no-connection page and connection is restored, redirect to home
    if (this.router.url === '/no-connection') {
      setTimeout(() => {
        if (this.isOnline()) {
          this.router.navigate(['/home']);
        }
      }, 2000); // Wait a bit to ensure connection is stable
    }
  }

  private handleOfflineEvent() {
    this.connectionState.update(state => ({
      ...state,
      isOnline: false,
      connectionQuality: 'offline'
    }));
  }

  private async handleOfflineState() {
    // Navigate to no-connection page if not already there
    if (this.router.url !== '/no-connection') {
      this.router.navigate(['/no-connection']);
    }
  }

  private async showWeakConnectionToast(quality: 'poor' | 'fair') {
    const message = quality === 'poor' 
      ? 'Weak internet connection detected. Please check your connection.'
      : 'Internet connection is slow. Some features may be limited.';

    const toast = await this.toastController.create({
      message,
      duration: 4000,
      position: 'top',
      color: quality === 'poor' ? 'warning' : 'medium',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  // Public method to manually test connection
  async testConnectionManually() {
    await this.testConnection();
    
    // If connection is restored and we're on no-connection page, redirect
    if (this.isOnline() && this.router.url === '/no-connection') {
      this.router.navigate(['/home']);
    }
  }

  // Public method to perform initial connection check
  async performInitialConnectionCheck() {
    // First check if navigator.onLine is reliable
    if (!navigator.onLine) {
      // If navigator.onLine says we're offline, set state immediately
      this.connectionState.update(state => ({
        ...state,
        isOnline: false,
        connectionQuality: 'offline',
        lastCheck: new Date(),
        isChecking: false
      }));
      return;
    }

    // Even if navigator.onLine says we're online, perform a quick network test
    // to catch cases where WiFi is turned off but the browser hasn't updated yet
    try {
      // Quick test with a simple fetch to detect offline state
      const testResponse = await fetch('/assets/icon/favicon.png', { 
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      
      // If we can't even reach local assets, we're definitely offline
      if (!testResponse.ok && testResponse.type !== 'opaque') {
        this.connectionState.update(state => ({
          ...state,
          isOnline: false,
          connectionQuality: 'offline',
          lastCheck: new Date(),
          isChecking: false
        }));
        return;
      }
    } catch (error) {
      // If fetch fails, we're offline
      this.connectionState.update(state => ({
        ...state,
        isOnline: false,
        connectionQuality: 'offline',
        lastCheck: new Date(),
        isChecking: false
      }));
      return;
    }

    // If we reach here, we seem to be online, so perform full connection test
    await this.testConnection();
  }

  // Method to check if we should redirect from no-connection page
  shouldRedirectFromNoConnection(): boolean {
    return this.isOnline() && this.router.url === '/no-connection';
  }

  // Public method to get current connection status
  getConnectionStatus() {
    return {
      isOnline: this.isOnline(),
      quality: this.connectionQuality(),
      lastCheck: this.lastCheck()
    };
  }

  // Method to simulate connection issues for testing
  simulateConnectionIssue(quality: 'fair' | 'poor' | 'offline') {
    this.connectionState.update(state => ({
      ...state,
      connectionQuality: quality,
      isOnline: quality !== 'offline',
      lastCheck: new Date()
    }));
  }

  // Method to reset to normal connection for testing
  resetConnection() {
    this.connectionState.update(state => ({
      ...state,
      isOnline: navigator.onLine,
      connectionQuality: navigator.onLine ? 'excellent' : 'offline',
      lastCheck: new Date()
    }));
  }

  // Public method to force a connection check
  async forceConnectionCheck(): Promise<boolean> {
    try {
      // Quick check first
      const quickTest = await fetch('/assets/icon/favicon.png', { 
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      
      if (!quickTest.ok && quickTest.type !== 'opaque') {
        this.connectionState.update(state => ({
          ...state,
          isOnline: false,
          connectionQuality: 'offline',
          lastCheck: new Date(),
          isChecking: false
        }));
        return false;
      }
      
      // If quick test passes, do full test
      await this.testConnection();
      return this.isOnline();
    } catch (error) {
      this.connectionState.update(state => ({
        ...state,
        isOnline: false,
        connectionQuality: 'offline',
        lastCheck: new Date(),
        isChecking: false
      }));
      return false;
    }
  }

  // Cleanup method
  private cleanup() {
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
    }
  }
}
