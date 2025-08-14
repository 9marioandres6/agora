import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../AUTH/auth.service';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [CommonModule, NavbarComponent],
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  
  readonly user = this.authService.user;
}
