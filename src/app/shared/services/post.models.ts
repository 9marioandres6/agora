export interface Post {
  id?: string;
  title: string;
  description: string;
  scope: PostScope;
  needed: string[];
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PostScope = 'grupal' | 'local' | 'state' | 'national' | 'international';

export interface CreatePostRequest {
  title: string;
  description: string;
  scope: PostScope;
  needed: string[];
}

export interface PostQueryOptions {
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'title';
  orderDirection?: 'asc' | 'desc';
  scope?: PostScope;
  authorId?: string;
}
