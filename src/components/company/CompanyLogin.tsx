'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/client-utils'
import {
  Loader2,
  KeyRound,
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Trash2,
  Users,
  Globe,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { Combobox } from '@/components/ui/combobox'

interface Lookup {
  sectors: { id: string; name: string }[]
  cities: { id: string; name: string }[]
  locations: { id: string; address: string; city: { name: string } }[]
  degrees: { id: string; name: string }[]
}

interface CoFounderEntry {
  name: string
  role: string
  email: string
  department: string
}

const COMMON_COUNTRIES = [
  { value: 'United States', label: 'United States (USA)' },
  { value: 'United Kingdom', label: 'United Kingdom (UK)' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates (UAE)' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Qatar', label: 'Qatar' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'China', label: 'China' },
]

export default function CompanyLogin({ onLoggedIn, onExit }: { onLoggedIn: (c: any) => void; onExit: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ name: string; apiKey: string } | null>(null)
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [showKey, setShowKey] = useState(false)

  // login state
  const [apiKey, setApiKey] = useState('')
  const [apiKeyTouched, setApiKeyTouched] = useState(false)

  // registration state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [sector, setSector] = useState('')
  const [city, setCity] = useState('')
  const [isInternational, setIsInternational] = useState(false)
  const [country, setCountry] = useState('United States')
  const [internationalCity, setInternationalCity] = useState('')
  const [address, setAddress] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [coFounders, setCoFounders] = useState<CoFounderEntry[]>([])

  // Validation
  const apiKeyValid = apiKey.trim().length >= 8
  const nameValid = name.trim().length >= 2
  const contactNameValid = contactName.trim().length >= 2
  const contactEmailValid = !contactEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())
  const websiteValid = !website.trim() || website.trim().startsWith('http') || /^[\w.-]+\.[a-z]{2,}$/i.test(website.trim())
  const effectiveCity = isInternational ? (internationalCity.trim() ? `${internationalCity.trim()} (${country.trim()})` : '') : city.trim()

  const loadLookup = async () => {
    try {
      const r = await api<Lookup>('/api/company/lookup')
      setLookup(r)
    } catch {}
  }

  useEffect(() => {
    loadLookup()
  }, [])

  const addCoFounder = () => {
    setCoFounders([...coFounders, { name: '', role: 'Co-Founder', email: '', department: '' }])
  }

  const updateCoFounder = (index: number, field: keyof CoFounderEntry, val: string) => {
    const updated = [...coFounders]
    updated[index][field] = val
    setCoFounders(updated)
  }

  const removeCoFounder = (index: number) => {
    setCoFounders(coFounders.filter((_, i) => i !== index))
  }

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiKeyTouched(true)
    if (!apiKeyValid) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/company/auth/me?login=1&apiKey=${encodeURIComponent(apiKey.trim())}`, {
        method: 'GET',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.ok && data.company) {
        onLoggedIn(data.company)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (e: any) {
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sector.trim() || !effectiveCity || !nameValid || !contactNameValid || !contactEmailValid) return
    setLoading(true)
    setError('')
    try {
      const r = await api<{ ok: boolean; company: { name: string; apiKey: string } }>('/api/company/register', {
        method: 'POST',
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          sectorId: sector.trim(),
          cityId: effectiveCity,
          country: isInternational ? country.trim() : 'Pakistan',
          address: address.trim() || undefined,
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || undefined,
          founders: coFounders.filter((f) => f.name.trim().length > 0),
        },
      })
      setSuccess({ name: r.company.name, apiKey: r.company.apiKey })
    } catch (e: any) {
      setError(e.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Success screen after registration
  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-background to-background dark:from-emerald-950/30">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <button onClick={onExit} className="flex items-center gap-2 text-sm text-stone-500 hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 grid place-items-center px-4 py-10">
          <Card className="w-full max-w-md shadow-xl border-emerald-200 dark:border-emerald-800">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-5 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                  <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white grid place-items-center shadow-lg animate-[checkBounce_0.5s_ease-out]">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-xl text-center">Registration successful!</CardTitle>
              <CardDescription className="mt-2 text-center">
                <strong className="text-foreground">{success.name}</strong> has been registered. Save your API key — you&apos;ll need it to sign in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your unique API key</Label>
                <div className="flex gap-2 mt-2">
                  <code className="flex-1 text-xs font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 px-3 py-3 rounded-lg break-all border border-emerald-200 dark:border-emerald-800">
                    {success.apiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    onClick={() => navigator.clipboard?.writeText(success.apiKey)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Treat this key like a password. Anyone with it can sign in as your company. Store it securely.
                </AlertDescription>
              </Alert>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => { setApiKey(success.apiKey); setMode('login'); setSuccess(null) }}
              >
                Continue to portal
              </Button>
            </CardContent>
          </Card>
        </main>

        <footer className="border-t bg-background mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground text-center">
            SEECS Company Registry · NUST Islamabad
          </div>
        </footer>
      </div>
    )
  }

  const sectorOptions = (lookup?.sectors || []).map((s) => ({ value: s.id, label: s.name }))
  const cityOptions = (lookup?.cities || []).map((c) => ({ value: c.id, label: c.name }))

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-background to-teal-50/40 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/15" />
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-teal-200/30 dark:bg-teal-900/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-emerald-100/20 dark:bg-emerald-900/10 blur-3xl" />
      </div>

      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to home
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex rounded-lg border bg-muted/50 p-0.5">
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  mode === 'login'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => { setMode('login'); setError('') }}
              >
                <KeyRound className="h-4 w-4" /> Sign in
              </button>
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  mode === 'register'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => { setMode('register'); setError(''); loadLookup() }}
              >
                <UserPlus className="h-4 w-4" /> Register
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-10">
        {mode === 'login' ? (
          <Card className="w-full max-w-md shadow-xl border-stone-200/80 dark:border-stone-800/80">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center mb-4 shadow-lg shadow-emerald-500/20">
                <Building2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl">Company portal</CardTitle>
              <CardDescription className="mt-1">
                Enter your company&apos;s API key to manage your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="apiKey"
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); if (apiKeyTouched) setError('') }}
                      onBlur={() => setApiKeyTouched(true)}
                      placeholder="sk_seecs_xxxxxxxxxxxxxxxxxxxx"
                      autoComplete="off"
                      required
                      className={`pl-9 pr-10 ${apiKeyTouched && !apiKeyValid ? 'border-destructive focus-visible:ring-destructive/30' : 'focus-visible:ring-emerald-500/30'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {apiKeyTouched && !apiKeyValid && (
                    <p className="text-xs text-destructive">API key must be at least 8 characters</p>
                  )}
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                  disabled={loading || (apiKeyTouched && !apiKeyValid)}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                  Sign in
                </Button>
                <p className="text-xs text-muted-foreground text-center pt-3 border-t">
                  Don&apos;t have a key yet?{' '}
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium underline underline-offset-2 transition-colors"
                    onClick={() => { setMode('register'); setError(''); loadLookup() }}
                  >
                    <Sparkles className="h-3 w-3" />
                    Register your company
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-2xl shadow-xl border-stone-200/80 dark:border-stone-800/80">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center shadow-sm">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Register your company</CardTitle>
                  <CardDescription>
                    Fill in your company details. Choose from extensive sector/city lists or enter custom location.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitRegister} className="space-y-6">
                {/* 1. Company Info Section */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" /> 1. Company Information
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Company name <span className="text-destructive">*</span></Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. TechVentures Pvt. Ltd."
                        required
                        className={!nameValid && name.length > 0 ? 'border-destructive' : ''}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Description</Label>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Brief description of products, services, or focus..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Company email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@company.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Company phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 0000000" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Website</Label>
                      <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://company.com"
                        className={!websiteValid && website.length > 0 ? 'border-destructive' : ''}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Sector / Industry <span className="text-destructive">*</span></Label>
                      <Combobox
                        options={sectorOptions}
                        value={sector}
                        onChange={setSector}
                        placeholder="Select or type sector..."
                        searchPlaceholder="Search 70+ sectors..."
                        createLabel="Use new sector"
                      />
                      {!sector && <p className="text-[11px] text-muted-foreground">Select from 70+ industry sectors or type your own.</p>}
                    </div>

                    {/* Location toggle (Pakistan vs International) */}
                    <div className="sm:col-span-2 pt-1">
                      <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-medium">Is this company based outside Pakistan?</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternational}
                            onChange={(e) => setIsInternational(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    </div>

                    {isInternational ? (
                      <>
                        <div className="space-y-1.5">
                          <Label>Country <span className="text-destructive">*</span></Label>
                          <Combobox
                            options={COMMON_COUNTRIES}
                            value={country}
                            onChange={setCountry}
                            placeholder="Select or type country..."
                            searchPlaceholder="Search country..."
                            createLabel="Use country"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>City <span className="text-destructive">*</span></Label>
                          <Input
                            value={internationalCity}
                            onChange={(e) => setInternationalCity(e.target.value)}
                            placeholder="e.g. San Francisco, London, Dubai"
                            required
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>City (Pakistan) <span className="text-destructive">*</span></Label>
                        <Combobox
                          options={cityOptions}
                          value={city}
                          onChange={setCity}
                          placeholder="Select or type city..."
                          searchPlaceholder="Search 150+ Pakistani cities..."
                          createLabel="Use new city"
                        />
                        {!city && <p className="text-[11px] text-muted-foreground">Select from all major cities/districts of Pakistan or type a new city.</p>}
                      </div>
                    )}

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Office address (optional)</Label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Office #402, Software Technology Park / Building Name"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 2. Primary Contact / CEO */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4" /> 2. Primary Founder / CEO Contact
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Contact name <span className="text-destructive">*</span></Label>
                      <Input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Full name"
                        required
                        className={!contactNameValid && contactName.length > 0 ? 'border-destructive' : ''}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contact email <span className="text-destructive">*</span></Label>
                      <Input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="person@company.com"
                        required
                        className={!contactEmailValid && contactEmail.length > 0 ? 'border-destructive' : ''}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Contact phone</Label>
                      <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+92 300 0000000" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 3. Additional Co-Founders (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Users className="h-4 w-4" /> 3. Additional Co-Founders (Optional)
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addCoFounder} className="h-7 text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add co-founder
                    </Button>
                  </div>

                  {coFounders.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No additional co-founders added yet. You can also add team members anytime from your company portal.</p>
                  ) : (
                    <div className="space-y-3">
                      {coFounders.map((cf, idx) => (
                        <div key={idx} className="p-3 border rounded-lg bg-muted/20 space-y-2 relative">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-muted-foreground">Co-Founder #{idx + 1}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeCoFounder(idx)} className="h-6 w-6 p-0 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2">
                            <Input
                              placeholder="Full name"
                              value={cf.name}
                              onChange={(e) => updateCoFounder(idx, 'name', e.target.value)}
                              className="h-8 text-xs"
                            />
                            <Input
                              placeholder="Role (e.g. CTO, Co-Founder)"
                              value={cf.role}
                              onChange={(e) => updateCoFounder(idx, 'role', e.target.value)}
                              className="h-8 text-xs"
                            />
                            <Input
                              type="email"
                              placeholder="Email address"
                              value={cf.email}
                              onChange={(e) => updateCoFounder(idx, 'email', e.target.value)}
                              className="h-8 text-xs"
                            />
                            <Input
                              placeholder="SEECS Department / Field"
                              value={cf.department}
                              onChange={(e) => updateCoFounder(idx, 'department', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setMode('login'); setError('') }}
                    className="min-w-[100px]"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading || !sector || !effectiveCity || !nameValid || !contactNameValid || !contactEmailValid}
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Register company
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t bg-background/80 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground text-center">
          SEECS Database Management System · NUST Islamabad
        </div>
      </footer>
    </div>
  )
}
