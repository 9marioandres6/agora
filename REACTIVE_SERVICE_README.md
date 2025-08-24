# Reactive ProjectsService - Real-time Updates

The `ProjectsService` has been completely refactored to be reactive using Angular 20 signals and Firebase real-time listeners. Now when any user makes changes to a project, all other users will see the updates immediately without needing to refresh the page.

## What Changed

### Before (Async Approach)
- Components had to manually call `getProjects()`, `getProject()`, etc.
- UI updates required manual state management
- No real-time updates - users had to refresh to see changes
- Complex manual state synchronization between components

### After (Reactive Approach)
- Real-time listeners automatically update data
- Components subscribe to reactive signals
- UI updates automatically when data changes
- No manual state management needed
- Immediate synchronization across all users

## How It Works

### 1. Real-time Listeners
The service automatically sets up Firebase real-time listeners for:
- **Global projects**: All projects in the system
- **User projects**: Projects created by the current user
- **Individual projects**: Specific project being viewed
- **Scope projects**: Projects filtered by scope (local, national, etc.)

### 2. Reactive Signals
The service provides these reactive signals:
```typescript
// Get current data
projects = this.projectsService.projects;           // All projects
userProjects = this.projectsService.userProjects;   // User's projects
currentProject = this.projectsService.currentProject; // Current project
projectsByScope = this.projectsService.projectsByScope; // Projects by scope
```

### 3. Automatic Updates
When any user makes changes:
1. Firebase updates the database
2. Real-time listeners detect the change
3. Signals automatically update
4. All components using those signals re-render
5. UI shows the changes immediately

## Usage Examples

### Basic Component Setup
```typescript
export class MyComponent {
  private projectsService = inject(ProjectsService);
  
  // Reactive data - automatically updates
  projects = this.projectsService.projects;
  currentProject = this.projectsService.currentProject;
  
  ngOnInit() {
    // Set up listener for specific project
    this.projectsService.setupProjectListener('project-id');
  }
  
  ngOnDestroy() {
    // Clean up listener
    this.projectsService.cleanupProjectListener('project-id');
  }
}
```

### Template Usage
```html
<!-- Data automatically updates when projects change -->
<div *ngFor="let project of projects()">
  {{ project.title }}
</div>

<!-- Current project automatically updates -->
<div *ngIf="currentProject()">
  {{ currentProject()?.description }}
</div>
```

### Making Changes
```typescript
// Just call the service method - UI updates automatically
async addComment(projectId: string, text: string) {
  await this.projectsService.addComment(projectId, text);
  // No need to manually update UI - it happens automatically!
}

async toggleSupport(projectId: string, userId: string) {
  await this.projectsService.toggleSupport(projectId, userId);
  // UI updates automatically via real-time listener
}
```

## Available Methods

### Reactive Getters (Immediate)
- `getProjects()` - Returns current projects signal value
- `getProject(projectId)` - Returns current project signal value
- `getProjectsByUser(userId)` - Returns current user projects signal value
- `getProjectsByScope(scope)` - Returns current scope projects signal value

### Legacy Async Methods (Backward Compatibility)
- `getProjectsAsync()` - Async version for legacy code
- `getProjectAsync(projectId)` - Async version for legacy code
- `getProjectsByUserAsync(userId)` - Async version for legacy code
- `getProjectsByScopeAsync(scope)` - Async version for legacy code

### Listener Management
- `setupProjectListener(projectId)` - Start listening to specific project
- `cleanupProjectListener(projectId)` - Stop listening to specific project
- `setupScopeProjectsListener(scope)` - Start listening to scope projects
- `cleanupScopeProjectsListener(scope)` - Stop listening to scope projects
- `cleanup()` - Clean up all listeners

### Computed Queries
- `getProjectsByTag(tag)` - Filter projects by tag
- `getProjectsByState(state)` - Filter projects by state
- `getProjectsByStatus(status)` - Filter projects by status

## Migration Guide

### 1. Update Component Imports
```typescript
// Add effect if using reactive listeners
import { Component, inject, OnInit, signal, effect, OnDestroy } from '@angular/core';
```

### 2. Replace Async Data Loading
```typescript
// Before
async ngOnInit() {
  const projects = await this.projectsService.getProjects();
  this.projects.set(projects);
}

// After
ngOnInit() {
  // Data automatically loads via real-time listener
  this.projects = this.projectsService.projects;
}
```

### 3. Remove Manual State Updates
```typescript
// Before
this.projects.update(projects => 
  projects.map(project => 
    project.id === projectId 
      ? { ...project, comments: [...project.comments, newComment] }
      : project
  )
);

// After
// No manual updates needed - real-time listener handles it
await this.projectsService.addComment(projectId, commentText);
```

### 4. Add Cleanup
```typescript
ngOnDestroy() {
  // Clean up listeners to prevent memory leaks
  if (this.projectId) {
    this.projectsService.cleanupProjectListener(this.projectId);
  }
}
```

## Benefits

1. **Real-time Updates**: Changes appear immediately across all users
2. **Simplified Code**: No more manual state management
3. **Better Performance**: Automatic change detection and rendering
4. **Consistent UI**: All components show the same data
5. **Reduced Bugs**: No more state synchronization issues
6. **Better UX**: Users see changes instantly

## Performance Considerations

- Listeners are automatically cleaned up when components are destroyed
- Only active listeners consume resources
- Firebase handles connection management and reconnection
- Angular signals provide efficient change detection

## Troubleshooting

### Data Not Updating
- Check if listener is set up: `setupProjectListener(projectId)`
- Verify Firebase connection is active
- Check browser console for errors

### Memory Leaks
- Always call cleanup methods in `ngOnDestroy`
- Use `cleanupProjectListener()` for individual projects
- Use `cleanup()` to clean all listeners

### Backward Compatibility
- Legacy async methods still work
- Gradually migrate components to reactive approach
- Both approaches can coexist during transition
