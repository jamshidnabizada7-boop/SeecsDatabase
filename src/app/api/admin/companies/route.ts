import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  // Fetch all custom columns (company-targeted) once for all companies
  const customColumns = await db.customColumn.findMany({
    where: { targetTable: 'company' },
    orderBy: { sortOrder: 'asc' },
  })

  const items = await db.company.findMany({
    where: q ? { name: { contains: q } } : undefined,
    include: {
      sector: true,
      city: true,
      location: true,
      founders: { include: { founder: true } },
      _count: { select: { annualData: true } },
      customValues: { include: { customColumn: true } },
    },
    orderBy: { registeredAt: 'desc' },
  })
  return NextResponse.json({ items, customColumns })
}

function newApiKey() {
  return 'sk_seecs_' + crypto.randomBytes(16).toString('hex')
}

export async function POST(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const {
    name, description, email, phone, website,
    status, statusReason, sinceDate, foundedYear, discontinuedDate,
    branchesCount, revenue, revenueMin, revenueMax,
    sectorId, cityId, locationId, founderIds,
  } = body
  if (!name || !sectorId || !cityId) return NextResponse.json({ error: 'Name, sector and city are required' }, { status: 400 })

  const item = await db.company.create({
    data: {
      name: String(name).trim(),
      description: description != null ? String(description) : null,
      email: email != null ? String(email) : null,
      phone: phone != null ? String(phone) : null,
      website: website != null ? String(website) : null,
      status: status != null ? String(status) : null,
      statusReason: statusReason != null ? String(statusReason) : null,
      sinceDate: sinceDate != null ? String(sinceDate) : null,
      foundedYear: foundedYear != null ? Number(foundedYear) : null,
      discontinuedDate: discontinuedDate != null ? String(discontinuedDate) : null,
      branchesCount: branchesCount != null ? Number(branchesCount) : null,
      revenue: revenue != null ? Number(revenue) : null,
      revenueMin: revenueMin != null ? Number(revenueMin) : null,
      revenueMax: revenueMax != null ? Number(revenueMax) : null,
      sectorId,
      cityId,
      locationId: locationId || null,
      apiKey: newApiKey(),
      founders: founderIds?.length
        ? { create: founderIds.map((fid: string, i: number) => ({ founderId: fid, role: i === 0 ? 'CEO' : 'Co-Founder' })) }
        : undefined,
    },
    include: {
      sector: true, city: true, location: true,
      founders: { include: { founder: true } },
      customValues: { include: { customColumn: true } },
    },
  })
  return NextResponse.json({ item })
}
