import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import SREFCodeForm from '../SREFCodeForm';
import { useImageUpload } from '@/hooks/useImageUpload';
import { AuthProvider } from '@/contexts/AuthContext';

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

// Mock the image upload hook
vi.mock('@/hooks/useImageUpload');

const mockUseImageUpload = vi.mocked(useImageUpload);

describe('SREFCodeForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  // Helper to render with AuthProvider
  const renderWithAuth = (ui: React.ReactElement) => {
    return render(<AuthProvider>{ui}</AuthProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for useImageUpload
    mockUseImageUpload.mockReturnValue({
      uploadImage: vi.fn().mockResolvedValue({
        success: true,
        data: 'https://example.com/uploaded-image.jpg',
      }),
      uploading: false,
      progress: 0,
      error: null,
    });
  });

  describe('Basic rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithAuth(
        <SREFCodeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );
      expect(container).toBeInTheDocument();
    });

    it('renders the Save button', () => {
      const { getByText } = renderWithAuth(
        <SREFCodeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );
      expect(getByText('Save SREF Code')).toBeInTheDocument();
    });

    it('renders the Cancel button', () => {
      const { getByText } = renderWithAuth(
        <SREFCodeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );
      expect(getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Props handling', () => {
    it('accepts onSubmit and onCancel props', () => {
      // This test just ensures the component accepts the required props
      expect(() => {
        renderWithAuth(<SREFCodeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      }).not.toThrow();
    });

    it('renders with initial values when provided', () => {
      const initialValues = {
        title: 'Test SREF Code',
        code_value: '--sref 1234567890',
        version: 'SV6' as const,
        tags: ['test'],
        images: [],
      };

      const { getByDisplayValue } = renderWithAuth(
        <SREFCodeForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialValues={initialValues}
        />
      );

      expect(getByDisplayValue('Test SREF Code')).toBeInTheDocument();
      expect(getByDisplayValue('--sref 1234567890')).toBeInTheDocument();
    });
  });

  describe('Editing mode', () => {
    it('shows Update button when in editing mode', () => {
      const { getByText } = renderWithAuth(
        <SREFCodeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isEditing={true} />
      );

      expect(getByText('Update SREF Code')).toBeInTheDocument();
    });

    it('shows Save button when not in editing mode', () => {
      const { getByText } = renderWithAuth(
        <SREFCodeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isEditing={false} />
      );

      expect(getByText('Save SREF Code')).toBeInTheDocument();
    });
  });

  describe('Upload states', () => {
    it('shows progress when uploading', () => {
      mockUseImageUpload.mockReturnValue({
        uploadImage: vi.fn(),
        uploading: true,
        progress: 50,
        error: null,
      });

      const { getByText } = renderWithAuth(
        <SREFCodeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Check for upload progress indication
      expect(getByText('50%')).toBeInTheDocument();
    });

    it('shows error when upload fails', () => {
      mockUseImageUpload.mockReturnValue({
        uploadImage: vi.fn(),
        uploading: false,
        progress: 0,
        error: 'Upload failed',
      });

      const { getByText } = renderWithAuth(
        <SREFCodeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(getByText('Upload failed')).toBeInTheDocument();
    });
  });
});
