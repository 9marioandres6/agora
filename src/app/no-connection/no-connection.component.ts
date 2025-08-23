import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectionService } from '../services/connection.service';

@Component({
  selector: 'app-no-connection',
  templateUrl: './no-connection.component.html',
  styleUrls: ['./no-connection.component.scss'],
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class NoConnectionComponent implements OnDestroy {
  private connectionService = inject(ConnectionService);
  
  // Use signals from the service
  readonly isChecking = this.connectionService.isChecking;
  readonly lastCheck = this.connectionService.lastCheck;
  readonly isOnline = this.connectionService.isOnline;
  
  // Auto-reconnection signals
  readonly isAutoReconnecting = signal(false);
  readonly countdownSeconds = signal(10);
  
  // Auto-reconnection timer
  private autoReconnectTimer: any;
  private countdownTimer: any;
  
  // Computed signal for formatted last check time
  readonly lastCheckTime = computed(() => {
    const lastCheck = this.lastCheck();
    if (!lastCheck) return 'Never';
    return lastCheck.toLocaleTimeString();
  });

  constructor() {
    this.startAutoReconnection();
  }

  ngOnDestroy() {
    this.stopAutoReconnection();
  }

  startAutoReconnection() {
    if (this.isAutoReconnecting()) return;
    
    this.isAutoReconnecting.set(true);
    this.countdownSeconds.set(10);
    
    this.countdownTimer = setInterval(() => {
      const currentSeconds = this.countdownSeconds();
      if (currentSeconds > 1) {
        this.countdownSeconds.set(currentSeconds - 1);
      } else {
        this.countdownSeconds.set(10);
        this.performAutoReconnect();
      }
    }, 1000);
  }

  stopAutoReconnection() {
    if (this.autoReconnectTimer) {
      clearInterval(this.autoReconnectTimer);
      this.autoReconnectTimer = null;
    }
    
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    this.isAutoReconnecting.set(false);
    this.countdownSeconds.set(10);
  }

  private async performAutoReconnect() {
    try {
      await this.connectionService.testConnectionManually();
      
      // If connection is restored, stop auto-reconnection
      if (this.isOnline()) {
        this.stopAutoReconnection();
      }
    } catch (error) {
      console.error('Auto-reconnection failed:', error);
    }
  }

  async retryConnection() {
    try {
      await this.connectionService.testConnectionManually();
      
      // If connection is restored, stop auto-reconnection
      if (this.isOnline()) {
        this.stopAutoReconnection();
      }
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  }

  toggleAutoReconnection() {
    if (this.isAutoReconnecting()) {
      this.stopAutoReconnection();
    } else {
      this.startAutoReconnection();
    }
  }
}
