import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { ConnectionService } from '../services/connection.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, RouterModule, TranslateModule]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private connectionService = inject(ConnectionService);
  private router = inject(Router);

  email = '';
  password = '';

  user = this.authService.user;
  loading = this.authService.loading;
  error = this.authService.error;

  ngOnInit() {
    this.checkConnection();
  }

  private checkConnection() {
    if (!this.connectionService.isOnline()) {
      this.router.navigate(['/no-connection']);
    }
  }

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
