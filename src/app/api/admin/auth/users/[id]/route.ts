import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'

// DELETE /api/admin/auth/users/[id] — delete an admin user
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (id === s.adminId) {
    return NextResponse.json({ error: 'You cannot delete your own logged-in account' }, { status: 400 })
  }

  const count = await db.adminUser.count()
  if (count <= 1) {
    return NextResponse.json({ error: 'Cannot delete the only database manager in the system' }, { status: 400 })
  }

  await db.adminUser.delete({ where: { id } })
  return NextResponse.json({ ok: true, message: 'Admin account removed.' })
}

// PUT /api/admin/auth/users/[id] — update or reset password for an admin user
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { name, email, password, role } = body

  const updateData: Record<string, string> = {}
  if (name) updateData.name = String(name).trim()
  if (email) updateData.email = String(email).trim().toLowerCase()
  if (role) updateData.role = role
  if (password) {
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    updateData.passwordHash = hashPassword(password)
  }

  const updated = await db.adminUser.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, updatedAt: true },
  })

  return NextResponse.json({ ok: true, user: updated, message: 'Admin account updated.' })
}
