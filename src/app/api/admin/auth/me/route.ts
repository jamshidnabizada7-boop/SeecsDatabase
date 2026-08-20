import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ admin: null })
  const admin = await db.adminUser.findUnique({ where: { id: s.adminId } })
  if (!admin) return NextResponse.json({ admin: null })
  return NextResponse.json({ admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } })
}
