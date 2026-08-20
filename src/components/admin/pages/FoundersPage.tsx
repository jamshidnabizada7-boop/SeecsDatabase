'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, Pencil, Phone, Plus, RefreshCw, Trash2, User, Users, Building } from 'lucide-react'

type Gender = 'Male' | 'Female' | 'Other'

interface Founder {
  id: string
  firstName: string
  lastName: string
  gender: Gender
  email: string | null
  phone: string | null
  department: string | null
  degree: { id: string; name: string } | null
  _count: { companies: number }
}

interface LookupDegree {
  id: string
  name: string
  field: string | null
}

const GENDER_STYLES: Record<Gender, string> = {
  Male: 'bg-sky-50 text-sky-700 border-sky-200',
  Female: 'bg-pink-50 text-pink-700 border-pink-200',
  Other: 'bg-violet-50 text-violet-700 border-violet-200',
}

export default function FoundersPage() {
  const [items, setItems] = useState<Founder[]>([])
  const [degrees, setDegrees] = useState<LookupDegree[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Founder | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Founder | null>(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const [fRes, lookupRes] = await Promise.all([
        api<{ items: Founder[] }>('/api/admin/founders'),
        api<{ degrees: LookupDegree[] }>('/api/lookup'),
      ])
      setItems(fRes.items)
      setDegrees(lookupRes.degrees)
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
          <h1 className="text-2xl font-semibold">Founders</h1>
          <p className="text-sm text-muted-foreground">{items.length} founders registered across companies.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add founder
          </Button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
          No founders yet. Add one to start linking them to companies.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{f.firstName} {f.lastName}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {[f.department, f.degree?.name].filter(Boolean).join(' · ') || 'No degree on file'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${GENDER_STYLES[f.gender]}`}>{f.gender}</Badge>
                </div>

                <div className="space-y-1 text-sm">
                  {f.department && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{f.department}</span>
                    </div>
                  )}
                  {f.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{f.email}</span>
                    </div>
                  )}
                  {f.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{f.phone}</span>
                    </div>
                  )}
                  {!f.department && !f.email && !f.phone && (
                    <p className="text-xs text-muted-foreground italic">No contact info</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t">
                  <Badge variant="secondary" className="text-xs">{f._count.companies} compan{f._count.companies === 1 ? 'y' : 'ies'}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditing(f)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive/5" onClick={() => setDeleting(f)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FounderFormDialog
        open={creating}
        onOpenChange={setCreating}
        degrees={degrees}
        onSaved={() => { setCreating(false); load() }}
      />
      <FounderFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        founder={editing}
        degrees={degrees}
        onSaved={() => { setEditing(null); load() }}
      />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete founder "{deleting?.firstName} {deleting?.lastName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting._count.companies > 0
                ? `This founder is linked to ${deleting._count.companies} compan${deleting._count.companies === 1 ? 'y' : 'ies'}. You must detach them first.`
                : 'This permanently removes the founder profile. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await api(`/api/admin/founders/${deleting!.id}`, { method: 'DELETE' })
                  toast({ title: 'Deleted', description: `${deleting!.firstName} ${deleting!.lastName} removed` })
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

function FounderFormDialog({
  open,
  onOpenChange,
  founder,
  degrees,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  founder?: Founder | null
  degrees: LookupDegree[]
  onSaved: () => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState<Gender>('Male')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')
  const [degreeId, setDegreeId] = useState('none')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setFirstName(founder?.firstName || '')
      setLastName(founder?.lastName || '')
      setGender(founder?.gender || 'Male')
      setEmail(founder?.email || '')
      setPhone(founder?.phone || '')
      setDepartment(founder?.department || '')
      setDegreeId(founder?.degree?.id || 'none')
    }
  }, [open, founder])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: 'Validation', description: 'First and last name are required', variant: 'destructive' })
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Validation', description: 'Email is not valid', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = {
        firstName,
        lastName,
        gender,
        email: email.trim() || null,
        phone: phone.trim() || null,
        department: department.trim() || null,
        degreeId: degreeId === 'none' ? null : degreeId,
      }
      if (founder) {
        await api(`/api/admin/founders/${founder.id}`, { method: 'PUT', body })
        toast({ title: 'Saved', description: 'Founder updated' })
      } else {
        await api('/api/admin/founders', { method: 'POST', body })
        toast({ title: 'Created', description: 'Founder added' })
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
          <DialogTitle>{founder ? 'Edit founder' : 'New founder'}</DialogTitle>
          <DialogDescription>
            {founder ? 'Update this founder profile.' : 'Add a new founder that can be linked to companies.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Last name *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Gender *</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Science" />
            </div>
            <div className="space-y-1.5">
              <Label>Degree</Label>
              <Select value={degreeId} onValueChange={setDegreeId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {degrees.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="founder@example.com" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 0000000" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {founder ? 'Save changes' : 'Create founder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
