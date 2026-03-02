"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Plus, Calendar, FileText, Users } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"

export function SessionList() {
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadSessions = async () => {
    try {
      const response = await api.getSessions()
      setSessions(response.sessions)
    } catch (error) {
      console.error("Failed to load sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const handleCreateSession = () => {
    // Navigate to PDF selection page
    window.location.href = "/chat";
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none p-6 sm:p-8 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-lime-accent/10">
            <MessageSquare className="h-5 w-5 text-lime-600 dark:text-lime-accent" />
          </div>
          <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Chat Sessions</h3>
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-zinc-50 dark:bg-[#111] p-4 rounded-xl border border-zinc-200 dark:border-white/5 animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-white/10"></div>
                <div>
                  <div className="bg-zinc-200 dark:bg-white/10 h-4 w-40 rounded mb-2"></div>
                  <div className="bg-zinc-100 dark:bg-white/5 h-3 w-24 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none p-6 sm:p-8 mt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-lime-accent/10">
            <MessageSquare className="h-5 w-5 text-lime-600 dark:text-lime-accent" />
          </div>
          <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Chat Sessions</h3>
          <span className="ml-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-3 py-1 rounded-full text-xs font-bold text-zinc-500 dark:text-gray-400 hidden sm:inline-block">
            {sessions.length} sessions
          </span>
        </div>

        <Button onClick={handleCreateSession} className="bg-lime-accent text-black rounded-full font-bold shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] hover:scale-105 active:scale-95 transition-all text-sm h-10 px-5 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#111]">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-zinc-200 dark:border-white/5 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-zinc-400 dark:text-gray-500" />
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No chat sessions yet</p>
          <p className="text-sm text-zinc-500 dark:text-gray-400">
            Create your first session to start chatting with your Documents!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.session_id} className="bg-zinc-50 dark:bg-[#111] p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-white/5 transition-all duration-300 hover:border-lime-500/30 dark:hover:border-lime-accent/30 hover:shadow-md group">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1a1a1a] shadow-sm flex items-center justify-center border border-zinc-200 dark:border-white/5 shrink-0">
                    <MessageSquare className="h-5 w-5 text-lime-600 dark:text-lime-accent flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-zinc-900 dark:text-white truncate mb-1">{session.session_name}</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-zinc-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-[#1a1a1a] px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/5 shadow-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white dark:bg-[#1a1a1a] px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/5 shadow-sm">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{session.pdf_count || 0} PDFs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-zinc-200 dark:border-white/5 sm:border-0 pl-14 sm:pl-0">
                  <Button
                    size="sm"
                    className="w-full sm:w-auto bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-xs h-9 px-5"
                    onClick={() => window.location.href = `/chat/${session.session_id}`}
                  >
                    Continue Chat
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
