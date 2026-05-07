"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "What is GEO (Generative Engine Optimization) and why does it matter?",
    a: "GEO is the practice of optimizing your content to be cited and referenced by AI search engines like ChatGPT, Perplexity, Google AI Mode, and Claude. Unlike traditional SEO where you rank for keywords, GEO is about being the source that AI engines pull from when answering questions. Visitors from AI search convert 4.4× better than classic organic, and by 2026 over 30% of US internet users will search primarily via AI — so if you're not visible there, you're losing fast-converting traffic to competitors who are.",
  },
  {
    q: "How is RankMind different from Semrush, Ahrefs, or other SEO tools?",
    a: "Traditional tools like Semrush and Ahrefs are analytics platforms — they show you data and tell you what to do, but you have to do the work. RankMind is an AI agent system that actually does the work: it generates and publishes content, fixes technical issues, builds schema markup, runs outreach, and tracks your citations across 5 AI engines. It's the difference between a GPS that shows you the route and a self-driving car that takes you there.",
  },
  {
    q: "Do I need technical knowledge to use RankMind?",
    a: "No. RankMind is designed for business owners and marketers, not developers. The onboarding takes less than 10 minutes — you enter your domain, connect Google Search Console with one OAuth click, and the agents start working. Agents in \"Autopilot\" mode act independently. You can review everything in a clean dashboard without touching a line of code.",
  },
  {
    q: "How does the Content Architect agent publish content?",
    a: "Content Architect connects to your CMS via API (WordPress, Webflow, Contentful, Shopify, HubSpot CMS, and custom APIs). In Co-pilot mode, it drafts content for your approval before publishing. In Autopilot mode, it publishes directly on your editorial calendar. All content is optimized with proper heading structure, Q&A formatting, data tables, and authoritative citations — the exact structure AI engines prefer to extract and cite.",
  },
  {
    q: "Will Google penalize AI-generated content?",
    a: "No — Google's stance is clear: they evaluate content on quality, not how it was produced. Our Content Architect is designed specifically around Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) guidelines. Content is structured with original insights, factual data, expert perspectives, and proper source citations. We also support a \"human-in-loop\" Co-pilot mode for teams that want editorial review before publishing.",
  },
  {
    q: "How quickly will I see results?",
    a: "Technical SEO improvements (schema markup, site health) are visible within days. Content performance compounds: typically +23% citation share improvement by month 1, +147% by month 3 (based on median customer data). Rankings typically improve within 4–8 weeks as new content is indexed. Domain authority grows over 3–6 months as the Authority Builder agent builds backlinks.",
  },
  {
    q: "What happens to my content and data if I cancel?",
    a: "All content published to your CMS stays yours permanently — we don't watermark or lock it. Your historical data (reports, citation history, crawl data) is exportable as CSV/JSON for 30 days after cancellation. We do not sell your data to third parties.",
  },
  {
    q: "Do you support multiple languages and international SEO?",
    a: "Yes. RankMind supports content generation in 25+ languages, hreflang tag management, and GEO tracking in localized AI search results. International SEO features are available on Growth and Agency plans.",
  },
  {
    q: "Is there an API for developers and custom integrations?",
    a: "Yes — API access is available on Agency and Enterprise plans. The RankMind API lets you trigger agent actions programmatically, pull performance data into your own dashboards, and integrate with custom CMS or data warehouse setups. Full REST API documentation is available at docs.rankmind.ai.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-sm text-indigo-400 uppercase tracking-widest font-medium mb-3">FAQ</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Questions{" "}
            <span className="gradient-text">answered</span>
          </h2>
          <p className="text-slate-400 text-lg">Everything you need to know before starting your trial.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={cn(
                "card-glow rounded-xl overflow-hidden transition-all",
                open === i && "border-indigo-500/20"
              )}
            >
              <button
                className="w-full flex items-start justify-between gap-4 p-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-sm font-semibold text-white leading-relaxed">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 transition-transform",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
