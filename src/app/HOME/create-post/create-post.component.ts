import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

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

  readonly scopes = [
    { value: 'grupal', label: 'create.project.scope.grupal' },
    { value: 'local', label: 'create.project.scope.local' },
    { value: 'state', label: 'create.project.scope.state' },
    { value: 'national', label: 'create.project.scope.national' },
    { value: 'international', label: 'create.project.scope.international' }
  ];
  readonly neededItems: string[] = [];

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

  onSubmit(): void {
    if (this.form.valid) {
      const projectData = {
        ...this.form.value,
        needed: this.neededItems
      };
      console.log('Project data:', projectData);
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
