"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion"

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { login, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

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
            Welcome Back
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-dark dark:text-white mb-2">
            Sign In
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Sign in to continue your document conversations
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-3 sm:p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.05)] p-6 sm:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-sm sm:text-base text-dark dark:text-gray-200">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11 sm:h-12 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 focus:border-lime-accent dark:focus:border-lime-accent/50 focus:ring-1 focus:ring-lime-accent/30 text-dark dark:text-white rounded-xl transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold text-sm sm:text-base text-dark dark:text-gray-200">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 pr-10 h-11 sm:h-12 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 focus:border-lime-accent dark:focus:border-lime-accent/50 focus:ring-1 focus:ring-lime-accent/30 text-dark dark:text-white rounded-xl transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-dark dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-lime-accent dark:hover:text-lime-accent transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-lime-accent text-black h-11 sm:h-12 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] hover:bg-gradient-to-br hover:from-lime-accent hover:to-lime-400 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-6 sm:mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="text-dark dark:text-white font-semibold hover:text-lime-accent dark:hover:text-lime-accent transition-colors underline decoration-lime-accent/30 hover:decoration-lime-accent underline-offset-4">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Background Gradient Effect matching landing */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-lime-accent/10 dark:bg-lime-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </div>
  )
}
