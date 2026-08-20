'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, formatCurrency, formatDate } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { Building2, LogOut, Loader2, RefreshCw, Pencil, Trash2, Plus, Users, DollarSign, ShieldCheck, Copy, Check, KeyRound, Columns3, Calendar, MapPin, Info, UserRound, BarChart3, TrendingUp, TrendingDown, FileText, Mail, Phone, GraduationCap, CircleAlert, Eye, EyeOff, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

interface CustomColumn {
  id: string
  name: string
  slug: string
  columnType: string
  targetTable: string
  description: string | null
  required: boolean
  sortOrder: number
}

interface CustomValue {
  id: string
  customColumnId: string
  value: string
  customColumn: CustomColumn
}

interface CompanyFull {
  id: string
  name: string
  description: string | null
  email: string | null
  phone: string | null
  website: string | null
  sectorId: string
  cityId: string
  locationId: string | null
  apiKey: string
  apiKeyActive: boolean
  registeredAt: string
  status: string | null
  statusReason: string | null
  sinceDate: string | null
  foundedYear: number | null
  discontinuedDate: string | null
  branchesCount: number | null
  revenue: number | null
  revenueMin: number | null
  revenueMax: number | null
  sector: { id: string; name: string }
  city: { id: string; name: string }
  location: { id: string; address: string; country: string; city: { name: string } } | null
  founders: { id: string; role: string; founder: { id: string; firstName: string; lastName: string; gender: string; email: string | null; phone: string | null; degree: { id: string; name: string } | null } }[]
  annualData: { id: string; year: number; monthlyRevenue: number; totalRevenue: number; employeeCount: number; projectCount: number; notes: string | null }[]
  customValues: CustomValue[]
  updatedAt?: string
}

interface Lookup {
  sectors: { id: string; name: string }[]
  cities: { id: string; name: string }[]
  locations: { id: string; address: string; city: { name: string } }[]
  degrees: { id: string; name: string }[]
  founders: { id: string; firstName: string; lastName: string; gender: string }[]
}

type Tab = 'profile' | 'founders' | 'annual' | 'custom'

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Inactive: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Discontinued: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
}

const GENDER_BORDER: Record<string, string> = {
  Male: 'border-l-emerald-500',
  Female: 'border-l-pink-500',
  Other: 'border-l-violet-500',
}

export default function CompanyPortal({ company, onLogout }: { company: any; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('profile')
  const [data, setData] = useState<CompanyFull | null>(null)
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api<{ company: CompanyFull; customColumns: CustomColumn[] }>('/api/company/self')
      setData(r.company)
      setCustomColumns(r.customColumns || [])
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const copyKey = async () => {
    if (!data?.apiKey) return
    await navigator.clipboard?.writeText(data.apiKey)
    setCopied(true)
    toast({ title: 'Copied', description: 'API key copied to clipboard' })
    setTimeout(() => setCopied(false), 2000)
  }

  const statusBadge = data?.status ? (
    <Badge variant="outline" className={`text-xs font-medium ${STATUS_STYLES[data.status] || ''}`}>
      {data.status === 'Active' && <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />}
      {data.status === 'Inactive' && <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5" />}
      {data.status === 'Discontinued' && <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 mr-1.5" />}
      {data.status}
    </Badge>
  ) : null

  const partialKey = data?.apiKey ? `${data.apiKey.slice(0, 8)}${'•'.repeat(12)}` : ''
  const lastUpdated = data?.registeredAt ? formatDate(data.registeredAt) : ''

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Professional Gradient Header Bar */}
      <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-800 dark:via-teal-800 dark:to-emerald-900 sticky top-0 z-10 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-sm text-white grid place-items-center font-bold text-sm shadow-md ring-1 ring-white/20 flex-shrink-0">
                {(data?.name || company.name).charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-white truncate max-w-[180px] sm:max-w-xs">{data?.name || company.name}</span>
                  {statusBadge && <span className="opacity-90">{statusBadge}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {data?.sector && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-100 bg-emerald-700/50 dark:bg-emerald-600/30 rounded-full px-2 py-0.5">
                      {data.sector.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-emerald-100/80">
                    <KeyRound className="h-3 w-3" />
                    <code className="text-[11px] font-mono">{partialKey}</code>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={copyKey} className="hover:text-white transition-colors">
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Copy API key</TooltipContent>
                    </Tooltip>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-emerald-100 hover:text-white hover:bg-white/15" onClick={load} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Refresh data</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-emerald-100 hover:text-white hover:bg-white/15">
                    <ThemeToggle />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Toggle theme</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-emerald-100 hover:text-white hover:bg-white/15" onClick={onLogout}>
                    <LogOut className="h-4 w-4 mr-1.5" /> <span className="hidden sm:inline">Sign out</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Sign out of portal</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </header>

      {/* Isolation banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950 border-b border-emerald-200 dark:border-emerald-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Signed in as <strong>{company.name}</strong> · Data isolation active
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-3 w-3" />
              Registered {lastUpdated}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-background sticky top-[120px] sm:top-[88px] z-[5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          <TabBtn active={tab === 'profile'} onClick={() => setTab('profile')} icon={<Building2 className="h-4 w-4" />}>Profile</TabBtn>
          <TabBtn active={tab === 'founders'} onClick={() => setTab('founders')} icon={<Users className="h-4 w-4" />}>Founders {data && <span className="ml-1 text-xs text-muted-foreground tabular-nums">({data.founders.length})</span>}</TabBtn>
          <TabBtn active={tab === 'annual'} onClick={() => setTab('annual')} icon={<DollarSign className="h-4 w-4" />}>Annual Data {data && <span className="ml-1 text-xs text-muted-foreground tabular-nums">({data.annualData.length})</span>}</TabBtn>
          {customColumns.length > 0 && (
            <TabBtn active={tab === 'custom'} onClick={() => setTab('custom')} icon={<Columns3 className="h-4 w-4" />}>Custom Fields</TabBtn>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {loading && !data ? (
          <PortalSkeleton />
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 grid place-items-center mb-4 text-destructive">
              <CircleAlert className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold mb-1">Failed to load company data</h3>
            <p className="text-sm text-muted-foreground mb-4">There was an error loading your company information.</p>
            <Button variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> Try again
            </Button>
          </div>
        ) : (
          <div className="transition-all duration-200 ease-in-out">
            {tab === 'profile' && <ProfileTab company={data} customColumns={customColumns} onChanged={load} revealed={revealed} setRevealed={setRevealed} />}
            {tab === 'founders' && <FoundersTab company={data} onChanged={load} />}
            {tab === 'annual' && <AnnualTab company={data} onChanged={load} />}
            {tab === 'custom' && <CustomFieldsTab company={data} customColumns={customColumns} onChanged={load} />}
          </div>
        )}
      </main>

      <footer className="border-t bg-background mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-muted-foreground">
          SEECS Company Registry · NUST Islamabad
        </div>
      </footer>
    </div>
  )
}

// =================================================================
// SKELETON LOADER
// =================================================================
function PortalSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[88px] rounded-xl border bg-background" />
        ))}
      </div>
      <div className="h-64 rounded-xl border bg-background" />
    </div>
  )
}

// =================================================================
// TAB BUTTON
// =================================================================
function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
        active
          ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

// =================================================================
// QUICK STATS CARD
// =================================================================
function QuickStats({ company }: { company: CompanyFull }) {
  const latestAnnual = company.annualData.length > 0
    ? company.annualData.reduce((a, b) => (a.year > b.year ? a : b))
    : null

  const stats = [
    {
      label: 'Total Founders',
      value: company.founders.length,
      icon: <UserRound className="h-4 w-4" />,
      color: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      label: 'Annual Records',
      value: company.annualData.length,
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'from-teal-500 to-teal-600',
      textColor: 'text-teal-700 dark:text-teal-400',
      bgLight: 'bg-teal-50 dark:bg-teal-950/50',
    },
    {
      label: 'Latest Revenue',
      value: latestAnnual ? formatCurrency(latestAnnual.totalRevenue) : '—',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-700 dark:text-amber-400',
      bgLight: 'bg-amber-50 dark:bg-amber-950/50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s) => (
        <div key={s.label} className={`relative overflow-hidden rounded-xl border bg-background p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${s.color} text-white grid place-items-center shadow-sm`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
              <div className={`text-lg font-bold ${s.textColor} truncate tabular-nums`}>{s.value}</div>
            </div>
          </div>
          <div className={`absolute -right-3 -bottom-3 h-16 w-16 rounded-full ${s.bgLight} opacity-50`} />
        </div>
      ))}
    </div>
  )
}

// =================================================================
// EMPTY STATE
// =================================================================
function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 grid place-items-center mb-4 text-emerald-500 dark:text-emerald-400">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">{description}</p>
    </div>
  )
}

// =================================================================
// PROFILE TAB
// =================================================================
function ProfileTab({ company, customColumns, onChanged, revealed, setRevealed }: { company: CompanyFull; customColumns: CustomColumn[]; onChanged: () => void; revealed: boolean; setRevealed: (b: boolean) => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(company.name)
  const [description, setDescription] = useState(company.description || '')
  const [email, setEmail] = useState(company.email || '')
  const [phone, setPhone] = useState(company.phone || '')
  const [website, setWebsite] = useState(company.website || '')
  const [locationId, setLocationId] = useState(company.locationId || '')
  const [customValues, setCustomValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    company.customValues?.forEach((cv) => { map[cv.customColumnId] = cv.value })
    return map
  })
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingCustom, setSavingCustom] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const copyKey = () => {
    navigator.clipboard?.writeText(company.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'API key copied to clipboard' })
  }

  useEffect(() => {
    api<Lookup>('/api/company/lookup').then(setLookup).catch(() => {})
  }, [])

  // Sync form state when company data changes (after save)
  useEffect(() => {
    setName(company.name)
    setDescription(company.description || '')
    setEmail(company.email || '')
    setPhone(company.phone || '')
    setWebsite(company.website || '')
    setLocationId(company.locationId || '')
    const map: Record<string, string> = {}
    company.customValues?.forEach((cv) => { map[cv.customColumnId] = cv.value })
    setCustomValues(map)
  }, [company])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/company/self', { method: 'PUT', body: { name, description, email, phone, website, locationId: locationId || null } })
      toast({ title: 'Saved', description: 'Your profile has been updated' })
      setEditing(false)
      onChanged()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const saveCustomValues = async () => {
    setSavingCustom(true)
    try {
      await api('/api/company/self', { method: 'PUT', body: { customValues } })
      toast({ title: 'Saved', description: 'Custom fields updated' })
      onChanged()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSavingCustom(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Quick Stats */}
      <QuickStats company={company} />

      {/* Description Card (view mode) */}
      {!editing && company.description && (
        <Card className="border-emerald-100 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 grid place-items-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold mb-1">About {company.name}</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{company.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-2">
          <div>
            <CardTitle className="text-base">Company profile</CardTitle>
            <CardDescription>Update your company&apos;s public information. Sector and city are managed by the SEECS admin.</CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editing ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditing(!editing)}
                className={editing ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950'}
              >
                {editing ? (
                  <><Check className="h-4 w-4 mr-1.5" /> Done</>
                ) : (
                  <><Pencil className="h-4 w-4 mr-1.5" /> Edit Profile</>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{editing ? 'Save changes first' : 'Edit company profile'}</TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={save} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Company name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Tell us about your company..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="company@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 0000000" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Office location</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                  >
                    <option value="">— None —</option>
                    {lookup?.locations.map((l) => <option key={l.id} value={l.id}>{l.address} · {l.city.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setEditing(false); setName(company.name); setDescription(company.description || ''); setEmail(company.email || ''); setPhone(company.phone || ''); setWebsite(company.website || ''); setLocationId(company.locationId || '') }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* 2-column read-only info grid */}
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                <InfoField label="Company name" value={company.name} />
                {company.website && (
                  <InfoField label="Website">
                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline truncate block">
                      {company.website}
                    </a>
                  </InfoField>
                )}
                {company.email && (
                  <InfoField label="Email">
                    <a href={`mailto:${company.email}`} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline truncate block">
                      {company.email}
                    </a>
                  </InfoField>
                )}
                {company.phone && <InfoField label="Phone" value={company.phone} />}
                <InfoField label="Sector" value={company.sector.name} />
                <InfoField label="City" value={company.city.name} />
                {company.location && <InfoField label="Location" value={`${company.location.address}, ${company.location.city.name}`} />}
              </div>

              {/* Additional metadata fields */}
              {(company.status || company.foundedYear || company.sinceDate || company.branchesCount || company.revenue != null || company.revenueMin != null) && (
                <>
                  <Separator />
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                    {company.status && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <div className="mt-1">
                          <Badge variant="outline" className={`text-xs ${STATUS_STYLES[company.status] || ''}`}>{company.status}</Badge>
                        </div>
                      </div>
                    )}
                    {company.foundedYear && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Founded year</Label>
                        <div className="text-sm font-medium mt-1">{company.foundedYear}</div>
                      </div>
                    )}
                    {company.sinceDate && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Since date</Label>
                        <div className="text-sm font-medium mt-1">{company.sinceDate}</div>
                      </div>
                    )}
                    {company.branchesCount != null && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Branches</Label>
                        <div className="text-sm font-medium mt-1">{company.branchesCount}</div>
                      </div>
                    )}
                    {company.revenue != null ? (
                      <div>
                        <Label className="text-xs text-muted-foreground">Revenue</Label>
                        <div className="text-sm font-medium mt-1">{formatCurrency(company.revenue)}</div>
                      </div>
                    ) : (company.revenueMin != null || company.revenueMax != null) ? (
                      <div>
                        <Label className="text-xs text-muted-foreground">Revenue range</Label>
                        <div className="text-sm font-medium mt-1">{formatCurrency(company.revenueMin || 0)} – {formatCurrency(company.revenueMax || 0)}</div>
                      </div>
                    ) : null}
                    {company.statusReason && (
                      <div className="sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Status reason</Label>
                        <div className="text-sm font-medium mt-1">{company.statusReason}</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom columns card — if any */}
      {customColumns.length > 0 && (
        <div className="rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 grid place-items-center flex-shrink-0">
              <Columns3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Custom fields</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Additional fields defined by the SEECS admin. Fill these in to provide extra information about your company.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {customColumns.map((col) => (
              <div key={col.id} className="space-y-1.5">
                <Label className="text-sm">
                  {col.name}{col.required && <span className="text-destructive ml-1">*</span>}
                  {col.description && <span className="text-xs text-muted-foreground ml-1.5 font-normal">— {col.description}</span>}
                </Label>
                {col.columnType === 'number' ? (
                  <Input
                    type="number"
                    value={customValues[col.id] || ''}
                    onChange={(e) => setCustomValues((s) => ({ ...s, [col.id]: e.target.value }))}
                    placeholder={col.required ? 'Required' : 'Optional'}
                  />
                ) : col.columnType === 'date' ? (
                  <Input
                    type="date"
                    value={customValues[col.id] || ''}
                    onChange={(e) => setCustomValues((s) => ({ ...s, [col.id]: e.target.value }))}
                  />
                ) : col.columnType === 'boolean' ? (
                  <label className="flex items-center gap-2 h-9 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customValues[col.id] === 'true' || customValues[col.id] === '1'}
                      onChange={(e) => setCustomValues((s) => ({ ...s, [col.id]: e.target.checked ? 'true' : 'false' }))}
                      className="accent-emerald-600"
                    />
                    <span className="text-sm">{customValues[col.id] === 'true' ? 'Yes' : 'No'}</span>
                  </label>
                ) : col.columnType === 'url' ? (
                  <Input
                    type="url"
                    value={customValues[col.id] || ''}
                    onChange={(e) => setCustomValues((s) => ({ ...s, [col.id]: e.target.value }))}
                    placeholder="https://"
                  />
                ) : (
                  <Input
                    value={customValues[col.id] || ''}
                    onChange={(e) => setCustomValues((s) => ({ ...s, [col.id]: e.target.value }))}
                    placeholder={col.required ? 'Required' : 'Optional'}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={saveCustomValues} disabled={savingCustom} className="bg-emerald-600 hover:bg-emerald-700">
              {savingCustom && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save custom fields
            </Button>
          </div>
        </div>
      )}

      {/* API key card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" /> Your API key</CardTitle>
          <CardDescription>Keep this secret. Anyone with it can sign in to your company portal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-muted px-3 py-2.5 rounded-lg break-all">
              {revealed ? company.apiKey : `${company.apiKey.slice(0, 14)}${'•'.repeat(16)}`}
            </code>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setRevealed(!revealed)}>
                  {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{revealed ? 'Hide key' : 'Reveal key'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={copyKey}>
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy to clipboard</TooltipContent>
            </Tooltip>
          </div>
          <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50">
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
              To rotate or revoke this key, contact the SEECS database manager. A revoked key immediately loses access.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

// =================================================================
// INFO FIELD HELPER (view mode)
// =================================================================
function InfoField({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="text-sm font-medium mt-0.5">{children || (value ? value : <span className="text-muted-foreground italic">Not set</span>)}</div>
    </div>
  )
}

// =================================================================
// CUSTOM FIELDS TAB
// =================================================================
function CustomFieldsTab({ company, customColumns, onChanged }: { company: CompanyFull; customColumns: CustomColumn[]; onChanged: () => void }) {
  const [customValues, setCustomValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    company.customValues?.forEach((cv) => { map[cv.customColumnId] = cv.value })
    return map
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const map: Record<string, string> = {}
    company.customValues?.forEach((cv) => { map[cv.customColumnId] = cv.value })
    setCustomValues(map)
  }, [company.customValues])

  const saveCustomValues = async () => {
    setSaving(true)
    try {
      await api('/api/company/self', { method: 'PUT', body: { customValues } })
      toast({ title: 'Saved', description: 'Custom fields updated' })
      onChanged()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (customColumns.length === 0) {
    return (
      <EmptyState
        icon={<Columns3 className="h-7 w-7" />}
        title="No custom fields defined"
        description="Your admin hasn't set up any custom fields for companies yet. They will appear here once configured."
      />
    )
  }

  return (
    <div className="space-y-4">
      <Alert className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
        <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <AlertDescription className="text-emerald-800 dark:text-emerald-200 text-xs">
          Custom fields are additional data points defined by the SEECS administrator. They help capture specialized information about your company beyond the standard fields. Fill in all required fields (marked with *) to keep your profile complete.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
          <div>
            <CardTitle className="text-base">Custom fields</CardTitle>
            <CardDescription>{customColumns.length} field{customColumns.length !== 1 ? 's' : ''} configured by admin</CardDescription>
          </div>
          <Button size="sm" onClick={saveCustomValues} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save all
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {customColumns.map((col) => {
              const hasValue = !!customValues[col.id]
              return (
                <div key={col.id} className={`p-3 rounded-lg border transition-colors ${hasValue ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-border'}`}>
                  <Label className="text-sm">
                    {col.name}
                    {col.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {col.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">{col.description}</p>
                  )}
                  <div className="mt-1.5">
                    {col.columnType === 'number' ? (
                      <Input
                        type="number"
                        value={customValues[col.id] || ''}
                        onChange={(e) => setCustomValues((s) => ({ ...s, [col.id]: e.target.value }))}
                        placeholder={col.required ? 'Required' : 'Optional'}
                      />
                    ) : col.columnType === 'date' ? (
                      <Input
                        type="date"
                        value={customValues[col.id] || ''}
                        onChange={(e) => setCustomValues((s) => ({ ...s, [col.id]: e.target.value }))}
                      />
                    ) : col.columnType === 'boolean' ? (
                      <label className="flex items-center gap-2 h-9 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customValues[col.id] === 'true' || customValues[col.id] === '1'}
                          onChange={(e) => setCustomValues((s) => ({ ...s, [col.id]: e.target.checked ? 'true' : 'false' }))}
                          className="accent-emerald-600"
                        />
                        <span className="text-sm">{customValues[col.id] === 'true' ? 'Yes' : 'No'}</span>
                      </label>
                    ) : col.columnType === 'url' ? (
                      <Input
                        type="url"
                        value={customValues[col.id] || ''}
                        onChange={(e) => setCustomValues((s) => ({ ...s, [col.id]: e.target.value }))}
                        placeholder="https://"
                      />
                    ) : (
                      <Input
                        value={customValues[col.id] || ''}
                        onChange={(e) => setCustomValues((s) => ({ ...s, [col.id]: e.target.value }))}
                        placeholder={col.required ? 'Required' : 'Optional'}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =================================================================
// FOUNDERS TAB
// =================================================================
function FoundersTab({ company, onChanged }: { company: CompanyFull; onChanged: () => void }) {
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [adding, setAdding] = useState(false)
  const [addingExisting, setAddingExisting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    api<Lookup>('/api/company/self/founders').then(setLookup).catch(() => {})
  }, [])

  const attach = async (founderId: string) => {
    try {
      await api('/api/company/self/founders', { method: 'POST', body: { founderId } })
      toast({ title: 'Attached', description: 'Founder added to your company' })
      setAddingExisting(false)
      onChanged()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
          <div>
            <CardTitle className="text-base">Founders & team</CardTitle>
            <CardDescription>People associated with {company.name}. Adding a founder does NOT give them portal access.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setAddingExisting(true)} className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                  <Plus className="h-4 w-4 mr-1" /> Existing
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach an existing founder from the registry</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={() => setAdding(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-1" /> Add Founder
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create a new founder and attach to your company</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {company.founders.length === 0 ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="No founders yet"
              description={`Add the people who lead ${company.name} to build your team profile. Click "Add Founder" to create a new one or "Existing" to attach someone from the registry.`}
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {company.founders.map((cf) => {
                const borderClass = GENDER_BORDER[cf.founder.gender] || 'border-l-gray-400'
                const avatarGradient = cf.founder.gender === 'Female'
                  ? 'from-pink-400 to-rose-500'
                  : cf.founder.gender === 'Other'
                  ? 'from-violet-400 to-purple-500'
                  : 'from-emerald-400 to-teal-500'
                const fullName = `${cf.founder.firstName} ${cf.founder.lastName}`
                return (
                  <div
                    key={cf.id}
                    className={`relative flex flex-col p-4 border rounded-xl border-l-4 ${borderClass} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 bg-background`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${avatarGradient} text-white grid place-items-center text-xs font-bold shadow-sm flex-shrink-0`}>
                        {cf.founder.firstName.charAt(0)}{cf.founder.lastName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{fullName}</span>
                          {/* Gender icon */}
                          <span className="text-muted-foreground" title={cf.founder.gender}>
                            {cf.founder.gender === 'Male' ? '♂' : cf.founder.gender === 'Female' ? '♀' : '⚧'}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="mt-1 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        >
                          {cf.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {cf.founder.degree?.name && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                          <GraduationCap className="h-3 w-3 flex-shrink-0" />
                          <span>{cf.founder.degree.name}</span>
                        </div>
                      )}
                      {cf.founder.email && (
                        <a href={`mailto:${cf.founder.email}`} className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{cf.founder.email}</span>
                        </a>
                      )}
                      {cf.founder.phone && (
                        <a href={`tel:${cf.founder.phone}`} className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{cf.founder.phone}</span>
                        </a>
                      )}
                      {!cf.founder.email && !cf.founder.phone && !cf.founder.degree?.name && (
                        <span className="text-xs text-muted-foreground italic">No contact details provided</span>
                      )}
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => setDeleting(cf.founder.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove {fullName}</TooltipContent>
                    </Tooltip>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add new founder */}
      <FounderFormDialog
        open={adding}
        onOpenChange={setAdding}
        lookup={lookup}
        onSaved={() => { setAdding(false); onChanged() }}
      />

      {/* Attach existing */}
      <Dialog open={addingExisting} onOpenChange={setAddingExisting}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add existing founder</DialogTitle>
            <DialogDescription>Pick a founder already in the registry to attach to {company.name}.</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {lookup?.founders.filter((f) => !company.founders.some((cf) => cf.founder.id === f.id)).map((f) => (
              <button
                key={f.id}
                onClick={() => attach(f.id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-left transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-xs font-semibold">
                  {f.firstName.charAt(0)}{f.lastName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{f.firstName} {f.lastName}</div>
                  <div className="text-xs text-muted-foreground">{f.gender}</div>
                </div>
                <Plus className="h-4 w-4 text-emerald-500" />
              </button>
            ))}
            {lookup && lookup.founders.filter((f) => !company.founders.some((cf) => cf.founder.id === f.id)).length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No more founders available to add.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detach confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this founder from {company.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The founder record stays in the SEECS registry (they may be attached to other companies) but will no longer be associated with your company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await api(`/api/company/self/founders/${deleting}`, { method: 'DELETE' })
                  toast({ title: 'Removed', description: 'Founder detached from your company' })
                  setDeleting(null)
                  onChanged()
                } catch (e: any) {
                  toast({ title: 'Error', description: e.message, variant: 'destructive' })
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FounderFormDialog({ open, onOpenChange, lookup, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; lookup: Lookup | null; onSaved: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState('Male')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [degreeId, setDegreeId] = useState('')
  const [role, setRole] = useState('Co-Founder')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setFirstName(''); setLastName(''); setGender('Male'); setEmail(''); setPhone(''); setDegreeId(''); setRole('Co-Founder')
    }
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/company/self/founders', { method: 'POST', body: { firstName, lastName, gender, email, phone, degreeId: degreeId || null, role } })
      toast({ title: 'Added', description: 'Founder added to your company' })
      onSaved()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new founder</DialogTitle>
          <DialogDescription>This founder will be created in the SEECS registry and attached to your company.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Last name *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Gender *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="CEO / CTO / Co-Founder" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Degree</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={degreeId} onChange={(e) => setDegreeId(e.target.value)}>
                <option value="">— None —</option>
                {lookup?.degrees.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add founder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =================================================================
// ANNUAL DATA TAB
// =================================================================
function AnnualTab({ company, onChanged }: { company: CompanyFull; onChanged: () => void }) {
  const [editing, setEditing] = useState<{ id: string; year: number; monthlyRevenue: number; totalRevenue: number; employeeCount: number; projectCount: number; notes: string | null } | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  // Sort annual data by year desc for display
  const sortedData = [...company.annualData].sort((a, b) => b.year - a.year)

  // Calculate YoY growth
  const getGrowth = (index: number): { direction: 'up' | 'down' | 'flat'; percent: number } | null => {
    if (index >= sortedData.length - 1) return null
    const current = sortedData[index].totalRevenue
    const previous = sortedData[index + 1].totalRevenue
    if (previous === 0 && current === 0) return { direction: 'flat', percent: 0 }
    if (previous === 0) return { direction: 'up', percent: 100 }
    const percent = ((current - previous) / previous) * 100
    return { direction: percent >= 0 ? 'up' : 'down', percent: Math.abs(percent) }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
          <div>
            <CardTitle className="text-base">Annual financial data</CardTitle>
            <CardDescription>Report your company&apos;s revenue, headcount and project count for each year.</CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={() => setCreating(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-1" /> Add Record
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new annual record</TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent>
          {company.annualData.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-7 w-7" />}
              title="No annual data yet"
              description='Add your first year of financial performance to track revenue and growth over time. Click &quot;Add Record&quot; to get started.'
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4 font-semibold">Year</th>
                    <th className="py-3 px-4 font-semibold">Monthly Rev.</th>
                    <th className="py-3 px-4 font-semibold">Total Rev.</th>
                    <th className="py-3 px-4 font-semibold">Growth</th>
                    <th className="py-3 px-4 font-semibold">Employees</th>
                    <th className="py-3 px-4 font-semibold">Projects</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((r, i) => {
                    const growth = getGrowth(i)
                    return (
                      <tr
                        key={r.id}
                        className={`border-t transition-colors duration-150 ${
                          i % 2 === 0
                            ? 'bg-background hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                            : 'bg-muted/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold tabular-nums">{r.year}</td>
                        <td className="py-3 px-4 tabular-nums text-muted-foreground">{formatCurrency(r.monthlyRevenue)}</td>
                        <td className="py-3 px-4 tabular-nums font-medium">{formatCurrency(r.totalRevenue)}</td>
                        <td className="py-3 px-4">
                          {growth ? (
                            <div className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${
                              growth.direction === 'up'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                                : growth.direction === 'down'
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
                                : 'bg-stone-50 dark:bg-stone-900/50 text-stone-600 dark:text-stone-400'
                            }`}>
                              {growth.direction === 'up' && <ArrowUpRight className="h-3 w-3" />}
                              {growth.direction === 'down' && <ArrowDownRight className="h-3 w-3" />}
                              {growth.direction === 'flat' && <Minus className="h-3 w-3" />}
                              {growth.percent.toFixed(1)}%
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 tabular-nums">{r.employeeCount}</td>
                        <td className="py-3 px-4 tabular-nums">{r.projectCount}</td>
                        <td className="py-3 px-4 text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(r)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit {r.year} data</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleting(r.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete {r.year} data</TooltipContent>
                          </Tooltip>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AnnualFormDialog open={creating} onOpenChange={setCreating} onSaved={() => { setCreating(false); onChanged() }} />
      <AnnualFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} existing={editing || undefined} onSaved={() => { setEditing(null); onChanged() }} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this annual record?</AlertDialogTitle>
            <AlertDialogDescription>This removes the revenue data for that year. You can re-add it later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await api(`/api/company/self/annual-data/${deleting}`, { method: 'DELETE' })
                  toast({ title: 'Deleted', description: 'Annual record removed' })
                  setDeleting(null)
                  onChanged()
                } catch (e: any) {
                  toast({ title: 'Error', description: e.message, variant: 'destructive' })
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AnnualFormDialog({ open, onOpenChange, existing, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; existing?: { id: string; year: number; monthlyRevenue: number; totalRevenue: number; employeeCount: number; projectCount: number; notes: string | null }; onSaved: () => void }) {
  const [year, setYear] = useState('')
  const [monthlyRevenue, setMonthlyRevenue] = useState('')
  const [totalRevenue, setTotalRevenue] = useState('')
  const [employeeCount, setEmployeeCount] = useState('')
  const [projectCount, setProjectCount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setYear(existing ? String(existing.year) : String(new Date().getFullYear() - 1))
      setMonthlyRevenue(existing ? String(existing.monthlyRevenue) : '')
      setTotalRevenue(existing ? String(existing.totalRevenue) : '')
      setEmployeeCount(existing ? String(existing.employeeCount) : '')
      setProjectCount(existing ? String(existing.projectCount) : '')
      setNotes(existing?.notes || '')
    }
  }, [open, existing])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        year: Number(year),
        monthlyRevenue: Number(monthlyRevenue) || 0,
        totalRevenue: Number(totalRevenue) || (Number(monthlyRevenue) || 0) * 12,
        employeeCount: Number(employeeCount) || 0,
        projectCount: Number(projectCount) || 0,
        notes: notes || null,
      }
      if (existing) {
        await api(`/api/company/self/annual-data/${existing.id}`, { method: 'PUT', body })
        toast({ title: 'Saved', description: 'Annual data updated' })
      } else {
        await api('/api/company/self/annual-data', { method: 'POST', body })
        toast({ title: 'Added', description: 'Annual data added' })
      }
      onSaved()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit annual data' : 'Add annual data'}</DialogTitle>
          <DialogDescription>Report your company&apos;s financial performance for a specific year. Revenue values are in PKR.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Year *</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} required min="2000" max="2100" />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly revenue (PKR)</Label>
              <Input type="number" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Total revenue (PKR)</Label>
              <Input type="number" value={totalRevenue} onChange={(e) => setTotalRevenue(e.target.value)} placeholder="auto = monthly × 12" />
            </div>
            <div className="space-y-1.5">
              <Label>Employees</Label>
              <Input type="number" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Projects</Label>
              <Input type="number" value={projectCount} onChange={(e) => setProjectCount(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {existing ? 'Save changes' : 'Add year'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
