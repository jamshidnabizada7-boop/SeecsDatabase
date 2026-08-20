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
import { MapPinned, Loader2, Pencil, Plus, RefreshCw, Trash2, Globe } from 'lucide-react'

interface Location {
  id: string
  address: string
  country: string
  createdAt: string
  city: { id: string; name: string }
  _count: { companies: number }
}

interface LookupCity {
  id: string
  name: string
}

export default function LocationsPage() {
  const [items, setItems] = useState<Location[]>([])
  const [cities, setCities] = useState<LookupCity[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Location | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Location | null>(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const [locRes, lookupRes] = await Promise.all([
        api<{ items: Location[] }>('/api/admin/locations'),
        api<{ cities: LookupCity[] }>('/api/lookup'),
      ])
      setItems(locRes.items)
      setCities(lookupRes.cities)
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
          <h1 className="text-2xl font-semibold">Locations</h1>
          <p className="text-sm text-muted-foreground">{items.length} physical addresses grouped by city.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add location
          </Button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <MapPinned className="h-8 w-8 mx-auto mb-3 opacity-50" />
          No locations yet. Add an address to start geo-tagging companies.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((l) => (
            <Card key={l.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <MapPinned className="h-4 w-4 text-muted-foreground shrink-0" />
                      <h3 className="font-semibold truncate">{l.address}</h3>
                      {l.country && l.country !== 'Pakistan' && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {l.country}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{l.city.name}</Badge>
                      <Badge variant="secondary" className="text-xs">{l._count.companies} companies</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">Added {formatDate(l.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setEditing(l)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/5" onClick={() => setDeleting(l)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LocationFormDialog
        open={creating}
        onOpenChange={setCreating}
        cities={cities}
        onSaved={() => { setCreating(false); load() }}
      />
      <LocationFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        location={editing}
        cities={cities}
        onSaved={() => { setEditing(null); load() }}
      />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this location?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block font-medium mb-1">{deleting?.address}</span>
              {deleting && deleting._count.companies > 0
                ? `This location is linked to ${deleting._count.companies} compan${deleting._count.companies === 1 ? 'y' : 'ies'}. You must reassign or remove them first.`
                : 'This permanently removes the location. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await api(`/api/admin/locations/${deleting!.id}`, { method: 'DELETE' })
                  toast({ title: 'Deleted', description: 'Location removed' })
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

function LocationFormDialog({
  open,
  onOpenChange,
  location,
  cities,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  location?: Location | null
  cities: LookupCity[]
  onSaved: () => void
}) {
  const [address, setAddress] = useState('')
  const [country, setCountry] = useState('Pakistan')
  const [cityId, setCityId] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setAddress(location?.address || '')
      setCountry(location?.country || 'Pakistan')
      setCityId(location?.city.id || '')
    }
  }, [open, location])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim() || !cityId) {
      toast({ title: 'Validation', description: 'Address and city are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = { address, country: country.trim() || 'Pakistan', cityId }
      if (location) {
        await api(`/api/admin/locations/${location.id}`, { method: 'PUT', body })
        toast({ title: 'Saved', description: 'Location updated' })
      } else {
        await api('/api/admin/locations', { method: 'POST', body })
        toast({ title: 'Created', description: 'Location added' })
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
          <DialogTitle>{location ? 'Edit location' : 'New location'}</DialogTitle>
          <DialogDescription>
            {location ? 'Update the address or city for this location.' : 'Add a physical address that companies can be linked to.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Address *</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Street, building, area…" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Pakistan" />
            </div>
            <div className="space-y-1.5">
              <Label>City *</Label>
              <Select value={cityId} onValueChange={setCityId}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {cities.length === 0 && (
                <p className="text-xs text-amber-600">No cities available. Add a city first.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {location ? 'Save changes' : 'Create location'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
