# SREF Manager - Planning & Backlog

## 🎉 Current Status (2025-07-22)

### ✅ Completed Features

- **Authentication System**: Google & Discord OAuth with user profile creation
- **SREF Code Management**: Full CRUD operations (Create, Read, Update, Delete)
- **Real Database Integration**: Replaced mock data with Supabase
- **Auto-refresh**: UI updates immediately after operations
- **Image Upload**: Support for reference images in SREF codes (✅ FIXED!)
- **Copy to Clipboard**: Click-to-copy functionality for SREF codes
- **Persistent UI**: "Add SREF Code" button always available in header
- **Bug Fixes**: OAuth loading spinner, foreign key constraints, form validation
- **Text Field Updates**: ✅ WORKING - Only updates title/code_value/version when changed
- **Field Label & Menu Fixes**: ✅ COMPLETED - Semantic issues resolved

### 🎉 NEW: Session 2025-07-22 Accomplishments

- **Granular Form Updates**: Implemented field-level change detection system
- **Text Fields**: ✅ Working correctly - only updates when actually changed
- **Change Detection Logic**: Added `hasTextFieldsChanged()`, `hasTagsChanged()`, `hasImagesChanged()`
- **Backend Optimization**: Modified database service for selective field updates
- **Comprehensive Documentation**: Added detailed TODO comments for tomorrow's work

---

## 🚨 CRITICAL ISSUES - Current Session Focus

### ❌ Image Management (HIGH PRIORITY)

**PROBLEM**: Image deletion still causing duplications

- **Root Cause**: Backend delete operations return `count: 0` (failing silently)
- **Current Behavior**: Delete 3 images (fails) + Insert 2 new = 5 total images
- **Expected Behavior**: Delete 1 specific image + Keep 2 unchanged = 2 total images
- **Solution Ready**: UUID-based granular deletion approach planned

### ❌ Tag Management (MEDIUM PRIORITY)

**PROBLEM**: Tag deletions not working properly

- **Current Behavior**: Can add tags, but removing tags doesn't persist
- **Root Cause**: Still using "replace all tags" approach
- **Solution Ready**: Tag diffing approach similar to images

### ❌ Database Operations (INVESTIGATION NEEDED)

**PROBLEM**: Delete operations returning count 0 instead of actual deletion count

- **Potential Causes**: RLS policies, permissions, query syntax
- **Impact**: Causing all duplication issues
- **Investigation Needed**: Why `DELETE FROM code_images WHERE code_id = X` returns count 0

---

## 📋 TOMORROW'S ROADMAP (Priority Order)

### Phase 1: UUID-Based Image Management (HIGH PRIORITY)

- [ ] **Implement Image Diffing Algorithm**
  - Compare `originalState.current.images` vs `formData.images`
  - Identify specific images removed by URL/UUID
  - Identify specific images added
- [ ] **Update SREFCodeUpdate Interface**
  - Add `imagesToDelete: string[]` (UUIDs or URLs)
  - Add `imagesToAdd: string[]` (new image URLs)
- [ ] **Modify Backend Database Operations**
  - Replace "delete all, re-insert all" with granular operations
  - `DELETE FROM code_images WHERE id IN (uuid1, uuid2)`
  - `INSERT` only new images
- [ ] **Test Image Deletion**
  - Verify single image deletion works without duplication
  - Confirm unchanged images remain untouched

### Phase 2: Tag Diffing System (MEDIUM PRIORITY)

- [ ] **Implement Tag Diffing Algorithm**
  - Compare original vs current tags arrays
  - Identify specific tags to add/remove
- [ ] **Update Tag Management**
  - Send only changed tags to backend
  - Implement granular tag operations

### Phase 3: Database Investigation (INVESTIGATION)

- [ ] **Debug Delete Operations**
  - Check RLS policies on `code_images` table
  - Verify user permissions for delete operations
  - Test delete queries directly in Supabase
- [ ] **Fix Delete Issues**
  - Ensure delete operations actually remove records
  - Verify count returns reflect actual deletions

### Phase 4: Testing & Validation

- [ ] **Comprehensive Testing**
  - Test each field type individually
  - Verify no regressions in text fields
  - Test mixed operations (image + tag + text changes)
- [ ] **Database Cleanup**
  - Remove duplicate images from database
  - Reset to known good state

---

## 🐛 Technical Details & Code References

### Key Files Modified Today

- `src/components/sref/SREFCodeForm.tsx` - Change detection logic added
- `src/lib/database.ts` - Selective field updates implemented

### Detailed TODO Comments Added

- **SREFCodeForm.tsx Lines 243-256**: UUID-based image diffing implementation plan
- **SREFCodeForm.tsx Lines 232-236**: Tag diffing implementation plan
- **database.ts Lines 193-204**: UUID-based deletion approach documentation
- **database.ts Line 235**: Investigation note for delete count issue

### Current Test Results

- ✅ **Text Fields**: Working correctly, no unnecessary updates
- ❌ **Images**: Still duplicating (5 images after deleting 1 from 3)
- ❌ **Tags**: Additions work, deletions fail

### Console Log Analysis (Last Test)

```
🔍 Image change analysis: {hasNewFiles: false, quantityChanged: true, contentChanged: false, originalCount: 3, currentCount: 2}
🔍 Change detection results: {textFieldsChanged: false, tagsChanged: false, imagesChanged: true}
📸 Including images in update: (2 images)
🔍 DEBUG - Images before deletion: 3
✅ Successfully deleted 0 existing images  <-- PROBLEM HERE
Successfully inserted 2 new images         <-- CAUSES DUPLICATION
```

---

## 📚 Resources & Architecture

### Current Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth + Database + Storage)
- **Authentication**: OAuth (Google, Discord) + Email/Password
- **Database**: PostgreSQL via Supabase
- **State Management**: React Context + Custom hooks

### Database Schema References

- `sref_codes` table - Main SREF records
- `code_images` table - Image associations (has UUIDs)
- `code_tags` table - Tag associations
- `users` table - User profiles

---

## 🗓️ Future Enhancements (Post-Granular Updates)

### Option A: User Experience

- [ ] **Tag Autocomplete**: Add tag suggestions to prevent duplicates
- [ ] Add drag-and-drop for image uploads
- [ ] Implement better image previews/zoom
- [ ] Add keyboard shortcuts
- [ ] Improve mobile responsiveness

### Option B: Enhanced Features

- [ ] Implement folder organization system
- [ ] Add bulk operations (select multiple codes)
- [ ] Improve search with filters by version/tags
- [ ] Add export functionality (CSV, JSON)

### Option C: Data Management

- [ ] Add data backup/restore functionality
- [ ] Implement usage analytics
- [ ] Add code sharing features
- [ ] Create import from external sources

---

_Last Updated: 2025-07-22_
_Recent Session: 2025-07-22 - Implemented Granular Form Updates (Text Fields Working)_
_Next Session: 2025-07-23 - Focus on UUID-Based Image & Tag Management_
_Critical: Fix image duplication via granular deletion approach_
