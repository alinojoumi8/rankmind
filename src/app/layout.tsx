import type { Metadata, Viewport } from "next";
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
    "7 AI agents that optimise your visibility across Google AND AI search engines (ChatGPT, Perplexity, Gemini, Claude). Starting at $49/month. No marketing team required.",
  keywords: [
    "AI SEO",
    "GEO optimization",
    "generative engine optimization",
    "AI search optimization",
    "SEO automation",
    "AI marketing platform",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RankMind",
  },
  icons: {
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}>
        <head>
          {/* PWA splash / tile colours */}
          <meta name="msapplication-TileColor" content="#6366f1" />
          <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
        </head>
        <body className="antialiased">
          {children}

          {/* Service Worker registration */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function () {
                    navigator.serviceWorker.register('/sw.js').catch(function () {});
                  });
                }
              `,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
