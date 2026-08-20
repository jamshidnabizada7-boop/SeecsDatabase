'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api, formatDate } from '@/lib/client-utils'
import { useToast } from '@/hooks/use-toast'
import {
  KeyRound,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  UserCheck,
  RefreshCw,
} from 'lucide-react'

interface AdminUserItem {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export default function AdminSecurityPage() {
  const { toast } = useToast()

  // Profile Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')

  // Team managers list
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [currentAdminId, setCurrentAdminId] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Add Manager dialog
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newManagerPw, setNewManagerPw] = useState('')
  const [newRole, setNewRole] = useState('admin')
  const [addingUser, setAddingUser] = useState(false)

  // Reset password dialog
  const [resetOpen, setResetOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [resetPw, setResetPw] = useState('')
  const [resettingPw, setResettingPw] = useState(false)

  const loadProfile = async () => {
    try {
      const r = await api<{ admin: AdminUserItem }>('/api/admin/auth/profile')
      if (r?.admin) {
        setName(r.admin.name || '')
        setEmail(r.admin.email || '')
      }
    } catch {}
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const r = await api<{ users: AdminUserItem[]; currentAdminId: string }>('/api/admin/auth/users')
      setUsers(r.users || [])
      setCurrentAdminId(r.currentAdminId || '')
    } catch {} finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadProfile()
    loadUsers()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg('')
    setProfileErr('')

    if (newPassword && newPassword.length < 6) {
      setProfileErr('New password must be at least 6 characters long')
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      setProfileErr('New passwords do not match')
      return
    }

    setSavingProfile(true)
    try {
      const r = await api<{ ok: boolean; message: string }>('/api/admin/auth/profile', {
        method: 'PUT',
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        },
      })
      setProfileMsg(r.message || 'Profile and credentials updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({ title: 'Success', description: 'Admin profile and password updated.' })
      loadUsers()
    } catch (e: any) {
      setProfileErr(e.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim() || !newManagerPw.trim()) return
    setAddingUser(true)
    try {
      await api('/api/admin/auth/users', {
        method: 'POST',
        body: {
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newManagerPw,
          role: newRole,
        },
      })
      toast({ title: 'Success', description: 'New Database Manager added.' })
      setAddOpen(false)
      setNewName('')
      setNewEmail('')
      setNewManagerPw('')
      loadUsers()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    } finally {
      setAddingUser(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !resetPw.trim()) return
    setResettingPw(true)
    try {
      await api(`/api/admin/auth/users/${selectedUser.id}`, {
        method: 'PUT',
        body: { password: resetPw },
      })
      toast({ title: 'Password Reset', description: `Password updated for ${selectedUser.name}` })
      setResetOpen(false)
      setResetPw('')
      setSelectedUser(null)
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    } finally {
      setResettingPw(false)
    }
  }

  const handleDeleteUser = async (u: AdminUserItem) => {
    if (!confirm(`Are you sure you want to remove database manager access for ${u.name} (${u.email})?`)) return
    try {
      await api(`/api/admin/auth/users/${u.id}`, { method: 'DELETE' })
      toast({ title: 'Removed', description: `${u.name} removed from admin access.` })
      loadUsers()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. My Profile & Password Card */}
      <Card className="border-stone-200/80 dark:border-stone-800/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 grid place-items-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Database Manager Profile & Password</CardTitle>
                <CardDescription>
                  Set your official SEECS credentials. Changes take effect immediately.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Active Manager
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-name">Full Name / Title</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Maajid Maqbool"
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-prof-email">Official University Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-prof-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maajid.maqbool@seecs.edu.pk"
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Change Password (Leave blank to keep current)
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="current-pw">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current-pw"
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password if changing"
                    className="pl-9 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-pw"
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="pl-9 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw">Confirm New Password</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {profileErr && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{profileErr}</AlertDescription>
              </Alert>
            )}

            {profileMsg && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-sm">{profileMsg}</AlertDescription>
              </Alert>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={savingProfile} className="bg-emerald-600 hover:bg-emerald-700">
                {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Profile & Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Team & Additional Database Managers */}
      <Card className="border-stone-200/80 dark:border-stone-800/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                Authorized Database Managers
              </CardTitle>
              <CardDescription>
                Faculty and administrators with access to the SEECS company registry.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)} className="h-8 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Manager
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border rounded-md border">
            {users.map((u) => {
              const isMe = u.id === currentAdminId
              return (
                <div key={u.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold text-xs shrink-0">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{u.name}</span>
                        {isMe && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            You
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {u.role}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{u.email}</span>
                        <span>·</span>
                        <span>Added {formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedUser(u); setResetOpen(true) }}
                      className="h-7 text-xs"
                    >
                      Reset Password
                    </Button>
                    {!isMe && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(u)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
            {users.length === 0 && !loadingUsers && (
              <div className="p-6 text-center text-sm text-muted-foreground">No additional database managers.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Add New Manager */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddManager}>
            <DialogHeader>
              <DialogTitle>Add Database Manager</DialogTitle>
              <DialogDescription>
                Create access for a professor, department chair, or administrative assistant.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="space-y-1">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Dr. Ayesha Khan" required />
              </div>
              <div className="space-y-1">
                <Label>University Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="ayesha@seecs.edu.pk" required />
              </div>
              <div className="space-y-1">
                <Label>Initial Password <span className="text-destructive">*</span></Label>
                <Input type="password" value={newManagerPw} onChange={(e) => setNewManagerPw(e.target.value)} placeholder="Min 6 characters" required />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="admin">Admin (Manage data & companies)</option>
                  <option value="superadmin">Superadmin (Full access)</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addingUser} className="bg-emerald-600 hover:bg-emerald-700">
                {addingUser && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Manager
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reset Password */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Set a new password for <strong className="text-foreground">{selectedUser?.name}</strong> ({selectedUser?.email}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="space-y-1">
                <Label>New Password <span className="text-destructive">*</span></Label>
                <Input
                  type="password"
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={resettingPw} className="bg-emerald-600 hover:bg-emerald-700">
                {resettingPw && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save New Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
