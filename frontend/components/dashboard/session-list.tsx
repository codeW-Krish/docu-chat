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
      <div className="premium-card p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="h-5 w-5 text-accent" />
          <h3 className="text-xl font-sans font-semibold">Chat Sessions</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="glass-morphism p-4 rounded-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-accent" />
                  <div>
                    <div className="font-sans font-medium bg-muted/50 h-4 w-40 rounded mb-2"></div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-serif">
                      <div className="bg-muted/50 h-3 w-24 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="premium-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-accent" />
          <h3 className="text-xl font-sans font-semibold">Chat Sessions</h3>
          <span className="glass-morphism px-2 py-1 rounded-full text-sm font-medium">
            {sessions.length} sessions
          </span>
        </div>

        <Button onClick={handleCreateSession} className="premium-button">
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">No chat sessions yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first session to start chatting with your Documents!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.session_id} className="glass-morphism p-4 rounded-lg transition-all hover:bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <MessageSquare className="h-5 w-5 text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-medium truncate">{session.session_name}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground font-serif mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{session.pdf_count || 0} PDFs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="premium-button"
                  onClick={() => window.location.href = `/chat/${session.session_id}`}
                >
                  Continue Chat
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
