import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentCompany } from '@/lib/auth'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

// Helpers: every mutation verifies the founder is attached to THIS company.
async function getOwnedLink(companyId: string, founderId: string) {
  return db.companyFounder.findFirst({ where: { companyId, founderId } })
}

// Attach an existing founder to this company (cannot affect other companies' attachments)
export async function POST(req: Request, _ctx: Ctx) {
  const company = await getCurrentCompany()
  const { founderId, role } = await req.json().catch(() => ({}))
  if (!founderId) return NextResponse.json({ error: 'founderId is required' }, { status: 400 })
  const existing = await getOwnedLink(company.id, founderId)
  if (existing) return NextResponse.json({ item: existing })
  const cf = await db.companyFounder.create({ data: { companyId: company.id, founderId, role: role || 'Co-Founder' }, include: { founder: { include: { degree: true } } } })
  return NextResponse.json({ item: cf })
}

// Update role of the link (NOT the founder's personal data - that may be shared)
export async function PUT(req: Request, ctx: Ctx) {
  const company = await getCurrentCompany()
  const { id } = await ctx.params
  const link = await getOwnedLink(company.id, id)
  if (!link) return NextResponse.json({ error: 'Not attached to your company' }, { status: 403 })
  const { role } = await req.json().catch(() => ({}))
  if (!role) return NextResponse.json({ error: 'Role is required' }, { status: 400 })
  const updated = await db.companyFounder.update({ where: { id: link.id }, data: { role }, include: { founder: { include: { degree: true } } } })
  return NextResponse.json({ item: updated })
}

// Detach founder from THIS company only (does NOT delete the founder row itself)
export async function DELETE(_req: Request, ctx: Ctx) {
  const company = await getCurrentCompany()
  const { id } = await ctx.params
  const link = await getOwnedLink(company.id, id)
  if (!link) return NextResponse.json({ error: 'Not attached to your company' }, { status: 403 })
  await db.companyFounder.delete({ where: { id: link.id } })
  return NextResponse.json({ ok: true })
}
