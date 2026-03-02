"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-all h-9 w-9 shadow-sm"
            title="Toggle theme"
        >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
