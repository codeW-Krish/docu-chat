"use client"

import { User, LogOut, Settings, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { User as UserType } from "@/lib/api"

interface DashboardHeaderProps {
  user: UserType | null
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-l-secondary dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm transition-colors group-hover:bg-gray-100 dark:group-hover:bg-white/10">
              <span className="w-2 h-2 rounded-full bg-lime-accent animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.5)]"></span>
              <span className="text-sm font-bold text-dark dark:text-white tracking-wide">AI DocuChat</span>
            </div>
          </Link>

          {/* User Menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 px-3 py-1.5 rounded-full">
              <div className="w-7 h-7 rounded-full bg-lime-accent/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-lime-accent" />
              </div>
              <div className="hidden sm:block pr-2">
                <p className="text-xs font-bold text-dark dark:text-white leading-tight">{user?.name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>

            <Link href="/dashboard/profile">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/20 text-gray-500 dark:text-gray-400 hover:text-dark dark:hover:text-white transition-all h-9 w-9"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all h-9 w-9"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
