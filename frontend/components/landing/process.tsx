"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, MessageSquarePlus, CheckCircle, FileText, Sparkles, MousePointerClick } from 'lucide-react';

const steps = [
    {
        id: 1,
        title: 'Upload Documents',
        description: 'Drag and drop your PDFs, Docx, or txt files. We instantly process, encrypt, and vectorise your data on our secure private cloud.',
        icon: UploadCloud,
    },
    {
        id: 2,
        title: 'Ask Questions',
        description: 'Use natural language. Ask "What is the summary of section 3?" or "Compare the revenue figures between 2022 and 2023".',
        icon: MessageSquarePlus,
    },
    {
        id: 3,
        title: 'Get Cited Answers',
        description: 'Receive instant answers. Every claim is backlinked to the exact sentence in your original document for 100% verification.',
        icon: CheckCircle,
    }
];

// --- Floating Doodles Component ---
const FloatingDoodles = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Animated Dashed Line */}
            <svg className="absolute w-full h-full opacity-30 dark:opacity-20" viewBox="0 0 400 300" preserveAspectRatio="none">
                <motion.path
                    d="M-50 150 Q 100 50, 200 150 T 450 150"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="8 8"
                    className="text-gray-300 dark:text-gray-700"
                    animate={{ strokeDashoffset: [0, -100] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
            </svg>

            {/* Floating Shapes */}
            <motion.div
                className="absolute top-12 right-12 w-4 h-4 border-2 border-lime-accent/30 rounded-full"
                animate={{ y: [0, -15, 0], rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-24 left-12 w-3 h-3 bg-blue-500/10 dark:bg-blue-400/10 rounded-sm"
                animate={{ y: [0, 20, 0], rotate: -45 }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Pulsing Circle in Center */}
            <motion.div
                className="absolute top-1/2 left-1/2 w-48 h-48 border border-gray-100 dark:border-white/5 rounded-full"
                style={{ x: "-50%", y: "-50%" }}
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.05, 0.2, 0.05] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Dot Grid Pattern */}
            <div className="absolute inset-0 opacity-10 dark:opacity-5"
                style={{
                    backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            ></div>
        </div>
    )
}

// --- Custom Animated Visuals for each Step ---

const UploadVisual = () => (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-4 opacity-5 pointer-events-none">
            {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="bg-gray-400 dark:bg-white/10 rounded-sm"></div>
            ))}
        </div>

        {/* Main Upload Card */}
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm bg-white dark:bg-[#111] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-6 flex flex-col items-center z-10"
        >
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="w-20 h-20 bg-gray-50 dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5"
            >
                <UploadCloud className="w-10 h-10 text-lime-accent" />
            </motion.div>
            <p className="font-bold text-dark dark:text-white text-lg mb-1">Drop files here</p>
            <p className="text-sm text-subtext dark:text-gray-500 mb-6 text-center">Support for PDF, DOCX, CSV</p>

            {/* File List Animation */}
            <div className="w-full space-y-3">
                {['Q3_Financials.pdf', 'Product_Spec.docx'].map((file, i) => (
                    <motion.div
                        key={file}
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + (i * 0.3) }}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-white/5"
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-500'}`}>
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-dark dark:text-white truncate">{file}</span>
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 1 + (i * 0.3) }}
                                    className="text-[10px] text-green-500 font-bold"
                                >
                                    Ready
                                </motion.span>
                            </div>
                            <div className="h-1 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '100%' }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, delay: 0.5 + (i * 0.3) }}
                                    className="h-full bg-lime-accent"
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    </div>
);

const ChatVisual = () => (
    <div className="w-full h-full flex flex-col p-6 md:p-10 relative">
        {/* Fake Header */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-white dark:bg-[#111] border-b border-gray-100 dark:border-white/5 flex items-center px-6 gap-4 z-10">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-2" />
            <div className="text-xs font-medium text-gray-400">Ask a question...</div>
        </div>

        <div className="mt-12 flex flex-col gap-6 w-full max-w-md mx-auto">
            {/* User Message */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="self-end bg-gray-100 dark:bg-[#1A1A1A] text-dark dark:text-gray-200 px-4 py-3 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[85%] border border-transparent dark:border-white/5"
            >
                Summarize the risks mentioned in the audit report.
            </motion.div>

            {/* AI Thinking */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: [0, 1, 0] }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 1.5, repeat: 0 }}
                className="self-start flex gap-1 ml-2"
            >
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:0.2s]" />
            </motion.div>

            {/* AI Response */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 2 }}
                className="self-start bg-white dark:bg-[#050505] border border-gray-100 dark:border-white/10 text-dark dark:text-gray-300 px-5 py-4 rounded-2xl rounded-tl-sm text-sm shadow-md w-full relative"
            >
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-lime-accent rounded-lg flex items-center justify-center border-2 border-white dark:border-[#050505] shadow-sm">
                    <Sparkles className="w-4 h-4 text-black" />
                </div>
                <p className="leading-relaxed">
                    The audit identifies three primary risks:
                </p>
                <ul className="mt-2 space-y-2 list-disc list-inside">
                    <li><span className="font-semibold text-black dark:text-white">Compliance gaps</span> in data handling.</li>
                    <li><span className="font-semibold text-black dark:text-white">Vendor dependency</span> for critical infra.</li>
                </ul>
            </motion.div>
        </div>
    </div>
);

const CiteVisual = () => (
    <div className="w-full h-full flex items-center justify-center p-6 relative">
        {/* Document Background Layer */}
        <motion.div
            initial={{ rotate: -3, scale: 0.9 }}
            animate={{ rotate: -6, scale: 0.9 }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
            className="absolute w-64 h-80 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 rounded-xl shadow-lg -z-10 top-10 left-10 md:left-20 opacity-60"
        />

        {/* Main Interface Card */}
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full max-w-md bg-white dark:bg-[#111] rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
        >
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-[#1A1A1A]">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Citation Viewer</span>
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
            </div>
            <div className="p-6 relative">
                {/* Text Content */}
                <div className="space-y-3 text-sm text-gray-400 blur-[0.5px]">
                    <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded"></div>
                    <div className="h-2 w-5/6 bg-gray-100 dark:bg-white/5 rounded"></div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded"></div>
                </div>

                {/* Highlighted Section */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0.5 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="my-4 p-3 bg-yellow-50 dark:bg-yellow-500/10 border-l-4 border-yellow-400 rounded-r text-sm text-dark dark:text-gray-200 relative"
                >
                    <p className="font-medium relative z-10">
                        &quot;Revenue grew by 24% YoY driven by enterprise adoption.&quot;
                    </p>
                    {/* Tooltip */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.2 }}
                        className="absolute -top-8 right-0 bg-black text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap"
                    >
                        Confidence: 99.8%
                        <div className="absolute bottom-[-4px] right-4 w-2 h-2 bg-black rotate-45"></div>
                    </motion.div>
                </motion.div>

                <div className="space-y-3 text-sm text-gray-400 blur-[0.5px]">
                    <div className="h-2 w-4/5 bg-gray-100 dark:bg-white/5 rounded"></div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded"></div>
                </div>

                {/* Cursor Animation */}
                <motion.div
                    initial={{ x: 100, y: 100, opacity: 0 }}
                    whileInView={{ x: 50, y: 50, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                    className="absolute z-20 pointer-events-none"
                >
                    <MousePointerClick className="w-6 h-6 text-black dark:text-white fill-white dark:fill-black" />
                </motion.div>
            </div>
        </motion.div>
    </div>
);


export function LandingProcess() {
    const [activeStep, setActiveStep] = useState(1);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setActiveStep((prev) => (prev === steps.length ? 1 : prev + 1));
        }, 3000);

        return () => clearInterval(interval);
    }, [isPaused, activeStep]);

    const getVisual = (stepId: number) => {
        switch (stepId) {
            case 1: return <UploadVisual />;
            case 2: return <ChatVisual />;
            case 3: return <CiteVisual />;
            default: return <UploadVisual />;
        }
    }

    return (
        <section
            id="process"
            className="py-14 sm:py-24 md:py-32 bg-white dark:bg-[#050505]"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12 lg:mb-20 text-center lg:text-left"
                >
                    <span className="text-lime-accent font-bold tracking-wider uppercase text-xs sm:text-sm">How it works</span>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mt-2 sm:mt-3 mb-4 sm:mb-6 text-dark dark:text-white leading-tight">
                        Go from upload to <br className="hidden md:block" /> insight in seconds.
                    </h2>
                </motion.div>

                {/* --- MOBILE/TABLET LAYOUT (< lg) --- */}
                <div className="flex flex-col gap-6 sm:gap-12 lg:hidden">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-l-secondary dark:bg-[#111] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-transparent dark:border-white/10"
                        >
                            {/* Mobile Header */}
                            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-white/5">
                                    <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-lime-accent" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-gray-400 bg-white dark:bg-white/5 px-2 py-0.5 rounded-full border border-gray-100 dark:border-white/5">Step 0{step.id}</span>
                                    </div>
                                    <h3 className="text-lg sm:text-2xl font-bold text-dark dark:text-white">{step.title}</h3>
                                </div>
                            </div>

                            <p className="text-sm sm:text-lg text-subtext dark:text-gray-400 leading-relaxed mb-4 sm:mb-8">
                                {step.description}
                            </p>

                            {/* Mobile Visual Container */}
                            <div className="w-full h-[250px] sm:h-[350px] bg-white dark:bg-[#0A0A0A] rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 relative overflow-hidden shadow-sm">
                                <div className="absolute inset-0 scale-90 sm:scale-100 origin-center">
                                    {getVisual(step.id)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* --- DESKTOP LAYOUT (>= lg) --- */}
                <div
                    className="hidden lg:grid grid-cols-2 gap-20 items-center"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >

                    {/* Left Side: Steps Navigation */}
                    <div className="relative">
                        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-100 dark:bg-white/10" />

                        <div className="space-y-12">
                            {steps.map((step, index) => {
                                const isActive = activeStep === step.id;
                                return (
                                    <motion.div
                                        key={step.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`relative pl-24 cursor-pointer group`}
                                        onClick={() => setActiveStep(step.id)}
                                    >
                                        {/* Icon Bubble */}
                                        <div
                                            className={`absolute left-0 top-0 w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 z-10 ${isActive
                                                ? 'bg-black dark:bg-white border-black dark:border-white scale-110 shadow-lg'
                                                : 'bg-white dark:bg-[#111] border-gray-200 dark:border-white/10 group-hover:border-lime-accent dark:group-hover:border-lime-accent'
                                                }`}
                                        >
                                            <step.icon className={`w-7 h-7 transition-colors duration-300 ${isActive ? 'text-lime-accent dark:text-black' : 'text-gray-400 group-hover:text-lime-accent'}`} />
                                        </div>

                                        {/* Text Content */}
                                        <div>
                                            <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${isActive ? 'text-dark dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                                                {step.title}
                                            </h3>
                                            <div className={`overflow-hidden transition-all duration-500 ${isActive ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                <p className="text-lg text-subtext dark:text-gray-400 leading-relaxed mb-4">
                                                    {step.description}
                                                </p>
                                            </div>
                                            {/* Active Indicator Bar */}
                                            {isActive && (
                                                <motion.div layoutId="activeStepBar" className="h-1 w-12 bg-lime-accent rounded-full" />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Side: Dynamic Visual Swap */}
                    <div className="relative h-[600px] w-full" style={{ perspective: 1000 }}>
                        <div className="w-full h-full bg-l-secondary dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-200 dark:border-white/10 relative overflow-hidden shadow-2xl dark:shadow-[0_0_50px_-20px_rgba(255,255,255,0.05)]">
                            {/* Decorative background blobs */}
                            <div className="absolute top-[-20%] right-[-20%] w-80 h-80 bg-lime-accent/20 dark:bg-lime-accent/5 rounded-full blur-[100px]" />
                            <div className="absolute bottom-[-20%] left-[-20%] w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px]" />

                            <FloatingDoodles />

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4 }}
                                    className="absolute inset-0"
                                >
                                    {getVisual(activeStep)}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
