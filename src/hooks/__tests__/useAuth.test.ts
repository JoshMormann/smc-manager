import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { useAuth as useAuthContext } from '../../contexts/AuthContext';
import { useUserProfile } from '../useUserProfile';
import { captureException } from '../../lib/sentry';

// Mock dependencies
vi.mock('../../contexts/AuthContext');
vi.mock('../useUserProfile');
vi.mock('../../lib/sentry');

const mockUseAuthContext = vi.mocked(useAuthContext);
const mockUseUserProfile = vi.mocked(useUserProfile);
const mockCaptureException = vi.mocked(captureException);

const mockUser = {
  id: 'user-123',
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
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  tier: 'free' as const,
  waitlist_status: 'approved' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockAuthFunctions = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithDiscord: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth context mock
    mockUseAuthContext.mockReturnValue({
      user: mockUser,
      session: null,
      loading: false,
      isPasswordRecovery: false,
      ...mockAuthFunctions,
    });

    // Default user profile mock
    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      refreshProfile: vi.fn(),
      updateProfile: vi.fn(),
    });

    // Reset all auth function mocks
    Object.values(mockAuthFunctions).forEach(fn => {
      fn.mockResolvedValue({ error: null });
    });
  });

  describe('Basic functionality', () => {
    it('should return all auth context properties', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.isPasswordRecovery).toBe(false);
      expect(result.current.profile).toEqual(mockProfile);
    });

    it('should calculate computed properties correctly', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isMiner).toBe(false);
      expect(result.current.isOnWaitlist).toBe(false);
    });

    it('should handle unauthenticated state', () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        session: null,
        loading: false,
        isPasswordRecovery: false,
        ...mockAuthFunctions,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isMiner).toBe(false);
      expect(result.current.isOnWaitlist).toBe(false);
    });

    it('should handle admin profile correctly', () => {
      mockUseUserProfile.mockReturnValue({
        profile: { ...mockProfile, tier: 'admin' },
        loading: false,
        error: null,
        refreshProfile: vi.fn(),
        updateProfile: vi.fn(),
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isMiner).toBe(false);
    });

    it('should handle miner profile correctly', () => {
      mockUseUserProfile.mockReturnValue({
        profile: { ...mockProfile, tier: 'miner' },
        loading: false,
        error: null,
        refreshProfile: vi.fn(),
        updateProfile: vi.fn(),
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isMiner).toBe(true);
    });

    it('should handle waitlist status correctly', () => {
      mockUseUserProfile.mockReturnValue({
        profile: { ...mockProfile, waitlist_status: 'pending' },
        loading: false,
        error: null,
        refreshProfile: vi.fn(),
        updateProfile: vi.fn(),
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isOnWaitlist).toBe(true);
    });
  });

  describe('Authentication methods', () => {
    it('should handle successful sign in', async () => {
      const mockResult = { error: null };
      mockAuthFunctions.signIn.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockAuthFunctions.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(signInResult).toEqual(mockResult);
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should handle sign in error and capture exception', async () => {
      const mockError = new Error('Invalid credentials');
      const mockResult = { error: mockError };
      mockAuthFunctions.signIn.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrongpassword');
      });

      expect(signInResult).toEqual(mockResult);
      expect(mockCaptureException).toHaveBeenCalledWith(mockError, {
        tags: { action: 'sign_in' },
        extra: { email: 'test@example.com' },
      });
    });

    it('should handle successful sign up', async () => {
      const mockResult = { error: null };
      mockAuthFunctions.signUp.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123', 'testuser');
      });

      expect(mockAuthFunctions.signUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'testuser'
      );
      expect(signUpResult).toEqual(mockResult);
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should handle sign up error and capture exception', async () => {
      const mockError = new Error('Email already exists');
      const mockResult = { error: mockError };
      mockAuthFunctions.signUp.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123', 'testuser');
      });

      expect(signUpResult).toEqual(mockResult);
      expect(mockCaptureException).toHaveBeenCalledWith(mockError, {
        tags: { action: 'sign_up' },
        extra: { email: 'test@example.com', username: 'testuser' },
      });
    });

    it('should handle successful Google sign in', async () => {
      const mockResult = { error: null };
      mockAuthFunctions.signInWithGoogle.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signInWithGoogle();
      });

      expect(mockAuthFunctions.signInWithGoogle).toHaveBeenCalled();
      expect(signInResult).toEqual(mockResult);
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should handle Google sign in error and capture exception', async () => {
      const mockError = new Error('Google auth failed');
      const mockResult = { error: mockError };
      mockAuthFunctions.signInWithGoogle.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signInWithGoogle();
      });

      expect(signInResult).toEqual(mockResult);
      expect(mockCaptureException).toHaveBeenCalledWith(mockError, {
        tags: { action: 'sign_in_google' },
      });
    });

    it('should handle successful Discord sign in', async () => {
      const mockResult = { error: null };
      mockAuthFunctions.signInWithDiscord.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signInWithDiscord();
      });

      expect(mockAuthFunctions.signInWithDiscord).toHaveBeenCalled();
      expect(signInResult).toEqual(mockResult);
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should handle Discord sign in error and capture exception', async () => {
      const mockError = new Error('Discord auth failed');
      const mockResult = { error: mockError };
      mockAuthFunctions.signInWithDiscord.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signInWithDiscord();
      });

      expect(signInResult).toEqual(mockResult);
      expect(mockCaptureException).toHaveBeenCalledWith(mockError, {
        tags: { action: 'sign_in_discord' },
      });
    });

    it('should handle successful sign out', async () => {
      const mockResult = { error: null };
      mockAuthFunctions.signOut.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signOutResult;
      await act(async () => {
        signOutResult = await result.current.signOut();
      });

      expect(mockAuthFunctions.signOut).toHaveBeenCalled();
      expect(signOutResult).toEqual(mockResult);
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should handle sign out error and capture exception', async () => {
      const mockError = new Error('Sign out failed');
      const mockResult = { error: mockError };
      mockAuthFunctions.signOut.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signOutResult;
      await act(async () => {
        signOutResult = await result.current.signOut();
      });

      expect(signOutResult).toEqual(mockResult);
      expect(mockCaptureException).toHaveBeenCalledWith(mockError, {
        tags: { action: 'sign_out' },
      });
    });
  });

  describe('Password management', () => {
    it('should handle successful password reset', async () => {
      const mockResult = { error: null };
      mockAuthFunctions.resetPassword.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com');
      });

      expect(mockAuthFunctions.resetPassword).toHaveBeenCalledWith('test@example.com');
      expect(resetResult).toEqual(mockResult);
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should handle password reset error and capture exception', async () => {
      const mockError = new Error('Invalid email');
      const mockResult = { error: mockError };
      mockAuthFunctions.resetPassword.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('invalid@example.com');
      });

      expect(resetResult).toEqual(mockResult);
      expect(mockCaptureException).toHaveBeenCalledWith(mockError, {
        tags: { action: 'reset_password' },
        extra: { email: 'invalid@example.com' },
      });
    });

    it('should handle successful password update', async () => {
      const mockResult = { error: null };
      mockAuthFunctions.updatePassword.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updatePassword('newpassword123');
      });

      expect(mockAuthFunctions.updatePassword).toHaveBeenCalledWith('newpassword123');
      expect(updateResult).toEqual(mockResult);
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should handle password update error and capture exception', async () => {
      const mockError = new Error('Password too weak');
      const mockResult = { error: mockError };
      mockAuthFunctions.updatePassword.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updatePassword('weak');
      });

      expect(updateResult).toEqual(mockResult);
      expect(mockCaptureException).toHaveBeenCalledWith(mockError, {
        tags: { action: 'update_password' },
      });
    });
  });

  describe('Profile management', () => {
    it('should handle successful profile update', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue({ error: null });
      mockUseUserProfile.mockReturnValue({
        profile: mockProfile,
        loading: false,
        error: null,
        refreshProfile: vi.fn(),
        updateProfile: mockUpdateProfile,
      });

      const { result } = renderHook(() => useAuth());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateProfile({ username: 'newusername' });
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith({ username: 'newusername' });
      expect(updateResult).toEqual({ error: null });
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should handle profile update error and capture exception', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue({ error: 'Username already taken' });
      mockUseUserProfile.mockReturnValue({
        profile: mockProfile,
        loading: false,
        error: null,
        refreshProfile: vi.fn(),
        updateProfile: mockUpdateProfile,
      });

      const { result } = renderHook(() => useAuth());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateProfile({ username: 'taken' });
      });

      expect(updateResult).toEqual({ error: new Error('Username already taken') });
      expect(mockCaptureException).toHaveBeenCalledWith(new Error('Username already taken'), {
        tags: { action: 'update_profile' },
        extra: { updates: { username: 'taken' } },
      });
    });
  });

  describe('Exception handling', () => {
    it('should handle thrown exceptions during sign in', async () => {
      const thrownError = new Error('Network error');
      mockAuthFunctions.signIn.mockRejectedValue(thrownError);

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signIn('test@example.com', 'password123');
        })
      ).rejects.toThrow('Network error');

      expect(mockCaptureException).toHaveBeenCalledWith(thrownError, {
        tags: { action: 'sign_in' },
        extra: { email: 'test@example.com' },
      });
    });

    it('should handle thrown exceptions during profile update', async () => {
      const thrownError = new Error('Database error');
      const mockUpdateProfile = vi.fn().mockRejectedValue(thrownError);
      mockUseUserProfile.mockReturnValue({
        profile: mockProfile,
        loading: false,
        error: null,
        refreshProfile: vi.fn(),
        updateProfile: mockUpdateProfile,
      });

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.updateProfile({ username: 'newusername' });
        })
      ).rejects.toThrow('Database error');

      expect(mockCaptureException).toHaveBeenCalledWith(thrownError, {
        tags: { action: 'update_profile' },
        extra: { updates: { username: 'newusername' } },
      });
    });
  });
});
