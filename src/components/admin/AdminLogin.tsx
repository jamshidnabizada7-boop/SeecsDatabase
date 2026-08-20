'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck, Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react'

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function AdminLogin({ onLoggedIn }: { onLoggedIn: (a: any) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => emailRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (!email.trim() || !password) {
      setError('Please enter your university email and password')
      return
    }
    setLoading(true)
    setError('')
    try {
      const hash = await sha256(password)
      const res = await fetch('/api/admin/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), hash }),
      })
      const data = await res.json()
      if (res.ok && data.ok && data.admin) {
        onLoggedIn(data.admin)
      } else {
        setError(data.error || 'Invalid credentials. Check your email and password.')
      }
    } catch (e: any) {
      setError(e.message || 'Login request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-background to-muted/40 px-4">
      <Card className="w-full max-w-md shadow-lg border-stone-200/80 dark:border-stone-800/80" tabIndex={-1}>
        <CardHeader className="text-center pb-3">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white grid place-items-center mb-3 shadow-md shadow-emerald-600/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Database Manager Login</CardTitle>
          <CardDescription>
            Sign in to the SEECS database management console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">University Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-email"
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  autoComplete="email"
                  required
                  disabled={loading}
                  placeholder="e.g. admin@seecs.nust.edu.pk"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  placeholder="Enter your password"
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}