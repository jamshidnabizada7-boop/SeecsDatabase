'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, formatCurrency, formatNumber, formatDate } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2, Users, DollarSign, Briefcase, Loader2, RefreshCw, Activity,
  Plus, Download, ExternalLink, Columns3, MapPin, TrendingUp, ArrowUpRight, User
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis, Line, LineChart, Area, AreaChart, LabelList } from 'recharts'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Operational: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Inactive: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Acquired: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Discontinued: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
}

const GENDER_COLORS: Record<string, string> = {
  Male: '#3B82F6',
  Female: '#EC4899',
  Other: '#9CA3AF',
}

// Emerald-to-teal palette for multi-color charts
const EMERALD_PALETTE = [
  '#047857', '#059669', '#10B981', '#34D399', '#6EE7B7',
  '#0F766E', '#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4',
  '#115E59', '#134E4A', '#1A3A3A', '#1E3A3A', '#20A48B',
]

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

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

  useEffect(() => { load() }, [])

  /* CSV export */
  const exportCsv = useCallback(() => {
    if (!stats) return
    const header = 'Name,Sector,City,Status,Registered Date\n'
    const rows = stats.recentCompanies
      .map((c) => `"${c.name}","${c.sector}","${c.city}","${c.status || 'Registered'}","${c.registeredAt}"`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seecs-companies-export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [stats])

  /* ---- loading / error states ---- */
  if (loading && !stats) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard…
      </div>
    )
  }
  if (error && !stats) {
    return <div className="p-6 text-destructive">{error}</div>
  }
  if (!stats) return null

  /* ---- derived data ---- */
  const cityChartData = [...stats.byCity].sort((a, b) => b.companies - a.companies)

  const sectorTop10 = [...stats.bySector]
    .sort((a, b) => b.companies - a.companies)
    .slice(0, 10)

  const genderData = stats.byGender.map((g) => ({
    ...g,
    fill: GENDER_COLORS[g.name] || g.color || '#9CA3AF',
  }))
  const genderTotal = genderData.reduce((s, g) => s + g.value, 0)

  /* ---- chart configs ---- */
  const cityChartConfig: ChartConfig = {
    companies: { label: 'Companies', color: '#10B981' },
  }

  const genderChartConfig: ChartConfig = {}
  genderData.forEach((g) => {
    genderChartConfig[g.name] = { label: g.name, color: g.fill }
  })

  const degreeChartConfig: ChartConfig = {
    value: { label: 'Founders', color: '#0D9488' },
  }

  const sectorChartConfig: ChartConfig = {
    companies: { label: 'Companies', color: '#059669' },
  }

  const revenueChartConfig: ChartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(160 84% 39%)' },
  }
  const trendChartConfig: ChartConfig = {
    value: { label: 'Avg Monthly Revenue', color: 'hsl(38 92% 50%)' },
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-stone-500">Real-time overview of the SEECS company registry.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* ---- KPI Cards ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedKpiCard
          title="Companies"
          target={stats.totalCompanies}
          icon={<Building2 className="h-5 w-5" />}
          hint={`${stats.totalSectors} sectors · ${stats.totalCities} cities`}
          trend={`${stats.totalCities} cities covered`}
          gradient="from-emerald-500 to-emerald-600"
        />
        <AnimatedKpiCard
          title="Revenue (all years)"
          target={stats.totalRevenueAllTime}
          icon={<DollarSign className="h-5 w-5" />}
          hint={`avg monthly ${formatCurrency(stats.avgMonthlyRevenue)}`}
          trend={stats.totalCompanies > 0 ? `${formatCurrency(Math.round(stats.totalRevenueAllTime / stats.totalCompanies))}/company` : ''}
          gradient="from-amber-500 to-amber-600"
          formatValue={(v) => formatCurrency(v)}
        />
        <AnimatedKpiCard
          title="Founders"
          target={stats.totalFounders}
          icon={<Users className="h-5 w-5" />}
          hint={`${stats.femaleFounders} female · ${stats.maleFounders} male`}
          trend={stats.totalCompanies > 0 ? `${(stats.totalFounders / stats.totalCompanies).toFixed(1)} avg per company` : ''}
          gradient="from-sky-500 to-sky-600"
        />
        <AnimatedKpiCard
          title="Projects Tracked"
          target={stats.totalProjects}
          icon={<Briefcase className="h-5 w-5" />}
          hint={`${stats.totalEmployees} employees · ${stats.totalAnnualRecords} records`}
          trend={`${stats.totalDegrees} degree fields`}
          gradient="from-violet-500 to-violet-600"
        />
      </div>

      {/* ---- Quick Actions ---- */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
        <Button
          variant="outline"
          onClick={exportCsv}
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View All Companies
        </Button>
        <Button
          variant="outline"
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
        >
          <Columns3 className="h-4 w-4 mr-2" />
          Customize Columns
        </Button>
      </div>

      {/* Charts Row 1: Companies by City, Gender Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---- Companies by City (horizontal bar) ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Companies by City
            </CardTitle>
            <CardDescription>Geographic distribution of registered companies.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={cityChartConfig} className="h-[300px] w-full">
              <BarChart
                data={cityChartData}
                layout="vertical"
                margin={{ left: 0, right: 48, top: 5, bottom: 5 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="companies" fill="var(--color-companies)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="companies" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#374151' }} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* ---- Gender Distribution (donut) ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              Gender Distribution
            </CardTitle>
            <CardDescription>Founders grouped by gender identity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <ChartContainer config={genderChartConfig} className="h-[220px] w-[220px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {genderData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="outside"
                      formatter={(v: number) => `${genderTotal ? Math.round((v / genderTotal) * 100) : 0}%`}
                      style={{ fontSize: 12, fontWeight: 600 }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              {/* Legend */}
              <div className="flex items-center gap-6 mt-3">
                {genderData.map((g) => (
                  <div key={g.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: g.fill }} />
                    <span className="text-sm text-stone-600">{g.name}</span>
                    <span className="text-sm font-semibold text-stone-800">
                      {g.value} ({genderTotal ? Math.round((g.value / genderTotal) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Degree Field & Sector Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---- Degree Field Distribution (vertical bar) ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Degree Field Distribution</CardTitle>
            <CardDescription>Academic backgrounds of registered founders.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={degreeChartConfig} className="h-[300px] w-full">
              <BarChart
                data={stats.byDegreeField}
                margin={{ left: 0, right: 8, top: 20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                  angle={-20}
                  height={60}
                  textAnchor="end"
                  tick={{ fontSize: 11 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.byDegreeField.map((_, i) => (
                    <Cell key={`deg-${i}`} fill={EMERALD_PALETTE[i % EMERALD_PALETTE.length]} />
                  ))}
                  <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 600, fill: '#374151' }} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* ---- Sector Distribution — Top 10 (horizontal bar) ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 Sectors</CardTitle>
            <CardDescription>Sectors ranked by number of registered companies.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={sectorChartConfig} className="h-[300px] w-full">
              <BarChart
                data={sectorTop10}
                layout="vertical"
                margin={{ left: 0, right: 48, top: 5, bottom: 5 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="companies" radius={[0, 4, 4, 0]}>
                  {sectorTop10.map((_, i) => (
                    <Cell
                      key={`sec-${i}`}
                      fill={EMERALD_PALETTE[i % EMERALD_PALETTE.length]}
                    />
                  ))}
                  <LabelList dataKey="companies" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#374151' }} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Financial Trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Annual revenue trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Annual Revenue Trend</CardTitle>
            <CardDescription>Total revenue recorded per year (PKR).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[260px] w-full">
              <AreaChart
                data={stats.byYear.map((y) => ({ year: String(y.year), revenue: y.revenue }))}
                margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v).replace('PKR ', '')}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={50}
                />
                <ChartTooltip content={<ChartTooltipContent formatter={(v: any) => formatCurrency(Number(v))} />} />
                <Area dataKey="revenue" stroke="var(--color-revenue)" fill="url(#fillRevenue)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Avg monthly revenue trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Monthly Revenue</CardTitle>
            <CardDescription>Per-month average across all annual records.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendChartConfig} className="h-[260px] w-full">
              <LineChart data={stats.monthlyTrend} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v).replace('PKR ', '')}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={50}
                />
                <ChartTooltip content={<ChartTooltipContent formatter={(v: any) => formatCurrency(Number(v))} />} />
                <Line dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================
          TOP COMPANIES BY REVENUE
          ================================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Companies by Revenue</CardTitle>
          <CardDescription>Cumulative revenue across all recorded years.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.topCompaniesByRevenue.map((c, i) => {
              const max = stats.topCompaniesByRevenue[0]?.revenue || 1
              const pct = Math.max(8, Math.round((c.revenue / max) * 100))
              return (
                <div
                  key={c.name}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm font-bold w-6 text-center text-stone-400">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-stone-800">{c.name}</div>
                    <div className="text-xs text-stone-500 mb-1.5">{c.sector}</div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-stone-700 whitespace-nowrap">{formatCurrency(c.revenue)}</span>
                </div>
              )
            })}
            {stats.topCompaniesByRevenue.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8 col-span-full">No revenue data yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          RECENT ACTIVITY
          ================================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest 8 registered companies and their current status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {stats.recentCompanies.slice(0, 8).map((c, i) => {
              const statusLabel = c.status || 'Registered'
              const statusClass = STATUS_STYLES[c.status || 'Active'] || STATUS_STYLES.Active
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 group hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Index circle */}
                    <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-950 grid place-items-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{i + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate text-stone-800 dark:text-stone-200">{c.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                        <span className="truncate">{c.sector}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {c.city}
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline text-stone-400">{formatDate(c.registeredAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${statusClass}`}>
                    {statusLabel}
                  </Badge>
                </div>
              )
            })}
            {stats.recentCompanies.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">No companies registered yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Animated KPI Card                                                  */
/* ------------------------------------------------------------------ */

function AnimatedKpiCard({
  title,
  target,
  icon,
  hint,
  trend,
  gradient,
  formatValue,
}: {
  title: string
  target: number
  icon: React.ReactNode
  hint: string
  trend?: string
  gradient: string
  formatValue?: (v: number) => string
}) {
  const count = useCountUp(target)
  const displayValue = formatValue ? formatValue(count) : formatNumber(count)

  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
      <CardContent className={`p-5 bg-gradient-to-br ${gradient} text-white relative`}>
        {/* Decorative circles */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-0 h-16 w-16 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-wider text-white/80">{title}</div>
              <div className="flex items-baseline gap-2 mt-1">
                <div className="text-2xl font-bold tracking-tight">{displayValue}</div>
                {trend && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-white/70 bg-white/15 rounded-full px-2 py-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    {trend}
                  </span>
                )}
              </div>
              <div className="text-xs text-white/70 mt-1.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {hint}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm grid place-items-center shrink-0 ml-3">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
