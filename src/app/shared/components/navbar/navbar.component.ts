import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { AuthService } from '../../../AUTH/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, ThemeToggleComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly appTitle = signal('Agora');
  readonly user = this.authService.user;
  readonly isLoggingOut = signal(false);

  async onLogout(): Promise<void> {
    if (this.isLoggingOut()) return;

    try {
      this.isLoggingOut.set(true);
      await this.authService.signOut();
      await this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.isLoggingOut.set(false);
    }
  }
}
