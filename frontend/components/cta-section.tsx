"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Play, Sparkles, ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 document-gradient" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Card className="mx-auto max-w-4xl premium-card p-12 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-morphism mb-8">
            <Sparkles className="w-4 h-4 mr-2 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">Ready to Get Started?</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Ready to Chat With Your{" "}
            <span className="bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">Documents?</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            No setup needed. Get instant insights from your PDFs or Documents in seconds. Join thousands of professionals already
            using AI DocuChat.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button size="lg" className="premium-button text-lg px-8 py-4 h-auto group">
              <Upload className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Upload PDF Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="glass-morphism text-lg px-8 py-4 h-auto hover:bg-primary/10 hover:text-foreground group bg-transparent border-primary/20"
            >
              <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Watch Demo
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center glass-morphism px-3 py-1 rounded-full">
              <span>🔒 Secure by default</span>
            </div>
            <div className="flex items-center glass-morphism px-3 py-1 rounded-full">
              <span>⚡ No credit card required</span>
            </div>
            <div className="flex items-center glass-morphism px-3 py-1 rounded-full">
              <span>🎯 Instant results</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
