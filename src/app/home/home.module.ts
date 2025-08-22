import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HomePage } from './home.page';
import { ThemeToggleComponent } from '../components/theme-toggle/theme-toggle.component';
import { SettingsModalComponent } from '../components/settings-modal/settings-modal.component';
import { SettingsButtonComponent } from '../components/settings-button/settings-button.component';

import { HomePageRoutingModule } from './home-routing.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    TranslateModule,
    ThemeToggleComponent,
    SettingsModalComponent,
    SettingsButtonComponent
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
