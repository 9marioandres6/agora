# User Avatar Component

A reusable component for displaying user information with avatar, name, and optional role/email details.

## Usage

```html
<app-user-avatar 
  [user]="userData"
  [variant]="'creator'"
  [avatarSize]="'small'"
  [showEmail]="true"
  [showRole]="false"
  [showJoinedDate]="false"
  [clickable]="true">
</app-user-avatar>
```

## Inputs

- `user` (required): UserAvatarData object containing user information
- `variant`: 'default' | 'creator' | 'collaborator' - affects styling
- `avatarSize`: 'small' | 'large' - avatar dimensions
- `showEmail`: boolean - whether to display email
- `showRole`: boolean - whether to display role
- `showJoinedDate`: boolean - whether to display join date
- `clickable`: boolean - whether the avatar is clickable (default: true)

## UserAvatarData Interface

```typescript
interface UserAvatarData {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  joinedAt?: string;
}
```

## Examples

### Creator Display
```html
<app-user-avatar 
  [user]="creatorData"
  [variant]="'creator'"
  [avatarSize]="'small'"
  [showEmail]="true">
</app-user-avatar>
```

### Collaborator Display
```html
<app-user-avatar 
  [user]="collaboratorData"
  [variant]="'collaborator'"
  [avatarSize]="'small'"
  [showEmail]="true"
  [showRole]="true"
  [showJoinedDate]="true">
</app-user-avatar>
```

## Clickable Navigation

When `clickable` is set to `true` (default), clicking on the avatar will navigate to the user's public profile page (`/profile/{userId}`). The edit functionality is only available when viewing your own profile.

## Benefits

- **Reusable**: Single component for all user avatar displays
- **Consistent**: Uniform styling across the application
- **Flexible**: Configurable display options
- **Maintainable**: Centralized styling and logic
- **Theme-aware**: Uses CSS custom properties for theming
- **Interactive**: Clickable avatars with hover effects and navigation
