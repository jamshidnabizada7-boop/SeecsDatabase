'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { GraduationCap, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

interface Degree {
  id: string
  name: string
  field: string | null
  _count: { founders: number }
}

export default function DegreesPage() {
  const [items, setItems] = useState<Degree[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Degree | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Degree | null>(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const res = await api<{ items: Degree[] }>('/api/admin/degrees')
      setItems(res.items)
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
          <h1 className="text-2xl font-semibold">Degrees</h1>
          <p className="text-sm text-muted-foreground">{items.length} academic degrees held by founders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add degree
          </Button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <GraduationCap className="h-8 w-8 mx-auto mb-3 opacity-50" />
          No degrees yet. Add one to start linking founders to their qualifications.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <Card key={d.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base truncate flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    {d.name}
                  </CardTitle>
                  <Badge variant="secondary">{d._count.founders} founders</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {d.field ? <>Field: <span className="text-foreground font-medium">{d.field}</span></> : 'No field specified'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(d)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/5" onClick={() => setDeleting(d)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DegreeFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => { setCreating(false); load() }}
      />
      <DegreeFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        degree={editing}
        onSaved={() => { setEditing(null); load() }}
      />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete degree "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting._count.founders > 0
                ? `This degree is linked to ${deleting._count.founders} founder${deleting._count.founders === 1 ? '' : 's'}. You must reassign or remove them first.`
                : 'This permanently removes the degree. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await api(`/api/admin/degrees/${deleting!.id}`, { method: 'DELETE' })
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

function DegreeFormDialog({
  open,
  onOpenChange,
  degree,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  degree?: Degree | null
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [field, setField] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(degree?.name || '')
      setField(degree?.field || '')
    }
  }, [open, degree])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = { name, field: field.trim() || null }
      if (degree) {
        await api(`/api/admin/degrees/${degree.id}`, { method: 'PUT', body })
        toast({ title: 'Saved', description: 'Degree updated' })
      } else {
        await api('/api/admin/degrees', { method: 'POST', body })
        toast({ title: 'Created', description: 'Degree added' })
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{degree ? 'Edit degree' : 'New degree'}</DialogTitle>
          <DialogDescription>
            {degree ? 'Update the degree name or field.' : 'Add an academic degree that founders can hold.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BS Computer Science" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Field</Label>
            <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="e.g. Computer Science (optional)" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {degree ? 'Save changes' : 'Create degree'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
