import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type SupportedLanguage = 'en' | 'es';

interface TranslationKeys {
  'auth.welcome': string;
  'auth.signin.prompt': string;
  'auth.email': string;
  'auth.email.placeholder': string;
  'auth.email.required': string;
  'auth.email.invalid': string;
  'auth.password': string;
  'auth.password.placeholder': string;
  'auth.password.required': string;
  'auth.password.minlength': string;
  'auth.signin': string;
  'auth.or': string;
  'auth.continue.google': string;
  'auth.no.account': string;
  'auth.create.account': string;
  'auth.register.title': string;
  'auth.confirm.password': string;
  'auth.confirm.password.placeholder': string;
  'auth.confirm.password.required': string;
  'auth.passwords.mismatch': string;
  'auth.have.account': string;
  'auth.signin.link': string;
  'navbar.logout': string;
  'navbar.logging.out': string;
  'language.english': string;
  'language.spanish': string;
}

type Translations = Record<SupportedLanguage, TranslationKeys>;

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = signal<SupportedLanguage>('en');
  
  readonly language = this.currentLanguage.asReadonly();
  
  private translations: Translations = {
    en: {
      'auth.welcome': 'Welcome to Agora',
      'auth.signin.prompt': 'Sign in to your account',
      'auth.email': 'Email',
      'auth.email.placeholder': 'Enter your email',
      'auth.email.required': 'Email is required',
      'auth.email.invalid': 'Please enter a valid email',
      'auth.password': 'Password',
      'auth.password.placeholder': 'Enter your password',
      'auth.password.required': 'Password is required',
      'auth.password.minlength': 'Password must be at least 6 characters',
      'auth.signin': 'Sign In',
      'auth.or': 'or',
      'auth.continue.google': 'Continue with Google',
      'auth.no.account': "Don't have an account?",
      'auth.create.account': 'Create one',
      'auth.register.title': 'Create Account',
      'auth.confirm.password': 'Confirm Password',
      'auth.confirm.password.placeholder': 'Confirm your password',
      'auth.confirm.password.required': 'Please confirm your password',
      'auth.passwords.mismatch': 'Passwords do not match',
      'auth.have.account': 'Already have an account?',
      'auth.signin.link': 'Sign in',
      'navbar.logout': 'Logout',
      'navbar.logging.out': 'Logging out...',
      'language.english': 'English',
      'language.spanish': 'Español'
    },
    es: {
      'auth.welcome': 'Bienvenido a Agora',
      'auth.signin.prompt': 'Inicia sesión en tu cuenta',
      'auth.email': 'Correo electrónico',
      'auth.email.placeholder': 'Ingresa tu correo electrónico',
      'auth.email.required': 'El correo electrónico es obligatorio',
      'auth.email.invalid': 'Por favor ingresa un correo electrónico válido',
      'auth.password': 'Contraseña',
      'auth.password.placeholder': 'Ingresa tu contraseña',
      'auth.password.required': 'La contraseña es obligatoria',
      'auth.password.minlength': 'La contraseña debe tener al menos 6 caracteres',
      'auth.signin': 'Iniciar Sesión',
      'auth.or': 'o',
      'auth.continue.google': 'Continuar con Google',
      'auth.no.account': '¿No tienes una cuenta?',
      'auth.create.account': 'Crear una',
      'auth.register.title': 'Crear Cuenta',
      'auth.confirm.password': 'Confirmar Contraseña',
      'auth.confirm.password.placeholder': 'Confirma tu contraseña',
      'auth.confirm.password.required': 'Por favor confirma tu contraseña',
      'auth.passwords.mismatch': 'Las contraseñas no coinciden',
      'auth.have.account': '¿Ya tienes una cuenta?',
      'auth.signin.link': 'Iniciar sesión',
      'navbar.logout': 'Cerrar sesión',
      'navbar.logging.out': 'Cerrando sesión...',
      'language.english': 'English',
      'language.spanish': 'Español'
    }
  };
  
  readonly currentTranslations = computed(() => this.translations[this.currentLanguage()]);
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const savedLanguage = localStorage.getItem('app-language') as SupportedLanguage;
      if (savedLanguage && this.isValidLanguage(savedLanguage)) {
        this.currentLanguage.set(savedLanguage);
      }
    }
  }
  
  translate(key: keyof TranslationKeys): string {
    return this.currentTranslations()[key] || key;
  }
  
  t = this.translate.bind(this);
  
  switchLanguage(language: SupportedLanguage) {
    this.currentLanguage.set(language);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('app-language', language);
    }
  }
  
  private isValidLanguage(language: string): language is SupportedLanguage {
    return ['en', 'es'].includes(language);
  }
}