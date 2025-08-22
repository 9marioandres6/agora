import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-settings-button',
  templateUrl: './settings-button.component.html',
  styleUrls: ['./settings-button.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SettingsButtonComponent {
  @Output() onSettingsClick = new EventEmitter<Event>();
  
  private themeService = inject(ThemeService);
  
  isDark = this.themeService.isDark;
  currentTheme = this.themeService.theme;

  getButtonStyle() {
    const isDark = this.isDark();
    return {
      '--button-color': isDark ? '#ffffff' : '#000000',
      '--button-hover-bg': isDark ? '#404040' : '#f8f9fa',
      '--button-active-bg': isDark ? '#555555' : '#e9ecef'
    };
  }
}
