import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, doc, updateDoc, query, where } from '@angular/fire/firestore';
import { GoogleMapsService } from './google-maps.service';
import { LocationData } from './location.service';

export interface MigrationProgress {
  total: number;
  processed: number;
  errors: number;
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  private firestore = inject(Firestore);
  private googleMapsService = inject(GoogleMapsService);

  async migrateProjectsToCoordinates(): Promise<MigrationProgress> {
    const progress: MigrationProgress = {
      total: 0,
      processed: 0,
      errors: 0,
      completed: false
    };

    try {
      const projectsCollection = collection(this.firestore, 'projects');
      
      // Get projects that have place but no location coordinates
      const projectsQuery = query(projectsCollection);
      const snapshot = await getDocs(projectsQuery);
      
      const projectsToMigrate = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.scope?.place && !data.scope?.location;
      });

      progress.total = projectsToMigrate.length;

      for (const projectDoc of projectsToMigrate) {
        try {
          const projectData = projectDoc.data();
          const place = projectData.scope?.place;
          
          if (place && typeof place === 'string') {
            // Try to convert place name to coordinates
            const coordinates = await this.googleMapsService.addressToCoordinates(place);
            
            if (coordinates) {
              const addressComponents = await this.googleMapsService.coordinatesToAddress(
                coordinates.latitude,
                coordinates.longitude
              );

              const locationData: LocationData = {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                geohash: coordinates.geohash,
                address: addressComponents?.formattedAddress,
                city: addressComponents?.city,
                state: addressComponents?.state,
                country: addressComponents?.country,
                countryCode: addressComponents?.countryCode,
                accuracy: 0,
                timestamp: Date.now()
              };

              // Update the project with coordinate-based location
              await updateDoc(doc(this.firestore, 'projects', projectDoc.id), {
                'scope.location': locationData,
                updatedAt: new Date().toISOString()
              });

              console.log(`Migrated project ${projectDoc.id}: ${place} -> coordinates`);
            } else {
              console.warn(`Could not geocode place: ${place} for project ${projectDoc.id}`);
              progress.errors++;
            }
          }
          
          progress.processed++;
        } catch (error) {
          console.error(`Error migrating project ${projectDoc.id}:`, error);
          progress.errors++;
          progress.processed++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1100));
      }

      progress.completed = true;
      return progress;
    } catch (error) {
      console.error('Error during project migration:', error);
      throw error;
    }
  }

  async migrateUsersToCoordinates(): Promise<MigrationProgress> {
    const progress: MigrationProgress = {
      total: 0,
      processed: 0,
      errors: 0,
      completed: false
    };

    try {
      const usersCollection = collection(this.firestore, 'users');
      const snapshot = await getDocs(usersCollection);
      
      // Get users that might have old location format
      const usersToMigrate = snapshot.docs.filter(doc => {
        const data = doc.data();
        // Check if user has location but it's missing geohash
        return data.location && !data.location.geohash;
      });

      progress.total = usersToMigrate.length;

      for (const userDoc of usersToMigrate) {
        try {
          const userData = userDoc.data();
          const location = userData.location;
          
          if (location && location.latitude && location.longitude) {
            // Add geohash to existing coordinate data
            const geohash = this.googleMapsService.generateGeohash(
              location.latitude,
              location.longitude
            );

            // If missing address components, try to get them
            let updatedLocation = { ...location, geohash };
            
            if (!location.city || !location.country) {
              const addressComponents = await this.googleMapsService.coordinatesToAddress(
                location.latitude,
                location.longitude
              );

              if (addressComponents) {
                updatedLocation = {
                  ...updatedLocation,
                  address: addressComponents.formattedAddress || location.address,
                  city: addressComponents.city || location.city,
                  state: addressComponents.state || location.state,
                  country: addressComponents.country || location.country,
                  countryCode: addressComponents.countryCode || location.countryCode
                };
              }
            }

            // Update the user with enhanced location data
            await updateDoc(doc(this.firestore, 'users', userDoc.id), {
              location: updatedLocation,
              updatedAt: new Date().toISOString()
            });

            console.log(`Migrated user ${userDoc.id} location data`);
          }
          
          progress.processed++;
        } catch (error) {
          console.error(`Error migrating user ${userDoc.id}:`, error);
          progress.errors++;
          progress.processed++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1100));
      }

      progress.completed = true;
      return progress;
    } catch (error) {
      console.error('Error during user migration:', error);
      throw error;
    }
  }

  async runFullMigration(): Promise<{ projects: MigrationProgress; users: MigrationProgress }> {
    console.log('Starting full migration to coordinate-based location system...');
    
    const projectsMigration = await this.migrateProjectsToCoordinates();
    console.log('Projects migration completed:', projectsMigration);
    
    const usersMigration = await this.migrateUsersToCoordinates();
    console.log('Users migration completed:', usersMigration);
    
    return {
      projects: projectsMigration,
      users: usersMigration
    };
  }

  async checkMigrationStatus(): Promise<{
    projectsNeedMigration: number;
    usersNeedMigration: number;
  }> {
    try {
      // Check projects
      const projectsCollection = collection(this.firestore, 'projects');
      const projectsSnapshot = await getDocs(projectsCollection);
      const projectsNeedMigration = projectsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.scope?.place && !data.scope?.location;
      }).length;

      // Check users
      const usersCollection = collection(this.firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersNeedMigration = usersSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.location && !data.location.geohash;
      }).length;

      return {
        projectsNeedMigration,
        usersNeedMigration
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      throw error;
    }
  }
}
