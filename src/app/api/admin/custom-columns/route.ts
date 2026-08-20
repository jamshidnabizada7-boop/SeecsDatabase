import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '')  // remove special chars (keep spaces, hyphens, underscores)
    .replace(/[\s-]+/g, '_')         // replace spaces/hyphens with underscores
    .replace(/_+/g, '_')              // collapse multiple underscores
    .replace(/^_|_$/g, '')            // trim leading/trailing underscores
}

// GET: Return all custom columns ordered by sortOrder
export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.customColumn.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { values: true } } },
  })
  return NextResponse.json({ items })
}

// POST: Create a new custom column with auto-generated slug
export async function POST(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { name, columnType, targetTable, description, required, sortOrder } = body

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const validTypes = ['text', 'number', 'date', 'boolean', 'url']
  const type = columnType || 'text'
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `Invalid columnType. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
  }

  const validTargets = ['company', 'founder']
  const target = targetTable || 'company'
  if (!validTargets.includes(target)) {
    return NextResponse.json({ error: `Invalid targetTable. Must be one of: ${validTargets.join(', ')}` }, { status: 400 })
  }

  let slug = slugify(String(name).trim())
  if (!slug) {
    return NextResponse.json({ error: 'Name must contain at least one alphanumeric character' }, { status: 400 })
  }

  // Ensure slug uniqueness by appending a numeric suffix if needed
  const existing = await db.customColumn.findUnique({ where: { slug } })
  if (existing) {
    let counter = 2
    while (await db.customColumn.findUnique({ where: { slug: `${slug}_${counter}` } })) {
      counter++
    }
    slug = `${slug}_${counter}`
  }

  const item = await db.customColumn.create({
    data: {
      name: String(name).trim(),
      slug,
      columnType: type,
      targetTable: target,
      description: description != null ? String(description) : null,
      required: !!required,
      sortOrder: sortOrder != null ? Number(sortOrder) : 0,
    },
  })
  return NextResponse.json({ item })
}
