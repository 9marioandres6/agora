import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLangSubject = new BehaviorSubject<string>('en');
  currentLang$ = this.currentLangSubject.asObservable();

  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
    
    this.loadTranslations();
  }

  private loadTranslations(): void {
    const enTranslations = {
      "COMMON": {
        "LOGIN": "Login",
        "REGISTER": "Register",
        "LOGOUT": "Logout",
        "SETTINGS": "Settings",
        "HOME": "Home",
        "EMAIL": "Email",
        "PASSWORD": "Password",
        "CONFIRM_PASSWORD": "Confirm Password",
        "SUBMIT": "Submit",
        "CANCEL": "Cancel",
        "SAVE": "Save",
        "DELETE": "Delete",
        "EDIT": "Edit",
        "ADD": "Add",
        "SEARCH": "Search",
        "CLOSE": "Close",
        "BACK": "Back",
        "NEXT": "Next",
        "PREVIOUS": "Previous",
        "LOADING": "Loading...",
        "ERROR": "Error",
        "SUCCESS": "Success",
        "WARNING": "Warning",
        "INFO": "Information"
      },
      "AUTH": {
        "LOGIN_TITLE": "Welcome Back",
        "LOGIN_SUBTITLE": "Sign in to your account",
        "REGISTER_TITLE": "Create Account",
        "REGISTER_SUBTITLE": "Sign up for a new account",
        "FORGOT_PASSWORD": "Forgot Password?",
        "REMEMBER_ME": "Remember Me",
        "ALREADY_HAVE_ACCOUNT": "Already have an account?",
        "DONT_HAVE_ACCOUNT": "Don't have an account?",
        "PASSWORD_REQUIRED": "Password is required",
        "EMAIL_REQUIRED": "Email is required",
        "INVALID_EMAIL": "Please enter a valid email",
        "PASSWORD_MISMATCH": "Passwords do not match",
        "LOGIN_SUCCESS": "Login successful",
        "REGISTER_SUCCESS": "Registration successful",
        "LOGOUT_SUCCESS": "Logout successful"
      },
      "HOME": {
        "WELCOME": "Welcome to MiApp20",
        "DESCRIPTION": "Your personal application for managing tasks and settings",
        "GET_STARTED": "Get Started",
        "FEATURES": "Features",
        "ABOUT": "About",
        "USER_ID": "User ID",
        "AUTH_PROVIDER": "Authentication Provider",
        "EMAIL_VERIFIED": "Email Verified",
        "ACCOUNT_CREATED": "Account Created",
        "LAST_SIGN_IN": "Last Sign In",
        "YES": "Yes",
        "NO": "No",
        "NO_PROJECTS": "No Projects Yet",
        "NO_PROJECTS_MESSAGE": "Be the first to create a project and start collaborating with others!",
        "CREATE_FIRST_PROJECT": "Create First Project",
        "WHAT_WE_NEED": "What We Need",
        "PARTICIPANTS": "participants",
        "STATE_BUILDING": "Building",
        "STATE_IMPLEMENTING": "Implementing",
        "STATE_DONE": "Done",
        "SUPPORT": "Support",
        "OPPOSE": "Oppose",
        "COMMENTS": "Comments",
        "ADD_COMMENT": "Add Comment",
        "COMMENT_PLACEHENTER": "Write your comment and press Enter to submit...",
        "SUBMIT_COMMENT": "Submit"
      },
      "SETTINGS": {
        "GENERAL": "General",
        "LANGUAGE": "Language",
        "THEME": "Theme",
        "LIGHT_THEME": "Light Theme",
        "DARK_THEME": "Dark Theme",
        "AUTO_THEME": "Auto Theme",
        "NOTIFICATIONS": "Notifications",
        "PRIVACY": "Privacy",
        "ABOUT_APP": "About App",
        "VERSION": "Version",
        "ACCOUNT": "Account"
      },
      "PROFILE": {
        "EDIT_PROFILE": "Edit Profile",
        "DISPLAY_NAME": "Display Name",
        "DISPLAY_NAME_PLACEHOLDER": "Enter your display name",
        "EMAIL": "Email",
        "PHOTO_URL": "Photo URL",
        "PHOTO_URL_PLACEHOLDER": "Enter photo URL (optional)",
        "EMAIL_READONLY": "Email cannot be changed",
        "AUTH_REQUIRED": "Authentication Required",
        "AUTH_REQUIRED_MESSAGE": "Please log in to edit your profile"
      },
      "NEW_ITEM": {
        "CREATE_NEW": "Create New",
        "TITLE": "Title",
        "TITLE_PLACEHOLDER": "Enter a title for your item",
        "DESCRIPTION": "Description",
        "DESCRIPTION_PLACEHOLDER": "Describe what you need or want to offer",
        "WHAT_WE_NEED": "What We Need",
        "NEED_PLACEHOLDER": "Add a need or requirement",
        "SCOPE": "Scope",
        "SCOPE_PLACEHOLDER": "Select the scope of your item",
        "SELECT_SCOPE": "Select Scope",
        "SCOPE_GRUPAL": "Grupal - Small Group Collaboration",
        "SCOPE_LOCAL": "Local - Neighbourhood/Community",
        "SCOPE_STATE": "State - State/Province level",
        "SCOPE_NATIONAL": "National - Country level",
        "SCOPE_GLOBAL": "Global - International level",
        "SEND_PROJECT": "Send Project",
        "AUTH_REQUIRED": "Authentication Required",
        "AUTH_REQUIRED_MESSAGE": "Please log in to create new items"
      },
      "VALIDATION": {
        "REQUIRED": "This field is required",
        "MIN_LENGTH": "Minimum length is {{min}} characters",
        "MAX_LENGTH": "Maximum length is {{max}} characters",
        "EMAIL_FORMAT": "Please enter a valid email address",
        "PASSWORD_STRENGTH": "Password must be at least 8 characters long"
      },
      "FORMS": {
        "DISPLAY_NAME": "Display Name",
        "OR": "or",
        "CONTINUE_WITH_GOOGLE": "Continue with Google"
      }
    };

    const esTranslations = {
      "COMMON": {
        "LOGIN": "Iniciar Sesión",
        "REGISTER": "Registrarse",
        "LOGOUT": "Cerrar Sesión",
        "SETTINGS": "Configuración",
        "HOME": "Inicio",
        "EMAIL": "Correo Electrónico",
        "PASSWORD": "Contraseña",
        "CONFIRM_PASSWORD": "Confirmar Contraseña",
        "SUBMIT": "Enviar",
        "CANCEL": "Cancelar",
        "SAVE": "Guardar",
        "DELETE": "Eliminar",
        "EDIT": "Editar",
        "ADD": "Agregar",
        "SEARCH": "Buscar",
        "CLOSE": "Cerrar",
        "BACK": "Atrás",
        "NEXT": "Siguiente",
        "PREVIOUS": "Anterior",
        "LOADING": "Cargando...",
        "ERROR": "Error",
        "SUCCESS": "Éxito",
        "WARNING": "Advertencia",
        "INFO": "Información"
      },
      "AUTH": {
        "LOGIN_TITLE": "Bienvenido de Vuelta",
        "LOGIN_SUBTITLE": "Inicia sesión en tu cuenta",
        "REGISTER_TITLE": "Crear Cuenta",
        "REGISTER_SUBTITLE": "Regístrate para una nueva cuenta",
        "FORGOT_PASSWORD": "¿Olvidaste tu Contraseña?",
        "REMEMBER_ME": "Recordarme",
        "ALREADY_HAVE_ACCOUNT": "¿Ya tienes una cuenta?",
        "DONT_HAVE_ACCOUNT": "¿No tienes una cuenta?",
        "PASSWORD_REQUIRED": "La contraseña es requerida",
        "EMAIL_REQUIRED": "El correo electrónico es requerido",
        "INVALID_EMAIL": "Por favor ingresa un correo válido",
        "PASSWORD_MISMATCH": "Las contraseñas no coinciden",
        "LOGIN_SUCCESS": "Inicio de sesión exitoso",
        "REGISTER_SUCCESS": "Registro exitoso",
        "LOGOUT_SUCCESS": "Cierre de sesión exitoso"
      },
      "HOME": {
        "WELCOME": "Bienvenido a MiApp20",
        "DESCRIPTION": "Tu aplicación personal para gestionar tareas y configuraciones",
        "GET_STARTED": "Comenzar",
        "FEATURES": "Características",
        "ABOUT": "Acerca de",
        "USER_ID": "ID de Usuario",
        "AUTH_PROVIDER": "Proveedor de Autenticación",
        "EMAIL_VERIFIED": "Correo Verificado",
        "ACCOUNT_CREATED": "Cuenta Creada",
        "LAST_SIGN_IN": "Último Inicio de Sesión",
        "YES": "Sí",
        "NO": "No",
        "NO_PROJECTS": "Aún No Hay Proyectos",
        "NO_PROJECTS_MESSAGE": "¡Sé el primero en crear un proyecto y comenzar a colaborar con otros!",
        "CREATE_FIRST_PROJECT": "Crear Primer Proyecto",
        "WHAT_WE_NEED": "Qué Necesitamos",
        "PARTICIPANTS": "participantes",
        "STATE_BUILDING": "Construyendo",
        "STATE_IMPLEMENTING": "Implementando",
        "STATE_DONE": "Completado",
        "SUPPORT": "Apoyar",
        "OPPOSE": "Oponer",
        "COMMENTS": "Comentarios",
        "ADD_COMMENT": "Agregar Comentario",
        "COMMENT_PLACEHENTER": "Escribe tu comentario y presiona Enter para enviar...",
        "SUBMIT_COMMENT": "Enviar"
      },
      "SETTINGS": {
        "GENERAL": "General",
        "LANGUAGE": "Idioma",
        "THEME": "Tema",
        "LIGHT_THEME": "Tema Claro",
        "DARK_THEME": "Tema Oscuro",
        "AUTO_THEME": "Tema Automático",
        "NOTIFICATIONS": "Notificaciones",
        "PRIVACY": "Privacidad",
        "ABOUT_APP": "Acerca de la App",
        "VERSION": "Versión",
        "ACCOUNT": "Cuenta"
      },
      "PROFILE": {
        "EDIT_PROFILE": "Editar Perfil",
        "DISPLAY_NAME": "Nombre de Usuario",
        "DISPLAY_NAME_PLACEHOLDER": "Ingresa tu nombre de usuario",
        "EMAIL": "Correo Electrónico",
        "PHOTO_URL": "URL de Foto",
        "PHOTO_URL_PLACEHOLDER": "Ingresa URL de foto (opcional)",
        "EMAIL_READONLY": "El correo no puede ser cambiado",
        "AUTH_REQUIRED": "Autenticación Requerida",
        "AUTH_REQUIRED_MESSAGE": "Por favor inicia sesión para editar tu perfil"
      },
      "NEW_ITEM": {
        "CREATE_NEW": "Crear Nuevo",
        "TITLE": "Título",
        "TITLE_PLACEHOLDER": "Ingresa un título para tu elemento",
        "DESCRIPTION": "Descripción",
        "DESCRIPTION_PLACEHOLDER": "Describe lo que necesitas o quieres ofrecer",
        "WHAT_WE_NEED": "Qué Necesitamos",
        "NEED_PLACEHOLDER": "Agrega una necesidad o requisito",
        "SCOPE": "Alcance",
        "SCOPE_PLACEHOLDER": "Selecciona el alcance de tu elemento",
        "SELECT_SCOPE": "Seleccionar Alcance",
        "SCOPE_GRUPAL": "Grupal - Colaboración de Grupo Pequeño",
        "SCOPE_LOCAL": "Local - Vecindario/Comunidad",
        "SCOPE_STATE": "Estatal - Nivel Estado/Provincia",
        "SCOPE_NATIONAL": "Nacional - Nivel País",
        "SCOPE_GLOBAL": "Global - Nivel Internacional",
        "SEND_PROJECT": "Enviar Proyecto",
        "AUTH_REQUIRED": "Autenticación Requerida",
        "AUTH_REQUIRED_MESSAGE": "Por favor inicia sesión para crear nuevos elementos"
      },
      "VALIDATION": {
        "REQUIRED": "Este campo es requerido",
        "MIN_LENGTH": "La longitud mínima es de {{min}} caracteres",
        "MAX_LENGTH": "La longitud máxima es de {{max}} caracteres",
        "EMAIL_FORMAT": "Por favor ingresa una dirección de correo válida",
        "PASSWORD_STRENGTH": "La contraseña debe tener al menos 8 caracteres"
      },
      "FORMS": {
        "DISPLAY_NAME": "Nombre de Usuario",
        "OR": "o",
        "CONTINUE_WITH_GOOGLE": "Continuar con Google"
      }
    };

    this.translate.setTranslation('en', enTranslations);
    this.translate.setTranslation('es', esTranslations);
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLangSubject.next(lang);
    localStorage.setItem('preferredLanguage', lang);
  }

  getCurrentLang(): string {
    return this.currentLangSubject.value;
  }

  getAvailableLanguages(): string[] {
    return ['en', 'es'];
  }

  getLanguageName(lang: string): string {
    const names: { [key: string]: string } = {
      'en': 'English',
      'es': 'Español'
    };
    return names[lang] || lang;
  }

  initializeLanguage(): void {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && this.getAvailableLanguages().includes(savedLang)) {
      this.setLanguage(savedLang);
    }
  }
}
