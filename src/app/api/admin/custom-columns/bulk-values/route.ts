import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

// PUT: Upsert custom column values for a given company.
// Body: { companyId: string, values: { [customColumnId]: valueString } }
export async function PUT(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { companyId, values } = body

  if (!companyId || typeof companyId !== 'string') {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return NextResponse.json({ error: 'values must be an object' }, { status: 400 })
  }

  // Verify the company exists
  const company = await db.company.findUnique({ where: { id: companyId } })
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  // Verify all customColumnIds exist
  const columnIds = Object.keys(values)
  const columns = await db.customColumn.findMany({
    where: { id: { in: columnIds } },
  })
  const foundIds = new Set(columns.map((c) => c.id))
  const invalidIds = columnIds.filter((id) => !foundIds.has(id))
  if (invalidIds.length > 0) {
    return NextResponse.json({ error: `Invalid custom column IDs: ${invalidIds.join(', ')}` }, { status: 400 })
  }

  // Upsert each value
  const entries = Object.entries(values) as [string, string][]
  await Promise.all(
    entries.map(([customColumnId, value]) =>
      db.companyCustomValue.upsert({
        where: {
          companyId_customColumnId: { companyId, customColumnId },
        },
        create: {
          companyId,
          customColumnId,
          value: value != null ? String(value) : '',
        },
        update: {
          value: value != null ? String(value) : '',
        },
      })
    )
  )

  // Return updated values
  const updatedValues = await db.companyCustomValue.findMany({
    where: { companyId },
    include: { customColumn: true },
  })

  return NextResponse.json({ values: updatedValues })
}
