import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { useUserProfile } from './useUserProfile';
import { captureException } from '../lib/sentry';

export const useAuth = () => {
  const auth = useAuthContext();
  const { profile, updateProfile: updateUserProfile } = useUserProfile(auth.user);

  // Wrapper functions with error handling and Sentry integration
  const signIn = async (email: string, password: string) => {
    try {
      const result = await auth.signIn(email, password);
      if (result.error) {
        captureException(result.error, {
          tags: { action: 'sign_in' },
          extra: { email },
        });
      }
      return result;
    } catch (error) {
      captureException(error, {
        tags: { action: 'sign_in' },
        extra: { email },
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const result = await auth.signUp(email, password, username);
      if (result.error) {
        captureException(result.error, {
          tags: { action: 'sign_up' },
          extra: { email, username },
        });
      }
      return result;
    } catch (error) {
      captureException(error, {
        tags: { action: 'sign_up' },
        extra: { email, username },
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await auth.signInWithGoogle();
      if (result.error) {
        captureException(result.error, {
          tags: { action: 'sign_in_google' },
        });
      }
      return result;
    } catch (error) {
      captureException(error, {
        tags: { action: 'sign_in_google' },
      });
      throw error;
    }
  };

  const signInWithDiscord = async () => {
    try {
      const result = await auth.signInWithDiscord();
      if (result.error) {
        captureException(result.error, {
          tags: { action: 'sign_in_discord' },
        });
      }
      return result;
    } catch (error) {
      captureException(error, {
        tags: { action: 'sign_in_discord' },
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const result = await auth.signOut();
      if (result.error) {
        captureException(result.error, {
          tags: { action: 'sign_out' },
        });
      }
      return result;
    } catch (error) {
      captureException(error, {
        tags: { action: 'sign_out' },
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await auth.resetPassword(email);
      if (result.error) {
        captureException(result.error, {
          tags: { action: 'reset_password' },
          extra: { email },
        });
      }
      return result;
    } catch (error) {
      captureException(error, {
        tags: { action: 'reset_password' },
        extra: { email },
      });
      throw error;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const result = await auth.updatePassword(password);
      if (result.error) {
        captureException(result.error, {
          tags: { action: 'update_password' },
        });
      }
      return result;
    } catch (error) {
      captureException(error, {
        tags: { action: 'update_password' },
      });
      throw error;
    }
  };

  const updateProfile = async (updates: Parameters<typeof updateUserProfile>[0]) => {
    try {
      const result = await updateUserProfile(updates);
      if (result.error) {
        captureException(new Error(result.error), {
          tags: { action: 'update_profile' },
          extra: { updates },
        });
      }
      return { error: result.error ? new Error(result.error) : null };
    } catch (error) {
      captureException(error, {
        tags: { action: 'update_profile' },
        extra: { updates },
      });
      throw error;
    }
  };

  // Computed properties for convenience
  const isAuthenticated = !!auth.user;
  const isAdmin = profile?.tier === 'admin';
  const isMiner = profile?.tier === 'miner';
  const isOnWaitlist = profile?.waitlist_status === 'pending';

  return {
    ...auth,
    profile,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithDiscord,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAuthenticated,
    isAdmin,
    isMiner,
    isOnWaitlist,
  };
};