// components/dashboard/dashboard-sidebar.tsx
"use client"

import { FileText, MessageSquare, Upload, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  activeTab: "pdfs" | "sessions"
  onTabChange: (tab: "pdfs" | "sessions") => void
  stats?: {
    pdfCount: number
    sessionCount: number
  }
}

export function DashboardSidebar({ activeTab, onTabChange, stats }: DashboardSidebarProps) {
  const tabs = [
    {
      id: "pdfs" as const,
      label: "My Documents",
      icon: FileText,
      description: "Manage your documents"
    },
    {
      id: "sessions" as const,
      label: "Chat Sessions",
      icon: MessageSquare,
      description: "Your conversations"
    }
  ]

  return (
    <div className="w-80 glass-morphism rounded-xl p-6 h-fit sticky top-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-accent animate-pulse" />
        <h3 className="font-sans font-semibold text-lg">Navigation</h3>
      </div>

      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 interactive-hover",
              activeTab === tab.id
                ? "bg-accent/10 border border-accent/20 text-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <div className="text-left">
              <div className="font-sans font-medium text-sm">{tab.label}</div>
              <div className="font-serif text-xs opacity-70">{tab.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <div className="space-y-3">
          <div className="flex   justify-between items-center">
            <span className="font-serif text-sm text-muted-foreground">Documents Uploaded</span>
            <span className="font-sans font-semibold text-accent">{stats?.pdfCount || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-serif text-sm text-muted-foreground">Active Chats</span>
            <span className="font-sans font-semibold text-accent">{stats?.sessionCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}