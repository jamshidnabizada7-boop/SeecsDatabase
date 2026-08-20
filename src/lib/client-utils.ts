'use client'

// Thin fetch wrapper that:
//  - sends JSON
//  - throws on non-2xx with the server message
//  - returns parsed JSON
export async function api<T = any>(
  url: string,
  opts: { method?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include',
  })
  const text = await res.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    const msg = json?.error || `Request failed (${res.status})`
    const err = new Error(msg) as any
    err.status = res.status
    err.body = json
    throw err
  }
  return json as T
}

export function formatCurrency(n: number | string): string {
  const num = Number(n)
  if (!Number.isFinite(num)) return 'PKR 0'
  if (num >= 1e9) return `PKR ${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `PKR ${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `PKR ${(num / 1e3).toFixed(1)}K`
  return `PKR ${Math.round(num).toLocaleString()}`
}

export function formatNumber(n: number | string): string {
  return Math.round(Number(n)).toLocaleString()
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
}
