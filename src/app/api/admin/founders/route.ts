import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.founder.findMany({
    include: { degree: true, _count: { select: { companies: true } } },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { firstName, lastName, gender, email, phone, department, degreeId } = body
  if (!firstName || !lastName || !gender) return NextResponse.json({ error: 'First name, last name and gender are required' }, { status: 400 })
  if (!['Male', 'Female', 'Other'].includes(gender)) return NextResponse.json({ error: 'Invalid gender' }, { status: 400 })
  const item = await db.founder.create({
    data: {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      gender,
      email: email ? String(email).trim() : null,
      phone: phone ? String(phone).trim() : null,
      department: department ? String(department).trim() : null,
      degreeId: degreeId || null,
    },
  })
  return NextResponse.json({ item })
}
