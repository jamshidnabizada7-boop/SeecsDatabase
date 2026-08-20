import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// Public read-only lookup used by the company registration form.
export async function GET() {
  const [sectors, cities, locations, degrees] = await Promise.all([
    db.sector.findMany({ orderBy: { name: 'asc' } }),
    db.city.findMany({ orderBy: { name: 'asc' } }),
    db.location.findMany({ include: { city: true }, orderBy: { createdAt: 'desc' } }),
    db.degree.findMany({ orderBy: { name: 'asc' } }),
  ])
  return NextResponse.json({ sectors, cities, locations, degrees })
}
