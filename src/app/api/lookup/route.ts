import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// Public endpoint — returns dimension tables for dropdowns (used by admin AND company registration).
export async function GET() {
  const [sectors, cities, locations, degrees, founders] = await Promise.all([
    db.sector.findMany({ orderBy: { name: 'asc' } }),
    db.city.findMany({ orderBy: { name: 'asc' } }),
    db.location.findMany({ include: { city: true }, orderBy: { createdAt: 'desc' } }),
    db.degree.findMany({ orderBy: { name: 'asc' } }),
    db.founder.findMany({ orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] }),
  ])
  return NextResponse.json({ sectors, cities, locations, degrees, founders })
}
