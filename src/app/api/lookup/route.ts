import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

// Returns all dimension tables for populating select dropdowns in the admin UI.
export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [sectors, cities, locations, degrees, founders] = await Promise.all([
    db.sector.findMany({ orderBy: { name: 'asc' } }),
    db.city.findMany({ orderBy: { name: 'asc' } }),
    db.location.findMany({ include: { city: true }, orderBy: { createdAt: 'desc' } }),
    db.degree.findMany({ orderBy: { name: 'asc' } }),
    db.founder.findMany({ orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] }),
  ])
  return NextResponse.json({ sectors, cities, locations, degrees, founders })
}
