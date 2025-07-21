import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import PasswordResetScreen from './generated/PasswordResetScreen';
import PasswordResetConfirmScreen from './generated/PasswordResetConfirmScreen';
import { Loader2 } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { user, loading, isPasswordRecovery, resetPassword, updatePassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
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
      setIsLogin(false);
      // Clean up the URL
      if (token && type === 'recovery') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isPasswordRecovery]);

  const handleForgotPassword = () => {
    setShowPasswordReset(true);
    setIsLogin(false);
    setResetEmailSent(false);
    setResetError(null);
  };

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
    } catch (err) {
      setResetError('An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowPasswordReset(false);
    setShowPasswordResetConfirm(false);
    setIsLogin(true);
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
        setIsLogin(true);
        setPasswordResetToken(null);
      }
    } catch (err) {
      setResetError('An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }


  // Show authentication forms if user is not authenticated OR if in password recovery mode
  if (!user || isPasswordRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          {showPasswordResetConfirm ? (
            <PasswordResetConfirmScreen
              onPasswordReset={handlePasswordReset}
              onBackToLogin={handleBackToLogin}
              isLoading={resetLoading}
              error={resetError}
              success={false}
              resetToken={passwordResetToken || undefined}
            />
          ) : showPasswordReset ? (
            <PasswordResetScreen
              onSendResetEmail={handleSendResetEmail}
              onBackToLogin={handleBackToLogin}
              isLoading={resetLoading}
              error={resetError}
              success={resetEmailSent}
            />
          ) : isLogin ? (
            <LoginForm 
              onToggleForm={() => setIsLogin(false)}
              onForgotPassword={handleForgotPassword}
            />
          ) : (
            <RegisterForm onToggleForm={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    );
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
};