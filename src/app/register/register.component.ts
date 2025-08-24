import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { ConnectionService } from '../services/connection.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, RouterModule, TranslateModule]
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private connectionService = inject(ConnectionService);
  private router = inject(Router);

  email = '';
  password = '';
  displayName = '';

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

  async signUp() {
    try {
      await this.authService.signUp(this.email, this.password, this.displayName);
    } catch (error) {
      console.error('Sign up error:', error);
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
