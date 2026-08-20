import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.companyAnnualData.findMany({
    include: { company: { include: { sector: true } } },
    orderBy: [{ year: 'asc' }, { company: { name: 'asc' } }],
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { companyId, year, monthlyRevenue, totalRevenue, employeeCount, projectCount, notes } = body
  if (!companyId || !year) return NextResponse.json({ error: 'Company and year are required' }, { status: 400 })
  const exists = await db.companyAnnualData.findUnique({ where: { companyId_year: { companyId, year: Number(year) } } })
  if (exists) return NextResponse.json({ error: 'Annual data for this company/year already exists' }, { status: 409 })
  const item = await db.companyAnnualData.create({
    data: {
      companyId,
      year: Number(year),
      monthlyRevenue: Number(monthlyRevenue) || 0,
      totalRevenue: Number(totalRevenue) || Number(monthlyRevenue) * 12 || 0,
      employeeCount: Number(employeeCount) || 0,
      projectCount: Number(projectCount) || 0,
      notes: notes || null,
    },
  })
  return NextResponse.json({ item })
}
