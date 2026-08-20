import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Company self-registration: creates a new company + generates a unique per-company API key.
// The "responsible person" then receives the key and shares it with that company.
function newApiKey() {
  return 'sk_seecs_' + crypto.randomBytes(16).toString('hex')
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { name, description, email, phone, website, sectorId, cityId, locationId, contactName, contactEmail, contactPhone } = body

  if (!name || !sectorId || !cityId || !contactName || !contactEmail) {
    return NextResponse.json({ error: 'Company name, sector, city, contact name and contact email are required' }, { status: 400 })
  }

  // Validate sector / city exist
  const [sector, city] = await Promise.all([
    db.sector.findUnique({ where: { id: sectorId } }),
    db.city.findUnique({ where: { id: cityId } }),
  ])
  if (!sector) return NextResponse.json({ error: 'Invalid sector' }, { status: 400 })
  if (!city) return NextResponse.json({ error: 'Invalid city' }, { status: 400 })

  // Optional duplicate check by name
  const existing = await db.company.findFirst({ where: { name: String(name).trim() } })
  if (existing) return NextResponse.json({ error: 'A company with this name already exists. Contact the SEECS admin if this is yours.' }, { status: 409 })

  const apiKey = newApiKey()

  const company = await db.company.create({
    data: {
      name: String(name).trim(),
      description: description || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      sectorId,
      cityId,
      locationId: locationId || null,
      apiKey,
      apiKeyActive: true,
    },
    include: { sector: true, city: true, location: true },
  })

  // Best-effort: also create a Founder record for the contact (if they gave us a degree we'd need it - skip for self-reg).
  try {
    const founder = await db.founder.create({
      data: {
        firstName: String(contactName).split(' ')[0] || 'Contact',
        lastName: String(contactName).split(' ').slice(1).join(' ') || '',
        gender: 'Other',
        email: contactEmail,
        phone: contactPhone || null,
      },
    })
    await db.companyFounder.create({
      data: { companyId: company.id, founderId: founder.id, role: 'Contact' },
    })
  } catch {
    // non-fatal
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
