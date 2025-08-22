import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonSelect, PopoverController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from '../../services/translation.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class LanguageSelectorComponent {
  @ViewChild('languageSelect', { static: false }) languageSelect!: IonSelect;
  
  private translationService = inject(TranslationService);
  private themeService = inject(ThemeService);
  private popoverController = inject(PopoverController);
  
  currentLang$ = this.translationService.currentLang$;
  availableLanguages = this.translationService.getAvailableLanguages();
  
  onItemClick(): void {
    this.languageSelect.open();
  }
  
  getPopoverClass(): string {
    const isDark = this.themeService.isDarkMode();
    return isDark ? 'dark-theme-popover' : 'light-theme-popover';
  }
  
  onLanguageChange(event: any): void {
    const selectedLang = event.detail.value;
    this.translationService.setLanguage(selectedLang);
  }
  
  getLanguageName(lang: string): string {
    return this.translationService.getLanguageName(lang);
  }
}
