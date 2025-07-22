-- Fix missing RLS policies for DELETE and UPDATE operations on code_images and code_tags
-- This fixes the systematic image duplication bug caused by failed DELETE operations

-- Add missing DELETE and UPDATE policies for code_images table
CREATE POLICY "Users can delete images for their own codes" ON code_images
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );

CREATE POLICY "Users can update images for their own codes" ON code_images
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );

-- Add missing DELETE and UPDATE policies for code_tags table for consistency
CREATE POLICY "Users can delete tags for their own codes" ON code_tags
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );

CREATE POLICY "Users can update tags for their own codes" ON code_tags
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );