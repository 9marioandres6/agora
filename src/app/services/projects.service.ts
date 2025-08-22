import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, getDocs, DocumentData, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

export interface Project {
  id?: string;
  title: string;
  description: string;
  needs: string[];
  scope: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  status?: 'active' | 'completed' | 'cancelled';
  participants?: string[];
  tags?: string[];
  creator?: {
    uid: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private get projectsCollection() {
    return collection(this.firestore, 'projects');
  }

  async createProject(projectData: Omit<Project, 'id' | 'createdAt'>): Promise<string> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const project: Omit<Project, 'id'> = {
        ...projectData,
        createdAt: new Date().toISOString(),
        status: 'active',
        participants: [projectData.createdBy],
        tags: this.generateTags(projectData.title, projectData.description, projectData.needs),
        creator: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Anonymous',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || ''
        }
      };
      
      const docRef = await addDoc(this.projectsCollection, project);
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async getProjects(limitCount: number = 50): Promise<Project[]> {
    try {
      const q = query(
        this.projectsCollection,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Ensure all projects have creator info
      return projects.map(project => {
        if (!project.creator) {
          project.creator = {
            uid: project.createdBy,
            displayName: 'Anonymous',
            email: '',
            photoURL: ''
          };
        }
        // Ensure photoURL is always available
        if (!project.creator.photoURL) {
          project.creator.photoURL = '';
        }
        return project;
      });
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    try {
      const q = query(
        this.projectsCollection,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  }

  async getProjectsByScope(scope: string): Promise<Project[]> {
    try {
      const q = query(
        this.projectsCollection,
        where('scope', '==', scope),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
    } catch (error) {
      console.error('Error getting projects by scope:', error);
      throw error;
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  async joinProject(projectId: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        participants: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error joining project:', error);
      throw error;
    }
  }

  async leaveProject(projectId: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        participants: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error leaving project:', error);
      throw error;
    }
  }

  private generateTags(title: string, description: string, needs: string[]): string[] {
    const allText = `${title} ${description} ${needs.join(' ')}`.toLowerCase();
    const words = allText.split(/\s+/).filter(word => word.length > 3);
    const tagCount: { [key: string]: number } = {};
    
    words.forEach(word => {
      tagCount[word] = (tagCount[word] || 0) + 1;
    });
    
    return Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }
}
