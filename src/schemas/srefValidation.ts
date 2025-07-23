import { z } from 'zod';

// Base SREF code validation schema
export const srefCodeSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .trim(),
  
  code_value: z
    .string()
    .min(1, 'SREF code is required')
    .refine(
      (value) => value.includes('--sref'),
      'SREF code must include "--sref"'
    )
    .refine(
      (value) => /--sref\s+\d+/.test(value),
      'SREF code must follow format "--sref 1234567890"'
    ),
  
  version: z.enum(['SV4', 'SV6'], {
    errorMap: () => ({ message: 'Version must be either SV4 or SV6' })
  }),
  
  tags: z
    .array(z.string().min(1).max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional()
    .default([]),
  
  images: z
    .array(z.string().url('Invalid image URL'))
    .max(6, 'Maximum 6 images allowed')
    .optional()
    .default([])
});

// Form data type (what the form uses)
export type SREFFormData = z.infer<typeof srefCodeSchema>;

// Database submission schema (includes user_id)
export const srefSubmissionSchema = srefCodeSchema.extend({
  user_id: z.string().uuid('Invalid user ID'),
  sv_version: z.number().int().min(4).max(6)
});

export type SREFSubmissionData = z.infer<typeof srefSubmissionSchema>;

// Partial update schema for editing
export const srefUpdateSchema = srefCodeSchema.partial().extend({
  user_id: z.string().uuid('Invalid user ID').optional()
});

export type SREFUpdateData = z.infer<typeof srefUpdateSchema>;