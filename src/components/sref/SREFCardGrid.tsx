'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SREFCard from './SREFCard';
import { SREFCode as DatabaseSREFCode } from '@/lib/database';

export type SREFCode =
  | DatabaseSREFCode
  | {
      id: string;
      title: string;
      code?: string;
      code_value?: string;
      version?: 'SV4' | 'SV6';
      sv_version?: number;
      images: Array<{ id: string; image_url: string; position: number }>;
      tags: string[];
      createdAt: Date;
    };

export interface SREFCardGridProps {
  codes?: SREFCode[];
  isLoading?: boolean;
  error?: string | null;
  variant?: 'library' | 'discover';
  showEmptyCard?: boolean;
  onCardClick?: (codeValue: string) => void;
  onCardEdit?: (id: string) => void;
  onCardDelete?: (id: string) => void;
  onCardLike?: (id: string) => void;
  onCreateNew?: () => void;
  likedCodes?: Set<string>;
}

export default function SREFCardGrid({
  codes = [],
  isLoading = false,
  error = null,
  variant = 'library',
  showEmptyCard = true,
  onCardClick,
  onCardEdit,
  onCardDelete,
  onCardLike,
  onCreateNew,
  likedCodes = new Set(),
}: SREFCardGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <section className="p-6" aria-label="Loading SREF codes">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
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

  // Empty state (no codes and no empty card)
  if (codes.length === 0 && !showEmptyCard) {
    return (
      <section className="p-6" aria-label="No SREF codes found">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {variant === 'discover' ? 'No community codes found' : 'No SREF codes found'}
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            {variant === 'discover'
              ? 'Check back later for community shared SREF codes, or try adjusting your search filters.'
              : 'Get started by adding your first SREF code to organize your style references.'}
          </p>
          {variant === 'library' && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add SREF Code
            </Button>
          )}
        </div>
      </section>
    );
  }

  // Main grid
  return (
    <section className="p-6" aria-label="SREF code collection">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Existing SREF codes */}
        {codes.map(code => (
          <motion.div
            key={code.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SREFCard
              variant={variant}
              id={code.id}
              title={code.title}
              codeValue={code.code_value || ('code' in code ? code.code : '') || ''}
              svVersion={code.sv_version || ('version' in code && code.version === 'SV4' ? 4 : 6)}
              images={code.images || []}
              tags={code.tags || []}
              isLiked={likedCodes.has(code.id)}
              onCardClick={onCardClick}
              onEdit={onCardEdit}
              onDelete={onCardDelete}
              onLike={onCardLike}
            />
          </motion.div>
        ))}

        {/* Empty card for adding new SREF codes (only in library view) */}
        {showEmptyCard && variant === 'library' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: codes.length * 0.05 }}
          >
            <SREFCard variant="empty" onCreateNew={onCreateNew} />
          </motion.div>
        )}
      </div>
    </section>
  );
}
