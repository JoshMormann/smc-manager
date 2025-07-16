import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { captureException } from '../lib/sentry';

export const useAuth = () => {
  const auth = useAuthContext();

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

  const updateProfile = async (updates: Parameters<typeof auth.updateProfile>[0]) => {
    try {
      const result = await auth.updateProfile(updates);
      if (result.error) {
        captureException(result.error, {
          tags: { action: 'update_profile' },
          extra: { updates },
        });
      }
      return result;
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
  const isAdmin = auth.profile?.tier === 'admin';
  const isMiner = auth.profile?.tier === 'miner';
  const isOnWaitlist = auth.profile?.waitlist_status === 'pending';

  return {
    ...auth,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithDiscord,
    signOut,
    updateProfile,
    isAuthenticated,
    isAdmin,
    isMiner,
    isOnWaitlist,
  };
};