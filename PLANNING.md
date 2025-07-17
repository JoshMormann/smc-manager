# SREF Manager - Planning & Backlog

## 🎉 Current Status (2025-07-17)

### ✅ Completed Features
- **Authentication System**: Google & Discord OAuth with user profile creation
- **SREF Code Management**: Full CRUD operations (Create, Read, Update, Delete)
- **Real Database Integration**: Replaced mock data with Supabase
- **Auto-refresh**: UI updates immediately after operations
- **Image Upload**: Support for reference images in SREF codes (✅ FIXED!)
- **Copy to Clipboard**: Click-to-copy functionality for SREF codes
- **Persistent UI**: "Add SREF Code" button always available in header
- **Bug Fixes**: OAuth loading spinner, foreign key constraints, form validation

### 🎉 NEW: Session 2025-07-17 Accomplishments
- **Toast Improvements**: Enhanced error toasts with Y-axis stacking, 10s duration, and close buttons
- **Data Persistence Fixes**: 
  - Removed unused description field (backlogged as future paid feature)
  - Fixed image persistence in edit forms
  - Fixed missing refreshSREFCodes function call
  - Fixed type mismatches in dashboard interfaces
- **Image Upload Resolution**: Fixed critical bucket name mismatch (`'code images'` → `'code-images'`)
- **Code Quality**: Cleaned up unused imports and type definitions

### 🐛 Known Issues - RESOLVED!
- ✅ Description field not persisting → Removed (future paid feature)
- ✅ Images not persisting in edit forms → Fixed type conversion
- ✅ Image uploads failing with "Bucket not found" → Fixed bucket name
- ✅ Toast messages overlapping and disappearing too quickly → Enhanced UX

---

## 📋 Next Session: Remaining Polish & Enhancement Items

### High Priority (Core Functionality)
- [ ] Fix remaining semantic issues in field labels and menus
- [ ] Test all CRUD operations end-to-end after recent fixes
- [ ] Verify image uploads work across different file types/sizes

### Medium Priority (Polish)
- [ ] Add better form validation feedback
- [ ] Improve loading states throughout the app
- [ ] Improve responsive design for mobile devices
- [ ] Test authentication flow thoroughly

### Low Priority (Nice-to-Have)
- [ ] Add keyboard shortcuts for common actions

---

## 🗓️ Week Ahead Backlog

### Option B: Enhanced Features
- [ ] Implement folder organization system
- [ ] Add bulk operations (select multiple codes)
- [ ] Improve search with filters by version/tags
- [ ] Add export functionality (CSV, JSON)

### Option C: User Experience
- [ ] **Tag Autocomplete**: Add tag suggestions/autocomplete to reuse previously created tags (prevent duplicates like "oil painting" vs "oil-painting")
- [ ] Add drag-and-drop for image uploads
- [ ] Implement better image previews/zoom
- [ ] Add keyboard shortcuts
- [ ] Improve mobile responsiveness

### Option D: Data Management
- [ ] Add data backup/restore functionality
- [ ] Implement usage analytics
- [ ] Add code sharing features
- [ ] Create import from external sources

---

## 🏗️ Technical Architecture

### Current Stack
- **Frontend**: React + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth + Database + Storage)
- **Authentication**: OAuth (Google, Discord) + Email/Password
- **Database**: PostgreSQL via Supabase
- **State Management**: React Context + Custom hooks

### Key Files
- `src/contexts/AuthContext.tsx` - Authentication logic
- `src/components/generated/SREFManagementDashboard.tsx` - Main dashboard
- `src/components/sref/SREFCodeForm.tsx` - SREF creation/editing form
- `src/hooks/useSREFCodes.ts` - SREF data operations
- `src/lib/database.ts` - Database service layer

---

## 🔍 Questions for Next Session

1. **Specific Bugs**: What exact "buggy" behavior did you notice?
   - Form not clearing after submission?
   - Images not loading properly?
   - Edit modal behaving oddly?
   - Other UI glitches?

2. **Priority Areas**: Which polish items are most important to you?

3. **User Experience**: Any specific UX improvements you'd like to see?

---

## 📚 Resources & References

- **GitHub Repository**: https://github.com/JoshMormann/smc-manager
- **Supabase Project**: Connected and configured
- **Design System**: Shadcn/ui components
- **MidJourney Integration**: SREF codes for style references

---

*Last Updated: 2025-07-17*
*Recent Session: 2025-07-17 - Fixed Core Data Persistence & Image Upload Issues*
*Next Session: TBD - Focus on Final Polish & Testing*