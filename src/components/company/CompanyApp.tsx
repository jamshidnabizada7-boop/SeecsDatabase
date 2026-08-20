'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client-utils'
import CompanyLogin from './CompanyLogin'
import CompanyPortal from './CompanyPortal'

interface CompanyUser {
  id: string
  name: string
  sector: string
  city: string
}

export default function CompanyApp({ onExit }: { onExit: () => void }) {
  const [company, setCompany] = useState<CompanyUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ company: CompanyUser | null }>('/api/company/auth/me')
      setCompany(r.company)
    } catch {
      setCompany(null)
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
        <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
      </div>
    )
  }

  if (!company) {
    return <CompanyLogin onLoggedIn={(c) => setCompany(c)} onExit={onExit} />
  }

  return <CompanyPortal company={company} onLogout={async () => { await api('/api/company/auth/logout', { method: 'POST' }); setCompany(null); onExit() }} />
}
