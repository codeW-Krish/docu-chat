"use client"

import React, { useState, useEffect } from 'react';
import { FileText, Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#process' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
];

export function LandingNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Initial theme check
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                        ? 'bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/10 py-4'
                        : 'bg-transparent py-6'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <motion.div
                            whileHover={{ rotate: 10 }}
                            className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center"
                        >
                            <FileText className="text-lime-accent w-5 h-5 dark:text-black" />
                        </motion.div>
                        <span className="font-bold text-xl tracking-tight text-dark dark:text-white">ChatDocs</span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="relative text-subtext dark:text-gray-400 hover:text-black dark:hover:text-white font-medium transition-colors text-sm group"
                            >
                                {link.name}
                                <motion.span
                                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black dark:bg-lime-accent rounded-full group-hover:w-full transition-all duration-300"
                                />
                            </a>
                        ))}
                    </div>

                    {/* Right Side Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Theme Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-subtext dark:text-gray-400"
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </motion.button>

                        <Link href="/signin" className="relative text-sm font-semibold text-dark dark:text-white hover:text-subtext dark:hover:text-gray-300 transition-colors group">
                            Log in
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black dark:bg-white rounded-full group-hover:w-full transition-all duration-300"></span>
                        </Link>

                        <Link href="/signup">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-lg shadow-black/20 dark:shadow-white/10 hover:bg-gradient-to-br hover:from-gray-800 hover:to-black dark:hover:from-gray-200 dark:hover:to-white"
                            >
                                Start Free Trial
                            </motion.button>
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <div className="flex items-center gap-4 md:hidden">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white"
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="text-black dark:text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="fixed top-[70px] left-0 w-full bg-white dark:bg-[#050505] border-b border-gray-100 dark:border-white/10 z-40 md:hidden overflow-hidden shadow-lg"
                    >
                        <div className="flex flex-col p-6 gap-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-lg font-medium text-black dark:text-white"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <hr className="border-gray-100 dark:border-white/10" />
                            <Link href="/signup">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-lime-accent text-black w-full py-3 rounded-xl font-bold hover:brightness-105"
                                >
                                    Get Started
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
