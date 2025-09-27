import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MessagesService } from '../../services/messages.service';
import { Message } from '../../services/models/message.models';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';
import { AuthService } from '../../services/auth.service';
import { ProjectsService } from '../../services/projects.service';

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
  private router = inject(Router);
  private authService = inject(AuthService);
  private projectsService = inject(ProjectsService);

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
    try {
      await this.messagesService.deleteMessage(messageId);
    } catch (error) {
      // You could add a toast notification here to inform the user
    }
  }

  async closeModal(): Promise<void> {
    await this.modalCtrl.dismiss();
  }

  async navigateToProject(message: Message): Promise<void> {
    // Mark message as read if it's unread
    if (!message.isRead && message.id) {
      await this.markAsRead(message.id);
    }
    
    await this.modalCtrl.dismiss();
    
    try {
      // Get the project to check if user is creator or collaborator
      const project = await this.projectsService.getProjectAsync(message.projectId);
      const currentUser = this.authService.user();
      
      if (project && currentUser?.uid) {
        // Check if user is creator or collaborator
        const isCreator = project.createdBy === currentUser.uid;
        const isCollaborator = project.collaborators?.some(c => c.uid === currentUser.uid) || false;
        
        if (isCreator || isCollaborator) {
          // User has access to private project page
          this.router.navigate(['/project', message.projectId, 'private']);
        } else {
          // User should go to public project page
          this.router.navigate(['/project', message.projectId, 'public']);
        }
      } else {
        // Fallback to public page if project not found
        this.router.navigate(['/project', message.projectId, 'public']);
      }
    } catch (error) {
      // Fallback to public page on error
      this.router.navigate(['/project', message.projectId, 'public']);
    }
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
