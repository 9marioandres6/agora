import { LocationData } from '../location.service';

export interface Scope {
  scope: string;
  place: string;
  image: string;
}

export interface Project {
  id?: string;
  title: string;
  description: string;
  needs: Need[];
  scope: Scope;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  status?: 'active' | 'completed' | 'cancelled';
  participants?: string[];
  tags?: string[];
  state: 'building' | 'implementing' | 'done';
  supports: string[];
  opposes: string[];
  verifies: string[];
  followers: string[];
  comments: Comment[];
  collaborators: Collaborator[];
  collaborationRequests: CollaborationRequest[];
  chapters?: Chapter[];
  media?: Media[];
  creator?: {
    uid: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
  };
  location?: LocationData;
  locationAddress?: string;
}

export interface Need {
  name: string;
  state: 'pending' | 'obtained';
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
