import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'

// GET /api/admin/auth/profile — get current admin info
export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await db.adminUser.findUnique({
    where: { id: s.adminId },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  })
  if (!admin) return NextResponse.json({ error: 'Admin account not found' }, { status: 404 })

  return NextResponse.json({ admin })
}

// PUT /api/admin/auth/profile — update name, email, or change password
export async function PUT(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { name, email, currentPassword, newPassword } = body

  const admin = await db.adminUser.findUnique({ where: { id: s.adminId } })
  if (!admin) return NextResponse.json({ error: 'Admin account not found' }, { status: 404 })

  const updateData: Record<string, string> = {}

  if (name && String(name).trim().length >= 2) {
    updateData.name = String(name).trim()
  }

  if (email && String(email).trim().toLowerCase() !== admin.email.toLowerCase()) {
    const newEmail = String(email).trim().toLowerCase()
    const existing = await db.adminUser.findUnique({ where: { email: newEmail } })
    if (existing && existing.id !== admin.id) {
      return NextResponse.json({ error: 'Another admin already uses this email address' }, { status: 409 })
    }
    updateData.email = newEmail
  }

  // Password change handling
  if (newPassword) {
    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 })
    }

    // Verify current password if provided
    if (currentPassword) {
      const currentHash = hashPassword(currentPassword)
      if (currentHash !== admin.passwordHash) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
    }

    updateData.passwordHash = hashPassword(newPassword)
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
  }

  const updated = await db.adminUser.update({
    where: { id: s.adminId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, updatedAt: true },
  })

  return NextResponse.json({
    ok: true,
    admin: updated,
    message: newPassword ? 'Profile and password updated successfully.' : 'Profile updated successfully.',
  })
}
