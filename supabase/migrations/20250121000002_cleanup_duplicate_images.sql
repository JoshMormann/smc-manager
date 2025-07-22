-- Cleanup script to remove duplicate images that accumulated due to the RLS policy bug
-- This removes duplicates while preserving the correct image sequence

-- Step 1: Create a temporary table with the correct images (keep first occurrence of each position)
CREATE TEMP TABLE correct_images AS
SELECT DISTINCT ON (code_id, position) 
  id, 
  code_id, 
  image_url, 
  position, 
  created_at
FROM code_images 
ORDER BY code_id, position, created_at ASC;

-- Step 2: Delete all existing images 
-- (This will work now that we have the proper DELETE policy)
DELETE FROM code_images;

-- Step 3: Insert back only the correct images
INSERT INTO code_images (id, code_id, image_url, position, created_at)
SELECT id, code_id, image_url, position, created_at
FROM correct_images;

-- Drop the temporary table
DROP TABLE correct_images;