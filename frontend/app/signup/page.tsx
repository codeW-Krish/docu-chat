'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, CheckCircle2, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      if (data && data.registration_token) {
        setRegistrationToken(data.registration_token);
        setStep('otp');
      }
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
    <div
      className="min-h-screen bg-white dark:bg-[#050505] w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 text-dark dark:text-white transition-colors duration-300 relative overflow-hidden"
      style={{ fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif' }}
    >
      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-l-secondary dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-dark dark:text-gray-300 backdrop-blur-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-lime-accent animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.5)]"></span>
            Join
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-dark dark:text-white mb-2">
            {step === 'init' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            {step === 'init'
              ? 'Join thousands of professionals using AI DocuChat'
              : `We sent a 6-digit verification code to ${email}`}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {(localError || authError) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, height: 0 }}
              animate={{ opacity: 1, scale: 1, height: 'auto' }}
              exit={{ opacity: 0, scale: 0.95, height: 0 }}
              className="mb-6 p-3 sm:p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center"
            >
              {localError || authError}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.05)] p-6 sm:p-8"
        >
          {step === 'init' ? (
            <form onSubmit={handleInitSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold text-sm sm:text-base text-dark dark:text-gray-200">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 h-11 sm:h-12 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 focus:border-lime-accent dark:focus:border-lime-accent/50 focus:ring-1 focus:ring-lime-accent/30 text-dark dark:text-white rounded-xl transition-all duration-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-sm sm:text-base text-dark dark:text-gray-200">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 h-11 sm:h-12 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 focus:border-lime-accent dark:focus:border-lime-accent/50 focus:ring-1 focus:ring-lime-accent/30 text-dark dark:text-white rounded-xl transition-all duration-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold text-sm sm:text-base text-dark dark:text-gray-200">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10 pr-10 h-11 sm:h-12 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 focus:border-lime-accent dark:focus:border-lime-accent/50 focus:ring-1 focus:ring-lime-accent/30 text-dark dark:text-white rounded-xl transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-dark dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-semibold text-sm sm:text-base text-dark dark:text-gray-200">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10 pr-10 h-11 sm:h-12 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 focus:border-lime-accent dark:focus:border-lime-accent/50 focus:ring-1 focus:ring-lime-accent/30 text-dark dark:text-white rounded-xl transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-dark dark:hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2 pb-2">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  disabled={isLoading}
                  className="mt-1 flex-shrink-0 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-lime-accent focus:ring-lime-accent/30 cursor-pointer"
                />
                <Label htmlFor="terms" className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-dark dark:text-white font-medium hover:text-lime-accent dark:hover:text-lime-accent transition-colors">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-dark dark:text-white font-medium hover:text-lime-accent dark:hover:text-lime-accent transition-colors">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-lime-accent text-black h-11 sm:h-12 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] hover:bg-gradient-to-br hover:from-lime-accent hover:to-lime-400 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="flex justify-center mb-2">
                <div className="bg-lime-accent/20 border border-lime-accent/30 p-4 rounded-full shadow-[0_0_20px_rgba(163,230,53,0.2)]">
                  <CheckCircle2 className="h-10 w-10 text-lime-accent" />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="otp" className="text-center block font-semibold text-sm sm:text-base text-dark dark:text-gray-200">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-3xl tracking-[1em] indent-[1em] h-16 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 focus:border-lime-accent dark:focus:border-lime-accent/50 focus:ring-1 focus:ring-lime-accent/30 text-dark dark:text-white rounded-xl transition-all duration-300 font-mono"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-400 text-center">
                  Check your spam folder if you don't see the email.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-lime-accent text-black h-11 sm:h-12 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] hover:bg-gradient-to-br hover:from-lime-accent hover:to-lime-400 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => setStep('init')}
                  disabled={isLoading}
                  className="w-full bg-transparent text-gray-500 hover:text-dark dark:hover:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 h-11 sm:h-12 rounded-full font-bold text-sm sm:text-base transition-all duration-300"
                >
                  Back to Sign Up
                </Button>
              </div>
            </form>
          )}

          {step === 'init' && (
            <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-6 sm:mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
              Already have an account?{' '}
              <Link href="/signin" className="text-dark dark:text-white font-semibold hover:text-lime-accent dark:hover:text-lime-accent transition-colors underline decoration-lime-accent/30 hover:decoration-lime-accent underline-offset-4">
                Sign in
              </Link>
            </p>
          )}
        </motion.div>
      </div>

      {/* Background Gradient Effect matching landing */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-lime-accent/10 dark:bg-lime-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </div>
  );
}