# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Key Development Notes

- This is a React 19 + TypeScript + Vite project
- Uses Tailwind CSS 4.0 with Radix UI components
- Development server runs on http://localhost:5173
- Build process requires TypeScript compilation before Vite build

## Architecture Overview

### Core Application Structure

This is a **SREF (Style Reference) Manager** for AI image generation codes. The application allows users to manage, organize, and share SREF codes with visual reference images.

### Authentication & User Management

- **AuthContext** (`src/contexts/AuthContext.tsx`) - Central authentication state management
- **AuthGate** (`src/components/auth/AuthGate.tsx`) - Route protection component
- **Multi-provider auth**: Email/password, Google OAuth, Discord OAuth
- **User Profile System**: Automatic profile creation in `users` table linked to Supabase auth
- **Profile Creation Logic**: Email users get profiles created automatically if missing during sign-in

### Database Layer (Supabase)

- **Database Service** (`src/lib/database.ts`) - Main data layer with `SREFCodeService` class
- **Schema** (`supabase/schema.sql`) - Core tables: `users`, `sref_codes`, `code_images`, `code_tags`, `folders`
- **Type System** (`src/types/database.ts`) - Auto-generated Supabase types
- **Key Relationships**:
  - Users → SREF Codes (one-to-many)
  - SREF Codes → Images (one-to-many, with position ordering)
  - SREF Codes → Tags (many-to-many through junction table)

### Data Management Patterns

- **useSREFCodes hook** (`src/hooks/useSREFCodes.ts`) - Main data management hook
- **Return Pattern**: All database operations return `{ success: boolean, data?: T, error?: string }`
- **Error Handling**: Comprehensive error catching with Sentry integration
- **Auto-refresh**: UI updates immediately after CRUD operations

### Storage & Image Management

- **StorageService** (`src/lib/storage.ts`) - Handles image uploads to Supabase Storage
- **useImageUpload hook** (`src/hooks/useImageUpload.ts`) - Image upload state management
- **Bucket**: `code-images` bucket for reference images
- **Image Organization**: Files stored as `{userId}/{timestamp}_{random}.{ext}`
- **Progress Tracking**: Upload progress monitoring and error handling

### Component Architecture

- **Main Dashboard** (`src/components/generated/SREFManagementDashboard.tsx`) - Primary interface
- **Form Components** (`src/components/sref/SREFCodeForm.tsx`) - Create/edit SREF codes
- **Generated Components** (`src/components/generated/`) - UI components for cards, modals, navigation
- **UI Components** (`src/components/ui/`) - Radix UI + Tailwind components

### State Management

- **Context-based**: React Context for auth state
- **Hook-based**: Custom hooks for data fetching and mutations
- **Local State**: Component-level state for UI interactions
- **No external state library**: Uses React's built-in state management

### Error Handling & Monitoring

- **Sentry Integration** (`src/lib/sentry.ts`) - Error tracking and monitoring
- **Toast Notifications** - Sonner for user feedback (10s duration, Y-axis stacking)
- **Comprehensive Logging**: All database operations logged with operation tags

### Key Business Logic

- **SREF Code Structure**: Contains `code_value` (the actual --sref command), `title`, `sv_version` (4 or 6), `tags`, and `images`
- **Image Upload Flow**: Upload images first, then create/update SREF code with image URLs
- **Version Support**: Midjourney Style Version 4 and 6 support
- **Copy Functionality**: One-click copying of SREF codes to clipboard

### Development Patterns

- **TypeScript**: Strict typing with database schema integration
- **Component Organization**: Separate folders for auth, sref-specific, generated, and UI components
- **Hook Pattern**: Custom hooks for all data operations
- **Error Boundaries**: Comprehensive error handling at service level
- **Async/Await**: Consistent async patterns throughout

### Environment & Configuration

- **Supabase**: Backend as a Service for database and storage
- **Theme System** (`src/settings/theme.ts`) - Dark/light mode support
- **Config Files**: Storage configuration in `src/config/storage.ts`

### Recent Fixes (Session 2025-07-17/18)

- **Form Error Handling**: Fixed SREF save operations with proper success/error response handling
- **Image Upload**: Resolved bucket name mismatch and duplicate upload issues
- **Authentication**: Fixed infinite loading loop for users without profiles
- **Build Issues**: Resolved all TypeScript compilation errors
- **Profile Creation**: Auto-create profiles for email users during sign-in

This architecture supports a full-featured SREF management system with robust error handling, real-time updates, and comprehensive image management capabilities.

## Design System & Code Standards

### CVA (Class Variance Authority) Usage

The project uses CVA for consistent component styling. **ALWAYS use CVA variants instead of inline styles**.

**✅ DO:**

```jsx
// Use CVA variants from src/components/ui/variants.ts
<button className={sidebarNavVariants({ variant: 'primary', shape: 'pill' })}>
<Badge variant="secondary" className="py-px">  // Only override specific properties
```

**❌ DON'T:**

```jsx
// Don't use inline styles that bypass the design system
<button className="flex items-center gap-3 p-3 text-sm rounded-md hover:bg-accent">
<Badge className="px-4 py-2 text-lg rounded-full bg-blue-500">  // Recreating variants
```

### Available CVA Variants

- **buttonVariants**: Standard buttons with variants (default, destructive, outline, secondary, ghost, link) and sizes (default, sm, lg, icon)
- **badgeVariants**: Tags/badges with variants (default, secondary, destructive, outline)
- **sidebarNavVariants**: Sidebar navigation buttons with variants (primary, secondary), sizes (default, compact), shapes (rounded, pill), and weights (normal, bold)
- **toggleVariants**: Toggle buttons for interactive states

### Styling Rules

1. **Use CVA variants first** - Check `src/components/ui/variants.ts` before writing custom styles
2. **Minimal overrides only** - Use `className` prop only for minor adjustments (e.g., `py-px` for padding tweaks)
3. **No inline Tailwind combinations** - Don't recreate button/badge/nav patterns with raw Tailwind classes
4. **Animation exceptions** - Animation values (Framer Motion) can remain hardcoded for reliability
5. **Typography consistency** - Use established text sizes: `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px)

### Adding New Variants

When you need a new component style:

1. Add it to `variants.ts` using the CVA pattern
2. Update this documentation
3. Refactor any existing inline styles to use the new variant

### Common Violations to Avoid

- Creating "one-off" button styles instead of extending variants
- Using arbitrary Tailwind combinations like `flex items-center gap-3 p-3 text-sm rounded-md transition-colors`
- Duplicating styles across multiple components
- Mixing CVA variants with extensive className overrides
