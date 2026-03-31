import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  private async uploadToStorage(bucket: string, prefix: string, files: Express.Multer.File[]): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.originalname.split('.').pop();
      const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
      if (error) throw new InternalServerErrorException(`Upload failed: ${error.message}`);
      const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    return this.uploadToStorage('property-images', 'properties', files);
  }

  async uploadDocuments(files: Express.Multer.File[]): Promise<string[]> {
    return this.uploadToStorage('property-images', 'documents', files);
  }
}
