import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { PostService } from '../../shared/services/post.service';
import { CreatePostRequest } from '../../shared/models/post.models';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly postService = inject(PostService);

  readonly scopes = [
    { value: 'grupal', label: 'create.project.scope.grupal' },
    { value: 'local', label: 'create.project.scope.local' },
    { value: 'state', label: 'create.project.scope.state' },
    { value: 'national', label: 'create.project.scope.national' },
    { value: 'international', label: 'create.project.scope.international' }
  ];
  readonly neededItems: string[] = [];
  readonly isSubmitting = signal(false);

  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    scope: ['', Validators.required]
  });

  addNeededItem(item: string): void {
    if (item.trim()) {
      this.neededItems.push(item.trim());
    }
  }

  removeNeededItem(index: number): void {
    this.neededItems.splice(index, 1);
  }

  async onSubmit(): Promise<void> {
    if (this.form.valid && !this.isSubmitting()) {
      try {
        this.isSubmitting.set(true);
        
        const postData: CreatePostRequest = {
          title: this.form.value.title,
          description: this.form.value.description,
          scope: this.form.value.scope,
          needed: this.neededItems
        };

        await this.postService.createPost(postData);
        await this.router.navigate(['/home']);
      } catch (error) {
        console.error('Failed to create post:', error);
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
