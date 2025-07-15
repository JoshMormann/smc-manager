# Supabase Storage Setup Instructions

## Prerequisites
You need to have a Supabase project set up with the database tables already created.

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create Bucket**
4. Enter bucket name: `sref-images` (or update `src/config/storage.ts` if using a different name)
5. Make sure **Public bucket** is **checked** (for public image access)
6. Click **Create bucket**

## Step 2: Set up Bucket Policies

Go to **Storage** → **Policies** and create the following policies:

### Policy 1: Allow authenticated users to upload images
```sql
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'sref-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Policy 2: Allow public read access to images
```sql
CREATE POLICY "Allow public read access to images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'sref-images');
```

### Policy 3: Allow users to delete their own images
```sql
CREATE POLICY "Allow users to delete their own images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'sref-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 3: Update Configuration

If you used a different bucket name, update `src/config/storage.ts`:

```typescript
export const STORAGE_CONFIG = {
  bucketName: 'your-bucket-name', // Update this
  // ... rest of config
};
```

## Step 4: Test the Setup

1. Run your application
2. Log in with a user account
3. Try creating a new SREF code with image uploads
4. Check that images appear in your Supabase Storage bucket

## File Organization

Images will be stored with the following structure:
```
sref-images/
├── user-id-1/
│   ├── timestamp_random.jpg
│   ├── timestamp_random.png
│   └── ...
├── user-id-2/
│   ├── timestamp_random.jpg
│   └── ...
└── ...
```

## Troubleshooting

### Images not uploading
- Check that the bucket name matches your configuration
- Verify that the upload policies are correctly set
- Check the browser console for error messages

### Images not displaying
- Ensure the public read policy is enabled
- Check that the bucket is marked as public
- Verify the image URLs are correct

### Permission errors
- Make sure users are authenticated
- Check that the policies include the correct user ID checks
- Verify the bucket policies are enabled

## Configuration Options

You can customize the storage behavior in `src/config/storage.ts`:

- `maxFileSize`: Maximum file size (default: 5MB)
- `maxFiles`: Maximum files per SREF code (default: 6)
- `allowedTypes`: Allowed file types
- `compression.quality`: Image compression quality (0.1-1.0)
- `compression.maxWidth/maxHeight`: Maximum image dimensions
