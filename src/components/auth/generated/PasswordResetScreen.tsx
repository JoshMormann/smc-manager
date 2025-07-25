'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TooltipProvider } from '@/components/ui/tooltip';
export interface PasswordResetScreenProps {
  onSendResetEmail?: (email: string) => Promise<void>;
  onBackToLogin?: () => void;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
}
export default function PasswordResetScreen({
  onSendResetEmail,
  onBackToLogin,
  isLoading = false,
  error = null,
  success = false,
}: PasswordResetScreenProps) {
  // Form state
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(success);

  // Validation state
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState({
    email: false,
  });

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  // Real-time validation
  useEffect(() => {
    if (touched.email) {
      setEmailError(validateEmail(email));
    }
  }, [email, touched.email]);

  // Update success state when prop changes
  useEffect(() => {
    setEmailSent(success);
  }, [success]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark email as touched
    setTouched({
      email: true,
    });

    // Validate email
    const emailErr = validateEmail(email);
    setEmailError(emailErr);
    if (emailErr) return;
    setIsSubmitting(true);
    try {
      await onSendResetEmail?.(email);
      setEmailSent(true);
    } catch (_error) {
      // Error handling is managed by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back to login
  const handleBackToLogin = () => {
    onBackToLogin?.();
  };
  const isFormValid = !emailError && email;
  const isAnyLoading = isLoading || isSubmitting;
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <CardHeader className="space-y-4 pb-6">
              {/* Logo/Branding */}
              <motion.div
                initial={{
                  scale: 0.9,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  delay: 0.1,
                  duration: 0.4,
                }}
                className="flex items-center justify-center gap-3"
              >
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <h1
                    className="text-2xl font-bold text-foreground"
                    style={{
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                    }}
                  >
                    SREF Manager
                  </h1>
                  <p
                    className="text-sm text-muted-foreground"
                    style={{
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                    }}
                  >
                    Style Reference Management
                  </p>
                </div>
              </motion.div>

              <CardTitle className="text-center text-xl font-semibold text-foreground">
                {emailSent ? 'Check your email' : 'Reset your password'}
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground">
                {emailSent
                  ? "We've sent a password reset link to your email address"
                  : "Enter your email address and we'll send you a link to reset your password"}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                  >
                    <Alert className="border-destructive/50 bg-destructive/5">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success State */}
              <AnimatePresence>
                {emailSent && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className="text-center space-y-4"
                  >
                    <div className="flex justify-center">
                      <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Email sent successfully
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        If an account with <strong>{email}</strong> exists, you'll receive a
                        password reset link shortly.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Didn't receive the email? Check your spam folder or try again.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reset Form */}
              <AnimatePresence>
                {!emailSent && (
                  <motion.form
                    initial={{
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                        Email address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          onBlur={() =>
                            setTouched({
                              ...touched,
                              email: true,
                            })
                          }
                          className={cn(
                            'pl-10 bg-background border-input focus:ring-2 focus:ring-ring transition-all',
                            emailError &&
                              touched.email &&
                              'border-destructive focus:ring-destructive/20'
                          )}
                          disabled={isAnyLoading}
                          aria-describedby={emailError ? 'email-error' : undefined}
                          aria-invalid={!!emailError && touched.email}
                        />
                      </div>
                      <AnimatePresence>
                        {emailError && touched.email && (
                          <motion.p
                            initial={{
                              opacity: 0,
                              height: 0,
                            }}
                            animate={{
                              opacity: 1,
                              height: 'auto',
                            }}
                            exit={{
                              opacity: 0,
                              height: 0,
                            }}
                            id="email-error"
                            className="text-xs text-destructive"
                          >
                            {emailError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Send Reset Link Button */}
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200"
                      disabled={!isFormValid || isAnyLoading}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending reset link...
                        </>
                      ) : (
                        'Send reset link'
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Back to Sign In Link */}
              <div className="text-center pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackToLogin}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                  disabled={isAnyLoading}
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to sign in
                </Button>
              </div>

              {/* Resend Option (only shown in success state) */}
              <AnimatePresence>
                {emailSent && (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      delay: 0.3,
                    }}
                    className="text-center"
                  >
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        setEmailSent(false);
                        setTouched({
                          email: false,
                        });
                        setEmailError('');
                      }}
                      className="text-sm text-primary hover:text-primary/80 p-0 h-auto"
                      disabled={isAnyLoading}
                    >
                      Try a different email address
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
