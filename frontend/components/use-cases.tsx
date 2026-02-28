"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Scale, GraduationCap, Briefcase, Heart } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const useCases = [
  {
    icon: Scale,
    title: "Legal",
    description: "Analyze contracts, briefs, and legal documents. Extract key clauses and find precedents in seconds.",
    stats: "95% faster research",
  },
  {
    icon: GraduationCap,
    title: "Academic",
    description: "Research papers, textbooks, and academic journals made accessible through conversational AI.",
    stats: "10x more citations",
  },
  {
    icon: Briefcase,
    title: "Business",
    description: "Extract insights from reports, proposals, and business plans to make informed decisions faster.",
    stats: "70% time saved",
  },
  {
    icon: Heart,
    title: "Healthcare",
    description: "Navigate medical literature, patient records, and research papers with accurate, cited responses.",
    stats: "99.9% accuracy",
  },
]

export function UseCases() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            useCases.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...prev, index])
              }, index * 150)
            })
          }
        })
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="use-cases" className="py-24 relative overflow-hidden" ref={sectionRef}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.06),transparent_50%)] bg-[radial-gradient(circle_at_90%_20%,rgba(16,185,129,0.08),transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 rounded-full glass-morphism mb-6">
            <span className="text-sm font-medium text-foreground">Use Cases</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-sans tracking-tight mb-6 text-balance">
            Trusted by <span className="gradient-text">Professionals</span>
          </h2>
          <p className="text-xl text-muted-foreground font-serif">
            Discover how AI DocuChat transforms workflows across industries
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {useCases.map((useCase, index) => (
            <Card
              key={useCase.title}
              className={`premium-card group transition-all duration-500 interactive-hover ${
                visibleCards.includes(index) ? "scroll-fade-in visible" : "scroll-fade-in"
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-6 text-center relative overflow-hidden">
                <div className="w-14 h-14 mx-auto rounded-xl bg-accent flex items-center justify-center mb-4 animate-float-gentle group-hover:animate-glow-pulse">
                  <useCase.icon className="h-7 w-7 text-white" />
                </div>

                <h3 className="text-lg font-bold mb-3 font-sans">{useCase.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed font-serif">{useCase.description}</p>

                <div className="glass-morphism px-4 py-2 rounded-full inline-block">
                  <span className="text-xs font-semibold text-accent">{useCase.stats}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
