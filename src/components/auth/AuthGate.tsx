import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import PasswordResetScreen from './generated/PasswordResetScreen';
import PasswordResetConfirmScreen from './generated/PasswordResetConfirmScreen';
import LoginScreen from './generated/LoginScreen';
import { Loader2 } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const {
    user,
    loading,
    isPasswordRecovery,
    signIn,
    signInWithGoogle,
    signInWithDiscord,
    resetPassword,
    updatePassword,
  } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile(user);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPasswordResetConfirm, setShowPasswordResetConfirm] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [passwordResetToken, setPasswordResetToken] = useState<string | null>(null);

  // Check for password reset token in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('access_token');
    const type = urlParams.get('type');

    if ((token && type === 'recovery') || isPasswordRecovery) {
      setPasswordResetToken(token);
      setShowPasswordResetConfirm(true);
      // Clean up the URL
      if (token && type === 'recovery') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isPasswordRecovery]);

  const handleSendResetEmail = async (email: string) => {
    setResetLoading(true);
    setResetError(null);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setResetError(error.message);
      } else {
        setResetEmailSent(true);
      }
    } catch (_err) {
      setResetError('An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowPasswordReset(false);
    setShowPasswordResetConfirm(false);
    setResetEmailSent(false);
    setResetError(null);
    setPasswordResetToken(null);
  };

  const handlePasswordReset = async (newPassword: string) => {
    setResetLoading(true);
    setResetError(null);

    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setResetError(error.message);
      } else {
        // Password updated successfully, redirect to login
        setShowPasswordResetConfirm(false);
        setPasswordResetToken(null);
      }
    } catch (_err) {
      setResetError('An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Handle email login
  const handleEmailLogin = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setResetError(error.message);
      }
      // Success case is handled by the auth context automatically
    } catch (err) {
      setResetError('An unexpected error occurred. Please try again.');
    }
  };

  // Handle Google SSO login
  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setResetError(error.message);
      }
    } catch (err) {
      setResetError('An unexpected error occurred. Please try again.');
    }
  };

  // Handle Discord SSO login
  const handleDiscordLogin = async () => {
    try {
      const { error } = await signInWithDiscord();
      if (error) {
        setResetError(error.message);
      }
    } catch (err) {
      setResetError('An unexpected error occurred. Please try again.');
    }
  };

  // Handle forgot password
  const handleForgotPasswordClick = (email: string) => {
    setShowPasswordReset(true);
    // Pre-fill email if provided
    if (email) {
      handleSendResetEmail(email);
    }
  };

  // Show loading spinner while checking authentication or profile
  if (loading || (user && profileLoading)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        data-testid="auth-loading"
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication forms if user is not authenticated OR if in password recovery mode
  // OR if user exists but profile is missing (for email users) and there's an error
  const isOAuthUser = user?.app_metadata?.provider && user.app_metadata.provider !== 'email';
  const needsAuth =
    !user || isPasswordRecovery || (user && !profile && !isOAuthUser && profileError);

  if (needsAuth) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background p-4"
        data-testid="login-screen"
      >
        <div className="w-full max-w-md">
          {showPasswordResetConfirm ? (
            <PasswordResetConfirmScreen
              onPasswordReset={handlePasswordReset}
              onBackToLogin={handleBackToLogin}
              isLoading={resetLoading}
              error={resetError}
              success={false}
              _resetToken={passwordResetToken || undefined}
            />
          ) : showPasswordReset ? (
            <PasswordResetScreen
              onSendResetEmail={handleSendResetEmail}
              onBackToLogin={handleBackToLogin}
              isLoading={resetLoading}
              error={resetError}
              success={resetEmailSent}
            />
          ) : (
            <LoginScreen
              onEmailLogin={handleEmailLogin}
              onGoogleLogin={handleGoogleLogin}
              onDiscordLogin={handleDiscordLogin}
              onForgotPassword={handleForgotPasswordClick}
              error={resetError}
              isLoading={loading}
            />
          )}
        </div>
      </div>
    );
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
};
