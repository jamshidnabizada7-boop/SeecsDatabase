'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client-utils'
import AdminLogin from './AdminLogin'
import AdminShell from './AdminShell'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

export default function AdminApp({ onExit }: { onExit: () => void }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ admin: AdminUser | null }>('/api/admin/auth/me')
      setAdmin(r.admin)
    } catch {
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading admin…</div>
      </div>
    )
  }

  if (!admin) {
    return <AdminLogin onLoggedIn={(a) => setAdmin(a)} />
  }

  return <AdminShell admin={admin} onLogout={async () => { await api('/api/admin/auth/logout', { method: 'POST' }); setAdmin(null); onExit() }} />
}
