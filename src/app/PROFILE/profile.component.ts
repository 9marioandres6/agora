import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../AUTH/auth.service';
import { NavbarComponent } from '../HOME/navbar/navbar.component';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  readonly user = this.authService.user;

  onBack(): void {
    this.router.navigate(['/home']);
  }
}
