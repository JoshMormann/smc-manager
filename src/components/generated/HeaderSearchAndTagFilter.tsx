'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Search, Tag, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
export interface HeaderSearchAndTagFilterProps {
  searchQuery?: string;
  selectedTags?: string[];
  allTags?: string[];
  onSearchChange?: (query: string) => void;
  onTagToggle?: (tag: string) => void;
  onClearSearch?: () => void;
}
const defaultTags = [
  'comic',
  'retro',
  'colorful',
  'cyberpunk',
  'neon',
  'futuristic',
  'vintage',
  'photography',
  'sepia',
  'abstract',
  'minimalist',
  'dark',
  'bright',
  'artistic',
  'modern',
  'classic',
];
export default function HeaderSearchAndTagFilter({
  searchQuery = '',
  selectedTags = [],
  allTags = defaultTags,
  onSearchChange,
  onTagToggle,
  onClearSearch,
}: HeaderSearchAndTagFilterProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        onSearchChange?.(localSearchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchQuery, searchQuery, onSearchChange]);

  // Update local search when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };
  const handleClearSearch = () => {
    setLocalSearchQuery('');
    onClearSearch?.();
  };
  const handleTagClick = (tag: string) => {
    onTagToggle?.(tag);
  };
  const handleKeyDown = (e: React.KeyboardEvent, tag: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTagClick(tag);
    }
  };
  return (
    <header
      className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm"
      role="banner"
    >
      <div className="p-6 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <label htmlFor="sref-search" className="sr-only">
            Search SREF codes
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="sref-search"
              type="search"
              placeholder="Search SREF codes..."
              value={localSearchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-10 bg-card border-input focus:ring-2 focus:ring-ring transition-all"
              aria-describedby="search-help"
            />
            {localSearchQuery && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear search</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p id="search-help" className="sr-only">
            Search by title or SREF code
          </p>
        </div>

        {/* Tag Cloud Filter */}
        {allTags.length > 0 && (
          <nav role="navigation" aria-label="Filter by tags">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground">Filter by tags:</span>
              {selectedTags.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({selectedTags.length} selected)
                </span>
              )}
            </div>
            <div
              className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
              role="group"
              aria-label="Tag filters"
            >
              {allTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <motion.div
                    key={tag}
                    initial={{
                      scale: 1,
                    }}
                    whileTap={{
                      scale: 0.95,
                    }}
                    transition={{
                      duration: 0.1,
                    }}
                  >
                    <Badge
                      variant={isSelected ? 'default' : 'secondary'}
                      className={cn(
                        'cursor-pointer transition-all duration-200 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        isSelected
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                          : 'hover:bg-secondary/80 hover:text-secondary-foreground'
                      )}
                      onClick={() => handleTagClick(tag)}
                      onKeyDown={e => handleKeyDown(e, tag)}
                      tabIndex={0}
                      role="button"
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? 'Remove' : 'Add'} ${tag} filter`}
                    >
                      <Tag className="h-3 w-3 mr-1" aria-hidden="true" />
                      {tag}
                      {isSelected && (
                        <motion.span
                          initial={{
                            opacity: 0,
                            scale: 0,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0,
                          }}
                          className="ml-1"
                          aria-hidden="true"
                        >
                          ✓
                        </motion.span>
                      )}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
            {selectedTags.length > 0 && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedTags.forEach(tag => onTagToggle?.(tag))}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
