'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/client-utils'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'

export default function AdminLogin({ onLoggedIn }: { onLoggedIn: (a: any) => void }) {
  const [email, setEmail] = useState('admin@seecs.nust.edu.pk')
  const [password, setPassword] = useState('admin12345')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const r = await api<{ admin: any }>('/api/admin/auth/login', { method: 'POST', body: { email, password } })
      onLoggedIn(r.admin)
    } catch (e: any) {
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-background to-muted/40 px-4">
      <Card className="w-full max-w-md">
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
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="pr-10" />
                <Lock className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              <span className="font-medium">Demo credentials</span>: admin@seecs.nust.edu.pk / admin12345
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
