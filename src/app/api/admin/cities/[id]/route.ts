import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const { name } = await req.json().catch(() => ({}))
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  try {
    const item = await db.city.update({ where: { id }, data: { name: String(name).trim() } })
    return NextResponse.json({ item })
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'City name already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to update city' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const inUse = await db.company.count({ where: { cityId: id } })
  if (inUse > 0) return NextResponse.json({ error: `Cannot delete: ${inUse} company(ies) in this city` }, { status: 409 })
  try {
    await db.city.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete city' }, { status: 500 })
  }
}
