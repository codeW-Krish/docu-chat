// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Geist, Manrope, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from '@/hooks/use-auth' // Add this

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "AI DocuChat - Chat With Your Documents Instantly",
  description:
    "Transform your document workflow with AI-powered Document analysis. Ask questions, get smart answers, all with sources.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${manrope.variable} ${plusJakarta.variable} antialiased`} suppressHydrationWarning>
      <body className="font-sans">
        <AuthProvider> {/* Wrap with AuthProvider */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}