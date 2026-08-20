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
import { useToast } from '@/hooks/use-toast'
import { Building2, LogOut, Loader2, RefreshCw, Pencil, Trash2, Plus, Users, DollarSign, ShieldCheck, Copy, KeyRound, Columns3, Calendar, MapPin } from 'lucide-react'

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
  // New Java fields
  status: string | null
  statusReason: string | null
  sinceDate: string | null
  foundedYear: number | null
  discontinuedDate: string | null
  branchesCount: number | null
  revenue: number | null
  revenueMin: number | null
  revenueMax: number | null
  // Relations
  sector: { id: string; name: string }
  city: { id: string; name: string }
  location: { id: string; address: string; country: string; city: { name: string } } | null
  founders: { id: string; role: string; founder: { id: string; firstName: string; lastName: string; gender: string; email: string | null; phone: string | null; degree: { id: string; name: string } | null } }[]
  annualData: { id: string; year: number; monthlyRevenue: number; totalRevenue: number; employeeCount: number; projectCount: number; notes: string | null }[]
  customValues: CustomValue[]
}

interface Lookup {
  sectors: { id: string; name: string }[]
  cities: { id: string; name: string }[]
  locations: { id: string; address: string; city: { name: string } }[]
  degrees: { id: string; name: string }[]
  founders: { id: string; firstName: string; lastName: string; gender: string }[]
}

type Tab = 'profile' | 'founders' | 'annual'

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-amber-50 text-amber-700 border-amber-200',
  Discontinued: 'bg-rose-50 text-rose-700 border-rose-200',
}

export default function CompanyPortal({ company, onLogout }: { company: any; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('profile')
  const [data, setData] = useState<CompanyFull | null>(null)
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)
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

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">
              {company.name.charAt(0).toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-sm truncate max-w-[200px] sm:max-w-xs">{company.name}</div>
              <div className="text-xs text-muted-foreground">Company Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-1.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Isolation banner */}
      <div className="bg-emerald-50 border-b border-emerald-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 text-xs text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          You are signed in as <strong>{company.name}</strong>. You can only view and edit your own company data.
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          <TabBtn active={tab === 'profile'} onClick={() => setTab('profile')} icon={<Building2 className="h-4 w-4" />}>Profile</TabBtn>
          <TabBtn active={tab === 'founders'} onClick={() => setTab('founders')} icon={<Users className="h-4 w-4" />}>Founders {data && <span className="ml-1 text-xs text-muted-foreground">({data.founders.length})</span>}</TabBtn>
          <TabBtn active={tab === 'annual'} onClick={() => setTab('annual')} icon={<DollarSign className="h-4 w-4" />}>Annual Data {data && <span className="ml-1 text-xs text-muted-foreground">({data.annualData.length})</span>}</TabBtn>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {loading && !data ? (
          <div className="py-12 text-center text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading your company data…</div>
        ) : !data ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Failed to load.</div>
        ) : (
          <>
            {tab === 'profile' && <ProfileTab company={data} customColumns={customColumns} onChanged={load} revealed={revealed} setRevealed={setRevealed} />}
            {tab === 'founders' && <FoundersTab company={data} onChanged={load} />}
            {tab === 'annual' && <AnnualTab company={data} onChanged={load} />}
          </>
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

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

// =================================================================
// PROFILE TAB
// =================================================================
function ProfileTab({ company, customColumns, onChanged, revealed, setRevealed }: { company: CompanyFull; customColumns: CustomColumn[]; onChanged: () => void; revealed: boolean; setRevealed: (b: boolean) => void }) {
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
  const { toast } = useToast()

  useEffect(() => {
    api<Lookup>('/api/company/lookup').then(setLookup).catch(() => {})
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/company/self', { method: 'PUT', body: { name, description, email, phone, website, locationId: locationId || null } })
      toast({ title: 'Saved', description: 'Your profile has been updated' })
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company profile</CardTitle>
          <CardDescription>Update your company's public information. Sector and city are managed by the SEECS admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Company name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
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

            <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Sector (managed by admin)</Label>
                <div className="text-sm font-medium mt-1">{company.sector.name}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">City (managed by admin)</Label>
                <div className="text-sm font-medium mt-1">{company.city.name}</div>
              </div>
            </div>

            {(company.status || company.foundedYear || company.sinceDate || company.branchesCount || company.revenue != null || company.revenueMin != null) && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t">
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
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Custom columns card */}
      {customColumns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Columns3 className="h-4 w-4" /> Custom fields</CardTitle>
            <CardDescription>Additional fields defined by the SEECS admin. Fill these in to provide extra information about your company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {customColumns.map((col) => (
                <div key={col.id} className="space-y-1.5">
                  <Label>{col.name}{col.required && <span className="text-destructive ml-1">*</span>}{col.description && <span className="text-xs text-muted-foreground ml-1.5">— {col.description}</span>}</Label>
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
                        className="accent-primary"
                      />
                      <span className="text-sm">{customValues[col.id] === 'true' ? 'Yes' : 'No'}</span>
                    </label>
                  ) : col.columnType === 'url' ? (
                    <Input
                      type="url"
                      value={customValues[col.id] || ''}
                      onChange={(e) => setCustomValues((s) => ({ ...s, [col.id]: e.target.value }))}
                      placeholder="https://…"
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
            <div className="flex justify-end">
              <Button onClick={saveCustomValues} disabled={savingCustom}>
                {savingCustom && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save custom fields
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API key card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" /> Your API key</CardTitle>
          <CardDescription>Keep this secret. Anyone with it can sign in to your company portal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-muted px-3 py-2.5 rounded break-all">
              {revealed ? company.apiKey : `${company.apiKey.slice(0, 14)}••••••••••••••••`}
            </code>
            <Button variant="outline" size="sm" onClick={() => setRevealed(!revealed)}>
              {revealed ? 'Hide' : 'Reveal'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(company.apiKey); toast({ title: 'Copied' }) }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Alert>
            <AlertDescription>
              To rotate or revoke this key, contact the SEECS database manager. A revoked key immediately loses access.
            </AlertDescription>
          </Alert>
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Founders & team</CardTitle>
            <CardDescription>People associated with {company.name}. Adding a founder here does NOT give them access to the portal — only you can sign in with the API key.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddingExisting(true)}>
              <Plus className="h-4 w-4 mr-1" /> Existing
            </Button>
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {company.founders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No founders yet. Add the people who lead {company.name}.
            </div>
          ) : (
            <div className="grid gap-2">
              {company.founders.map((cf) => (
                <div key={cf.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-xs font-semibold">
                    {cf.founder.firstName.charAt(0)}{cf.founder.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{cf.founder.firstName} {cf.founder.lastName}</div>
                    <div className="text-xs text-muted-foreground">
                      {cf.founder.degree?.name || 'No degree'} · {cf.founder.email || cf.founder.phone || 'No contact'}
                    </div>
                  </div>
                  <Badge variant="outline">{cf.role}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(cf.founder.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left"
              >
                <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-xs font-semibold">
                  {f.firstName.charAt(0)}{f.lastName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{f.firstName} {f.lastName}</div>
                  <div className="text-xs text-muted-foreground">{f.gender}</div>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground" />
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
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={gender} onChange={(e) => setGender(e.target.value)}>
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
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={degreeId} onChange={(e) => setDegreeId(e.target.value)}>
                <option value="">— None —</option>
                {lookup?.degrees.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Annual financial data</CardTitle>
            <CardDescription>Report your company's revenue, headcount and project count for each year.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add year
          </Button>
        </CardHeader>
        <CardContent>
          {company.annualData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No annual data yet. Add your first year of financial performance.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Year</th>
                    <th className="py-2 pr-4 font-medium">Monthly rev.</th>
                    <th className="py-2 pr-4 font-medium">Total rev.</th>
                    <th className="py-2 pr-4 font-medium">Employees</th>
                    <th className="py-2 pr-4 font-medium">Projects</th>
                    <th className="py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {company.annualData.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2.5 pr-4 font-medium">{r.year}</td>
                      <td className="py-2.5 pr-4">{formatCurrency(r.monthlyRevenue)}</td>
                      <td className="py-2.5 pr-4">{formatCurrency(r.totalRevenue)}</td>
                      <td className="py-2.5 pr-4">{r.employeeCount}</td>
                      <td className="py-2.5 pr-4">{r.projectCount}</td>
                      <td className="py-2.5 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleting(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
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

function AnnualFormDialog({ open, onOpenChange, existing, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; existing?: { id: string; year: number; monthlyRevenue: number; totalRevenue: number; employeeCount: number; projectCount: number; notes: string }; onSaved: () => void }) {
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
          <DialogDescription>Report your company's financial performance for a specific year.</DialogDescription>
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
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {existing ? 'Save changes' : 'Add year'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
