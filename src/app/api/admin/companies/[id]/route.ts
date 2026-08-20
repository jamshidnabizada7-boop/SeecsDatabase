import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import crypto from 'crypto'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

function newApiKey() {
  return 'sk_seecs_' + crypto.randomBytes(16).toString('hex')
}

export async function GET(_req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params

  const customColumns = await db.customColumn.findMany({
    where: { targetTable: 'company' },
    orderBy: { sortOrder: 'asc' },
  })

  const item = await db.company.findUnique({
    where: { id },
    include: {
      sector: true,
      city: true,
      location: true,
      founders: { include: { founder: true } },
      _count: { select: { annualData: true } },
      customValues: { include: { customColumn: true } },
    },
  })
  if (!item) return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  return NextResponse.json({ item, customColumns })
}

export async function PUT(req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const {
    name, description, email, phone, website,
    status, statusReason, sinceDate, foundedYear, discontinuedDate,
    branchesCount, revenue, revenueMin, revenueMax,
    sectorId, cityId, locationId, founderIds, apiKeyActive,
    apiKey, regenerateKey,
  } = body

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = String(name).trim()
  if (description !== undefined) data.description = description || null
  if (email !== undefined) data.email = email || null
  if (phone !== undefined) data.phone = phone || null
  if (website !== undefined) data.website = website || null
  if (status !== undefined) data.status = status || null
  if (statusReason !== undefined) data.statusReason = statusReason || null
  if (sinceDate !== undefined) data.sinceDate = sinceDate || null
  if (foundedYear !== undefined) data.foundedYear = foundedYear != null ? Number(foundedYear) : null
  if (discontinuedDate !== undefined) data.discontinuedDate = discontinuedDate || null
  if (branchesCount !== undefined) data.branchesCount = branchesCount != null ? Number(branchesCount) : null
  if (revenue !== undefined) data.revenue = revenue != null ? Number(revenue) : null
  if (revenueMin !== undefined) data.revenueMin = revenueMin != null ? Number(revenueMin) : null
  if (revenueMax !== undefined) data.revenueMax = revenueMax != null ? Number(revenueMax) : null
  if (sectorId !== undefined) data.sectorId = sectorId
  if (cityId !== undefined) data.cityId = cityId
  if (locationId !== undefined) data.locationId = locationId || null
  if (apiKeyActive !== undefined) data.apiKeyActive = !!apiKeyActive

  // API key handling: regenerateKey takes priority, then explicit apiKey
  if (regenerateKey) {
    data.apiKey = newApiKey()
  } else if (typeof apiKey === 'string' && apiKey.trim() !== '') {
    data.apiKey = apiKey.trim()
  }

  // founders handling: if provided, replace the join rows
  if (Array.isArray(founderIds)) {
    await db.companyFounder.deleteMany({ where: { companyId: id } })
    if (founderIds.length) {
      data.founders = {
        create: founderIds.map((fid: string, i: number) => ({ founderId: fid, role: i === 0 ? 'CEO' : 'Co-Founder' })),
      }
    }
  }

  const item = await db.company.update({
    where: { id },
    data,
    include: {
      sector: true, city: true, location: true,
      founders: { include: { founder: true } },
      customValues: { include: { customColumn: true } },
    },
  })
  return NextResponse.json({ item })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  try {
    await db.company.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}
