import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthGate } from '../AuthGate';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

// Mock the hooks
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useUserProfile');

// Mock the generated login screen component
vi.mock('../generated/LoginScreen', () => ({
  default: () => <div>Login Screen</div>,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const mockUseAuth = vi.mocked(useAuth);
const mockUseUserProfile = vi.mocked(useUserProfile);

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

const mockProfile = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  tier: 'free',
  waitlist_status: 'approved',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('AuthGate', () => {
  const TestChild = () => <div data-testid="protected-content">Protected Content</div>;

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

    mockUseUserProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: null,
      refreshProfile: vi.fn(),
    });
  });

  describe('Loading states', () => {
    it('shows loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: true,
        isPasswordRecovery: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signInWithGoogle: vi.fn(),
        signInWithDiscord: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
      });

      render(
        <AuthGate>
          <TestChild />
        </AuthGate>
      );

      // Should show loading spinner
      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('login-screen')).not.toBeInTheDocument();
    });

    it('shows loading spinner when user profile is loading', () => {
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

      mockUseUserProfile.mockReturnValue({
        profile: null,
        loading: true,
        error: null,
        refreshProfile: vi.fn(),
      });

      render(
        <AuthGate>
          <TestChild />
        </AuthGate>
      );

      // Should show loading spinner
      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('login-screen')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated state', () => {
    it('shows login screen when user is not authenticated', () => {
      render(
        <AuthGate>
          <TestChild />
        </AuthGate>
      );

      // Should show login screen
      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('auth-loading')).not.toBeInTheDocument();
    });

    it('shows login screen when user exists but no profile', () => {
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

      mockUseUserProfile.mockReturnValue({
        profile: null,
        loading: false,
        error: 'Profile not found',
        refreshProfile: vi.fn(),
      });

      render(
        <AuthGate>
          <TestChild />
        </AuthGate>
      );

      // Should show login screen when profile is missing
      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated state', () => {
    it('shows protected content when user is authenticated and has profile', () => {
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

      mockUseUserProfile.mockReturnValue({
        profile: mockProfile,
        loading: false,
        error: null,
        refreshProfile: vi.fn(),
      });

      render(
        <AuthGate>
          <TestChild />
        </AuthGate>
      );

      // Should show protected content
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('login-screen')).not.toBeInTheDocument();
      expect(screen.queryByTestId('auth-loading')).not.toBeInTheDocument();
    });

    it('allows access for OAuth users without explicit profile', () => {
      const oauthUser = {
        ...mockUser,
        app_metadata: { provider: 'google' },
      };

      mockUseAuth.mockReturnValue({
        user: oauthUser,
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

      mockUseUserProfile.mockReturnValue({
        profile: null,
        loading: false,
        error: null,
        refreshProfile: vi.fn(),
      });

      render(
        <AuthGate>
          <TestChild />
        </AuthGate>
      );

      // Should show protected content for OAuth users even without profile
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('login-screen')).not.toBeInTheDocument();
    });
  });

  describe('Password recovery state', () => {
    it('shows login screen during password recovery', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: null,
        loading: false,
        isPasswordRecovery: true,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signInWithGoogle: vi.fn(),
        signInWithDiscord: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
      });

      mockUseUserProfile.mockReturnValue({
        profile: mockProfile,
        loading: false,
        error: null,
        refreshProfile: vi.fn(),
      });

      render(
        <AuthGate>
          <TestChild />
        </AuthGate>
      );

      // Should show login screen during password recovery
      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Profile error handling', () => {
    it('handles profile loading errors gracefully', () => {
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

      mockUseUserProfile.mockReturnValue({
        profile: null,
        loading: false,
        error: 'Network error',
        refreshProfile: vi.fn(),
      });

      render(
        <AuthGate>
          <TestChild />
        </AuthGate>
      );

      // Should show login screen when there's a profile error
      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Multiple children', () => {
    it('renders multiple children when authenticated', () => {
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

      mockUseUserProfile.mockReturnValue({
        profile: mockProfile,
        loading: false,
        error: null,
        refreshProfile: vi.fn(),
      });

      render(
        <AuthGate>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </AuthGate>
      );

      // Should render both children
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.queryByTestId('login-screen')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles null user gracefully', () => {
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

      render(
        <AuthGate>
          <TestChild />
        </AuthGate>
      );

      // Should show login screen for null user
      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('handles undefined profile gracefully', () => {
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

      mockUseUserProfile.mockReturnValue({
        profile: undefined as unknown as typeof mockProfile,
        loading: false,
        error: null,
        updateProfile: vi.fn(),
      });

      render(
        <AuthGate>
          <TestChild />
        </AuthGate>
      );

      // Should show login screen for undefined profile
      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});
