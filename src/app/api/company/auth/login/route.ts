import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const runtime = 'nodejs'

const COMPANY_COOKIE = 'seecs_company_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'seecs-dev-secret-change-me'

function makeToken(data: unknown): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

// GET: company login via query param (avoids Turbopack POST compilation issues)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const apiKey = searchParams.get('apiKey')
  if (!apiKey) return NextResponse.json({ error: 'API key is required' }, { status: 400 })

  const company = await db.company.findUnique({ where: { apiKey: String(apiKey).trim() } })
  if (!company) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  if (!company.apiKeyActive) return NextResponse.json({ error: 'This API key has been revoked by the SEECS administrator.' }, { status: 403 })

  const token = makeToken({ companyId: company.id, apiKey: company.apiKey })
  const res = NextResponse.json({
    ok: true,
    company: { id: company.id, name: company.name, sector: company.sectorId, city: company.cityId },
  })
  res.cookies.set(COMPANY_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}

// POST: also supported for programmatic access
export async function POST(req: Request) {
  const { apiKey } = await req.json().catch(() => ({}))
  if (!apiKey) return NextResponse.json({ error: 'API key is required' }, { status: 400 })

  const company = await db.company.findUnique({ where: { apiKey: String(apiKey).trim() } })
  if (!company) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  if (!company.apiKeyActive) return NextResponse.json({ error: 'This API key has been revoked by the SEECS administrator.' }, { status: 403 })

  const token = makeToken({ companyId: company.id, apiKey: company.apiKey })
  const res = NextResponse.json({
    ok: true,
    company: { id: company.id, name: company.name, sector: company.sectorId, city: company.cityId },
  })
  res.cookies.set(COMPANY_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
