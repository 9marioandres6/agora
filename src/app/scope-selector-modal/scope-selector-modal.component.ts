import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ScopeOption } from './models/scope.models';

@Component({
  selector: 'app-scope-selector-modal',
  templateUrl: './scope-selector-modal.component.html',
  styleUrls: ['./scope-selector-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class ScopeSelectorModalComponent {
  private modalCtrl = inject(ModalController);

  scopeOptions: ScopeOption[] = [];
  selectedScope: string = '';

  constructor() {
    // These will be passed from the parent component
  }

  selectScope(scope: string) {
    this.selectedScope = scope;
    this.modalCtrl.dismiss({
      selectedScope: scope
    });
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
}
