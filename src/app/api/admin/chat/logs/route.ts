import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.chatLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  return NextResponse.json({ items })
}

export async function DELETE() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.chatLog.deleteMany({})
  return NextResponse.json({ ok: true })
}
