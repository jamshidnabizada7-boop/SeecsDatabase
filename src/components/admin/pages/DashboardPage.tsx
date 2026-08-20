'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, formatCurrency, formatNumber, formatDate } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2, Users, DollarSign, Briefcase, Loader2, RefreshCw, Activity,
  Plus, Download, ExternalLink, Columns3, MapPin, TrendingUp, ArrowUpRight, User, ChevronRight
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis, Line, LineChart, Area, AreaChart, LabelList } from 'recharts'
import { AdminTab } from '../AdminShell'

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
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(easeOut * target))
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

const EMERALD_PALETTE = [
  '#047857', '#059669', '#10B981', '#34D399', '#6EE7B7',
  '#0F766E', '#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4',
  '#115E59', '#134E4A', '#1A3A3A', '#1E3A3A', '#20A48B',
]

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DashboardPage({
  onNavigate,
}: {
  onNavigate?: (tab: AdminTab, options?: { openCreate?: boolean; search?: string; settingsTab?: string }) => void
}) {
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

  /* ---- chart data preparation ---- */
  const cityChartData = stats.byCity.map((c) => ({
    city: c.name,
    companies: c.companies,
  }))

  const cityChartConfig: ChartConfig = {
    companies: { label: 'Companies', color: '#10B981' },
  }

  const genderChartData = stats.byGender.map((g) => ({
    name: g.name,
    value: g.value,
    fill: GENDER_COLORS[g.name] || '#6B7280',
  }))

  const genderChartConfig: ChartConfig = {
    Male: { label: 'Male', color: '#3B82F6' },
    Female: { label: 'Female', color: '#EC4899' },
    Other: { label: 'Other', color: '#9CA3AF' },
  }

  const sectorChartData = stats.bySector.slice(0, 10).map((s, idx) => ({
    sector: s.name.length > 22 ? s.name.slice(0, 20) + '…' : s.name,
    fullSector: s.name,
    companies: s.companies,
    fill: EMERALD_PALETTE[idx % EMERALD_PALETTE.length],
  }))

  const sectorChartConfig: ChartConfig = {
    companies: { label: 'Companies', color: '#059669' },
  }

  const revenueChartData = stats.topCompaniesByRevenue.map((c) => ({
    company: c.name.length > 18 ? c.name.slice(0, 16) + '…' : c.name,
    fullCompany: c.name,
    revenue: c.revenue,
    sector: c.sector,
  }))

  const revenueChartConfig: ChartConfig = {
    revenue: { label: 'Revenue (PKR)', color: '#F59E0B' },
  }

  const yearChartData = stats.byYear.map((y) => ({
    year: String(y.year),
    revenue: y.revenue,
    employees: y.employees,
    projects: y.projects,
  }))

  const yearChartConfig: ChartConfig = {
    revenue: { label: 'Revenue', color: '#10B981' },
    employees: { label: 'Employees', color: '#3B82F6' },
    projects: { label: 'Projects', color: '#8B5CF6' },
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
        <div onClick={() => onNavigate?.('companies')} className="cursor-pointer">
          <AnimatedKpiCard
            title="Companies"
            target={stats.totalCompanies}
            icon={<Building2 className="h-5 w-5" />}
            hint={`${stats.totalSectors} sectors · ${stats.totalCities} cities`}
            trend={`${stats.totalCities} cities covered`}
            gradient="from-emerald-500 to-emerald-600"
          />
        </div>
        <div onClick={() => onNavigate?.('companies')} className="cursor-pointer">
          <AnimatedKpiCard
            title="Revenue (all years)"
            target={stats.totalRevenueAllTime}
            icon={<DollarSign className="h-5 w-5" />}
            hint={`avg monthly ${formatCurrency(stats.avgMonthlyRevenue)}`}
            trend={stats.totalCompanies > 0 ? `${formatCurrency(Math.round(stats.totalRevenueAllTime / stats.totalCompanies))}/company` : ''}
            gradient="from-amber-500 to-amber-600"
            formatValue={(v) => formatCurrency(v)}
          />
        </div>
        <div onClick={() => onNavigate?.('founders')} className="cursor-pointer">
          <AnimatedKpiCard
            title="Founders"
            target={stats.totalFounders}
            icon={<Users className="h-5 w-5" />}
            hint={`${stats.femaleFounders} female · ${stats.maleFounders} male`}
            trend={stats.totalCompanies > 0 ? `${(stats.totalFounders / stats.totalCompanies).toFixed(1)} avg per company` : ''}
            gradient="from-sky-500 to-sky-600"
          />
        </div>
        <div onClick={() => onNavigate?.('companies')} className="cursor-pointer">
          <AnimatedKpiCard
            title="Projects Tracked"
            target={stats.totalProjects}
            icon={<Briefcase className="h-5 w-5" />}
            hint={`${stats.totalEmployees} employees · ${stats.totalAnnualRecords} records`}
            trend={`${stats.totalDegrees} degree fields`}
            gradient="from-violet-500 to-violet-600"
          />
        </div>
      </div>

      {/* ---- Quick Actions ---- */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => onNavigate?.('companies', { openCreate: true })}
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
          onClick={() => onNavigate?.('companies')}
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 font-medium shadow-sm"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View All Companies
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate?.('settings', { settingsTab: 'custom-columns' })}
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
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="city"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="companies" fill="#10B981" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="companies" position="right" offset={8} className="fill-foreground text-xs" />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* ---- Gender Distribution (donut chart) ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              Gender Distribution
            </CardTitle>
            <CardDescription>Founders grouped by gender identity.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <ChartContainer config={genderChartConfig} className="h-[250px] w-full">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={genderChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${(Number(percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {genderChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            {/* Custom Legend with percentages */}
            <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
              {stats.byGender.map((g) => {
                const pct = stats.totalFounders > 0 ? Math.round((g.value / stats.totalFounders) * 100) : 0
                return (
                  <div key={g.name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GENDER_COLORS[g.name] || '#6B7280' }} />
                    <span className="text-muted-foreground">{g.name}:</span>
                    <span className="font-semibold">{g.value}</span>
                    <span className="text-stone-400">({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Sector Distribution, Top Companies by Revenue */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---- Sector Distribution (horizontal bar) ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Top Sectors
            </CardTitle>
            <CardDescription>Top 10 sectors by number of registered companies.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={sectorChartConfig} className="h-[320px] w-full">
              <BarChart
                data={sectorChartData}
                layout="vertical"
                margin={{ left: 0, right: 48, top: 5, bottom: 5 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="sector"
                  tickLine={false}
                  axisLine={false}
                  width={130}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                        <div className="font-semibold">{data.fullSector}</div>
                        <div className="text-muted-foreground mt-1">Companies: <span className="font-medium text-foreground">{data.companies}</span></div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="companies" radius={[0, 4, 4, 0]}>
                  {sectorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="companies" position="right" offset={8} className="fill-foreground text-xs" />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* ---- Top Companies by Revenue ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              Top Companies by Revenue
            </CardTitle>
            <CardDescription>Leading enterprises ranked by total declared revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueChartData.length === 0 ? (
              <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
                No revenue data recorded yet.
              </div>
            ) : (
              <ChartContainer config={revenueChartConfig} className="h-[320px] w-full">
                <BarChart
                  data={revenueChartData}
                  layout="vertical"
                  margin={{ left: 0, right: 60, top: 5, bottom: 5 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="company"
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                          <div className="font-semibold">{data.fullCompany}</div>
                          <div className="text-stone-500">{data.sector}</div>
                          <div className="text-emerald-600 font-semibold mt-1">
                            {formatCurrency(data.revenue)}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="revenue" fill="#F59E0B" radius={[0, 4, 4, 0]}>
                    <LabelList
                      dataKey="revenue"
                      position="right"
                      offset={8}
                      formatter={(v: any) => formatCurrency(Number(v))}
                      className="fill-foreground text-xs"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Year-over-Year Growth (Multi-metric line chart) ---- */}
      {yearChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              Annual Growth Trends
            </CardTitle>
            <CardDescription>Year-over-year revenue, employee count, and project volume.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={yearChartConfig} className="h-[280px] w-full">
              <LineChart data={yearChartData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10B981' }}
                  name="Revenue"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="employees"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3B82F6' }}
                  name="Employees"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="projects"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#8B5CF6' }}
                  name="Projects"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          RECENT ACTIVITY
          ================================================================ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest registered companies and their current status.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate?.('companies')} className="text-xs text-emerald-600 hover:text-emerald-700">
            View all companies <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {stats.recentCompanies.slice(0, 8).map((c, i) => {
              const statusLabel = c.status || 'Registered'
              const statusClass = STATUS_STYLES[c.status || 'Active'] || STATUS_STYLES.Active
              return (
                <div
                  key={c.id}
                  onClick={() => onNavigate?.('companies', { search: c.name })}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 group hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-950 grid place-items-center shrink-0 border border-emerald-200 dark:border-emerald-800 group-hover:scale-105 transition-transform">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{i + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate text-stone-800 dark:text-stone-200 group-hover:text-emerald-600 transition-colors">
                        {c.name}
                      </div>
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs shrink-0 ${statusClass}`}>
                      {statusLabel}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
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
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <CardContent className={`p-5 bg-gradient-to-br ${gradient} text-white relative`}>
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
