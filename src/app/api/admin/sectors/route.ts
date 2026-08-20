import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.sector.findMany({ include: { _count: { select: { companies: true } } }, orderBy: { name: 'asc' } })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await req.json().catch(() => ({}))
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  try {
    const item = await db.sector.create({ data: { name: String(name).trim() } })
    return NextResponse.json({ item })
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Sector name already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to create sector' }, { status: 500 })
  }
}
