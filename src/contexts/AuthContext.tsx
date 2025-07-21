import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithDiscord: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Check for password recovery token on initial load
    const checkRecoveryToken = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('access_token');
      const type = urlParams.get('type');
      return token && type === 'recovery';
    };

    const isRecovery = checkRecoveryToken();
    setIsPasswordRecovery(!!isRecovery);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔄 Initial session:', session?.user?.email, 'Recovery:', isRecovery);
      // Don't set session if we're in password recovery mode
      if (!isRecovery) {
        setSession(session);
      }
      setLoading(false);
    });

    // Listen for auth changes - universal pattern for all auth methods
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email, 'Recovery:', isPasswordRecovery);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔐 Password recovery detected');
        setIsPasswordRecovery(true);
        // Don't set session during password recovery
        return;
      }
      
      if (event === 'SIGNED_IN' && isPasswordRecovery) {
        console.log('🔐 Signed in during recovery - ignoring');
        // Ignore SIGNED_IN during recovery flow
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }
      
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Email/Password Sign In
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Email/Password Sign Up
  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    return { error };
  };

  // Google OAuth Sign In
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    return { error };
  };

  // Discord OAuth Sign In
  const signInWithDiscord = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    return { error };
  };

  // Sign Out - universal for all auth methods
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Password Reset - send reset email
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  // Update Password - for password reset flow
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    
    // Reset recovery state on successful password update
    if (!error) {
      setIsPasswordRecovery(false);
    }
    
    return { error };
  };

  const value: AuthContextType = {
    user: session?.user ?? null,
    session,
    loading,
    isPasswordRecovery,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithDiscord,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};