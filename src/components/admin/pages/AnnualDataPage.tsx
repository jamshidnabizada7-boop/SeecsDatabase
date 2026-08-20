'use client'

import { useEffect, useState } from 'react'
import { api, formatCurrency } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { BarChart3, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

interface AnnualData {
  id: string
  companyId: string
  year: number
  monthlyRevenue: number
  totalRevenue: number
  employeeCount: number
  projectCount: number
  notes: string | null
  company: { id: string; name: string; sector: { name: string } }
}

interface CompanyLite {
  id: string
  name: string
}

export default function AnnualDataPage() {
  const [items, setItems] = useState<AnnualData[]>([])
  const [companies, setCompanies] = useState<CompanyLite[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AnnualData | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<AnnualData | null>(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const [adRes, coRes] = await Promise.all([
        api<{ items: AnnualData[] }>('/api/admin/annual-data'),
        api<{ items: CompanyLite[] }>('/api/admin/companies'),
      ])
      setItems(adRes.items)
      setCompanies(coRes.items)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
     
  }, [])

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name || '—'

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Annual Data</h1>
          <p className="text-sm text-muted-foreground">{items.length} yearly records across companies.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add record
          </Button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-50" />
          No annual data records yet. Add one to start tracking company metrics.
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Company</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Year</TableHead>
                  <TableHead className="text-right">Monthly rev.</TableHead>
                  <TableHead className="text-right">Total rev.</TableHead>
                  <TableHead className="text-right">Employees</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.company.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{a.company.sector.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{a.year}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(a.monthlyRevenue)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(a.totalRevenue)}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.employeeCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.projectCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditing(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive/5" onClick={() => setDeleting(a)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AnnualDataFormDialog
        open={creating}
        onOpenChange={setCreating}
        companies={companies}
        onSaved={() => { setCreating(false); load() }}
      />
      <AnnualDataFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        record={editing}
        companies={companies}
        onSaved={() => { setEditing(null); load() }}
      />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete annual record?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block font-medium mb-1">{deleting?.company.name} · {deleting?.year}</span>
              This permanently removes the annual data record. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await api(`/api/admin/annual-data/${deleting!.id}`, { method: 'DELETE' })
                  toast({ title: 'Deleted', description: 'Annual record removed' })
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

function AnnualDataFormDialog({
  open,
  onOpenChange,
  record,
  companies,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  record?: AnnualData | null
  companies: CompanyLite[]
  onSaved: () => void
}) {
  const [companyId, setCompanyId] = useState('')
  const [year, setYear] = useState<string>(String(new Date().getFullYear() - 1))
  const [monthlyRevenue, setMonthlyRevenue] = useState('0')
  const [totalRevenue, setTotalRevenue] = useState('0')
  const [employeeCount, setEmployeeCount] = useState('0')
  const [projectCount, setProjectCount] = useState('0')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setCompanyId(record?.companyId || '')
      setYear(record ? String(record.year) : String(new Date().getFullYear() - 1))
      setMonthlyRevenue(record ? String(record.monthlyRevenue) : '0')
      setTotalRevenue(record ? String(record.totalRevenue) : '0')
      setEmployeeCount(record ? String(record.employeeCount) : '0')
      setProjectCount(record ? String(record.projectCount) : '0')
      setNotes(record?.notes || '')
    }
  }, [open, record])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!record && !companyId) {
      toast({ title: 'Validation', description: 'Company is required', variant: 'destructive' })
      return
    }
    const y = Number(year)
    const mr = Number(monthlyRevenue)
    const tr = Number(totalRevenue)
    const ec = Number(employeeCount)
    const pc = Number(projectCount)
    if (!Number.isFinite(y) || !Number.isFinite(mr) || !Number.isFinite(tr) || !Number.isFinite(ec) || !Number.isFinite(pc)) {
      toast({ title: 'Validation', description: 'Numeric fields must be valid numbers', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = {
        year: y,
        monthlyRevenue: mr,
        totalRevenue: tr,
        employeeCount: ec,
        projectCount: pc,
        notes: notes.trim() || null,
      }
      if (record) {
        await api(`/api/admin/annual-data/${record.id}`, { method: 'PUT', body })
        toast({ title: 'Saved', description: 'Annual record updated' })
      } else {
        await api('/api/admin/annual-data', { method: 'POST', body: { ...body, companyId } })
        toast({ title: 'Created', description: 'Annual record added' })
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
          <DialogTitle>{record ? 'Edit annual record' : 'New annual record'}</DialogTitle>
          <DialogDescription>
            {record
              ? `Update metrics for ${record.company.name} (${record.year}). Company cannot be changed.`
              : 'Add yearly metrics for a company. Each company/year combination must be unique.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Company {!record && '*'}</Label>
              <Select value={companyId} onValueChange={setCompanyId} disabled={!!record}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {record && (
                <p className="text-xs text-muted-foreground">Company is fixed once a record is created.</p>
              )}
              {companies.length === 0 && (
                <p className="text-xs text-amber-600">No companies available. Add a company first.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Year *</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} min="1900" max="2100" />
            </div>
            <div className="space-y-1.5">
              <Label>Employees</Label>
              <Input type="number" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} min="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly revenue (PKR)</Label>
              <Input type="number" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(e.target.value)} min="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Total revenue (PKR)</Label>
              <Input type="number" value={totalRevenue} onChange={(e) => setTotalRevenue(e.target.value)} min="0" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Projects</Label>
              <Input type="number" value={projectCount} onChange={(e) => setProjectCount(e.target.value)} min="0" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional context, milestones, data sources…" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {record ? 'Save changes' : 'Create record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
