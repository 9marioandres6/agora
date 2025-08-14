import { Component, inject, computed } from '@angular/core';
import { TranslationService, SupportedLanguage } from '../../services/translation.service';
import { GenericDropdownComponent, DropdownOption } from '../generic-dropdown/generic-dropdown.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss',
  imports: [GenericDropdownComponent, FormsModule],
  standalone: true
})
export class LanguageSelectorComponent {
  private translationService = inject(TranslationService);
  
  readonly currentLanguage = this.translationService.language;
  
  languageOptions: DropdownOption[] = [
    { 
      label: 'English', 
      value: 'en', 
      disabled: false
    },
    { 
      label: 'Español', 
      value: 'es', 
      disabled: false
    }
  ];
  
  get selectedLanguage(): SupportedLanguage {
    return this.currentLanguage();
  }
  
  set selectedLanguage(value: SupportedLanguage) {
    this.translationService.switchLanguage(value);
  }
  
  onLanguageChange(languageValue: SupportedLanguage) {
    this.translationService.switchLanguage(languageValue);
  }
}
