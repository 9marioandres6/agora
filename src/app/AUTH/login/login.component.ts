import { Component, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe],
})
export class LoginComponent {
  loginForm: FormGroup;
  isFormSubmitted = false;

  readonly loading: any;
  readonly error: any;
  readonly isAuthenticated: any;

  readonly errorMessage: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loading = this.authService.loading;
    this.error = this.authService.error;
    this.isAuthenticated = this.authService.isAuthenticated;

    this.errorMessage = computed(() => {
      return this.error() || '';
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    effect(() => {
      if (this.isAuthenticated()) {
        this.router.navigate(['/home']);
      }
    });
  }

  async onEmailPasswordLogin() {
    this.isFormSubmitted = true;

    if (this.loginForm.valid) {
      this.authService.clearError();

      try {
        const { email, password } = this.loginForm.value;
        await this.authService.signInWithEmailAndPassword(email, password);
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
  }

  async onGoogleLogin() {
    this.authService.clearError();

    try {
      await this.authService.registerWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
    }
  }

  getFormControl(controlName: string) {
    return this.loginForm.get(controlName);
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.getFormControl(controlName);
    return control ? control.hasError(errorType) : false;
  }

  shouldShowError(controlName: string, errorType: string): boolean {
    const control = this.getFormControl(controlName);
    if (!control) return false;

    const hasError = control.hasError(errorType);
    const shouldShow =
      this.isFormSubmitted || (control.touched && control.dirty);

    return hasError && shouldShow;
  }
}
