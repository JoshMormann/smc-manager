import { supabase } from '../lib/supabase';
import { STORAGE_CONFIG } from '../config/storage';

/**
 * Storage diagnostics utility to check bucket setup
 */
export class StorageDiagnostics {
  /**
   * Check if the configured bucket exists and is accessible
   */
  static async checkBucketAccess(): Promise<{
    exists: boolean;
    isPublic: boolean;
    error?: string;
    bucketName: string;
  }> {
    try {
      // List all buckets to see what's available
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        return {
          exists: false,
          isPublic: false,
          error: `Failed to list buckets: ${listError.message}`,
          bucketName: STORAGE_CONFIG.bucketName,
        };
      }

      console.log(
        'Available buckets:',
        buckets?.map(b => b.name)
      );

      // Check if our configured bucket exists
      const bucket = buckets?.find(b => b.name === STORAGE_CONFIG.bucketName);

      if (!bucket) {
        const availableBuckets = buckets?.map(b => b.name).join(', ') || 'none';
        return {
          exists: false,
          isPublic: false,
          error: `Bucket '${STORAGE_CONFIG.bucketName}' not found. Available buckets: ${availableBuckets}`,
          bucketName: STORAGE_CONFIG.bucketName,
        };
      }

      return {
        exists: true,
        isPublic: bucket.public || false,
        bucketName: STORAGE_CONFIG.bucketName,
      };
    } catch (error: unknown) {
      return {
        exists: false,
        isPublic: false,
        error: `Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        bucketName: STORAGE_CONFIG.bucketName,
      };
    }
  }

  /**
   * Test file upload to check permissions
   */
  static async testUpload(userId: string): Promise<{
    success: boolean;
    error?: string;
    uploadPath?: string;
  }> {
    try {
      // Create a small test file
      const testContent = 'test-upload-' + Date.now();
      const testFile = new Blob([testContent], { type: 'text/plain' });
      const testFileName = `${userId}/test-${Date.now()}.txt`;

      const { data: _data, error } = await supabase.storage
        .from(STORAGE_CONFIG.bucketName)
        .upload(testFileName, testFile);

      if (error) {
        return {
          success: false,
          error: `Upload test failed: ${error.message}`,
        };
      }

      // Clean up test file
      await supabase.storage.from(STORAGE_CONFIG.bucketName).remove([testFileName]);

      return {
        success: true,
        uploadPath: testFileName,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: `Upload test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get comprehensive storage status
   */
  static async getStorageStatus(userId?: string): Promise<{
    bucket: Awaited<ReturnType<typeof StorageDiagnostics.checkBucketAccess>>;
    upload?: Awaited<ReturnType<typeof StorageDiagnostics.testUpload>>;
    recommendations: string[];
  }> {
    const bucket = await this.checkBucketAccess();
    const recommendations: string[] = [];

    if (!bucket.exists) {
      recommendations.push('Create a storage bucket named "' + STORAGE_CONFIG.bucketName + '"');
      recommendations.push('Or update the bucket name in src/config/storage.ts');
    }

    if (bucket.exists && !bucket.isPublic) {
      recommendations.push('Enable public access on your bucket for image viewing');
    }

    let upload;
    if (bucket.exists && userId) {
      upload = await this.testUpload(userId);
      if (!upload.success) {
        recommendations.push('Check bucket policies - users need INSERT permission');
        recommendations.push('Ensure RLS policies allow authenticated users to upload');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Storage appears to be configured correctly!');
    }

    return {
      bucket,
      upload,
      recommendations,
    };
  }
}
