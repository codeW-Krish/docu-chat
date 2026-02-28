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
      <div className="premium-card p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-accent" />
          <h3 className="text-xl font-sans font-semibold">Your Documents</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-morphism p-4 rounded-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-accent" />
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
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-5 w-5 text-accent" />
        <h3 className="text-xl font-sans font-semibold">Your Documents</h3>
        <span className="glass-morphism px-2 py-1 rounded-full text-sm font-medium">
          {pdfs.length} files
        </span>
      </div>

      {pdfs.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">No Documents uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload your first Document to start chatting!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pdfs.map((pdf) => (
            <div key={pdf.pdf_id} className="glass-morphism p-4 rounded-lg transition-all hover:bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(pdf.file_name)}
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-medium truncate">{pdf.file_name}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-serif">
                      {getStatusIcon(pdf.processing_status)}
                      <span>{getStatusText(pdf.processing_status)}</span>
                      {pdf.page_count && (
                        <span>• {pdf.page_count} pages</span>
                      )}
                      <span>• {new Date(pdf.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="premium-button text-xs"
                    disabled={pdf.processing_status !== "completed"}
                    onClick={() => handleChat(pdf)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePdf(pdf.pdf_id)}
                    className="text-muted-foreground hover:text-destructive interactive-hover"
                  >
                    <Trash2 className="h-3 w-3" />
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
