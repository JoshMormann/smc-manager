import React from 'react';
import { motion as _motion, AnimatePresence as _AnimatePresence } from 'framer-motion';
import { X as _X } from 'lucide-react';
import { Button as _Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SREFCodeForm from './SREFCodeForm';

interface SREFEditModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export default function SREFEditModal({ isOpen, onClose, editingCode, onSuccess }: SREFEditModalProps) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {editingCode ? 'Edit SREF Code' : 'Create New SREF Code'}
          </DialogTitle>
        </DialogHeader>
        <SREFCodeForm
          editingCode={editingCode}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}