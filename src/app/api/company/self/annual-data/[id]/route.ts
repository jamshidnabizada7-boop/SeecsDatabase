import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentCompany } from '@/lib/auth'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

// CRITICAL: every mutation first verifies the row belongs to THIS company.
async function getOwned(companyId: string, rowId: string) {
  return db.companyAnnualData.findFirst({ where: { id: rowId, companyId } })
}

export async function PUT(req: Request, ctx: Ctx) {
  const company = await getCurrentCompany()
  const { id } = await ctx.params
  const row = await getOwned(company.id, id)
  if (!row) return NextResponse.json({ error: 'Not found or not owned by your company' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const { year, monthlyRevenue, totalRevenue, employeeCount, projectCount, notes } = body
  const data: any = {}
  if (year !== undefined) data.year = Number(year)
  if (monthlyRevenue !== undefined) data.monthlyRevenue = Number(monthlyRevenue)
  if (totalRevenue !== undefined) data.totalRevenue = Number(totalRevenue)
  if (employeeCount !== undefined) data.employeeCount = Number(employeeCount)
  if (projectCount !== undefined) data.projectCount = Number(projectCount)
  if (notes !== undefined) data.notes = notes || null
  const item = await db.companyAnnualData.update({ where: { id }, data })
  return NextResponse.json({ item })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const company = await getCurrentCompany()
  const { id } = await ctx.params
  const row = await getOwned(company.id, id)
  if (!row) return NextResponse.json({ error: 'Not found or not owned by your company' }, { status: 403 })
  await db.companyAnnualData.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
