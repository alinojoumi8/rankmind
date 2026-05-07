import Link from "next/link";
import { Zap, MessageCircle, Code, Briefcase, Play } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "/changelog" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "API Docs", href: "/docs" },
  ],
  "Use Cases": [
    { label: "Small Business", href: "/use-cases/smb" },
    { label: "Marketing Agencies", href: "/use-cases/agencies" },
    { label: "E-commerce", href: "/use-cases/ecommerce" },
    { label: "SaaS Companies", href: "/use-cases/saas" },
    { label: "Local Business", href: "/use-cases/local" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "GEO Guide 2026", href: "/blog/geo-guide" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Webinars", href: "/webinars" },
    { label: "Affiliate Program", href: "/affiliates" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                Rank<span className="gradient-text">Mind</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              7 AI agents that optimize your visibility across Google and every major AI search engine. Automatically.
            </p>
            <div className="flex gap-3">
              {[MessageCircle, Code, Briefcase, Play].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            © 2026 RankMind Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 agent-active" />
              All systems operational
            </span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-600">SOC 2 Type II Certified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
