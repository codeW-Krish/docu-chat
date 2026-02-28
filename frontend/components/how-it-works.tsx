"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Upload, MessageCircle, Lightbulb, ArrowRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const steps = [
  {
    number: "1",
    icon: Upload,
    title: "Upload Documents",
    description: "Upload multiple documents at once. We support PDF, PPTX, CSV, TXT, and DOCX formats.",
  },
  {
    number: "2",
    icon: MessageCircle,
    title: "Ask Questions",
    description: "Ask anything about your documents. Our AI understands context and relationships.",
  },
  {
    number: "3",
    icon: Lightbulb,
    title: "Get Answers",
    description: "Receive accurate answers with citations to the exact pages where information was found.",
  },
]

export function HowItWorks() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            steps.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...prev, index])
              }, index * 200)
            })
          }
        })
      },
      { threshold: 0.3 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden" ref={sectionRef}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.08),transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 rounded-full glass-morphism mb-6">
            <span className="text-sm font-medium text-foreground">How It Works</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-sans tracking-tight mb-6 text-balance">
            Three Simple Steps to <span className="gradient-text">Unlock Knowledge</span>
          </h2>
          <p className="text-xl text-muted-foreground font-serif">
            Transform your document workflow in minutes, not hours
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 z-20">
                  <ArrowRight className="h-6 w-6 text-accent/40 animate-pulse" />
                </div>
              )}

              <Card
                className={`premium-card transition-all duration-700 interactive-hover ${visibleCards.includes(index) ? "scroll-fade-in visible" : "scroll-fade-in"
                  }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardContent className="p-8 text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-accent flex items-center justify-center animate-float-gentle animate-glow-pulse">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                      {step.number}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-4 font-sans">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-serif">{step.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
