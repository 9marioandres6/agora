import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-global-spinner',
  templateUrl: './global-spinner.component.html',
  styleUrls: ['./global-spinner.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class GlobalSpinnerComponent {
  private loadingService = inject(LoadingService);
  
  isLoading = this.loadingService.isLoading;
}
