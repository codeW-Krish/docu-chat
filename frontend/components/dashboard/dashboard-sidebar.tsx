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
    <div className="w-full lg:w-80 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 shadow-lg rounded-2xl p-6 h-fit sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 rounded-md bg-lime-accent/10">
          <Sparkles className="w-4 h-4 text-lime-accent animate-pulse" />
        </div>
        <h3 className="font-extrabold text-lg text-dark dark:text-white tracking-tight">Navigation</h3>
      </div>

      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
              activeTab === tab.id
                ? "bg-lime-accent/10 border border-lime-accent/20 text-dark dark:text-white font-semibold shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-dark dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
            )}
          >
            <tab.icon className={cn(
              "w-5 h-5 transition-colors",
              activeTab === tab.id ? "text-lime-accent" : "text-gray-400 group-hover:text-lime-accent"
            )} />
            <div className="text-left">
              <div className="text-sm">{tab.label}</div>
              <div className={cn(
                "text-xs mt-0.5",
                activeTab === tab.id ? "text-gray-600 dark:text-gray-400 font-normal" : "opacity-70"
              )}>{tab.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Documents</span>
            <span className="font-bold text-dark dark:text-white bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md text-sm">{stats?.pdfCount || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Chats</span>
            <span className="font-bold text-dark dark:text-white bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md text-sm">{stats?.sessionCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
