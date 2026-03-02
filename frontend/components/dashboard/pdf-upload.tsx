"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, Loader2, CloudUpload, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { motion, AnimatePresence } from "framer-motion"

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
          ; (async () => {
            try {
              const result = await api.uploadPdfChunked(item.file, (progress) => {
                setQueue(q => q.map(qi => qi.id === item.id ? { ...qi, progress: progress * 0.5 } : qi)) // Upload is first 50%
              })

              // If the backend says it's processing in the background, we need to poll
              if (result.pdf && (result.pdf.processing_status === 'pending' || result.pdf.processing_status === 'processing')) {
                setQueue(q => q.map(qi => qi.id === item.id ? { ...qi, progress: 50, message: 'Processing AI...' } : qi))

                // Poll every 5 seconds
                const pollInterval = setInterval(async () => {
                  try {
                    const statusResult = await api.getPdfStatus(result.pdf.pdf_id)

                    if (statusResult.pdf.processing_status === 'completed') {
                      clearInterval(pollInterval)
                      setQueue(q => q.map(qi => qi.id === item.id ? { ...qi, status: 'success' as const, progress: 100, message: 'Done' } : qi))
                      window.dispatchEvent(new Event("pdfUploaded"))
                      activeUploads.current--
                      processQueue()
                    } else if (statusResult.pdf.processing_status === 'failed') {
                      clearInterval(pollInterval)
                      setQueue(q => q.map(qi => qi.id === item.id ? { ...qi, status: 'error' as const, progress: 100, message: 'AI Processing failed' } : qi))
                      activeUploads.current--
                      processQueue()
                    } else {
                      // Sync live telemetry progress from Python db updates
                      const liveProgress = statusResult.pdf.processing_progress || 0
                      setQueue(q => q.map(qi => {
                        if (qi.id === item.id) {
                          // Ensure we show at least 50% since the upload finished
                          const displayProgress = Math.max(50, liveProgress)
                          return { ...qi, progress: displayProgress, message: `Processing AI (${displayProgress}%)...` }
                        }
                        return qi
                      }))
                    }
                  } catch (pollErr) {
                    // Ignore minor poll network errors and keep trying
                  }
                }, 5000)

              } else {
                // It finished synchronously
                setQueue(q => q.map(qi => qi.id === item.id ? { ...qi, status: 'success' as const, progress: 100, message: 'Uploaded' } : qi))
                window.dispatchEvent(new Event("pdfUploaded"))
                activeUploads.current--
                processQueue()
              }

            } catch (error: any) {
              setQueue(q => q.map(qi => qi.id === item.id ? { ...qi, status: 'error' as const, progress: 100, message: error.message || 'Upload failed' } : qi))
              activeUploads.current--
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
    <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-lime-accent/10">
          <CloudUpload className="h-5 w-5 text-lime-accent" />
        </div>
        <h3 className="text-xl font-extrabold text-dark dark:text-white tracking-tight">Upload Documents</h3>
        {hasActiveUploads && (
          <span className="ml-auto text-xs text-lime-accent font-semibold flex items-center gap-1.5 bg-lime-accent/10 px-3 py-1.5 rounded-full border border-lime-accent/20">
            <Loader2 className="h-3 w-3 animate-spin" />
            Uploading...
          </span>
        )}
      </div>

      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center
          ${isDragging
            ? "border-lime-accent bg-lime-accent/5"
            : "border-gray-200 dark:border-white/10 hover:border-lime-accent/50 hover:bg-gray-50 dark:hover:bg-white/5 bg-gray-50/50 dark:bg-[#111]"
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

        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-lg font-bold text-dark dark:text-white mb-2">Drop your documents here</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">or click to browse — uploads run in the background</p>
        <Button
          type="button"
          className="bg-lime-accent text-black h-10 px-6 rounded-full font-bold text-sm shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] hover:bg-gradient-to-br hover:from-lime-accent hover:to-lime-400 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
        >
          <Upload className="w-4 h-4 mr-2" />
          Select Documents
        </Button>
        <p className="text-xs text-gray-400 mt-6 font-medium">
          PDF, DOCX, PPTX, TXT, CSV (Max 50MB)
        </p>
      </div>

      {/* Upload Queue Widget */}
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#111] shadow-sm"
          >
            {/* Queue Header */}
            <div
              className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-[#1A1A1A] cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-b border-gray-200 dark:border-white/10"
              onClick={() => setIsQueueMinimized(!isQueueMinimized)}
            >
              <div className="flex items-center gap-2.5 text-sm font-bold text-dark dark:text-white">
                {hasActiveUploads ? (
                  <Loader2 className="h-4 w-4 animate-spin text-lime-accent" />
                ) : errorCount > 0 ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-lime-accent" />
                )}
                <span>
                  {hasActiveUploads
                    ? `Uploading ${completedCount + errorCount} / ${totalCount}`
                    : `${completedCount} uploaded${errorCount > 0 ? `, ${errorCount} failed` : ''}`
                  }
                </span>
              </div>
              <div className="flex items-center gap-3">
                {!hasActiveUploads && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clearCompleted() }}
                    className="text-xs font-semibold text-gray-500 hover:text-dark dark:hover:text-white transition-colors uppercase tracking-wider bg-gray-200 dark:bg-white/10 px-2 py-1 rounded"
                  >
                    Clear All
                  </button>
                )}
                <div className="p-1 rounded bg-gray-200 dark:bg-white/10">
                  {isQueueMinimized ? <ChevronUp className="h-3 w-3 text-dark dark:text-white" /> : <ChevronDown className="h-3 w-3 text-dark dark:text-white" />}
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            {hasActiveUploads && (
              <div className="h-1 bg-gray-200 dark:bg-white/5">
                <div
                  className="h-full bg-lime-accent transition-all duration-300 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            )}

            {/* Queue Items */}
            <AnimatePresence>
              {!isQueueMinimized && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-white/5"
                >
                  {queue.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 text-sm group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      {/* Status Icon */}
                      <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5">
                        {item.status === 'uploading' && <Loader2 className="h-3.5 w-3.5 animate-spin text-lime-accent" />}
                        {item.status === 'queued' && <CloudUpload className="h-3.5 w-3.5 text-gray-400" />}
                        {item.status === 'success' && <CheckCircle className="h-3.5 w-3.5 text-lime-accent" />}
                        {item.status === 'error' && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                      </div>

                      {/* File Info + Progress */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="truncate font-semibold text-dark dark:text-white">{item.file.name}</span>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                            {item.status === 'uploading' && `${Math.round(item.progress)}%`}
                            {item.status === 'queued' && 'Queued'}
                            {item.status === 'success' && 'Done'}
                            {item.status === 'error' && (item.message || 'Failed')}
                          </span>
                        </div>
                        {item.status === 'uploading' && (
                          <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-lime-accent rounded-full transition-all duration-300"
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
                            className="text-xs text-lime-accent hover:text-black dark:hover:text-lime-accent font-bold px-2 py-1.5 rounded-md hover:bg-lime-accent/20 transition-colors"
                          >
                            Retry
                          </button>
                        )}
                        {(item.status === 'success' || item.status === 'error') && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}