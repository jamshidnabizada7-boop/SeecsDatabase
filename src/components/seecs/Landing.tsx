'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  ShieldCheck,
  KeyRound,
  Database,
  BarChart3,
  Bot,
  Users,
  Github,
  Globe,
  Mail,
  ArrowRight,
} from 'lucide-react'

/* ─── Custom keyframe animations (CSS only, no external files) ─── */
const customStyles = `
@keyframes lp-fade-in-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes lp-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes lp-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-7px); }
}
@keyframes lp-shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
@keyframes lp-pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.25), 0 1px 3px rgba(0,0,0,0.08); }
  50%      { box-shadow: 0 0 0 6px rgba(16,185,129,0), 0 1px 3px rgba(0,0,0,0.08); }
}
@keyframes lp-mesh-drift {
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(10px, -10px) scale(1.05); }
  66%  { transform: translate(-5px, 5px) scale(0.97); }
  100% { transform: translate(0, 0) scale(1); }
}
.lp-fade-in         { animation: lp-fade-in 0.6s ease-out both; }
.lp-fade-up         { animation: lp-fade-in-up 0.7s ease-out both; }
.lp-fade-up-d1      { animation: lp-fade-in-up 0.7s ease-out 0.1s both; }
.lp-fade-up-d2      { animation: lp-fade-in-up 0.7s ease-out 0.2s both; }
.lp-fade-up-d3      { animation: lp-fade-in-up 0.7s ease-out 0.3s both; }
.lp-fade-up-d4      { animation: lp-fade-in-up 0.7s ease-out 0.4s both; }
.lp-fade-up-d5      { animation: lp-fade-in-up 0.7s ease-out 0.5s both; }
.lp-float           { animation: lp-float 4s ease-in-out infinite; }
.lp-shimmer         { background-size: 200% 100%; animation: lp-shimmer 3s ease-in-out infinite; }
.lp-pulse-glow      { animation: lp-pulse-glow 2.5s ease-in-out infinite; }
.lp-mesh-drift      { animation: lp-mesh-drift 20s ease-in-out infinite; }
`

/* ─── Accent color map for feature cards ─── */
const ACCENTS = {
  emerald: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-100 text-emerald-600',
    hoverShadow: 'hover:shadow-emerald-500/10',
  },
  amber: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-100 text-amber-600',
    hoverShadow: 'hover:shadow-amber-500/10',
  },
  sky: {
    border: 'border-l-sky-500',
    iconBg: 'bg-sky-100 text-sky-600',
    hoverShadow: 'hover:shadow-sky-500/10',
  },
  violet: {
    border: 'border-l-violet-500',
    iconBg: 'bg-violet-100 text-violet-600',
    hoverShadow: 'hover:shadow-violet-500/10',
  },
} as const

type Accent = keyof typeof ACCENTS

/* ─── Feature Card ─── */
function FeatureCard({
  icon,
  title,
  desc,
  accent,
  className,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  accent: Accent
  className?: string
}) {
  const s = ACCENTS[accent]
  return (
    <Card
      className={
        `h-full border-l-4 ${s.border} ${s.hoverShadow} hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm ${className ?? ''}`
      }
    >
      <CardHeader>
        <div className={`h-10 w-10 rounded-lg ${s.iconBg} grid place-items-center mb-2 transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed text-stone-500">
          {desc}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

/* ─── Step Card ─── */
function StepCard({
  step,
  icon,
  title,
  desc,
}: {
  step: string
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <Card className="h-full bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3 mb-3">
          {/* Numbered gradient circle */}
          <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center shadow-lg shadow-emerald-500/20 shrink-0">
            {icon}
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white text-emerald-700 text-[11px] font-bold grid place-items-center border border-emerald-200 shadow-sm">
              {step}
            </span>
          </div>
        </div>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed text-stone-500">
          {desc}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

/* ─── Step Connector (desktop only) ─── */
function StepConnector() {
  return (
    <div className="hidden md:flex items-center justify-center shrink-0 px-1">
      <div className="flex items-center">
        <div className="w-6 border-t-2 border-dashed border-emerald-300" />
        <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-200 grid place-items-center shadow-sm -ml-0.5">
          <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
        </div>
      </div>
    </div>
  )
}

/* ─── Main Landing Component ─── */
export default function Landing({
  onEnterAdmin,
  onEnterCompany,
}: {
  onEnterAdmin: () => void
  onEnterCompany: () => void
}) {
  // Smooth scroll behaviour
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 via-white to-stone-50/80 lp-fade-in">
        {/* ── Header ── */}
        <header className="border-b border-stone-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-10 lp-fade-in">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white grid place-items-center font-bold text-lg shadow-md shadow-emerald-500/20">
                S
              </div>
              <div className="leading-tight">
                <div className="font-semibold text-sm sm:text-base text-stone-800">
                  SEECS Database
                </div>
                <div className="text-xs text-stone-500">NUST Islamabad</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEnterCompany}
                className="text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                Company Portal
              </Button>
              <Button
                size="sm"
                onClick={onEnterAdmin}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
              >
                Admin Login
              </Button>
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1">
          {/* ── Hero Section ── */}
          <section className="relative overflow-hidden">
            {/* Gradient mesh background blobs */}
            <div
              className="pointer-events-none absolute inset-0 lp-mesh-drift"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse 600px 400px at 15% 25%, rgba(16,185,129,0.10) 0%, transparent 70%),
                  radial-gradient(ellipse 500px 350px at 80% 15%, rgba(20,184,166,0.08) 0%, transparent 70%),
                  radial-gradient(ellipse 400px 300px at 60% 85%, rgba(245,158,11,0.05) 0%, transparent 70%),
                  radial-gradient(ellipse 350px 250px at 10% 75%, rgba(16,185,129,0.06) 0%, transparent 70%),
                  radial-gradient(ellipse 300px 300px at 90% 70%, rgba(20,184,166,0.05) 0%, transparent 70%)
                `,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 lp-mesh-drift"
              style={{
                animationDelay: '-10s',
                animationDuration: '25s',
                backgroundImage: `
                  radial-gradient(ellipse 400px 300px at 40% 40%, rgba(16,185,129,0.05) 0%, transparent 70%),
                  radial-gradient(ellipse 500px 250px at 70% 60%, rgba(20,184,166,0.04) 0%, transparent 70%)
                `,
              }}
            />

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
              {/* Floating badge */}
              <div className="lp-float inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 backdrop-blur-sm px-4 py-1.5 text-xs text-emerald-700 font-medium mb-8 lp-fade-up-d1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Hosted on Neon PostgreSQL · Migrated from MySQL + Java/JDBC
              </div>

              {/* Gradient heading */}
              <h1 className="lp-fade-up-d2 text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.1] bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800 bg-clip-text text-transparent">
                The central registry for SEECS-affiliated companies
              </h1>

              <p className="lp-fade-up-d3 mt-6 text-stone-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Manage companies, founders, sectors and financial performance in
                one place. Built-in analytics, an AI assistant for the database
                manager, and a secure per-company self-service portal where each
                company can only touch its own data.
              </p>

              {/* CTA Buttons with shimmer & glow */}
              <div className="lp-fade-up-d4 mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={onEnterAdmin}
                  className={
                    'w-full sm:w-auto text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all duration-300 lp-shimmer '
                  }
                  style={{
                    backgroundImage:
                      'linear-gradient(110deg, #059669 0%, #0d9488 30%, #059669 50%, #0d9488 70%, #059669 100%)',
                    backgroundSize: '200% 100%',
                  }}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Database Manager Login
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onEnterCompany}
                  className="w-full sm:w-auto border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-800 transition-all duration-300 lp-pulse-glow"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Company Portal / Register
                </Button>
              </div>
            </div>
          </section>

          {/* ── Feature Cards ── */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<BarChart3 className="h-5 w-5" />}
                title="Live analytics"
                desc="Gender split, sector distribution, revenue trends and top companies — visualised in real time."
                accent="emerald"
                className="lp-fade-up-d1"
              />
              <FeatureCard
                icon={<Bot className="h-5 w-5" />}
                title="AI assistant"
                desc="Ask the database questions in plain English. Bring your own LLM (OpenAI / Anthropic / custom)."
                accent="amber"
                className="lp-fade-up-d2"
              />
              <FeatureCard
                icon={<KeyRound className="h-5 w-5" />}
                title="Per-company keys"
                desc="Each company gets a unique API key. They can update only their own profile, founders and revenue."
                accent="sky"
                className="lp-fade-up-d3"
              />
              <FeatureCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Strict isolation"
                desc="A company can never read, modify or delete another company's data — enforced at the API layer."
                accent="violet"
                className="lp-fade-up-d4"
              />
            </div>
          </section>

          {/* ── How It Works ── */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
            <h2 className="lp-fade-up text-2xl sm:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
              How it works
            </h2>
            <p className="lp-fade-up-d1 text-center text-stone-500 mb-10 text-sm">
              Three simple steps to get started with the SEECS Database
            </p>

            {/* Desktop: flex row with connectors */}
            <div className="lp-fade-up-d2 hidden md:flex items-stretch gap-0">
              <div className="flex-1">
                <StepCard
                  step="1"
                  icon={<Database className="h-5 w-5" />}
                  title="Admin manages the master data"
                  desc="The database manager logs in to maintain sectors, cities, locations, degrees and the master list of companies."
                />
              </div>
              <StepConnector />
              <div className="flex-1">
                <StepCard
                  step="2"
                  icon={<Building2 className="h-5 w-5" />}
                  title="Companies register themselves"
                  desc="A company fills the registration form. The system issues a unique API key for that company only."
                />
              </div>
              <StepConnector />
              <div className="flex-1">
                <StepCard
                  step="3"
                  icon={<Users className="h-5 w-5" />}
                  title="Companies self-manage"
                  desc="Using their key, companies update their own profile, founders and annual financial data. The admin sees everything in real time."
                />
              </div>
            </div>

            {/* Mobile: stacked cards with vertical connector */}
            <div className="md:hidden flex flex-col gap-0 lp-fade-up-d2">
              <StepCard
                step="1"
                icon={<Database className="h-5 w-5" />}
                title="Admin manages the master data"
                desc="The database manager logs in to maintain sectors, cities, locations, degrees and the master list of companies."
              />
              <div className="flex justify-center py-1">
                <div className="h-6 border-l-2 border-dashed border-emerald-300" />
              </div>
              <StepCard
                step="2"
                icon={<Building2 className="h-5 w-5" />}
                title="Companies register themselves"
                desc="A company fills the registration form. The system issues a unique API key for that company only."
              />
              <div className="flex justify-center py-1">
                <div className="h-6 border-l-2 border-dashed border-emerald-300" />
              </div>
              <StepCard
                step="3"
                icon={<Users className="h-5 w-5" />}
                title="Companies self-manage"
                desc="Using their key, companies update their own profile, founders and annual financial data. The admin sees everything in real time."
              />
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="mt-auto bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border-t border-stone-700/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center gap-4 text-center sm:text-left sm:flex-row sm:justify-between">
            <div className="text-stone-400 text-xs sm:text-sm leading-relaxed">
              © {new Date().getFullYear()} SEECS · NUST Islamabad — Database
              Management System
            </div>
            <div className="flex items-center gap-2">
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-stone-700/50 hover:bg-emerald-600/80 text-stone-400 hover:text-white grid place-items-center transition-all duration-200 hover:scale-110"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-stone-700/50 hover:bg-emerald-600/80 text-stone-400 hover:text-white grid place-items-center transition-all duration-200 hover:scale-110"
                aria-label="Website"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-stone-700/50 hover:bg-emerald-600/80 text-stone-400 hover:text-white grid place-items-center transition-all duration-200 hover:scale-110"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
            <div className="text-stone-500 text-xs">
              PostgreSQL on Neon · Next.js · TypeScript
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
