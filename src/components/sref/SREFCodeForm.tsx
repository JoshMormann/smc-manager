import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Plus, Save, Image as _ImageIcon, Tag, Code } from 'lucide-react';
import equal from 'fast-deep-equal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { srefCodeSchema, type SREFFormData } from '@/schemas/srefValidation';
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
import { useTags } from '@/hooks/useTags';

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
  const { tags: availableTags } = useTags();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // React Hook Form with Zod validation
  const form = useForm<SREFFormData>({
    resolver: zodResolver(srefCodeSchema),
    defaultValues: {
      title: editingCode?.title || '',
      code_value: editingCode?.code_value || '',
      version: editingCode?.version || 'SV6',
      tags: editingCode?.tags || [],
      images: editingCode?.images || []
    }
  });
  
  const formData = form.watch();
  
  // Original state for change detection (only for editing)
  const originalState = useRef(editingCode ? {
    title: editingCode.title,
    code_value: editingCode.code_value,
    version: editingCode.version,
    tags: [...editingCode.tags],
    images: [...(editingCode.images || [])]
  } : null);
  
  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(editingCode?.images || []);

  // Change detection functions using fast-deep-equal (10-100x faster than manual comparison)
  const hasTextFieldsChanged = () => {
    if (!originalState.current) return true; // New creation - always include
    
    const originalText = {
      title: originalState.current.title,
      code_value: originalState.current.code_value,
      version: originalState.current.version
    };
    
    const currentText = {
      title: formData.title,
      code_value: formData.code_value,
      version: formData.version
    };
    
    return !equal(originalText, currentText);
  };

  const hasTagsChanged = () => {
    if (!originalState.current) return true; // New creation - always include
    
    // Sort both arrays for consistent comparison
    const originalTags = [...originalState.current.tags].sort();
    const currentTags = [...formData.tags].sort();
    
    return !equal(originalTags, currentTags);
  };

  const hasImagesChanged = () => {
    if (!originalState.current) return true; // New creation - always include
    
    const originalImages = originalState.current.images;
    const currentImages = formData.images;
    const hasNewFiles = imageFiles.length > 0;
    
    console.log('🔍 Image change analysis:', {
      hasNewFiles,
      originalCount: originalImages.length,
      currentCount: currentImages.length,
      newFilesCount: imageFiles.length,
      imagesEqual: equal(originalImages, currentImages)
    });
    
    // Changed if we have new files OR if existing image arrays are different
    return hasNewFiles || !equal(originalImages, currentImages);
  };

  const handleInputChange = (field: keyof SREFFormData, value: string) => {
    form.setValue(field, value);
  };

  // Filter available tags based on input and exclude already selected tags
  const filteredSuggestions = availableTags
    .filter(tag => 
      tag.toLowerCase().includes(newTag.toLowerCase()) && 
      !formData.tags.includes(tag)
    )
    .slice(0, 5); // Limit to 5 suggestions

  const handleAddTag = (tagToAdd?: string) => {
    const tag = tagToAdd || newTag;
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      const newTags = [...formData.tags, tag.trim()];
      form.setValue('tags', newTags);
      setNewTag('');
      setShowTagSuggestions(false);
    }
  };

  const handleTagInputChange = (value: string) => {
    setNewTag(value);
    // Update suggestions based on the new value
    const newFilteredSuggestions = availableTags
      .filter(tag => 
        tag.toLowerCase().includes(value.toLowerCase()) && 
        !formData.tags.includes(tag)
      )
      .slice(0, 5);
    setShowTagSuggestions(value.length > 0 && newFilteredSuggestions.length > 0);
  };

  const handleTagInputFocus = () => {
    if (newTag.length > 0 && filteredSuggestions.length > 0) {
      setShowTagSuggestions(true);
    }
  };

  const handleTagInputBlur = () => {
    // Delay hiding to allow clicking on suggestions
    setTimeout(() => setShowTagSuggestions(false), 200);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = formData.tags.filter(tag => tag !== tagToRemove);
    form.setValue('tags', newTags);
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
      // Removing existing image - update form images to track what's been removed
      const newImages = formData.images.filter((_, i) => i !== index);
      form.setValue('images', newImages);
      console.log('🗑️ Removed existing image at index:', index);
    } else {
      // Removing new file
      const fileIndex = index - (originalState.current?.images.length || 0);
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
      console.log('🗑️ Removed new file at index:', fileIndex);
    }
  };

  const validateForm = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      // Show validation errors from Zod
      const errors = form.formState.errors;
      Object.values(errors).forEach(error => {
        if (error?.message) {
          toast.error(error.message);
        }
      });
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

    if (!(await validateForm())) return;

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
      interface SREFSubmissionData {
        user_id: string;
        title?: string;
        code_value?: string;
        sv_version?: number;
        tags?: string[];
        images?: string[];
        imageDiff?: {
          imagesToDelete: string[];
          imagesToAdd: string[];
        };
        tagDiff?: {
          tagsToDelete: string[];
          tagsToAdd: string[];
        };
      }
      
      const srefData: SREFSubmissionData = {
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
        if (!originalState.current) {
          // New creation - include all tags
          srefData.tags = formData.tags;
          console.log('🏷️ New creation - including all tags:', formData.tags);
        } else {
          // Editing - implement granular tag diffing
          const originalTags = originalState.current.tags;
          const currentTags = formData.tags;
          
          // Find tags to delete (in original but not in current)
          const tagsToDelete = originalTags.filter(tag => !currentTags.includes(tag));
          
          // Find tags to add (in current but not in original)
          const tagsToAdd = currentTags.filter(tag => !originalTags.includes(tag));
          
          console.log('🔍 Tag diffing analysis:', {
            originalTags,
            currentTags,
            tagsToDelete,
            tagsToAdd
          });
          
          // Send granular tag updates instead of full replacement
          if (tagsToDelete.length > 0 || tagsToAdd.length > 0) {
            srefData.tagDiff = {
              tagsToDelete,
              tagsToAdd
            };
            console.log('🏷️ Sending granular tag update:', srefData.tagDiff);
          }
        }
      }
      
      // Only include images if they changed
      if (imagesChanged) {
        if (!originalState.current) {
          // New creation - include all images
          const allImageUrls = [...formData.images, ...uploadedImageUrls];
          srefData.images = allImageUrls;
          console.log('📸 New creation - including all images:', allImageUrls);
        } else {
          // Editing - implement granular image diffing
          const originalImages = originalState.current.images;
          const currentImages = [...formData.images, ...uploadedImageUrls];
          
          // Find images to delete (in original but not in current)
          const imagesToDelete = originalImages.filter(url => !currentImages.includes(url));
          
          // Find images to add (in current but not in original)
          const imagesToAdd = currentImages.filter(url => !originalImages.includes(url));
          
          console.log('🔍 Image diffing analysis:', {
            originalImages,
            currentImages,
            imagesToDelete,
            imagesToAdd,
            uploadedImageUrls
          });
          
          // Send granular image updates instead of full replacement
          if (imagesToDelete.length > 0 || imagesToAdd.length > 0) {
            srefData.imageDiff = {
              imagesToDelete,
              imagesToAdd
            };
            console.log('📸 Sending granular image update:', srefData.imageDiff);
          }
        }
      }
      
      console.log('SREF data to submit:', srefData);

      if (editingCode) {
        const result = await updateSREFCode(editingCode.id, srefData as any);
        if (!result.success) {
          console.error('Update SREF code error:', result.error);
          throw new Error(result.error);
        }
        toast.success('SREF code updated successfully!');
      } else {
        // For creation, ensure all required fields are present
        const createData = {
          ...srefData,
          title: formData.title.trim(),
          code_value: formData.code_value.trim(),
          sv_version: formData.version === 'SV6' ? 6 : 4,
          tags: formData.tags,
          images: [...formData.images, ...uploadedImageUrls]
        };
        
        const result = await createSREFCode(createData);
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
                  className={form.formState.errors.title ? 'border-red-500' : ''}
                  required
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version *</Label>
                <Select value={formData.version} onValueChange={(value: 'SV4' | 'SV6') => handleInputChange('version', value)}>
                  <SelectTrigger className={form.formState.errors.version ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SV6">SV6</SelectItem>
                    <SelectItem value="SV4">SV4</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.version && (
                  <p className="text-sm text-red-500">{form.formState.errors.version.message}</p>
                )}
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
                className={`font-mono ${form.formState.errors.code_value ? 'border-red-500' : ''}`}
                required
              />
              {form.formState.errors.code_value && (
                <p className="text-sm text-red-500">{form.formState.errors.code_value.message}</p>
              )}
            </div>


            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => handleTagInputChange(e.target.value)}
                    onFocus={handleTagInputFocus}
                    onBlur={handleTagInputBlur}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                      if (e.key === 'Escape') {
                        setShowTagSuggestions(false);
                      }
                    }}
                  />
                  <Button type="button" onClick={() => handleAddTag()} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Tag Suggestions Dropdown */}
                {showTagSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-12 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                    {filteredSuggestions.map((tag, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm transition-colors first:rounded-t-md last:rounded-b-md"
                        onClick={() => handleAddTag(tag)}
                      >
                        <Tag className="h-3 w-3 inline mr-2" />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
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