"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, PdfFile, LlmProvider } from "@/lib/api";
import { PROVIDER_MODELS, PROVIDER_LABELS, getDefaultModel, isValidModel } from "@/lib/provider-models";
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
  const [model, setModel] = useState<string>(getDefaultModel("groq"));

  useEffect(() => {
    loadPdfs();

    if (typeof window !== "undefined") {
      const savedProvider = localStorage.getItem("chat-provider-default") as LlmProvider | null;
      const validProviders: LlmProvider[] = ["groq", "cerebras", "bytez"];
      if (savedProvider && validProviders.includes(savedProvider)) {
        setProvider(savedProvider);
        const savedModel = localStorage.getItem("chat-model-default");
        if (savedModel && isValidModel(savedProvider, savedModel)) {
          setModel(savedModel);
        } else {
          setModel(getDefaultModel(savedProvider));
        }
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
      const response = await api.createSession(sessionName.trim(), selectedPdfs, provider, model);
      if (typeof window !== "undefined") {
        localStorage.setItem("chat-provider-default", provider);
        localStorage.setItem("chat-model-default", model);
        localStorage.setItem(`chat-provider-session-${response.session.session_id}`, provider);
        localStorage.setItem(`chat-model-session-${response.session.session_id}`, model);
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
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-lime-600 dark:text-lime-accent mx-auto mb-4" />
          <p className="text-zinc-500 font-medium">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#FAFAFA] dark:bg-[#050505] flex flex-col overflow-hidden text-zinc-900 dark:text-white" style={{ fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif' }}>
      {/* Header Section */}
      <div className="p-6 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md z-10 shadow-sm">
        <div className="max-w-6xl mx-auto w-full">
          <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-3 text-zinc-900 dark:text-white tracking-tight">
            <div className="p-2 rounded-lg bg-lime-accent/10">
              <MessageSquare className="h-6 w-6 text-lime-600 dark:text-lime-accent" />
            </div>
            Start New Chat Session
          </h1>
          <p className="text-zinc-500 dark:text-gray-400 font-medium">
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
              <div className="flex-1 flex flex-col min-h-0 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none bg-white dark:bg-[#0A0A0A] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
                <div className="p-6 pb-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                      <FileText className="h-5 w-5 text-zinc-400 dark:text-gray-500" />
                      Select Documents <span className="text-zinc-500 dark:text-gray-400 text-sm font-medium">({selectedPdfs.length} selected)</span>
                    </h2>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-10 bg-white dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl focus-visible:ring-1 focus-visible:ring-lime-accent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {filteredPdfs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-full mb-4">
                        <FileText className="h-8 w-8 text-zinc-400 dark:text-gray-500" />
                      </div>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                        {searchTerm ? "No matches found" : "No documents available"}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-gray-400">
                        {searchTerm ? "Try adjusting your search terms" : "Upload some documents from the dashboard to get started"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredPdfs.map((pdf) => (
                        <div
                          key={pdf.pdf_id}
                          onClick={() => handlePdfToggle(pdf.pdf_id)}
                          className={`
                            group relative flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all duration-200
                            ${selectedPdfs.includes(pdf.pdf_id)
                              ? "border-lime-500 bg-lime-50 dark:border-lime-accent dark:bg-lime-accent/5 shadow-sm"
                              : "border-zinc-200 dark:border-white/5 hover:border-lime-500/50 dark:hover:border-lime-accent/50 hover:bg-zinc-50 dark:hover:bg-[#111] bg-white dark:bg-[#0A0A0A]"
                            }
                          `}
                        >
                          <Checkbox
                            id={pdf.pdf_id}
                            checked={selectedPdfs.includes(pdf.pdf_id)}
                            onCheckedChange={() => handlePdfToggle(pdf.pdf_id)}
                            className="mt-1 border-zinc-300 dark:border-gray-600 data-[state=checked]:bg-lime-600 data-[state=checked]:border-lime-600 dark:data-[state=checked]:bg-lime-accent dark:data-[state=checked]:border-lime-accent"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              {getFileIcon(pdf.file_name)}
                              <Label
                                htmlFor={pdf.pdf_id}
                                className="font-bold text-sm text-zinc-900 dark:text-white cursor-pointer truncate block flex-1"
                              >
                                {pdf.file_name}
                              </Label>
                            </div>
                            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-gray-400 font-medium">
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
                </div>
              </div>
            </div>

            {/* Session Details Column */}
            <div className="lg:col-span-1 h-full flex flex-col gap-6 min-h-0">
              <div className="shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none bg-white dark:bg-[#0A0A0A] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col flex-shrink-0">
                <div className="p-6 pb-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Session Details</h2>
                </div>
                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    <Label htmlFor="sessionName" className="text-sm font-semibold text-zinc-900 dark:text-gray-300">Session Name</Label>
                    <Input
                      id="sessionName"
                      placeholder="e.g., Research Project Alpha"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="bg-zinc-50 dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-lime-accent text-zinc-900 dark:text-white font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-zinc-900 dark:text-gray-300">AI Provider</Label>
                    <Select
                      value={provider}
                      onValueChange={(value) => {
                        const p = value as LlmProvider;
                        setProvider(p);
                        setModel(getDefaultModel(p));
                      }}
                    >
                      <SelectTrigger className="w-full bg-zinc-50 dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl h-11 focus:ring-1 focus:ring-lime-accent text-zinc-900 dark:text-white font-medium">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111]">
                        {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="focus:bg-zinc-100 dark:focus:bg-white/10 cursor-pointer">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-zinc-900 dark:text-gray-300">AI Model</Label>
                    <Select
                      value={model}
                      onValueChange={(value) => setModel(value)}
                    >
                      <SelectTrigger className="w-full bg-zinc-50 dark:bg-[#111] border-zinc-200 dark:border-white/10 rounded-xl h-11 focus:ring-1 focus:ring-lime-accent text-zinc-900 dark:text-white font-medium">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111]">
                        {(PROVIDER_MODELS[provider] || []).map((m) => (
                          <SelectItem key={m.id} value={m.id} className="focus:bg-zinc-100 dark:focus:bg-white/10 cursor-pointer">
                            <span className="flex items-center gap-2">
                              {m.name}
                              <span className="text-[10px] text-zinc-400">{m.context}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-zinc-900 dark:text-gray-300">Selected Documents</Label>
                      <span className="text-xs font-bold text-zinc-500 dark:text-gray-400 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-2 py-0.5 rounded-full">
                        {selectedPdfs.length}
                      </span>
                    </div>
                    <div className="border border-zinc-200 dark:border-white/10 rounded-xl p-3 bg-zinc-50/50 dark:bg-[#111] h-[150px] overflow-y-auto custom-scrollbar">
                      {selectedPdfs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-zinc-400 dark:text-gray-500 text-sm italic font-medium">
                          No documents selected
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedPdfs.map((pdfId) => {
                            const pdf = pdfs.find(p => p.pdf_id === pdfId);
                            return pdf ? (
                              <div key={pdfId} className="flex items-center gap-2 text-sm bg-white dark:bg-[#1A1A1A] p-2.5 rounded-lg border border-zinc-200 dark:border-white/5 shadow-sm group hover:border-lime-200 dark:hover:border-lime-500/30 transition-colors">
                                {getFileIcon(pdf.file_name)}
                                <span className="truncate flex-1 font-medium text-zinc-900 dark:text-white">{pdf.file_name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePdfToggle(pdfId);
                                  }}
                                  className="text-zinc-400 hover:text-red-500 bg-zinc-50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded p-1 transition-colors opacity-0 group-hover:opacity-100"
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

                  <div className="pt-2">
                    <Button
                      onClick={handleCreateSession}
                      disabled={isCreating || selectedPdfs.length === 0 || !sessionName.trim()}
                      className="w-full bg-lime-accent text-black h-12 rounded-xl font-bold text-base shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] hover:bg-gradient-to-br hover:from-lime-accent hover:to-lime-400 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Creating Session...
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-2" />
                          Create Chat Session
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-[#111] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm flex-shrink-0">
                <div className="p-4">
                  <Button
                    variant="ghost"
                    className="w-full text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 h-11 rounded-xl font-medium"
                    onClick={() => router.push("/dashboard")}
                  >
                    ← Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
