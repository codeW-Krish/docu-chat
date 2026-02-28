"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { Twitter, ArrowUpRight, Star, Quote } from 'lucide-react';

const testimonials = [
    {
        name: "Sarah Jenkins",
        role: "Legal Researcher",
        content: "The citation feature is a lifesaver. I used to spend hours cross-referencing claims. ChatDocs does it instantly.",
        handle: "@sarahj_law",
        highlight: "lifesaver"
    },
    {
        name: "David Chen",
        role: "Product Manager",
        content: "I uploaded our entire confluence export (500+ pages). The onboarding bot answered every question my new hires had. Insane accuracy.",
        handle: "@dchen_pm",
        highlight: "500+ pages"
    },
    {
        name: "Elena Rodriguez",
        role: "PhD Candidate",
        content: "It handles technical jargon surprisingly well. Most 'AI' summaries are too generic, but this actually understands the nuance of my papers.",
        handle: "@elena_phd",
        highlight: "understands nuance"
    },
    {
        name: "Marcus Thorne",
        role: "Financial Analyst",
        content: "Being able to upload Excel sheets alongside the quarterly reports and query them together changed my workflow forever. The table extraction is flawless.",
        handle: "@mthorne_fin",
        highlight: "table extraction"
    },
    {
        name: "Jessica Wu",
        role: "Content Strategist",
        content: "Repurposing old whitepapers into blog posts is now a 5-minute task instead of a 5-hour one. The ROI is immediate.",
        handle: "@jesswu_content",
        highlight: "5-minute task"
    },
    {
        name: "Tom Baker",
        role: "CTO",
        content: "Security was our main concern. The private cloud deployment option sealed the deal for us. It's rare to find this level of compliance in a startup tool.",
        handle: "@tbaker_tech",
        highlight: "compliance"
    },
    {
        name: "Alex Rivera",
        role: "Journalist",
        content: "I use it to synthesize interview transcripts. It catches connections I missed. It's like having a second brain.",
        handle: "@arivera_news",
        highlight: "second brain"
    },
    {
        name: "Priya Patel",
        role: "Medical Student",
        content: "Summarizing clinical trials for my thesis used to take weeks. Now I can extract key findings and methodologies in minutes.",
        handle: "@dr_priya",
        highlight: "take weeks"
    },
    {
        name: "James Wilson",
        role: "Startup Founder",
        content: "We use it for due diligence. Uploading pitch decks and financial models to get a quick risk assessment is a game changer.",
        handle: "@jwilson_vc",
        highlight: "game changer"
    }
];

export function LandingTestimonials() {
    return (
        <section className="py-14 sm:py-24 bg-l-secondary dark:bg-[#0A0A0A] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="text-center mb-10 sm:mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-block mb-4"
                    >
                        <span className="py-1 px-3 rounded-full bg-lime-accent/10 border border-lime-accent/20 text-black dark:text-lime-accent text-xs font-bold uppercase tracking-wider">
                            Wall of Love
                        </span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-dark dark:text-white tracking-tight"
                    >
                        Loved by researchers and builders.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-subtext dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-lg"
                    >
                        Don&apos;t just take our word for it. See what 10,000+ users have to say about their workflow transformation.
                    </motion.p>
                </div>

                {/* Masonry Grid Layout using CSS Columns */}
                <div className="columns-1 md:columns-2 lg:columns-3 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            whileHover={{ y: -5 }}
                            className="break-inside-avoid"
                        >
                            <div className="bg-white dark:bg-[#111] p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 hover:shadow-xl hover:border-gray-200 dark:hover:border-white/20 transition-all duration-300 relative group">
                                {/* Quote Icon Background */}
                                <div className="absolute top-6 right-6 opacity-5 dark:opacity-10 transition-opacity group-hover:opacity-10 dark:group-hover:opacity-20">
                                    <Quote className="w-8 h-8 text-black dark:text-white fill-current transform rotate-180" />
                                </div>

                                {/* Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 p-0.5">
                                        <img
                                            src={`https://picsum.photos/100/100?random=${200 + i}`}
                                            alt={t.name}
                                            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#111]"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-dark dark:text-white leading-tight">{t.name}</h4>
                                        <p className="text-xs text-subtext dark:text-gray-500">{t.role}</p>
                                    </div>
                                    <a href="#" className="ml-auto text-gray-300 hover:text-[#1DA1F2] transition-colors">
                                        <Twitter className="w-4 h-4" />
                                    </a>
                                </div>

                                {/* Rating */}
                                <div className="flex gap-0.5 mb-3">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>

                                {/* Content */}
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-2 relative z-10">
                                    &quot;{t.content}&quot;
                                </p>

                                {/* Highlight Badge */}
                                {t.highlight && (
                                    <div className="mt-3 inline-block px-2 py-1 bg-l-secondary dark:bg-[#1A1A1A] rounded text-[10px] font-medium text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/5">
                                        mentioned <span className="text-dark dark:text-white font-semibold">&quot;{t.highlight}&quot;</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <button className="inline-flex items-center gap-2 text-sm font-semibold text-dark dark:text-white hover:text-black dark:hover:text-lime-accent transition-colors">
                        Read all 500+ reviews on G2 <ArrowUpRight className="w-4 h-4" />
                    </button>
                </motion.div>
            </div>
        </section>
    );
}
