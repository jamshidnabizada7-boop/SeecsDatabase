'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatDate, formatCurrency } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Building2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  KeyRound,
  Pencil,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Columns3,
  Download,
  LayoutGrid,
  List,
  RotateCw,
  Users,
  DollarSign,
  MapPin,
  Globe,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination'
import { Combobox } from '@/components/ui/combobox'

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

interface AnnualRecord {
  id?: string
  year: number
  monthlyRevenue: number
  totalRevenue: number
  employeeCount: number
  projectCount: number
  notes?: string | null
}

interface FounderAttachment {
  id?: string
  role: string
  founder: {
    id: string
    firstName: string
    lastName: string
    gender?: string
    department?: string | null
    degree?: { name: string; field: string | null } | null
  }
}

interface Company {
  id: string
  name: string
  description: string | null
  email: string | null
  phone: string | null
  website: string | null
  apiKey: string
  apiKeyActive: boolean
  sectorId: string
  cityId: string
  locationId: string | null
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
  founders: FounderAttachment[]
  annualData?: AnnualRecord[]
  _count?: { annualData: number }
  customValues: CustomValue[]
}

interface Lookup {
  sectors: { id: string; name: string }[]
  cities: { id: string; name: string }[]
  locations: { id: string; address: string; city: { name: string } }[]
  degrees: { id: string; name: string; field: string | null }[]
  founders: { id: string; firstName: string; lastName: string; gender: string }[]
}

interface InlineFounderForm {
  id?: string
  name: string
  role: string
  gender: string
  email: string
  phone: string
  department: string
  degreeName: string
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Operational: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Acquired: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Inactive: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Discontinued: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
}

type ViewMode = 'card' | 'table'

export default function CompaniesPage({
  initialCreate = false,
  initialSearch = '',
  onResetInitialCreate,
}: {
  initialCreate?: boolean
  initialSearch?: string
  onResetInitialCreate?: () => void
} = {}) {
  const [items, setItems] = useState<Company[]>([])
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState('All')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [cityFilter, setCityFilter] = useState('All')
  const [editing, setEditing] = useState<Company | null>(null)
  const [creating, setCreating] = useState(initialCreate)
  const [deleting, setDeleting] = useState<Company | null>(null)
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<ViewMode>('card')

  useEffect(() => {
    if (initialCreate) {
      setCreating(true)
      onResetInitialCreate?.()
    }
  }, [initialCreate, onResetInitialCreate])

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch)
      setPage(1)
    }
  }, [initialSearch])

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const { toast } = useToast()

  const loadLookup = useCallback(async () => {
    try {
      const r = await api<Lookup>('/api/lookup')
      setLookup(r)
    } catch {}
  }, [])

  const load = useCallback(
    async (currentPage = page, currentLimit = pageSize) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(currentPage))
        params.set('limit', String(currentLimit))
        if (search.trim()) params.set('q', search.trim())
        if (statusFilter !== 'All') params.set('status', statusFilter)
        if (sectorFilter !== 'All') params.set('sector', sectorFilter)
        if (cityFilter !== 'All') params.set('city', cityFilter)

        const r = await api<{
          items: Company[]
          customColumns: CustomColumn[]
          total: number
          page: number
          limit: number
          totalPages: number
        }>(`/api/admin/companies?${params.toString()}`)

        setItems(r.items)
        setCustomColumns(r.customColumns || [])
        setTotal(r.total)
        setTotalPages(r.totalPages || 1)
      } catch (e: any) {
        toast({ title: 'Error', description: e.message, variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    },
    [page, pageSize, search, statusFilter, sectorFilter, cityFilter, toast]
  )

  useEffect(() => {
    loadLookup()
  }, [loadLookup])

  useEffect(() => {
    load(page, pageSize)
  }, [load, page, pageSize])

  const copyKey = (key: string) => {
    navigator.clipboard?.writeText(key)
    toast({ title: 'Copied', description: 'API key copied to clipboard' })
  }

  const regenerateKey = async (company: Company) => {
    try {
      const r = await api<{ item: Company }>(`/api/admin/companies/${company.id}`, {
        method: 'PUT',
        body: { regenerateKey: true },
      })
      toast({ title: 'API Key Regenerated', description: `New key for ${company.name}` })
      load()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      if (statusFilter !== 'All') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/companies/export?${params.toString()}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `seecs-companies-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast({ title: 'Export Complete', description: 'CSV downloaded' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const sectorOptions = (lookup?.sectors || []).map((s) => ({ value: s.id, label: s.name }))
  const cityOptions = (lookup?.cities || []).map((c) => ({ value: c.id, label: c.name }))

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies Registry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Centralized directory of all SEECS-affiliated companies, founders, degrees, locations, and annual performance.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border bg-muted/50 p-0.5">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="h-8 px-2.5"
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" /> Cards
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-2.5"
            >
              <List className="h-4 w-4 mr-1.5" /> Table
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="h-8">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="h-8">
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setCreating(true)} className="h-8 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-1.5" /> Add Company
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="shadow-sm border-muted">
        <CardContent className="p-3.5 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies, founders, description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <Combobox
              options={[{ value: 'All', label: 'All Sectors' }, ...sectorOptions]}
              value={sectorFilter}
              onChange={(v) => {
                setSectorFilter(v || 'All')
                setPage(1)
              }}
              placeholder="Filter Sector"
              className="w-full sm:w-44 h-9"
              allowCustom={false}
            />
            <Combobox
              options={[{ value: 'All', label: 'All Cities' }, ...cityOptions]}
              value={cityFilter}
              onChange={(v) => {
                setCityFilter(v || 'All')
                setPage(1)
              }}
              placeholder="Filter City"
              className="w-full sm:w-36 h-9"
              allowCustom={false}
            />
            <Combobox
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Operational', label: 'Operational' },
                { value: 'Active', label: 'Active' },
                { value: 'Acquired', label: 'Acquired' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v || 'All')
                setPage(1)
              }}
              placeholder="Status"
              className="w-full sm:w-36 h-9"
              allowCustom={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm">Loading companies from database...</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="py-16 text-center text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No companies found</p>
          <p className="text-xs mt-1">Try adjusting your search query or filters.</p>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => {
            const revealed = revealedKeys[c.id]
            return (
              <Card key={c.id} className="flex flex-col justify-between hover:shadow-md transition-shadow border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-bold text-foreground leading-tight">{c.name}</CardTitle>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[11px] font-normal bg-muted/40">
                          {c.sector.name}
                        </Badge>
                        <Badge variant="outline" className="text-[11px] font-normal bg-muted/40 flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" /> {c.city.name}
                        </Badge>
                        {c.status && (
                          <Badge variant="outline" className={`text-[11px] ${STATUS_STYLES[c.status] || ''}`}>
                            {c.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(c)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {c.description && (
                    <CardDescription className="line-clamp-2 text-xs mt-2 text-muted-foreground leading-relaxed">
                      {c.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs">
                  {/* Founders Box */}
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-muted/50 space-y-1.5">
                    <div className="font-semibold text-stone-500 dark:text-stone-400 text-[11px] flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-emerald-600" /> Founders & Leaders ({c.founders.length})
                    </div>
                    {c.founders.length === 0 ? (
                      <span className="text-muted-foreground italic text-[11px]">No founders attached</span>
                    ) : (
                      <div className="space-y-1">
                        {c.founders.slice(0, 3).map((f) => (
                          <div key={f.id} className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-foreground">
                              {f.founder.firstName} {f.founder.lastName}
                            </span>
                            <span className="text-muted-foreground text-[10px] bg-background px-1.5 py-0.5 rounded border">
                              {f.role} {f.founder.degree ? `· ${f.founder.degree.name}` : ''}
                            </span>
                          </div>
                        ))}
                        {c.founders.length > 3 && (
                          <div className="text-[10px] text-muted-foreground font-medium">
                            +{c.founders.length - 3} more founders
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Financial / Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
                    <div>
                      <span className="font-medium text-foreground">Founded:</span> {c.foundedYear || '—'}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Revenue:</span>{' '}
                      {c.revenue ? formatCurrency(c.revenue) : '—'}
                    </div>
                  </div>

                  {/* API Key info */}
                  <div className="flex items-center justify-between pt-2 border-t text-[11px]">
                    <div className="flex items-center gap-1">
                      <KeyRound className="h-3 w-3 text-muted-foreground" />
                      <code className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        {revealed ? c.apiKey : `${c.apiKey.slice(0, 8)}•••`}
                      </code>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[10px]"
                        onClick={() => setRevealedKeys((s) => ({ ...s, [c.id]: !s[c.id] }))}
                      >
                        {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => copyKey(c.apiKey)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="shadow-sm border-muted overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Company</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Founders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Founded</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div className="font-semibold text-foreground">{c.name}</div>
                    {c.website && <div className="text-xs text-muted-foreground truncate">{c.website}</div>}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{c.sector.name}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.city.name}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {c.founders.map((f) => `${f.founder.firstName} ${f.founder.lastName} (${f.role})`).join(', ') || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${STATUS_STYLES[c.status || ''] || ''}`}>
                      {c.status || 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.foundedYear || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.revenue ? formatCurrency(c.revenue) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleting(c)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages} ({total} total companies)
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* All-in-One Company Creation & Editing Dialog */}
      <AllInOneCompanyDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false)
            setEditing(null)
          }
        }}
        company={editing}
        lookup={lookup}
        customColumns={customColumns}
        onSaved={() => {
          setCreating(false)
          setEditing(null)
          load()
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete company "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the company, its founder links, and recorded financial records from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await api(`/api/admin/companies/${deleting!.id}`, { method: 'DELETE' })
                  toast({ title: 'Deleted', description: `${deleting!.name} removed` })
                  setDeleting(null)
                  load()
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

function AllInOneCompanyDialog({
  open,
  onOpenChange,
  company,
  lookup,
  customColumns,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  company?: Company | null
  lookup: Lookup | null
  customColumns: CustomColumn[]
  onSaved: () => void
}) {
  const [tab, setTab] = useState('details')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [sector, setSector] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState('Operational')
  const [foundedYear, setFoundedYear] = useState('')
  const [revenue, setRevenue] = useState('')
  const [branchesCount, setBranchesCount] = useState('')
  const [founders, setFounders] = useState<InlineFounderForm[]>([])
  const [annualData, setAnnualData] = useState<AnnualRecord[]>([])
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setTab('details')
      setName(company?.name || '')
      setDescription(company?.description || '')
      setEmail(company?.email || '')
      setPhone(company?.phone || '')
      setWebsite(company?.website || '')
      setSector(company?.sectorId || company?.sector?.name || '')
      setCity(company?.cityId || company?.city?.name || '')
      setAddress(company?.location?.address || '')
      setStatus(company?.status || 'Operational')
      setFoundedYear(company?.foundedYear ? String(company.foundedYear) : '')
      setRevenue(company?.revenue != null ? String(company.revenue) : '')
      setBranchesCount(company?.branchesCount != null ? String(company.branchesCount) : '')

      // Populate founders
      if (company?.founders?.length) {
        setFounders(
          company.founders.map((fa) => ({
            id: fa.founder.id,
            name: `${fa.founder.firstName} ${fa.founder.lastName}`,
            role: fa.role || 'Co-Founder',
            gender: fa.founder.gender || 'Male',
            email: '',
            phone: '',
            department: fa.founder.department || '',
            degreeName: fa.founder.degree?.name || '',
          }))
        )
      } else {
        setFounders([])
      }

      // Populate annual data
      setAnnualData(company?.annualData || [])

      // Populate custom values
      const cvMap: Record<string, string> = {}
      company?.customValues?.forEach((cv) => {
        cvMap[cv.customColumnId] = cv.value
      })
      setCustomValues(cvMap)
    }
  }, [open, company])

  const addFounder = () => {
    setFounders([
      ...founders,
      {
        name: '',
        role: founders.length === 0 ? 'CEO' : 'Co-Founder',
        gender: 'Male',
        email: '',
        phone: '',
        department: 'Computer Science',
        degreeName: 'BSCS',
      },
    ])
  }

  const removeFounder = (idx: number) => {
    setFounders(founders.filter((_, i) => i !== idx))
  }

  const updateFounder = (idx: number, field: keyof InlineFounderForm, val: string) => {
    const updated = [...founders]
    updated[idx][field] = val
    setFounders(updated)
  }

  const addAnnualRow = () => {
    const nextYear = annualData.length > 0 ? Math.min(...annualData.map((d) => d.year)) - 1 : new Date().getFullYear() - 1
    setAnnualData([
      ...annualData,
      {
        year: nextYear,
        monthlyRevenue: 0,
        totalRevenue: 0,
        employeeCount: 0,
        projectCount: 0,
        notes: '',
      },
    ])
  }

  const updateAnnualRow = (idx: number, field: keyof AnnualRecord, val: any) => {
    const updated = [...annualData]
    updated[idx] = { ...updated[idx], [field]: val }
    setAnnualData(updated)
  }

  const removeAnnualRow = (idx: number) => {
    setAnnualData(annualData.filter((_, i) => i !== idx))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !sector.trim() || !city.trim()) {
      toast({ title: 'Validation Error', description: 'Name, Sector, and City are required.', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        sectorId: sector.trim(),
        cityId: city.trim(),
        address: address.trim() || null,
        status,
        foundedYear: foundedYear ? Number(foundedYear) : null,
        revenue: revenue ? Number(revenue) : null,
        branchesCount: branchesCount ? Number(branchesCount) : null,
        founders: founders
          .filter((f) => f.name.trim().length > 0)
          .map((f) => ({
            id: f.id,
            name: f.name.trim(),
            role: f.role.trim() || 'Co-Founder',
            gender: f.gender,
            email: f.email.trim() || null,
            phone: f.phone.trim() || null,
            department: f.department.trim() || null,
            degreeName: f.degreeName.trim() || null,
          })),
        annualData: annualData.filter((d) => d.year > 0),
        customValues,
      }

      if (company) {
        await api(`/api/admin/companies/${company.id}`, { method: 'PUT', body: payload })
        toast({ title: 'Success', description: 'Company profile updated' })
      } else {
        await api('/api/admin/companies', { method: 'POST', body: payload })
        toast({ title: 'Success', description: 'New company registered successfully' })
      }
      onSaved()
    } catch (e: any) {
      toast({ title: 'Save Failed', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const sectorOptions = (lookup?.sectors || []).map((s) => ({ value: s.id, label: s.name }))
  const cityOptions = (lookup?.cities || []).map((c) => ({ value: c.id, label: c.name }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={submit}>
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              {company ? `Edit ${company.name}` : 'Add New Company'}
            </DialogTitle>
            <DialogDescription>
              Manage all details, founders, location, and annual records in one unified place.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={setTab} className="mt-4 space-y-4">
            <TabsList className="grid grid-cols-4 w-full h-9">
              <TabsTrigger value="details" className="text-xs">
                <Building2 className="h-3.5 w-3.5 mr-1" /> Details
              </TabsTrigger>
              <TabsTrigger value="location" className="text-xs">
                <MapPin className="h-3.5 w-3.5 mr-1" /> Location
              </TabsTrigger>
              <TabsTrigger value="founders" className="text-xs">
                <Users className="h-3.5 w-3.5 mr-1" /> Founders ({founders.length})
              </TabsTrigger>
              <TabsTrigger value="financials" className="text-xs">
                <DollarSign className="h-3.5 w-3.5 mr-1" /> Financials
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Company Details */}
            <TabsContent value="details" className="space-y-3 pt-1">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Company Name <span className="text-destructive">*</span></Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Technologies" required />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Company overview, services, technology..."
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@company.com" />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 0000000" />
                </div>
                <div className="space-y-1">
                  <Label>Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://company.com" />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Combobox
                    options={[
                      { value: 'Operational', label: 'Operational' },
                      { value: 'Active', label: 'Active' },
                      { value: 'Acquired', label: 'Acquired' },
                      { value: 'Inactive', label: 'Inactive' },
                      { value: 'Discontinued', label: 'Discontinued' },
                    ]}
                    value={status}
                    onChange={setStatus}
                    allowCustom={false}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Founded Year</Label>
                  <Input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="e.g. 2021" />
                </div>
                <div className="space-y-1">
                  <Label>Annual Revenue (PKR)</Label>
                  <Input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="e.g. 50000000" />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Location & Sector */}
            <TabsContent value="location" className="space-y-3 pt-1">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Sector / Industry <span className="text-destructive">*</span></Label>
                  <Combobox
                    options={sectorOptions}
                    value={sector}
                    onChange={setSector}
                    placeholder="Select or type sector..."
                    searchPlaceholder="Search sectors..."
                    createLabel="Create new sector"
                  />
                  <p className="text-[11px] text-muted-foreground">Search from existing sectors or type a new one.</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>City <span className="text-destructive">*</span></Label>
                  <Combobox
                    options={cityOptions}
                    value={city}
                    onChange={setCity}
                    placeholder="Select or type city..."
                    searchPlaceholder="Search cities..."
                    createLabel="Create new city"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Full Address / Head Office</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Sector H-12, NUST SEECS Incubation Center, Islamabad"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Number of Branches</Label>
                  <Input type="number" value={branchesCount} onChange={(e) => setBranchesCount(e.target.value)} placeholder="e.g. 2" />
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Founders & Degrees */}
            <TabsContent value="founders" className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Add founders, executive roles, departments, and academic degrees.</p>
                <Button type="button" variant="outline" size="sm" onClick={addFounder} className="h-7 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Founder
                </Button>
              </div>

              {founders.length === 0 ? (
                <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground space-y-2">
                  <Users className="h-8 w-8 mx-auto opacity-40" />
                  <p className="text-xs">No founders added to this company yet.</p>
                  <Button type="button" variant="outline" size="sm" onClick={addFounder} className="text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add First Founder
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {founders.map((f, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-muted/20 space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Founder #{idx + 1}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFounder(idx)} className="h-6 w-6 p-0 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Full Name</Label>
                          <Input
                            value={f.name}
                            onChange={(e) => updateFounder(idx, 'name', e.target.value)}
                            placeholder="e.g. Jawad Haider"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Role</Label>
                          <Input
                            value={f.role}
                            onChange={(e) => updateFounder(idx, 'role', e.target.value)}
                            placeholder="e.g. CEO, CTO"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Gender</Label>
                          <Combobox
                            options={[
                              { value: 'Male', label: 'Male' },
                              { value: 'Female', label: 'Female' },
                              { value: 'Other', label: 'Other' },
                            ]}
                            value={f.gender}
                            onChange={(v) => updateFounder(idx, 'gender', v || 'Male')}
                            allowCustom={false}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Department</Label>
                          <Input
                            value={f.department}
                            onChange={(e) => updateFounder(idx, 'department', e.target.value)}
                            placeholder="e.g. Computer Science"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Degree</Label>
                          <Input
                            value={f.degreeName}
                            onChange={(e) => updateFounder(idx, 'degreeName', e.target.value)}
                            placeholder="e.g. BSCS, BESE"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Email</Label>
                          <Input
                            value={f.email}
                            onChange={(e) => updateFounder(idx, 'email', e.target.value)}
                            placeholder="founder@company.com"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 4: Financials & Annual Data */}
            <TabsContent value="financials" className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Year-by-year financial and team growth records.</p>
                <Button type="button" variant="outline" size="sm" onClick={addAnnualRow} className="h-7 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Year Record
                </Button>
              </div>

              {annualData.length === 0 ? (
                <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground space-y-2">
                  <DollarSign className="h-8 w-8 mx-auto opacity-40" />
                  <p className="text-xs">No historical annual data records yet.</p>
                  <Button type="button" variant="outline" size="sm" onClick={addAnnualRow} className="text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Year Record
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto">
                  {annualData.map((ad, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-muted/20 grid grid-cols-5 gap-2 items-center text-xs">
                      <div>
                        <Label className="text-[10px]">Year</Label>
                        <Input
                          type="number"
                          value={ad.year}
                          onChange={(e) => updateAnnualRow(idx, 'year', Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Total Revenue (PKR)</Label>
                        <Input
                          type="number"
                          value={ad.totalRevenue}
                          onChange={(e) => updateAnnualRow(idx, 'totalRevenue', Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Employees</Label>
                        <Input
                          type="number"
                          value={ad.employeeCount}
                          onChange={(e) => updateAnnualRow(idx, 'employeeCount', Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Projects</Label>
                        <Input
                          type="number"
                          value={ad.projectCount}
                          onChange={(e) => updateAnnualRow(idx, 'projectCount', Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex items-end justify-end pb-0.5">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAnnualRow(idx)} className="h-8 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4 border-t mt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {company ? 'Save Changes' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
