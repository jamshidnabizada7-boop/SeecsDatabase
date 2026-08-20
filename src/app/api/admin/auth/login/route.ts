import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, createAdminToken, SESSION_COOKIE } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }
  const admin = await db.adminUser.findUnique({ where: { email: String(email).toLowerCase() } })
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const token = createAdminToken({ adminId: admin.id, email: admin.email, role: admin.role })
  const res = NextResponse.json({ ok: true, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
