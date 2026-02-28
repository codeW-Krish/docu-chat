'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Eye, EyeOff, ArrowRight, FileText, Sparkles } from 'lucide-react';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const { resetPassword, isLoading, error: authError, clearError } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        clearError();

        if (!token) {
            setLocalError("Invalid or missing reset token.");
            return;
        }

        if (password !== confirmPassword) {
            setLocalError("Passwords don't match");
            return;
        }

        if (password.length < 8) {
            setLocalError("Password must be at least 8 characters");
            return;
        }

        try {
            const message = await resetPassword(token, password);
            setSuccessMessage(message);
            setTimeout(() => {
                router.push('/signin');
            }, 2000);
        } catch (err) {
            // Error handled by useAuth
        }
    };

    if (!token) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Invalid or missing reset token. Please request a new link.</AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className="premium-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-sans">Reset Password</CardTitle>
                <CardDescription className="font-serif">Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent>
                {(localError || authError) && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{localError || authError}</AlertDescription>
                    </Alert>
                )}
                {successMessage && (
                    <Alert className="mb-4 border-green-500/50 bg-green-500/10 text-green-500">
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'black' }} />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading || !!successMessage}
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
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'black' }} />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading || !!successMessage}
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
                    <Button type="submit" className="w-full premium-button" disabled={isLoading || !!successMessage}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            <>
                                Reset Password
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <div className="text-sm text-center text-muted-foreground">
                    Remember your password?{' '}
                    <Link href="/signin" className="text-primary hover:underline">
                        Sign in
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/10 to-background" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.08),transparent_50%)] bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.06),transparent_50%)]" />

            {/* Floating document icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <FileText className="absolute top-20 left-10 w-6 h-6 text-accent/20 animate-document-float" style={{ animationDelay: "0s" }} />
                <FileText className="absolute bottom-32 right-1/4 w-5 h-5 text-accent/18 animate-document-float" style={{ animationDelay: "3s" }} />
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
                            Set New <span className="gradient-text">Password</span>
                        </h1>
                        <p className="text-muted-foreground font-serif">Secure your account with a new password</p>
                    </div>

                    <Suspense fallback={
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    }>
                        <ResetPasswordContent />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
