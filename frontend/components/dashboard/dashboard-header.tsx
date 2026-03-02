"use client"

import { User, LogOut, Settings } from "lucide-react"
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
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="text-lg font-extrabold text-zinc-900 dark:text-white tracking-tight">AI DocuChat</span>
          </Link>

          {/* User Menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-3 py-1.5 rounded-full shadow-sm">
              <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-600 dark:text-gray-300" />
              </div>
              <div className="hidden sm:block pr-3">
                <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">{user?.name}</p>
                <p className="text-[10px] text-zinc-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>

            <Link href="/dashboard/profile">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-all h-9 w-9 shadow-sm"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="rounded-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 text-zinc-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all h-9 w-9 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
