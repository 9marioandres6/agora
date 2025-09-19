import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MessagesService } from '../../services/messages.service';
import { Message } from '../../services/models/message.models';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule, ImageFallbackDirective]
})
export class MessagesComponent {
  private messagesService = inject(MessagesService);
  private modalCtrl = inject(ModalController);

  public readonly messages = this.messagesService.messages;
  public readonly unreadCount = this.messagesService.unreadCount;
  public readonly isLoading = this.messagesService.isLoading;

  public readonly hasMessages = computed(() => this.messages().length > 0);
  public readonly hasUnreadMessages = computed(() => this.unreadCount() > 0);

  async markAsRead(messageId: string): Promise<void> {
    await this.messagesService.markAsRead(messageId);
  }

  async markAllAsRead(): Promise<void> {
    await this.messagesService.markAllAsRead();
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.messagesService.deleteMessage(messageId);
  }

  async closeModal(): Promise<void> {
    await this.modalCtrl.dismiss();
  }

  getMessageTypeLabel(type: Message['type']): string {
    switch (type) {
      case 'collaboration_request':
        return 'MESSAGES.COLLABORATION_REQUEST';
      case 'collaboration_accepted':
        return 'MESSAGES.COLLABORATION_ACCEPTED';
      case 'collaboration_rejected':
        return 'MESSAGES.COLLABORATION_REJECTED';
      default:
        return '';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
