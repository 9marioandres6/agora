import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLangSubject = new BehaviorSubject<string>('en');
  currentLang$ = this.currentLangSubject.asObservable();
  private http = inject(HttpClient);

  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
    
    this.loadTranslations();
    this.initializeLanguage();
  }

  private async loadTranslations(): Promise<void> {
    try {
      // Load English translations
      const enTranslations = await this.http.get<any>('./assets/i18n/en.json').toPromise();
      if (enTranslations) {
        this.translate.setTranslation('en', enTranslations);
      }

      // Load Spanish translations
      const esTranslations = await this.http.get<any>('./assets/i18n/es.json').toPromise();
      if (esTranslations) {
        this.translate.setTranslation('es', esTranslations);
      }
    } catch (error) {
      console.error('Error loading translations:', error);
    }
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
