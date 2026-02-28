// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { api, PdfFile, ChatMessage } from "@/lib/api";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Badge } from "@/components/ui/badge";
// import {
//   Sheet,
//   SheetContent,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import {
//   MessageSquare,
//   FileText,
//   Loader2,
//   Send,
//   User,
//   Bot,
//   Eye,
//   EyeOff,
//   ArrowLeft,
//   BookOpen,
//   Highlighter,
//   Plus,
//   ZoomIn,
//   ZoomOut,
//   Menu,
//   Mic,
//   MicOff,
//   Volume2,
//   VolumeX,
//   PanelLeftClose,
//   PanelLeftOpen,
//   CheckSquare,
//   Square,
//   Download
// } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import dynamic from "next/dynamic";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

// const PdfViewer = dynamic(() => import("@/components/pdf-viewer").then((mod) => mod.PdfViewer), {
//   ssr: false,
//   loading: () => (
//     <div className="flex items-center justify-center h-full">
//       <Loader2 className="h-8 w-8 animate-spin text-primary" />
//     </div>
//   ),
// });
// import { ManageSessionPdfs } from "@/components/ManageSessionPdfs";
// import { ExportModal } from "@/components/chat/ExportModal";
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
// import rehypeHighlight from 'rehype-highlight';
// import 'highlight.js/styles/github-dark.css';

// interface PdfReference {
//   pdf_id: string;
//   pdf_name: string;
//   page_number: number;
//   chunk_index: number;
//   chunk_text: string;
//   similarity: number;
// }

// interface ChatSession {
//   session_id: string;
//   session_name: string;
//   created_at: string;
//   pdfs?: PdfFile[];
// }

// export default function ChatSessionPage() {
//   const { sessionId } = useParams() as { sessionId: string };
//   const router = useRouter();
//   const { toast } = useToast();

//   const [session, setSession] = useState<ChatSession | null>(null);
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [pdfs, setPdfs] = useState<PdfFile[]>([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSending, setIsSending] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [showPdfPreview, setShowPdfPreview] = useState(true);
//   const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
//   const [highlightedReference, setHighlightedReference] = useState<PdfReference | null>(null);
//   const [isLongProcessing, setIsLongProcessing] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [selectedPdfIds, setSelectedPdfIds] = useState<Set<string>>(new Set());
//   const [isExportModalOpen, setIsExportModalOpen] = useState(false);

//   // Voice Mode State
//   const [isListening, setIsListening] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const chatContainerRef = useRef<HTMLDivElement>(null);
//   const recognitionRef = useRef<any>(null);

//   useEffect(() => {
//     if (!sessionId) return;
//     loadSessionData();
//   }, [sessionId]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Initialize Speech Recognition
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
//       if (SpeechRecognition) {
//         recognitionRef.current = new SpeechRecognition();
//         recognitionRef.current.continuous = false;
//         recognitionRef.current.interimResults = false;
//         recognitionRef.current.lang = 'en-US';

//         recognitionRef.current.onresult = (event: any) => {
//           const transcript = event.results[0][0].transcript;
//           setNewMessage(prev => prev + (prev ? ' ' : '') + transcript);
//           setIsListening(false);
//         };

//         recognitionRef.current.onerror = (event: any) => {
//           console.error('Speech recognition error', event.error);
//           setIsListening(false);
//           toast({
//             title: "Voice Error",
//             description: "Could not recognize speech. Please try again.",
//             variant: "destructive",
//           });
//         };

//         recognitionRef.current.onend = () => {
//           setIsListening(false);
//         };
//       }
//     }
//   }, []);

//   const loadSessionData = async () => {
//     try {
//       const [sessionResponse, messagesResponse] = await Promise.all([
//         api.getSession(sessionId),
//         api.getSessionMessages(sessionId)
//       ]);

//       setSession(sessionResponse.session);
//       setPdfs(sessionResponse.pdfs || []);
//       const loadedMessages = messagesResponse.messages || [];
//       setMessages(loadedMessages);

//       // Set first PDF as selected if available
//       if (sessionResponse.pdfs && sessionResponse.pdfs.length > 0) {
//         setSelectedPdf(sessionResponse.pdfs[0].pdf_id);
//       }

//       // Auto-Summarization: If no messages and PDFs exist, generate summary
//       if (loadedMessages.length === 0 && sessionResponse.pdfs && sessionResponse.pdfs.length > 0) {
//         generateAutoSummary(sessionId);
//       }

//       // Initialize selected PDFs with all PDFs
//       if (sessionResponse.pdfs) {
//         setSelectedPdfIds(new Set(sessionResponse.pdfs.map(p => p.pdf_id)));
//       }

//     } catch (err) {
//       console.error("Failed to load session:", err);
//       setError("Unable to load chat session.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const generateAutoSummary = async (sid: string) => {
//     try {
//       setIsSending(true); // Show loading state
//       const response = await api.generateSummary(sid);

//       if (response.data && response.data.summary) {
//         // Add summary message
//         setMessages(prev => [
//           ...prev,
//           {
//             message_id: `ai-summary-${Date.now()}`,
//             session_id: sid,
//             sender: 'ai',
//             message_text: `**Document Summary:**\n\n${response.data!.summary}`,
//             created_at: new Date().toISOString()
//           }
//         ]);
//       }
//     } catch (err) {
//       console.error("Failed to generate summary:", err);
//       // Silent fail for auto-summary
//     } finally {
//       setIsSending(false);
//     }
//   };

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const toggleListening = () => {
//     if (isListening) {
//       recognitionRef.current?.stop();
//     } else {
//       if (recognitionRef.current) {
//         try {
//           recognitionRef.current.start();
//           setIsListening(true);
//         } catch (e) {
//           console.error("Failed to start speech recognition:", e);
//         }
//       } else {
//         toast({
//           title: "Not Supported",
//           description: "Speech recognition is not supported in this browser.",
//           variant: "destructive",
//         });
//       }
//     }
//   };

//   const speakMessage = (text: string, messageId: string) => {
//     if (isSpeaking && speakingMessageId === messageId) {
//       window.speechSynthesis.cancel();
//       setIsSpeaking(false);
//       setSpeakingMessageId(null);
//       return;
//     }

//     window.speechSynthesis.cancel(); // Stop any current speech
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.onend = () => {
//       setIsSpeaking(false);
//       setSpeakingMessageId(null);
//     };
//     utterance.onerror = () => {
//       setIsSpeaking(false);
//       setSpeakingMessageId(null);
//     };

//     setSpeakingMessageId(messageId);
//     setIsSpeaking(true);
//     window.speechSynthesis.speak(utterance);
//   };

//   const handleSendMessage = async (textOverride?: string) => {
//     const messageToSend = textOverride || newMessage;
//     if (!messageToSend.trim() || isSending) return;

//     if (!textOverride) setNewMessage("");
//     setIsSending(true);

//     try {
//       // Add user message to UI immediately
//       const tempUserMessage: ChatMessage = {
//         message_id: `temp-${Date.now()}`,
//         session_id: sessionId,
//         sender: 'user',
//         message_text: messageToSend,
//         created_at: new Date().toISOString()
//       };
//       setMessages(prev => [...prev, tempUserMessage]);

//       // Add timeout handling
//       const timeoutPromise = new Promise((_, reject) => {
//         setTimeout(() => reject(new Error('Request timeout - AI is taking longer than expected')), 150000); // 2.5 minutes
//       });

//       // Show long processing indicator after 30 seconds
//       const longProcessingTimer = setTimeout(() => {
//         setIsLongProcessing(true);
//       }, 30000);

//       const response = await Promise.race([
//         api.sendMessage(sessionId, messageToSend, Array.from(selectedPdfIds)),
//         timeoutPromise
//       ]) as any;

//       // Clear the long processing timer
//       clearTimeout(longProcessingTimer);
//       setIsLongProcessing(false);

//       // Replace temp message with actual response
//       setMessages(prev => {
//         // Auto-highlight first reference if available
//         if (response.references && response.references.length > 0) {
//           const firstRef = response.references[0];
//           setHighlightedReference(firstRef);
//           setSelectedPdf(firstRef.pdf_id);
//           setShowPdfPreview(true);
//         }

//         const filtered = prev.filter(msg => msg.message_id !== tempUserMessage.message_id);
//         return [
//           ...filtered,
//           {
//             message_id: `user-${Date.now()}`,
//             session_id: sessionId,
//             sender: 'user',
//             message_text: response.user_message,
//             created_at: new Date().toISOString()
//           },
//           {
//             message_id: `ai-${Date.now()}`,
//             session_id: sessionId,
//             sender: 'ai',
//             message_text: response.ai_response,
//             references: response.references,
//             suggested_questions: response.suggested_questions,
//             created_at: new Date().toISOString()
//           }
//         ];
//       });

//     } catch (error: any) {
//       console.error("Failed to send message:", error);

//       // Remove temp message on error
//       setMessages(prev => prev.filter(msg => !msg.message_id.startsWith('temp-')));

//       // Clear long processing state
//       setIsLongProcessing(false);

//       let errorMessage = "Failed to send message. Please try again.";

//       if (error.message?.includes('timeout')) {
//         errorMessage = "AI is taking longer than expected. The request is still processing in the background. Please wait a moment and refresh the page to see the response.";
//       } else if (error.message?.includes('502')) {
//         errorMessage = "AI service is temporarily unavailable. Please try again in a few moments.";
//       } else if (error.message?.includes('500')) {
//         errorMessage = "Server error occurred. Please try again.";
//       }

//       toast({
//         title: "Error",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setIsSending(false);
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   const handleReferenceClick = (reference: PdfReference) => {
//     setHighlightedReference(reference);
//     setSelectedPdf(reference.pdf_id);
//     setShowPdfPreview(true);
//   };

//   const renderMessage = (message: ChatMessage) => {
//     const isUser = message.sender === 'user';
//     const references = message.references as PdfReference[] || [];
//     const suggestions = message.suggested_questions || [];

//     return (
//       <div key={message.message_id} className={`flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 group/message`}>
//         <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
//           <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
//             {/* Avatar */}
//             <div className={`
//               flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border
//               ${isUser
//                 ? 'bg-primary text-primary-foreground border-primary/20'
//                 : 'bg-background text-foreground border-border'
//               }
//             `}>
//               {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
//             </div>

//             {/* Message Content */}
//             <div className={`space-y-2 ${isUser ? 'text-right' : 'text-left'} min-w-0`}>
//               <div className={`
//                 p-5 shadow-sm relative transition-all duration-200
//                 ${isUser
//                   ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-md shadow-primary/10'
//                   : 'bg-card border text-card-foreground rounded-2xl rounded-tl-sm shadow-sm hover:shadow-md'
//                 }
//               `}>
//                 <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed">
//                   <ReactMarkdown
//                     remarkPlugins={[remarkGfm]}
//                     rehypePlugins={[rehypeHighlight]}
//                     components={{
//                       code({ node, inline, className, children, ...props }: any) {
//                         const match = /language-(\w+)/.exec(className || '')
//                         return !inline && match ? (
//                           <div className="relative rounded-lg overflow-hidden my-3 border bg-muted/50">
//                             <div className="bg-muted px-4 py-1.5 text-xs text-muted-foreground border-b flex items-center justify-between font-mono">
//                               <span>{match[1]}</span>
//                             </div>
//                             <div className="p-4 overflow-x-auto">
//                               <code className={className} {...props}>
//                                 {children}
//                               </code>
//                             </div>
//                           </div>
//                         ) : (
//                           <code className={`${className} bg-muted/40 px-1.5 py-0.5 rounded text-xs font-mono border border-border/50`} {...props}>
//                             {children}
//                           </code>
//                         )
//                       },
//                       p({ children }) {
//                         return <p className="mb-3 last:mb-0">{children}</p>
//                       },
//                       ul({ children }) {
//                         return <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>
//                       },
//                       ol({ children }) {
//                         return <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>
//                       },
//                       li({ children }) {
//                         return <li className="">{children}</li>
//                       },
//                       h1({ children }) {
//                         return <h1 className="text-lg font-bold mb-3 mt-5 first:mt-0">{children}</h1>
//                       },
//                       h2({ children }) {
//                         return <h2 className="text-base font-bold mb-3 mt-4 first:mt-0">{children}</h2>
//                       },
//                       h3({ children }) {
//                         return <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h3>
//                       },
//                       blockquote({ children }) {
//                         return <blockquote className="border-l-2 border-primary/50 pl-4 italic my-3 text-muted-foreground/80">{children}</blockquote>
//                       },
//                       a({ href, children }) {
//                         return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4 font-medium">{children}</a>
//                       },
//                       table({ children }) {
//                         return <div className="overflow-x-auto my-4 rounded-lg border bg-background/50"><table className="w-full text-sm text-left">{children}</table></div>
//                       },
//                       thead({ children }) {
//                         return <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">{children}</thead>
//                       },
//                       tbody({ children }) {
//                         return <tbody className="divide-y border-t">{children}</tbody>
//                       },
//                       tr({ children }) {
//                         return <tr className="hover:bg-muted/20 transition-colors">{children}</tr>
//                       },
//                       th({ children }) {
//                         return <th className="px-4 py-3">{children}</th>
//                       },
//                       td({ children }) {
//                         return <td className="px-4 py-3">{children}</td>
//                       }
//                     }}
//                   >
//                     {message.message_text}
//                   </ReactMarkdown>
//                 </div>

//                 {/* Text to Speech Button */}
//                 {!isUser && (
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="absolute -right-10 top-0 h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover/message:opacity-100 transition-all duration-200"
//                     onClick={() => speakMessage(message.message_text, message.message_id)}
//                   >
//                     {isSpeaking && speakingMessageId === message.message_id ? (
//                       <VolumeX className="h-4 w-4" />
//                     ) : (
//                       <Volume2 className="h-4 w-4" />
//                     )}
//                   </Button>
//                 )}
//               </div>

//               {/* References */}
//               {!isUser && references.length > 0 && (
//                 <div className="space-y-2 pl-1 pt-1">
//                   <div className="text-[10px] font-bold text-muted-foreground/70 flex items-center gap-1.5 uppercase tracking-wider">
//                     <BookOpen className="h-3 w-3" />
//                     Sources ({references.length})
//                   </div>
//                   <div className="grid gap-2">
//                     {references.map((ref, index) => (
//                       <div
//                         key={index}
//                         className="text-xs p-3 bg-card border rounded-xl cursor-pointer hover:bg-accent/5 hover:border-accent/30 hover:shadow-sm transition-all duration-200 group/ref"
//                         onClick={() => handleReferenceClick(ref)}
//                       >
//                         <div className="flex items-center justify-between mb-1.5">
//                           <span className="font-medium text-foreground group-hover/ref:text-primary transition-colors line-clamp-1">
//                             {ref.pdf_name}
//                           </span>
//                           <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium bg-muted text-muted-foreground group-hover/ref:bg-primary/10 group-hover/ref:text-primary transition-colors">
//                             {Math.round(ref.similarity * 100)}% match
//                           </Badge>
//                         </div>
//                         <div className="text-muted-foreground line-clamp-2 leading-relaxed font-serif italic opacity-90">
//                           "{ref.chunk_text.substring(0, 150)}..."
//                         </div>
//                         <div className="mt-2 text-[10px] text-muted-foreground/60 flex items-center gap-1">
//                           <FileText className="h-3 w-3" />
//                           Page {ref.page_number}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Suggested Questions */}
//         {!isUser && suggestions.length > 0 && (
//           <div className="flex flex-wrap gap-2 ml-11 mt-1 mb-2">
//             {suggestions.map((question, idx) => (
//               <button
//                 key={idx}
//                 onClick={() => handleSendMessage(question)}
//                 className="text-xs bg-background hover:bg-accent/10 hover:text-accent border hover:border-accent/30 px-3 py-1.5 rounded-full transition-all duration-200 text-muted-foreground text-left shadow-sm"
//               >
//                 {question}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   // Sidebar Content Component
//   const SidebarContent = () => {
//     const allSelected = pdfs.length > 0 && selectedPdfIds.size === pdfs.length;

//     const toggleSelectAll = () => {
//       if (allSelected) {
//         setSelectedPdfIds(new Set());
//       } else {
//         setSelectedPdfIds(new Set(pdfs.map(p => p.pdf_id)));
//       }
//     };

//     const togglePdfSelection = (pdfId: string, e: React.MouseEvent) => {
//       e.stopPropagation();
//       const newSelected = new Set(selectedPdfIds);
//       if (newSelected.has(pdfId)) {
//         newSelected.delete(pdfId);
//       } else {
//         newSelected.add(pdfId);
//       }
//       setSelectedPdfIds(newSelected);
//     };

//     return (
//       <div className="flex flex-col h-full bg-muted/10">
//         <div className="p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/80">Documents</h2>
//             <div className="flex items-center gap-1">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={toggleSelectAll}
//                 className="h-7 w-7 text-muted-foreground hover:text-foreground"
//                 title={allSelected ? "Deselect All" : "Select All"}
//               >
//                 {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
//               </Button>
//               <ManageSessionPdfs
//                 sessionId={sessionId}
//                 currentPdfs={pdfs}
//                 onUpdate={loadSessionData}
//               />
//             </div>
//           </div>
//         </div>

//         <ScrollArea className="flex-1 p-3">
//           <div className="space-y-2">
//             {pdfs.map((pdf) => {
//               const isSelected = selectedPdfIds.has(pdf.pdf_id);
//               const isActive = selectedPdf === pdf.pdf_id;

//               return (
//                 <div
//                   key={pdf.pdf_id}
//                   onClick={() => {
//                     setSelectedPdf(pdf.pdf_id);
//                     setShowPdfPreview(true);
//                     setIsMobileMenuOpen(false);
//                   }}
//                   className={`
//                     group relative p-3 rounded-xl cursor-pointer transition-all duration-200 border
//                     ${isActive
//                       ? 'bg-primary/5 border-primary/20 shadow-sm'
//                       : 'bg-card border-transparent hover:bg-accent/5 hover:border-accent/10'
//                     }
//                   `}
//                 >
//                   <div className="flex items-start gap-3">
//                     <div
//                       className="flex items-center justify-center pt-1"
//                       onClick={(e) => togglePdfSelection(pdf.pdf_id, e)}
//                     >
//                       <Checkbox
//                         checked={isSelected}
//                         onCheckedChange={() => { }} // Handled by parent div click
//                         className={`
//                           transition-all duration-200
//                           ${isSelected ? 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground' : 'border-muted-foreground/40'}
//                         `}
//                       />
//                     </div>
//                     <div className={`
//                       p-2 rounded-lg transition-colors
//                       ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground'}
//                     `}>
//                       <FileText className="h-4 w-4" />
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
//                         {pdf.file_name}
//                       </p>
//                       <p className="text-xs text-muted-foreground/60 mt-0.5">
//                         {pdf.page_count || "?"} pages
//                       </p>
//                     </div>
//                   </div>
//                   {isActive && (
//                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full" />
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </ScrollArea>
//       </div>
//     );
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-8 text-center text-red-500">
//         {error}
//       </div>
//     );
//   }

//   if (!session) {
//     return (
//       <div className="p-8 text-center">
//         Session not found.
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen bg-gradient-to-b from-background to-muted/20 overflow-hidden flex flex-col font-sans">
//       {/* Header */}
//       <div className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 shadow-sm">
//         <div className="flex items-center gap-2 md:gap-4">
//           {/* Mobile Menu Trigger */}
//           <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
//             <SheetTrigger asChild>
//               <Button variant="ghost" size="icon" className="md:hidden shrink-0">
//                 <Menu className="h-5 w-5" />
//               </Button>
//             </SheetTrigger>
//             <SheetContent side="left" className="w-80 p-0 pt-10">
//               <SidebarContent />
//             </SheetContent>
//           </Sheet>

//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() => router.push("/dashboard")}
//             className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
//           >
//             <ArrowLeft className="h-4 w-4 md:mr-2" />
//             <span className="hidden md:inline">Back</span>
//           </Button>

//           <div className="h-6 w-px bg-border/50 hidden md:block" />

//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             className="text-muted-foreground hover:text-foreground transition-colors shrink-0 hidden md:flex"
//             title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
//           >
//             {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
//           </Button>

//           <div className="flex flex-col min-w-0">
//             <h1 className="text-base md:text-lg font-semibold flex items-center gap-2 text-foreground truncate">
//               <MessageSquare className="h-5 w-5 text-accent hidden md:block shrink-0" />
//               <span className="truncate">{session.session_name}</span>
//             </h1>
//             <p className="text-xs text-muted-foreground hidden md:block truncate">
//               {pdfs.length} Document{pdfs.length !== 1 ? 's' : ''} • {messages.length} Message{messages.length !== 1 ? 's' : ''}
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() => setIsExportModalOpen(true)}
//             className="text-muted-foreground hover:text-foreground transition-colors hidden md:flex"
//           >
//             <Download className="h-4 w-4 mr-2" />
//             Export
//           </Button>

//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() => setShowPdfPreview(!showPdfPreview)}
//             className={`
//               transition-all duration-200 hidden md:flex
//               ${showPdfPreview ? "bg-accent/10 text-accent hover:bg-accent/20" : "text-muted-foreground hover:text-foreground"}
//             `}
//           >
//             {showPdfPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
//             {showPdfPreview ? 'Hide Preview' : 'Show Preview'}
//           </Button>
//         </div>
//       </div>

//       {/* Body Layout */}
//       <div className="flex flex-1 overflow-hidden relative">
//         <PanelGroup direction="horizontal" className="h-full w-full">
//           {/* Desktop Sidebar */}
//           {isSidebarOpen && (
//             <>
//               <Panel
//                 id="sidebar"
//                 order={1}
//                 defaultSize={20}
//                 minSize={15}
//                 maxSize={40}
//                 className="hidden md:flex border-r bg-card/50 backdrop-blur-xl flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10"
//               >
//                 <SidebarContent />
//               </Panel>

//               <PanelResizeHandle className="hidden md:flex w-1 bg-border/20 hover:bg-accent/50 transition-colors items-center justify-center group z-20 cursor-col-resize">
//                 <div className="h-8 w-1 rounded-full bg-muted-foreground/20 group-hover:bg-accent transition-colors" />
//               </PanelResizeHandle>
//             </>
//           )}

//           {/* Center Panel – Chat Window */}
//           <Panel
//             id="chat"
//             order={2}
//             minSize={20}
//             defaultSize={35}
//             className="flex flex-col relative min-w-0 bg-background/30"
//           >
//             {/* Messages Area - Add padding bottom to account for floating input */}
//             <ScrollArea className="flex-1 h-full w-full">
//               <div className="px-4 md:px-8 py-6 mx-auto space-y-6 pb-32 w-full max-w-4xl">
//                 {messages.map(renderMessage)}
//                 <div ref={messagesEndRef} />
//               </div>
//             </ScrollArea>

//             {/* Floating Input Area - Absolute positioning */}
//             <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/80 to-transparent z-10">
//               <div className="mx-auto relative w-full max-w-4xl">
//                 <div className="relative flex items-end gap-2 bg-background/60 backdrop-blur-2xl border shadow-2xl rounded-2xl p-2 focus-within:ring-2 focus-within:ring-accent/20 transition-all duration-300">
//                   <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-accent rounded-xl shrink-0 hidden md:flex">
//                     <Plus className="h-5 w-5" />
//                   </Button>

//                   <Input
//                     placeholder={isListening ? "Listening..." : "Ask anything..."}
//                     value={newMessage}
//                     onChange={(e) => setNewMessage(e.target.value)}
//                     onKeyDown={handleKeyPress}
//                     disabled={isSending}
//                     className={`
//                       border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-2 py-3 h-auto max-h-32 min-h-[44px] resize-none
//                       placeholder:text-muted-foreground/50 text-base
//                     `}
//                   />

//                   <div className="flex items-center gap-1 pb-1">
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       onClick={toggleListening}
//                       className={`h-9 w-9 rounded-lg transition-colors ${isListening ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-muted-foreground hover:text-foreground'}`}
//                     >
//                       {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
//                     </Button>

//                     <Button
//                       size="icon"
//                       onClick={() => handleSendMessage()}
//                       disabled={!newMessage.trim() || isSending}
//                       className={`
//                         h-9 w-9 rounded-lg transition-all duration-200 shadow-sm
//                         ${!newMessage.trim() || isSending
//                           ? 'bg-muted text-muted-foreground'
//                           : 'bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105 hover:shadow-md'
//                         }
//                       `}
//                     >
//                       {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
//                     </Button>
//                   </div>
//                 </div>
//                 <div className="text-center mt-2">
//                   <p className="text-[10px] text-muted-foreground/50">
//                     AI can make mistakes. Please verify important information.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </Panel>

//           {/* Right Panel – PDF Viewer */}
//           {showPdfPreview && (
//             <>
//               <PanelResizeHandle className="hidden md:flex w-1 bg-border/20 hover:bg-accent/50 transition-colors items-center justify-center group z-20 cursor-col-resize">
//                 <div className="h-8 w-1 rounded-full bg-muted-foreground/20 group-hover:bg-accent transition-colors" />
//               </PanelResizeHandle>

//               <Panel
//                 id="pdf-preview"
//                 order={3}
//                 defaultSize={45}
//                 minSize={20}
//                 className="hidden md:flex flex-col border-l bg-background shadow-xl z-10"
//               >
//                 <PdfViewer
//                   pdf={pdfs.find(p => p.pdf_id === selectedPdf) || null}
//                   highlightedReference={highlightedReference}
//                   onPageChange={(page) => {
//                     // Optional: Sync page state if needed
//                   }}
//                 />
//               </Panel>
//             </>
//           )}
//         </PanelGroup>
//       </div>

//       <ExportModal
//         isOpen={isExportModalOpen}
//         onClose={() => setIsExportModalOpen(false)}
//         messages={messages}
//         sessionName={session.session_name}
//       />
//     </div>
//   );
// }

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
  Download
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      // Add user message to UI immediately
      const tempUserMessage: ChatMessage = {
        message_id: `temp-${Date.now()}`,
        session_id: sessionId,
        sender: 'user',
        message_text: messageToSend,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // Add timeout handling
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - AI is taking longer than expected')), 150000); // 2.5 minutes
      });

      // Show long processing indicator after 30 seconds
      const longProcessingTimer = setTimeout(() => {
        setIsLongProcessing(true);
      }, 30000);

      const response = await Promise.race([
        api.sendMessage(sessionId, messageToSend, Array.from(selectedPdfIds), provider),
        timeoutPromise
      ]) as any;

      // Clear the long processing timer
      clearTimeout(longProcessingTimer);
      setIsLongProcessing(false);

      // Replace temp message with actual response
      setMessages(prev => {
        // Auto-highlight first reference if available
        if (response.references && response.references.length > 0) {
          const firstRef = response.references[0];
          setHighlightedReference(firstRef);
          setSelectedPdf(firstRef.pdf_id);
          setShowPdfPreview(true);
        }

        const filtered = prev.filter(msg => msg.message_id !== tempUserMessage.message_id);
        return [
          ...filtered,
          {
            message_id: `user-${Date.now()}`,
            session_id: sessionId,
            sender: 'user',
            message_text: response.user_message,
            created_at: new Date().toISOString()
          },
          {
            message_id: `ai-${Date.now()}`,
            session_id: sessionId,
            sender: 'ai',
            message_text: response.ai_response,
            references: response.references,
            suggested_questions: response.suggested_questions,
            created_at: new Date().toISOString()
          }
        ];
      });

    } catch (error: any) {
      console.error("Failed to send message:", error);

      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.message_id.startsWith('temp-')));

      // Clear long processing state
      setIsLongProcessing(false);

      let errorMessage = "Failed to send message. Please try again.";

      if (error.message?.includes('timeout')) {
        errorMessage = "AI is taking longer than expected. The request is still processing in the background. Please wait a moment and refresh the page to see the response.";
      } else if (error.message?.includes('502')) {
        errorMessage = "AI service is temporarily unavailable. Please try again in a few moments.";
      } else if (error.message?.includes('500')) {
        errorMessage = "Server error occurred. Please try again.";
      }

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
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border
              ${isUser
                ? 'bg-primary text-primary-foreground border-primary/20'
                : 'bg-background text-foreground border-border'
              }
            `}>
              {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
            </div>

            {/* Message Content */}
            <div className={`space-y-2 ${isUser ? 'text-right' : 'text-left'} min-w-0`}>
              <div className={`
                p-3 md:p-5 shadow-sm relative transition-all duration-200
                ${isUser
                  ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-md shadow-primary/10'
                  : 'bg-card border text-card-foreground rounded-2xl rounded-tl-sm shadow-sm hover:shadow-md'
                }
              `}>
                <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <div className="relative rounded-lg overflow-hidden my-3 border bg-muted/50">
                            <div className="bg-muted px-4 py-1.5 text-xs text-muted-foreground border-b flex items-center justify-between font-mono">
                              <span>{match[1]}</span>
                            </div>
                            <div className="p-4 overflow-x-auto">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </div>
                          </div>
                        ) : (
                          <code className={`${className} bg-muted/40 px-1.5 py-0.5 rounded text-xs font-mono border border-border/50`} {...props}>
                            {children}
                          </code>
                        )
                      },
                      p({ children }) {
                        return <p className="mb-3 last:mb-0">{children}</p>
                      },
                      ul({ children }) {
                        return <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>
                      },
                      ol({ children }) {
                        return <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>
                      },
                      li({ children }) {
                        return <li className="">{children}</li>
                      },
                      h1({ children }) {
                        return <h1 className="text-lg font-bold mb-3 mt-5 first:mt-0">{children}</h1>
                      },
                      h2({ children }) {
                        return <h2 className="text-base font-bold mb-3 mt-4 first:mt-0">{children}</h2>
                      },
                      h3({ children }) {
                        return <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h3>
                      },
                      blockquote({ children }) {
                        return <blockquote className="border-l-2 border-primary/50 pl-4 italic my-3 text-muted-foreground/80">{children}</blockquote>
                      },
                      a({ href, children }) {
                        return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4 font-medium">{children}</a>
                      },
                      table({ children }) {
                        return <div className="overflow-x-auto my-4 rounded-lg border bg-background/50"><table className="w-full text-sm text-left">{children}</table></div>
                      },
                      thead({ children }) {
                        return <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">{children}</thead>
                      },
                      tbody({ children }) {
                        return <tbody className="divide-y border-t">{children}</tbody>
                      },
                      tr({ children }) {
                        return <tr className="hover:bg-muted/20 transition-colors">{children}</tr>
                      },
                      th({ children }) {
                        return <th className="px-4 py-3">{children}</th>
                      },
                      td({ children }) {
                        return <td className="px-4 py-3">{children}</td>
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
                    className="absolute -right-8 md:-right-10 top-0 h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-foreground opacity-100 md:opacity-0 group-hover/message:opacity-100 transition-all duration-200"
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
                <div className="space-y-2 pl-1 pt-1">
                  <div className="text-[10px] font-bold text-muted-foreground/70 flex items-center gap-1.5 uppercase tracking-wider">
                    <BookOpen className="h-3 w-3" />
                    Sources ({references.length})
                  </div>
                  <div className="grid gap-2">
                    {references.map((ref, index) => (
                      <div
                        key={index}
                        className="text-xs p-3 bg-card border rounded-xl cursor-pointer hover:bg-accent/5 hover:border-accent/30 hover:shadow-sm transition-all duration-200 group/ref"
                        onClick={() => handleReferenceClick(ref)}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-foreground group-hover/ref:text-primary transition-colors line-clamp-1">
                            {ref.pdf_name}
                          </span>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium bg-muted text-muted-foreground group-hover/ref:bg-primary/10 group-hover/ref:text-primary transition-colors">
                            {Math.round(ref.similarity * 100)}% match
                          </Badge>
                        </div>
                        <div className="text-muted-foreground line-clamp-2 leading-relaxed font-serif italic opacity-90">
                          "{ref.chunk_text.substring(0, 150)}..."
                        </div>
                        <div className="mt-2 text-[10px] text-muted-foreground/60 flex items-center gap-1">
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
          <div className="flex flex-wrap gap-1.5 md:gap-2 ml-8 md:ml-11 mt-1 mb-2">
            {suggestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(question)}
                className="text-[11px] md:text-xs bg-background hover:bg-accent/10 hover:text-accent border hover:border-accent/30 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full transition-all duration-200 text-muted-foreground text-left shadow-sm"
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
      <div className="flex flex-col h-full bg-muted/10">
        <div className="p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/80">Documents</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSelectAll}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
                      ? 'bg-primary/5 border-primary/20 shadow-sm'
                      : 'bg-card border-transparent hover:bg-accent/5 hover:border-accent/10'
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
                          ${isSelected ? 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground' : 'border-muted-foreground/40'}
                        `}
                      />
                    </div>
                    <div className={`
                      p-2 rounded-lg transition-colors
                      ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground'}
                    `}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        {pdf.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {pdf.page_count || "?"} pages
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full" />
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
    <div className="h-screen bg-gradient-to-b from-background to-muted/20 overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <div className="h-14 md:h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-3 md:px-6 shadow-sm">
        <div className="flex items-center gap-1.5 md:gap-4 flex-1 min-w-0">
          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 pt-10">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </Button>

          <div className="h-6 w-px bg-border/50 hidden md:block" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 hidden md:flex"
            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>

          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-sm md:text-lg font-semibold flex items-center gap-2 text-foreground truncate">
              <MessageSquare className="h-5 w-5 text-accent hidden md:block shrink-0" />
              <span className="truncate">{session.session_name}</span>
            </h1>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {pdfs.length} Doc{pdfs.length !== 1 ? 's' : ''} • {messages.length} Msg{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Select value={provider} onValueChange={handleProviderChange}>
            <SelectTrigger className="h-9 w-[104px] md:w-[130px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="cerebras">Cerebras</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExportModalOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors md:hidden h-9 w-9"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors hidden md:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPdfPreview(!showPdfPreview)}
            className={`
              transition-all duration-200 hidden md:flex
              ${showPdfPreview ? "bg-accent/10 text-accent hover:bg-accent/20" : "text-muted-foreground hover:text-foreground"}
            `}
          >
            {showPdfPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPdfPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      </div>

      {/* Body Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        <PanelGroup direction="horizontal" className="h-full w-full">
          {/* Desktop Sidebar */}
          {isSidebarOpen && (
            <>
              <Panel
                id="sidebar"
                order={1}
                defaultSize={20}
                minSize={15}
                maxSize={40}
                className="hidden md:flex border-r bg-card/50 backdrop-blur-xl flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 flex-1 min-w-0"
              >
                <SidebarContent />
              </Panel>

              <PanelResizeHandle className="hidden md:flex w-1 bg-border/20 hover:bg-accent/50 transition-colors items-center justify-center group z-20 cursor-col-resize">
                <div className="h-8 w-1 rounded-full bg-muted-foreground/20 group-hover:bg-accent transition-colors" />
              </PanelResizeHandle>
            </>
          )}

          {/* Center Panel – Chat Window */}
          {/* <Panel
            id="chat"
            order={2}
            minSize={20}
            defaultSize={35}
            className="flex flex-col relative min-w-0 bg-background/30 flex-1"
          > */}
          <Panel
            id="chat"
            order={2}
            minSize={20}
            defaultSize={35}
            className="flex flex-col relative min-w-0 bg-background/30 flex-1 overflow-hidden z-0"
          >

            {/* Messages Area - Add padding bottom to account for floating input */}
            <ScrollArea className="flex-1 h-full w-full">
              <div className="px-3 md:px-8 py-4 md:py-6 mx-auto space-y-4 md:space-y-6 pb-28 md:pb-32 w-full max-w-4xl">
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

            {/* Floating Input Area - Absolute positioning */}
            <div className="absolute bottom-0 left-0 right-0 p-2 md:p-6 bg-gradient-to-t from-background via-background/80 to-transparent z-10">
              <div className="mx-auto relative w-full max-w-4xl">
                <div className="relative flex items-end gap-1.5 md:gap-2 bg-background/60 backdrop-blur-2xl border shadow-2xl rounded-2xl p-1.5 md:p-2 focus-within:ring-2 focus-within:ring-accent/20 transition-all duration-300">
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-accent rounded-xl shrink-0 hidden md:flex">
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
                      placeholder:text-muted-foreground/50 text-sm md:text-base
                    `}
                  />

                  <div className="flex items-center gap-0.5 md:gap-1 pb-0.5 md:pb-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleListening}
                      className={`h-8 w-8 md:h-9 md:w-9 rounded-lg transition-colors ${isListening ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {isListening ? <MicOff className="h-4 w-4 md:h-5 md:w-5" /> : <Mic className="h-4 w-4 md:h-5 md:w-5" />}
                    </Button>

                    <Button
                      size="icon"
                      onClick={() => handleSendMessage()}
                      disabled={!newMessage.trim() || isSending}
                      className={`
                        h-8 w-8 md:h-9 md:w-9 rounded-lg transition-all duration-200 shadow-sm
                        ${!newMessage.trim() || isSending
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105 hover:shadow-md'
                        }
                      `}
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="text-center mt-1 md:mt-2 hidden md:block">
                  <p className="text-[10px] text-muted-foreground/50">
                    AI can make mistakes. Please verify important information.
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          {/* Right Panel – PDF Viewer */}
          {showPdfPreview && (
            <>
              <PanelResizeHandle className="hidden md:flex w-1 bg-border/20 hover:bg-accent/50 transition-colors items-center justify-center group z-20 cursor-col-resize">
                <div className="h-8 w-1 rounded-full bg-muted-foreground/20 group-hover:bg-accent transition-colors" />
              </PanelResizeHandle>

              {/* <Panel
                id="pdf-preview"
                order={3}
                defaultSize={45}
                minSize={20}
                className="hidden md:flex flex-col border-l bg-background shadow-xl z-10 flex-1 min-w-0"
              > */}
              <Panel
                id="pdf-preview"
                order={3}
                defaultSize={45}
                minSize={20}
                className="hidden md:flex flex-col border-l bg-background shadow-xl z-10 flex-1 min-w-0 overflow-hidden"
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

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        messages={messages}
        sessionName={session.session_name}
      />
    </div>
  );
}
