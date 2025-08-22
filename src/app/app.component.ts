import { Component, inject, OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private themeService = inject(ThemeService);
  private translationService = inject(TranslationService);
  
  ngOnInit(): void {
    this.translationService.initializeLanguage();
    this.themeService.loadTheme();
  }
}
