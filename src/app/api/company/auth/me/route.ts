import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyFromRequest, createCompanyToken, COMPANY_COOKIE } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  // Login mode: ?login=1&apiKey=...
  if (searchParams.get('login')) {
    const apiKey = searchParams.get('apiKey')
    if (!apiKey) return NextResponse.json({ error: 'API key is required' }, { status: 400 })

    const company = await db.company.findUnique({ where: { apiKey: String(apiKey).trim() } })
    if (!company) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    if (!company.apiKeyActive) return NextResponse.json({ error: 'This API key has been revoked.' }, { status: 403 })

    const token = createCompanyToken({ companyId: company.id, apiKey: company.apiKey })
    const res = NextResponse.json({ ok: true, company: { id: company.id, name: company.name, sector: company.sectorId, city: company.cityId } })
    res.cookies.set(COMPANY_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  }

  // Normal session check
  const s = await getCompanyFromRequest()
  if (!s) return NextResponse.json({ company: null })

  const company = await db.company.findFirst({
    where: { id: s.companyId, apiKey: s.apiKey, apiKeyActive: true },
    include: {
      sector: true,
      city: true,
      location: true,
      founders: { include: { founder: { include: { degree: true } } } },
      annualData: { orderBy: { year: 'desc' } },
    },
  })
  if (!company) return NextResponse.json({ company: null })
  return NextResponse.json({
    company: {
      id: company.id,
      name: company.name,
      description: company.description,
      email: company.email,
      phone: company.phone,
      website: company.website,
      sector: company.sector,
      city: company.city,
      location: company.location,
      founders: company.founders.map((cf) => ({ id: cf.id, role: cf.role, founder: cf.founder })),
      annualData: company.annualData,
      registeredAt: company.registeredAt.toISOString(),
    },
  })
}