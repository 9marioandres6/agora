export interface Message {
  id?: string;
  recipientUid: string;
  senderUid: string;
  senderName: string;
  senderEmail: string;
  senderPhotoURL?: string;
  projectId: string;
  projectTitle: string;
  type: 'collaboration_request' | 'collaboration_accepted' | 'collaboration_rejected';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  deleted?: boolean;
  deletedAt?: string;
}

export interface MessageNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}
