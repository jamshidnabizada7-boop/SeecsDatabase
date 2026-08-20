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
      founders: {
        include: {
          founder: {
            include: { degree: true },
          },
        },
      },
      annualData: {
        orderBy: { year: 'desc' },
      },
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
    name,
    description,
    email,
    phone,
    website,
    status,
    statusReason,
    sinceDate,
    foundedYear,
    discontinuedDate,
    branchesCount,
    revenue,
    revenueMin,
    revenueMax,
    sectorId: rawSector,
    cityId: rawCity,
    address,
    locationId: rawLocationId,
    founders,
    founderIds,
    annualData,
    customValues,
    apiKeyActive,
    apiKey,
    regenerateKey,
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
  if (foundedYear !== undefined) data.foundedYear = foundedYear != null && foundedYear !== '' ? Number(foundedYear) : null
  if (discontinuedDate !== undefined) data.discontinuedDate = discontinuedDate || null
  if (branchesCount !== undefined) data.branchesCount = branchesCount != null && branchesCount !== '' ? Number(branchesCount) : null
  if (revenue !== undefined) data.revenue = revenue != null && revenue !== '' ? Number(revenue) : null
  if (revenueMin !== undefined) data.revenueMin = revenueMin != null && revenueMin !== '' ? Number(revenueMin) : null
  if (revenueMax !== undefined) data.revenueMax = revenueMax != null && revenueMax !== '' ? Number(revenueMax) : null
  if (apiKeyActive !== undefined) data.apiKeyActive = !!apiKeyActive

  // Sector resolution
  if (rawSector) {
    let resolvedSector = await db.sector.findUnique({ where: { id: String(rawSector).trim() } }).catch(() => null)
    if (!resolvedSector) {
      resolvedSector = await db.sector.findFirst({ where: { name: { equals: String(rawSector).trim(), mode: 'insensitive' } } })
    }
    if (!resolvedSector) {
      resolvedSector = await db.sector.create({ data: { name: String(rawSector).trim() } })
    }
    data.sectorId = resolvedSector.id
  }

  // City resolution
  if (rawCity) {
    let resolvedCity = await db.city.findUnique({ where: { id: String(rawCity).trim() } }).catch(() => null)
    if (!resolvedCity) {
      resolvedCity = await db.city.findFirst({ where: { name: { equals: String(rawCity).trim(), mode: 'insensitive' } } })
    }
    if (!resolvedCity) {
      resolvedCity = await db.city.create({ data: { name: String(rawCity).trim() } })
    }
    data.cityId = resolvedCity.id

    // Location resolution
    if (address !== undefined) {
      if (address && String(address).trim()) {
        const loc = await db.location.create({
          data: { address: String(address).trim(), cityId: resolvedCity.id, country: 'Pakistan' },
        })
        data.locationId = loc.id
      } else {
        data.locationId = null
      }
    }
  } else if (rawLocationId !== undefined) {
    data.locationId = rawLocationId || null
  }

  // API key handling
  if (regenerateKey) {
    data.apiKey = newApiKey()
  } else if (typeof apiKey === 'string' && apiKey.trim() !== '') {
    data.apiKey = apiKey.trim()
  }

  // Update company record
  try {
    await db.company.update({
      where: { id },
      data,
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Unique constraint failed (e.g. duplicate API key)' }, { status: 409 })
    }
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 })
  }

  // Founders update
  if (Array.isArray(founders)) {
    await db.companyFounder.deleteMany({ where: { companyId: id } })
    for (const f of founders) {
      try {
        let founderId = f.id
        if (!founderId) {
          const fn = f.firstName || String(f.name || '').split(' ')[0] || 'Founder'
          const ln = f.lastName || String(f.name || '').split(' ').slice(1).join(' ') || ''
          
          let degreeId = f.degreeId || null
          if (!degreeId && f.degreeName) {
            let deg = await db.degree.findFirst({ where: { name: { equals: String(f.degreeName).trim(), mode: 'insensitive' } } })
            if (!deg) {
              deg = await db.degree.create({ data: { name: String(f.degreeName).trim(), field: f.department || null } })
            }
            degreeId = deg.id
          }

          const createdF = await db.founder.create({
            data: {
              firstName: fn,
              lastName: ln,
              gender: f.gender || 'Male',
              email: f.email || null,
              phone: f.phone || null,
              department: f.department || null,
              degreeId,
            },
          })
          founderId = createdF.id
        }

        await db.companyFounder.create({
          data: {
            companyId: id,
            founderId,
            role: f.role || 'Co-Founder',
          },
        }).catch(() => {})
      } catch (err) {
        console.error('Error updating founder:', err)
      }
    }
  } else if (Array.isArray(founderIds)) {
    await db.companyFounder.deleteMany({ where: { companyId: id } })
    for (let i = 0; i < founderIds.length; i++) {
      const fid = founderIds[i]
      await db.companyFounder.create({
        data: { companyId: id, founderId: fid, role: i === 0 ? 'CEO' : 'Co-Founder' },
      }).catch(() => {})
    }
  }

  // Annual data update
  if (Array.isArray(annualData)) {
    for (const ad of annualData) {
      if (!ad.year) continue
      await db.companyAnnualData.upsert({
        where: { companyId_year: { companyId: id, year: Number(ad.year) } },
        create: {
          companyId: id,
          year: Number(ad.year),
          monthlyRevenue: Number(ad.monthlyRevenue || 0),
          totalRevenue: Number(ad.totalRevenue || 0),
          employeeCount: Number(ad.employeeCount || 0),
          projectCount: Number(ad.projectCount || 0),
          notes: ad.notes || null,
        },
        update: {
          monthlyRevenue: Number(ad.monthlyRevenue || 0),
          totalRevenue: Number(ad.totalRevenue || 0),
          employeeCount: Number(ad.employeeCount || 0),
          projectCount: Number(ad.projectCount || 0),
          notes: ad.notes || null,
        },
      }).catch(() => {})
    }
  }

  // Custom values update
  if (typeof customValues === 'object' && customValues !== null) {
    for (const [colId, val] of Object.entries(customValues)) {
      if (val != null) {
        await db.companyCustomValue.upsert({
          where: { companyId_customColumnId: { companyId: id, customColumnId: colId } },
          create: { companyId: id, customColumnId: colId, value: String(val) },
          update: { value: String(val) },
        }).catch(() => {})
      }
    }
  }

  const updatedItem = await db.company.findUnique({
    where: { id },
    include: {
      sector: true,
      city: true,
      location: true,
      founders: { include: { founder: { include: { degree: true } } } },
      annualData: { orderBy: { year: 'desc' } },
      customValues: { include: { customColumn: true } },
    },
  })

  return NextResponse.json({ item: updatedItem })
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
