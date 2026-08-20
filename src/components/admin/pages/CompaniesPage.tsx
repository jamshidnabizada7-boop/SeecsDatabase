'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { api, formatDate, formatCurrency } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Building2, Loader2, Plus, RefreshCw, Search, KeyRound, Pencil, Trash2, Copy, Eye, EyeOff, Columns3, ChevronDown, ChevronUp, Download, LayoutGrid, List, RotateCw, X } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'

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
  founders: { id: string; role: string; founder: { id: string; firstName: string; lastName: string } }[]
  _count: { annualData: number }
  customValues: CustomValue[]
}

interface Lookup {
  sectors: { id: string; name: string }[]
  cities: { id: string; name: string }[]
  locations: { id: string; address: string; city: { name: string } }[]
  degrees: { id: string; name: string; field: string | null }[]
  founders: { id: string; firstName: string; lastName: string; gender: string }[]
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Inactive: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Discontinued: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
}

type ViewMode = 'card' | 'table'
type StatusFilter = 'All' | 'Active' | 'Inactive' | 'Discontinued'

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>([])
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Company | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Company | null>(null)
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})
  const [showCustom, setShowCustom] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buildParams = useCallback((
    opts?: { searchVal?: string; statusVal?: StatusFilter; pageVal?: number; pageSizeVal?: number }
  ) => {
    const q = opts?.searchVal ?? search
    const st = opts?.statusVal ?? statusFilter
    const p = opts?.pageVal ?? page
    const ps = opts?.pageSizeVal ?? pageSize
    const params = new URLSearchParams()
    if (p) params.set('page', String(p))
    if (ps) params.set('limit', String(ps))
    if (q) params.set('q', q)
    if (st !== 'All') params.set('status', st)
    return params.toString() ? `?${params.toString()}` : ''
  }, [search, statusFilter, page, pageSize])

  const load = useCallback(async (overrideParams?: string) => {
    setLoading(true)
    try {
      const qs = overrideParams ?? buildParams()
      const [companiesRes, lookupRes] = await Promise.all([
        api<{ items: Company[]; customColumns: CustomColumn[]; total: number; page: number; limit: number; totalPages: number }>(`/api/admin/companies${qs}`),
        api<Lookup>('/api/lookup'),
      ])
      setItems(companiesRes.items)
      setCustomColumns(companiesRes.customColumns)
      setLookup(lookupRes)
      setTotal(companiesRes.total)
      setTotalPages(companiesRes.totalPages)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [buildParams, toast])

  // Main data loading: debounced for search, immediate for page/status/pageSize changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const delay = search ? 300 : 0
    debounceRef.current = setTimeout(() => {
      load()
    }, delay)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, page, pageSize])

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val))
    setPage(1)
  }

  const handleStatusFilter = (val: StatusFilter) => {
    setStatusFilter(val)
    setPage(1)
  }

  const handleSearchClear = () => {
    setSearch('')
    setPage(1)
  }

  const copyKey = (k: string) => {
    navigator.clipboard?.writeText(k)
    toast({ title: 'Copied', description: 'API key copied to clipboard' })
  }

  const regenerateKey = async (company: Company) => {
    try {
      await api(`/api/admin/companies/${company.id}`, {
        method: 'PUT',
        body: { ...company, regenerateKey: true },
      })
      toast({ title: 'Regenerated', description: 'A new API key has been generated' })
      load()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const exportCSV = async () => {
    let exportItems: Company[] = items
    try {
      const exportParams = new URLSearchParams()
      if (search) exportParams.set('q', search)
      if (statusFilter !== 'All') exportParams.set('status', statusFilter)
      const qs = exportParams.toString() ? `?${exportParams.toString()}` : ''
      const res = await api<{ items: Company[] }>(`/api/admin/companies${qs}`)
      exportItems = res.items
    } catch {
      // fall back to current page items
    }
    const headers = ['Name', 'Email', 'Phone', 'Website', 'Status', 'Since Date', 'Founded Year', 'Branches', 'Revenue', 'Sector', 'City', 'API Key']
    const rows = exportItems.map((c) => [
      c.name,
      c.email || '',
      c.phone || '',
      c.website || '',
      c.status || '',
      c.sinceDate || '',
      c.foundedYear || '',
      c.branchesCount || '',
      c.revenue || '',
      c.sector.name,
      c.city.name,
      c.apiKey,
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `companies-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Exported', description: `${exportItems.length} companies exported as CSV` })
  }

  const getCustomValue = (company: Company, columnId: string) => {
    return company.customValues?.find((cv) => cv.customColumnId === columnId)?.value || ''
  }

  const statusFilterOptions: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'All' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Discontinued', value: 'Discontinued' },
  ]

  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, total)

  const paginationRange = useMemo(() => {
    const range: number[] = []
    const delta = 2
    const left = Math.max(1, page - delta)
    const right = Math.min(totalPages, page + delta)
    for (let i = left; i <= right; i++) range.push(i)
    return range
  }, [page, totalPages])

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-sm text-muted-foreground">
            {total} companies total{statusFilter !== 'All' ? <span> · <span className="text-stone-600 font-medium">{statusFilter}</span></span> : null}{search ? <span> · matching <span className="text-stone-600 font-medium">&lsquo;{search}&rsquo;</span></span> : null}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add company
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, website…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 pr-8"
          />
          {search && (
            <button
              onClick={handleSearchClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Status filter badges */}
          {statusFilterOptions.map((sf) => (
            <button
              key={sf.value}
              onClick={() => handleStatusFilter(sf.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === sf.value
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-background text-stone-600 border-stone-200 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              {sf.label}
            </button>
          ))}
          <div className="w-px h-6 bg-border mx-1" />
          {/* View mode toggle */}
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('card')}
            title="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('table')}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-3">
          {items.map((c) => {
            const revealed = revealedKeys[c.id]
            const showCust = showCustom[c.id]
            return (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left: identity */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">{c.name}</h3>
                            {c.status ? (
                              <Badge variant="outline" className={`text-xs ${STATUS_STYLES[c.status] || ''}`}>{c.status}</Badge>
                            ) : c.apiKeyActive ? (
                              <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 border-emerald-200">Active</Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200">Revoked</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description || 'No description.'}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <Field label="Sector" value={c.sector.name} />
                        <Field label="City" value={c.city.name} />
                        <Field label="Founders" value={String(c.founders.length)} />
                        <Field label="Annual records" value={String(c._count.annualData)} />
                      </div>

                      {/* New fields row */}
                      {(c.foundedYear || c.sinceDate || c.branchesCount || c.revenue != null || c.revenueMin != null) && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          {c.foundedYear && <Field label="Founded" value={String(c.foundedYear)} />}
                          {c.sinceDate && <Field label="Since" value={c.sinceDate} />}
                          {c.branchesCount != null && <Field label="Branches" value={String(c.branchesCount)} />}
                          {c.revenue != null ? (
                            <Field label="Revenue" value={formatCurrency(c.revenue)} />
                          ) : c.revenueMin != null || c.revenueMax != null ? (
                            <Field label="Revenue range" value={`${formatCurrency(c.revenueMin || 0)} – ${formatCurrency(c.revenueMax || 0)}`} />
                          ) : null}
                        </div>
                      )}

                      {c.statusReason && (
                        <p className="mt-2 text-xs text-muted-foreground">Status reason: {c.statusReason}</p>
                      )}
                      {c.discontinuedDate && (
                        <p className="mt-1 text-xs text-rose-600">Discontinued: {c.discontinuedDate}</p>
                      )}

                      {c.founders.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {c.founders.map((cf) => (
                            <Badge key={cf.id} variant="outline" className="text-xs">
                              {cf.founder.firstName} {cf.founder.lastName} · <span className="text-muted-foreground">{cf.role}</span>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Custom columns inline */}
                      {customColumns.length > 0 && (
                        <div className="mt-3">
                          <button
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowCustom((s) => ({ ...s, [c.id]: !s[c.id] }))}
                          >
                            <Columns3 className="h-3.5 w-3.5" />
                            Custom fields ({customColumns.length})
                            {showCust ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                          {showCust && (
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {customColumns.map((col) => (
                                <div key={col.id} className="text-sm">
                                  <span className="text-xs text-muted-foreground">{col.name}</span>
                                  <div className="font-medium truncate">{getCustomValue(c, col.id) || <span className="text-muted-foreground italic">—</span>}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: API key + actions */}
                    <div className="lg:w-80 lg:border-l lg:pl-5 space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">API Key</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                            {revealed ? c.apiKey : `${c.apiKey.slice(0, 14)}••••••••`}
                          </code>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRevealedKeys((s) => ({ ...s, [c.id]: !s[c.id] }))}>
                                {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{revealed ? 'Hide key' : 'Reveal key'}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyKey(c.apiKey)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy to clipboard</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => regenerateKey(c)}>
                                <RotateCw className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Regenerate key</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(c)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/5" onClick={() => setDeleting(c)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {items.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
              {search
                ? 'No companies found matching your search.'
                : statusFilter !== 'All'
                  ? `No companies with status "${statusFilter}".`
                  : 'No companies yet. Add one or let companies self-register.'}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Name</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="hidden md:table-cell">City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Founded</TableHead>
                  <TableHead className="hidden lg:table-cell">Revenue</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => {
                  const revealed = revealedKeys[c.id]
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="pl-4 font-medium max-w-[200px] truncate">
                        <div className="truncate">{c.name}</div>
                        {c.email && <div className="text-xs text-muted-foreground truncate">{c.email}</div>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.sector.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{c.city.name}</TableCell>
                      <TableCell>
                        {c.status ? (
                          <Badge variant="outline" className={`text-xs ${STATUS_STYLES[c.status] || ''}`}>{c.status}</Badge>
                        ) : c.apiKeyActive ? (
                          <Badge variant="secondary" className="text-xs text-emerald-600 bg-emerald-50 border-emerald-200">Active</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs bg-rose-50 text-rose-700 border-rose-200">Revoked</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {c.foundedYear || '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {c.revenue != null ? formatCurrency(c.revenue) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded max-w-[120px] truncate">
                            {revealed ? c.apiKey : `${c.apiKey.slice(0, 10)}•••`}
                          </code>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRevealedKeys((s) => ({ ...s, [c.id]: !s[c.id] }))}>
                                {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{revealed ? 'Hide' : 'Reveal'}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyKey(c.apiKey)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-600 hover:text-amber-700" onClick={() => regenerateKey(c)}>
                                <RotateCw className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Regenerate</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(c)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {items.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                {search
                  ? 'No companies found matching your search.'
                  : statusFilter !== 'All'
                    ? `No companies with status "${statusFilter}".`
                    : 'No companies yet.'}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination & info */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-500">
              Showing {showingFrom} to {showingTo} of {total} companies
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-500">Per page:</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-[70px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {paginationRange[0] > 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(1)} className="cursor-pointer">1</PaginationLink>
                    </PaginationItem>
                    {paginationRange[0] > 2 && <PaginationEllipsis />}
                  </>
                )}
                {paginationRange.map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {paginationRange[paginationRange.length - 1] < totalPages && (
                  <>
                    {paginationRange[paginationRange.length - 1] < totalPages - 1 && <PaginationEllipsis />}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setPage(totalPages)}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* Create dialog */}
      <CompanyFormDialog
        open={creating}
        onOpenChange={setCreating}
        lookup={lookup}
        customColumns={customColumns}
        onSaved={() => { setCreating(false); load() }}
      />
      {/* Edit dialog */}
      <CompanyFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        company={editing}
        lookup={lookup}
        customColumns={customColumns}
        onSaved={() => { setEditing(null); load() }}
      />
      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete company "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the company, its founder attachments and all annual data. This cannot be undone.
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  )
}

function CompanyFormDialog({
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
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [cityId, setCityId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [founderIds, setFounderIds] = useState<string[]>([])
  const [apiKeyActive, setApiKeyActive] = useState(true)
  const [regenerateKey, setRegenerateKey] = useState(false)
  // New fields
  const [status, setStatus] = useState('')
  const [statusReason, setStatusReason] = useState('')
  const [sinceDate, setSinceDate] = useState('')
  const [foundedYear, setFoundedYear] = useState('')
  const [discontinuedDate, setDiscontinuedDate] = useState('')
  const [branchesCount, setBranchesCount] = useState('')
  const [revenue, setRevenue] = useState('')
  const [revenueMin, setRevenueMin] = useState('')
  const [revenueMax, setRevenueMax] = useState('')
  // Custom column values
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(company?.name || '')
      setDescription(company?.description || '')
      setEmail(company?.email || '')
      setPhone(company?.phone || '')
      setWebsite(company?.website || '')
      setSectorId(company?.sectorId || '')
      setCityId(company?.cityId || '')
      setLocationId(company?.locationId || '')
      setFounderIds(company?.founders.map((f) => f.founder.id) || [])
      setApiKeyActive(company?.apiKeyActive ?? true)
      setRegenerateKey(false)
      // New fields
      setStatus(company?.status || '')
      setStatusReason(company?.statusReason || '')
      setSinceDate(company?.sinceDate || '')
      setFoundedYear(company?.foundedYear ? String(company.foundedYear) : '')
      setDiscontinuedDate(company?.discontinuedDate || '')
      setBranchesCount(company?.branchesCount != null ? String(company.branchesCount) : '')
      setRevenue(company?.revenue != null ? String(company.revenue) : '')
      setRevenueMin(company?.revenueMin != null ? String(company.revenueMin) : '')
      setRevenueMax(company?.revenueMax != null ? String(company.revenueMax) : '')
      // Custom values
      const cvMap: Record<string, string> = {}
      company?.customValues?.forEach((cv) => { cvMap[cv.customColumnId] = cv.value })
      setCustomValues(cvMap)
    }
  }, [open, company])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !sectorId || !cityId) {
      toast({ title: 'Validation', description: 'Name, sector and city are required', variant: 'destructive' })
      return
    }
    // Validate required custom columns
    for (const col of customColumns) {
      if (col.required && !customValues[col.id]?.trim()) {
        toast({ title: 'Validation', description: `"${col.name}" is required`, variant: 'destructive' })
        return
      }
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name, description, email, phone, website,
        sectorId, cityId, locationId: locationId || null,
        founderIds, apiKeyActive, regenerateKey,
        // New fields
        status: status || null,
        statusReason: statusReason || null,
        sinceDate: sinceDate || null,
        foundedYear: foundedYear ? Number(foundedYear) : null,
        discontinuedDate: discontinuedDate || null,
        branchesCount: branchesCount ? Number(branchesCount) : null,
        revenue: revenue ? Number(revenue) : null,
        revenueMin: revenueMin ? Number(revenueMin) : null,
        revenueMax: revenueMax ? Number(revenueMax) : null,
      }
      // Add custom values as a separate key
      const cvPayload = customColumns.map((col) => ({
        customColumnId: col.id,
        value: customValues[col.id] || '',
      }))
      if (cvPayload.length > 0) {
        body.customValues = cvPayload
      }

      if (company) {
        await api(`/api/admin/companies/${company.id}`, { method: 'PUT', body })
        toast({ title: 'Saved', description: 'Company updated' })
      } else {
        await api('/api/admin/companies', { method: 'POST', body })
        toast({ title: 'Created', description: 'Company added' })
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? 'Edit company' : 'New company'}</DialogTitle>
          <DialogDescription>
            {company ? 'Update the company profile and manage its API key.' : 'Add a new company to the registry. A unique API key is generated automatically.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {/* Basic info */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Company name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
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
          </div>

          {/* Status & Lifecycle */}
          <div className="border-t pt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Status & Lifecycle</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not set</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status reason</Label>
                <Input value={statusReason} onChange={(e) => setStatusReason(e.target.value)} placeholder="Optional reason" />
              </div>
              <div className="space-y-1.5">
                <Label>Founded year</Label>
                <Input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="e.g. 2018" min="1950" max="2100" />
              </div>
              <div className="space-y-1.5">
                <Label>Since date</Label>
                <Input type="date" value={sinceDate} onChange={(e) => setSinceDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Discontinued date</Label>
                <Input type="date" value={discontinuedDate} onChange={(e) => setDiscontinuedDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Branches count</Label>
                <Input type="number" value={branchesCount} onChange={(e) => setBranchesCount(e.target.value)} placeholder="0" min="0" />
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="border-t pt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue (PKR)</div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Exact revenue</Label>
                <Input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="Leave blank if using range" />
              </div>
              <div className="space-y-1.5">
                <Label>Revenue min</Label>
                <Input type="number" value={revenueMin} onChange={(e) => setRevenueMin(e.target.value)} placeholder="Min" />
              </div>
              <div className="space-y-1.5">
                <Label>Revenue max</Label>
                <Input type="number" value={revenueMax} onChange={(e) => setRevenueMax(e.target.value)} placeholder="Max" />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="border-t pt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Classification</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sector *</Label>
                <Select value={sectorId} onValueChange={setSectorId}>
                  <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                  <SelectContent>
                    {lookup?.sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>City *</Label>
                <Select value={cityId} onValueChange={setCityId}>
                  <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {lookup?.cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {lookup?.locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.address} · {l.city.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Founders */}
          <div className="border-t pt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Founders</div>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
              {lookup?.founders.length === 0 && <div className="text-xs text-muted-foreground">No founders registered yet.</div>}
              {lookup?.founders.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={founderIds.includes(f.id)}
                    onChange={(e) => setFounderIds((s) => e.target.checked ? [...s, f.id] : s.filter((x) => x !== f.id))}
                    className="accent-primary"
                  />
                  <span>{f.firstName} {f.lastName}</span>
                  <Badge variant="outline" className="text-xs ml-auto">{f.gender}</Badge>
                </label>
              ))}
            </div>
          </div>

          {/* Custom columns */}
          {customColumns.length > 0 && (
            <div className="border-t pt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Columns3 className="h-3.5 w-3.5" /> Custom Fields
              </div>
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
            </div>
          )}

          {/* API key management (edit only) */}
          {company && (
            <div className="border-t pt-3 space-y-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={apiKeyActive} onChange={(e) => setApiKeyActive(e.target.checked)} className="accent-primary" />
                <span>API key active (companies can sign in with this key)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={regenerateKey} onChange={(e) => setRegenerateKey(e.target.checked)} className="accent-primary" />
                <span className="flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> Regenerate API key (invalidates the old one)</span>
              </label>
              {regenerateKey && (
                <p className="text-xs text-amber-600">The previous key stops working immediately. You'll need to share the new one with the company.</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {company ? 'Save changes' : 'Create company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
