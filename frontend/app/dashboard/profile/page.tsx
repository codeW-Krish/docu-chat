"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Mail, Lock, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"

export default function ProfilePage() {
    const { user, isLoading: authLoading } = useAuth()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    useEffect(() => {
        if (user) {
            setName(user.name)
            setEmail(user.email)
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        setIsLoading(true)

        try {
            if (password && password !== confirmPassword) {
                throw new Error("Passwords do not match")
            }

            if (password && password.length < 8) {
                throw new Error("Password must be at least 8 characters")
            }

            const response = await api.updateProfile({
                name,
                ...(password ? { password } : {})
            })

            if (response.success) {
                setMessage({ type: "success", text: "Profile updated successfully" })
                setPassword("")
                setConfirmPassword("")
            } else {
                throw new Error(response.message)
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Failed to update profile"
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-accent transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold font-sans tracking-tight">
                    Profile <span className="gradient-text">Settings</span>
                </h1>
                <p className="text-muted-foreground font-serif mt-2">
                    Manage your account settings and preferences
                </p>
            </div>

            <Card className="premium-card animate-slide-up">
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent>
                    {message && (
                        <Alert variant={message.type === "error" ? "destructive" : "default"} className={`mb-6 ${message.type === "success" ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}`}>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    value={email}
                                    disabled
                                    className="pl-10 glass-morphism opacity-70 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 glass-morphism"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                            <h3 className="text-lg font-medium mb-4">Change Password</h3>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 glass-morphism"
                                            placeholder="Leave blank to keep current"
                                            minLength={8}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10 glass-morphism"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                className="premium-button min-w-[120px]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
