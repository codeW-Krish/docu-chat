"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, PdfFile, ChatMessage, LlmProvider } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  MessageSquare,
  FileText,
  Loader2,
  Send,
  User,
  Bot,
  Eye,
  EyeOff,
  ArrowLeft,
  BookOpen,
  Highlighter,
  Plus,
  ZoomIn,
  ZoomOut,
  Menu,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PanelLeftClose,
  PanelLeftOpen,
  CheckSquare,
  Square,
  Download,
  Layout
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import ShinyText from "@/components/ShinyText";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const PdfViewer = dynamic(() => import("@/components/pdf-viewer").then((mod) => mod.PdfViewer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});
import { ManageSessionPdfs } from "@/components/ManageSessionPdfs";
import { ExportModal } from "@/components/chat/ExportModal";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface PdfReference {
  pdf_id: string;
  pdf_name: string;
  page_number: number;
  chunk_index: number;
  chunk_text: string;
  similarity: number;
}

interface ChatSession {
  session_id: string;
  session_name: string;
  created_at: string;
  pdfs?: PdfFile[];
}

export default function ChatSessionPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(true);
  const [showMobilePdf, setShowMobilePdf] = useState(false);
  const [mobileLayout, setMobileLayout] = useState<'sheet' | 'split'>('sheet');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [highlightedReference, setHighlightedReference] = useState<PdfReference | null>(null);
  const [isLongProcessing, setIsLongProcessing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPdfIds, setSelectedPdfIds] = useState<Set<string>>(new Set());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [provider, setProvider] = useState<LlmProvider>("groq");

  // Voice Mode State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const queryProvider = searchParams.get("provider") as LlmProvider | null;
    const sessionProvider = typeof window !== "undefined"
      ? (localStorage.getItem(`chat-provider-session-${sessionId}`) as LlmProvider | null)
      : null;
    const defaultProvider = typeof window !== "undefined"
      ? (localStorage.getItem("chat-provider-default") as LlmProvider | null)
      : null;

    const resolvedProvider =
      queryProvider === "groq" || queryProvider === "cerebras"
        ? queryProvider
        : sessionProvider === "groq" || sessionProvider === "cerebras"
          ? sessionProvider
          : defaultProvider === "groq" || defaultProvider === "cerebras"
            ? defaultProvider
            : "groq";

    setProvider(resolvedProvider);
    if (typeof window !== "undefined") {
      localStorage.setItem(`chat-provider-session-${sessionId}`, resolvedProvider);
      localStorage.setItem("chat-provider-default", resolvedProvider);
    }

    loadSessionData(resolvedProvider);
  }, [sessionId, searchParams]);

  // Removed unconditional auto-scroll to fix UX scroll jump bug

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setNewMessage(prev => prev + (prev ? ' ' : '') + transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast({
            title: "Voice Error",
            description: "Could not recognize speech. Please try again.",
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const loadSessionData = async (activeProvider: LlmProvider = provider) => {
    try {
      const [sessionResponse, messagesResponse] = await Promise.all([
        api.getSession(sessionId),
        api.getSessionMessages(sessionId)
      ]);

      setSession(sessionResponse.session);
      setPdfs(sessionResponse.pdfs || []);
      const loadedMessages = messagesResponse.messages || [];
      setMessages(loadedMessages);

      // Set first PDF as selected if available
      if (sessionResponse.pdfs && sessionResponse.pdfs.length > 0) {
        setSelectedPdf(sessionResponse.pdfs[0].pdf_id);
      }

      // Auto-Summarization: If no messages and PDFs exist, generate summary
      if (loadedMessages.length === 0 && sessionResponse.pdfs && sessionResponse.pdfs.length > 0) {
        generateAutoSummary(sessionId, activeProvider);
      }

      // Initialize selected PDFs with all PDFs
      if (sessionResponse.pdfs) {
        setSelectedPdfIds(new Set(sessionResponse.pdfs.map(p => p.pdf_id)));
      }

    } catch (err) {
      console.error("Failed to load session:", err);
      setError("Unable to load chat session.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAutoSummary = async (sid: string, activeProvider: LlmProvider = provider) => {
    try {
      setIsSending(true); // Show loading state
      const response = await api.generateSummary(sid, activeProvider);

      if (response.data && response.data.summary) {
        // Add summary message
        setMessages(prev => [
          ...prev,
          {
            message_id: `ai-summary-${Date.now()}`,
            session_id: sid,
            sender: 'ai',
            message_text: `**Document Summary:**\n\n${response.data!.summary}`,
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to generate summary:", err);
      // Silent fail for auto-summary
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error("Failed to start speech recognition:", e);
        }
      } else {
        toast({
          title: "Not Supported",
          description: "Speech recognition is not supported in this browser.",
          variant: "destructive",
        });
      }
    }
  };

  const speakMessage = (text: string, messageId: string) => {
    if (isSpeaking && speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(messageId);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const messageToSend = textOverride || newMessage;
    if (!messageToSend.trim() || isSending) return;

    if (!textOverride) setNewMessage("");
    setIsSending(true);

    const tempUserMessage: ChatMessage = {
      message_id: `temp-user-${Date.now()}`,
      session_id: sessionId,
      sender: 'user',
      message_text: messageToSend,
      created_at: new Date().toISOString(),
    };

    const tempAiMessage: ChatMessage = {
      message_id: `temp-ai-${Date.now()}`,
      session_id: sessionId,
      sender: 'ai',
      message_text: "",
      references: [],
      suggested_questions: [],
      created_at: new Date().toISOString(),
    };

    try {
      // Add user message and empty AI message to UI immediately
      setMessages(prev => [...prev, tempUserMessage, tempAiMessage]);

      // Auto-scroll ONCE when user sends the message
      setTimeout(() => scrollToBottom(), 100);

      const updateAiMessage = (updates: Partial<ChatMessage>) => {
        setMessages(prev => prev.map(msg =>
          msg.message_id === tempAiMessage.message_id
            ? { ...msg, ...updates }
            : msg
        ));
      };

      await api.sendMessageStream(
        sessionId,
        messageToSend,
        Array.from(selectedPdfIds),
        provider,
        (chunk) => {
          if (chunk.type === 'metadata') {
            updateAiMessage({
              references: chunk.references || [],
              suggested_questions: chunk.suggested_questions || []
            });

            // Auto-highlight first reference if available
            if (chunk.references && chunk.references.length > 0) {
              const firstRef = chunk.references[0];
              setHighlightedReference(firstRef);
              setSelectedPdf(firstRef.pdf_id);
              setShowPdfPreview(true);
            }
          } else if (chunk.type === 'chunk') {
            setMessages(prev => prev.map(msg => {
              if (msg.message_id === tempAiMessage.message_id) {
                return { ...msg, message_text: msg.message_text + (chunk.content || '') };
              }
              return msg;
            }));
          } else if (chunk.type === 'followups') {
            updateAiMessage({ suggested_questions: chunk.suggested_questions || [] });
          } else if (chunk.type === 'error') {
            console.error("Stream error from server:", chunk.content);
            toast({
              title: "Stream Error",
              description: chunk.content,
              variant: "destructive",
            });
          }
        }
      );

    } catch (error: any) {
      console.error("Failed to send message:", error);

      // Clean up temp messages on total failure
      setMessages(prev => prev.filter(msg =>
        msg.message_id !== tempUserMessage.message_id &&
        msg.message_id !== tempAiMessage.message_id
      ));

      let errorMessage = "Failed to send message. Please try again. " + (error.message || "");

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReferenceClick = (reference: PdfReference) => {
    setHighlightedReference(reference);
    setSelectedPdf(reference.pdf_id);
    setShowPdfPreview(true);
    setShowMobilePdf(true); // Open mobile drawer
  };

  const handleProviderChange = (value: string) => {
    const selectedProvider = value as LlmProvider;
    setProvider(selectedProvider);
    if (typeof window !== "undefined") {
      localStorage.setItem("chat-provider-default", selectedProvider);
      localStorage.setItem(`chat-provider-session-${sessionId}`, selectedProvider);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.sender === 'user';
    const references = message.references as PdfReference[] || [];
    const suggestions = message.suggested_questions || [];

    return (
      <div key={message.message_id} className={`flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 group/message`}>
        <div className={`flex gap-2 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex gap-2 md:gap-3 max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-none border
              ${isUser
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent'
                : 'bg-white dark:bg-[#111] text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10'
              }
            `}>
              {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-lime-600 dark:text-lime-accent" />}
            </div>

            {/* Message Content */}
            <div className={`space-y-2 ${isUser ? 'text-right' : 'text-left'} min-w-0 max-w-full overflow-hidden`}>
              <div className={`
                p-3 md:p-5 relative transition-all duration-200 break-words max-w-full
                ${isUser
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-[1.5rem] rounded-tr-sm shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] dark:shadow-none'
                  : 'bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-[1.5rem] rounded-tl-sm shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] dark:hover:border-white/20'
                }
              `}>
                <div className={`prose prose-sm dark:prose-invert max-w-none break-words overflow-x-auto leading-relaxed font-medium ${isUser ? 'prose-p:text-white/90 dark:prose-p:text-zinc-900/90 text-white dark:text-zinc-900' : 'prose-p:text-zinc-700 dark:prose-p:text-gray-300 text-zinc-900 dark:text-white'} prose-pre:bg-zinc-900 dark:prose-pre:bg-[#111] prose-pre:border prose-pre:border-zinc-800 dark:prose-pre:border-white/10`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <div className="relative rounded-xl overflow-hidden my-4 border border-zinc-200 dark:border-white/10 bg-zinc-900 dark:bg-[#111] shadow-sm">
                            <div className="bg-zinc-800/50 dark:bg-white/5 px-4 py-2 text-xs text-zinc-400 dark:text-gray-500 border-b border-zinc-800 dark:border-white/5 flex items-center justify-between font-mono font-medium">
                              <span>{match[1]}</span>
                            </div>
                            <div className="p-4 overflow-x-auto custom-scrollbar">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </div>
                          </div>
                        ) : (
                          <code className={`${className} bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 break-words whitespace-pre-wrap ${isUser ? 'bg-white/20 dark:bg-black/10 text-white dark:text-black' : ''}`} {...props}>
                            {children}
                          </code>
                        )
                      },
                      p({ children }) {
                        return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                      },
                      ul({ children }) {
                        return <ul className="list-disc pl-5 mb-4 space-y-1.5 marker:text-zinc-400 dark:marker:text-zinc-600">{children}</ul>
                      },
                      ol({ children }) {
                        return <ol className="list-decimal pl-5 mb-4 space-y-1.5 marker:text-zinc-400 dark:marker:text-zinc-600 marker:font-semibold">{children}</ol>
                      },
                      li({ children }) {
                        return <li className="pl-1 leading-relaxed">{children}</li>
                      },
                      h1({ children }) {
                        return <h1 className="text-xl md:text-2xl font-bold mb-4 mt-6 first:mt-0 tracking-tight text-zinc-900 dark:text-white">{children}</h1>
                      },
                      h2({ children }) {
                        return <h2 className="text-lg md:text-xl font-bold mb-3 mt-5 first:mt-0 tracking-tight text-zinc-900 dark:text-white">{children}</h2>
                      },
                      h3({ children }) {
                        return <h3 className="text-base md:text-lg font-bold mb-2 mt-4 first:mt-0 text-zinc-900 dark:text-white">{children}</h3>
                      },
                      blockquote({ children }) {
                        return <blockquote className="border-l-4 border-lime-300 dark:border-lime-700 bg-lime-50/50 dark:bg-lime-900/10 rounded-r-xl px-4 py-3 my-4 italic text-zinc-600 dark:text-gray-400">{children}</blockquote>
                      },
                      a({ href, children }) {
                        return <a href={href} target="_blank" rel="noopener noreferrer" className="text-lime-600 dark:text-lime-accent hover:text-lime-700 dark:hover:text-lime-400 hover:underline underline-offset-4 font-semibold transition-colors">{children}</a>
                      },
                      table({ children }) {
                        return <div className="overflow-x-auto my-5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-sm"><table className="w-full text-sm text-left">{children}</table></div>
                      },
                      thead({ children }) {
                        return <thead className="bg-zinc-50 dark:bg-white/5 text-xs uppercase text-zinc-500 dark:text-gray-400 font-bold border-b border-zinc-200 dark:border-white/10">{children}</thead>
                      },
                      tbody({ children }) {
                        return <tbody className="divide-y divide-zinc-100 dark:divide-white/5">{children}</tbody>
                      },
                      tr({ children }) {
                        return <tr className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">{children}</tr>
                      },
                      th({ children }) {
                        return <th className="px-4 py-3 align-top">{children}</th>
                      },
                      td({ children }) {
                        return <td className="px-4 py-3 align-top">{children}</td>
                      }
                    }}
                  >
                    {message.message_text}
                  </ReactMarkdown>
                </div>

                {/* Text to Speech Button */}
                {!isUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-8 md:-right-10 top-0 h-7 w-7 md:h-8 md:w-8 text-zinc-400 dark:text-gray-500 hover:text-lime-600 dark:hover:text-lime-accent opacity-100 md:opacity-0 group-hover/message:opacity-100 transition-all duration-200"
                    onClick={() => speakMessage(message.message_text, message.message_id)}
                  >
                    {isSpeaking && speakingMessageId === message.message_id ? (
                      <VolumeX className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    )}
                  </Button>
                )}
              </div>

              {/* References */}
              {!isUser && references.length > 0 && (
                <div className="space-y-2 pl-1 pt-1.5">
                  <div className="text-[10px] md:text-[11px] font-bold text-zinc-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <BookOpen className="h-3 w-3 md:h-3.5 md:w-3.5 text-lime-600 dark:text-lime-accent" />
                    Sources ({references.length})
                  </div>
                  <div className="grid gap-2">
                    {references.map((ref, index) => (
                      <div
                        key={index}
                        className="text-xs p-3 md:p-3.5 bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-white/5 rounded-xl cursor-pointer hover:border-lime-300 dark:hover:border-lime-500/50 hover:shadow-md dark:shadow-none hover:-translate-y-0.5 transition-all duration-300 group/ref"
                        onClick={() => handleReferenceClick(ref)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-zinc-900 dark:text-white group-hover/ref:text-lime-600 dark:group-hover/ref:text-lime-accent transition-colors line-clamp-1 pr-2">
                            {ref.pdf_name}
                          </span>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold bg-lime-50 dark:bg-lime-accent/10 text-lime-700 dark:text-lime-accent border border-lime-200 dark:border-lime-accent/20 group-hover/ref:bg-lime-100 dark:group-hover/ref:bg-lime-accent/20 transition-colors whitespace-nowrap">
                            {Math.round(ref.similarity * 100)}% match
                          </Badge>
                        </div>
                        <div className="text-zinc-600 dark:text-gray-300 line-clamp-2 leading-relaxed font-serif italic text-[11px] md:text-xs">
                          "{ref.chunk_text.substring(0, 150)}..."
                        </div>
                        <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-white/5 text-[10px] font-semibold text-zinc-400 dark:text-gray-500 flex items-center gap-1.5 uppercase tracking-widest">
                          <FileText className="h-3 w-3" />
                          Page {ref.page_number}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suggested Questions */}
        {!isUser && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 md:gap-2 ml-8 md:ml-12 mt-1.5 mb-2">
            {suggestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(question)}
                className="text-[11px] md:text-xs font-semibold bg-white dark:bg-[#1A1A1A] hover:bg-lime-50 dark:hover:bg-lime-accent/10 hover:text-lime-700 dark:hover:text-lime-accent text-zinc-600 dark:text-gray-300 border border-zinc-200 dark:border-white/10 hover:border-lime-300 dark:hover:border-lime-accent/30 px-3 py-1.5 md:px-3.5 md:py-2 rounded-full transition-all duration-300 text-left shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-md hover:-translate-y-0.5"
              >
                {question}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Sidebar Content Component
  const SidebarContent = () => {
    const allSelected = pdfs.length > 0 && selectedPdfIds.size === pdfs.length;

    const toggleSelectAll = () => {
      if (allSelected) {
        setSelectedPdfIds(new Set());
      } else {
        setSelectedPdfIds(new Set(pdfs.map(p => p.pdf_id)));
      }
    };

    const togglePdfSelection = (pdfId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newSelected = new Set(selectedPdfIds);
      if (newSelected.has(pdfId)) {
        newSelected.delete(pdfId);
      } else {
        newSelected.add(pdfId);
      }
      setSelectedPdfIds(newSelected);
    };

    return (
      <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-black/20">
        <div className="p-4 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-[#0A0A0A]/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-gray-400">Documents</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSelectAll}
                className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white"
                title={allSelected ? "Deselect All" : "Select All"}
              >
                {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </Button>
              <ManageSessionPdfs
                sessionId={sessionId}
                currentPdfs={pdfs}
                onUpdate={loadSessionData}
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {pdfs.map((pdf) => {
              const isSelected = selectedPdfIds.has(pdf.pdf_id);
              const isActive = selectedPdf === pdf.pdf_id;

              return (
                <div
                  key={pdf.pdf_id}
                  onClick={() => {
                    setSelectedPdf(pdf.pdf_id);
                    setShowPdfPreview(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    group relative p-3 rounded-xl cursor-pointer transition-all duration-200 border
                    ${isActive
                      ? 'bg-zinc-100 dark:bg-white/10 border-zinc-200 dark:border-white/20 shadow-sm'
                      : 'bg-white dark:bg-[#1A1A1A] border-transparent hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-zinc-200 dark:hover:border-white/10'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex items-center justify-center pt-1"
                      onClick={(e) => togglePdfSelection(pdf.pdf_id, e)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => { }} // Handled by parent div click
                        className={`
                          transition-all duration-200
                          ${isSelected ? 'data-[state=checked]:bg-lime-500 data-[state=checked]:text-white data-[state=checked]:border-lime-500 dark:data-[state=checked]:bg-lime-accent dark:data-[state=checked]:text-black dark:data-[state=checked]:border-lime-accent' : 'border-zinc-300 dark:border-zinc-600'}
                        `}
                      />
                    </div>
                    <div className={`
                      p-2 rounded-lg transition-colors
                      ${isActive ? 'bg-lime-100 text-lime-700 dark:bg-lime-accent/20 dark:text-lime-accent' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-[#222] group-hover:text-zinc-900 dark:group-hover:text-white'}
                    `}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-gray-400 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
                        {pdf.file_name}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-gray-500 mt-0.5 font-medium">
                        {pdf.page_count || "?"} pages
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-lime-500 dark:bg-lime-accent rounded-l-full shadow-sm" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 text-center">
        Session not found.
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#FAFAFA] dark:bg-[#050505] overflow-hidden flex flex-col text-zinc-900 dark:text-white" style={{ fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif' }}>
      {/* Header */}
      <div className="h-14 md:h-16 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-3 md:px-6 shadow-sm">
        <div className="flex items-center gap-1.5 md:gap-4 flex-1 min-w-0">
          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 pt-10 border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline font-medium">Back</span>
          </Button>

          <div className="h-6 w-px bg-zinc-200 dark:bg-white/10 hidden md:block" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors shrink-0 hidden md:flex"
            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>

          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-sm md:text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white truncate">
              <div className="p-1 md:p-1.5 rounded-md bg-lime-accent/10 hidden md:flex shrink-0">
                <MessageSquare className="h-4 w-4 text-lime-600 dark:text-lime-accent" />
              </div>
              <span className="truncate">{session.session_name}</span>
            </h1>
            <p className="text-[10px] md:text-xs text-zinc-500 font-medium truncate">
              {pdfs.length} Doc{pdfs.length !== 1 ? 's' : ''} • {messages.length} Msg{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Select value={provider} onValueChange={handleProviderChange}>
            <SelectTrigger className="h-9 w-[104px] md:w-[130px] bg-zinc-50 dark:bg-[#111] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-medium rounded-lg focus:ring-1 focus:ring-lime-accent">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111]">
              <SelectItem value="groq" className="focus:bg-zinc-100 dark:focus:bg-white/10 cursor-pointer">Groq</SelectItem>
              <SelectItem value="cerebras" className="focus:bg-zinc-100 dark:focus:bg-white/10 cursor-pointer">Cerebras</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExportModalOpen(true)}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors md:hidden h-9 w-9 bg-zinc-50 dark:bg-white/5 rounded-lg"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="text-zinc-700 dark:text-gray-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors hidden md:flex font-medium rounded-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowPdfPreview(!showPdfPreview);
              setShowMobilePdf(true); // Always open mobile when clicked individually
            }}
            className={`
              transition-all duration-200 hidden md:flex font-medium rounded-lg
              ${showPdfPreview ? "bg-lime-50 text-lime-700 dark:bg-lime-accent/10 dark:text-lime-accent hover:bg-lime-100 dark:hover:bg-lime-accent/20" : "text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white"}
            `}
          >
            {showPdfPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPdfPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>

          {/* Mobile PDF Toggle */}
          <div className="md:hidden flex items-center gap-1 bg-zinc-100 dark:bg-[#111] rounded-lg p-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (mobileLayout === 'split') {
                  setMobileLayout('sheet');
                  setShowMobilePdf(true);
                } else {
                  setShowMobilePdf(!showMobilePdf);
                }
              }}
              className={`h-8 w-8 rounded-md transition-colors ${mobileLayout === 'sheet' && showMobilePdf ? 'bg-white dark:bg-zinc-800 shadow-sm text-lime-600 dark:text-lime-accent' : 'text-zinc-500'}`}
              title="Bottom Sheet View"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (mobileLayout === 'sheet') {
                  setMobileLayout('split');
                  setShowMobilePdf(false);
                  setShowPdfPreview(true);
                } else {
                  setMobileLayout('sheet');
                }
              }}
              className={`h-8 w-8 rounded-md transition-colors ${mobileLayout === 'split' ? 'bg-white dark:bg-zinc-800 shadow-sm text-lime-600 dark:text-lime-accent' : 'text-zinc-500'}`}
              title="Split Screen View"
            >
              <Layout className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        <PanelGroup direction={isMobile && mobileLayout === 'split' ? "vertical" : "horizontal"} className="h-full w-full">
          {/* Desktop Sidebar */}
          {isSidebarOpen && (
            <>
              <Panel
                id="sidebar"
                order={1}
                defaultSize={20}
                minSize={15}
                maxSize={40}
                className="hidden md:flex border-r border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#0A0A0A]/50 flex-col z-10 flex-1 min-w-0"
              >
                <SidebarContent />
              </Panel>

              <PanelResizeHandle className="hidden md:flex w-1 bg-zinc-200/50 dark:bg-white/5 hover:bg-lime-500/50 dark:hover:bg-lime-accent/50 transition-colors items-center justify-center group z-20 cursor-col-resize">
                <div className="h-8 w-1 rounded-full bg-zinc-300/50 dark:bg-white/10 group-hover:bg-lime-600 dark:group-hover:bg-lime-accent transition-colors" />
              </PanelResizeHandle>
            </>
          )}

          {/* Center Panel – Chat Window */}
          <Panel
            id="chat"
            order={2}
            minSize={20}
            defaultSize={35}
            className="flex flex-col relative min-w-0 bg-[#FAFAFA] dark:bg-[#050505] flex-1 overflow-hidden z-0"
          >

            {/* Messages Area */}
            <ScrollArea className="flex-1 min-h-0 w-full">
              <div className="px-3 md:px-8 py-4 md:py-6 mx-auto space-y-4 md:space-y-6 pb-2 md:pb-6 w-full max-w-4xl">
                {messages.map(renderMessage)}
                {isSending && (
                  <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-4 justify-start">
                      <div className="flex gap-3 max-w-[85%] flex-row">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border bg-background text-foreground border-border">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-2 text-left min-w-0">
                          <div className="p-5 shadow-sm relative transition-all duration-200 bg-card border text-card-foreground rounded-2xl rounded-tl-sm shadow-sm hover:shadow-md">
                            <ShinyText text="Thinking..." disabled={false} speed={3} className="font-medium" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Sticky Input Area - Normal flex flow */}
            <div className="w-full shrink-0 p-2 md:p-6 bg-[#FAFAFA] dark:bg-[#050505] z-10 border-t border-zinc-200 dark:border-white/5 relative">
              <div className="mx-auto relative w-full max-w-4xl pointer-events-auto">
                <div className="relative flex items-end gap-1.5 md:gap-2 bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-2xl md:rounded-[1.5rem] p-1.5 md:p-2 focus-within:ring-2 focus-within:ring-lime-accent/30 transition-all duration-300">
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl shrink-0 hidden md:flex">
                    <Plus className="h-5 w-5" />
                  </Button>

                  <Input
                    placeholder={isListening ? "Listening..." : "Ask anything..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isSending}
                    className={`
                      border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-2 py-2 md:py-3 h-auto max-h-32 min-h-[40px] md:min-h-[44px] resize-none
                      placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-white font-medium text-sm md:text-base selection:bg-lime-accent/30
                    `}
                  />

                  <div className="flex items-center gap-0.5 md:gap-1 pb-0.5 md:pb-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleListening}
                      className={`h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl transition-colors ${isListening ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20' : 'text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                    >
                      {isListening ? <MicOff className="h-4 w-4 md:h-5 md:w-5" /> : <Mic className="h-4 w-4 md:h-5 md:w-5" />}
                    </Button>

                    <Button
                      size="icon"
                      onClick={() => handleSendMessage()}
                      disabled={!newMessage.trim() || isSending}
                      className={`
                        h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl transition-all duration-300
                        ${!newMessage.trim() || isSending
                          ? 'bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-600 shadow-none'
                          : 'bg-lime-accent text-black hover:bg-lime-400 shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] hover:shadow-[0_6px_20px_rgba(163,230,53,0.23)] hover:scale-105 active:scale-95'
                        }
                      `}
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500 dark:text-zinc-400" /> : <Send className="h-4 w-4 text-inherit" />}
                    </Button>
                  </div>
                </div>
                <div className="text-center mt-2.5 hidden md:block">
                  <p className="text-[11px] font-medium text-zinc-400 dark:text-gray-500">
                    AI can make mistakes. Please verify important information.
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          {/* Right Panel – PDF Viewer */}
          {(showPdfPreview && (!isMobile || (isMobile && mobileLayout === 'split'))) && (
            <>
              {/* Horizontal resize handle for desktop */}
              <PanelResizeHandle className="hidden md:flex w-1 bg-zinc-200/50 dark:bg-white/5 hover:bg-lime-500/50 dark:hover:bg-lime-accent/50 transition-colors items-center justify-center group z-20 cursor-col-resize">
                <div className="h-8 w-1 rounded-full bg-zinc-300/50 dark:bg-white/10 group-hover:bg-lime-600 dark:group-hover:bg-lime-accent transition-colors" />
              </PanelResizeHandle>

              {/* Vertical resize handle for mobile split layout */}
              <PanelResizeHandle className="md:hidden h-1 w-full bg-zinc-200/50 dark:bg-white/5 hover:bg-lime-500/50 dark:hover:bg-lime-accent/50 transition-colors flex items-center justify-center group z-20 cursor-row-resize">
                <div className="w-8 h-1 rounded-full bg-zinc-300/50 dark:bg-white/10 group-hover:bg-lime-600 dark:group-hover:bg-lime-accent transition-colors" />
              </PanelResizeHandle>

              <Panel
                id="pdf-preview"
                order={3}
                defaultSize={isMobile ? 50 : 45}
                minSize={20}
                className="flex flex-col border-l border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] z-10 flex-1 min-w-0 overflow-hidden"
              >

                <PdfViewer
                  pdf={pdfs.find(p => p.pdf_id === selectedPdf) || null}
                  highlightedReference={highlightedReference}
                  onPageChange={(page) => {
                    // Optional: Sync page state if needed
                  }}
                />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Mobile PDF Drawer */}
      <Drawer open={showMobilePdf} onOpenChange={setShowMobilePdf}>
        <DrawerContent className="h-[85vh] bg-white dark:bg-[#0A0A0A] border-zinc-200 dark:border-white/10 flex flex-col">
          <DrawerHeader className="border-b border-zinc-200 dark:border-white/10 px-4 py-3 shrink-0">
            <DrawerTitle className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-lime-600 dark:text-lime-accent" />
              Document Preview
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden relative">
            <PdfViewer
              pdf={pdfs.find(p => p.pdf_id === selectedPdf) || null}
              highlightedReference={highlightedReference}
              onPageChange={(page) => { }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        messages={messages}
        sessionName={session.session_name}
      />
    </div>
  );
}
