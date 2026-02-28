"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
    {
        question: "How accurate are the citations?",
        answer: "Extremely accurate. We use advanced vector embedding models to match your query to specific text chunks. The system will always highlight the exact source text used to generate the answer."
    },
    {
        question: "Is my data secure?",
        answer: "Yes. We use AES-256 encryption for data at rest and TLS 1.3 for data in transit. For Enterprise plans, we offer single-tenant private cloud deployments."
    },
    {
        question: "What file formats do you support?",
        answer: "We support PDF, DOCX, TXT, CSV, and XLSX. We also have integrations for Notion, Google Drive, and Confluence."
    },
    {
        question: "Can I try it for free?",
        answer: "Yes, our Starter plan is completely free forever. It allows up to 5 documents per month with basic features."
    }
];

export function LandingFAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="py-14 sm:py-24 bg-l-secondary dark:bg-[#0A0A0A]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-12">
                    <div className="md:col-span-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-dark dark:text-white">Explore our FAQs.</h2>
                            <p className="text-subtext dark:text-gray-400">Have more questions? <a href="#" className="text-black dark:text-white underline decoration-lime-accent decoration-2">Contact support</a></p>
                        </motion.div>
                    </div>
                    <div className="md:col-span-8">
                        <div className="space-y-3 sm:space-y-4">
                            {faqs.map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="bg-white dark:bg-[#111] rounded-xl sm:rounded-2xl p-4 sm:p-6 cursor-pointer border border-transparent dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 transition-colors"
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-base sm:text-lg font-bold text-dark dark:text-white pr-2">{faq.question}</h3>
                                        <button className="w-8 h-8 rounded-full bg-l-secondary dark:bg-white/10 flex items-center justify-center text-black dark:text-white transition-colors">
                                            {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {openIndex === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <p className="pt-4 text-subtext dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/5 mt-4">
                                                    {faq.answer}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
