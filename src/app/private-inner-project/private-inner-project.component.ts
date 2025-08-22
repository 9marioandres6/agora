import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-private-inner-project',
  templateUrl: './private-inner-project.component.html',
  styleUrls: ['./private-inner-project.component.scss'],
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class PrivateInnerProjectComponent {
  private route = inject(ActivatedRoute);
  
  projectId = this.route.snapshot.paramMap.get('id');
  
  constructor() {
    // For now, this component is empty as requested
    // We'll add content in the next iteration
  }
}
