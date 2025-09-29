import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { StorageFile } from './models/supabase.models';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Use minimal configuration to avoid NavigatorLockAcquireTimeoutError
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            'X-Client-Info': 'agora-app'
          }
        }
      }
    );
  }


  async uploadFile(
    file: File, 
    bucket: string = 'agora-project', 
    folder: string = 'sections'
  ): Promise<{ path: string; url: string } | null> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${folder}/${timestamp}_${randomId}.${fileExtension}`;

      // Upload file to Supabase storage
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        path: fileName,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('Error in uploadFile:', error);
      return null;
    }
  }

  async deleteFile(path: string, bucket: string = 'agora-project'): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Error deleting file:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteFile:', error);
      return false;
    }
  }

  async listFiles(bucket: string = 'agora-project', folder: string = 'sections'): Promise<StorageFile[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(folder);

      if (error) {
        console.error('Error listing files:', error);
        return [];
      }

      return data.map(file => ({
        id: file.id,
        name: file.name,
        url: `${environment.supabase.url}/storage/v1/object/public/${bucket}/${folder}/${file.name}`,
        size: file.metadata?.['size'] || 0,
        type: file.metadata?.['mimetype'] || 'unknown',
        created_at: file.created_at
      }));
    } catch (error) {
      console.error('Error in listFiles:', error);
      return [];
    }
  }

  getPublicUrl(path: string, bucket: string = 'agora-project'): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  async getSectionFiles(sectionId: string, bucket: string = 'agora-project'): Promise<StorageFile[]> {
    return this.listFiles(bucket, `sections/${sectionId}`);
  }

  async deleteSectionFiles(sectionId: string, bucket: string = 'agora-project'): Promise<boolean> {
    try {
      const files = await this.getSectionFiles(sectionId, bucket);
      if (files.length === 0) return true;

      const paths = files.map(file => file.name);
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        console.error('Error deleting section files:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSectionFiles:', error);
      return false;
    }
  }

  async createBucket(bucketName: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createBucket:', error);
      return false;
    }
  }
}
