import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MessagesService } from '../../services/messages.service';
import { MessagesComponent } from '../messages/messages.component';

@Component({
  selector: 'app-messages-button',
  templateUrl: './messages-button.component.html',
  styleUrls: ['./messages-button.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class MessagesButtonComponent {
  private modalCtrl = inject(ModalController);
  private messagesService = inject(MessagesService);

  public readonly unreadCount = this.messagesService.unreadCount;
  public readonly hasUnreadMessages = computed(() => this.unreadCount() > 0);

  async openMessages(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: MessagesComponent,
      componentProps: {},
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      cssClass: 'messages-modal'
    });

    await modal.present();
  }
}
