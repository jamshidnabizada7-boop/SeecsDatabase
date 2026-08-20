import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.location.findMany({ include: { city: true, _count: { select: { companies: true } } }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { address, country, cityId } = await req.json().catch(() => ({}))
  if (!address || !cityId) return NextResponse.json({ error: 'Address and city are required' }, { status: 400 })
  const item = await db.location.create({
    data: {
      address: String(address).trim(),
      country: country ? String(country).trim() : 'Pakistan',
      cityId,
    },
  })
  return NextResponse.json({ item })
}
