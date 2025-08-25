import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectionService } from '../services/connection.service';

@Component({
  selector: 'app-no-connection',
  templateUrl: './no-connection.component.html',
  styleUrls: ['./no-connection.component.scss'],
  imports: [CommonModule, TranslateModule]
})
export class NoConnectionComponent {
  private connectionService = inject(ConnectionService);
  
  readonly lastCheck = this.connectionService.lastCheck;
  
  readonly lastCheckTime = computed(() => {
    const lastCheck = this.lastCheck();
    if (!lastCheck) return 'Never';
    return lastCheck.toLocaleTimeString();
  });
}
