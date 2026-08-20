'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, ShieldCheck, KeyRound, Database, BarChart3, Bot, Users } from 'lucide-react'

export default function Landing({
  onEnterAdmin,
  onEnterCompany,
}: {
  onEnterAdmin: () => void
  onEnterCompany: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">
              S
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-sm sm:text-base">SEECS Database</div>
              <div className="text-xs text-muted-foreground">NUST Islamabad</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onEnterCompany}>
              Company Portal
            </Button>
            <Button size="sm" onClick={onEnterAdmin}>
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Hosted on Neon PostgreSQL · Migrated from MySQL + Java/JDBC
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
            The central registry for SEECS-affiliated companies
          </h1>
          <p className="mt-5 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Manage companies, founders, sectors and financial performance in one place.
            Built-in analytics, an AI assistant for the database manager, and a secure
            per-company self-service portal where each company can only touch its own data.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={onEnterAdmin} className="w-full sm:w-auto">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Database Manager Login
            </Button>
            <Button size="lg" variant="outline" onClick={onEnterCompany} className="w-full sm:w-auto">
              <KeyRound className="h-4 w-4 mr-2" />
              Company Portal / Register
            </Button>
          </div>
        </section>

        {/* Feature cards */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Live analytics"
            desc="Gender split, sector distribution, revenue trends and top companies — visualised in real time."
          />
          <FeatureCard
            icon={<Bot className="h-5 w-5" />}
            title="AI assistant"
            desc="Ask the database questions in plain English. Bring your own LLM (OpenAI / Anthropic / custom)."
          />
          <FeatureCard
            icon={<KeyRound className="h-5 w-5" />}
            title="Per-company keys"
            desc="Each company gets a unique API key. They can update only their own profile, founders and revenue."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Strict isolation"
            desc="A company can never read, modify or delete another company's data — enforced at the API layer."
          />
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <h2 className="text-2xl font-semibold text-center mb-8">How it works</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StepCard
              step="1"
              icon={<Database className="h-5 w-5" />}
              title="Admin manages the master data"
              desc="The database manager logs in to maintain sectors, cities, locations, degrees and the master list of companies."
            />
            <StepCard
              step="2"
              icon={<Building2 className="h-5 w-5" />}
              title="Companies register themselves"
              desc="A company fills the registration form. The system issues a unique API key for that company only."
            />
            <StepCard
              step="3"
              icon={<Users className="h-5 w-5" />}
              title="Companies self-manage"
              desc="Using their key, companies update their own profile, founders and annual financial data. The admin sees everything in real time."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} SEECS · NUST Islamabad — Database Management System</div>
          <div className="flex items-center gap-4">
            <span>PostgreSQL on Neon · Next.js 16 · TypeScript</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2">
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{desc}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function StepCard({ step, icon, title, desc }: { step: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-4 right-4 text-5xl font-bold text-muted/10 select-none">{step}</div>
      <CardHeader>
        <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center mb-2">
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{desc}</CardDescription>
      </CardHeader>
    </Card>
  )
}
