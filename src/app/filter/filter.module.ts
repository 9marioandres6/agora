import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FilterPage } from './filter.page';
import { FilterPageRoutingModule } from './filter-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FilterPageRoutingModule,
    TranslateModule,
  ],
  declarations: [FilterPage]
})
export class FilterPageModule {}
