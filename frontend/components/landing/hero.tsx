"use client"

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Star, FileText } from 'lucide-react';
import Link from 'next/link';

export function LandingHero() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 50, damping: 20 }
        },
    };

    return (
        <section className="pt-28 pb-12 sm:pt-32 sm:pb-20 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-center max-w-4xl mx-auto"
                >
                    {/* Badge */}
                    <motion.div variants={itemVariants} className="mb-6">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-l-secondary dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-dark dark:text-gray-300 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-lime-accent animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.5)]"></span>
                            RAG 2.0 Technology
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        variants={itemVariants}
                        className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-dark dark:text-white mb-4 sm:mb-6 leading-[1.1]"
                    >
                        Chat with your Data. <br />
                        <span className="text-gray-400 dark:text-gray-500">Get Instant Citations.</span>
                    </motion.h1>

                    {/* Subhead */}
                    <motion.p
                        variants={itemVariants}
                        className="text-base sm:text-lg md:text-xl text-subtext dark:text-gray-400 mb-6 sm:mb-8 max-w-2xl leading-relaxed px-2 sm:px-0"
                    >
                        Stop searching through PDFs. Upload your documents and get natural language answers backed by <span className="text-black dark:text-white font-semibold bg-lime-accent/20 px-1 rounded border border-lime-accent/20">exact source citations</span> in seconds.
                    </motion.p>

                    {/* Buttons */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-8 sm:mb-12 w-full sm:w-auto px-2 sm:px-0">
                        <Link href="/signup">
                            <motion.button
                                initial="initial"
                                whileHover="hover"
                                whileTap="tap"
                                variants={{
                                    initial: { scale: 1 },
                                    hover: { scale: 1.05 },
                                    tap: { scale: 0.95 }
                                }}
                                className="relative overflow-hidden bg-lime-accent text-black px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg flex items-center gap-2 shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] hover:bg-gradient-to-br hover:from-lime-accent hover:to-lime-400 transition-all duration-300 w-full sm:w-auto justify-center"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Start Chatting Free <ArrowRight className="w-5 h-5" />
                                </span>
                                {/* Shiny Silver Shimmer Animation - Hover Only, Faster */}
                                <motion.div
                                    variants={{
                                        initial: { x: '-100%' },
                                        hover: {
                                            x: '200%',
                                            transition: {
                                                repeat: Infinity,
                                                repeatType: "loop",
                                                duration: 0.7,
                                                ease: "linear",
                                                repeatDelay: 0.2
                                            }
                                        }
                                    }}
                                    className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-[20deg] z-0 pointer-events-none"
                                />
                            </motion.button>
                        </Link>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-black dark:text-white bg-l-secondary dark:bg-white/5 border border-transparent dark:border-white/10 transition-all duration-300 hover:bg-gray-200 dark:hover:bg-white/10 w-full sm:w-auto"
                        >
                            View Demo
                        </motion.button>
                    </motion.div>

                    {/* Social Proof */}
                    <motion.div variants={itemVariants} className="flex flex-col items-center gap-2 mb-10 sm:mb-20">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#050505] overflow-hidden bg-gray-200">
                                    <img src={`https://picsum.photos/100/100?random=${i}`} alt="User" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current drop-shadow-sm" />)}
                            </div>
                            <span className="text-sm font-medium text-subtext dark:text-gray-400 ml-2">Trusted by 10,000+ researchers</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Floating Dashboard Visualization */}
                <motion.div
                    initial={{ opacity: 0, rotateX: 20, y: 50 }}
                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                    transition={{ duration: 1, delay: 0.5, type: "spring" }}
                    style={{ perspective: 1000 }}
                    className="relative max-w-5xl mx-auto"
                >
                    {/* Floating Animation Wrapper */}
                    <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.05)] overflow-hidden aspect-[16/9] md:aspect-[2/1]"
                    >
                        {/* Fake UI Header */}
                        <div className="h-12 border-b border-gray-100 dark:border-white/5 flex items-center px-4 gap-2 bg-gray-50 dark:bg-[#0F0F0F]">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="ml-4 bg-white dark:bg-black px-3 py-1 rounded-md text-xs text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-white/5 flex-1 max-w-xs flex items-center justify-center font-mono">
                                Chat with Documents / Q3_Financial_Report.pdf
                            </div>
                        </div>

                        {/* Fake UI Body */}
                        <div className="flex h-full">
                            {/* Sidebar */}
                            <div className="w-64 bg-l-secondary dark:bg-[#050505] border-r border-gray-100 dark:border-white/5 hidden md:flex flex-col p-4 gap-3">
                                <div className="h-8 w-3/4 bg-gray-200 dark:bg-white/5 rounded animate-pulse"></div>
                                <div className="h-4 w-1/2 bg-gray-200 dark:bg-white/5 rounded animate-pulse opacity-60"></div>
                                <div className="mt-4 space-y-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-white/5 rounded border border-gray-100 dark:border-white/5 shadow-sm">
                                            <FileText className="w-4 h-4 text-lime-accent" />
                                            <div className="h-2 w-20 bg-gray-100 dark:bg-white/10 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 p-6 md:p-10 flex flex-col gap-6 relative dark:bg-[#0A0A0A]">
                                {/* User Message */}
                                <div className="self-end max-w-[80%] bg-gray-100 dark:bg-[#1A1A1A] dark:text-gray-200 rounded-2xl rounded-tr-sm p-4 text-sm border border-transparent dark:border-white/5">
                                    <p>What were the key revenue drivers in Q3?</p>
                                </div>

                                {/* AI Message */}
                                <div className="self-start max-w-[80%] bg-white dark:bg-black dark:text-gray-200 border border-gray-100 dark:border-white/10 shadow-sm rounded-2xl rounded-tl-sm p-4 text-sm relative">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded bg-lime-accent flex items-center justify-center shadow-[0_0_10px_rgba(163,230,53,0.3)]">
                                            <Star className="w-3 h-3 text-black fill-black" />
                                        </div>
                                        <span className="font-bold text-xs dark:text-white">Thinkbot AI</span>
                                    </div>
                                    <p className="mb-3 leading-relaxed">
                                        In Q3, the primary revenue driver was the <span className="bg-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-200 px-1 rounded border border-yellow-200 dark:border-yellow-500/20">Enterprise Subscription</span> segment, which grew by 24% YoY. Additionally, the new API marketplace contributed an unexpected 15% lift in recurring revenue.
                                    </p>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] bg-l-secondary dark:bg-[#111] border border-gray-200 dark:border-white/10 px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-500 dark:text-gray-400">
                                            <FileText className="w-3 h-3" /> Page 12, Line 4
                                        </span>
                                        <span className="text-[10px] bg-l-secondary dark:bg-[#111] border border-gray-200 dark:border-white/10 px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-500 dark:text-gray-400">
                                            <FileText className="w-3 h-3" /> Page 4, Chart 2
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gradient Overlay for Fade Effect at bottom */}
                        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white dark:from-[#0A0A0A] to-transparent pointer-events-none"></div>

                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
