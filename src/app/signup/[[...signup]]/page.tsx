import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#050914] flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px]" />
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
        <p className="mt-2 text-sm text-slate-500">14-day free trial · No credit card required</p>
      </div>

      <div className="relative">
        <SignUp
          path="/signup"
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#6366f1",
              colorBackground: "#080d1a",
              colorInputBackground: "rgba(255,255,255,0.05)",
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              colorTextSecondary: "#94a3b8",
              colorNeutral: "#334155",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-geist-sans)",
            },
            elements: {
              card: "shadow-2xl shadow-black/50 border border-white/8 bg-[#080d1a]",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 transition-all",
              socialButtonsBlockButtonText: "!text-slate-200 font-medium",
              socialButtonsBlockButtonArrow: "!text-slate-400",
              dividerLine: "bg-white/10",
              dividerText: "!text-slate-500 text-xs",
              formFieldLabel: "!text-slate-400 text-xs font-medium",
              formFieldInput: "!bg-white/5 !border-white/10 !text-white placeholder:text-slate-600 focus:!border-indigo-500/50 focus:!ring-indigo-500/20",
              otpCodeFieldInput: "!text-white !bg-white/10 !border-white/20 focus:!border-indigo-500/60",
              otpCodeField: "gap-2",
              footerActionText: "!text-slate-500",
              footerActionLink: "!text-indigo-400 hover:!text-indigo-300 font-medium",
              identityPreviewText: "!text-slate-300",
              identityPreviewEditButton: "!text-indigo-400",
              formButtonPrimary: "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25 !text-white font-semibold",
              alternativeMethodsBlockButton: "!text-slate-300 border-white/10 hover:bg-white/5",
              alertText: "!text-slate-300",
              alert: "!bg-rose-500/10 !border-rose-500/20",
              formFieldErrorText: "!text-rose-400",
              formFieldSuccessText: "!text-emerald-400",
              badge: "!bg-amber-500/10 !text-amber-400 !border-amber-500/20",
            },
          }}
        />
      </div>
    </div>
  );
}
