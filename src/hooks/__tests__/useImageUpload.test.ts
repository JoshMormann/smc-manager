import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageUpload } from '../useImageUpload';
import { useAuth } from '../useAuth';
import { StorageService } from '../../lib/storage';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../useAuth');
vi.mock('../../lib/storage');
vi.mock('sonner');

const mockUseAuth = vi.mocked(useAuth);
const mockStorageService = vi.mocked(StorageService);
const mockToast = vi.mocked(toast);

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

const mockUploadedImage = {
  url: 'https://example.com/image.jpg',
  path: 'user-123/image.jpg',
  filename: 'image.jpg',
  size: 1024000,
  type: 'image/jpeg',
};

const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

describe('useImageUpload', () => {
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

    // Default storage service mocks
    mockStorageService.uploadImage = vi.fn();
    mockStorageService.uploadImages = vi.fn();
    mockStorageService.deleteImage = vi.fn();
    mockStorageService.compressImage = vi.fn();
    mockStorageService.getOptimizedImageUrl = vi.fn();

    // Default toast mocks
    mockToast.success = vi.fn();
    mockToast.error = vi.fn();
    mockToast.info = vi.fn();
  });

  describe('Initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useImageUpload());

      expect(result.current.uploading).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBe(null);
      expect(result.current.uploadedImages).toEqual([]);
    });
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      mockStorageService.uploadImage.mockResolvedValue({
        data: mockUploadedImage,
        error: null,
      });

      const { result } = renderHook(() => useImageUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadImage(mockFile);
      });

      expect(mockStorageService.uploadImage).toHaveBeenCalledWith(
        mockFile,
        'user-123',
        expect.any(Function)
      );
      expect(uploadResult).toEqual(mockUploadedImage);
      expect(result.current.uploadedImages).toEqual([mockUploadedImage]);
      expect(mockToast.success).toHaveBeenCalledWith('test.jpg uploaded successfully');
      expect(result.current.uploading).toBe(false);
    });

    it('should return null when user is not authenticated', async () => {
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

      const { result } = renderHook(() => useImageUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadImage(mockFile);
      });

      expect(uploadResult).toBe(null);
      expect(result.current.error).toBe('User not authenticated');
      expect(mockToast.error).toHaveBeenCalledWith('Please log in to upload images');
      expect(mockStorageService.uploadImage).not.toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      const uploadError = 'Upload failed: File too large';
      mockStorageService.uploadImage.mockResolvedValue({
        data: null,
        error: uploadError,
      });

      const { result } = renderHook(() => useImageUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadImage(mockFile);
      });

      expect(uploadResult).toBe(null);
      expect(result.current.error).toBe(uploadError);
      expect(mockToast.error).toHaveBeenCalledWith(`Upload failed: ${uploadError}`);
      expect(result.current.uploadedImages).toEqual([]);
    });

    it('should handle thrown exceptions', async () => {
      const thrownError = new Error('Network error');
      mockStorageService.uploadImage.mockRejectedValue(thrownError);

      const { result } = renderHook(() => useImageUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadImage(mockFile);
      });

      expect(uploadResult).toBe(null);
      expect(result.current.error).toBe('Network error');
      expect(mockToast.error).toHaveBeenCalledWith('Network error');
    });

    it('should handle unknown error types', async () => {
      mockStorageService.uploadImage.mockRejectedValue('String error');

      const { result } = renderHook(() => useImageUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadImage(mockFile);
      });

      expect(uploadResult).toBe(null);
      expect(result.current.error).toBe('Upload failed');
      expect(mockToast.error).toHaveBeenCalledWith('Upload failed');
    });
  });

  describe('uploadImages', () => {
    it('should upload multiple images successfully', async () => {
      const files = [mockFile, new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })];
      const uploadedImages = [
        mockUploadedImage,
        { ...mockUploadedImage, filename: 'test2.jpg', url: 'https://example.com/test2.jpg' },
      ];

      mockStorageService.uploadImages.mockResolvedValue({
        data: uploadedImages,
        errors: [],
      });

      const { result } = renderHook(() => useImageUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadImages(files);
      });

      expect(mockStorageService.uploadImages).toHaveBeenCalledWith(
        files,
        'user-123',
        expect.any(Function)
      );
      expect(uploadResult).toEqual(uploadedImages);
      expect(result.current.uploadedImages).toEqual(uploadedImages);
      expect(mockToast.success).toHaveBeenCalledWith('2 image(s) uploaded successfully');
    });

    it('should return empty array when user is not authenticated', async () => {
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

      const { result } = renderHook(() => useImageUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadImages([mockFile]);
      });

      expect(uploadResult).toEqual([]);
      expect(result.current.error).toBe('User not authenticated');
      expect(mockToast.error).toHaveBeenCalledWith('Please log in to upload images');
    });

    it('should handle partial upload failures', async () => {
      const files = [mockFile, new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })];
      mockStorageService.uploadImages.mockResolvedValue({
        data: [mockUploadedImage],
        errors: ['Upload failed for test2.jpg'],
      });

      const { result } = renderHook(() => useImageUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadImages(files);
      });

      expect(uploadResult).toEqual([mockUploadedImage]);
      expect(result.current.uploadedImages).toEqual([mockUploadedImage]);
      expect(mockToast.error).toHaveBeenCalledWith(
        '1 upload(s) failed: Upload failed for test2.jpg'
      );
      expect(mockToast.success).toHaveBeenCalledWith('1 image(s) uploaded successfully');
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      mockStorageService.deleteImage.mockResolvedValue({
        success: true,
        error: null,
      });

      // Set initial state with an image
      const { result } = renderHook(() => useImageUpload());
      act(() => {
        result.current.uploadedImages.push(mockUploadedImage);
      });

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteImage('image.jpg');
      });

      expect(mockStorageService.deleteImage).toHaveBeenCalledWith('image.jpg');
      expect(deleteResult).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith('Image deleted successfully');
    });

    it('should handle delete errors', async () => {
      const deleteError = 'File not found';
      mockStorageService.deleteImage.mockResolvedValue({
        success: false,
        error: deleteError,
      });

      const { result } = renderHook(() => useImageUpload());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteImage('nonexistent.jpg');
      });

      expect(deleteResult).toBe(false);
      expect(result.current.error).toBe(deleteError);
      expect(mockToast.error).toHaveBeenCalledWith(`Delete failed: ${deleteError}`);
    });

    it('should handle thrown exceptions during delete', async () => {
      const thrownError = new Error('Network error');
      mockStorageService.deleteImage.mockRejectedValue(thrownError);

      const { result } = renderHook(() => useImageUpload());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteImage('image.jpg');
      });

      expect(deleteResult).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(mockToast.error).toHaveBeenCalledWith('Network error');
    });
  });

  describe('compressAndUpload', () => {
    it('should compress and upload image successfully', async () => {
      const compressedFile = new File(['compressed'], 'compressed.jpg', { type: 'image/jpeg' });
      mockStorageService.compressImage.mockResolvedValue(compressedFile);
      mockStorageService.uploadImage.mockResolvedValue({
        data: mockUploadedImage,
        error: null,
      });

      const { result } = renderHook(() => useImageUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.compressAndUpload(mockFile);
      });

      expect(mockStorageService.compressImage).toHaveBeenCalledWith(mockFile);
      expect(mockStorageService.uploadImage).toHaveBeenCalledWith(
        compressedFile,
        'user-123',
        expect.any(Function)
      );
      expect(uploadResult).toEqual(mockUploadedImage);
      expect(mockToast.info).toHaveBeenCalledWith('Compressing image...');
      expect(mockToast.success).toHaveBeenCalledWith(
        'test.jpg compressed and uploaded successfully'
      );
    });

    it('should return null when user is not authenticated', async () => {
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

      const { result } = renderHook(() => useImageUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.compressAndUpload(mockFile);
      });

      expect(uploadResult).toBe(null);
      expect(result.current.error).toBe('User not authenticated');
      expect(mockToast.error).toHaveBeenCalledWith('Please log in to upload images');
    });

    it('should handle compression and upload errors', async () => {
      const compressedFile = new File(['compressed'], 'compressed.jpg', { type: 'image/jpeg' });
      mockStorageService.compressImage.mockResolvedValue(compressedFile);
      mockStorageService.uploadImage.mockResolvedValue({
        data: null,
        error: 'Upload failed',
      });

      const { result } = renderHook(() => useImageUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.compressAndUpload(mockFile);
      });

      expect(uploadResult).toBe(null);
      expect(result.current.error).toBe('Upload failed');
      expect(mockToast.error).toHaveBeenCalledWith('Upload failed: Upload failed');
    });
  });

  describe('Utility functions', () => {
    it('should clear uploads', () => {
      const { result } = renderHook(() => useImageUpload());

      // Set some initial state
      act(() => {
        result.current.uploadedImages.push(mockUploadedImage);
        result.current.error = 'Some error';
        result.current.progress = 50;
      });

      act(() => {
        result.current.clearUploads();
      });

      expect(result.current.uploadedImages).toEqual([]);
      expect(result.current.error).toBe(null);
      expect(result.current.progress).toBe(0);
    });

    it('should get optimized URL', () => {
      mockStorageService.getOptimizedImageUrl.mockReturnValue('https://example.com/optimized.jpg');

      const { result } = renderHook(() => useImageUpload());

      const optimizedUrl = result.current.getOptimizedUrl('image.jpg', {
        width: 300,
        height: 200,
        quality: 80,
      });

      expect(mockStorageService.getOptimizedImageUrl).toHaveBeenCalledWith('image.jpg', {
        width: 300,
        height: 200,
        quality: 80,
      });
      expect(optimizedUrl).toBe('https://example.com/optimized.jpg');
    });
  });

  describe('Progress handling', () => {
    it('should handle progress updates during upload', async () => {
      mockStorageService.uploadImage.mockImplementation(async (file, userId, onProgress) => {
        // Simulate some progress during upload
        onProgress({ progress: 25, isUploading: true, error: null });
        onProgress({ progress: 75, isUploading: true, error: null });
        onProgress({ progress: 100, isUploading: false, error: null });
        return { data: mockUploadedImage, error: null };
      });

      const { result } = renderHook(() => useImageUpload());

      await act(async () => {
        await result.current.uploadImage(mockFile);
      });

      // Progress should be 100 after completion
      expect(result.current.progress).toBe(100);
      expect(result.current.uploading).toBe(false);
    });

    it('should handle progress errors', async () => {
      mockStorageService.uploadImage.mockImplementation(async (file, userId, onProgress) => {
        // Simulate progress error
        onProgress({ progress: 50, isUploading: false, error: 'Upload interrupted' });
        return { data: mockUploadedImage, error: null };
      });

      const { result } = renderHook(() => useImageUpload());

      await act(async () => {
        await result.current.uploadImage(mockFile);
      });

      expect(result.current.error).toBe('Upload interrupted');
      expect(result.current.uploading).toBe(false);
    });
  });
});
