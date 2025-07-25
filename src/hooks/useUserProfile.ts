import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

export const useUserProfile = (user: User | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const fetchOrCreateProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔄 UserProfile: Fetching profile for user:', user.id);

        // Try to fetch existing profile
        const { data: existingProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('🔄 UserProfile: Error fetching profile:', fetchError);
          setError(fetchError.message);
          return;
        }

        if (existingProfile) {
          console.log('🔄 UserProfile: Found existing profile');
          setProfile(existingProfile);
          return;
        }

        // No profile exists, create one
        console.log('🔄 UserProfile: Creating new profile');
        const isOAuthUser = user.app_metadata?.provider !== 'email';

        const profileData = {
          id: user.id,
          email: user.email,
          username:
            user.user_metadata?.username ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'User',
          tier: isOAuthUser ? 'miner' : 'admin',
          waitlist_status: isOAuthUser ? 'none' : 'approved',
        };

        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert(profileData)
          .select()
          .single();

        if (createError) {
          // If profile already exists (race condition), fetch it
          if (createError.code === '23505') {
            console.log('🔄 UserProfile: Profile already exists, fetching...');
            const { data: raceProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            setProfile(raceProfile);
            return;
          }

          console.error('🔄 UserProfile: Error creating profile:', createError);
          setError(createError.message);
          return;
        }

        console.log('🔄 UserProfile: Created new profile:', newProfile);
        setProfile(newProfile);
      } catch (err) {
        console.error('🔄 UserProfile: Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return { error: 'No user or profile' };

    try {
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      // Update local state
      setProfile(prev => (prev ? { ...prev, ...updates } : null));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { error: errorMessage };
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
  };
};
