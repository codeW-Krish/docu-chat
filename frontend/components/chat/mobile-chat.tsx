"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Bot, Plus, Mic, MicOff, Send, Loader2, BookOpen } from "lucide-react";
import ShinyText from "@/components/ShinyText";
import dynamic from "next/dynamic";
import { ChatMessage, PdfFile } from "@/lib/api";

const PdfViewer = dynamic(() => import("@/components/pdf-viewer").then((mod) => mod.PdfViewer), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    ),
});

interface MobileChatProps {
    messages: ChatMessage[];
    renderMessage: (msg: ChatMessage) => React.ReactNode;
    isSending: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    newMessage: string;
    setNewMessage: (msg: string) => void;
    handleKeyPress: (e: React.KeyboardEvent) => void;
    handleSendMessage: () => void;
    isListening: boolean;
    toggleListening: () => void;
    showMobilePdf: boolean;
    setShowMobilePdf: (show: boolean) => void;
    pdfs: PdfFile[];
    selectedPdf: string | null;
    highlightedReference: any;
}

export function MobileChat({
    messages,
    renderMessage,
    isSending,
    messagesEndRef,
    newMessage,
    setNewMessage,
    handleKeyPress,
    handleSendMessage,
    isListening,
    toggleListening,
    showMobilePdf,
    setShowMobilePdf,
    pdfs,
    selectedPdf,
    highlightedReference,
}: MobileChatProps) {
    return (
        <div className="flex flex-col flex-1 overflow-hidden relative bg-[#FAFAFA] dark:bg-[#050505]">
            {/* Messages Area - Native pure flex layout */}
            <ScrollArea className="flex-1 min-h-0 w-full">
                <div className="px-3 py-4 mx-auto space-y-4 pb-4 w-full max-w-4xl">
                    {messages.map(renderMessage)}
                    {isSending && (
                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex gap-4 justify-start">
                                <div className="flex gap-3 max-w-[90%] flex-row">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border bg-white dark:bg-[#111] text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10">
                                        <Bot className="h-4 w-4 text-lime-600 dark:text-lime-accent" />
                                    </div>
                                    <div className="space-y-2 text-left min-w-0">
                                        <div className="p-4 shadow-sm relative transition-all duration-200 bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-[1.5rem] rounded-tl-sm shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none">
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

            {/* Sticky Input Area - Guaranteed bottom stick */}
            <div className="w-full shrink-0 p-3 bg-[#FAFAFA] dark:bg-[#050505] z-10 border-t border-zinc-200 dark:border-white/5 relative">
                <div className="mx-auto relative w-full max-w-4xl pointer-events-auto">
                    <div className="relative flex items-end gap-1.5 bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-lime-accent/30 transition-all duration-300">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl shrink-0 hidden sm:flex">
                            <Plus className="h-5 w-5" />
                        </Button>

                        <Input
                            placeholder={isListening ? "Listening..." : "Ask anything..."}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={isSending}
                            className={`
                border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-2 py-2 h-auto max-h-32 min-h-[40px] resize-none
                placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-white font-medium text-sm selection:bg-lime-accent/30
              `}
                        />

                        <div className="flex items-center gap-0.5 pb-0.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleListening}
                                className={`h-8 w-8 rounded-lg transition-colors ${isListening ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20' : 'text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                            >
                                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </Button>

                            <Button
                                size="icon"
                                onClick={() => handleSendMessage()}
                                disabled={!newMessage.trim() || isSending}
                                className={`
                  h-8 w-8 rounded-lg transition-all duration-300
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
                </div>
            </div>

            {/* Mobile PDF Drawer */}
            <Drawer open={showMobilePdf} onOpenChange={setShowMobilePdf}>
                <DrawerContent className="h-[90vh] bg-white dark:bg-[#0A0A0A] border-zinc-200 dark:border-white/10 flex flex-col">
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
        </div>
    );
}
