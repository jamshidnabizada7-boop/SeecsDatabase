'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/client-utils'
import { Loader2, KeyRound, ArrowLeft, UserPlus, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Lookup {
  sectors: { id: string; name: string }[]
  cities: { id: string; name: string }[]
  locations: { id: string; address: string; city: { name: string } }[]
  degrees: { id: string; name: string }[]
}

export default function CompanyLogin({ onLoggedIn, onExit }: { onLoggedIn: (c: any) => void; onExit: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ name: string; apiKey: string } | null>(null)
  const [lookup, setLookup] = useState<Lookup | null>(null)

  // login state
  const [apiKey, setApiKey] = useState('')

  // registration state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [cityId, setCityId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  const loadLookup = async () => {
    try {
      const r = await api<Lookup>('/api/company/lookup')
      setLookup(r)
    } catch {}
  }

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const r = await api<{ ok: boolean; company: any }>('/api/company/auth/login', { method: 'POST', body: { apiKey } })
      onLoggedIn(r.company)
    } catch (e: any) {
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const r = await api<{ ok: boolean; company: { name: string; apiKey: string } }>('/api/company/register', {
        method: 'POST',
        body: { name, description, email, phone, website, sectorId, cityId, locationId: locationId || null, contactName, contactEmail, contactPhone },
      })
      setSuccess({ name: r.company.name, apiKey: r.company.apiKey })
    } catch (e: any) {
      setError(e.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Success screen after registration — green check animation
  if (success) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-background to-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-20" />
                <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white grid place-items-center shadow-lg animate-[checkBounce_0.5s_ease-out]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>
            </div>
            <CardTitle className="text-xl">Registration successful!</CardTitle>
            <CardDescription className="mt-2">
              <strong>{success.name}</strong> has been registered. Save this API key — you&apos;ll need it to sign in to the company portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Your unique API key</Label>
              <div className="flex gap-2 mt-1">
                <code className="flex-1 text-xs font-mono bg-muted px-3 py-2.5 rounded break-all">{success.apiKey}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard?.writeText(success.apiKey)}
                >
                  Copy
                </Button>
              </div>
            </div>
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Treat this key like a password. Anyone with it can sign in as your company. The SEECS admin can revoke or regenerate it if needed.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full"
              onClick={() => { setApiKey(success.apiKey); setMode('login'); setSuccess(null) }}
            >
              Continue to portal
            </Button>
          </CardContent>
        </Card>
        <style>{`
          @keyframes checkBounce {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </button>
          <div className="flex items-center gap-2">
            <Button variant={mode === 'login' ? 'default' : 'ghost'} size="sm" onClick={() => { setMode('login'); setError('') }}>
              <KeyRound className="h-4 w-4 mr-1.5" /> Sign in
            </Button>
            <Button variant={mode === 'register' ? 'default' : 'ghost'} size="sm" onClick={() => { setMode('register'); setError(''); loadLookup() }}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Register
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-10">
        {mode === 'login' ? (
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center mb-3 shadow-md">
                <KeyRound className="h-6 w-6" />
              </div>
              <CardTitle>Company portal</CardTitle>
              <CardDescription>Enter your company&apos;s API key to manage your profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk_seecs_xxxxxxxxxxxxxxxxxxxx"
                      autoComplete="off"
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Sign in
                </Button>
                <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                  Don&apos;t have a key yet?{' '}
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2 transition-colors"
                    onClick={() => { setMode('register'); setError(''); loadLookup() }}
                  >
                    <UserPlus className="h-3 w-3" />
                    Register your company
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader>
              <CardTitle>Register your company</CardTitle>
              <CardDescription>
                Fill in your company details. A unique API key will be generated for you to manage your own data.
                You will not be able to see or edit any other company&apos;s data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitRegister} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Company name *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Description</Label>
                    <textarea
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Company email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Company phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Website</Label>
                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sector *</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={sectorId}
                      onChange={(e) => setSectorId(e.target.value)}
                      required
                    >
                      <option value="">Select sector…</option>
                      {lookup?.sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>City *</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={cityId}
                      onChange={(e) => setCityId(e.target.value)}
                      required
                    >
                      <option value="">Select city…</option>
                      {lookup?.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Office location (optional)</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                    >
                      <option value="">— None —</option>
                      {lookup?.locations.map((l) => <option key={l.id} value={l.id}>{l.address} · {l.city.name}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-2 mt-2 pt-3 border-t">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Primary contact</div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact name *</Label>
                    <Input value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact email *</Label>
                    <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Contact phone</Label>
                    <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => { setMode('login'); setError('') }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Register company
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t bg-background mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground text-center">
          Each company can only see and modify its own data. Misuse of an API key should be reported to the SEECS admin.
        </div>
      </footer>
    </div>
  )
}
