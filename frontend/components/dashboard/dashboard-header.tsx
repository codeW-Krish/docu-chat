
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
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full glass-morphism animate-glow-pulse">
              <div className="relative h-4 w-4 rounded overflow-hidden">
                <Image src="/logo.png" alt="AI DocuChat Logo" fill className="object-cover" />
              </div>
              <span className="text-sm font-medium text-foreground">AI DocuChat</span>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 glass-morphism px-4 py-2 rounded-full">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground font-sans">{user?.name}</p>
                <p className="text-xs text-muted-foreground font-serif">{user?.email}</p>
              </div>
            </div>

            <Link href="/dashboard/profile">
              <Button
                variant="ghost"
                size="sm"
                className="glass-morphism border-border/50 hover:border-accent/30 interactive-hover text-muted-foreground hover:text-foreground"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="glass-morphism border-border/50 hover:border-accent/30 interactive-hover text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}