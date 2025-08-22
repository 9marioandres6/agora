import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings-popover',
  templateUrl: './settings-popover.component.html',
  styleUrls: ['./settings-popover.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule, ThemeToggleComponent]
})
export class SettingsPopoverComponent {
  private authService = inject(AuthService);
  private popoverCtrl = inject(PopoverController);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;

  async logout() {
    try {
      await this.authService.signOut();
      this.popoverCtrl.dismiss();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  dismiss() {
    this.popoverCtrl.dismiss();
  }
}
