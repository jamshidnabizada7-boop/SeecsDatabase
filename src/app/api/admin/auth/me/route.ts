import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, createAdminToken, SESSION_COOKIE } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  // Login mode: ?login=1&email=...&hash=...
  if (searchParams.get('login')) {
    const email = searchParams.get('email')
    const passwordHash = searchParams.get('hash')
    if (!email || !passwordHash) {
      return NextResponse.json({ error: 'Email and hash are required' }, { status: 400 })
    }
    const admin = await db.adminUser.findUnique({ where: { email: String(email).toLowerCase() } })
    if (!admin || passwordHash !== admin.passwordHash) {
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

  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ admin: null })
  const admin = await db.adminUser.findUnique({ where: { id: s.adminId } })
  if (!admin) return NextResponse.json({ admin: null })
  return NextResponse.json({ admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } })
}
