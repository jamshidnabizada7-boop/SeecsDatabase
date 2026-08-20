import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export type LlmProvider = 'zai' | 'openai' | 'anthropic' | 'custom'

export interface LlmConfig {
  provider: LlmProvider
  apiKey: string | null
  baseUrl: string | null
  model: string
  systemPrompt: string | null
  temperature: number
  enabled: boolean
}

export const DEFAULT_SYSTEM_PROMPT = `You are SEECS Assistant, an intelligent helper for the database manager of the SEECS (School of Electrical Engineering and Computer Science) database at NUST University Islamabad.

You help the database manager answer questions about the companies, founders, sectors, cities, locations, degrees, and annual financial data stored in the system.

Guidelines:
- Answer clearly and concisely.
- When given a DATABASE SNAPSHOT, ground your answers in those numbers. Quote the specific figures.
- If asked for analytics (e.g. "how many companies in Data Science?", "how many female founders?", "what are the monthly revenues?"), use the snapshot numbers and show short tables when useful.
- If the snapshot does not contain the information, say so honestly instead of inventing numbers.
- Never invent company names, founders, or revenue figures that are not in the snapshot.
- Be professional. Use bullet points or short tables for readability.`

export async function getLlmConfig(): Promise<LlmConfig> {
  const row = await db.llmSettings.findUnique({ where: { id: 'default' } })
  if (!row) {
    return {
      provider: 'zai',
      apiKey: null,
      baseUrl: null,
      model: 'glm-4.6',
      systemPrompt: null,
      temperature: 0.3,
      enabled: true,
    }
  }
  return {
    provider: row.provider as LlmProvider,
    apiKey: row.apiKey,
    baseUrl: row.baseUrl,
    model: row.model,
    systemPrompt: row.systemPrompt,
    temperature: row.temperature,
    enabled: row.enabled,
  }
}

// Build a compact text snapshot of the database for the LLM context.
// This is what makes the chatbot "know" about the data without SQL access.
export async function buildDatabaseSnapshot(): Promise<string> {
  const [
    sectors,
    cities,
    degrees,
    founders,
    companies,
    annualData,
  ] = await Promise.all([
    db.sector.findMany({ include: { _count: { select: { companies: true } } } }),
    db.city.findMany({ include: { _count: { select: { companies: true } } } }),
    db.degree.findMany({ include: { _count: { select: { founders: true } } } }),
    db.founder.findMany({ include: { degree: true } }),
    db.company.findMany({
      include: {
        sector: true,
        city: true,
        location: true,
        founders: { include: { founder: true } },
      },
    }),
    db.companyAnnualData.findMany({ orderBy: { year: 'asc' } }),
  ])

  const totalFounders = founders.length
  const maleFounders = founders.filter((f) => f.gender === 'Male').length
  const femaleFounders = founders.filter((f) => f.gender === 'Female').length
  const otherFounders = totalFounders - maleFounders - femaleFounders

  const totalRevenue = annualData.reduce((s, r) => s + Number(r.totalRevenue), 0)
  const totalMonthlyAvg = annualData.length
    ? annualData.reduce((s, r) => s + Number(r.monthlyRevenue), 0) / annualData.length
    : 0
  const totalEmployees = annualData.reduce((s, r) => s + r.employeeCount, 0)
  const totalProjects = annualData.reduce((s, r) => s + r.projectCount, 0)

  // by sector
  const bySector = sectors.map((s) => ({
    sector: s.name,
    companies: s._count.companies,
  }))

  // by city
  const byCity = cities.map((c) => ({
    city: c.name,
    companies: c._count.companies,
  }))

  // per-year totals
  const byYear: Record<number, { revenue: number; employees: number; projects: number; companies: number }> = {}
  for (const r of annualData) {
    if (!byYear[r.year]) byYear[r.year] = { revenue: 0, employees: 0, projects: 0, companies: 0 }
    byYear[r.year].revenue += Number(r.totalRevenue)
    byYear[r.year].employees += r.employeeCount
    byYear[r.year].projects += r.projectCount
    byYear[r.year].companies += 1
  }

  // per-company snapshot (compact)
  const companyLines = companies.map((c) => {
    const f = c.founders.map((cf) => `${cf.founder.firstName} ${cf.founder.lastName} (${cf.founder.gender}, ${cf.role})`).join('; ')
    return `- ${c.name} [${c.sector.name}, ${c.city.name}]: founders=[${f || 'none'}]; website=${c.website || 'n/a'}`
  })

  const snapshot = `DATABASE SNAPSHOT (live figures):
- Companies: ${companies.length}
- Founders: ${totalFounders} (Male: ${maleFounders}, Female: ${femaleFounders}, Other: ${otherFounders})
- Sectors: ${sectors.length}
- Cities: ${cities.length}
- Degrees: ${degrees.length}
- Annual data records: ${annualData.length}
- Total revenue (all years): PKR ${totalRevenue.toLocaleString()}
- Average monthly revenue per record: PKR ${Math.round(totalMonthlyAvg).toLocaleString()}
- Total employees (sum across records): ${totalEmployees}
- Total projects (sum across records): ${totalProjects}

COMPANIES BY SECTOR:
${bySector.map((s) => `- ${s.sector}: ${s.companies}`).join('\n') || '- (none)'}

COMPANIES BY CITY:
${byCity.map((c) => `- ${c.city}: ${c.companies}`).join('\n') || '- (none)'}

ANNUAL AGGREGATES BY YEAR:
${Object.entries(byYear).map(([y, v]) => `- ${y}: revenue=PKR ${v.revenue.toLocaleString()}, employees=${v.employees}, projects=${v.projects}, records=${v.companies}`).join('\n') || '- (none)'}

COMPANIES (compact):
${companyLines.join('\n') || '- (none)'}`

  return snapshot
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatResult {
  content: string
  provider: LlmProvider
  model: string
  error?: string
}

/**
 * Run a chat completion using the admin-configured LLM.
 *
 * Provider routing:
 *  - "zai": use the bundled z-ai-web-dev-sdk (works out of the box, no extra key needed)
 *  - "openai" / "custom": use a fetch to `${baseUrl}/chat/completions` (OpenAI-compatible)
 *  - "anthropic": use a fetch to Anthropic's messages API (or a baseUrl override)
 *
 * The admin can change everything from the Settings page without touching code.
 */
export async function runChat(messages: ChatMessage[], opts?: { dbContext?: string }): Promise<ChatResult> {
  const cfg = await getLlmConfig()

  if (!cfg.enabled) {
    return { content: 'The assistant is currently disabled by the administrator.', provider: cfg.provider, model: cfg.model, error: 'disabled' }
  }

  const system = cfg.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: system },
  ]
  if (opts?.dbContext) {
    fullMessages.push({ role: 'system', content: opts.dbContext })
  }
  fullMessages.push(...messages)

  try {
    if (cfg.provider === 'zai') {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        // zai SDK accepts "assistant" role as system, but standard OpenAI is "system".
        // The SDK actually expects messages with role 'assistant' for system - we follow the docs.
        messages: fullMessages.map((m) => ({
          role: m.role === 'system' ? 'assistant' : m.role,
          content: m.content,
        })) as any,
        thinking: { type: 'disabled' },
      })
      const content = completion.choices?.[0]?.message?.content ?? ''
      return { content, provider: cfg.provider, model: cfg.model }
    }

    if (cfg.provider === 'openai' || cfg.provider === 'custom') {
      const baseUrl = cfg.baseUrl || 'https://api.openai.com/v1'
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: fullMessages,
          temperature: cfg.temperature,
        }),
      })
      if (!res.ok) {
        const t = await res.text()
        return { content: `LLM request failed (${res.status}): ${t.slice(0, 200)}`, provider: cfg.provider, model: cfg.model, error: 'http' }
      }
      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content ?? ''
      return { content, provider: cfg.provider, model: cfg.model }
    }

    if (cfg.provider === 'anthropic') {
      const baseUrl = cfg.baseUrl || 'https://api.anthropic.com/v1'
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.apiKey || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: cfg.model,
          system: system + (opts?.dbContext ? `\n\n${opts.dbContext}` : ''),
          messages: messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
          max_tokens: 1024,
          temperature: cfg.temperature,
        }),
      })
      if (!res.ok) {
        const t = await res.text()
        return { content: `Anthropic request failed (${res.status}): ${t.slice(0, 200)}`, provider: cfg.provider, model: cfg.model, error: 'http' }
      }
      const data = await res.json()
      const content = data?.content?.map((c: any) => c.text).join('') ?? ''
      return { content, provider: cfg.provider, model: cfg.model }
    }

    return { content: `Unknown provider: ${cfg.provider}`, provider: cfg.provider, model: cfg.model, error: 'provider' }
  } catch (e: any) {
    return { content: `LLM call failed: ${e?.message ?? String(e)}`, provider: cfg.provider, model: cfg.model, error: 'exception' }
  }
}
