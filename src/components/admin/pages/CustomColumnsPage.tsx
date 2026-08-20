'use client'

import { useEffect, useState } from 'react'
import { api, formatDate } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Columns3, Loader2, Pencil, Plus, RefreshCw, Trash2, GripVertical } from 'lucide-react'

interface CustomColumn {
  id: string
  name: string
  slug: string
  columnType: string
  targetTable: string
  description: string | null
  required: boolean
  sortOrder: number
  createdAt: string
  _count: { values: number }
}

const COLUMN_TYPE_BADGES: Record<string, string> = {
  text: 'bg-sky-50 text-sky-700 border-sky-200',
  number: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  date: 'bg-amber-50 text-amber-700 border-amber-200',
  boolean: 'bg-violet-50 text-violet-700 border-violet-200',
  url: 'bg-rose-50 text-rose-700 border-rose-200',
}

const TARGET_BADGES: Record<string, string> = {
  company: 'bg-primary/10 text-primary border-primary/20',
  founder: 'bg-orange-50 text-orange-700 border-orange-200',
}

export default function CustomColumnsPage() {
  const [items, setItems] = useState<CustomColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CustomColumn | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<CustomColumn | null>(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const r = await api<{ items: CustomColumn[] }>('/api/admin/custom-columns')
      setItems(r.items)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Custom Columns</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} dynamic field{items.length === 1 ? '' : 's'} defined. These appear on company and founder forms.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add column
          </Button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Columns3 className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No custom columns defined yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add columns to extend company or founder records with extra data fields.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((col) => (
            <Card key={col.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{col.name}</h3>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{col.slug}</code>
                        <Badge variant="outline" className={`text-xs ${COLUMN_TYPE_BADGES[col.columnType] || ''}`}>{col.columnType}</Badge>
                        <Badge variant="outline" className={`text-xs ${TARGET_BADGES[col.targetTable] || ''}`}>{col.targetTable}</Badge>
                        {col.required && <Badge variant="destructive" className="text-xs bg-red-50 text-red-700 border-red-200">required</Badge>}
                      </div>
                      {col.description && <p className="text-sm text-muted-foreground mt-1">{col.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Sort: {col.sortOrder}</span>
                        <span>{col._count.values} value{col._count.values === 1 ? '' : 's'} filled</span>
                        <span>Created {formatDate(col.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 sm:ml-auto">
                    <Button variant="outline" size="sm" onClick={() => setEditing(col)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/5" onClick={() => setDeleting(col)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <ColumnFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => { setCreating(false); load() }}
      />
      <ColumnFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        column={editing}
        onSaved={() => { setEditing(null); load() }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete column &quot;{deleting?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the column and <strong>all {deleting?._count.values || 0} stored value{(deleting?._count.values || 0) === 1 ? '' : 's'}</strong> across all {(deleting?.targetTable || 'company')} records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await api(`/api/admin/custom-columns/${deleting!.id}`, { method: 'DELETE' })
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

function ColumnFormDialog({
  open,
  onOpenChange,
  column,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  column?: CustomColumn | null
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [columnType, setColumnType] = useState('text')
  const [targetTable, setTargetTable] = useState('company')
  const [description, setDescription] = useState('')
  const [required, setRequired] = useState(false)
  const [sortOrder, setSortOrder] = useState('0')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(column?.name || '')
      setColumnType(column?.columnType || 'text')
      setTargetTable(column?.targetTable || 'company')
      setDescription(column?.description || '')
      setRequired(column?.required || false)
      setSortOrder(column?.sortOrder != null ? String(column.sortOrder) : '0')
    }
  }, [open, column])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = {
        name,
        columnType,
        targetTable,
        description: description.trim() || null,
        required,
        sortOrder: Number(sortOrder),
      }
      if (column) {
        await api(`/api/admin/custom-columns/${column.id}`, { method: 'PUT', body })
        toast({ title: 'Saved', description: 'Column updated' })
      } else {
        await api('/api/admin/custom-columns', { method: 'POST', body })
        toast({ title: 'Created', description: 'Column added' })
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{column ? 'Edit column' : 'New custom column'}</DialogTitle>
          <DialogDescription>
            {column ? 'Update the column configuration.' : 'Define a new dynamic field. It will appear on the relevant forms automatically.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Column name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Number of Awards" autoFocus />
            <p className="text-xs text-muted-foreground">The slug (machine name) is auto-generated from this.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data type</Label>
              <Select value={columnType} onValueChange={setColumnType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target table</Label>
              <Select value={targetTable} onValueChange={setTargetTable}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="founder">Founder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} min="0" />
            </div>
            <div className="space-y-1.5 flex items-end gap-3 pb-0.5">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="accent-primary"
                />
                <span>Required</span>
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Shown to companies as a hint when filling in this field."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {column ? 'Save changes' : 'Create column'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
