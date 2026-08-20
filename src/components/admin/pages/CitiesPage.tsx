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
import { MapPin, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

interface City {
  id: string
  name: string
  _count: { companies: number }
}

export default function CitiesPage() {
  const [items, setItems] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<City | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<City | null>(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const res = await api<{ items: City[] }>('/api/admin/cities')
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
          <h1 className="text-2xl font-semibold">Cities</h1>
          <p className="text-sm text-muted-foreground">{items.length} cities where companies are based.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add city
          </Button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-3 opacity-50" />
          No cities yet. Add one to start geo-tagging companies.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base truncate flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {c.name}
                  </CardTitle>
                  <Badge variant="secondary">{c._count.companies} companies</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(c)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/5" onClick={() => setDeleting(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CityFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => { setCreating(false); load() }}
      />
      <CityFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        city={editing}
        onSaved={() => { setEditing(null); load() }}
      />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete city "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting._count.companies > 0
                ? `This city is linked to ${deleting._count.companies} compan${deleting._count.companies === 1 ? 'y' : 'ies'}. You must reassign or remove them first.`
                : 'This permanently removes the city. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await api(`/api/admin/cities/${deleting!.id}`, { method: 'DELETE' })
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

function CityFormDialog({
  open,
  onOpenChange,
  city,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  city?: City | null
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) setName(city?.name || '')
  }, [open, city])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      if (city) {
        await api(`/api/admin/cities/${city.id}`, { method: 'PUT', body: { name } })
        toast({ title: 'Saved', description: 'City updated' })
      } else {
        await api('/api/admin/cities', { method: 'POST', body: { name } })
        toast({ title: 'Created', description: 'City added' })
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
          <DialogTitle>{city ? 'Edit city' : 'New city'}</DialogTitle>
          <DialogDescription>
            {city ? 'Rename this city.' : 'Add a new city where companies can be located.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Islamabad" autoFocus />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {city ? 'Save changes' : 'Create city'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
