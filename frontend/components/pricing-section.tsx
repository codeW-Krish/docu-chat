"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, Crown, ArrowRight } from "lucide-react"
import { useEffect } from "react"

const pricingPlans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for getting started",
    icon: Sparkles,
    features: [
      "5 PDF uploads per month",
      "Basic chat functionality",
      "Standard response time",
      "Email support",
      "Basic document analysis",
    ],
    limitations: ["Limited to 10MB file size", "No priority support", "Basic AI model"],
    buttonText: "Get Started Free",
    popular: false,
    gradient: "from-muted/50 to-muted/30",
  },
  {
    name: "Professional",
    price: "29",
    originalPrice: "39",
    description: "Best value for professionals",
    icon: Zap,
    features: [
      "Unlimited PDF uploads",
      "Advanced AI chat capabilities",
      "Priority response time",
      "Priority email & chat support",
      "Advanced document analysis",
      "Export conversations",
      "Custom AI prompts",
      "Document summarization",
      "Multi-language support",
    ],
    buttonText: "Start Free Trial",
    popular: true,
    gradient: "from-accent/20 to-accent/10",
  },
  {
    name: "Enterprise",
    price: "99",
    description: "For teams and organizations",
    icon: Crown,
    features: [
      "Everything in Professional",
      "Team collaboration tools",
      "Admin dashboard",
      "SSO integration",
      "Custom integrations",
      "Dedicated account manager",
      "99.9% uptime SLA",
      "Advanced security features",
      "Custom AI model training",
      "API access",
      "White-label options",
    ],
    buttonText: "Contact Sales",
    popular: false,
    gradient: "from-primary/20 to-primary/10",
  },
]

export function PricingSection() {
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

    const scrollElements = document.querySelectorAll(".scroll-fade-in")
    scrollElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/5 to-background" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 scroll-fade-in">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-morphism mb-8 animate-glow-pulse">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-sm font-medium text-foreground">Simple Pricing</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold font-sans tracking-tight mb-6">
            Choose Your <span className="gradient-text">Perfect Plan</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
            Start free, upgrade when you need more. All plans include our core AI chat features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => {
            const IconComponent = plan.icon
            return (
              <Card
                key={plan.name}
                className={`premium-card relative overflow-hidden scroll-fade-in ${
                  plan.popular ? "ring-2 ring-accent/20 scale-105" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0">
                    <div className="bg-gradient-to-r from-accent to-accent/80 text-white text-center py-2 text-sm font-medium">
                      🎯 Most Popular Choice
                    </div>
                  </div>
                )}

                <CardHeader className={`text-center ${plan.popular ? "pt-12" : "pt-6"}`}>
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4 animate-float-gentle`}
                  >
                    <IconComponent className="w-8 h-8 text-accent" />
                  </div>

                  <CardTitle className="text-2xl font-sans">{plan.name}</CardTitle>
                  <CardDescription className="font-serif">{plan.description}</CardDescription>

                  <div className="flex items-baseline justify-center gap-2 mt-4">
                    <span className="text-4xl font-bold font-sans">${plan.price}</span>
                    <span className="text-muted-foreground font-serif">/month</span>
                    {plan.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through font-serif">
                        ${plan.originalPrice}
                      </span>
                    )}
                  </div>

                  {plan.originalPrice && (
                    <Badge variant="secondary" className="mt-2 glass-morphism">
                      Save ${Number.parseInt(plan.originalPrice) - Number.parseInt(plan.price)}/month
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  <Button
                    className={`w-full h-12 text-base font-medium group ${
                      plan.popular
                        ? "premium-button"
                        : "glass-morphism border-border/50 hover:border-accent/30 interactive-hover"
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.buttonText}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      What's included:
                    </h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-accent" />
                          </div>
                          <span className="text-sm font-serif leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.name === "Free" && (
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground font-serif text-center">
                        No credit card required • Upgrade anytime
                      </p>
                    </div>
                  )}

                  {plan.name === "Professional" && (
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground font-serif text-center">
                        14-day free trial • Cancel anytime
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-16 scroll-fade-in">
          <p className="text-muted-foreground font-serif mb-4">Need a custom solution? We've got you covered.</p>
          <Button
            variant="outline"
            className="glass-morphism border-border/50 hover:border-accent/30 interactive-hover bg-transparent"
          >
            Contact Sales Team
          </Button>
        </div>
      </div>
    </section>
  )
}
