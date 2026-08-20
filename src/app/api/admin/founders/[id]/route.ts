import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const { firstName, lastName, gender, email, phone, department, degreeId } = body
  if (!firstName || !lastName || !gender) return NextResponse.json({ error: 'First name, last name and gender are required' }, { status: 400 })
  if (!['Male', 'Female', 'Other'].includes(gender)) return NextResponse.json({ error: 'Invalid gender' }, { status: 400 })
  const item = await db.founder.update({
    where: { id },
    data: {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      gender,
      email: email ? String(email).trim() : null,
      phone: phone ? String(phone).trim() : null,
      department: department ? String(department).trim() : null,
      degreeId: degreeId || null,
    },
  })
  return NextResponse.json({ item })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  try {
    await db.founder.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete founder' }, { status: 500 })
  }
}
