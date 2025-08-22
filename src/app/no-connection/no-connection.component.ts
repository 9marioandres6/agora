import { Component, computed, inject } from '@angular/core';
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
export class NoConnectionComponent {
  private connectionService = inject(ConnectionService);
  
  // Use signals from the service
  readonly isChecking = this.connectionService.isChecking;
  readonly lastCheck = this.connectionService.lastCheck;
  
  // Computed signal for formatted last check time
  readonly lastCheckTime = computed(() => {
    const lastCheck = this.lastCheck();
    if (!lastCheck) return 'Never';
    return lastCheck.toLocaleTimeString();
  });

  async retryConnection() {
    try {
      await this.connectionService.testConnectionManually();
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  }

  goToHome() {
    // Try to navigate to home, but this might fail if still offline
    window.location.href = '/home';
  }
}
