"use client"

import React from 'react';
import { FileText, Twitter, Linkedin, Dribbble, ArrowRight, Github } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function LandingFooter() {
    return (
        <footer className="relative bg-white dark:bg-[#050505] pt-16 sm:pt-32 pb-8 sm:pb-12 overflow-hidden border-t border-gray-100 dark:border-white/5">
            {/* Background Gradients/Patterns */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-lime-accent/5 dark:bg-lime-accent/5 rounded-full blur-[120px] opacity-50" />
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                        backgroundSize: '32px 32px'
                    }}
                ></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

                {/* Big CTA Section */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 sm:mb-24 gap-6 sm:gap-8 text-center md:text-left">
                    <div className="max-w-2xl">
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-dark dark:text-white mb-4 sm:mb-6 tracking-tight">
                            Ready to transform <br />
                            <span className="text-gray-400">your research workflow?</span>
                        </h2>
                        <p className="text-sm sm:text-lg text-subtext dark:text-gray-400">
                            Join 10,000+ researchers and teams who are already chatting with their documents.
                        </p>
                    </div>
                    <div>
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
                                className="relative overflow-hidden bg-lime-accent text-black px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg flex items-center gap-2 shadow-[0_4px_14px_0_rgba(163,230,53,0.39)] group mx-auto md:mx-0 transition-all duration-300 hover:bg-gradient-to-br hover:from-lime-accent hover:to-lime-400"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Get Started for Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                    </div>
                </div>

                <hr className="border-gray-100 dark:border-white/10 mb-10 sm:mb-16" />

                <div className="grid grid-cols-2 md:grid-cols-12 gap-6 sm:gap-8 md:gap-12 mb-12 sm:mb-20">
                    <div className="col-span-2 md:col-span-4 mb-4 sm:mb-0">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <FileText className="text-lime-accent w-5 h-5 dark:text-black" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-dark dark:text-white">ChatDocs</span>
                        </div>
                        <p className="text-subtext dark:text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8 max-w-xs leading-relaxed">
                            Empowering researchers and teams to interact with their knowledge base in plain English.
                        </p>
                        <div className="flex gap-2 sm:gap-3">
                            {[Twitter, Linkedin, Github, Dribbble].map((Icon, i) => (
                                <motion.a
                                    key={i}
                                    href="#"
                                    whileHover={{ y: -3 }}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-l-secondary dark:bg-white/5 border border-transparent dark:border-white/5 text-dark dark:text-gray-400 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                                >
                                    <Icon className="w-4 h-4" />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 md:col-start-7">
                        <h4 className="font-bold mb-4 sm:mb-6 text-dark dark:text-white text-sm sm:text-base">Product</h4>
                        <ul className="space-y-4 text-sm text-subtext dark:text-gray-400">
                            {['Features', 'Pricing', 'API', 'Integrations', 'Changelog'].map(item => (
                                <li key={item}><a href="#" className="hover:text-black dark:hover:text-white transition-colors">{item}</a></li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <h4 className="font-bold mb-4 sm:mb-6 text-dark dark:text-white text-sm sm:text-base">Company</h4>
                        <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm text-subtext dark:text-gray-400">
                            {['About', 'Blog', 'Careers', 'Contact', 'Partners'].map(item => (
                                <li key={item}><a href="#" className="hover:text-black dark:hover:text-white transition-colors">{item}</a></li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <h4 className="font-bold mb-4 sm:mb-6 text-dark dark:text-white text-sm sm:text-base">Legal</h4>
                        <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm text-subtext dark:text-gray-400">
                            {['Privacy Policy', 'Terms of Service', 'Security', 'Cookie Policy'].map(item => (
                                <li key={item}><a href="#" className="hover:text-black dark:hover:text-white transition-colors">{item}</a></li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Giant Text Effect */}
                <div className="relative border-t border-gray-100 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-subtext dark:text-gray-500 overflow-hidden">
                    <p className="relative z-10">&copy; {new Date().getFullYear()} ChatDocs AI Inc. All rights reserved.</p>
                    <div className="mt-4 md:mt-0 flex gap-6 relative z-10">
                        <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Sitemap</a>
                        <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Status</a>
                    </div>

                    {/* Massive Background Text clipped to bottom */}
                    <div className="absolute -bottom-4 md:-bottom-8 left-1/2 -translate-x-1/2 text-[15vw] md:text-[18vw] font-black text-gray-50 dark:text-white/[0.02] pointer-events-none select-none tracking-tighter leading-none whitespace-nowrap z-0">
                        CHATDOCS
                    </div>
                </div>
            </div>
        </footer>
    );
}
