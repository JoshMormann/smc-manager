import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { setUser as setSentryUser } from '../lib/sentry';
import { Database } from '../types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithDiscord: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      if (initialized) {
        console.log('🔄 InitializeAuth: Already initialized, skipping...');
        return;
      }
      
      try {
        console.log('🔄 InitializeAuth: Starting...');
        setInitialized(true);
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔄 InitializeAuth: Got session:', session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Only fetch profile for email/password users, not OAuth users
          const isOAuthUser = session.user.app_metadata?.provider !== 'email';
          console.log('🔄 InitializeAuth: Is OAuth user:', isOAuthUser, 'Provider:', session.user.app_metadata?.provider);
          
          if (!isOAuthUser) {
            console.log('🔄 InitializeAuth: Fetching profile for email user...');
            const userProfile = await fetchUserProfile(session.user.id);
            // If no profile exists for email user, create one
            if (!userProfile) {
              console.log('🔄 InitializeAuth: No profile found for email user, creating one...');
              await createEmailUserProfile(session.user);
            }
          } else {
            console.log('🔄 InitializeAuth: Creating OAuth profile...');
            // Only create OAuth profile if we don't already have one
            if (!profile) {
              await createOAuthUserProfile(session.user);
            }
          }
          
          // Set user context for Sentry
          setSentryUser({
            id: session.user.id,
            email: session.user.email,
          });
        }
        
        console.log('🔄 InitializeAuth: Setting loading to false');
        setLoading(false);
      } catch (error) {
        console.error('🔄 InitializeAuth: Error:', error);
        setLoading(false);
      }
    };
    
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('🔄 AuthStateChange: Event:', event, 'Email:', session?.user?.email);
          
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Only fetch profile for email/password users, not OAuth users
            const isOAuthUser = session.user.app_metadata?.provider !== 'email';
            console.log('🔄 AuthStateChange: Is OAuth user:', isOAuthUser, 'Provider:', session.user.app_metadata?.provider);
            
            if (!isOAuthUser) {
              console.log('🔄 AuthStateChange: Fetching profile for email user...');
              const userProfile = await fetchUserProfile(session.user.id);
              // If no profile exists for email user, create one
              if (!userProfile) {
                console.log('🔄 AuthStateChange: No profile found for email user, creating one...');
                await createEmailUserProfile(session.user);
              }
            } else {
              console.log('🔄 AuthStateChange: Creating OAuth profile...');
              // Only create OAuth profile if we don't already have one
              if (!profile) {
                await createOAuthUserProfile(session.user);
              }
            }
            
            // Set user context for Sentry
            setSentryUser({
              id: session.user.id,
              email: session.user.email,
            });
          } else {
            setProfile(null);
            // Clear user context for Sentry
            setSentryUser(null);
          }
          
          console.log('🔄 AuthStateChange: Setting loading to false');
          setLoading(false);
        } catch (error) {
          console.error('🔄 AuthStateChange: Error:', error);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('🔄 FetchUserProfile: Starting for user:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('🔄 FetchUserProfile: Result:', { data, error });

      if (error) {
        // If no profile exists or access is forbidden, it's normal for OAuth users
        if (error.code === 'PGRST116' || error.code === '42501' || error.message?.includes('permission denied')) {
          console.log('🔄 FetchUserProfile: No profile found or access denied (normal for OAuth users)');
          setProfile(null);
          return null;
        }
        console.error('🔄 FetchUserProfile: Error fetching profile:', error);
        setProfile(null);
        return null;
      }

      console.log('🔄 FetchUserProfile: Profile found, setting it');
      setProfile(data);
      return data;
    } catch (error) {
      console.error('🔄 FetchUserProfile: Catch error:', error);
      setProfile(null);
      return null;
    } finally {
      console.log('🔄 FetchUserProfile: Completed');
    }
  };

  const createEmailUserProfile = async (user: User) => {
    try {
      console.log('🔄 CreateEmailProfile: Starting for user:', user.id);
      
      const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          username,
          tier: 'admin', // Default tier for email users
          waitlist_status: 'approved'
        })
        .select()
        .single();

      if (error) {
        console.error('🔄 CreateEmailProfile: Error creating profile:', error);
        // If profile already exists (duplicate key), try to fetch it
        if (error.code === '23505') {
          console.log('🔄 CreateEmailProfile: Profile already exists, fetching it...');
          const existingProfile = await fetchUserProfile(user.id);
          if (existingProfile) {
            setProfile(existingProfile);
          }
          return;
        }
        setProfile(null);
        return;
      }

      console.log('🔄 CreateEmailProfile: Profile created:', data);
      setProfile(data);
    } catch (error) {
      console.error('🔄 CreateEmailProfile: Catch error:', error);
      setProfile(null);
    }
  };

  const createOAuthUserProfile = async (user: User) => {
    try {
      console.log('🔄 CreateOAuthProfile: Starting for user:', user.id);
      
      // Check if profile already exists first
      console.log('🔄 CreateOAuthProfile: Checking for existing profile...');
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('id, email, username, tier, waitlist_status, created_at, updated_at')
        .eq('id', user.id)
        .maybeSingle();

      console.log('🔄 CreateOAuthProfile: Check result:', { existingProfile, checkError });

      // If profile exists, use it
      if (existingProfile && !checkError) {
        console.log('🔄 CreateOAuthProfile: Profile already exists, setting it');
        setProfile(existingProfile);
        return;
      }

      // If there's an error other than not found, just set profile to null and continue
      if (checkError && checkError.code !== 'PGRST116') {
        console.log('🔄 CreateOAuthProfile: Error checking profile, but continuing:', checkError);
        setProfile(null);
        return;
      }

      // Create profile for OAuth user
      console.log('🔄 CreateOAuthProfile: Creating new profile...');
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          tier: 'miner',
          waitlist_status: 'none'
        })
        .select()
        .single();

      if (error) {
        console.error('🔄 CreateOAuthProfile: Error creating profile:', error);
        // If profile already exists (duplicate key), try to fetch it
        if (error.code === '23505') {
          console.log('🔄 CreateOAuthProfile: Profile already exists, fetching it...');
          const { data: fetchedProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(fetchedProfile);
          return;
        }
        setProfile(null);
        return;
      }

      console.log('🔄 CreateOAuthProfile: Created profile successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('🔄 CreateOAuthProfile: Catch error:', error);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      return { error };
    }

    // Create user profile after successful signup
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            username,
            email,
            tier: 'miner',
            waitlist_status: 'none',
          },
        ]);

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    return { error };
  };

  const signInWithDiscord = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error: AuthError | null }> => {
    if (!user) {
      return { error: null }; // Return null for consistency with other auth methods
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      // Refresh profile data
      await fetchUserProfile(user.id);
    }

    return { error: null }; // Always return null for error since this is not an auth operation
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithDiscord,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};