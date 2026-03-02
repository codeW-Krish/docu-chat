"use client"

import { useState, useEffect } from "react"
import { FileText, CheckCircle, Clock, AlertCircle, MessageSquare, Trash2, File } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"

export function PdfList() {
  const [pdfs, setPdfs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadPdfs = async () => {
    try {
      const response = await api.getPdfs()
      setPdfs(response.pdfs)
    } catch (error) {
      console.error("Failed to load PDFs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPdfs()
  }, [])

  // Listen for PDF upload events
  useEffect(() => {
    const handlePdfUploaded = () => {
      loadPdfs()
    }

    window.addEventListener("pdfUploaded", handlePdfUploaded)
    return () => window.removeEventListener("pdfUploaded", handlePdfUploaded)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Ready to chat"
      case "processing":
        return "Processing..."
      case "error":
        return "Processing failed"
      default:
        return "Pending"
    }
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />;
    if (fileName.endsWith('.docx')) return <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />;
    if (fileName.endsWith('.txt')) return <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />;
    if (fileName.endsWith('.csv')) return <FileText className="h-5 w-5 text-green-500 flex-shrink-0" />;
    return <File className="h-5 w-5 text-accent flex-shrink-0" />;
  };

  const handleDeletePdf = async (pdfId: string) => {
    if (!confirm("Are you sure you want to delete this PDF?")) return

    try {
      await api.deletePdf(pdfId)
      setPdfs(pdfs.filter(pdf => pdf.pdf_id !== pdfId))
      // Trigger refresh of stats
      window.dispatchEvent(new Event("pdfUploaded"))
    } catch (error) {
      console.error("Failed to delete PDF:", error)
    }
  }

  const handleChat = async (pdf: any) => {
    try {
      const response = await api.createSession(pdf.file_name, [pdf.pdf_id]);
      // Navigate to the newly created chat session
      window.location.href = `/chat/${response.session.session_id}`;
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-lime-accent/10">
            <FileText className="h-5 w-5 text-lime-accent" />
          </div>
          <h3 className="text-xl font-extrabold text-dark dark:text-white tracking-tight">Your Documents</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-50 dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-white/5 animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-white/10"></div>
                <div>
                  <div className="bg-gray-200 dark:bg-white/10 h-4 w-40 rounded mb-2"></div>
                  <div className="bg-gray-100 dark:bg-white/5 h-3 w-24 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg p-6 sm:p-8 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-lime-accent/10">
          <FileText className="h-5 w-5 text-lime-accent" />
        </div>
        <h3 className="text-xl font-extrabold text-dark dark:text-white tracking-tight">Your Documents</h3>
        <span className="ml-auto bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400">
          {pdfs.length} files
        </span>
      </div>

      {pdfs.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111]">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-lg font-bold text-dark dark:text-white mb-2">No Documents uploaded yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Upload your first document above to start chatting!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pdfs.map((pdf) => (
            <div key={pdf.pdf_id} className="bg-gray-50 dark:bg-[#111] p-4 sm:p-5 rounded-xl border border-gray-100 dark:border-white/5 transition-all duration-300 hover:border-lime-accent/30 hover:shadow-md group">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1a1a1a] shadow-sm flex items-center justify-center border border-gray-100 dark:border-white/5 shrink-0">
                    {getFileIcon(pdf.file_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-dark dark:text-white truncate mb-1">{pdf.file_name}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-[#1a1a1a] px-2 py-0.5 rounded-md border border-gray-100 dark:border-white/5 shadow-sm">
                        {getStatusIcon(pdf.processing_status)}
                        <span className="text-dark dark:text-gray-300">{getStatusText(pdf.processing_status)}</span>
                      </div>
                      {pdf.page_count && (
                        <span>• {pdf.page_count} pages</span>
                      )}
                      <span>• {new Date(pdf.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-gray-200 dark:border-white/5 sm:border-0 pl-14 sm:pl-0">
                  <Button
                    size="sm"
                    className="bg-lime-accent text-black rounded-full font-bold shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] hover:scale-105 active:scale-95 transition-all text-xs h-9 px-4 disabled:opacity-50 disabled:hover:scale-100"
                    disabled={pdf.processing_status !== "completed"}
                    onClick={() => handleChat(pdf)}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Chat
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePdf(pdf.pdf_id)}
                    className="h-9 w-9 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
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
