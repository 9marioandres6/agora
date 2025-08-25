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
  [showJoinedDate]="false">
</app-user-avatar>
```

## Inputs

- `user` (required): UserAvatarData object containing user information
- `variant`: 'default' | 'creator' | 'collaborator' - affects styling
- `avatarSize`: 'small' | 'large' - avatar dimensions
- `showEmail`: boolean - whether to display email
- `showRole`: boolean - whether to display role
- `showJoinedDate`: boolean - whether to display join date

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

## Benefits

- **Reusable**: Single component for all user avatar displays
- **Consistent**: Uniform styling across the application
- **Flexible**: Configurable display options
- **Maintainable**: Centralized styling and logic
- **Theme-aware**: Uses CSS custom properties for theming
