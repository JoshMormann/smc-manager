import { useState, useEffect, useCallback } from 'react';
import { SREFCodeService } from '../lib/database';
import { useAuth } from './useAuth';
import { captureException } from '../lib/sentry';

export interface UseTagsReturn {
  tags: string[];
  loading: boolean;
  error: string | null;
  refreshTags: () => Promise<void>;
}

export const useTags = (): UseTagsReturn => {
  const { user } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all tags for the current user
  const fetchTags = useCallback(async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await SREFCodeService.getUserTags(user.id);
      
      if (error) {
        setError('Failed to load tags');
        captureException(error, { 
          tags: { operation: 'fetch_tags' },
          user: { id: user.id }
        });
      } else {
        setTags(data || []);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      captureException(err, { 
        tags: { operation: 'fetch_tags' },
        user: { id: user.id }
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load tags on mount and when user changes
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Refresh tags
  const refreshTags = useCallback(async () => {
    await fetchTags();
  }, [fetchTags]);

  return {
    tags,
    loading,
    error,
    refreshTags
  };
};