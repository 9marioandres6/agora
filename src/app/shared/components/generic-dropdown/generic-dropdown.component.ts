import { Component, Input, Output, EventEmitter, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
  label: string;
  value: any;
  disabled?: boolean;
}

@Component({
  selector: 'app-generic-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-dropdown.component.html',
  styleUrl: './generic-dropdown.component.scss'
})
export class GenericDropdownComponent {
  @Input() options: DropdownOption[] = [];
  @Input() value: any = null;
  @Input() placeholder = 'Select an option';
  @Input() disabled = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() searchable = false;
  
  @Output() valueChange = new EventEmitter<any>();
  @Output() change = new EventEmitter<any>();

  private readonly _isOpen = signal(false);
  private readonly _searchTerm = signal('');

  readonly isOpen = this._isOpen.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();

  readonly dropdownClasses = computed(() => ({
    'dropdown': true,
    [`dropdown--${this.size}`]: true,
    'dropdown--open': this.isOpen(),
    'dropdown--disabled': this.disabled
  }));

  readonly filteredOptions = computed(() => {
    if (!this.searchable || !this.searchTerm()) {
      return this.options;
    }
    return this.options.filter(option => 
      option.label.toLowerCase().includes(this.searchTerm().toLowerCase())
    );
  });

  readonly selectedOption = computed(() => 
    this.options.find(option => option.value === this.value)
  );

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.close();
    }
  }

  toggle(): void {
    if (!this.disabled) {
      this._isOpen.update(open => !open);
    }
  }

  close(): void {
    this._isOpen.set(false);
    this._searchTerm.set('');
  }

  selectOption(option: DropdownOption): void {
    if (option.disabled) return;
    
    this.value = option.value;
    this.valueChange.emit(this.value);
    this.change.emit(this.value);
    this.close();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._searchTerm.set(target.value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    } else if (event.key === 'Enter' && this.isOpen()) {
      const firstOption = this.filteredOptions()[0];
      if (firstOption && !firstOption.disabled) {
        this.selectOption(firstOption);
      }
    }
  }
}
