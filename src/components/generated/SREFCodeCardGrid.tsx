'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn as _cn } from '@/lib/utils';
import { MoreVertical, Edit, Trash, Search, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
export interface SREFCode {
  id: string;
  title: string;
  code: string;
  version: 'SV4' | 'SV6';
  images: string[];
  tags: string[];
  createdAt: Date;
}
export interface SREFCodeCardGridProps {
  codes?: SREFCode[];
  isLoading?: boolean;
  error?: string | null;
  onCardClick?: (code: string) => void;
  onCardEdit?: (id: string) => void;
  onCardDelete?: (id: string) => void;
}
const defaultCodes: SREFCode[] = [
  {
    id: '1',
    title: "90's comic book",
    code: '--sref 1234567890',
    version: 'SV6',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
    ],
    tags: ['comic', 'retro', 'colorful'],
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Cyberpunk neon',
    code: '--sref 9876543210',
    version: 'SV4',
    images: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop',
    ],
    tags: ['cyberpunk', 'neon', 'futuristic'],
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Vintage photography',
    code: '--sref 5555555555',
    version: 'SV6',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
    ],
    tags: ['vintage', 'photography', 'sepia'],
    createdAt: new Date(),
  },
];
export default function SREFCodeCardGrid({
  codes = defaultCodes,
  isLoading = false,
  error = null,
  onCardClick,
  onCardEdit,
  onCardDelete,
}: SREFCodeCardGridProps) {
  const handleCardClick = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('SREF code copied to clipboard!', {
      duration: 2000,
      position: 'bottom-right',
    });
    onCardClick?.(code);
  };
  const handleCardEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onCardEdit?.(id);
  };
  const handleCardDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onCardDelete?.(id);
  };
  const handleKeyDown = (e: React.KeyboardEvent, code: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(code);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="p-6" aria-label="Loading SREF codes">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({
            length: 6,
          }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="p-6" aria-label="Error loading SREF codes">
        <Alert className="max-w-md mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </section>
    );
  }

  // Empty state
  if (codes.length === 0) {
    return (
      <section className="p-6" aria-label="No SREF codes found">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No SREF codes found</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Get started by adding your first SREF code to organize your style references.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add SREF Code
          </Button>
        </div>
      </section>
    );
  }

  // Main grid
  return (
    <section className="p-6" aria-label="SREF code collection">
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
        {codes.map(code => (
          <motion.li
            key={code.id}
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.3,
            }}
            role="listitem"
          >
            <Card
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group focus-within:ring-2 focus-within:ring-ring"
              onClick={() => handleCardClick(code.code)}
              onKeyDown={e => handleKeyDown(e, code.code)}
              tabIndex={0}
              role="button"
              aria-label={`Copy SREF code for ${code.title}`}
            >
              <CardContent className="p-0">
                {/* Images */}
                <div
                  className="grid grid-cols-3 gap-0"
                  role="img"
                  aria-label={`${code.title} reference images`}
                >
                  {code.images.map((image, index) => (
                    <figure key={index} className="aspect-square overflow-hidden">
                      <img
                        src={image}
                        alt={`${code.title} reference ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </figure>
                  ))}
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                      {code.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {code.version}
                      </Badge>
                      <DropdownMenu>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                onClick={e => e.stopPropagation()}
                                aria-label={`More options for ${code.title}`}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>More options</p>
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onClick={e => handleCardEdit(code.id, e)}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => handleCardDelete(code.id, e)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono mb-2">{code.code}</p>
                  <div className="flex flex-wrap gap-1">
                    {code.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {code.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{code.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
