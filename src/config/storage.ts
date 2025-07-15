// Storage Configuration
// Update these values to match your Supabase project setup

export const STORAGE_CONFIG = {
  // Your actual bucket name from Supabase project
  bucketName: 'code images',
  
  // File upload limits
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 6, // Maximum files per SREF code
  
  // Allowed image types
  allowedTypes: [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif'
  ],
  
  // Image compression settings
  compression: {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080
  },
  
  // Cache settings
  cacheControl: '3600' // 1 hour
};

// Quick setup instructions:
// 1. Create a storage bucket in your Supabase project
// 2. Update the bucketName above
// 3. Set up bucket policies (see README for details)
// 4. Make sure your bucket allows public read access for images