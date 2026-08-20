// This route is intentionally empty.
// Admin login is handled by /api/admin/auth/me?login=1&email=...&hash=...
// to avoid Turbopack compilation issues with separate login routes.
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ error: 'Use /api/admin/auth/me?login=1&email=...&hash=...' }, { status: 400 })
}
