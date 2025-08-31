import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, query, where, orderBy, limit, getDocs, onSnapshot, Unsubscribe } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Message } from './models/message.models';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private _messages = signal<Message[]>([]);
  private _unreadCount = signal<number>(0);
  private _isLoading = signal<boolean>(false);

  public readonly messages = this._messages.asReadonly();
  public readonly unreadCount = this._unreadCount.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();

  private listeners: Map<string, Unsubscribe> = new Map();

  private get messagesCollection() {
    return collection(this.firestore, 'messages');
  }

  constructor() {
    effect(() => {
      const currentUser = this.authService.user();
      if (currentUser?.uid) {
        this.setupMessagesListener(currentUser.uid);
      } else {
        this.cleanup();
        this._messages.set([]);
        this._unreadCount.set(0);
      }
    });
  }

  private setupMessagesListener(userId: string) {
    // Clean up existing listener first
    this.cleanup();

    const q = query(
      this.messagesCollection,
      where('recipientUid', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      this._messages.set(messages);
      this._unreadCount.set(messages.filter(m => !m.isRead).length);
    });

    this.listeners.set('messages', unsubscribe);
  }

  async sendMessage(message: Omit<Message, 'id' | 'createdAt' | 'isRead'>): Promise<string> {
    try {
  
      const messageData: Omit<Message, 'id'> = {
        ...message,
        createdAt: new Date().toISOString(),
        isRead: false
      };

      const docRef = await addDoc(this.messagesCollection, messageData);

      return docRef.id;
    } catch (error) {
      console.error('MessagesService: Error sending message:', error);
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      const messageRef = doc(this.firestore, 'messages', messageId);
      await updateDoc(messageRef, {
        isRead: true,
        readAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const unreadMessages = this.messages().filter(m => !m.isRead);
      const updatePromises = unreadMessages.map(message => 
        this.markAsRead(message.id!)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const messageRef = doc(this.firestore, 'messages', messageId);
      await updateDoc(messageRef, {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  getMessagesByType(type: Message['type']): Message[] {
    return this.messages().filter(m => m.type === type);
  }

  getUnreadMessages(): Message[] {
    return this.messages().filter(m => !m.isRead);
  }

  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}
