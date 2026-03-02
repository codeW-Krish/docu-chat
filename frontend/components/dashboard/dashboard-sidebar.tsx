// components/dashboard/dashboard-sidebar.tsx
"use client"

import { FileText, MessageSquare, Upload } from "lucide-react"
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
    <div className="w-full lg:w-80 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/10 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none rounded-2xl p-6 h-fit sticky top-24">
      <div className="mb-6">
        <h3 className="font-bold text-xs text-zinc-400 dark:text-gray-500 tracking-wider uppercase">Navigation</h3>
      </div>

      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group text-left",
              activeTab === tab.id
                ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-bold"
                : "text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5"
            )}
          >
            <tab.icon className={cn(
              "w-5 h-5 transition-colors",
              activeTab === tab.id ? "text-lime-600 dark:text-lime-accent" : "text-zinc-400 group-hover:text-lime-600 dark:group-hover:text-lime-accent"
            )} />
            <div>
              <div className="text-sm">{tab.label}</div>
              <div className={cn(
                "text-xs mt-0.5",
                activeTab === tab.id ? "text-zinc-600 dark:text-gray-400 font-medium" : "opacity-70"
              )}>{tab.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-white/10">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold text-zinc-400 dark:text-gray-500 tracking-wide uppercase">Documents</span>
            <span className="font-extrabold text-zinc-900 dark:text-white text-sm">{stats?.pdfCount || 0}</span>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold text-zinc-400 dark:text-gray-500 tracking-wide uppercase">Active Chats</span>
            <span className="font-extrabold text-zinc-900 dark:text-white text-sm">{stats?.sessionCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
