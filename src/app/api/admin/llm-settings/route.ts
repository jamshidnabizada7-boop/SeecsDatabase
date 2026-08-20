import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const row = await db.llmSettings.findUnique({ where: { id: 'default' } })
  // Mask the apiKey when returning for display - admin can still set a new one.
  const masked = row?.apiKey ? maskKey(row.apiKey) : null
  return NextResponse.json({
    settings: row
      ? {
          provider: row.provider,
          apiKeyMasked: masked,
          hasApiKey: !!row.apiKey,
          baseUrl: row.baseUrl,
          model: row.model,
          systemPrompt: row.systemPrompt,
          temperature: row.temperature,
          enabled: row.enabled,
        }
      : null,
  })
}

function maskKey(k: string) {
  if (k.length <= 8) return '****'
  return k.slice(0, 4) + '••••' + k.slice(-4)
}

export async function PUT(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { provider, apiKey, baseUrl, model, systemPrompt, temperature, enabled } = body

  const data: any = {}
  if (provider !== undefined) data.provider = provider
  // Only overwrite apiKey if a non-empty string is provided (so masked display doesn't wipe it)
  if (apiKey !== undefined && apiKey !== '' && apiKey !== null) data.apiKey = String(apiKey)
  if (baseUrl !== undefined) data.baseUrl = baseUrl || null
  if (model !== undefined) data.model = String(model).trim()
  if (systemPrompt !== undefined) data.systemPrompt = systemPrompt || null
  if (temperature !== undefined) data.temperature = Number(temperature)
  if (enabled !== undefined) data.enabled = !!enabled

  const row = await db.llmSettings.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data, apiKey: data.apiKey ?? null },
  })
  return NextResponse.json({
    settings: {
      provider: row.provider,
      apiKeyMasked: row.apiKey ? maskKey(row.apiKey) : null,
      hasApiKey: !!row.apiKey,
      baseUrl: row.baseUrl,
      model: row.model,
      systemPrompt: row.systemPrompt,
      temperature: row.temperature,
      enabled: row.enabled,
    },
  })
}
