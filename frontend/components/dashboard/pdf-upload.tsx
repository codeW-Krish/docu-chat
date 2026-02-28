"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, Loader2, CloudUpload, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Minimize2, Maximize2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

// --- Upload Queue Types ---
type QueueItemStatus = 'queued' | 'uploading' | 'success' | 'error'

interface QueueItem {
  id: string
  file: File
  status: QueueItemStatus
  progress: number
  message?: string
}

// Allowed MIME types and extensions
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_CONCURRENT = 2

export function PdfUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isQueueMinimized, setIsQueueMinimized] = useState(false)
  const activeUploads = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  // Derive states
  const hasActiveUploads = queue.some(q => q.status === 'uploading' || q.status === 'queued')
  const completedCount = queue.filter(q => q.status === 'success').length
  const errorCount = queue.filter(q => q.status === 'error').length
  const totalCount = queue.length
  const overallProgress = totalCount > 0
    ? queue.reduce((sum, q) => sum + (q.status === 'success' ? 100 : q.status === 'error' ? 100 : q.progress), 0) / totalCount
    : 0

  // Process the queue — upload next items if slots available
  const processQueue = useCallback(() => {
    setQueue(prev => {
      const current = [...prev]
      let started = 0

      for (const item of current) {
        if (activeUploads.current >= MAX_CONCURRENT) break
        if (item.status !== 'queued') continue

        item.status = 'uploading'
        activeUploads.current++
        started++

        // Fire-and-forget upload for this item
        ;(async () => {
          try {
            await api.uploadPdf(item.file, (progress) => {
              setQueue(q => q.map(qi => qi.id === item.id ? { ...qi, progress } : qi))
            })
            setQueue(q => q.map(qi => qi.id === item.id ? { ...qi, status: 'success' as const, progress: 100, message: 'Uploaded' } : qi))
            window.dispatchEvent(new Event("pdfUploaded"))
          } catch (error: any) {
            setQueue(q => q.map(qi => qi.id === item.id ? { ...qi, status: 'error' as const, progress: 100, message: error.message || 'Upload failed' } : qi))
          } finally {
            activeUploads.current--
            // Trigger next in queue
            processQueue()
          }
        })()
      }

      return started > 0 ? current : prev
    })
  }, [])

  // Process queue whenever items change
  useEffect(() => {
    if (queue.some(q => q.status === 'queued') && activeUploads.current < MAX_CONCURRENT) {
      processQueue()
    }
  }, [queue, processQueue])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) enqueueFiles(Array.from(files))
  }

  const validateFile = (file: File): string | null => {
    const isAllowed = ALLOWED_TYPES.includes(file.type) || /\.(pdf|docx|txt|csv|pptx)$/i.test(file.name)
    if (!isAllowed) return 'Invalid file type'
    if (file.size > MAX_FILE_SIZE) return 'File too large (>50MB)'
    return null
  }

  const enqueueFiles = (files: File[]) => {
    const newItems: QueueItem[] = files.map(file => {
      const validationError = validateFile(file)
      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: validationError ? 'error' as const : 'queued' as const,
        progress: validationError ? 100 : 0,
        message: validationError || undefined,
      }
    })

    setQueue(prev => [...prev, ...newItems])
    setIsQueueMinimized(false)

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeItem = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id))
  }

  const clearCompleted = () => {
    setQueue(prev => prev.filter(q => q.status === 'uploading' || q.status === 'queued'))
  }

  const retryItem = (id: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'queued' as const, progress: 0, message: undefined } : q))
  }

  return (
    <div className="premium-card p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <CloudUpload className="h-5 w-5 text-accent" />
        <h3 className="text-xl font-sans font-semibold">Upload Documents</h3>
        {hasActiveUploads && (
          <span className="ml-auto text-xs text-accent font-medium flex items-center gap-1.5 bg-accent/10 px-2 py-1 rounded-full">
            <Loader2 className="h-3 w-3 animate-spin" />
            Uploading...
          </span>
        )}
      </div>

      {/* Drop Zone — always interactive, never blocked */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 interactive-hover cursor-pointer
          ${isDragging
            ? "border-accent bg-accent/5"
            : "border-border/50 hover:border-accent/30"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.docx,.txt,.csv,.pptx"
          multiple
          onChange={(e) => e.target.files && e.target.files.length > 0 && enqueueFiles(Array.from(e.target.files))}
        />

        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">Drop your documents here</p>
        <p className="text-muted-foreground mb-4">or click to browse — uploads run in the background</p>
        <Button className="premium-button">
          <Upload className="w-4 h-4 mr-2" />
          Select Documents
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Maximum file size: 50MB • PDF, DOCX, PPTX, TXT, CSV
        </p>
      </div>

      {/* Upload Queue Widget */}
      {queue.length > 0 && (
        <div className="mt-4 border rounded-xl overflow-hidden bg-card shadow-sm">
          {/* Queue Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 bg-muted/30 cursor-pointer select-none hover:bg-muted/50 transition-colors"
            onClick={() => setIsQueueMinimized(!isQueueMinimized)}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {hasActiveUploads ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              ) : errorCount > 0 ? (
                <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              )}
              <span>
                {hasActiveUploads
                  ? `Uploading ${completedCount + errorCount} / ${totalCount}`
                  : `${completedCount} uploaded${errorCount > 0 ? `, ${errorCount} failed` : ''}`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!hasActiveUploads && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearCompleted() }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
              {isQueueMinimized ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>

          {/* Overall Progress Bar */}
          {hasActiveUploads && (
            <div className="h-1 bg-muted/30">
              <div
                className="h-full bg-accent transition-all duration-300 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          )}

          {/* Queue Items */}
          {!isQueueMinimized && (
            <div className="max-h-52 overflow-y-auto custom-scrollbar divide-y divide-border/50">
              {queue.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 text-sm group">
                  {/* Status Icon */}
                  <div className="shrink-0">
                    {item.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                    {item.status === 'queued' && <CloudUpload className="h-4 w-4 text-muted-foreground" />}
                    {item.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>

                  {/* File Info + Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{item.file.name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.status === 'uploading' && `${Math.round(item.progress)}%`}
                        {item.status === 'queued' && 'Queued'}
                        {item.status === 'success' && 'Done'}
                        {item.status === 'error' && (item.message || 'Failed')}
                      </span>
                    </div>
                    {item.status === 'uploading' && (
                      <div className="mt-1 h-1 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.status === 'error' && (
                      <button
                        onClick={() => retryItem(item.id)}
                        className="text-xs text-accent hover:text-accent/80 font-medium px-1.5 py-0.5 rounded hover:bg-accent/10 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                    {(item.status === 'success' || item.status === 'error') && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}