export interface Project {
  id?: string;
  title: string;
  description: string;
  needs: string[];
  scope: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  status?: 'active' | 'completed' | 'cancelled';
  participants?: string[];
  tags?: string[];
  state: 'building' | 'implementing' | 'done';
  supports: string[];
  opposes: string[];
  comments: Comment[];
  collaborators: Collaborator[];
  collaborationRequests: CollaborationRequest[];
  chapters?: Chapter[];
  creator?: {
    uid: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
  };
}

export interface Chapter {
  id: string;
  title?: string;
  description: string;
  media: Media[];
}

export interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: number;
}

export interface Collaborator {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  joinedAt: string;
  role: 'collaborator' | 'admin';
}

export interface CollaborationRequest {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
}

export interface Comment {
  id: string;
  text: string;
  createdBy: string;
  creatorName: string;
  createdAt: string;
}
