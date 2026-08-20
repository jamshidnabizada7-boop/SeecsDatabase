import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import crypto from 'crypto'

export const runtime = 'nodejs'

function newApiKey() {
  return 'sk_seecs_' + crypto.randomBytes(16).toString('hex')
}

export async function GET(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const pageParam = searchParams.get('page')
  const limitParam = searchParams.get('limit')
  const statusParam = searchParams.get('status') || ''
  const sectorParam = searchParams.get('sector') || ''
  const cityParam = searchParams.get('city') || ''

  const page = Math.max(1, Number(pageParam) || 1)
  const limit = Math.min(100, Math.max(1, Number(limitParam) || 20))
  const hasPagination = !!pageParam || !!limitParam

  // Build where clause
  const conditions: any[] = []
  if (q) {
    conditions.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { founders: { some: { founder: { firstName: { contains: q, mode: 'insensitive' } } } } },
        { founders: { some: { founder: { lastName: { contains: q, mode: 'insensitive' } } } } },
      ],
    })
  }
  if (statusParam && statusParam !== 'All') {
    conditions.push({ status: statusParam })
  }
  if (sectorParam && sectorParam !== 'All') {
    conditions.push({ sectorId: sectorParam })
  }
  if (cityParam && cityParam !== 'All') {
    conditions.push({ cityId: cityParam })
  }
  const where = conditions.length > 0 ? { AND: conditions } : undefined

  // Fetch all custom columns (company-targeted)
  const customColumns = await db.customColumn.findMany({
    where: { targetTable: 'company' },
    orderBy: { sortOrder: 'asc' },
  })

  const includeConfig = {
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
      orderBy: { year: 'desc' as const },
    },
    _count: { select: { annualData: true } },
    customValues: { include: { customColumn: true } },
  }

  if (hasPagination) {
    const [total, items] = await Promise.all([
      db.company.count({ where }),
      db.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: includeConfig,
        orderBy: { registeredAt: 'desc' },
      }),
    ])
    return NextResponse.json({
      items,
      customColumns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  }

  const items = await db.company.findMany({
    where,
    include: includeConfig,
    orderBy: { registeredAt: 'desc' },
  })
  return NextResponse.json({ items, customColumns, total: items.length, page: 1, limit: items.length, totalPages: 1 })
}

export async function POST(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const {
    name,
    description,
    email,
    phone,
    website,
    status = 'Operational',
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
    country = 'Pakistan',
    locationId: rawLocationId,
    founders = [],
    founderIds = [],
    annualData = [],
    customValues = {},
  } = body

  if (!name || !rawSector || !rawCity) {
    return NextResponse.json({ error: 'Name, sector, and city are required' }, { status: 400 })
  }

  // 1. Resolve or create Sector
  let resolvedSector = await db.sector.findUnique({ where: { id: String(rawSector).trim() } }).catch(() => null)
  if (!resolvedSector) {
    resolvedSector = await db.sector.findFirst({ where: { name: { equals: String(rawSector).trim(), mode: 'insensitive' } } })
  }
  if (!resolvedSector) {
    resolvedSector = await db.sector.create({ data: { name: String(rawSector).trim() } })
  }

  // 2. Resolve or create City
  let resolvedCity = await db.city.findUnique({ where: { id: String(rawCity).trim() } }).catch(() => null)
  if (!resolvedCity) {
    resolvedCity = await db.city.findFirst({ where: { name: { equals: String(rawCity).trim(), mode: 'insensitive' } } })
  }
  if (!resolvedCity) {
    resolvedCity = await db.city.create({ data: { name: String(rawCity).trim() } })
  }

  // 3. Resolve or create Location
  let resolvedLocationId = rawLocationId || null
  if (address || (country && country.trim().toLowerCase() !== 'pakistan')) {
    const loc = await db.location.create({
      data: {
        address: address ? String(address).trim() : resolvedCity.name,
        cityId: resolvedCity.id,
        country: String(country || 'Pakistan').trim(),
      },
    })
    resolvedLocationId = loc.id
  }

  // 4. Create Company
  const company = await db.company.create({
    data: {
      name: String(name).trim(),
      description: description ? String(description) : null,
      email: email ? String(email) : null,
      phone: phone ? String(phone) : null,
      website: website ? String(website) : null,
      status: status ? String(status) : 'Operational',
      statusReason: statusReason ? String(statusReason) : null,
      sinceDate: sinceDate ? String(sinceDate) : null,
      foundedYear: foundedYear != null && foundedYear !== '' ? Number(foundedYear) : null,
      discontinuedDate: discontinuedDate ? String(discontinuedDate) : null,
      branchesCount: branchesCount != null && branchesCount !== '' ? Number(branchesCount) : null,
      revenue: revenue != null && revenue !== '' ? Number(revenue) : null,
      revenueMin: revenueMin != null && revenueMin !== '' ? Number(revenueMin) : null,
      revenueMax: revenueMax != null && revenueMax !== '' ? Number(revenueMax) : null,
      sectorId: resolvedSector.id,
      cityId: resolvedCity.id,
      locationId: resolvedLocationId,
      apiKey: newApiKey(),
      apiKeyActive: true,
    },
  })

  // 5. Link / Create Founders
  if (Array.isArray(founderIds) && founderIds.length > 0) {
    for (let i = 0; i < founderIds.length; i++) {
      const fid = founderIds[i]
      await db.companyFounder.create({
        data: { companyId: company.id, founderId: fid, role: i === 0 ? 'CEO' : 'Co-Founder' },
      }).catch(() => {})
    }
  }

  if (Array.isArray(founders) && founders.length > 0) {
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
            companyId: company.id,
            founderId,
            role: f.role || 'Co-Founder',
          },
        }).catch(() => {})
      } catch (err) {
        console.error('Error attaching founder:', err)
      }
    }
  }

  // 6. Annual Data
  if (Array.isArray(annualData) && annualData.length > 0) {
    for (const ad of annualData) {
      if (!ad.year) continue
      await db.companyAnnualData.create({
        data: {
          companyId: company.id,
          year: Number(ad.year),
          monthlyRevenue: Number(ad.monthlyRevenue || 0),
          totalRevenue: Number(ad.totalRevenue || 0),
          employeeCount: Number(ad.employeeCount || 0),
          projectCount: Number(ad.projectCount || 0),
          notes: ad.notes || null,
        },
      }).catch(() => {})
    }
  }

  // 7. Custom Values
  if (typeof customValues === 'object' && customValues !== null) {
    for (const [colId, val] of Object.entries(customValues)) {
      if (val != null && String(val).trim()) {
        await db.companyCustomValue.create({
          data: {
            companyId: company.id,
            customColumnId: colId,
            value: String(val),
          },
        }).catch(() => {})
      }
    }
  }

  const completeItem = await db.company.findUnique({
    where: { id: company.id },
    include: {
      sector: true,
      city: true,
      location: true,
      founders: { include: { founder: { include: { degree: true } } } },
      annualData: { orderBy: { year: 'desc' } },
      customValues: { include: { customColumn: true } },
    },
  })

  return NextResponse.json({ item: completeItem })
}
