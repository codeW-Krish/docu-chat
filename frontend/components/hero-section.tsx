"use client"

import { Button } from "@/components/ui/button"
import { Upload, Play, FileText, Sparkles, ArrowRight } from "lucide-react"
import { useEffect } from "react"

export function HeroSection() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible")
        }
      })
    }, observerOptions)

    // Observe all scroll-fade-in elements
    const scrollElements = document.querySelectorAll(".scroll-fade-in")
    scrollElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background pt-32">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/10 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.08),transparent_50%)] bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.06),transparent_50%)]" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FileText
          className="absolute top-20 left-10 w-6 h-6 text-accent/20 animate-document-float"
          style={{ animationDelay: "0s" }}
        />
        <FileText
          className="absolute top-40 right-20 w-4 h-4 text-accent/15 animate-document-float"
          style={{ animationDelay: "2s" }}
        />
        <FileText
          className="absolute bottom-32 left-1/4 w-5 h-5 text-accent/18 animate-document-float"
          style={{ animationDelay: "4s" }}
        />
        <FileText
          className="absolute top-1/2 right-1/4 w-3 h-3 text-accent/12 animate-document-float"
          style={{ animationDelay: "6s" }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-morphism mb-8 animate-glow-pulse">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-sm font-medium text-foreground">AI-Powered Document Analysis</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-sans tracking-tight mb-6 text-balance animate-slide-up">
            Chat With Your Documents. <span className="gradient-text">Instantly.</span>
          </h1>

          <p
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-serif text-balance animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            Ask questions, get smart answers, all with sources.
            <br className="hidden sm:block" />
            Transform your document workflow with AI.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button size="lg" className="premium-button text-lg px-8 py-4 h-auto group font-medium">
              <Upload className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Upload PDF Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="glass-morphism text-lg px-8 py-4 h-auto interactive-hover border-border/50 hover:border-accent/30 hover:text-foreground font-medium bg-transparent"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground font-serif animate-slide-up" style={{ animationDelay: "0.4s" }}>
            Secure • No setup required • Instant results
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-20 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="premium-card p-8 animate-float-gentle">
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400/70 animate-pulse" />
                <div
                  className="w-3 h-3 rounded-full bg-yellow-400/70 animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-3 h-3 rounded-full bg-green-400/70 animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
              <div className="glass-morphism px-4 py-2 rounded-full">
                <span className="text-xs font-medium text-foreground">AI DocuChat</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold">You</span>
                </div>
                <div className="glass-morphism p-4 rounded-lg flex-1">
                  <p className="text-sm font-serif">What are the key findings in this research paper?</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 animate-glow-pulse">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="glass-morphism p-4 rounded-lg flex-1">
                  <p className="text-sm mb-3 font-serif">
                    Based on the document analysis, the key findings include three major breakthroughs in quantum
                    computing efficiency, showing a 340% improvement in processing speed...
                  </p>
                  <div className="glass-morphism px-3 py-1 rounded-full text-xs text-accent inline-block font-medium">
                    📄 Source: Page 15, Section 3.2
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
