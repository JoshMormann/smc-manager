-- Test script to verify the image deletion fix is working
-- Run this after applying the migration to verify the fix

-- 1. Check for any remaining duplicate images
SELECT 
  sc.title,
  sc.id as code_id,
  COUNT(ci.id) as image_count,
  ARRAY_AGG(ci.position ORDER BY ci.position) as positions,
  ARRAY_AGG(ci.image_url ORDER BY ci.position) as urls
FROM sref_codes sc 
LEFT JOIN code_images ci ON sc.id = ci.code_id 
GROUP BY sc.id, sc.title
HAVING COUNT(ci.id) > 3  -- Flag codes with more than 3 images as potentially problematic
ORDER BY image_count DESC;

-- 2. Check for position duplicates within the same code
SELECT 
  code_id,
  position,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(image_url) as urls
FROM code_images 
GROUP BY code_id, position 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 3. Verify RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('code_images', 'code_tags') 
AND policyname LIKE '%delete%'
ORDER BY tablename, policyname;