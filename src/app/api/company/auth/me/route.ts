import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const s = await getCompanyFromRequest()
  if (!s) return NextResponse.json({ company: null })

  // CRITICAL: scope by BOTH id AND apiKey to guarantee the session can't be hijacked.
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
