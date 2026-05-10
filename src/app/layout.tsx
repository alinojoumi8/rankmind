import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RankMind — AI Agents for SEO & AI Search Visibility",
  description:
    "7 AI agents that optimize your visibility across Google AND AI search engines (ChatGPT, Perplexity, Gemini, Claude). Starting at $49/month. No marketing team required.",
  keywords: [
    "AI SEO",
    "GEO optimization",
    "generative engine optimization",
    "AI search optimization",
    "SEO automation",
    "AI marketing platform",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}>
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
