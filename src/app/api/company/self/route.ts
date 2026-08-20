import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentCompany } from '@/lib/auth'

export const runtime = 'nodejs'

// GET: return the current company's own data (no leakage of other companies).
export async function GET() {
  const company = await getCurrentCompany()

  const customColumns = await db.customColumn.findMany({
    where: { targetTable: 'company' },
    orderBy: { sortOrder: 'asc' },
  })

  const full = await db.company.findUnique({
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
  return NextResponse.json({ company: full, customColumns })
}

// PUT: update own profile fields only.
// Companies CANNOT change their sector/city/apiKey themselves (only the admin can),
// and they CANNOT change which company they are.
// Companies CAN update their custom column values.
export async function PUT(req: Request) {
  const company = await getCurrentCompany()
  const body = await req.json().catch(() => ({}))
  const { name, description, email, phone, website, locationId, customValues } = body

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = String(name).trim()
  if (description !== undefined) data.description = description || null
  if (email !== undefined) data.email = email || null
  if (phone !== undefined) data.phone = phone || null
  if (website !== undefined) data.website = website || null
  if (locationId !== undefined) data.locationId = locationId || null
  // NOTE: sectorId, cityId, apiKey, apiKeyActive are intentionally NOT accepted here.

  const updated = await db.company.update({
    where: { id: company.id },
    data,
    include: { sector: true, city: true, location: true },
  })

  // Handle custom column values update (company can update their own custom values)
  let savedCustomValues: any[] | null = null
  if (customValues && typeof customValues === 'object' && !Array.isArray(customValues)) {
    // Verify all custom column IDs exist and target 'company'
    const columnIds = Object.keys(customValues)
    if (columnIds.length > 0) {
      const columns = await db.customColumn.findMany({
        where: { id: { in: columnIds }, targetTable: 'company' },
      })
      const validIds = new Set(columns.map((c) => c.id))

      await Promise.all(
        columnIds
          .filter((id) => validIds.has(id))
          .map((customColumnId) =>
            db.companyCustomValue.upsert({
              where: {
                companyId_customColumnId: { companyId: company.id, customColumnId },
              },
              create: {
                companyId: company.id,
                customColumnId,
                value: customValues[customColumnId] != null ? String(customValues[customColumnId]) : '',
              },
              update: {
                value: customValues[customColumnId] != null ? String(customValues[customColumnId]) : '',
              },
            })
          )
      )

      savedCustomValues = await db.companyCustomValue.findMany({
        where: { companyId: company.id },
        include: { customColumn: true },
      })
    }
  }

  return NextResponse.json({ company: updated, customValues: savedCustomValues })
}
