"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Zap, Layers, FileText, Table, Presentation, FileSpreadsheet, File, Database } from 'lucide-react';

export function LandingFeatures() {
    const cardHover = {
        y: -8,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: { duration: 0.2 }
    };

    const fileFormats = [
        { id: 'pdf', label: 'PDF', icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-900/30' },
        { id: 'docx', label: 'DOCX', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/30' },
        { id: 'xlsx', label: 'XLSX', icon: Table, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-900/30' },
        { id: 'pptx', label: 'PPTX', icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-900/30' },
        { id: 'csv', label: 'CSV', icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-900/30' },
        { id: 'txt', label: 'TXT', icon: File, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-white/10', border: 'border-gray-200 dark:border-white/20' },
    ];

    return (
        <section id="features" className="py-14 sm:py-24 bg-white dark:bg-[#050505]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-10 sm:mb-16 md:text-center max-w-3xl mx-auto px-2 sm:px-0">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-dark dark:text-white"
                    >
                        Smarter research &amp; content creation.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-subtext dark:text-gray-400 text-lg"
                    >
                        Our RAG engine processes your documents to provide accurate, context-aware answers with zero hallucinations.
                    </motion.p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:auto-rows-[400px]">

                    {/* Card 1: Large Left */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        whileHover={cardHover}
                        className="md:col-span-2 bg-l-secondary dark:bg-[#111] rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden group border border-transparent dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 transition-all"
                    >
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white dark:bg-[#222] rounded-xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 dark:border-white/5">
                                <Search className="w-6 h-6 text-black dark:text-white" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-dark dark:text-white">Deep Semantic Search</h3>
                            <p className="text-subtext dark:text-gray-400 max-w-sm">We don&apos;t just match keywords. We understand the intent behind your query to find the exact paragraph you need.</p>
                        </div>

                        {/* Visual */}
                        <div className="hidden sm:block absolute right-0 bottom-0 w-1/2 h-3/4 bg-white dark:bg-[#0A0A0A] rounded-tl-3xl shadow-xl border border-gray-100 dark:border-white/5 p-6 translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500">
                            <div className="space-y-3">
                                <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full"></div>
                                <div className="h-2 w-3/4 bg-gray-100 dark:bg-white/10 rounded-full"></div>
                                <div className="h-2 bg-lime-accent/30 dark:bg-lime-accent/20 w-full rounded-full"></div>
                                <div className="h-2 bg-lime-accent/30 dark:bg-lime-accent/20 w-5/6 rounded-full"></div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full"></div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <div className="px-2 py-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-[10px] text-gray-500 dark:text-gray-300">Relevance: 98%</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 2: Vertical */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        whileHover={cardHover}
                        className="bg-l-secondary dark:bg-[#111] rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden group border border-transparent dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 transition-all min-h-[200px] sm:min-h-0"
                    >
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white dark:bg-[#222] rounded-xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 dark:border-white/5">
                                <Zap className="w-6 h-6 text-lime-accent fill-lime-accent" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-dark dark:text-white">Instant Citations</h3>
                            <p className="text-subtext dark:text-gray-400">Click any citation to jump directly to the source page in the built-in PDF viewer.</p>
                        </div>
                        {/* Visual */}
                        <div className="hidden sm:flex absolute inset-x-6 bottom-6 h-32 bg-white dark:bg-[#0A0A0A] rounded-xl shadow-lg border border-gray-100 dark:border-white/5 p-4 flex-col justify-center group-hover:scale-105 transition-transform">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded bg-gray-100 dark:bg-white/10 flex-shrink-0"></div>
                                <div className="space-y-2 w-full">
                                    <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded"></div>
                                    <div className="h-2 w-2/3 bg-gray-100 dark:bg-white/10 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 3: Vertical */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        whileHover={cardHover}
                        className="bg-dark dark:bg-black text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden group shadow-lg border border-transparent dark:border-white/20"
                    >
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                                <ShieldCheck className="w-6 h-6 text-lime-accent" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold mb-2">Enterprise Secure</h3>
                            <p className="text-gray-400">SOC2 Compliant. Your data is encrypted at rest and in transit. We never train on your data.</p>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-lime-accent blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    </motion.div>

                    {/* Card 4: Large Right - Multi-Format Support */}
                    <motion.div
                        initial="initial"
                        whileInView="visible"
                        whileHover="hover"
                        viewport={{ once: true }}
                        variants={{
                            initial: { opacity: 0, y: 20, scale: 0.95 },
                            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, delay: 0.3 } },
                            hover: { y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }
                        }}
                        className="md:col-span-2 bg-l-secondary dark:bg-[#111] rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden group border border-transparent dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 transition-colors"
                    >
                        <div className="grid md:grid-cols-2 gap-8 h-full">
                            <div className="relative z-10 flex flex-col justify-center">
                                <div className="w-12 h-12 bg-white dark:bg-[#222] rounded-xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 dark:border-white/5">
                                    <Layers className="w-6 h-6 text-orange-500" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-dark dark:text-white">Multi-Format Support</h3>
                                <p className="text-subtext dark:text-gray-400">Upload PDFs, Word Docs, Excel Sheets, and even Notion pages. We unify your knowledge base.</p>
                            </div>

                            {/* Visual Area */}
                            <div className="relative h-full hidden sm:flex items-center justify-center min-h-[240px] w-full">

                                {/* Connecting Lines SVG Layer */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                    <svg className="w-[400px] h-[400px] overflow-visible" width="400" height="400" viewBox="-200 -200 400 400">
                                        {fileFormats.map((_, i) => {
                                            const angle = (i / fileFormats.length) * 2 * Math.PI - Math.PI / 2;
                                            const radius = 100;
                                            const tx = Math.cos(angle) * radius;
                                            const ty = Math.sin(angle) * radius;

                                            const springTransition = { type: "spring" as const, stiffness: 180, damping: 12, delay: i * 0.05 };

                                            return (
                                                <motion.g key={i}>
                                                    <motion.line
                                                        x1={0} y1={0}
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeDasharray="4 4"
                                                        className="text-gray-300 dark:text-gray-700 opacity-20"
                                                        variants={{
                                                            initial: { x2: 0, y2: 0, opacity: 0 },
                                                            hover: { x2: tx, y2: ty, opacity: 1, transition: springTransition }
                                                        }}
                                                    />
                                                    <motion.circle
                                                        r="2"
                                                        className="fill-lime-accent"
                                                        variants={{
                                                            initial: { cx: 0, cy: 0, opacity: 0 },
                                                            hover: {
                                                                cx: [0, tx],
                                                                cy: [0, ty],
                                                                opacity: [0, 1, 0],
                                                                transition: {
                                                                    duration: 1.5,
                                                                    repeat: Infinity,
                                                                    ease: "linear",
                                                                    delay: i * 0.1
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </motion.g>
                                            )
                                        })}
                                    </svg>
                                </div>

                                {/* Central Hub */}
                                <motion.div
                                    className="absolute top-1/2 left-1/2 -ml-10 -mt-10 w-20 h-20 bg-white dark:bg-[#1A1A1A] rounded-full shadow-2xl border-4 border-white dark:border-[#222] flex items-center justify-center z-20"
                                    variants={{
                                        initial: { scale: 1 },
                                        hover: { scale: 1.1 }
                                    }}
                                >
                                    <Database className="w-8 h-8 text-black dark:text-white" />
                                    <motion.div
                                        className="absolute -bottom-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-0"
                                        variants={{ hover: { opacity: 1, y: 0 } }}
                                        initial={{ y: 5 }}
                                    >
                                        Unified
                                    </motion.div>
                                </motion.div>

                                {/* Orbiting File Bubbles */}
                                {fileFormats.map((format, i) => {
                                    const angle = (i / fileFormats.length) * 2 * Math.PI - Math.PI / 2;
                                    const radius = 100;
                                    const tx = Math.cos(angle) * radius;
                                    const ty = Math.sin(angle) * radius;
                                    const springTransition = { type: "spring" as const, stiffness: 180, damping: 12, delay: i * 0.05 };

                                    return (
                                        <motion.div
                                            key={format.id}
                                            className={`absolute top-1/2 left-1/2 -ml-6 -mt-6 w-12 h-12 rounded-full shadow-lg border ${format.border} ${format.bg} flex items-center justify-center z-30 cursor-pointer group/bubble`}
                                            variants={{
                                                initial: { x: 0, y: 0, scale: 0.5, opacity: 0 },
                                                hover: {
                                                    x: tx,
                                                    y: ty,
                                                    scale: 1,
                                                    opacity: 1,
                                                    transition: springTransition
                                                }
                                            }}
                                            whileHover={{ scale: 1.2, zIndex: 50, transition: { duration: 0.2 } }}
                                        >
                                            <format.icon className={`w-5 h-5 ${format.color}`} />

                                            {/* Hover Label */}
                                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl transform translate-y-2 group-hover/bubble:translate-y-0 scale-90 group-hover/bubble:scale-100">
                                                {format.label}
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {/* Background Pulsing Rings */}
                                <motion.div
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                >
                                    <motion.div
                                        className="w-40 h-40 rounded-full border border-gray-200 dark:border-white/5"
                                        variants={{
                                            initial: { scale: 0.8, opacity: 0 },
                                            hover: { scale: 1, opacity: 1, transition: { duration: 0.5 } }
                                        }}
                                    />
                                    <motion.div
                                        className="absolute w-64 h-64 rounded-full border border-dashed border-gray-200 dark:border-white/5 opacity-0"
                                        variants={{
                                            hover: { opacity: 0.5, rotate: 180, transition: { duration: 10, repeat: Infinity, ease: "linear" } }
                                        }}
                                    />
                                </motion.div>

                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
