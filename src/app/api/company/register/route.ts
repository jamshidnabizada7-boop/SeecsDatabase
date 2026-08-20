import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const runtime = 'nodejs'

function newApiKey() {
  return 'sk_seecs_' + crypto.randomBytes(16).toString('hex')
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const {
    name,
    description,
    email,
    phone,
    website,
    sectorId: rawSector,
    cityId: rawCity,
    locationId,
    contactName,
    contactEmail,
    contactPhone,
    founders = [],
  } = body

  if (!name || !rawSector || !rawCity || !contactName || !contactEmail) {
    return NextResponse.json(
      { error: 'Company name, sector, city, contact name, and contact email are required' },
      { status: 400 }
    )
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

  // 3. Check for existing company name
  const existing = await db.company.findFirst({
    where: { name: { equals: String(name).trim(), mode: 'insensitive' } },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'A company with this name already exists. Contact the SEECS admin if this is yours.' },
      { status: 409 }
    )
  }

  const apiKey = newApiKey()

  const company = await db.company.create({
    data: {
      name: String(name).trim(),
      description: description || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      sectorId: resolvedSector.id,
      cityId: resolvedCity.id,
      locationId: locationId || null,
      status: 'Operational',
      apiKey,
      apiKeyActive: true,
    },
    include: { sector: true, city: true, location: true },
  })

  // 4. Create primary contact founder
  try {
    const contactParts = String(contactName).trim().split(' ')
    const firstName = contactParts[0] || 'Contact'
    const lastName = contactParts.slice(1).join(' ') || ''
    const primaryFounder = await db.founder.create({
      data: {
        firstName,
        lastName,
        gender: 'Other',
        email: contactEmail || null,
        phone: contactPhone || null,
      },
    })
    await db.companyFounder.create({
      data: { companyId: company.id, founderId: primaryFounder.id, role: 'CEO / Founder' },
    })
  } catch (err) {
    console.error('Failed to create primary founder:', err)
  }

  // 5. Create additional founders if passed
  if (Array.isArray(founders)) {
    for (const f of founders) {
      if (!f.name && !f.firstName) continue
      try {
        const fParts = String(f.name || f.firstName).trim().split(' ')
        const fn = f.firstName || fParts[0] || 'Founder'
        const ln = f.lastName || fParts.slice(1).join(' ') || ''
        
        // Resolve degree if given
        let degreeId: string | null = null
        if (f.degree) {
          const d = await db.degree.findFirst({ where: { name: { equals: String(f.degree).trim(), mode: 'insensitive' } } })
          if (d) degreeId = d.id
        }

        const createdFounder = await db.founder.create({
          data: {
            firstName: fn,
            lastName: ln,
            gender: f.gender || 'Other',
            email: f.email || null,
            phone: f.phone || null,
            department: f.department || null,
            degreeId,
          },
        })
        await db.companyFounder.create({
          data: {
            companyId: company.id,
            founderId: createdFounder.id,
            role: f.role || 'Co-Founder',
          },
        })
      } catch (err) {
        console.error('Failed to create additional founder:', err)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    company: {
      id: company.id,
      name: company.name,
      apiKey,
      sector: company.sector.name,
      city: company.city.name,
    },
    message: 'Registration successful. Save your API key — you will need it to access the company portal.',
  })
}
