import { useState, useEffect, useCallback } from 'react';
import { SREFCodeService, SREFCode, SREFCodeInsert, SREFCodeUpdate } from '../lib/database';
import { useAuth } from './useAuth';
import { captureException } from '../lib/sentry';

export interface UseSREFCodesReturn {
  // Data
  srefCodes: SREFCode[];
  loading: boolean;
  error: string | null;

  // Actions
  createSREFCode: (
    srefCode: Omit<SREFCodeInsert, 'user_id'>
  ) => Promise<{ success: boolean; data?: SREFCode; error?: string }>;
  updateSREFCode: (
    codeId: string,
    updates: SREFCodeUpdate
  ) => Promise<{ success: boolean; data?: SREFCode; error?: string }>;
  deleteSREFCode: (codeId: string) => Promise<{ success: boolean; error?: string }>;
  refreshSREFCodes: () => Promise<void>;
  searchSREFCodes: (query: string, tags?: string[]) => Promise<void>;

  // Utility
  getSREFCodeById: (codeId: string) => SREFCode | undefined;
}

export const useSREFCodes = (): UseSREFCodesReturn => {
  const { user } = useAuth();
  const [srefCodes, setSrefCodes] = useState<SREFCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all SREF codes for the current user
  const fetchSREFCodes = useCallback(async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await SREFCodeService.getUserSREFCodes(user.id);

      if (error) {
        setError('Failed to load SREF codes');
        captureException(error, {
          tags: { operation: 'fetch_sref_codes' },
          user: { id: user.id },
        });
      } else {
        setSrefCodes(data || []);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      captureException(err, {
        tags: { operation: 'fetch_sref_codes' },
        user: { id: user.id },
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load SREF codes on mount and when user changes
  useEffect(() => {
    fetchSREFCodes();
  }, [fetchSREFCodes]);

  // Create a new SREF code
  const createSREFCode = useCallback(
    async (srefCode: Omit<SREFCodeInsert, 'user_id'>) => {
      if (!user || !user.id) {
        return { success: false, error: 'User not authenticated' };
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await SREFCodeService.createSREFCode({
          ...srefCode,
          user_id: user.id,
        });

        if (error) {
          const errorMessage = 'Failed to create SREF code';
          setError(errorMessage);
          captureException(error, {
            tags: { operation: 'create_sref_code' },
            user: { id: user.id },
          });
          return { success: false, error: errorMessage };
        }

        if (data) {
          setSrefCodes(prev => [data, ...prev]);
          return { success: true, data };
        }

        return { success: false, error: 'Unknown error occurred' };
      } catch (err) {
        const errorMessage = 'An unexpected error occurred';
        setError(errorMessage);
        captureException(err, {
          tags: { operation: 'create_sref_code' },
          user: { id: user.id },
        });
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Update an existing SREF code
  const updateSREFCode = useCallback(
    async (codeId: string, updates: SREFCodeUpdate) => {
      if (!user || !user.id) {
        return { success: false, error: 'User not authenticated' };
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await SREFCodeService.updateSREFCode(codeId, updates);

        if (error) {
          const errorMessage = 'Failed to update SREF code';
          setError(errorMessage);
          captureException(error, {
            tags: { operation: 'update_sref_code' },
            user: { id: user.id },
          });
          return { success: false, error: errorMessage };
        }

        if (data) {
          setSrefCodes(prev => prev.map(code => (code.id === codeId ? data : code)));
          return { success: true, data };
        }

        return { success: false, error: 'Unknown error occurred' };
      } catch (err) {
        const errorMessage = 'An unexpected error occurred';
        setError(errorMessage);
        captureException(err, {
          tags: { operation: 'update_sref_code' },
          user: { id: user.id },
        });
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Delete an SREF code
  const deleteSREFCode = useCallback(
    async (codeId: string) => {
      if (!user || !user.id) {
        return { success: false, error: 'User not authenticated' };
      }

      setLoading(true);
      setError(null);

      try {
        const { error } = await SREFCodeService.deleteSREFCode(codeId);

        if (error) {
          const errorMessage = 'Failed to delete SREF code';
          setError(errorMessage);
          captureException(error, {
            tags: { operation: 'delete_sref_code' },
            user: { id: user.id },
          });
          return { success: false, error: errorMessage };
        }

        setSrefCodes(prev => prev.filter(code => code.id !== codeId));
        return { success: true };
      } catch (err) {
        const errorMessage = 'An unexpected error occurred';
        setError(errorMessage);
        captureException(err, {
          tags: { operation: 'delete_sref_code' },
          user: { id: user.id },
        });
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Search SREF codes
  const searchSREFCodes = useCallback(
    async (query: string, tags: string[] = []) => {
      if (!user || !user.id) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await SREFCodeService.searchSREFCodes(user.id, query, tags);

        if (error) {
          setError('Failed to search SREF codes');
          captureException(error, {
            tags: { operation: 'search_sref_codes' },
            user: { id: user.id },
          });
        } else {
          setSrefCodes(data || []);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        captureException(err, {
          tags: { operation: 'search_sref_codes' },
          user: { id: user.id },
        });
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Refresh SREF codes
  const refreshSREFCodes = useCallback(async () => {
    await fetchSREFCodes();
  }, [fetchSREFCodes]);

  // Get a specific SREF code by ID
  const getSREFCodeById = useCallback(
    (codeId: string) => {
      return srefCodes.find(code => code.id === codeId);
    },
    [srefCodes]
  );

  return {
    srefCodes,
    loading,
    error,
    createSREFCode,
    updateSREFCode,
    deleteSREFCode,
    refreshSREFCodes,
    searchSREFCodes,
    getSREFCodeById,
  };
};
