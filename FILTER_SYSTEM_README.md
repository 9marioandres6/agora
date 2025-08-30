# New Firebase-Based Filtering System

## Overview

The project has been refactored to use a more efficient, scalable filtering system based on Firebase queries instead of client-side filtering. This new approach provides better performance, real-time updates, and improved scalability.

## Architecture

### Core Components

1. **FirebaseQueryService** (`src/app/services/firebase-query.service.ts`)
   - Handles all Firebase queries for filtering projects
   - Provides real-time listeners for filtered results
   - Manages pagination and loading states
   - Supports multiple filter criteria

2. **FilterStateService** (`src/app/services/filter-state.service.ts`)
   - Manages filter state across the application
   - Provides reactive filter options

3. **ProjectsService** (`src/app/services/projects.service.ts`)
   - Updated to use FirebaseQueryService
   - Simplified filtering logic
   - Better separation of concerns

### Filter Options

The system supports the following filter criteria:

```typescript
interface FilterOptions {
  scope: string;                    // 'all', 'my-projects', 'grupal', 'local', 'state', 'national', 'global'
  userId?: string;                  // Current user ID for user-specific queries
  location?: LocationData;          // User location for location-based filtering
  searchTerm?: string;              // Text search in project titles
  state?: 'building' | 'implementing' | 'done';  // Project state filter
  status?: 'active' | 'completed' | 'cancelled'; // Project status filter
  limit?: number;                   // Number of projects per page
}
```

## Usage Examples

### Basic Filtering

```typescript
// Filter by scope
await this.firebaseQueryService.queryProjects({
  scope: 'local',
  userId: currentUser.uid
});

// Search projects
const results = await this.firebaseQueryService.searchProjects('search term');

// Load more projects
const hasMore = await this.firebaseQueryService.loadMoreProjects();
```

### Real-time Updates

```typescript
// Set up real-time listener
this.firebaseQueryService.setupRealTimeListener({
  scope: 'grupal',
  userId: currentUser.uid
});

// Access filtered projects
const projects = this.firebaseQueryService.filteredProjects();
const isLoading = this.firebaseQueryService.isLoading();
const hasMore = this.firebaseQueryService.hasMore();
```

### In Components

```typescript
// Home page component
export class HomePage {
  filteredProjects = this.projectsService.filteredProjects;
  isLoadingFiltered = this.projectsService.isLoadingFiltered;
  hasMoreFiltered = this.projectsService.hasMoreFiltered;

  async applyFilter(scope: string) {
    if (scope === 'all') {
      this.projectsService.resetFilteredProjects();
    } else {
      await this.projectsService.setFilteredProjects(scope);
    }
  }
}
```

## Firebase Indexes

The system requires specific Firebase indexes for optimal performance. These are defined in `firestore.indexes.json`:

- **Scope + CreatedAt**: For scope-based filtering
- **CreatedBy + CreatedAt**: For user projects
- **Scope + Collaborators + CreatedAt**: For group projects
- **State + CreatedAt**: For state-based filtering
- **Status + CreatedAt**: For status-based filtering
- **Title**: For search functionality

## Benefits

1. **Performance**: Server-side filtering is much faster than client-side
2. **Scalability**: Performance doesn't degrade with data size
3. **Real-time**: Automatic updates when data changes
4. **Efficiency**: Reduced client-side processing and memory usage
5. **Maintainability**: Cleaner, more focused code structure

## Migration Notes

- **LocationFilterService**: No longer used, can be removed
- **Client-side filtering**: Replaced with Firebase queries
- **Distance calculations**: Moved to server-side (if needed in future)
- **Multiple listeners**: Consolidated into single, efficient listeners

## Future Enhancements

1. **Geospatial queries**: Use Firebase's GeoPoint for location-based filtering
2. **Full-text search**: Integrate with Algolia or similar service
3. **Advanced filters**: Add more filter criteria (tags, date ranges, etc.)
4. **Caching**: Implement client-side caching for frequently accessed data

## Troubleshooting

### Common Issues

1. **Missing indexes**: Ensure all required Firebase indexes are created
2. **Permission errors**: Check Firestore security rules
3. **Performance issues**: Verify query complexity and index usage

### Debugging

```typescript
// Enable debug logging
console.log('Filter options:', filterOptions);
console.log('Query result:', await this.firebaseQueryService.queryProjects(filterOptions));
```

## Performance Considerations

- **Query limits**: Default limit is 20 projects per page
- **Index usage**: All queries use composite indexes for optimal performance
- **Real-time updates**: Listeners are automatically cleaned up to prevent memory leaks
- **Pagination**: Efficient cursor-based pagination using `startAfter`
