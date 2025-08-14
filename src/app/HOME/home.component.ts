import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../AUTH/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [CommonModule],
})
export class HomeComponent {
  readonly user: any;
  readonly loading: any;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.user = this.authService.user;
    this.loading = this.authService.loading;
  }

  async onLogout() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
