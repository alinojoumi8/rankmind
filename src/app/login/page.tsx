import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#050914] flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Logo */}
      <div className="mb-8 text-center relative">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-2xl text-white">
            Rank<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Mind</span>
          </span>
        </Link>
      </div>

      <div className="relative">
        <SignIn
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#6366f1",
              colorBackground: "#080d1a",
              colorInputBackground: "rgba(255,255,255,0.05)",
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              colorTextSecondary: "#94a3b8",
              colorNeutral: "#1e293b",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-geist-sans)",
            },
            elements: {
              card: "shadow-2xl shadow-black/50 border border-white/8",
              headerTitle: "text-white font-bold",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton: "border-white/10 hover:bg-white/5",
              socialButtonsBlockButtonText: "text-slate-300",
              dividerLine: "bg-white/10",
              dividerText: "text-slate-600",
              formFieldLabel: "text-slate-400 text-xs",
              formFieldInput: "bg-white/5 border-white/10 text-white focus:border-indigo-500/50",
              footerActionLink: "text-indigo-400 hover:text-indigo-300",
              formButtonPrimary: "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25",
            },
          }}
        />
      </div>
    </div>
  );
}
