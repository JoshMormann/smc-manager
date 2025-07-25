'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Chrome,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export interface LoginScreenProps {
  onEmailLogin?: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  onDiscordLogin?: () => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
  onForgotPassword?: (email: string) => void;
  onSignUpClick?: () => void;
  isLoading?: boolean;
  error?: string | null;
}
export default function LoginScreen({
  onEmailLogin,
  onDiscordLogin,
  onGoogleLogin,
  onForgotPassword,
  onSignUpClick,
  isLoading = false,
  error = null,
}: LoginScreenProps) {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<'discord' | 'google' | null>(null);

  // Validation state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  // Password validation
  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  // Real-time validation
  useEffect(() => {
    if (touched.email) {
      setEmailError(validateEmail(email));
    }
  }, [email, touched.email]);
  useEffect(() => {
    if (touched.password) {
      setPasswordError(validatePassword(password));
    }
  }, [password, touched.password]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
    });

    // Validate all fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    if (emailErr || passwordErr) return;
    setIsSubmitting(true);
    try {
      await onEmailLogin?.(email, password, rememberMe);
    } catch (_error) {
      // Error handling is managed by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle SSO login
  const handleSsoLogin = async (provider: 'discord' | 'google') => {
    setSsoLoading(provider);
    try {
      if (provider === 'discord') {
        await onDiscordLogin?.();
      } else {
        await onGoogleLogin?.();
      }
    } catch (_error) {
      // Error handling is managed by parent component
    } finally {
      setSsoLoading(null);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    if (email && !validateEmail(email)) {
      onForgotPassword?.(email);
    } else {
      setTouched({
        ...touched,
        email: true,
      });
      setEmailError(validateEmail(email));
    }
  };
  const isFormValid = !emailError && !passwordError && email && password;
  const isAnyLoading = isLoading || isSubmitting || ssoLoading !== null;
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
                Welcome back
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground">
                Sign in to access your SREF collection
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

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
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

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onBlur={() =>
                        setTouched({
                          ...touched,
                          password: true,
                        })
                      }
                      className={cn(
                        'pl-10 pr-10 bg-background border-input focus:ring-2 focus:ring-ring transition-all',
                        passwordError &&
                          touched.password &&
                          'border-destructive focus:ring-destructive/20'
                      )}
                      disabled={isAnyLoading}
                      aria-describedby={passwordError ? 'password-error' : undefined}
                      aria-invalid={!!passwordError && touched.password}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                          disabled={isAnyLoading}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{showPassword ? 'Hide password' : 'Show password'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <AnimatePresence>
                    {passwordError && touched.password && (
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
                        id="password-error"
                        className="text-xs text-destructive"
                      >
                        {passwordError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={checked => setRememberMe(checked as boolean)}
                      disabled={isAnyLoading}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:text-primary/80 p-0 h-auto"
                    disabled={isAnyLoading}
                  >
                    Forgot password?
                  </Button>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200"
                  disabled={!isFormValid || isAnyLoading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* SSO Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Discord SSO */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSsoLogin('discord')}
                  disabled={isAnyLoading}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#5865F2] hover:border-[#4752C4] transition-all duration-200"
                >
                  {ssoLoading === 'discord' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Discord
                    </>
                  )}
                </Button>

                {/* Google SSO */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSsoLogin('google')}
                  disabled={isAnyLoading}
                  className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400 transition-all duration-200"
                >
                  {ssoLoading === 'google' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Chrome className="h-4 w-4 mr-2" />
                      Google
                    </>
                  )}
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Button
                    type="button"
                    variant="link"
                    onClick={onSignUpClick}
                    className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
                    disabled={isAnyLoading}
                  >
                    Sign up
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
