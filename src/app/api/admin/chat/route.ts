import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { runChat, buildDatabaseSnapshot, getLlmConfig } from '@/lib/llm'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const s = await getAdminFromRequest()
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message } = await req.json().catch(() => ({}))
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  // Load any recent chat history for continuity (last 10 turns)
  const history = await db.chatLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
  const orderedHistory = history.reverse()
  const historyMessages = orderedHistory.map((h) => ({
    role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: h.content,
  }))

  // Build the live DB snapshot for grounding
  const dbContext = await buildDatabaseSnapshot()

  const result = await runChat([...historyMessages, { role: 'user', content: message }], { dbContext })

  // Persist both turns
  await db.chatLog.createMany({
    data: [
      { role: 'user', content: message },
      { role: 'assistant', content: result.content },
    ],
  })

  const cfg = await getLlmConfig()
  return NextResponse.json({
    reply: result.content,
    provider: result.provider,
    model: result.model,
    error: result.error,
    enabled: cfg.enabled,
  })
}
