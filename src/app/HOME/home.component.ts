import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../AUTH/auth.service';
import { NavbarComponent } from './navbar/navbar.component';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { PostService } from '../shared/services/post.service';
import { Post, PostScope } from '../shared/services/post.models';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [CommonModule, NavbarComponent, TranslatePipe],
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);
  
  readonly user = this.authService.user;
  readonly posts = this.postService.posts;
  readonly loading = this.postService.loading;
  readonly error = this.postService.error;
  readonly selectedScope = signal<PostScope | ''>('');

  readonly scopes = [
    { value: '', label: 'home.filter.all.scopes' },
    { value: 'grupal', label: 'create.project.scope.grupal' },
    { value: 'local', label: 'create.project.scope.local' },
    { value: 'state', label: 'create.project.scope.state' },
    { value: 'national', label: 'create.project.scope.national' },
    { value: 'international', label: 'create.project.scope.international' }
  ];

  ngOnInit(): void {
    // Don't load posts here - let the effect handle it
  }

  constructor() {
    // Watch for authentication changes and load posts when user logs in
    effect(() => {
      const user = this.user();
      if (user) {
        // Small delay to ensure authentication is fully established
        setTimeout(() => {
          this.loadPosts();
        }, 100);
      }
    });
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
