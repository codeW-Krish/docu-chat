// File: app/dashboard/layout.tsx
import type { Metadata } from "next";

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
    <div
      className="bg-white dark:bg-[#050505] text-dark dark:text-white min-h-screen selection:bg-lime-accent/30 selection:text-dark dark:selection:text-white transition-colors duration-300"
      style={{ fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif' }}
    >
      {children}
    </div>
  );
}
