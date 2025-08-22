import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, RouterModule, TranslateModule]
})
export class LoginComponent {
  private authService = inject(AuthService);

  email = '';
  password = '';

  user = this.authService.user;
  loading = this.authService.loading;
  error = this.authService.error;

  async signIn() {
    try {
      await this.authService.signIn(this.email, this.password);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  }

  async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  }

  clearError() {
    this.authService.clearError();
  }
}
