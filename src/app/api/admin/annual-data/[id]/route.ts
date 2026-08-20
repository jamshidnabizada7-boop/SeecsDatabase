import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
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
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  try {
    await db.companyAnnualData.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete annual data' }, { status: 500 })
  }
}
