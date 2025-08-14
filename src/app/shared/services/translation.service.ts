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
  'navbar.new.project': string;
  'create.project.title': string;
  'create.project.back': string;
  'create.project.title.label': string;
  'create.project.title.placeholder': string;
  'create.project.description.label': string;
  'create.project.description.placeholder': string;
  'create.project.scope.label': string;
  'create.project.scope.placeholder': string;
  'create.project.scope.grupal': string;
  'create.project.scope.local': string;
  'create.project.scope.state': string;
  'create.project.scope.national': string;
  'create.project.scope.international': string;
  'create.project.needed.label': string;
  'create.project.needed.placeholder': string;
  'create.project.add': string;
  'create.project.create': string;
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
      'navbar.new.project': 'New Project',
      'create.project.title': 'Create New Project',
      'create.project.back': '← Back',
      'create.project.title.label': 'Title',
      'create.project.title.placeholder': 'Enter project title',
      'create.project.description.label': 'Description',
      'create.project.description.placeholder': 'Enter project description',
      'create.project.scope.label': 'Scope',
      'create.project.scope.placeholder': 'Select scope',
      'create.project.scope.grupal': 'Grupal',
      'create.project.scope.local': 'Local',
      'create.project.scope.state': 'State',
      'create.project.scope.national': 'National',
      'create.project.scope.international': 'International',
      'create.project.needed.label': "What's needed",
      'create.project.needed.placeholder': 'Add needed item',
      'create.project.add': 'Add',
      'create.project.create': 'Create Project',
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
      'navbar.new.project': 'Nuevo Proyecto',
      'create.project.title': 'Crear Nuevo Proyecto',
      'create.project.back': '← Volver',
      'create.project.title.label': 'Título',
      'create.project.title.placeholder': 'Ingresa el título del proyecto',
      'create.project.description.label': 'Descripción',
      'create.project.description.placeholder': 'Ingresa la descripción del proyecto',
      'create.project.scope.label': 'Alcance',
      'create.project.scope.placeholder': 'Selecciona el alcance',
      'create.project.scope.grupal': 'Grupal',
      'create.project.scope.local': 'Local',
      'create.project.scope.state': 'Estatal',
      'create.project.scope.national': 'Nacional',
      'create.project.scope.international': 'Internacional',
      'create.project.needed.label': 'Qué se necesita',
      'create.project.needed.placeholder': 'Agregar elemento necesario',
      'create.project.add': 'Agregar',
      'create.project.create': 'Crear Proyecto',
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