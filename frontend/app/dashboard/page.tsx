"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { PdfUpload } from "@/components/dashboard/pdf-upload"
import { PdfList } from "@/components/dashboard/pdf-list"
import { SessionList } from "@/components/dashboard/session-list"
import { Loader2, FileText, Sparkles, Upload, MessageSquare } from "lucide-react"
import { api } from "@/lib/api"

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"pdfs" | "sessions">("pdfs")
  const [stats, setStats] = useState({ pdfCount: 0, sessionCount: 0 })

  // Simple redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin")
    }
  }, [isLoading, isAuthenticated, router])

  const fetchStats = async () => {
    try {
      const stats = await api.getDashboardStats()
      setStats({
        pdfCount: stats.pdfCount,
        sessionCount: stats.sessionCount
      })
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
    }
  }, [isAuthenticated])

  // Listen for PDF upload events to update stats
  useEffect(() => {
    const handlePdfUploaded = () => {
      fetchStats()
    }

    window.addEventListener("pdfUploaded", handlePdfUploaded)
    return () => window.removeEventListener("pdfUploaded", handlePdfUploaded)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect automatically
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects matching your theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/10 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.08),transparent_50%)] bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.06),transparent_50%)]" />

      {/* Floating document icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FileText className="absolute top-20 left-10 w-6 h-6 text-accent/20 animate-document-float" style={{ animationDelay: "0s" }} />
        <FileText className="absolute top-40 right-20 w-4 h-4 text-accent/15 animate-document-float" style={{ animationDelay: "2s" }} />
        <FileText className="absolute bottom-32 left-1/4 w-5 h-5 text-accent/18 animate-document-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10">
        <DashboardHeader user={user} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <DashboardSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              stats={stats}
            />

            {/* Main Content */}
            <div className="flex-1">
              {/* Welcome Card */}
              <div className="premium-card p-6 mb-8 animate-slide-up">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                  <h2 className="text-2xl font-sans font-semibold">
                    Welcome back, <span className="gradient-text">{user?.name}</span>!
                  </h2>
                </div>
                <p className="text-muted-foreground font-serif">
                  Ready to chat with your documents? Upload Document or continue an existing conversation.
                </p>
              </div>

              {/* Tab Content */}
              {activeTab === "pdfs" ? (
                <div className="space-y-8">
                  <PdfUpload />
                  <PdfList />
                </div>
              ) : (
                <SessionList />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}