'use client'

import { useEffect, useState, useCallback } from 'react'
import Landing from '@/components/seecs/Landing'
import AdminApp from '@/components/admin/AdminApp'
import CompanyApp from '@/components/company/CompanyApp'
import { Toaster } from '@/components/ui/toaster'
import { Loader2 } from 'lucide-react'

type View = 'landing' | 'admin' | 'company'

export default function Home() {
  const [view, setView] = useState<View>('landing')
  const [booted, setBooted] = useState(false)

  // On first load, probe both sessions so we can resume into the right view.
  const probe = useCallback(async () => {
    try {
      const [adminRes, companyRes] = await Promise.all([
        fetch('/api/admin/auth/me', { credentials: 'include' }).then((r) => r.json()).catch(() => ({ admin: null })),
        fetch('/api/company/auth/me', { credentials: 'include' }).then((r) => r.json()).catch(() => ({ company: null })),
      ])
      if (adminRes?.admin) setView('admin')
      else if (companyRes?.company) setView('company')
      else setView('landing')
    } catch {
      setView('landing')
    } finally {
      setBooted(true)
    }
  }, [])

  useEffect(() => {
    probe()
  }, [probe])

  if (!booted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {view === 'landing' && <Landing onEnterAdmin={() => setView('admin')} onEnterCompany={() => setView('company')} />}
      {view === 'admin' && <AdminApp onExit={() => { setView('landing'); probe() }} />}
      {view === 'company' && <CompanyApp onExit={() => { setView('landing'); probe() }} />}
      <Toaster />
    </>
  )
}
