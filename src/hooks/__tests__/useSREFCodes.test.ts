import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSREFCodes } from '../useSREFCodes';
import { useAuth } from '../useAuth';
import { SREFCodeService } from '../../lib/database';
import { captureException } from '../../lib/sentry';

// Mock dependencies
vi.mock('../useAuth');
vi.mock('../../lib/database');
vi.mock('../../lib/sentry');

const mockUseAuth = vi.mocked(useAuth);
const mockSREFCodeService = vi.mocked(SREFCodeService);
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

const mockSREFCode = {
  id: 'sref-123',
  user_id: 'user-123',
  code_value: '--sref 123456789',
  title: 'Test SREF Code',
  sv_version: 6 as const,
  tags: ['landscape', 'nature'],
  images: [],
  folder_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('useSREFCodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth mock
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
      profile: null,
      updateProfile: vi.fn(),
      isAuthenticated: true,
      isAdmin: false,
      isMiner: false,
      isOnWaitlist: false,
    });

    // Default service mocks
    mockSREFCodeService.getUserSREFCodes = vi.fn();
    mockSREFCodeService.createSREFCode = vi.fn();
    mockSREFCodeService.updateSREFCode = vi.fn();
    mockSREFCodeService.deleteSREFCode = vi.fn();
    mockSREFCodeService.searchSREFCodes = vi.fn();
  });

  describe('Initial state and data fetching', () => {
    it('should initialize with correct default state', async () => {
      mockSREFCodeService.getUserSREFCodes.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useSREFCodes());

      // Wait for the initial fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.srefCodes).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should fetch SREF codes on mount when user is authenticated', async () => {
      const mockCodes = [mockSREFCode];
      mockSREFCodeService.getUserSREFCodes.mockResolvedValue({
        data: mockCodes,
        error: null,
      });

      const { result } = renderHook(() => useSREFCodes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSREFCodeService.getUserSREFCodes).toHaveBeenCalledWith('user-123');
      expect(result.current.srefCodes).toEqual(mockCodes);
      expect(result.current.error).toBe(null);
    });

    it('should not fetch when user is not authenticated', () => {
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
        profile: null,
        updateProfile: vi.fn(),
        isAuthenticated: false,
        isAdmin: false,
        isMiner: false,
        isOnWaitlist: false,
      });

      renderHook(() => useSREFCodes());

      expect(mockSREFCodeService.getUserSREFCodes).not.toHaveBeenCalled();
    });

    it('should handle fetch errors and capture exceptions', async () => {
      const mockError = new Error('Failed to fetch');
      mockSREFCodeService.getUserSREFCodes.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useSREFCodes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load SREF codes');
      expect(mockCaptureException).toHaveBeenCalledWith(mockError, {
        tags: { operation: 'fetch_sref_codes' },
        user: { id: 'user-123' },
      });
    });
  });

  describe('createSREFCode', () => {
    it('should create SREF code successfully', async () => {
      const newSREFCode = { ...mockSREFCode, id: 'new-sref' };
      mockSREFCodeService.createSREFCode.mockResolvedValue({
        data: newSREFCode,
        error: null,
      });

      const { result } = renderHook(() => useSREFCodes());

      let createResult;
      await act(async () => {
        createResult = await result.current.createSREFCode({
          code_value: '--sref 987654321',
          title: 'New SREF Code',
          sv_version: 4,
          tags: ['portrait'],
          images: [],
          folder_id: null,
        });
      });

      expect(createResult).toEqual({ success: true, data: newSREFCode });
      expect(mockSREFCodeService.createSREFCode).toHaveBeenCalledWith({
        code_value: '--sref 987654321',
        title: 'New SREF Code',
        sv_version: 4,
        tags: ['portrait'],
        images: [],
        folder_id: null,
        user_id: 'user-123',
      });
    });

    it('should return error when user is not authenticated', async () => {
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
        profile: null,
        updateProfile: vi.fn(),
        isAuthenticated: false,
        isAdmin: false,
        isMiner: false,
        isOnWaitlist: false,
      });

      const { result } = renderHook(() => useSREFCodes());

      let createResult;
      await act(async () => {
        createResult = await result.current.createSREFCode({
          code_value: '--sref 987654321',
          title: 'New SREF Code',
          sv_version: 4,
          tags: ['portrait'],
          images: [],
          folder_id: null,
        });
      });

      expect(createResult).toEqual({ success: false, error: 'User not authenticated' });
    });

    it('should handle create errors and capture exceptions', async () => {
      const mockError = new Error('Create failed');
      mockSREFCodeService.createSREFCode.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useSREFCodes());

      let createResult;
      await act(async () => {
        createResult = await result.current.createSREFCode({
          code_value: '--sref 987654321',
          title: 'New SREF Code',
          sv_version: 4,
          tags: ['portrait'],
          images: [],
          folder_id: null,
        });
      });

      expect(createResult).toEqual({ success: false, error: 'Failed to create SREF code' });
      expect(mockCaptureException).toHaveBeenCalledWith(mockError, {
        tags: { operation: 'create_sref_code' },
        user: { id: 'user-123' },
      });
    });
  });

  describe('updateSREFCode', () => {
    it('should update SREF code successfully', async () => {
      const updatedSREFCode = { ...mockSREFCode, title: 'Updated Title' };
      mockSREFCodeService.updateSREFCode.mockResolvedValue({
        data: updatedSREFCode,
        error: null,
      });

      // Set initial state with the original code
      mockSREFCodeService.getUserSREFCodes.mockResolvedValue({
        data: [mockSREFCode],
        error: null,
      });

      const { result } = renderHook(() => useSREFCodes());

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.srefCodes).toEqual([mockSREFCode]);
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateSREFCode('sref-123', {
          title: 'Updated Title',
        });
      });

      expect(updateResult).toEqual({ success: true, data: updatedSREFCode });
      expect(mockSREFCodeService.updateSREFCode).toHaveBeenCalledWith('sref-123', {
        title: 'Updated Title',
      });

      // Check that the state was updated
      expect(result.current.srefCodes[0].title).toBe('Updated Title');
    });

    it('should return error when user is not authenticated', async () => {
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
        profile: null,
        updateProfile: vi.fn(),
        isAuthenticated: false,
        isAdmin: false,
        isMiner: false,
        isOnWaitlist: false,
      });

      const { result } = renderHook(() => useSREFCodes());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateSREFCode('sref-123', {
          title: 'Updated Title',
        });
      });

      expect(updateResult).toEqual({ success: false, error: 'User not authenticated' });
    });
  });

  describe('deleteSREFCode', () => {
    it('should delete SREF code successfully', async () => {
      mockSREFCodeService.deleteSREFCode.mockResolvedValue({
        error: null,
      });

      // Set initial state with the code to be deleted
      mockSREFCodeService.getUserSREFCodes.mockResolvedValue({
        data: [mockSREFCode],
        error: null,
      });

      const { result } = renderHook(() => useSREFCodes());

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.srefCodes).toEqual([mockSREFCode]);
      });

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteSREFCode('sref-123');
      });

      expect(deleteResult).toEqual({ success: true });
      expect(mockSREFCodeService.deleteSREFCode).toHaveBeenCalledWith('sref-123');

      // Check that the code was removed from state
      expect(result.current.srefCodes).toEqual([]);
    });

    it('should return error when user is not authenticated', async () => {
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
        profile: null,
        updateProfile: vi.fn(),
        isAuthenticated: false,
        isAdmin: false,
        isMiner: false,
        isOnWaitlist: false,
      });

      const { result } = renderHook(() => useSREFCodes());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteSREFCode('sref-123');
      });

      expect(deleteResult).toEqual({ success: false, error: 'User not authenticated' });
    });
  });

  describe('searchSREFCodes', () => {
    it('should search SREF codes successfully', async () => {
      const searchResults = [mockSREFCode];
      mockSREFCodeService.searchSREFCodes.mockResolvedValue({
        data: searchResults,
        error: null,
      });

      const { result } = renderHook(() => useSREFCodes());

      await act(async () => {
        await result.current.searchSREFCodes('test query', ['landscape']);
      });

      expect(mockSREFCodeService.searchSREFCodes).toHaveBeenCalledWith('user-123', 'test query', [
        'landscape',
      ]);
      expect(result.current.srefCodes).toEqual(searchResults);
    });

    it('should not search when user is not authenticated', async () => {
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
        profile: null,
        updateProfile: vi.fn(),
        isAuthenticated: false,
        isAdmin: false,
        isMiner: false,
        isOnWaitlist: false,
      });

      const { result } = renderHook(() => useSREFCodes());

      await act(async () => {
        await result.current.searchSREFCodes('test query');
      });

      expect(mockSREFCodeService.searchSREFCodes).not.toHaveBeenCalled();
    });
  });

  describe('Utility functions', () => {
    it('should get SREF code by ID', async () => {
      // Set initial state
      mockSREFCodeService.getUserSREFCodes.mockResolvedValue({
        data: [mockSREFCode],
        error: null,
      });

      const { result } = renderHook(() => useSREFCodes());

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.srefCodes).toEqual([mockSREFCode]);
      });

      const foundCode = result.current.getSREFCodeById('sref-123');
      expect(foundCode).toEqual(mockSREFCode);

      const notFound = result.current.getSREFCodeById('nonexistent');
      expect(notFound).toBeUndefined();
    });

    it('should refresh SREF codes', async () => {
      const initialCodes = [mockSREFCode];
      const refreshedCodes = [{ ...mockSREFCode, title: 'Refreshed' }];

      mockSREFCodeService.getUserSREFCodes
        .mockResolvedValueOnce({ data: initialCodes, error: null })
        .mockResolvedValueOnce({ data: refreshedCodes, error: null });

      const { result } = renderHook(() => useSREFCodes());

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.srefCodes).toEqual(initialCodes);
      });

      await act(async () => {
        await result.current.refreshSREFCodes();
      });

      expect(result.current.srefCodes).toEqual(refreshedCodes);
      expect(mockSREFCodeService.getUserSREFCodes).toHaveBeenCalledTimes(2);
    });
  });
});
