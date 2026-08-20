import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentCompany } from '@/lib/auth'

export const runtime = 'nodejs'

// Get own annual data
export async function GET() {
  const company = await getCurrentCompany()
  const items = await db.companyAnnualData.findMany({ where: { companyId: company.id }, orderBy: { year: 'desc' } })
  return NextResponse.json({ items })
}

// Add annual data row for THIS company only
export async function POST(req: Request) {
  const company = await getCurrentCompany()
  const body = await req.json().catch(() => ({}))
  const { year, monthlyRevenue, totalRevenue, employeeCount, projectCount, notes } = body
  if (!year) return NextResponse.json({ error: 'Year is required' }, { status: 400 })
  const exists = await db.companyAnnualData.findUnique({ where: { companyId_year: { companyId: company.id, year: Number(year) } } })
  if (exists) return NextResponse.json({ error: 'Annual data for this year already exists' }, { status: 409 })
  const item = await db.companyAnnualData.create({
    data: {
      companyId: company.id, // ALWAYS the current company
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
