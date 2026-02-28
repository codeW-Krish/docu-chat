'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowRight, FileText, Sparkles } from 'lucide-react';

export default function ForgotPasswordPage() {
    const { forgotPassword, isLoading, error: authError, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setSuccessMessage(null);

        try {
            const message = await forgotPassword(email);
            setSuccessMessage(message);
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
                            Reset <span className="gradient-text">Password</span>
                        </h1>
                        <p className="text-muted-foreground font-serif">Enter your email to receive a reset link</p>
                    </div>

                    <Card className="premium-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl font-sans">Forgot Password</CardTitle>
                            <CardDescription className="font-serif">We'll send you a link to reset your password</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {authError && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>{authError}</AlertDescription>
                                </Alert>
                            )}
                            {successMessage && (
                                <Alert className="mb-4 border-green-500/50 bg-green-500/10 text-green-500">
                                    <AlertDescription>{successMessage}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
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
                                            disabled={isLoading || !!successMessage}
                                            className="pl-10 glass-morphism"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full premium-button" disabled={isLoading || !!successMessage}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending Link...
                                        </>
                                    ) : (
                                        <>
                                            Send Reset Link
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
                </div>
            </div>
        </div>
    );
}
