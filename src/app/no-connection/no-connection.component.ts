import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectionService } from '../services/connection.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-no-connection',
  templateUrl: './no-connection.component.html',
  styleUrls: ['./no-connection.component.scss'],
  imports: [CommonModule, TranslateModule]
})
export class NoConnectionComponent {
  private connectionService = inject(ConnectionService);
  private router = inject(Router);
  
  readonly isChecking = this.connectionService.isChecking;
  readonly lastCheck = this.connectionService.lastCheck;
  readonly isOnline = this.connectionService.isOnline;
  
  readonly lastCheckTime = computed(() => {
    const lastCheck = this.lastCheck();
    if (!lastCheck) return 'Never';
    return lastCheck.toLocaleTimeString();
  });

  async retryConnection() {
    try {
      await this.connectionService.testConnectionManually();
      
      if (this.isOnline()) {
        this.router.navigate(['/home']);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  }
}
