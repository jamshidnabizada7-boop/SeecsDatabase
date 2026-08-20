import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.degree.findMany({ include: { _count: { select: { founders: true } } }, orderBy: { name: 'asc' } })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, field } = await req.json().catch(() => ({}))
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  try {
    const item = await db.degree.create({ data: { name: String(name).trim(), field: field ? String(field).trim() : null } })
    return NextResponse.json({ item })
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Degree name already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to create degree' }, { status: 500 })
  }
}
