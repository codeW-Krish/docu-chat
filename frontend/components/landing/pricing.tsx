"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';

export function LandingPricing() {
    const [annual, setAnnual] = useState(true);

    const cardHover = {
        y: -8,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    };

    return (
        <section id="pricing" className="py-14 sm:py-24 bg-white dark:bg-[#050505]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6 text-dark dark:text-white">Simple Plans for Every Stage.</h2>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium ${!annual ? 'text-black dark:text-white' : 'text-subtext dark:text-gray-400'}`}>Monthly</span>
                        <button
                            onClick={() => setAnnual(!annual)}
                            className="w-14 h-8 bg-gray-100 dark:bg-gray-800 rounded-full relative px-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <motion.div
                                layout
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={`w-6 h-6 rounded-full bg-black dark:bg-lime-accent shadow-md absolute top-1 ${annual ? 'right-1' : 'left-1'}`}
                            />
                        </button>
                        <span className={`text-sm font-medium ${annual ? 'text-black dark:text-white' : 'text-subtext dark:text-gray-400'}`}>
                            Yearly <span className="text-lime-accent text-xs bg-black dark:bg-gray-800 dark:text-lime-accent px-2 py-0.5 rounded-full ml-1">-30%</span>
                        </span>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mt-4 sm:mt-0">

                    {/* Free */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        whileHover={cardHover}
                        className="bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 hover:shadow-xl transition-all duration-300"
                    >
                        <h3 className="text-xl font-bold mb-2 text-dark dark:text-white">Starter</h3>
                        <p className="text-subtext dark:text-gray-400 text-sm mb-6">For individuals just getting started.</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-dark dark:text-white">$0</span>
                            <span className="text-subtext dark:text-gray-400">/mo</span>
                        </div>
                        <Link href="/signup">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 rounded-xl border border-gray-200 dark:border-white/10 text-dark dark:text-white font-bold transition-all duration-300 mb-8 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-white/5 dark:hover:to-white/10"
                            >
                                Get Started
                            </motion.button>
                        </Link>
                        <ul className="space-y-4">
                            {['5 Documents / month', 'Basic PDF Search', '100 queries / day', 'Email Support'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-dark dark:text-gray-300">
                                    <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-black dark:text-white" />
                                    </div>
                                    {feat}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Pro - Recommended */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                        className="bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-lime-accent relative shadow-2xl dark:shadow-[0_0_30px_-5px_rgba(163,230,53,0.3)] sm:scale-105 z-10 origin-center mt-4 sm:mt-0"
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-lime-accent text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                            Most Popular
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-dark dark:text-white">Professional</h3>
                        <p className="text-subtext dark:text-gray-400 text-sm mb-6">For researchers and power users.</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-dark dark:text-white">${annual ? '29' : '39'}</span>
                            <span className="text-subtext dark:text-gray-400">/mo</span>
                        </div>
                        <Link href="/signup">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 rounded-xl bg-lime-accent text-black font-bold transition-all duration-300 mb-8 shadow-lg shadow-lime-accent/20 hover:bg-gradient-to-br hover:from-lime-accent hover:to-lime-400"
                            >
                                Start Free Trial
                            </motion.button>
                        </Link>
                        <ul className="space-y-4">
                            {['Unlimited Documents', 'GPT-4 Model Access', 'Export to Notion/Word', 'Table Extraction', 'Priority Support'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-dark dark:text-gray-300">
                                    <div className="w-5 h-5 rounded-full bg-lime-accent flex items-center justify-center">
                                        <Check className="w-3 h-3 text-black" />
                                    </div>
                                    {feat}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Enterprise */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        whileHover={cardHover}
                        className="bg-dark dark:bg-black text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-800 dark:border-white/20 hover:shadow-xl transition-all duration-300"
                    >
                        <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                        <p className="text-gray-400 text-sm mb-6">For large teams and security needs.</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold">$99</span>
                            <span className="text-gray-400">/mo</span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 rounded-xl bg-white text-black font-bold transition-all duration-300 mb-8 hover:bg-gradient-to-br hover:from-white hover:to-gray-200"
                        >
                            Contact Sales
                        </motion.button>
                        <ul className="space-y-4">
                            {['Private Cloud Deployment', 'SSO & Audit Logs', 'Custom API Access', 'Dedicated Success Manager', 'SLA'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-gray-800 dark:bg-white/10 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                    {feat}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
