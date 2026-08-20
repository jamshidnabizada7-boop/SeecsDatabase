'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client-utils'
import { Skeleton } from '@/components/ui/skeleton'
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
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/20">
        <div className="border-b bg-background/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Header skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[88px] rounded-xl border bg-background" />
            ))}
          </div>
          {/* Content skeleton */}
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!company) {
    return <CompanyLogin onLoggedIn={(c) => setCompany(c)} onExit={onExit} />
  }

  return <CompanyPortal company={company} onLogout={async () => { await api('/api/company/auth/logout', { method: 'POST' }); setCompany(null); onExit() }} />
}
