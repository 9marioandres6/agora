import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, orderBy, limit, where, doc, updateDoc, deleteDoc, Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../../AUTH/auth.service';
import { Post, CreatePostRequest, PostQueryOptions, PostScope } from '../models/post.models';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);

  private readonly _posts = signal<Post[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly posts = this._posts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async createPost(postData: CreatePostRequest): Promise<string> {
    try {
      this._setLoading(true);
      this._clearError();

      const user = this.authService.user();
      if (!user) {
        throw new Error('User must be authenticated to create a post');
      }

      const post: Omit<Post, 'id'> = {
        ...postData,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(this.firestore, 'posts'), {
        ...post,
        createdAt: Timestamp.fromDate(post.createdAt),
        updatedAt: Timestamp.fromDate(post.updatedAt)
      });

      return docRef.id;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create post';
      this._setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._setLoading(false);
    }
  }

  async getAllPosts(options: PostQueryOptions = {}): Promise<Post[]> {
    try {
      this._setLoading(true);
      this._clearError();

      let q: any = collection(this.firestore, 'posts');

      if (options.scope) {
        q = query(q, where('scope', '==', options.scope));
      }

      if (options.authorId) {
        q = query(q, where('authorId', '==', options.authorId));
      }

      // Only add ordering if we don't have scope filter to avoid index requirements
      // When filtering by scope, we'll sort in memory instead
      if (!options.scope) {
        const orderByField = options.orderBy || 'createdAt';
        const orderDirection = options.orderDirection || 'desc';
        q = query(q, orderBy(orderByField, orderDirection));
      }

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      let posts: Post[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        posts.push({
          id: doc.id,
          title: data['title'],
          description: data['description'],
          scope: data['scope'],
          needed: data['needed'],
          authorId: data['authorId'],
          authorName: data['authorName'],
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date()
        });
      });

      // Sort in memory if we filtered by scope
      if (options.scope) {
        const orderByField = options.orderBy || 'createdAt';
        const orderDirection = options.orderDirection || 'desc';
        
        posts.sort((a, b) => {
          const aValue = a[orderByField as keyof Post];
          const bValue = b[orderByField as keyof Post];
          
          // Handle undefined values safely
          if (aValue === undefined || bValue === undefined) {
            return 0;
          }
          
          if (orderDirection === 'desc') {
            return bValue > aValue ? 1 : -1;
          } else {
            return aValue > bValue ? 1 : -1;
          }
        });
      }

      this._posts.set(posts);
      return posts;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch posts';
      this._setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._setLoading(false);
    }
  }

  async updatePost(postId: string, updates: Partial<CreatePostRequest>): Promise<void> {
    try {
      this._setLoading(true);
      this._clearError();

      const user = this.authService.user();
      if (!user) {
        throw new Error('User must be authenticated to update a post');
      }

      const postRef = doc(this.firestore, 'posts', postId);
      await updateDoc(postRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update post';
      this._setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._setLoading(false);
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      this._setLoading(true);
      this._clearError();

      const user = this.authService.user();
      if (!user) {
        throw new Error('User must be authenticated to delete a post');
      }

      await deleteDoc(doc(this.firestore, 'posts', postId));
      
      this._posts.update(posts => posts.filter(post => post.id !== postId));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete post';
      this._setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._setLoading(false);
    }
  }

  getPostsByScope(scope: PostScope): Observable<Post[]> {
    return from(this.getAllPosts({ scope }));
  }

  getPostsByAuthor(authorId: string): Observable<Post[]> {
    return from(this.getAllPosts({ authorId }));
  }

  getRecentPosts(limit: number = 10): Observable<Post[]> {
    return from(this.getAllPosts({ limit, orderBy: 'createdAt', orderDirection: 'desc' }));
  }

  clearError(): void {
    this._clearError();
  }

  private _setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  private _setError(error: string): void {
    this._error.set(error);
  }

  private _clearError(): void {
    this._error.set(null);
  }
}
