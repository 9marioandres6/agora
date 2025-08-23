import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { ProjectsService } from '../services/projects.service';
import { ScopeSelectorModalComponent } from '../scope-selector-modal/scope-selector-modal.component';

interface ScopeOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-new-item',
  templateUrl: './new-item.component.html',
  styleUrls: ['./new-item.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule]
})
export class NewItemComponent {
  private authService = inject(AuthService);
  private navCtrl = inject(NavController);
  private themeService = inject(ThemeService);
  private projectsService = inject(ProjectsService);
  private modalCtrl = inject(ModalController);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  isDark = signal(this.themeService.isDarkMode());

  title = '';
  description = '';
  needs: string[] = [];
  scope = '';
  newNeed = '';
  isSaving = false;

  scopeOptions: ScopeOption[] = [
    { value: 'grupal', label: 'Grupal - Small Group Collaboration', icon: 'people' },
    { value: 'local', label: 'Local - Neighbourhood/Community', icon: 'home' },
    { value: 'state', label: 'State - State/Province level', icon: 'business' },
    { value: 'national', label: 'National - Country level', icon: 'flag' },
    { value: 'global', label: 'Global - International level', icon: 'globe' }
  ];

  addNeed() {
    if (this.newNeed.trim() && !this.needs.includes(this.newNeed.trim())) {
      this.needs.push(this.newNeed.trim());
      this.newNeed = '';
    }
  }

  removeNeed(need: string) {
    this.needs = this.needs.filter(n => n !== need);
  }

  getScopeIcon(scope: string): string {
    const scopeOption = this.scopeOptions.find(option => option.value === scope);
    return scopeOption ? scopeOption.icon : 'help-circle';
  }

  getScopeLabel(scope: string): string {
    const scopeOption = this.scopeOptions.find(option => option.value === scope);
    return scopeOption ? scopeOption.value : scope;
  }

  async openScopeModal() {
    const modal = await this.modalCtrl.create({
      component: ScopeSelectorModalComponent,
      componentProps: {
        scopeOptions: this.scopeOptions,
        selectedScope: this.scope
      },
      cssClass: 'scope-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.selectedScope) {
        this.scope = result.data.selectedScope;
      }
    });

    await modal.present();
  }

  async saveItem() {
    if (!this.title.trim() || !this.description.trim() || !this.scope) {
      return;
    }

    try {
      this.isSaving = true;
      const currentUser = this.user();
      if (!currentUser?.uid) {
        console.error('User not authenticated');
        return;
      }

      const projectData = {
        title: this.title.trim(),
        description: this.description.trim(),
        needs: this.needs,
        scope: this.scope,
        createdBy: currentUser.uid,
        collaborators: [],
        collaborationRequests: []
      };

      const projectId = await this.projectsService.createProject(projectData);

      this.navCtrl.back();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      this.isSaving = false;
    }
  }

  goBack(): void {
    this.navCtrl.back();
  }
}
