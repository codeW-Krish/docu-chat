"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2
} from "lucide-react";
import { PdfFile, PdfReference } from "@/lib/api";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  pdf: PdfFile | null;
  highlightedReference: PdfReference | null;
  onPageChange?: (page: number) => void;
}

export function PdfViewer({ pdf, highlightedReference, onPageChange }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
    }
  }, []);

  // Suppress harmless AbortException warnings
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    const filterErrors = (...args: any[]) => {
      const msg = args[0];
      if (typeof msg === 'string' && (
        msg.includes('AbortException') ||
        msg.includes('TextLayer task cancelled') ||
        msg.includes('TextLayer.task cancelled')
      )) {
        return;
      }
      originalError.apply(console, args);
    };

    const filterWarnings = (...args: any[]) => {
      const msg = args[0];
      if (typeof msg === 'string' && (
        msg.includes('AbortException') ||
        msg.includes('TextLayer task cancelled') ||
        msg.includes('TextLayer.task cancelled')
      )) {
        return;
      }
      originalWarn.apply(console, args);
    };

    console.error = filterErrors;
    console.warn = filterWarnings;

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const file = useMemo(() => {
    if (!token || !pdf) return null;
    return {
      url: `http://localhost:8080/api/pdfs/${pdf.pdf_id}/view`,
      httpHeaders: { Authorization: `Bearer ${token}` },
      withCredentials: true
    };
  }, [pdf?.pdf_id, token]);

  // Update container width on resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setContainerWidth(prev => {
          if (Math.abs(prev - width) > 1) return width;
          return prev;
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Reset state when PDF changes
  useEffect(() => {
    if (pdf) {
      setCurrentPage(1);
      setZoom(100);
      setRotation(0);
      setError(null);
    }
  }, [pdf?.pdf_id]);

  // Handle highlighted reference changes
  useEffect(() => {
    if (highlightedReference && pdf && highlightedReference.pdf_id === pdf.pdf_id) {
      setCurrentPage(highlightedReference.page_number);
    }
  }, [highlightedReference, pdf]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    if (err.name === 'AbortException') return;
    console.error('PDF load error:', err);
    setError('Failed to load PDF. Please try again.');
    setIsLoading(false);
  }

  const handlePageChange = (newPage: number) => {
    if (!numPages || newPage < 1 || newPage > numPages) return;
    setCurrentPage(newPage);
    onPageChange?.(newPage);
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(50, Math.min(200, newZoom));
    setZoom(clampedZoom);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const textRenderer = useCallback(
    (textItem: any) => {
      if (!highlightedReference || highlightedReference.page_number !== currentPage) {
        return textItem.str;
      }

      const chunkText = highlightedReference.chunk_text.toLowerCase();
      const itemText = textItem.str.toLowerCase();

      if (chunkText.includes(itemText) && itemText.length > 3) {
        return `<span class="bg-yellow-200/50 text-black mix-blend-multiply">${textItem.str}</span>`;
      }

      return textItem.str;
    },
    [highlightedReference, currentPage]
  );

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['ppt', 'pptx'].includes(ext || '')) return 'presentation';
    if (['doc', 'docx'].includes(ext || '')) return 'document';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'spreadsheet';
    return 'text';
  };

  const fileType = pdf ? getFileType(pdf.file_name) : 'pdf';

  if (!pdf) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/5">
        <div className="text-center text-muted-foreground/50">
          <div className="bg-muted/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8" />
          </div>
          <p className="font-medium">Select a document to view</p>
        </div>
      </div>
    );
  }

  if (fileType !== 'pdf') {
    return (
      <div className="h-full flex flex-col bg-muted/5">
        <div className="h-14 border-b bg-background/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium text-sm truncate" title={pdf.file_name}>
              {pdf.file_name}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs font-mono uppercase tracking-wider">
            {fileType}
          </Badge>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="bg-primary/5 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FileText className="h-12 w-12 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              This file type cannot be previewed directly. However, it has been processed and is ready for chat.
            </p>
            <div className="bg-card border rounded-xl p-4 text-sm text-left shadow-sm">
              <p className="font-medium mb-3 flex items-center gap-2 text-primary">
                <AlertCircle className="h-4 w-4" />
                Available Actions
              </p>
              <ul className="space-y-2 text-muted-foreground text-xs">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/50" />
                  Ask questions about the content
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/50" />
                  Request summaries and key points
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/50" />
                  Extract specific data
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/5 relative group">
      {/* Floating Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 bg-background/80 backdrop-blur-md border shadow-lg rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium min-w-[3rem] text-center font-mono">
            {currentPage} / {numPages || '-'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!numPages || currentPage >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 pl-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={() => handleZoomChange(zoom - 10)}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium min-w-[3rem] text-center font-mono">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={() => handleZoomChange(zoom + 10)}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={handleRotate}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Document Title Header (Visible when toolbar hidden or always visible but subtle) */}
      <div className="h-10 border-b bg-background/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-10 transition-opacity duration-300 group-hover:opacity-50">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground truncate" title={pdf.file_name}>
            {pdf.file_name}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full relative overflow-hidden" ref={containerRef}>
        <ScrollArea className="h-full w-full">
          <div className="flex justify-center p-8 min-h-full">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setError(null)}
                >
                  Retry
                </Button>
              </div>
            ) : !file ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="min-w-max">
                <Document
                  file={file as any}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center h-[400px]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  }
                  className="max-w-full"
                >
                  <Page
                    pageNumber={currentPage}
                    scale={1}
                    width={containerWidth ? (Math.min(containerWidth - 64, 800) * (zoom / 100)) : undefined}
                    rotate={rotation}
                    className="shadow-2xl rounded-sm overflow-hidden bg-white"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    customTextRenderer={textRenderer}
                  />
                </Document>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>

      {/* Highlighted Reference Info Overlay */}
      {highlightedReference && highlightedReference.pdf_id === pdf.pdf_id && highlightedReference.page_number === currentPage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4 animate-in slide-in-from-bottom-4 duration-500 ease-out">
          <div className="bg-background/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Highlighted Source</span>
              <Badge variant="secondary" className="ml-auto text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
                {(highlightedReference.similarity * 100).toFixed(0)}% Match
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3 font-serif italic leading-relaxed">
              "{highlightedReference.chunk_text}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
