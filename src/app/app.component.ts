import { Component, inject, OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { TranslationService } from './services/translation.service';
import { ConnectionService } from './services/connection.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private themeService = inject(ThemeService);
  private translationService = inject(TranslationService);
  private connectionService = inject(ConnectionService);
  
  ngOnInit(): void {
    this.translationService.initializeLanguage();
    this.themeService.loadTheme();
    // Connection service is automatically initialized in its constructor
  }
}
