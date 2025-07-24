"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Lock, Loader2, AlertCircle, CheckCircle, ArrowLeft, Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
export interface PasswordResetConfirmScreenProps {
  onPasswordReset?: (password: string) => Promise<void>;
  onBackToLogin?: () => void;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  _resetToken?: string;
}

// Password strength calculation
const calculatePasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  if (score < 40) return {
    score,
    label: "Weak",
    color: "text-red-500"
  };
  if (score < 70) return {
    score,
    label: "Medium",
    color: "text-yellow-500"
  };
  return {
    score,
    label: "Strong",
    color: "text-green-500"
  };
};
export default function PasswordResetConfirmScreen({
  onPasswordReset,
  onBackToLogin,
  isLoading = false,
  error = null,
  success = false,
  _resetToken = ""
}: PasswordResetConfirmScreenProps) {
  // Form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordReset, setPasswordReset] = useState(success);

  // Validation state
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [touched, setTouched] = useState({
    newPassword: false,
    confirmPassword: false
  });

  // Password strength
  const passwordStrength = calculatePasswordStrength(newPassword);

  // Password validation
  const validateNewPassword = (password: string) => {
    if (!password) return "New password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  // Confirm password validation
  const validateConfirmPassword = (password: string, newPass: string) => {
    if (!password) return "Please confirm your password";
    if (password !== newPass) return "Passwords do not match";
    return "";
  };

  // Real-time validation
  useEffect(() => {
    if (touched.newPassword) {
      setNewPasswordError(validateNewPassword(newPassword));
    }
  }, [newPassword, touched.newPassword]);
  useEffect(() => {
    if (touched.confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword, newPassword));
    }
  }, [confirmPassword, newPassword, touched.confirmPassword]);

  // Update success state when prop changes
  useEffect(() => {
    setPasswordReset(success);
  }, [success]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      newPassword: true,
      confirmPassword: true
    });

    // Validate all fields
    const newPasswordErr = validateNewPassword(newPassword);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword, newPassword);
    setNewPasswordError(newPasswordErr);
    setConfirmPasswordError(confirmPasswordErr);
    if (newPasswordErr || confirmPasswordErr) return;
    setIsSubmitting(true);
    try {
      await onPasswordReset?.(newPassword);
      setPasswordReset(true);
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
  const isFormValid = !newPasswordError && !confirmPasswordError && newPassword && confirmPassword;
  const isAnyLoading = isLoading || isSubmitting;

  // Password requirements
  const requirements = [{
    test: newPassword.length >= 8,
    label: "At least 8 characters"
  }, {
    test: /[a-z]/.test(newPassword),
    label: "One lowercase letter"
  }, {
    test: /[A-Z]/.test(newPassword),
    label: "One uppercase letter"
  }, {
    test: /[0-9]/.test(newPassword),
    label: "One number"
  }, {
    test: /[^A-Za-z0-9]/.test(newPassword),
    label: "One special character"
  }] as { test: boolean; label: string }[];
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
                {passwordReset ? "Password updated!" : "Set new password"}
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground">
                {passwordReset ? "Your password has been successfully updated. You can now sign in with your new password." : "Enter your new password below. Make sure it's strong and secure."}
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

              {/* Success State */}
              <AnimatePresence>
                {passwordReset && <motion.div initial={{
                opacity: 0,
                scale: 0.95
              }} animate={{
                opacity: 1,
                scale: 1
              }} transition={{
                duration: 0.3
              }} className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">Password updated successfully</h3>
                      <p className="text-sm text-muted-foreground">
                        Your password has been changed. You can now use your new password to sign in to your account.
                      </p>
                    </div>
                  </motion.div>}
              </AnimatePresence>

              {/* Password Reset Form */}
              <AnimatePresence>
                {!passwordReset && <motion.form initial={{
                opacity: 1
              }} exit={{
                opacity: 0,
                height: 0
              }} transition={{
                duration: 0.2
              }} onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                        New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="new-password" type={showNewPassword ? "text" : "password"} placeholder="Enter your new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} onBlur={() => setTouched({
                      ...touched,
                      newPassword: true
                    })} className={cn("pl-10 pr-10 bg-background border-input focus:ring-2 focus:ring-ring transition-all", newPasswordError && touched.newPassword && "border-destructive focus:ring-destructive/20")} disabled={isAnyLoading} aria-describedby={newPasswordError ? "new-password-error" : "password-requirements"} aria-invalid={!!newPasswordError && touched.newPassword} />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground" disabled={isAnyLoading} aria-label={showNewPassword ? "Hide password" : "Show password"}>
                              {showNewPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{showNewPassword ? "Hide password" : "Show password"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Password Strength Indicator */}
                      {newPassword && <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Password strength</span>
                            <span className={cn("text-xs font-medium", passwordStrength.color)}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <Progress value={passwordStrength.score} className="h-2" />
                        </div>}

                      <AnimatePresence>
                        {newPasswordError && touched.newPassword && <motion.p initial={{
                      opacity: 0,
                      height: 0
                    }} animate={{
                      opacity: 1,
                      height: "auto"
                    }} exit={{
                      opacity: 0,
                      height: 0
                    }} id="new-password-error" className="text-xs text-destructive">
                            {newPasswordError}
                          </motion.p>}
                      </AnimatePresence>

                      {/* Password Requirements */}
                      {touched.newPassword && newPassword && <div id="password-requirements" className="space-y-1">
                          <p className="text-xs text-muted-foreground">Password requirements:</p>
                          <ul className="space-y-1">
                            {requirements.map((req, index) => <li key={index} className="flex items-center gap-2 text-xs">
                                {req.test ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                                <span className={req.test ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                                  {req.label}
                                </span>
                              </li>)}
                          </ul>
                        </div>}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onBlur={() => setTouched({
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

                    {/* Update Password Button */}
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200" disabled={!isFormValid || isAnyLoading}>
                      {isSubmitting ? <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating password...
                        </> : "Update password"}
                    </Button>
                  </motion.form>}
              </AnimatePresence>

              {/* Back to Sign In Link */}
              <div className="text-center pt-4 border-t border-border/50">
                <Button type="button" variant="ghost" onClick={handleBackToLogin} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2" disabled={isAnyLoading}>
                  <ArrowLeft className="h-3 w-3" />
                  {passwordReset ? "Continue to sign in" : "Back to sign in"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>;
}