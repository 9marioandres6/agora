import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';

@Directive({
  selector: '[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  
  @Input() appImageFallback: string = '';
  @Input() fallbackIcon: string = 'person';
  @Input() fallbackSize: 'small' | 'large' = 'large';
  
  private originalSrc: string = '';
  private hasError: boolean = false;

  ngOnInit(): void {
    if (this.el.nativeElement.tagName === 'IMG') {
      this.originalSrc = this.el.nativeElement.src;
      this.setupImageErrorHandling();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private setupImageErrorHandling(): void {
    const img = this.el.nativeElement as HTMLImageElement;
    
    img.addEventListener('error', () => {
      if (!this.hasError) {
        this.hasError = true;
        this.replaceWithFallback();
      }
    });

    img.addEventListener('load', () => {
      this.hasError = false;
    });
  }

  private replaceWithFallback(): void {
    const img = this.el.nativeElement as HTMLImageElement;
    const parent = img.parentElement;
    
    if (!parent) return;

    // Create fallback icon element
    const fallbackElement = document.createElement('ion-icon');
    fallbackElement.setAttribute('name', this.fallbackIcon);
    fallbackElement.setAttribute('size', this.fallbackSize);
    
    // Add appropriate classes based on parent context
    if (parent.classList.contains('avatar-small') || parent.classList.contains('avatar-large')) {
      fallbackElement.classList.add('avatar-fallback');
    }
    
    // Replace the img element with the fallback
    parent.replaceChild(fallbackElement, img);
  }
}
