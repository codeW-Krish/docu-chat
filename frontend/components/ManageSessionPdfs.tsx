"use client";

import { useState, useEffect } from "react";
import { api, PdfFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Trash2, Search, Loader2, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ManageSessionPdfsProps {
    sessionId: string;
    currentPdfs: PdfFile[];
    onUpdate: () => void;
}

export function ManageSessionPdfs({ sessionId, currentPdfs, onUpdate }: ManageSessionPdfsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [availablePdfs, setAvailablePdfs] = useState<PdfFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadAvailablePdfs();
        }
    }, [isOpen]);

    const loadAvailablePdfs = async () => {
        setIsLoading(true);
        try {
            const response = await api.getPdfs();
            setAvailablePdfs(response.pdfs);
        } catch (error) {
            console.error("Failed to load PDFs:", error);
            toast({
                title: "Error",
                description: "Failed to load documents.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPdf = async (pdfId: string) => {
        try {
            await api.addPdfToSession(sessionId, [pdfId]);
            toast({
                title: "Document Added",
                description: "Document successfully added to the session.",
            });
            onUpdate();
        } catch (error) {
            console.error("Failed to add PDF:", error);
            toast({
                title: "Error",
                description: "Failed to add document to session.",
                variant: "destructive",
            });
        }
    };

    const handleRemovePdf = async (pdfId: string) => {
        try {
            await api.removePdfFromSession(sessionId, pdfId);
            toast({
                title: "Document Removed",
                description: "Document successfully removed from the session.",
            });
            onUpdate();
        } catch (error) {
            console.error("Failed to remove PDF:", error);
            toast({
                title: "Error",
                description: "Failed to remove document from session.",
                variant: "destructive",
            });
        }
    };

    const getFileIcon = (fileName: string) => {
        if (fileName.endsWith('.pdf')) return <FileText className="h-4 w-4 text-red-500" />;
        if (fileName.endsWith('.docx')) return <FileText className="h-4 w-4 text-blue-500" />;
        if (fileName.endsWith('.txt')) return <FileText className="h-4 w-4 text-gray-500" />;
        if (fileName.endsWith('.csv')) return <FileText className="h-4 w-4 text-green-500" />;
        return <File className="h-4 w-4 text-primary" />;
    };

    // Filter out PDFs that are already in the session
    const pdfsToAdd = availablePdfs.filter(
        (pdf) =>
            !currentPdfs.some((current) => current.pdf_id === pdf.pdf_id) &&
            pdf.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-7 text-xs font-medium border-dashed hover:border-solid hover:bg-primary/5 hover:text-primary transition-all">
                    <Plus className="h-3.5 w-3.5" />
                    Manage Docs
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[85vh] flex flex-col bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle className="text-xl font-semibold tracking-tight">Manage Session Documents</DialogTitle>
                    <DialogDescription className="text-muted-foreground/80">
                        Add or remove documents from this chat session.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col p-6 gap-6">
                    {/* Current Documents */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                                Current Documents
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono">{currentPdfs.length}</Badge>
                            </h3>
                        </div>

                        <div className="flex-1 min-h-0 border rounded-xl bg-muted/30 overflow-hidden">
                            <ScrollArea className="h-full w-full">
                                <div className="p-2 space-y-1">
                                    {currentPdfs.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground/50">
                                            <FileText className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm">No documents in this session.</p>
                                        </div>
                                    ) : (
                                        currentPdfs.map((pdf) => (
                                            <div
                                                key={pdf.pdf_id}
                                                className="group flex items-center justify-between p-2.5 rounded-lg bg-background border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-muted/50 rounded-md group-hover:bg-primary/10 transition-colors">
                                                        {getFileIcon(pdf.file_name)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-medium truncate text-foreground/90">{pdf.file_name}</span>
                                                        <span className="text-xs text-muted-foreground">{pdf.page_count || "?"} pages</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    onClick={() => handleRemovePdf(pdf.pdf_id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    {/* Add New Documents */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <h3 className="text-sm font-semibold text-foreground/80">Add Documents</h3>
                        </div>

                        <div className="relative mb-3 shrink-0">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search your library..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-colors"
                            />
                        </div>

                        <div className="flex-1 min-h-0 border rounded-xl bg-muted/30 overflow-hidden">
                            <ScrollArea className="h-full w-full">
                                <div className="p-2 space-y-1">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : pdfsToAdd.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground/50">
                                            <Search className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm">{searchTerm ? "No matching documents found." : "No other documents available."}</p>
                                        </div>
                                    ) : (
                                        pdfsToAdd.map((pdf) => (
                                            <div
                                                key={pdf.pdf_id}
                                                className="group flex items-center justify-between p-2.5 rounded-lg bg-background border border-transparent hover:border-primary/20 hover:shadow-sm transition-all duration-200"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-muted/50 rounded-md group-hover:bg-primary/10 transition-colors">
                                                        {getFileIcon(pdf.file_name)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-medium truncate text-foreground/90">{pdf.file_name}</span>
                                                        <span className="text-xs text-muted-foreground">{pdf.page_count || "?"} pages</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8 gap-1.5 font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                                                    onClick={() => handleAddPdf(pdf.pdf_id)}
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Add
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
