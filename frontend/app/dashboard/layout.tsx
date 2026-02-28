// File: app/dashboard/layout.tsx
import type { Metadata } from "next";
import { Geist, Manrope } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Dashboard - AI DocuChat",
  description: "Manage your Documents and chat sessions",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <html lang="en" className={`${geist.variable} ${manrope.variable} antialiased`}>
    //   <body className="font-sans">
    //     {/* Wrapper div for background and text color to fix hydration */}
    //     <div className="bg-background text-foreground min-h-screen">
    //       {children}
    //     </div>
    //   </body>
    // </html>
    <div className="bg-background text-foreground min-h-screen">
      {children}
    </div>
  );
}
