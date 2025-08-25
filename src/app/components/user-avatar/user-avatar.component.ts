import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

export interface UserAvatarData {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  joinedAt?: string;
}

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class UserAvatarComponent {
  user = input.required<UserAvatarData>();
  showRole = input<boolean>(true);
  showJoinedDate = input<boolean>(false);
  avatarSize = input<'small' | 'large'>('small');
  variant = input<'default' | 'creator' | 'collaborator'>('default');
}
