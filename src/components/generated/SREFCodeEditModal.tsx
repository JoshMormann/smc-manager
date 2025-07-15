"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence as _AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Upload, Image as ImageIcon, Tag, Plus, Trash2, GripVertical, Check as _Check, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
export interface SREFCode {
  id: string;
  title: string;
  code: string;
  version: "SV4" | "SV6";
  images: string[];
  tags: string[];
  createdAt: Date;
  mpid?: string;
}
export interface SREFCodeEditModalProps {
  isOpen?: boolean;
  mode?: "create" | "edit";
  initialData?: SREFCode;
  onSave?: (data: SREFCode) => void;
  onDelete?: (id: string) => void;
  onClose?: () => void;
}
const defaultTags = ["comic", "retro", "colorful", "cyberpunk", "neon", "futuristic", "vintage", "photography", "sepia", "abstract", "minimalist", "dark", "bright", "artistic", "modern", "classic", "portrait", "landscape", "digital", "analog", "black-white", "vibrant", "muted", "dramatic"];
const defaultImages = ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop", "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop"];
export default function SREFCodeEditModal({
  isOpen = true,
  mode = "create",
  initialData,
  onSave,
  onDelete,
  onClose
}: SREFCodeEditModalProps) {
  // Form state
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [version, setVersion] = useState<"SV4" | "SV6">("SV6");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>(defaultImages);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with existing data
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setTitle(initialData.title);
      setCode(initialData.code);
      setVersion(initialData.version);
      setTags(initialData.tags);
      setImages(initialData.images);
    } else {
      // Reset form for create mode
      setTitle("");
      setCode("");
      setVersion("SV6");
      setTags([]);
      setImages(defaultImages);
    }
    setErrors({});
  }, [mode, initialData, isOpen]);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!code.trim()) {
      newErrors.code = "SREF code is required";
    } else if (!code.includes("--sref")) {
      newErrors.code = "Code must contain '--sref'";
    }
    if (images.length < 3) {
      newErrors.images = "At least 3 images are required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }
    setIsLoading(true);
    try {
      const srefData: SREFCode = {
        id: initialData?.id || Date.now().toString(),
        title: title.trim(),
        code: code.trim(),
        version,
        tags,
        images,
        createdAt: initialData?.createdAt || new Date(),
        mpid: initialData?.mpid || `sref-${Date.now()}`
      };
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      onSave?.(srefData);
      toast.success(mode === "create" ? "SREF code created!" : "SREF code updated!");
      onClose?.();
    } catch (_error) {
      toast.error("Failed to save SREF code");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!initialData?.id) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      onDelete?.(initialData.id);
      toast.success("SREF code deleted");
      onClose?.();
    } catch (_error) {
      toast.error("Failed to delete SREF code");
    } finally {
      setIsLoading(false);
    }
  };

  // Tag management
  const addTag = (tagToAdd: string) => {
    const trimmedTag = tagToAdd.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(newTag);
    }
  };

  // Image management
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        const imageUrl = event.target?.result as string;
        setImages(prev => [...prev, imageUrl]);
      };
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Drag and drop for image reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    setImages(newImages);
    setDraggedIndex(null);
  };

  // Filtered tag suggestions
  const tagSuggestions = defaultTags.filter(tag => tag.toLowerCase().includes(newTag.toLowerCase()) && !tags.includes(tag)).slice(0, 5);
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-semibold">
            {mode === "create" ? "Create SREF Code" : "Edit SREF Code"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., 90's comic book style" className={cn(errors.title && "border-destructive")} />
                  {errors.title && <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.title}
                    </p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Version *</Label>
                  <Select value={version} onValueChange={(value: "SV4" | "SV6") => setVersion(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SV4">SV4</SelectItem>
                      <SelectItem value="SV6">SV6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">SREF Code(s) *</Label>
                <Textarea id="code" value={code} onChange={e => setCode(e.target.value)} placeholder="--sref 1234567890&#10;--sref 0987654321" rows={3} className={cn("font-mono", errors.code && "border-destructive")} />
                {errors.code && <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.code}
                  </p>}
                <p className="text-xs text-muted-foreground">
                  Enter one or more SREF codes, each on a new line
                </p>
              </div>
            </section>

            <Separator />

            {/* Tags */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium">Tags</h3>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Add Tags</Label>
                <div className="relative">
                  <Input id="tags" ref={tagInputRef} value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type a tag and press Enter" />
                  <Button type="button" size="sm" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={() => addTag(newTag)} disabled={!newTag.trim()}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Tag suggestions */}
                {newTag && tagSuggestions.length > 0 && <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-md">
                    <span className="text-xs text-muted-foreground">Suggestions:</span>
                    {tagSuggestions.map(suggestion => <Button key={suggestion} type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => addTag(suggestion)}>
                        {suggestion}
                      </Button>)}
                  </div>}

                {/* Current tags */}
                {tags.length > 0 && <div className="flex flex-wrap gap-2">
                    {tags.map(tag => <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" onClick={() => removeTag(tag)}>
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>)}
                  </div>}
              </div>
            </section>

            <Separator />

            {/* Images */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Images *</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

              {errors.images && <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.images}</AlertDescription>
                </Alert>}

              {images.length === 0 ? <Card className="border-dashed border-2 border-muted-foreground/25">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center mb-4">
                      No images uploaded yet. Add at least 3 images to showcase your SREF style.
                    </p>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Images
                    </Button>
                  </CardContent>
                </Card> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => <motion.div key={index} initial={{
                opacity: 0,
                scale: 0.8
              }} animate={{
                opacity: 1,
                scale: 1
              }} exit={{
                opacity: 0,
                scale: 0.8
              }} className="relative group" draggable onDragStart={() => handleDragStart(index)} onDragOver={handleDragOver} onDrop={e => handleDrop(e, index)}>
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-transparent group-hover:border-primary/50 transition-colors">
                        <img src={image} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                      
                      {/* Drag handle */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-background/80 backdrop-blur-sm rounded p-1">
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Remove button */}
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(index)}>
                        <X className="h-3 w-3" />
                      </Button>

                      {/* Order indicator */}
                      <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
                        {index + 1}
                      </div>
                    </motion.div>)}
                </div>}

              <p className="text-xs text-muted-foreground">
                Drag and drop to reorder images. The first 3 images will be shown in the card preview.
              </p>
            </section>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <div>
            {mode === "edit" && <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>}
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "create" ? "Create SREF Code" : "Update SREF Code"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}