import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../../AUTH/auth.service';

@Component({
  selector: 'app-settings-dropdown',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent, LanguageSelectorComponent, TranslatePipe],
  templateUrl: './settings-dropdown.component.html',
  styleUrl: './settings-dropdown.component.scss'
})
export class SettingsDropdownComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.authService.user;
  readonly isLoggingOut = signal(false);
  readonly isOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.settings-dropdown')) {
      this.close();
    }
  }

  toggle(): void {
    this.isOpen.update(open => !open);
  }

  close(): void {
    this.isOpen.set(false);
  }

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
