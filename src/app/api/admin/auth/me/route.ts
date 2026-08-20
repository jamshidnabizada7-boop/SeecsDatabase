import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, createAdminToken, SESSION_COOKIE, hashPassword } from '@/lib/auth'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  // Login mode via query params (for backwards compatibility)
  if (searchParams.get('login')) {
    const email = searchParams.get('email')
    const passwordHash = searchParams.get('hash')
    if (!email || !passwordHash) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    let admin = await db.adminUser.findUnique({ where: { email: normalizedEmail } })

    // If no admin user exists in DB at all, auto-bootstrap the first one
    if (!admin) {
      const totalAdmins = await db.adminUser.count()
      if (totalAdmins === 0) {
        admin = await db.adminUser.create({
          data: {
            email: normalizedEmail,
            name: 'SEECS Database Manager',
            passwordHash,
            role: 'superadmin',
          },
        })
      }
    }

    if (!admin || passwordHash !== admin.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { email, password, hash } = body

  if (!email || (!password && !hash)) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const passwordHash = hash || hashPassword(password)

  let admin = await db.adminUser.findUnique({ where: { email: normalizedEmail } })

  // Auto-bootstrap if database has 0 admins
  if (!admin) {
    const totalAdmins = await db.adminUser.count()
    if (totalAdmins === 0) {
      admin = await db.adminUser.create({
        data: {
          email: normalizedEmail,
          name: 'SEECS Database Manager',
          passwordHash,
          role: 'superadmin',
        },
      })
    }
  }

  if (!admin || passwordHash !== admin.passwordHash) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
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
