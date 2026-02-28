import { LandingNavbar } from "@/components/landing/navbar"
import { LandingHero } from "@/components/landing/hero"
import { LandingFeatures } from "@/components/landing/features"
import { LandingProcess } from "@/components/landing/process"
import { LandingTestimonials } from "@/components/landing/testimonials"
import { LandingPricing } from "@/components/landing/pricing"
import { LandingFAQ } from "@/components/landing/faq"
import { LandingFooter } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] w-full overflow-x-hidden text-dark dark:text-white transition-colors duration-300" style={{ fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif' }}>
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingProcess />
        <LandingTestimonials />
        <LandingPricing />
        <LandingFAQ />
      </main>
      <LandingFooter />
    </div>
  )
}
