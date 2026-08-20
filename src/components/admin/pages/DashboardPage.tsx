'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, formatCurrency, formatNumber, formatDate } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2, Users, DollarSign, Briefcase, Loader2, RefreshCw, Activity,
  Plus, Download, ExternalLink, Columns3, MapPin, TrendingUp, ArrowUpRight, User, ChevronRight,
  GraduationCap, Award, Sparkles, CheckCircle2
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis, Line, LineChart, LabelList } from 'recharts'
import { AdminTab } from '../AdminShell'

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
  byStatus?: { name: string; value: number; color: string }[]
  byDepartment?: { name: string; value: number }[]
  byDegreeField: { name: string; value: number }[]
  byYear: { year: number; revenue: number; employees: number; projects: number }[]
  topCompaniesByRevenue: { name: string; revenue: number; sector: string }[]
  recentCompanies: { id: string; name: string; sector: string; city: string; registeredAt: string; apiKey: string; status: string | null }[]
  notableHighlights?: { title: string; subtitle: string; tag: string }[]
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

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Operational: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Inactive: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Acquired: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Discontinued: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
}

const GENDER_COLORS: Record<string, string> = {
  Male: '#3B82F6',
  Female: '#EC4899',
  Other: '#9CA3AF',
}

const DEPT_COLORS = ['#059669', '#2563EB', '#7C3AED', '#D97706', '#0891B2', '#DB2777']
const EMERALD_PALETTE = ['#047857', '#059669', '#10B981', '#34D399', '#6EE7B7', '#0F766E', '#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4']

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

  if (loading && !stats) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm">Loading database analytics...</p>
      </div>
    )
  }
  if (error && !stats) {
    return <div className="p-6 text-destructive">{error}</div>
  }
  if (!stats) return null

  const cityChartData = (stats.byCity || []).slice(0, 7).map((c) => ({
    city: c.name,
    companies: c.companies,
  }))

  const cityChartConfig: ChartConfig = {
    companies: { label: 'Companies', color: '#10B981' },
  }

  const genderChartData = (stats.byGender || []).map((g) => ({
    name: g.name,
    value: g.value,
    fill: GENDER_COLORS[g.name] || '#6B7280',
  }))

  const genderChartConfig: ChartConfig = {
    Male: { label: 'Male', color: '#3B82F6' },
    Female: { label: 'Female', color: '#EC4899' },
    Other: { label: 'Other', color: '#9CA3AF' },
  }

  const statusChartData = (stats.byStatus || []).map((s) => ({
    name: s.name,
    value: s.value,
    fill: s.color,
  }))

  const deptChartData = (stats.byDepartment || []).slice(0, 5).map((d, idx) => ({
    department: d.name,
    founders: d.value,
    fill: DEPT_COLORS[idx % DEPT_COLORS.length],
  }))

  const sectorChartData = (stats.bySector || []).slice(0, 8).map((s, idx) => ({
    sector: s.name.length > 22 ? s.name.slice(0, 20) + '…' : s.name,
    fullSector: s.name,
    companies: s.companies,
    fill: EMERALD_PALETTE[idx % EMERALD_PALETTE.length],
  }))

  const sectorChartConfig: ChartConfig = {
    companies: { label: 'Companies', color: '#059669' },
  }

  const revenueChartData = (stats.topCompaniesByRevenue || []).map((c) => ({
    company: c.name.length > 18 ? c.name.slice(0, 16) + '…' : c.name,
    fullCompany: c.name,
    revenue: c.revenue,
    sector: c.sector,
  }))

  const revenueChartConfig: ChartConfig = {
    revenue: { label: 'Revenue (PKR)', color: '#F59E0B' },
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-stone-500">Real-time intelligence and growth metrics for the SEECS startup ecosystem.</p>
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
            title="Total Startups"
            target={stats.totalCompanies}
            icon={<Building2 className="h-5 w-5" />}
            hint={`${stats.byCity?.length || 0} active hubs · ${stats.totalSectors} sectors`}
            trend="Active Registry"
            gradient="from-emerald-500 to-teal-600"
          />
        </div>
        <div onClick={() => onNavigate?.('founders')} className="cursor-pointer">
          <AnimatedKpiCard
            title="Alumni & Founders"
            target={stats.totalFounders}
            icon={<Users className="h-5 w-5" />}
            hint={`${stats.femaleFounders} female · ${stats.maleFounders} male`}
            trend={stats.totalCompanies > 0 ? `${(stats.totalFounders / stats.totalCompanies).toFixed(1)} / company` : ''}
            gradient="from-blue-500 to-indigo-600"
          />
        </div>
        <div onClick={() => onNavigate?.('companies')} className="cursor-pointer">
          <AnimatedKpiCard
            title="Sectors & Fields"
            target={stats.totalSectors}
            icon={<Briefcase className="h-5 w-5" />}
            hint={`${stats.totalDegrees} degree categories`}
            trend="Tech Diversity"
            gradient="from-purple-500 to-violet-600"
          />
        </div>
        <div onClick={() => onNavigate?.('companies')} className="cursor-pointer">
          <AnimatedKpiCard
            title="Cities & Global Hubs"
            target={stats.totalCities}
            icon={<MapPin className="h-5 w-5" />}
            hint="Pakistan & Global Diaspora"
            trend="150+ locations"
            gradient="from-amber-500 to-orange-600"
          />
        </div>
      </div>

      {/* ---- Quick Actions ---- */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => onNavigate?.('companies', { openCreate: true })}
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
        <Button
          variant="outline"
          onClick={exportCsv}
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate?.('companies')}
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950 font-medium shadow-sm"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View All Companies ({stats.totalCompanies})
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate?.('founders')}
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
        >
          <Users className="h-4 w-4 mr-2" />
          Founders Directory ({stats.totalFounders})
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate?.('settings', { settingsTab: 'custom-columns' })}
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
        >
          <Columns3 className="h-4 w-4 mr-2" />
          Database Settings
        </Button>
      </div>

      {/* Notable Alumni Success Spotlight */}
      <Card className="border-emerald-200/70 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50/50 via-background to-teal-50/30 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Award className="h-5 w-5 text-emerald-600" />
              Alumni Success & Startup Highlights
            </CardTitle>
            <Badge variant="outline" className="bg-emerald-100/60 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 text-xs">
              <Sparkles className="h-3 w-3 mr-1" /> SEECS Impact
            </Badge>
          </div>
          <CardDescription>Major milestones and global achievements by SEECS graduates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(stats.notableHighlights || []).map((h, i) => (
              <div key={i} className="p-3 rounded-lg border bg-background/80 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{h.title}</span>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border">
                    {h.tag}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{h.subtitle}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Row 1: Companies by City (Fixed) & Academic Departments */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---- Companies by City (Clean Top Hubs) ---- */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Top Startup Hubs & Cities
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{stats.byCity?.length || 0} active cities</Badge>
            </div>
            <CardDescription>Geographic concentration of registered SEECS ventures.</CardDescription>
          </CardHeader>
          <CardContent>
            {cityChartData.length === 0 ? (
              <div className="h-[260px] grid place-items-center text-sm text-muted-foreground">No city data available</div>
            ) : (
              <ChartContainer config={cityChartConfig} className="h-[260px] w-full">
                <BarChart data={cityChartData} layout="vertical" margin={{ left: 0, right: 36, top: 5, bottom: 5 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="city" tickLine={false} axisLine={false} width={110} tick={{ fontSize: 12 }} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Bar dataKey="companies" fill="#10B981" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="companies" position="right" offset={8} className="fill-foreground text-xs font-semibold" />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* ---- Department / Discipline Breakdown ---- */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                Founders by Academic Department
              </CardTitle>
              <Badge variant="secondary" className="text-xs">SEECS Faculties</Badge>
            </div>
            <CardDescription>Distribution of startup founders by their degree field.</CardDescription>
          </CardHeader>
          <CardContent>
            {deptChartData.length === 0 ? (
              <div className="h-[260px] grid place-items-center text-sm text-muted-foreground">No department data available</div>
            ) : (
              <div className="space-y-4 pt-2">
                {deptChartData.map((d, i) => {
                  const maxFounders = Math.max(...deptChartData.map((x) => x.founders)) || 1
                  const pct = Math.round((d.founders / stats.totalFounders) * 100)
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground">{d.department}</span>
                        <span className="text-muted-foreground">{d.founders} founders ({pct}%)</span>
                      </div>
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(8, (d.founders / maxFounders) * 100)}%`,
                            backgroundColor: d.fill,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top Sectors & Status / Gender Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---- Top Industry Sectors ---- */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Top Industry Sectors
              </CardTitle>
              <Badge variant="secondary" className="text-xs">Top Active</Badge>
            </div>
            <CardDescription>Most popular industry verticals for SEECS founders.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={sectorChartConfig} className="h-[280px] w-full">
              <BarChart data={sectorChartData} layout="vertical" margin={{ left: 0, right: 36, top: 5, bottom: 5 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="sector" tickLine={false} axisLine={false} width={130} tick={{ fontSize: 11 }} />
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
                  <LabelList dataKey="companies" position="right" offset={8} className="fill-foreground text-xs font-semibold" />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* ---- Gender & Status Distribution ---- */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Gender */}
          <Card className="flex flex-col">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <User className="h-4 w-4 text-blue-600" /> Gender Ratio
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center pt-0">
              <div className="h-[160px] w-full">
                <PieChart width={160} height={160} className="mx-auto">
                  <Pie
                    data={genderChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {genderChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
              <div className="flex flex-col gap-1 w-full text-xs mt-1">
                {stats.byGender.map((g) => (
                  <div key={g.name} className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GENDER_COLORS[g.name] || '#9CA3AF' }} />
                      {g.name}
                    </span>
                    <span className="font-semibold">{g.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="flex flex-col">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Status & Lifecycle
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center pt-0">
              <div className="h-[160px] w-full">
                <PieChart width={160} height={160} className="mx-auto">
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
              <div className="flex flex-col gap-1 w-full text-xs mt-1">
                {(stats.byStatus || []).map((s) => (
                  <div key={s.name} className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              Recent Startup Registrations
            </CardTitle>
            <CardDescription>Latest registered companies and verified alumni ventures.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate?.('companies')} className="text-xs text-emerald-600 hover:text-emerald-700">
            View all ({stats.totalCompanies}) <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {stats.recentCompanies.slice(0, 8).map((c, i) => {
              const statusLabel = c.status || 'Operational'
              const statusClass = STATUS_STYLES[c.status || 'Operational'] || STATUS_STYLES.Operational
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
