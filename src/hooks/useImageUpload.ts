import { useState, useCallback } from 'react';
import { StorageService, UploadedImage, UploadProgress } from '../lib/storage';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UseImageUploadReturn {
  // State
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadedImages: UploadedImage[];

  // Actions
  uploadImage: (file: File) => Promise<UploadedImage | null>;
  uploadImages: (files: File[]) => Promise<UploadedImage[]>;
  deleteImage: (filename: string) => Promise<boolean>;
  compressAndUpload: (file: File) => Promise<UploadedImage | null>;
  clearUploads: () => void;

  // Utilities
  getOptimizedUrl: (
    filename: string,
    options?: { width?: number; height?: number; quality?: number }
  ) => string;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const handleProgress = useCallback((progressInfo: UploadProgress) => {
    setProgress(progressInfo.progress);
    setUploading(progressInfo.isUploading);
    if (progressInfo.error) {
      setError(progressInfo.error);
    }
  }, []);

  const uploadImage = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      if (!user) {
        setError('User not authenticated');
        toast.error('Please log in to upload images');
        return null;
      }

      setError(null);
      setUploading(true);

      try {
        const { data, error: uploadError } = await StorageService.uploadImage(
          file,
          user.id,
          handleProgress
        );

        if (uploadError) {
          setError(uploadError);
          toast.error(`Upload failed: ${uploadError}`);
          return null;
        }

        if (data) {
          setUploadedImages(prev => [...prev, data]);
          toast.success(`${file.name} uploaded successfully`);
          return data;
        }

        return null;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, handleProgress]
  );

  const uploadImages = useCallback(
    async (files: File[]): Promise<UploadedImage[]> => {
      if (!user) {
        setError('User not authenticated');
        toast.error('Please log in to upload images');
        return [];
      }

      setError(null);
      setUploading(true);

      try {
        const { data, errors } = await StorageService.uploadImages(files, user.id, handleProgress);

        if (errors.length > 0) {
          const errorMsg = `${errors.length} upload(s) failed: ${errors.join(', ')}`;
          setError(errorMsg);
          toast.error(errorMsg);
        }

        if (data.length > 0) {
          setUploadedImages(prev => [...prev, ...data]);
          toast.success(`${data.length} image(s) uploaded successfully`);
        }

        return data;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        toast.error(errorMessage);
        return [];
      } finally {
        setUploading(false);
      }
    },
    [user, handleProgress]
  );

  const deleteImage = useCallback(async (filename: string): Promise<boolean> => {
    try {
      const { success, error: deleteError } = await StorageService.deleteImage(filename);

      if (deleteError) {
        setError(deleteError);
        toast.error(`Delete failed: ${deleteError}`);
        return false;
      }

      if (success) {
        setUploadedImages(prev => prev.filter(img => !img.url.includes(filename)));
        toast.success('Image deleted successfully');
        return true;
      }

      return false;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const compressAndUpload = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      if (!user) {
        setError('User not authenticated');
        toast.error('Please log in to upload images');
        return null;
      }

      setError(null);
      setUploading(true);

      try {
        // First compress the image
        toast.info('Compressing image...');
        const compressedFile = await StorageService.compressImage(file);

        // Then upload
        const { data, error: uploadError } = await StorageService.uploadImage(
          compressedFile,
          user.id,
          handleProgress
        );

        if (uploadError) {
          setError(uploadError);
          toast.error(`Upload failed: ${uploadError}`);
          return null;
        }

        if (data) {
          setUploadedImages(prev => [...prev, data]);
          toast.success(`${file.name} compressed and uploaded successfully`);
          return data;
        }

        return null;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, handleProgress]
  );

  const clearUploads = useCallback(() => {
    setUploadedImages([]);
    setError(null);
    setProgress(0);
  }, []);

  const getOptimizedUrl = useCallback(
    (
      filename: string,
      options?: {
        width?: number;
        height?: number;
        quality?: number;
      }
    ) => {
      return StorageService.getOptimizedImageUrl(filename, options);
    },
    []
  );

  return {
    // State
    uploading,
    progress,
    error,
    uploadedImages,

    // Actions
    uploadImage,
    uploadImages,
    deleteImage,
    compressAndUpload,
    clearUploads,

    // Utilities
    getOptimizedUrl,
  };
};
