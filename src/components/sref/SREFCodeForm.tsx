import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Plus, Save, Image as _ImageIcon, Tag, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useSREFCodes } from '@/hooks/useSREFCodes';
import { useAuth } from '@/contexts/AuthContext';
import { useImageUpload } from '@/hooks/useImageUpload';

interface SREFCodeFormProps {
  editingCode?: {
    id: string;
    title: string;
    code_value: string;
    description?: string;
    version: 'SV4' | 'SV6';
    tags: string[];
    images?: string[];
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SREFCodeForm({ editingCode, onSuccess, onCancel }: SREFCodeFormProps) {
  const { user } = useAuth();
  const { createSREFCode, updateSREFCode } = useSREFCodes();
  const { uploadImages, uploading: imageUploading, progress: uploadProgress } = useImageUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Original state for change detection (only for editing)
  const originalState = useRef(editingCode ? {
    title: editingCode.title,
    code_value: editingCode.code_value,
    version: editingCode.version,
    tags: [...editingCode.tags],
    images: [...(editingCode.images || [])]
  } : null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: editingCode?.title || '',
    code_value: editingCode?.code_value || '',
    version: editingCode?.version || 'SV6' as const,
    tags: editingCode?.tags || [],
    images: editingCode?.images || []
  });
  
  const [newTag, setNewTag] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(editingCode?.images || []);

  // Change detection functions
  const hasTextFieldsChanged = () => {
    if (!originalState.current) return true; // New creation - always include
    return (
      formData.title !== originalState.current.title ||
      formData.code_value !== originalState.current.code_value ||
      formData.version !== originalState.current.version
    );
  };

  const hasTagsChanged = () => {
    if (!originalState.current) return true; // New creation - always include
    const original = originalState.current.tags.slice().sort();
    const current = formData.tags.slice().sort();
    return original.length !== current.length || 
           !original.every((tag, index) => tag === current[index]);
  };

  const hasImagesChanged = () => {
    if (!originalState.current) return true; // New creation - always include
    
    // Get current image URLs (existing images from formData.images, not imagePreviews)
    const currentImageUrls = formData.images;
    const originalImages = originalState.current.images;
    
    // Check if we have new files or if existing images changed
    const hasNewFiles = imageFiles.length > 0;
    const quantityChanged = currentImageUrls.length !== originalImages.length;
    const contentChanged = !currentImageUrls.every((url, index) => url === originalImages[index]);
    
    console.log('🔍 Image change analysis:', {
      hasNewFiles,
      quantityChanged,
      contentChanged,
      originalCount: originalImages.length,
      currentCount: currentImageUrls.length,
      newFilesCount: imageFiles.length
    });
    
    return hasNewFiles || quantityChanged || contentChanged;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length + imagePreviews.length > 6) {
      toast.error('Maximum 6 images allowed');
      return;
    }

    setImageFiles(prev => [...prev, ...files]);
    
    // Create previews for new files
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    // Remove from previews
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    
    // Determine if this is an existing image or a new file
    if (index < (originalState.current?.images.length || 0)) {
      // Removing existing image - update formData.images to track what's been removed
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
      console.log('🗑️ Removed existing image at index:', index);
    } else {
      // Removing new file
      const fileIndex = index - (originalState.current?.images.length || 0);
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
      console.log('🗑️ Removed new file at index:', fileIndex);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!formData.code_value.trim()) {
      toast.error('SREF code is required');
      return false;
    }
    if (!formData.code_value.includes('--sref')) {
      toast.error('SREF code must include "--sref"');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to save SREF codes');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    
    let uploadedImageUrls: string[] = [];
    
    try {
      console.log('Starting form submission...');
      console.log('User ID:', user.id);
      console.log('Form data:', formData);
      console.log('Image files:', imageFiles);
      
      // Upload new images if any
      if (imageFiles.length > 0) {
        toast.info('Uploading images...');
        console.log('Uploading images...');
        const uploadedImages = await uploadImages(imageFiles);
        uploadedImageUrls = uploadedImages.map(img => img.url);
        console.log('Uploaded image URLs:', uploadedImageUrls);
      }
      
      // Determine what fields have actually changed
      const textFieldsChanged = hasTextFieldsChanged();
      const tagsChanged = hasTagsChanged();
      const imagesChanged = hasImagesChanged();
      
      console.log('🔍 Change detection results:', {
        textFieldsChanged,
        tagsChanged,
        imagesChanged,
        isNewCreation: !editingCode
      });
      
      // Build selective update payload - only include changed fields
      const srefData: any = {
        user_id: user.id // Always include user_id
      };
      
      // Only include text fields if they changed
      if (textFieldsChanged) {
        srefData.title = formData.title.trim();
        srefData.code_value = formData.code_value.trim();
        srefData.sv_version = formData.version === 'SV6' ? 6 : 4;
        console.log('📝 Including text fields in update');
      }
      
      // Only include tags if they changed
      if (tagsChanged) {
        // TODO: Implement tag diffing for granular updates
        // Current approach: Replace all tags (inefficient)
        // Tomorrow: Compare original vs current tags, only add/remove changed ones
        // Example: original: ['tag1', 'tag2', 'tag3'], current: ['tag1', 'tag3', 'tag4']
        // Should: DELETE 'tag2', INSERT 'tag4', leave 'tag1' and 'tag3' untouched
        srefData.tags = formData.tags;
        console.log('🏷️ Including tags in update:', formData.tags);
      }
      
      // Only include images if they changed
      if (imagesChanged) {
        // TODO: CRITICAL - Implement UUID-based image diffing for granular updates
        // CURRENT PROBLEM: Still using "delete all, re-insert all" approach in backend
        // This causes duplication when delete fails (returns count 0)
        // 
        // TOMORROW'S FIX:
        // 1. Compare originalState.current.images vs formData.images by UUID/URL
        // 2. Identify specifically removed images: send { imagesToDelete: [uuid1, uuid2] }
        // 3. Identify specifically added images: send { imagesToAdd: [newUrl1, newUrl2] }
        // 4. Backend should delete only specific UUIDs, insert only new images
        // 5. Leave unchanged images completely untouched
        //
        // Example: original: [img1, img2, img3], current: [img1, img3, img4]
        // Should: DELETE img2, INSERT img4, leave img1 and img3 untouched
        // Result: 3 images total (not 5!)
        
        const allImageUrls = [...formData.images, ...uploadedImageUrls];
        srefData.images = allImageUrls;
        console.log('📸 Including images in update:', allImageUrls);
        console.log('📸 Current formData.images:', formData.images);
        console.log('📸 New uploaded images:', uploadedImageUrls);
      }
      
      console.log('SREF data to submit:', srefData);

      if (editingCode) {
        const result = await updateSREFCode(editingCode.id, srefData);
        if (!result.success) {
          console.error('Update SREF code error:', result.error);
          throw new Error(result.error);
        }
        toast.success('SREF code updated successfully!');
      } else {
        const result = await createSREFCode(srefData);
        if (!result.success) {
          console.error('Create SREF code error:', result.error);
          throw new Error(result.error);
        }
        toast.success('SREF code created successfully!');
      }
      
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to ${editingCode ? 'update' : 'create'} SREF code: ${errorMessage}`);
      
      // Clean up uploaded images on error (only for new uploads, not existing ones)
      if (uploadedImageUrls.length > 0) {
        console.log('Cleaning up uploaded images due to error...');
        uploadedImageUrls.forEach(async (url: string) => {
          const filename = url.split('/').pop();
          if (filename) {
            // Note: This is a best-effort cleanup, errors here won't be shown to user
            console.log('Attempting to cleanup image:', filename);
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {editingCode ? 'Edit SREF Code' : 'Create New SREF Code'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title and Version Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., 90's comic book style"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version *</Label>
                <Select value={formData.version} onValueChange={(value: 'SV4' | 'SV6') => handleInputChange('version', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SV6">SV6</SelectItem>
                    <SelectItem value="SV4">SV4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SREF Code */}
            <div className="space-y-2">
              <Label htmlFor="code_value">SREF Code *</Label>
              <Input
                id="code_value"
                value={formData.code_value}
                onChange={(e) => handleInputChange('code_value', e.target.value)}
                placeholder="--sref 1234567890"
                className="font-mono"
                required
              />
            </div>


            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Reference Images</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-2"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to upload (max 6 images)
                </p>
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <AnimatePresence>
                    {imagePreviews.map((preview, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group aspect-square"
                      >
                        <img
                          src={preview}
                          alt={`${formData.title || 'SREF'} reference image ${index + 1} of ${imagePreviews.length}`}
                          className="w-full h-full object-cover rounded-md"
                          loading="lazy"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting || imageUploading}>
                <Save className="h-4 w-4 mr-2" />
                {imageUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 
                 isSubmitting ? 'Saving...' : 
                 editingCode ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}