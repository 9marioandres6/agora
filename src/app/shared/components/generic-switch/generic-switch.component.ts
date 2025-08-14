import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generic-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-switch.component.html',
  styleUrl: './generic-switch.component.scss'
})
export class GenericSwitchComponent {
  @Input() checked = false;
  @Input() disabled = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() onLabel = '';
  @Input() offLabel = '';
  @Input() showLabels = false;
  
  @Output() checkedChange = new EventEmitter<boolean>();
  @Output() change = new EventEmitter<boolean>();

  readonly switchClasses = computed(() => ({
    'switch': true,
    [`switch--${this.size}`]: true,
    'switch--checked': this.checked,
    'switch--disabled': this.disabled
  }));

  toggle(): void {
    if (!this.disabled) {
      this.checked = !this.checked;
      this.checkedChange.emit(this.checked);
      this.change.emit(this.checked);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }
}
