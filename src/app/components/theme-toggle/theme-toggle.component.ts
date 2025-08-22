import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);
  
  theme = this.themeService.theme;
  isDark = this.themeService.isDark;

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getCurrentTheme(): string {
    return this.themeService.getCurrentTheme();
  }
}
