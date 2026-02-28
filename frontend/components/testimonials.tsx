"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"
import { useState, useEffect } from "react"

const testimonials = [
  {
    name: "Michael Chen",
    role: "Legal Researcher",
    company: "Baker & McKenzie",
    content:
      "AI DocuChat has revolutionized our legal research. I can find specific clauses in seconds rather than hours of manual searching.",
    rating: 5,
    avatar: "/professional-lawyer.png",
  },
  {
    name: "Sarah Johnson",
    role: "PhD Researcher",
    company: "Stanford University",
    content:
      "This tool has been invaluable for my dissertation research. I can ask questions about multiple papers and get cited answers instantly.",
    rating: 5,
    avatar: "/professional-woman-researcher.png",
  },
  {
    name: "David Rodriguez",
    role: "Business Analyst",
    company: "Goldman Sachs",
    content:
      "We've cut our quarterly report analysis time by 70%. The AI points to specific data points that help us make informed decisions.",
    rating: 5,
    avatar: "/professional-business-analyst.png",
  },
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [isAutoPlaying])

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 document-gradient" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-effect mb-6">
            <span className="text-sm font-medium text-muted-foreground">Testimonials</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            What Our Users{" "}
            <span className="bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">Say</span>
          </h2>
          <p className="text-xl text-muted-foreground">Join thousands of professionals who trust AI DocuChat</p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card
                key={testimonial.name}
                className={`premium-card transition-all duration-700 ${
                  index === currentIndex ? "ring-2 ring-accent/20 scale-105" : ""
                }`}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              >
                <CardContent className="p-6 relative">
                  <div className="absolute top-4 right-4 opacity-10">
                    <Quote className="h-8 w-8 text-accent" />
                  </div>

                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <blockquote className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>

                  <div className="flex items-center space-x-3">
                    <div className="p-0.5 rounded-xl bg-accent">
                      <img
                        src={testimonial.avatar || "/placeholder.svg"}
                        alt={testimonial.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-xs text-accent font-medium">{testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-accent scale-125" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
