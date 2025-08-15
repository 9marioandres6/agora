import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { PostService } from '../../shared/services/post.service';
import { Post, PostScope } from '../../shared/models/post.models';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './posts-list.component.html',
  styleUrl: './posts-list.component.scss'
})
export class PostsListComponent implements OnInit {
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);

  readonly posts = this.postService.posts;
  readonly loading = this.postService.loading;
  readonly error = this.postService.error;
  readonly selectedScope = signal<PostScope | ''>('');

  readonly scopes = [
    { value: '', label: 'All Scopes' },
    { value: 'grupal', label: 'create.project.scope.grupal' },
    { value: 'local', label: 'create.project.scope.local' },
    { value: 'state', label: 'create.project.scope.state' },
    { value: 'national', label: 'create.project.scope.national' },
    { value: 'international', label: 'create.project.scope.international' }
  ];

  ngOnInit(): void {
    this.loadPosts();
  }

  async loadPosts(): Promise<void> {
    try {
      const scope = this.selectedScope();
      await this.postService.getAllPosts({
        scope: scope || undefined,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      });
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  }

  onScopeChange(scope: string): void {
    this.selectedScope.set(scope as PostScope | '');
    this.loadPosts();
  }

  onCreateNew(): void {
    this.router.navigate(['/create-post']);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}

