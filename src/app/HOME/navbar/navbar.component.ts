import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SettingsDropdownComponent } from '../../shared/components/settings-dropdown/settings-dropdown.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, SettingsDropdownComponent, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private readonly router = inject(Router);

  readonly appTitle = signal('Agora');

  onNewProject(): void {
    this.router.navigate(['/create-post']);
  }
}
