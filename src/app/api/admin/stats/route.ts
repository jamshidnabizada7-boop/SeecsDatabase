import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/analytics'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const stats = await getDashboardStats()
  return NextResponse.json(stats)
}
