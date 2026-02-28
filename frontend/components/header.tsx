"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Shield, Sparkles } from "lucide-react"
import Link from "next/link"

import Image from "next/image"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full glass-morphism border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative h-12 w-12 rounded-2xl overflow-hidden glow-effect">
              <Image src="/logo.png" alt="AI DocuChat Logo" fill className="object-cover" />
            </div>
            <div>
              <span className="font-heading text-2xl font-bold">AI DocuChat</span>
              <div className="flex items-center">
                <Sparkles className="h-3 w-3 text-accent mr-1" />
                <span className="text-xs text-accent font-medium">Powered by AI</span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {["How It Works", "Use Cases", "Testimonials"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="hover:bg-accent/10" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button size="sm" className="premium-button glow-effect" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <nav className="flex flex-col space-y-4 px-4 py-6">
              <a
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </a>
              <a
                href="#use-cases"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Use Cases
              </a>
              <a
                href="#testimonials"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Testimonials
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              <div className="flex flex-col space-y-2 pt-4 border-t">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
