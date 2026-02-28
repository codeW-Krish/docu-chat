'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle2, FileText, Sparkles, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

export default function SignUpPage() {
  const router = useRouter();
  const { registerInit, registerComplete, isLoading, error: authError, clearError, isAuthenticated } = useAuth();

  // Steps: 'init' | 'otp'
  const [step, setStep] = useState<'init' | 'otp'>('init');

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleInitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (password !== confirmPassword) {
      setLocalError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }

    try {
      const data = await registerInit(name, email, password);
      setRegistrationToken(data.registration_token);
      setStep('otp');
    } catch (err) {
      // Error handled by useAuth
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (otp.length !== 6) {
      setLocalError("Please enter a valid 6-digit code");
      return;
    }

    try {
      await registerComplete(otp, registrationToken);
      router.push('/dashboard');
    } catch (err) {
      // Error handled by useAuth
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/10 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.08),transparent_50%)] bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.06),transparent_50%)]" />

      {/* Floating document icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FileText className="absolute top-20 left-10 w-6 h-6 text-accent/20 animate-document-float" style={{ animationDelay: "0s" }} />
        <FileText className="absolute top-40 right-20 w-4 h-4 text-accent/15 animate-document-float" style={{ animationDelay: "2s" }} />
        <FileText className="absolute bottom-32 left-1/4 w-5 h-5 text-accent/18 animate-document-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism mb-6 animate-glow-pulse">
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-sm font-medium text-foreground">AI DocuChat</span>
            </div>
            <h1 className="text-3xl font-bold font-sans tracking-tight mb-2">
              {step === 'init' ? (
                <>Create Your <span className="gradient-text">Account</span></>
              ) : (
                <>Verify Your <span className="gradient-text">Email</span></>
              )}
            </h1>
            <p className="text-muted-foreground font-serif">
              {step === 'init' ? 'Join thousands of professionals using AI DocuChat' : `We sent a verification code to ${email}`}
            </p>
          </div>

          <Card className="premium-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-sans">
                {step === 'init' ? 'Sign up' : 'Enter Code'}
              </CardTitle>
              <CardDescription className="font-serif">
                {step === 'init' ? 'Create your account to start chatting with PDFs' : 'Check your inbox for the 6-digit code'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(localError || authError) && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{localError || authError}</AlertDescription>
                </Alert>
              )}

              {step === 'init' ? (
                <form onSubmit={handleInitSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'black' }} />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10 glass-morphism"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'black' }} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10 glass-morphism"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'black' }} />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10 pr-10 glass-morphism"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'black' }} />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10 pr-10 glass-morphism"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <input
                      id="terms"
                      type="checkbox"
                      required
                      disabled={isLoading}
                      className="mt-1 rounded border-border/50 text-accent focus:ring-accent/20"
                    />
                    <Label htmlFor="terms" className="text-sm font-serif leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" className="text-accent hover:text-accent/80 transition-colors">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-accent hover:text-accent/80 transition-colors">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  <Button type="submit" className="w-full premium-button" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div className="flex justify-center mb-6">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl tracking-widest glass-morphism"
                      required
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Check your spam folder if you don't see the email.
                    </p>
                  </div>
                  <Button type="submit" className="w-full premium-button" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Create Account'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStep('init')}
                    disabled={isLoading}
                  >
                    Back to Sign Up
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {step === 'init' && (
                <>


                  <div className="text-sm text-center text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/signin" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </div>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}