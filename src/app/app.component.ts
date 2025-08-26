import { Component, inject, OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { TranslationService } from './services/translation.service';
import { ConnectionService } from './services/connection.service';
import { LocationService } from './services/location.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private themeService = inject(ThemeService);
  private translationService = inject(TranslationService);
  private connectionService = inject(ConnectionService);
  private locationService = inject(LocationService);
  private router = inject(Router);
  
  constructor() {
    // Check connection immediately in constructor to catch offline states
    // before any routing or component initialization happens
    this.checkInitialConnection();
  }
  
  ngOnInit(): void {
    this.translationService.initializeLanguage();
    this.themeService.loadTheme();
    
    // Perform additional connection check in ngOnInit
    this.performInitialConnectionCheck();
    
    // Request location permission on app startup
    this.requestLocationPermission();
  }

  private async checkInitialConnection() {
    // Quick check to see if we're offline before any routing
    if (!navigator.onLine) {
      // If we're offline, set connection state immediately
      this.connectionService.simulateConnectionIssue('offline');
      
      // Wait for router to be ready, then navigate
      setTimeout(() => {
        if (this.router.url !== '/no-connection') {
          this.router.navigate(['/no-connection']);
        }
      }, 100);
    }
  }

  private async performInitialConnectionCheck() {
    // Perform full connection check
    await this.connectionService.performInitialConnectionCheck();
  }

  private async requestLocationPermission() {
    try {
      // Request location permission on app startup
      await this.locationService.requestLocationPermission();
    } catch (error) {
      console.warn('Could not request location permission on startup:', error);
    }
  }
}
