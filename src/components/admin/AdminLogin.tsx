'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck, Loader2 } from 'lucide-react'

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function AdminLogin({ onLoggedIn }: { onLoggedIn: (a: any) => void }) {
  const [email, setEmail] = useState('admin@seecs.nust.edu.pk')
  const [password, setPassword] = useState('admin12345')
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
    setLoading(true)
    setError('')
    try {
      const hash = await sha256(password)
      const res = await fetch(`/api/admin/auth/me?login=1&email=${encodeURIComponent(email)}&hash=${hash}`, {
        method: 'GET',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.ok && data.admin) {
        onLoggedIn(data.admin)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (e: any) {
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-background to-muted/40 px-4">
      <Card className="w-full max-w-md" tabIndex={-1}>
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary text-primary-foreground grid place-items-center mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Database Manager Login</CardTitle>
          <CardDescription>
            Sign in to the SEECS admin console. This account sees everything.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
                placeholder="admin@seecs.nust.edu.pk"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
                placeholder="Enter your password"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Signing in\u2026' : 'Sign in'}
            </Button>
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              <span className="font-medium">Demo credentials</span>: admin@seecs.nust.edu.pk / admin12345
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}