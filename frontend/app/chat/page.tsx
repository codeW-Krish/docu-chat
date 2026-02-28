"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, PdfFile, LlmProvider } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  MessageSquare,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
  File
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [selectedPdfs, setSelectedPdfs] = useState<string[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [provider, setProvider] = useState<LlmProvider>("groq");

  useEffect(() => {
    loadPdfs();

    if (typeof window !== "undefined") {
      const savedProvider = localStorage.getItem("chat-provider-default") as LlmProvider | null;
      if (savedProvider === "groq" || savedProvider === "cerebras") {
        setProvider(savedProvider);
      }
    }
  }, []);

  const loadPdfs = async () => {
    try {
      const response = await api.getPdfs();
      setPdfs(response.pdfs);
    } catch (error) {
      console.error("Failed to load PDFs:", error);
      toast({
        title: "Error",
        description: "Failed to load your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfToggle = (pdfId: string) => {
    setSelectedPdfs(prev =>
      prev.includes(pdfId)
        ? prev.filter(id => id !== pdfId)
        : [...prev, pdfId]
    );
  };

  const handleCreateSession = async () => {
    if (selectedPdfs.length === 0) {
      toast({
        title: "No Documents Selected",
        description: "Please select at least one document to start a chat session.",
        variant: "destructive",
      });
      return;
    }

    if (!sessionName.trim()) {
      toast({
        title: "Session Name Required",
        description: "Please enter a name for your chat session.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.createSession(sessionName.trim(), selectedPdfs, provider);
      if (typeof window !== "undefined") {
        localStorage.setItem("chat-provider-default", provider);
        localStorage.setItem(`chat-provider-session-${response.session.session_id}`, provider);
      }
      toast({
        title: "Session Created",
        description: "Your chat session has been created successfully!",
      });
      router.push(`/chat/${response.session.session_id}?provider=${provider}`);
    } catch (error) {
      console.error("Failed to create session:", error);
      toast({
        title: "Error",
        description: "Failed to create chat session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />;
    if (fileName.endsWith('.docx')) return <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    if (fileName.endsWith('.txt')) return <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />;
    if (fileName.endsWith('.csv')) return <FileText className="h-4 w-4 text-green-500 flex-shrink-0" />;
    return <File className="h-4 w-4 text-accent flex-shrink-0" />;
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b bg-card/50 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto w-full">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-accent" />
            Start New Chat Session
          </h1>
          <p className="text-muted-foreground font-serif">
            Select multiple documents to create a comprehensive chat session
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full h-full p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

            {/* Document Selection Column */}
            <div className="lg:col-span-2 h-full flex flex-col min-h-0">
              <Card className="flex-1 flex flex-col min-h-0 shadow-md">
                <CardHeader className="pb-4 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-accent" />
                      Select Documents <span className="text-muted-foreground text-sm font-normal">({selectedPdfs.length} selected)</span>
                    </CardTitle>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {filteredPdfs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="bg-muted/30 p-4 rounded-full mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-lg font-medium text-foreground mb-1">
                        {searchTerm ? "No matches found" : "No documents available"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? "Try adjusting your search terms" : "Upload some documents to get started"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredPdfs.map((pdf) => (
                        <div
                          key={pdf.pdf_id}
                          onClick={() => handlePdfToggle(pdf.pdf_id)}
                          className={`
                            group relative flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
                            ${selectedPdfs.includes(pdf.pdf_id)
                              ? "border-accent bg-accent/5 shadow-sm"
                              : "border-border hover:border-accent/50 hover:bg-muted/30"
                            }
                          `}
                        >
                          <Checkbox
                            id={pdf.pdf_id}
                            checked={selectedPdfs.includes(pdf.pdf_id)}
                            onCheckedChange={() => handlePdfToggle(pdf.pdf_id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getFileIcon(pdf.file_name)}
                              <Label
                                htmlFor={pdf.pdf_id}
                                className="font-medium cursor-pointer truncate block flex-1"
                              >
                                {pdf.file_name}
                              </Label>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{pdf.page_count || "?"} pages</span>
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${pdf.processing_status === "completed"
                                  ? "bg-green-500/10 text-green-600 border-green-200"
                                  : pdf.processing_status === "failed"
                                    ? "bg-red-500/10 text-red-600 border-red-200"
                                    : "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                                }`}>
                                {pdf.processing_status === "completed" ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : pdf.processing_status === "failed" ? (
                                  <AlertCircle className="h-3 w-3" />
                                ) : (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                                <span className="capitalize">{pdf.processing_status}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Session Details Column */}
            <div className="lg:col-span-1 h-full flex flex-col gap-6 min-h-0">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Session Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionName">Session Name</Label>
                    <Input
                      id="sessionName"
                      placeholder="e.g., Research Project Alpha"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>AI Provider</Label>
                    <Select
                      value={provider}
                      onValueChange={(value) => setProvider(value as LlmProvider)}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="groq">Groq</SelectItem>
                        <SelectItem value="cerebras">Cerebras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Selected Documents</Label>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {selectedPdfs.length}
                      </span>
                    </div>
                    <div className="border rounded-md p-2 bg-muted/20 h-[150px] overflow-y-auto custom-scrollbar">
                      {selectedPdfs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                          No documents selected
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedPdfs.map((pdfId) => {
                            const pdf = pdfs.find(p => p.pdf_id === pdfId);
                            return pdf ? (
                              <div key={pdfId} className="flex items-center gap-2 text-sm bg-background p-2 rounded border shadow-sm">
                                {getFileIcon(pdf.file_name)}
                                <span className="truncate flex-1">{pdf.file_name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePdfToggle(pdfId);
                                  }}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateSession}
                    disabled={isCreating || selectedPdfs.length === 0 || !sessionName.trim()}
                    className="w-full premium-button h-11 text-base shadow-lg hover:shadow-xl transition-all"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Session...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Chat Session
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-dashed">
                <CardContent className="p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => router.push("/dashboard")}
                  >
                    ← Back to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
