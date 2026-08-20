import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  await requireAdmin()

  const companies = await db.company.findMany({
    include: { sector: true, city: true },
    orderBy: { name: 'asc' },
  })

  const headers = [
    'Name', 'Email', 'Phone', 'Website', 'Status',
    'Since Date', 'Founded Year', 'Branches', 'Revenue',
    'Sector', 'City', 'API Key',
  ]

  const rows = companies.map((c) => [
    c.name,
    c.email || '',
    c.phone || '',
    c.website || '',
    c.status || '',
    c.sinceDate || '',
    c.foundedYear?.toString() || '',
    c.branchesCount?.toString() || '',
    c.revenue?.toString() || '',
    c.sector.name,
    c.city.name,
    c.apiKey,
  ])

  const csvLines = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""') }"`).join(',')),
  ]

  const csv = csvLines.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="companies-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
