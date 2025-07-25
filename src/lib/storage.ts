import { supabase } from './supabase';
import { captureException } from './sentry';
import { STORAGE_CONFIG } from '../config/storage';

export interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
}

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error?: string;
}

export class StorageService {
  /**
   * Upload a single image file to Supabase Storage
   */
  static async uploadImage(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ data: UploadedImage | null; error: string | null }> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { data: null, error: validation.error || 'Validation failed' };
      }

      onProgress?.({ progress: 0, isUploading: true });

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const filename = `${userId}/${timestamp}_${randomString}.${fileExt}`;

      onProgress?.({ progress: 25, isUploading: true });

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_CONFIG.bucketName)
        .upload(filename, file, {
          cacheControl: STORAGE_CONFIG.cacheControl,
          upsert: false,
        });

      if (uploadError) {
        captureException(uploadError, {
          tags: { operation: 'upload_image' },
          extra: { filename, fileSize: file.size },
        });
        return { data: null, error: `Upload failed: ${uploadError.message}` };
      }

      onProgress?.({ progress: 75, isUploading: true });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_CONFIG.bucketName)
        .getPublicUrl(filename);

      onProgress?.({ progress: 100, isUploading: false });

      return {
        data: {
          id: uploadData.id || filename,
          url: urlData.publicUrl,
          filename: file.name,
          size: file.size,
          type: file.type,
        },
        error: null,
      };
    } catch (error: unknown) {
      captureException(error, {
        tags: { operation: 'upload_image' },
        extra: { filename: file.name, fileSize: file.size },
      });
      onProgress?.({
        progress: 0,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        data: null,
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadImages(
    files: File[],
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ data: UploadedImage[]; errors: string[] }> {
    const results: UploadedImage[] = [];
    const errors: string[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const baseProgress = (i / totalFiles) * 100;
      const fileProgress = (progress: UploadProgress) => {
        const totalProgress = baseProgress + progress.progress / totalFiles;
        onProgress?.({
          progress: totalProgress,
          isUploading: progress.isUploading,
          error: progress.error,
        });
      };

      const { data, error } = await this.uploadImage(file, userId, fileProgress);

      if (data) {
        results.push(data);
      } else {
        errors.push(error || `Failed to upload ${file.name}`);
      }
    }

    return { data: results, errors };
  }

  /**
   * Delete an image from storage
   */
  static async deleteImage(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage.from(STORAGE_CONFIG.bucketName).remove([filename]);

      if (error) {
        captureException(error, {
          tags: { operation: 'delete_image' },
          extra: { filename },
        });
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      return { success: true };
    } catch (error: unknown) {
      captureException(error, {
        tags: { operation: 'delete_image' },
        extra: { filename },
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedImageUrl(
    filename: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): string {
    const { data } = supabase.storage.from(STORAGE_CONFIG.bucketName).getPublicUrl(filename, {
      transform: {
        width: options.width,
        height: options.height,
        quality: options.quality || STORAGE_CONFIG.compression.quality,
      },
    });

    return data.publicUrl;
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > STORAGE_CONFIG.maxFileSize) {
      const maxSizeMB = STORAGE_CONFIG.maxFileSize / (1024 * 1024);
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }

    // Check file type
    if (!STORAGE_CONFIG.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not supported. Allowed types: ${STORAGE_CONFIG.allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Compress image before upload (optional)
   */
  static async compressImage(
    file: File,
    quality: number = STORAGE_CONFIG.compression.quality
  ): Promise<File> {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = STORAGE_CONFIG.compression.maxWidth;
        const maxHeight = STORAGE_CONFIG.compression.maxHeight;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Return original if compression fails
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Update storage configuration
   */
  static updateConfig(config: Partial<typeof STORAGE_CONFIG>) {
    Object.assign(STORAGE_CONFIG, config);
  }

  /**
   * Get current storage configuration
   */
  static getConfig() {
    return { ...STORAGE_CONFIG };
  }
}
