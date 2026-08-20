import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const { address, country, cityId } = await req.json().catch(() => ({}))
  if (!address || !cityId) return NextResponse.json({ error: 'Address and city are required' }, { status: 400 })
  const item = await db.location.update({
    where: { id },
    data: {
      address: String(address).trim(),
      country: country ? String(country).trim() : undefined,
      cityId,
    },
  })
  return NextResponse.json({ item })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const inUse = await db.company.count({ where: { locationId: id } })
  if (inUse > 0) return NextResponse.json({ error: `Cannot delete: ${inUse} company(ies) at this location` }, { status: 409 })
  try {
    await db.location.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }
}
