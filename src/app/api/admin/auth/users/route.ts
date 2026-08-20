import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'

// GET /api/admin/auth/users — list all database manager accounts
export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await db.adminUser.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ users, currentAdminId: s.adminId })
}

// POST /api/admin/auth/users — create a new database manager
export async function POST(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { name, email, password, role = 'admin' } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
  }

  if (String(password).length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = await db.adminUser.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: 'An admin with this email already exists' }, { status: 409 })
  }

  const passwordHash = hashPassword(password)
  const newUser = await db.adminUser.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: role === 'superadmin' ? 'superadmin' : 'admin',
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return NextResponse.json({
    ok: true,
    user: newUser,
    message: `Database Manager ${newUser.name} created successfully.`,
  })
}
