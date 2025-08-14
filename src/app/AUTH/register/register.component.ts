import { Component, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class RegisterComponent {
  registerForm: FormGroup;
  isFormSubmitted = false;

  readonly loading: any;
  readonly error: any;
  readonly isAuthenticated: any;
  readonly errorMessage: any;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.loading = this.authService.loading;
    this.error = this.authService.error;
    this.isAuthenticated = this.authService.isAuthenticated;

    this.errorMessage = computed(() => {
      return this.error() || '';
    });
    this.registerForm = new FormGroup(
      {
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(6),
        ]),
        confirmPassword: new FormControl('', [Validators.required]),
      },
      { validators: this.passwordMatchValidator },
    );

    effect(() => {
      if (this.isAuthenticated()) {
        this.router.navigate(['/home']);
      }
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  async onEmailPasswordRegister() {
    this.isFormSubmitted = true;

    if (this.registerForm.valid) {
      this.authService.clearError();
      try {
        const { email, password } = this.registerForm.value;
        await this.authService.registerWithEmailAndPassword(email, password);
      } catch (error) {
        console.error('Registration failed:', error);
      }
    }
  }

  async onGoogleRegister() {
    this.authService.clearError();
    try {
      await this.authService.registerWithGoogle();
    } catch (error) {
      console.error('Google registration failed:', error);
    }
  }

  getFormControl(controlName: string) {
    return this.registerForm.get(controlName);
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
