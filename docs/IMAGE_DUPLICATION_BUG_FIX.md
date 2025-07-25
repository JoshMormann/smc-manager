# Image Duplication Bug - Root Cause Analysis & Fix

## Problem Summary

Persistent image duplication occurring in both card view and edit view, with image deletions having no effect. The problem persisted even with fresh SREF codes, indicating a systematic database-level issue.

## Root Cause Identified

**Missing RLS (Row Level Security) DELETE policies for `code_images` table**

### The Critical Flaw

The `updateSREFCode` function in `src/lib/database.ts` performs a "delete then insert" pattern:

```typescript
// Delete existing images
await supabase.from('code_images').delete().eq('code_id', codeId);

// Insert new images
await supabase.from('code_images').insert(imageInserts);
```

**However**, the database schema only had SELECT and INSERT policies for `code_images`:

- ✅ `"Code images are viewable by everyone"` (SELECT)
- ✅ `"Users can create images for their own codes"` (INSERT)
- ❌ **MISSING**: DELETE policy
- ❌ **MISSING**: UPDATE policy

This caused:

1. **Silent DELETE failures** due to missing RLS permissions
2. **Successful INSERT operations** adding new images
3. **Systematic accumulation** of duplicate images with each edit/save

## Evidence from Database

```sql
-- A single SREF code had 15 duplicate image entries!
SELECT sc.title, COUNT(ci.id) as image_count
FROM sref_codes sc
JOIN code_images ci ON sc.id = ci.code_id
WHERE sc.id = '440d0a22-394c-4fb3-9833-b08b5aaa1ceb'
GROUP BY sc.title;

-- Result: "8bit Color (Google SSO)" had 15 images instead of 3
```

## Comprehensive Solution

### 1. Database Schema Fix

Added missing RLS policies in `supabase/schema.sql`:

```sql
-- Add DELETE policy for code_images
CREATE POLICY "Users can delete images for their own codes" ON code_images
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );

-- Add UPDATE policy for code_images
CREATE POLICY "Users can update images for their own codes" ON code_images
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );
```

### 2. Database Service Enhancement

Enhanced error handling in `src/lib/database.ts`:

```typescript
// Before: Silent failure
await supabase.from('code_images').delete().eq('code_id', codeId);

// After: Proper error detection and logging
const { error: deleteError, count: deletedCount } = await supabase
  .from('code_images')
  .delete({ count: 'exact' })
  .eq('code_id', codeId);

if (deleteError) {
  captureException(deleteError, { tags: { operation: 'delete_images', code_id: codeId } });
  console.error('Failed to delete existing images:', deleteError);
}
```

### 3. Data Cleanup

Created migration `20250121000002_cleanup_duplicate_images.sql` to:

1. Identify and preserve correct image sequences
2. Remove all duplicates
3. Restore clean state

### 4. Semantic Labeling Restoration

Enhanced image alt text in `SREFCodeForm.tsx`:

```typescript
// Before: Generic alt text
alt={`Preview ${index + 1}`}

// After: Descriptive semantic labeling
alt={`${formData.title || 'SREF'} reference image ${index + 1} of ${imagePreviews.length}`}
```

## Migration Process

1. **Apply RLS Policy Fix**:

   ```bash
   supabase db push
   ```

2. **Run Data Cleanup**:

   ```sql
   -- Apply migration 20250121000002_cleanup_duplicate_images.sql
   ```

3. **Verify Fix**:
   ```sql
   -- Run test-image-deletion-fix.sql to confirm resolution
   ```

## Files Modified

### Core Fix Files

- `supabase/schema.sql` - Added missing RLS policies
- `supabase/migrations/20250121000001_fix_image_deletion_rls_policies.sql` - Migration for policies
- `supabase/migrations/20250121000002_cleanup_duplicate_images.sql` - Data cleanup
- `src/lib/database.ts` - Enhanced error handling and logging

### Improvement Files

- `src/components/sref/SREFCodeForm.tsx` - Better semantic image labeling
- `scripts/test-image-deletion-fix.sql` - Verification script

## Prevention Measures

1. **RLS Policy Completeness**: Ensure all CRUD operations have corresponding policies
2. **Error Handling**: Always check for and log database operation errors
3. **Testing**: Include RLS policy testing in development workflow
4. **Monitoring**: Track deletion operation success rates

## Impact

- ✅ **Eliminates systematic image duplication**
- ✅ **Fixes non-functional image deletion**
- ✅ **Restores semantic labeling for accessibility**
- ✅ **Adds comprehensive error tracking**
- ✅ **Prevents future accumulation issues**

This fix addresses the root cause at the database permission level while adding safeguards to detect and handle similar issues in the future.
