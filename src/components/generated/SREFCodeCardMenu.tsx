'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MoreVertical, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
export interface SREFCodeCardMenuProps {
  cardId?: string;
  cardTitle?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}
export default function SREFCodeCardMenu({
  cardId = '',
  cardTitle = 'SREF code',
  onEdit,
  onDelete,
  className,
}: SREFCodeCardMenuProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(cardId);
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(cardId);
  };
  return (
    <DropdownMenu>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:ring-2 focus:ring-ring',
                className
              )}
              onClick={e => e.stopPropagation()}
              aria-label={`More options for ${cardTitle}`}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>More options</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        className="w-32"
        role="menu"
        aria-label={`Actions for ${cardTitle}`}
      >
        <DropdownMenuItem
          onClick={handleEdit}
          className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
          role="menuitem"
        >
          <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          role="menuitem"
        >
          <Trash className="h-4 w-4 mr-2" aria-hidden="true" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
