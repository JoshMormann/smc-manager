"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, Chrome, MessageSquare, Sparkles, Check, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
export interface SignUpScreenProps {
  onEmailSignUp?: (email: string, password: string) => Promise<void>;
  onDiscordSignUp?: () => Promise<void>;
  onGoogleSignUp?: () => Promise<void>;
  onSignInClick?: () => void;
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  isLoading?: boolean;
  error?: string | null;
}
export default function SignUpScreen({
  onEmailSignUp,
  onDiscordSignUp,
  onGoogleSignUp,
  onSignInClick,
  onTermsClick,
  onPrivacyClick,
  isLoading = false,
  error = null
}: SignUpScreenProps) {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<'discord' | 'google' | null>(null);

  // Validation state
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    terms: false
  });

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  // Password validation and strength calculation
  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordRequirements(requirements);
    const strengthScore = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength(strengthScore / 5 * 100);
    if (strengthScore < 3) return "Password is too weak";
    return "";
  };

  // Confirm password validation
  const validateConfirmPassword = useCallback((confirmPassword: string) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  }, [password]);

  // Terms validation
  const validateTerms = (accepted: boolean) => {
    if (!accepted) return "You must accept the terms and conditions";
    return "";
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
  useEffect(() => {
    if (touched.confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword));
    }
  }, [confirmPassword, password, touched.confirmPassword, validateConfirmPassword]);
  useEffect(() => {
    if (touched.terms) {
      setTermsError(validateTerms(acceptTerms));
    }
  }, [acceptTerms, touched.terms]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
      terms: true
    });

    // Validate all fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword);
    const termsErr = validateTerms(acceptTerms);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);
    setTermsError(termsErr);
    if (emailErr || passwordErr || confirmPasswordErr || termsErr) return;
    setIsSubmitting(true);
    try {
      await onEmailSignUp?.(email, password);
    } catch (_error) {
      // Error handling is managed by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle SSO signup
  const handleSsoSignUp = async (provider: 'discord' | 'google') => {
    setSsoLoading(provider);
    try {
      if (provider === 'discord') {
        await onDiscordSignUp?.();
      } else {
        await onGoogleSignUp?.();
      }
    } catch (_error) {
      // Error handling is managed by parent component
    } finally {
      setSsoLoading(null);
    }
  };
  const isFormValid = !emailError && !passwordError && !confirmPasswordError && !termsError && email && password && confirmPassword && acceptTerms;
  const isAnyLoading = isLoading || isSubmitting || ssoLoading !== null;
  const _getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-destructive";
    if (passwordStrength < 70) return "bg-yellow-500";
    return "bg-green-500";
  };
  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };
  return <TooltipProvider>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        ease: "easeOut"
      }} className="w-full max-w-md">
          <Card className="shadow-xl border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <CardHeader className="space-y-4 pb-6">
              {/* Logo/Branding */}
              <motion.div initial={{
              scale: 0.9,
              opacity: 0
            }} animate={{
              scale: 1,
              opacity: 1
            }} transition={{
              delay: 0.1,
              duration: 0.4
            }} className="flex items-center justify-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-foreground" style={{
                  textAlign: "left",
                  justifyContent: "flex-start"
                }}>
                    SREF Manager
                  </h1>
                  <p className="text-sm text-muted-foreground" style={{
                  textAlign: "left",
                  justifyContent: "flex-start"
                }}>
                    Style Reference Management
                  </p>
                </div>
              </motion.div>

              <CardTitle className="text-center text-xl font-semibold text-foreground">
                Create your account
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground">
                Join SREF Manager to organize your style references
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Alert */}
              <AnimatePresence>
                {error && <motion.div initial={{
                opacity: 0,
                height: 0
              }} animate={{
                opacity: 1,
                height: "auto"
              }} exit={{
                opacity: 0,
                height: 0
              }} transition={{
                duration: 0.2
              }}>
                    <Alert className="border-destructive/50 bg-destructive/5">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        {error}
                      </AlertDescription>
                    </Alert>
                  </motion.div>}
              </AnimatePresence>

              {/* Sign Up Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => setTouched({
                    ...touched,
                    email: true
                  })} className={cn("pl-10 bg-background border-input focus:ring-2 focus:ring-ring transition-all", emailError && touched.email && "border-destructive focus:ring-destructive/20")} disabled={isAnyLoading} aria-describedby={emailError ? "email-error" : undefined} aria-invalid={!!emailError && touched.email} />
                  </div>
                  <AnimatePresence>
                    {emailError && touched.email && <motion.p initial={{
                    opacity: 0,
                    height: 0
                  }} animate={{
                    opacity: 1,
                    height: "auto"
                  }} exit={{
                    opacity: 0,
                    height: 0
                  }} id="email-error" className="text-xs text-destructive">
                        {emailError}
                      </motion.p>}
                  </AnimatePresence>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password} onChange={e => setPassword(e.target.value)} onBlur={() => setTouched({
                    ...touched,
                    password: true
                  })} className={cn("pl-10 pr-10 bg-background border-input focus:ring-2 focus:ring-ring transition-all", passwordError && touched.password && "border-destructive focus:ring-destructive/20")} disabled={isAnyLoading} aria-describedby={passwordError ? "password-error" : "password-requirements"} aria-invalid={!!passwordError && touched.password} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground" disabled={isAnyLoading} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{showPassword ? "Hide password" : "Show password"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Password strength</span>
                        <span className={cn("text-xs font-medium", passwordStrength < 40 ? "text-destructive" : passwordStrength < 70 ? "text-yellow-600" : "text-green-600")}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <Progress value={passwordStrength} className="h-2" />
                    </div>}

                  {/* Password Requirements */}
                  {password && touched.password && <div id="password-requirements" className="space-y-1">
                      <p className="text-xs text-muted-foreground">Password must contain:</p>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        {[{
                      key: 'length',
                      text: 'At least 8 characters'
                    }, {
                      key: 'uppercase',
                      text: 'One uppercase letter'
                    }, {
                      key: 'lowercase',
                      text: 'One lowercase letter'
                    }, {
                      key: 'number',
                      text: 'One number'
                    }, {
                      key: 'special',
                      text: 'One special character'
                    }].map(({
                      key,
                      text
                    }) => <div key={key} className="flex items-center gap-2">
                            {passwordRequirements[key as keyof typeof passwordRequirements] ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-muted-foreground" />}
                            <span className={cn(passwordRequirements[key as keyof typeof passwordRequirements] ? "text-green-600" : "text-muted-foreground")}>
                              {text}
                            </span>
                          </div>)}
                      </div>
                    </div>}

                  <AnimatePresence>
                    {passwordError && touched.password && <motion.p initial={{
                    opacity: 0,
                    height: 0
                  }} animate={{
                    opacity: 1,
                    height: "auto"
                  }} exit={{
                    opacity: 0,
                    height: 0
                  }} id="password-error" className="text-xs text-destructive">
                        {passwordError}
                      </motion.p>}
                  </AnimatePresence>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onBlur={() => setTouched({
                    ...touched,
                    confirmPassword: true
                  })} className={cn("pl-10 pr-10 bg-background border-input focus:ring-2 focus:ring-ring transition-all", confirmPasswordError && touched.confirmPassword && "border-destructive focus:ring-destructive/20")} disabled={isAnyLoading} aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined} aria-invalid={!!confirmPasswordError && touched.confirmPassword} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground" disabled={isAnyLoading} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                          {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{showConfirmPassword ? "Hide password" : "Show password"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <AnimatePresence>
                    {confirmPasswordError && touched.confirmPassword && <motion.p initial={{
                    opacity: 0,
                    height: 0
                  }} animate={{
                    opacity: 1,
                    height: "auto"
                  }} exit={{
                    opacity: 0,
                    height: 0
                  }} id="confirm-password-error" className="text-xs text-destructive">
                        {confirmPasswordError}
                      </motion.p>}
                  </AnimatePresence>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <Checkbox id="terms" checked={acceptTerms} onCheckedChange={checked => setAcceptTerms(checked as boolean)} onBlur={() => setTouched({
                    ...touched,
                    terms: true
                  })} disabled={isAnyLoading} className={cn("mt-0.5", termsError && touched.terms && "border-destructive")} aria-describedby={termsError ? "terms-error" : undefined} aria-invalid={!!termsError && touched.terms} />
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      <Label htmlFor="terms" className="cursor-pointer">
                        I agree to the{" "}
                        <Button type="button" variant="link" onClick={onTermsClick} className="text-primary hover:text-primary/80 p-0 h-auto font-medium underline" disabled={isAnyLoading}>
                          Terms of Service
                        </Button>
                        {" "}and{" "}
                        <Button type="button" variant="link" onClick={onPrivacyClick} className="text-primary hover:text-primary/80 p-0 h-auto font-medium underline" disabled={isAnyLoading}>
                          Privacy Policy
                        </Button>
                      </Label>
                    </div>
                  </div>
                  <AnimatePresence>
                    {termsError && touched.terms && <motion.p initial={{
                    opacity: 0,
                    height: 0
                  }} animate={{
                    opacity: 1,
                    height: "auto"
                  }} exit={{
                    opacity: 0,
                    height: 0
                  }} id="terms-error" className="text-xs text-destructive">
                        {termsError}
                      </motion.p>}
                  </AnimatePresence>
                </div>

                {/* Sign Up Button */}
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200" disabled={!isFormValid || isAnyLoading}>
                  {isSubmitting ? <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating account...
                    </> : "Create account"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground">
                    Or sign up with
                  </span>
                </div>
              </div>

              {/* SSO Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Discord SSO */}
                <Button type="button" variant="outline" onClick={() => handleSsoSignUp('discord')} disabled={isAnyLoading} className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#5865F2] hover:border-[#4752C4] transition-all duration-200">
                  {ssoLoading === 'discord' ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Discord
                    </>}
                </Button>

                {/* Google SSO */}
                <Button type="button" variant="outline" onClick={() => handleSsoSignUp('google')} disabled={isAnyLoading} className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400 transition-all duration-200">
                  {ssoLoading === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                      <Chrome className="h-4 w-4 mr-2" />
                      Google
                    </>}
                </Button>
              </div>

              {/* Sign In Link */}
              <div className="text-center pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Button type="button" variant="link" onClick={onSignInClick} className="text-primary hover:text-primary/80 p-0 h-auto font-medium" disabled={isAnyLoading}>
                    Sign in
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>;
}