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
import { motion } from "framer-motion"

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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-lime-accent mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect automatically
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      {/* Background Gradient Effect matching landing */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-lime-accent/5 dark:bg-lime-accent/5 blur-[120px] rounded-full pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -z-10 -translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10">
        <DashboardHeader user={user} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full lg:w-80 shrink-0">
              <DashboardSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                stats={stats}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Welcome Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.05)] p-6 sm:p-8 mb-8"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-lime-accent/20 text-lime-accent">
                    <Sparkles className="h-4 w-4 animate-pulse group-hover:scale-110 transition-transform" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-dark dark:text-white">
                    Welcome back, <span className="text-gray-500 dark:text-gray-400">{user?.name}</span>!
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
                  Ready to chat with your documents? Upload a new document or continue an existing conversation.
                </p>
              </motion.div>

              {/* Tab Content */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "pdfs" ? (
                  <div className="space-y-8">
                    <PdfUpload />
                    <PdfList />
                  </div>
                ) : (
                  <SessionList />
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
