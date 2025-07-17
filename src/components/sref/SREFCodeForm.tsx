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
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (index < formData.images.length) {
      // Removing existing image
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      // Removing new file
      const fileIndex = index - formData.images.length;
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
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
    
    try {
      console.log('Starting form submission...');
      console.log('User ID:', user.id);
      console.log('Form data:', formData);
      console.log('Image files:', imageFiles);
      
      let uploadedImageUrls: string[] = [];
      
      // Upload new images if any
      if (imageFiles.length > 0) {
        toast.info('Uploading images...');
        console.log('Uploading images...');
        const uploadedImages = await uploadImages(imageFiles);
        uploadedImageUrls = uploadedImages.map(img => img.url);
        console.log('Uploaded image URLs:', uploadedImageUrls);
      }
      
      // Combine existing images with newly uploaded ones
      const allImageUrls = [...(formData.images || []), ...uploadedImageUrls];
      
      const srefData = {
        title: formData.title.trim(),
        code_value: formData.code_value.trim(),
        sv_version: formData.version === 'SV6' ? 6 : 4,
        tags: formData.tags,
        images: allImageUrls,
        user_id: user.id
      };
      
      console.log('SREF data to submit:', srefData);

      if (editingCode) {
        const { error } = await updateSREFCode(editingCode.id, srefData);
        if (error) {
          console.error('Update SREF code error:', error);
          throw error;
        }
        toast.success('SREF code updated successfully!');
      } else {
        const { error } = await createSREFCode(srefData);
        if (error) {
          console.error('Create SREF code error:', error);
          throw error;
        }
        toast.success('SREF code created successfully!');
      }
      
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to ${editingCode ? 'update' : 'create'} SREF code: ${errorMessage}`);
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
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., 90's comic book style"
                required
              />
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

            {/* Version */}
            <div className="space-y-2">
              <Label htmlFor="version">Midjourney Version</Label>
              <Select value={formData.version} onValueChange={(value: 'SV4' | 'SV6') => handleInputChange('version', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SV6">Style Version 6 (SV6)</SelectItem>
                  <SelectItem value="SV4">Style Version 4 (SV4)</SelectItem>
                </SelectContent>
              </Select>
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
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
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