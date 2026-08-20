import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentCompany } from '@/lib/auth'

export const runtime = 'nodejs'

// List all founders available in the system (companies can pick existing ones
// OR create their own via the founders/[id] route below which is company-scoped).
export async function GET() {
  await getCurrentCompany()
  const items = await db.founder.findMany({ orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] })
  return NextResponse.json({ items })
}

// Create a NEW founder AND attach them to THIS company.
export async function POST(req: Request) {
  const company = await getCurrentCompany()
  const body = await req.json().catch(() => ({}))
  const { firstName, lastName, gender, email, phone, degreeId, role } = body
  if (!firstName || !lastName || !gender) return NextResponse.json({ error: 'First name, last name and gender are required' }, { status: 400 })
  if (!['Male', 'Female', 'Other'].includes(gender)) return NextResponse.json({ error: 'Invalid gender' }, { status: 400 })

  // create founder + attach to THIS company only
  const [founder] = await db.$transaction([
    db.founder.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        gender,
        email: email || null,
        phone: phone || null,
        degreeId: degreeId || null,
      },
    }),
  ])
  await db.companyFounder.create({
    data: { companyId: company.id, founderId: founder.id, role: role || 'Co-Founder' },
  })

  const cf = await db.companyFounder.findFirst({
    where: { companyId: company.id, founderId: founder.id },
    include: { founder: { include: { degree: true } } },
  })
  return NextResponse.json({ item: cf })
}
