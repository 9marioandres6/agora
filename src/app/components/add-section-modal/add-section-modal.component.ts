import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Chapter, Media } from '../../services/projects.service';

@Component({
  selector: 'app-add-section-modal',
  templateUrl: './add-section-modal.component.html',
  styleUrls: ['./add-section-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, FormsModule]
})
export class AddSectionModalComponent {
  private modalCtrl = inject(ModalController);
  
  section: Partial<Chapter> = {
    title: '',
    description: '',
    media: []
  };
  
  newMedia: Partial<Media> = {
    type: 'image',
    url: '',
    caption: ''
  };
  
  isAddingMedia = false;
  
  addMedia() {
    if (this.newMedia.url && this.newMedia.caption) {
      const media: Media = {
        id: Date.now().toString(),
        type: this.newMedia.type as 'image' | 'video',
        url: this.newMedia.url,
        caption: this.newMedia.caption
      };
      
      this.section.media = [...(this.section.media || []), media];
      
      // Reset form
      this.newMedia = {
        type: 'image',
        url: '',
        caption: ''
      };
      this.isAddingMedia = false;
    }
  }
  
  removeMedia(mediaId: string) {
    this.section.media = (this.section.media || []).filter(m => m.id !== mediaId);
  }
  
  cancel() {
    this.modalCtrl.dismiss();
  }
  
  confirm() {
    if (this.section.description?.trim()) {
      const newSection: Chapter = {
        id: Date.now().toString(),
        title: this.section.title?.trim() || '',
        description: this.section.description.trim(),
        media: this.section.media || []
      };
      
      this.modalCtrl.dismiss(newSection);
    }
  }
}

