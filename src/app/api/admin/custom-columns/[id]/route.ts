import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

// GET: Return a single custom column
export async function GET(_req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const item = await db.customColumn.findUnique({
    where: { id },
    include: { _count: { select: { values: true } } },
  })
  if (!item) return NextResponse.json({ error: 'Custom column not found' }, { status: 404 })
  return NextResponse.json({ item })
}

// PUT: Update a custom column (validate slug uniqueness)
export async function PUT(req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const { name, columnType, targetTable, description, required, sortOrder } = body

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = String(name).trim()
  if (columnType !== undefined) data.columnType = String(columnType)
  if (targetTable !== undefined) data.targetTable = String(targetTable)
  if (description !== undefined) data.description = description || null
  if (required !== undefined) data.required = !!required
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder)

  const item = await db.customColumn.update({
    where: { id },
    data,
    include: { _count: { select: { values: true } } },
  })
  return NextResponse.json({ item })
}

// DELETE: Delete a custom column (cascades to values)
export async function DELETE(_req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  try {
    await db.customColumn.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete custom column' }, { status: 500 })
  }
}
