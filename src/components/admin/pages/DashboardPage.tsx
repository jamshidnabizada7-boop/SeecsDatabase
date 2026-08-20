'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, formatCurrency, formatNumber, formatDate } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, DollarSign, Briefcase, Loader2, RefreshCw, Activity } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis, Line, LineChart, Area, AreaChart } from 'recharts'

interface Stats {
  totalCompanies: number
  totalFounders: number
  maleFounders: number
  femaleFounders: number
  otherFounders: number
  totalSectors: number
  totalCities: number
  totalDegrees: number
  totalAnnualRecords: number
  totalRevenueAllTime: number
  avgMonthlyRevenue: number
  totalEmployees: number
  totalProjects: number
  bySector: { name: string; companies: number; revenue: number }[]
  byCity: { name: string; companies: number }[]
  byGender: { name: string; value: number; color: string }[]
  byDegreeField: { name: string; value: number }[]
  byYear: { year: number; revenue: number; employees: number; projects: number }[]
  topCompaniesByRevenue: { name: string; revenue: number; sector: string }[]
  recentCompanies: { id: string; name: string; sector: string; city: string; registeredAt: string; apiKey: string; status: string | null }[]
  monthlyTrend: { month: string; value: number }[]
}

function useCountUp(target: number, duration = 1200) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    let running = true

    function tick() {
      if (!running) return
      const elapsed = performance.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return display
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-amber-50 text-amber-700 border-amber-200',
  Discontinued: 'bg-rose-50 text-rose-700 border-rose-200',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await api<Stats>('/api/admin/stats')
      setStats(r)
    } catch (e: any) {
      setError(e.message || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading && !stats) {
    return <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard…</div>
  }
  if (error && !stats) {
    return <div className="p-6 text-destructive">{error}</div>
  }
  if (!stats) return null

  const sectorChartConfig: ChartConfig = { companies: { label: 'Companies', color: 'hsl(217 91% 45%)' } }
  const revenueChartConfig: ChartConfig = { revenue: { label: 'Revenue', color: 'hsl(160 84% 39%)' } }
  const genderChartConfig: ChartConfig = {}
  stats.byGender.forEach((g) => (genderChartConfig[g.name] = { label: g.name, color: g.color }))
  const trendChartConfig: ChartConfig = { value: { label: 'Avg Monthly Revenue', color: 'hsl(38 92% 50%)' } }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time overview of the SEECS company registry.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedKpiCard
          title="Companies"
          target={stats.totalCompanies}
          icon={<Building2 className="h-5 w-5" />}
          hint={`across ${stats.totalSectors} sectors`}
          gradient="from-emerald-500 to-emerald-600"
        />
        <AnimatedKpiCard
          title="Revenue (all years)"
          target={stats.totalRevenueAllTime}
          icon={<DollarSign className="h-5 w-5" />}
          hint={`avg monthly ${formatCurrency(stats.avgMonthlyRevenue)}`}
          gradient="from-amber-500 to-amber-600"
          formatValue={(v) => formatCurrency(v)}
        />
        <AnimatedKpiCard
          title="Founders"
          target={stats.totalFounders}
          icon={<Users className="h-5 w-5" />}
          hint={`${stats.femaleFounders} female · ${stats.maleFounders} male`}
          gradient="from-sky-500 to-sky-600"
        />
        <AnimatedKpiCard
          title="Projects Tracked"
          target={stats.totalProjects}
          icon={<Briefcase className="h-5 w-5" />}
          hint={`${stats.totalEmployees} employees · ${stats.totalAnnualRecords} records`}
          gradient="from-violet-500 to-violet-600"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Companies by sector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Companies by sector</CardTitle>
            <CardDescription>Distribution of registered companies across sectors.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={sectorChartConfig} className="h-[260px] w-full">
              <BarChart data={stats.bySector} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} interval={0} angle={-15} height={50} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="companies" fill="var(--color-companies)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gender distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Founders by gender</CardTitle>
            <CardDescription>Gender split across all registered founders.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ChartContainer config={genderChartConfig} className="h-[220px] w-[220px] shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie data={stats.byGender} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {stats.byGender.map((g) => (
                      <Cell key={g.name} fill={g.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="space-y-2 flex-1">
                {stats.byGender.map((g) => (
                  <div key={g.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: g.color }} />
                      <span className="text-sm">{g.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{g.value}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({stats.totalFounders ? Math.round((g.value / stats.totalFounders) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by year */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Annual revenue trend</CardTitle>
            <CardDescription>Total revenue recorded per year (PKR).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[260px] w-full">
              <AreaChart data={stats.byYear.map((y) => ({ year: String(y.year), revenue: y.revenue }))} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v).replace('PKR ', '')} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={50} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v: any) => formatCurrency(Number(v))} />} />
                <Area dataKey="revenue" stroke="var(--color-revenue)" fill="url(#fillRevenue)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Avg monthly revenue trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average monthly revenue</CardTitle>
            <CardDescription>Per-month average across all annual records.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendChartConfig} className="h-[260px] w-full">
              <LineChart data={stats.monthlyTrend} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v).replace('PKR ', '')} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={50} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v: any) => formatCurrency(Number(v))} />} />
                <Line dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top companies by revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top companies by revenue</CardTitle>
            <CardDescription>Cumulative revenue across all recorded years.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {stats.topCompaniesByRevenue.map((c, i) => {
                const max = stats.topCompaniesByRevenue[0]?.revenue || 1
                const pct = Math.max(8, Math.round((c.revenue / max) * 100))
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-5 text-muted-foreground">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{c.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">{formatCurrency(c.revenue)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{c.sector}</div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
              {stats.topCompaniesByRevenue.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">No revenue data yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By city + degree field */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By city & degree field</CardTitle>
            <CardDescription>Geographic distribution and academic backgrounds.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">By city</div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {stats.byCity.map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <span className="truncate">{c.name}</span>
                      <span className="font-medium ml-2">{c.companies}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">By degree field</div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {stats.byDegreeField.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <span className="truncate">{d.name}</span>
                      <span className="font-medium ml-2">{d.value}</span>
                    </div>
                  ))}
                  {stats.byDegreeField.length === 0 && (
                    <div className="text-xs text-muted-foreground">No founders yet.</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest 5 registered companies and their current status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentCompanies.slice(0, 5).map((c, i) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-muted grid place-items-center shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.sector} · {c.city}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(c.registeredAt)}</span>
                  {c.status ? (
                    <Badge variant="outline" className={`text-xs ${STATUS_STYLES[c.status] || ''}`}>
                      {c.status}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      Registered
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {stats.recentCompanies.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">No companies registered yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AnimatedKpiCard({
  title,
  target,
  icon,
  hint,
  gradient,
  formatValue,
}: {
  title: string
  target: number
  icon: React.ReactNode
  hint: string
  gradient: string
  formatValue?: (v: number) => string
}) {
  const count = useCountUp(target)
  const displayValue = formatValue ? formatValue(count) : formatNumber(count)

  return (
    <Card className={`overflow-hidden border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default`}>
      <CardContent className={`p-5 bg-gradient-to-br ${gradient} text-white relative`}>
        {/* Decorative circle */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wider text-white/80">{title}</div>
              <div className="text-2xl font-bold mt-1 tracking-tight">{displayValue}</div>
              <div className="text-xs text-white/70 mt-1.5">{hint}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm grid place-items-center shrink-0">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
