'use client';

import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MoreVertical, Heart, Copy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface SREFCardProps {
  variant: 'library' | 'discover' | 'empty';
  id?: string;
  title?: string;
  codeValue?: string;
  svVersion?: number;
  images?: Array<{ id: string; image_url: string; position: number } | string>;
  tags?: string[];
  isLiked?: boolean;
  onCardClick?: (codeValue: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onLike?: (id: string) => void;
  onCreateNew?: () => void;
  className?: string;
}

export default function SREFCard({
  variant,
  id,
  title,
  codeValue,
  svVersion,
  images = [],
  tags = [],
  isLiked = false,
  onCardClick,
  onEdit,
  onDelete,
  onLike,
  onCreateNew,
  className,
}: SREFCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Build complete SREF command including SV version
  const getCompleteCommand = () => {
    if (!codeValue) return '';

    // If we have an SV version, include it in the command
    if (svVersion) {
      return `${codeValue} --sv ${svVersion}`;
    }

    // Fallback to just the SREF code if no SV version
    return codeValue;
  };

  // Handle card click for copying
  const handleCardClick = () => {
    if (variant === 'empty') {
      onCreateNew?.();
      return;
    }

    const completeCommand = getCompleteCommand();
    if (completeCommand) {
      navigator.clipboard.writeText(completeCommand);
      toast.success('SREF code with SV version copied to clipboard!', {
        duration: 2000,
        position: 'bottom-right',
      });
      onCardClick?.(codeValue || '');
    }
  };

  // Handle menu actions
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) onEdit?.(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) onDelete?.(id);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) onLike?.(id);
  };

  // Get SV chip styling
  const getSVChipStyle = (version: number) => {
    const baseStyle = {
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    };

    if (version === 4) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 92, 113, 0.65)',
        color: '#FCFCFD',
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(222, 70, 209, 0.65)',
        color: '#FCFCFD',
      };
    }
  };

  // Get blur element styling
  const getBlurElementStyle = () => ({
    backgroundColor: 'rgba(121, 121, 121, 0.4)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    color: '#FCFCFD',
  });

  // Render image grid
  const renderImageGrid = () => {
    const imageUrls = images.map(img => (typeof img === 'string' ? img : img.image_url));

    if (imageUrls.length === 0) return null;

    return (
      <div className="absolute inset-0 flex bg-[#2E3038] gap-px">
        {imageUrls.slice(0, 4).map((imageUrl, index) => (
          <div key={index} className="flex-1">
            <img
              src={imageUrl}
              alt={`${title} reference ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={e => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src =
                  'data:image/svg+xml;utf8,<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><rect fill="%23f3f3f3" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="%23999">Image unavailable</text></svg>';
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  // Render gradient overlays
  const renderGradientOverlays = () => (
    <>
      {/* Top gradient overlay */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 transition-all duration-300 ease-in-out',
          isHovered ? 'h-full' : 'h-1/3'
        )}
        style={{
          background: isHovered
            ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 100%)'
            : 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
        }}
      />

      {/* Bottom gradient overlay */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 transition-all duration-300 ease-in-out',
          isHovered ? 'h-full' : 'h-1/3'
        )}
        style={{
          background: isHovered
            ? 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 100%)'
            : 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
        }}
      />
    </>
  );

  // Empty card variant
  if (variant === 'empty') {
    return (
      <motion.div
        className={cn(
          'relative bg-card border border-dashed border-muted-foreground/20 rounded-lg overflow-hidden cursor-pointer hover:border-primary/50 transition-colors',
          className
        )}
        style={{ aspectRatio: '1.68' }}
        onClick={handleCardClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
          <div className="p-4 rounded-full bg-muted">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-lg text-foreground">Save an SREF Code</h3>
            <p className="text-sm text-muted-foreground px-4">
              Save an SREF code along with images and tags for rapid retrieval.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Main card variants (library/discover)
  return (
    <motion.div
      className={cn('relative bg-card rounded-lg overflow-hidden cursor-pointer group', className)}
      style={{ aspectRatio: '1.68' }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background Images */}
      {renderImageGrid()}

      {/* Gradient Overlays */}
      {renderGradientOverlays()}

      {/* Top Content */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
        {/* Left side: SV chip and title */}
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* SV Version Chip */}
          {svVersion && (
            <div
              className="px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0"
              style={{
                ...getSVChipStyle(svVersion),
                fontFamily: 'DM Sans, system-ui, sans-serif',
                fontSize: '12px',
                lineHeight: '21px',
              }}
            >
              SV{svVersion}
            </div>
          )}

          {/* Title */}
          {title && (
            <h3
              className="font-semibold text-white truncate"
              style={{
                fontFamily: 'DM Sans, system-ui, sans-serif',
                fontSize: '16px',
                lineHeight: '24px',
                color: '#FCFCFD',
              }}
            >
              {title}
            </h3>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {variant === 'library' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full border-0"
                  style={getBlurElementStyle()}
                  onClick={e => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    handleEdit(e);
                  }}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(e);
                  }}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border-0"
              style={getBlurElementStyle()}
              onClick={handleLike}
            >
              <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs border-0"
              style={{
                ...getBlurElementStyle(),
                fontFamily: 'DM Sans, system-ui, sans-serif',
                fontSize: '12px',
                lineHeight: '21px',
              }}
            >
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge
              variant="secondary"
              className="text-xs border-0"
              style={{
                ...getBlurElementStyle(),
                fontFamily: 'DM Sans, system-ui, sans-serif',
                fontSize: '12px',
                lineHeight: '21px',
              }}
            >
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      </div>

      {/* Copy Button (bottom right) */}
      <div className="absolute bottom-3 right-3 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full border-0"
          onClick={e => {
            e.stopPropagation();
            handleCardClick();
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      {/* Hover Overlay with "Click to Copy" */}
      {isHovered && codeValue && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center z-5"
        >
          <div className="text-center space-y-2">
            <div
              className="px-4 py-2 rounded-lg"
              style={{
                ...getBlurElementStyle(),
                fontFamily: 'DM Sans, system-ui, sans-serif',
                fontSize: '14px',
                lineHeight: '21px',
              }}
            >
              <div className="flex items-center space-x-2">
                <Copy className="h-4 w-4" />
                <span>Click to Copy</span>
              </div>
            </div>
            <div
              className="text-sm font-mono"
              style={{
                color: '#FCFCFD',
                fontFamily: 'DM Sans, system-ui, sans-serif',
                fontSize: '14px',
                lineHeight: '21px',
              }}
            >
              {getCompleteCommand()}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
