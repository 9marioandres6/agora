import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController, AlertController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProjectsService } from '../services/projects.service';
import { Project } from '../services/models/project.models';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-public-inner-project',
  templateUrl: './public-inner-project.component.html',
  styleUrls: ['./public-inner-project.component.scss'],
  imports: [CommonModule, IonicModule, TranslateModule, FormsModule]
})
export class PublicInnerProjectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectsService = inject(ProjectsService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private translateService = inject(TranslateService);
  private authService = inject(AuthService);
  
  projectId = this.route.snapshot.paramMap.get('id');
  project = signal<Project | null>(null);
  isLoading = signal(true);
  collaborationMessage = '';
  
  ngOnInit() {
    if (this.projectId) {
      this.loadProject();
    }
  }
  
  async loadProject() {
    try {
      this.isLoading.set(true);
      const projectData = await this.projectsService.getProject(this.projectId!);
      this.project.set(projectData);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  getScopeIcon(scope: string): string {
    const scopeIcons: { [key: string]: string } = {
      'grupal': 'people',
      'local': 'home',
      'state': 'business',
      'national': 'flag',
      'global': 'globe'
    };
    return scopeIcons[scope] || 'help-circle';
  }
  
  getStateColor(state: string): string {
    const stateColors: { [key: string]: string } = {
      'building': 'warning',
      'implementing': 'primary',
      'done': 'success'
    };
    return stateColors[state] || 'medium';
  }
  
  getStateLabel(state: string): string {
    const stateLabels: { [key: string]: string } = {
      'building': 'HOME.STATE_BUILDING',
      'implementing': 'HOME.STATE_IMPLEMENTING',
      'done': 'HOME.STATE_DONE'
    };
    return stateLabels[state] || 'HOME.STATE_BUILDING';
  }

  async showCollaborationModal() {
    const currentUser = this.authService.user();
    if (!currentUser?.uid) {
      await this.showToast(this.translateService.instant('AUTH.AUTH_REQUIRED'), 'warning');
      return;
    }

    const currentProject = this.project();
    if (!currentProject) return;

    // Check if user is already a collaborator or has a pending request
    if (this.isUserCollaborator(currentProject) || this.hasCollaborationRequest(currentProject)) {
      await this.showToast(this.translateService.instant('HOME.ALREADY_COLLABORATING'), 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: this.translateService.instant('HOME.REQUEST_COLLABORATION'),
      message: this.translateService.instant('HOME.COLLABORATION_MESSAGE_PLACEHOLDER'),
      inputs: [
        {
          name: 'message',
          type: 'textarea',
          placeholder: this.translateService.instant('HOME.COLLABORATION_MESSAGE_PLACEHOLDER'),
          value: this.collaborationMessage
        }
      ],
      buttons: [
        {
          text: this.translateService.instant('COMMON.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translateService.instant('COMMON.SUBMIT'),
          handler: (data: any) => {
            this.requestCollaboration(data.message);
          }
        }
      ]
    });

    await alert.present();
  }

  private isUserCollaborator(project: Project): boolean {
    const currentUser = this.authService.user();
    if (!currentUser?.uid) return false;
    return project.collaborators?.some(c => c.uid === currentUser.uid) || false;
  }

  private hasCollaborationRequest(project: Project): boolean {
    const currentUser = this.authService.user();
    if (!currentUser?.uid) return false;
    return project.collaborationRequests?.some(req => req.uid === currentUser.uid) || false;
  }

  private async requestCollaboration(message: string) {
    try {
      if (!this.projectId) return;

      await this.projectsService.requestCollaboration(this.projectId, message);
      this.collaborationMessage = '';
      
      await this.showToast(
        this.translateService.instant('HOME.COLLABORATION_REQUEST_SENT'),
        'success'
      );
    } catch (error) {
      console.error('Error requesting collaboration:', error);
      await this.showToast(
        this.translateService.instant('HOME.ERROR_SENDING_COLLABORATION_REQUEST'),
        'danger'
      );
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
