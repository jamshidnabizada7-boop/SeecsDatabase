import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createCompanyToken, COMPANY_COOKIE } from '@/lib/auth'

export const runtime = 'nodejs'

// Company portal login: validates the per-company API key.
export async function POST(req: Request) {
  const { apiKey } = await req.json().catch(() => ({}))
  if (!apiKey) return NextResponse.json({ error: 'API key is required' }, { status: 400 })

  const company = await db.company.findUnique({ where: { apiKey: String(apiKey).trim() } })
  if (!company) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  if (!company.apiKeyActive) return NextResponse.json({ error: 'This API key has been revoked by the SEECS administrator.' }, { status: 403 })

  const token = createCompanyToken({ companyId: company.id, apiKey: company.apiKey })
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
