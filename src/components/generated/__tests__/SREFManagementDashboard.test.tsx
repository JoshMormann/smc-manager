import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { useSREFCodes } from '@/hooks/useSREFCodes';
import { useTags } from '@/hooks/useTags';
import { useUserProfile } from '@/hooks/useUserProfile';
import SREFManagementDashboard from '../SREFManagementDashboard';

// Mock the hooks
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useSREFCodes');
vi.mock('@/hooks/useTags');
vi.mock('@/hooks/useUserProfile');

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    aside: 'aside',
    div: 'div',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the lazy component
vi.mock('@/components/sref/SREFEditModal', () => ({
  default: () => <div data-testid="sref-edit-modal">Edit Modal</div>,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const mockUseAuth = vi.mocked(useAuth);
const mockUseSREFCodes = vi.mocked(useSREFCodes);
const mockUseTags = vi.mocked(useTags);
const mockUseUserProfile = vi.mocked(useUserProfile);

// Mock data
const mockSREFCodes = [
  {
    id: '1',
    title: 'Test SREF Code',
    code_value: '--sref 1234567890',
    sv_version: 6,
    tags: ['test', 'cyberpunk'],
    images: [
      {
        id: '1',
        image_url: 'https://example.com/image1.jpg',
        position: 0,
      },
    ],
    user_id: 'user-1',
    copy_count: 0,
    upvotes: 0,
    downvotes: 0,
    save_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockTags = ['test', 'cyberpunk', 'neon'];

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  phone: '',
  confirmed_at: '2024-01-01T00:00:00Z',
  last_sign_in_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  is_anonymous: false,
};

describe('SREFManagementDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      isPasswordRecovery: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithDiscord: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });

    mockUseSREFCodes.mockReturnValue({
      srefCodes: [],
      loading: false,
      error: null,
      createSREFCode: vi.fn(),
      updateSREFCode: vi.fn(),
      deleteSREFCode: vi.fn(),
      refreshSREFCodes: vi.fn(),
      searchSREFCodes: vi.fn(),
      getSREFCodeById: vi.fn(),
    });

    mockUseTags.mockReturnValue({
      tags: [],
      loading: false,
      refreshTags: vi.fn(),
    });

    mockUseUserProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: null,
      refreshProfile: vi.fn(),
    });
  });

  describe('Unauthenticated state', () => {
    it('renders the dashboard with mock data for unauthenticated users', () => {
      render(<SREFManagementDashboard />);

      // Should render the sidebar
      expect(screen.getByText('SREF Manager')).toBeInTheDocument();

      // Should render navigation items
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Folder Tree')).toBeInTheDocument();
      expect(screen.getByText('Packs')).toBeInTheDocument();
      expect(screen.getByText('Discover')).toBeInTheDocument();

      // Should render search bar
      expect(screen.getByPlaceholderText('Search SREF codes...')).toBeInTheDocument();

      // Should render default mock SREF codes
      expect(screen.getByText("90's comic book")).toBeInTheDocument();
      expect(screen.getByText('Cyberpunk neon')).toBeInTheDocument();
      expect(screen.getByText('Vintage photography')).toBeInTheDocument();
    });

    it('should not show authenticated-only features for unauthenticated users', () => {
      render(<SREFManagementDashboard />);

      // Should not show the Add SREF Code button
      expect(screen.queryByText('Add SREF Code')).not.toBeInTheDocument();

      // Should not show sign out button
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();

      // Should not show debug panel toggle
      expect(screen.queryByText('Show Storage Debug Panel')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: null,
        loading: false,
        isPasswordRecovery: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signInWithGoogle: vi.fn(),
        signInWithDiscord: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
      });

      mockUseSREFCodes.mockReturnValue({
        srefCodes: mockSREFCodes,
        loading: false,
        error: null,
        createSREFCode: vi.fn(),
        updateSREFCode: vi.fn(),
        deleteSREFCode: vi.fn(),
        refreshSREFCodes: vi.fn(),
        searchSREFCodes: vi.fn(),
        getSREFCodeById: vi.fn(),
      });

      mockUseTags.mockReturnValue({
        tags: mockTags,
        loading: false,
        refreshTags: vi.fn(),
      });
    });

    it('renders authenticated features', () => {
      render(<SREFManagementDashboard />);

      // Should show the Add SREF Code button
      expect(screen.getByText('Add SREF Code')).toBeInTheDocument();

      // Should show user email
      expect(screen.getByText('test@example.com')).toBeInTheDocument();

      // Should show sign out button
      expect(screen.getByText('Sign Out')).toBeInTheDocument();

      // Should show debug panel toggle
      expect(screen.getByText('Show Storage Debug Panel')).toBeInTheDocument();
    });

    it('renders real SREF codes for authenticated users', () => {
      render(<SREFManagementDashboard />);

      // Should render the real SREF code from mock data
      expect(screen.getByText('Test SREF Code')).toBeInTheDocument();
      expect(screen.getByText('--sref 1234567890')).toBeInTheDocument();
      expect(screen.getByText('SV6')).toBeInTheDocument();
    });

    it('renders tag filters from real data', () => {
      render(<SREFManagementDashboard />);

      // Should render tags from mock data
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('cyberpunk')).toBeInTheDocument();
      expect(screen.getByText('neon')).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: null,
        loading: false,
        isPasswordRecovery: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signInWithGoogle: vi.fn(),
        signInWithDiscord: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
      });

      mockUseSREFCodes.mockReturnValue({
        srefCodes: mockSREFCodes,
        loading: false,
        error: null,
        createSREFCode: vi.fn(),
        updateSREFCode: vi.fn(),
        deleteSREFCode: vi.fn(),
        refreshSREFCodes: vi.fn(),
        searchSREFCodes: vi.fn(),
        getSREFCodeById: vi.fn(),
      });
    });

    it('filters SREF codes based on search query', async () => {
      render(<SREFManagementDashboard />);

      const searchInput = screen.getByPlaceholderText('Search SREF codes...');

      // Initially should show the SREF code
      expect(screen.getByText('Test SREF Code')).toBeInTheDocument();

      // Search for something that doesn't match
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.queryByText('Test SREF Code')).not.toBeInTheDocument();
      });

      // Search for something that matches the title
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      await waitFor(() => {
        expect(screen.getByText('Test SREF Code')).toBeInTheDocument();
      });

      // Search for something that matches the code value
      fireEvent.change(searchInput, { target: { value: '1234567890' } });

      await waitFor(() => {
        expect(screen.getByText('Test SREF Code')).toBeInTheDocument();
      });
    });
  });

  describe('Tag filtering', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: null,
        loading: false,
        isPasswordRecovery: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signInWithGoogle: vi.fn(),
        signInWithDiscord: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
      });

      mockUseSREFCodes.mockReturnValue({
        srefCodes: mockSREFCodes,
        loading: false,
        error: null,
        createSREFCode: vi.fn(),
        updateSREFCode: vi.fn(),
        deleteSREFCode: vi.fn(),
        refreshSREFCodes: vi.fn(),
        searchSREFCodes: vi.fn(),
        getSREFCodeById: vi.fn(),
      });

      mockUseTags.mockReturnValue({
        tags: mockTags,
        loading: false,
        refreshTags: vi.fn(),
      });
    });

    it('filters SREF codes based on selected tags', async () => {
      render(<SREFManagementDashboard />);

      // Initially should show the SREF code
      expect(screen.getByText('Test SREF Code')).toBeInTheDocument();

      // Click on a tag that the SREF code has
      const testTag = screen.getByText('test');
      fireEvent.click(testTag);

      await waitFor(() => {
        // Should still show the SREF code because it has the 'test' tag
        expect(screen.getByText('Test SREF Code')).toBeInTheDocument();
      });

      // Click on a tag that the SREF code doesn't have
      const neonTag = screen.getByText('neon');
      fireEvent.click(neonTag);

      await waitFor(() => {
        // Should not show the SREF code because it doesn't have the 'neon' tag
        expect(screen.queryByText('Test SREF Code')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading states', () => {
    it('shows loading skeleton when SREF codes are loading', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: null,
        loading: false,
        isPasswordRecovery: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signInWithGoogle: vi.fn(),
        signInWithDiscord: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
      });

      mockUseSREFCodes.mockReturnValue({
        srefCodes: [],
        loading: true,
        error: null,
        createSREFCode: vi.fn(),
        updateSREFCode: vi.fn(),
        deleteSREFCode: vi.fn(),
        refreshSREFCodes: vi.fn(),
        searchSREFCodes: vi.fn(),
        getSREFCodeById: vi.fn(),
      });

      render(<SREFManagementDashboard />);

      // Should show loading skeletons (they don't have explicit test IDs, so we check for skeleton class)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error states', () => {
    it('shows error message when there is an error loading SREF codes', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: null,
        loading: false,
        isPasswordRecovery: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signInWithGoogle: vi.fn(),
        signInWithDiscord: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
      });

      mockUseSREFCodes.mockReturnValue({
        srefCodes: [],
        loading: false,
        error: 'Failed to load SREF codes',
        createSREFCode: vi.fn(),
        updateSREFCode: vi.fn(),
        deleteSREFCode: vi.fn(),
        refreshSREFCodes: vi.fn(),
        searchSREFCodes: vi.fn(),
        getSREFCodeById: vi.fn(),
      });

      render(<SREFManagementDashboard />);

      // Should show error message
      expect(screen.getByText('Failed to load SREF codes')).toBeInTheDocument();
    });
  });

  describe('Sidebar functionality', () => {
    it('can toggle sidebar collapsed state', async () => {
      render(<SREFManagementDashboard />);

      // Find the toggle button (X icon when expanded)
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(toggleButton);

      // The sidebar should still be there but the text content might be hidden
      // We can test this by checking if the full navigation items are still visible
      await waitFor(() => {
        // When collapsed, text might be hidden but icons should still be there
        expect(screen.getByText('SREF Manager')).toBeInTheDocument();
      });
    });
  });

  describe('Empty states', () => {
    it('shows empty state when no SREF codes match filters', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: null,
        loading: false,
        isPasswordRecovery: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signInWithGoogle: vi.fn(),
        signInWithDiscord: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
      });

      mockUseSREFCodes.mockReturnValue({
        srefCodes: [],
        loading: false,
        error: null,
        createSREFCode: vi.fn(),
        updateSREFCode: vi.fn(),
        deleteSREFCode: vi.fn(),
        refreshSREFCodes: vi.fn(),
        searchSREFCodes: vi.fn(),
        getSREFCodeById: vi.fn(),
      });

      render(<SREFManagementDashboard />);

      // Should show empty state message
      expect(screen.getByText('No SREF codes found')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Get started by adding your first SREF code to organize your style references.'
        )
      ).toBeInTheDocument();
    });
  });
});
