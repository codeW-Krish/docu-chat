"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Mail, Lock, Save, ArrowLeft, CheckCircle, AlertCircle, Settings, Bot } from "lucide-react"
import Link from "next/link"
import { api, LlmProvider, RetrievalMode } from "@/lib/api"
import { PROVIDER_MODELS, PROVIDER_LABELS, getDefaultModel, isValidModel } from "@/lib/provider-models"

export default function ProfilePage() {
    const { user, isLoading: authLoading } = useAuth()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    // AI Settings state
    const [defaultProvider, setDefaultProvider] = useState<LlmProvider>("groq")
    const [defaultModel, setDefaultModel] = useState<string>(getDefaultModel("groq"))
    const [treeGenMode, setTreeGenMode] = useState<string>("on_upload")
    const [defaultRetrievalMode, setDefaultRetrievalMode] = useState<RetrievalMode>("vector")
    const [aiSettingsSaved, setAiSettingsSaved] = useState(false)

    useEffect(() => {
        if (user) {
            setName(user.name)
            setEmail(user.email)
        }

        // Load AI settings from localStorage
        if (typeof window !== "undefined") {
            const validProviders: LlmProvider[] = ["groq", "cerebras", "bytez"]
            const savedProvider = localStorage.getItem("settings-default-provider") || localStorage.getItem("chat-provider-default")
            if (savedProvider && validProviders.includes(savedProvider as LlmProvider)) {
                setDefaultProvider(savedProvider as LlmProvider)
                const savedModel = localStorage.getItem("settings-default-model") || localStorage.getItem("chat-model-default")
                if (savedModel && isValidModel(savedProvider, savedModel)) {
                    setDefaultModel(savedModel)
                } else {
                    setDefaultModel(getDefaultModel(savedProvider))
                }
            }

            const savedTreeMode = localStorage.getItem("settings-tree-gen-mode")
            if (savedTreeMode === "on_upload" || savedTreeMode === "manual") {
                setTreeGenMode(savedTreeMode)
            }

            const savedRetrieval = localStorage.getItem("settings-retrieval-mode") || localStorage.getItem("chat-retrieval-mode")
            if (savedRetrieval === "vector" || savedRetrieval === "pageindex" || savedRetrieval === "comparison") {
                setDefaultRetrievalMode(savedRetrieval as RetrievalMode)
            }
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
        <div className="container mx-auto px-4 py-8 max-w-2xl mt-4">
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center text-sm font-medium text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-4 py-2 rounded-full"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-lime-accent/10">
                        <User className="h-6 w-6 text-lime-600 dark:text-lime-accent" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                        Profile <span className="bg-gradient-to-r from-lime-accent to-lime-500 bg-clip-text text-transparent">Settings</span>
                    </h1>
                </div>
                <p className="text-zinc-500 dark:text-gray-400 mt-3 text-sm sm:text-base">
                    Manage your account settings and preferences
                </p>
            </div>

            <Card className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none animate-slide-up border-0 overflow-hidden">
                <CardHeader className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/5 pb-6">
                    <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Personal Information</CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-gray-400">Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {message && (
                        <Alert className={`mb-6 border-0 rounded-xl ${message.type === "success" ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500"}`}>
                            <AlertDescription className="font-medium text-sm flex items-center gap-2">
                                {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {message.text}
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-zinc-900 dark:text-gray-300">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="email"
                                    value={email}
                                    disabled
                                    className="pl-10 h-12 bg-zinc-50 dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl opacity-70 cursor-not-allowed text-zinc-900 dark:text-white text-base"
                                />
                            </div>
                            <p className="text-xs text-zinc-500 font-medium">Email address cannot be changed</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-semibold text-zinc-900 dark:text-gray-300">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 h-12 bg-zinc-50 dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl focus-visible:ring-1 focus-visible:ring-lime-accent focus-visible:border-lime-accent text-zinc-900 dark:text-white text-base font-medium"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-zinc-100 dark:border-white/10">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-zinc-400" />
                                Change Password
                            </h3>
                            <div className="grid gap-5 shadow-sm p-5 sm:p-6 border border-zinc-200 dark:border-white/5 rounded-2xl bg-zinc-50/50 dark:bg-white/[0.02]">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-semibold text-zinc-900 dark:text-gray-300">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 h-12 bg-white dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl focus-visible:ring-1 focus-visible:ring-lime-accent focus-visible:border-lime-accent text-zinc-900 dark:text-white"
                                            placeholder="Leave blank to keep current"
                                            minLength={8}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-zinc-900 dark:text-gray-300">Confirm New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10 h-12 bg-white dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl focus-visible:ring-1 focus-visible:ring-lime-accent focus-visible:border-lime-accent text-zinc-900 dark:text-white"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 mt-4">
                            <Button
                                type="submit"
                                className="bg-lime-accent text-black rounded-full font-bold shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] hover:scale-[1.02] active:scale-95 transition-all h-12 px-8 min-w-[160px]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-5 w-5" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* AI Settings Card */}
            <Card className="mt-8 bg-white dark:bg-[#0A0A0A] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden">
                <CardHeader className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/5 pb-6">
                    <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Bot className="w-5 h-5 text-lime-600 dark:text-lime-accent" />
                        AI Settings
                    </CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-gray-400">Configure your default AI provider, model, and retrieval preferences.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {aiSettingsSaved && (
                        <Alert className="mb-4 border-0 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500">
                            <AlertDescription className="font-medium text-sm flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                AI settings saved successfully
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-5 p-5 sm:p-6 border border-zinc-200 dark:border-white/5 rounded-2xl bg-zinc-50/50 dark:bg-white/[0.02]">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-zinc-900 dark:text-gray-300">Default Provider</Label>
                            <Select value={defaultProvider} onValueChange={(value) => {
                                const p = value as LlmProvider
                                setDefaultProvider(p)
                                setDefaultModel(getDefaultModel(p))
                            }}>
                                <SelectTrigger className="w-full bg-white dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl h-11 focus:ring-1 focus:ring-lime-accent text-zinc-900 dark:text-white font-medium">
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111]">
                                    {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key} className="focus:bg-zinc-100 dark:focus:bg-white/10 cursor-pointer">{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-zinc-900 dark:text-gray-300">Default Model</Label>
                            <Select value={defaultModel} onValueChange={setDefaultModel}>
                                <SelectTrigger className="w-full bg-white dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl h-11 focus:ring-1 focus:ring-lime-accent text-zinc-900 dark:text-white font-medium">
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111]">
                                    {(PROVIDER_MODELS[defaultProvider] || []).map((m) => (
                                        <SelectItem key={m.id} value={m.id} className="focus:bg-zinc-100 dark:focus:bg-white/10 cursor-pointer">
                                            <span className="flex items-center gap-2">
                                                {m.name}
                                                <span className="text-[10px] text-zinc-400">{m.context}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-zinc-900 dark:text-gray-300">Tree Generation Mode</Label>
                            <Select value={treeGenMode} onValueChange={setTreeGenMode}>
                                <SelectTrigger className="w-full bg-white dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl h-11 focus:ring-1 focus:ring-lime-accent text-zinc-900 dark:text-white font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111]">
                                    <SelectItem value="on_upload" className="focus:bg-zinc-100 dark:focus:bg-white/10 cursor-pointer">On Upload</SelectItem>
                                    <SelectItem value="manual" className="focus:bg-zinc-100 dark:focus:bg-white/10 cursor-pointer">Manual Trigger</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-zinc-500 font-medium">
                                {treeGenMode === "on_upload"
                                    ? "PageIndex tree will be generated automatically when a PDF is uploaded"
                                    : "You can manually trigger tree generation for each PDF"}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-zinc-900 dark:text-gray-300">Default Retrieval Mode</Label>
                            <Select value={defaultRetrievalMode} onValueChange={(v) => setDefaultRetrievalMode(v as RetrievalMode)}>
                                <SelectTrigger className="w-full bg-white dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl h-11 focus:ring-1 focus:ring-lime-accent text-zinc-900 dark:text-white font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111]">
                                    <SelectItem value="vector" className="focus:bg-zinc-100 dark:focus:bg-white/10 cursor-pointer">Vector Search</SelectItem>
                                    <SelectItem value="pageindex" className="focus:bg-zinc-100 dark:focus:bg-white/10 cursor-pointer">PageIndex</SelectItem>
                                    <SelectItem value="comparison" className="focus:bg-zinc-100 dark:focus:bg-white/10 cursor-pointer">Comparison</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="button"
                            onClick={() => {
                                if (typeof window !== "undefined") {
                                    localStorage.setItem("settings-default-provider", defaultProvider)
                                    localStorage.setItem("settings-default-model", defaultModel)
                                    localStorage.setItem("settings-tree-gen-mode", treeGenMode)
                                    localStorage.setItem("settings-retrieval-mode", defaultRetrievalMode)
                                    // Also update the chat defaults so they apply immediately
                                    localStorage.setItem("chat-provider-default", defaultProvider)
                                    localStorage.setItem("chat-model-default", defaultModel)
                                    localStorage.setItem("chat-retrieval-mode", defaultRetrievalMode)
                                }
                                setAiSettingsSaved(true)
                                setTimeout(() => setAiSettingsSaved(false), 3000)
                            }}
                            className="bg-lime-accent text-black rounded-full font-bold shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] hover:scale-[1.02] active:scale-95 transition-all h-12 px-8 min-w-[160px]"
                        >
                            <Settings className="mr-2 h-5 w-5" />
                            Save AI Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
