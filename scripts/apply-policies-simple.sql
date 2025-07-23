-- Apply RLS policies for DELETE and UPDATE operations
-- This fixes the image duplication bug

-- Add missing DELETE policy for code_images
CREATE POLICY "Users can delete images for their own codes" ON code_images
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );

-- Add missing UPDATE policy for code_images  
CREATE POLICY "Users can update images for their own codes" ON code_images
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );

-- Add missing DELETE policy for code_tags
CREATE POLICY "Users can delete tags for their own codes" ON code_tags
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );

-- Add missing UPDATE policy for code_tags
CREATE POLICY "Users can update tags for their own codes" ON code_tags
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );