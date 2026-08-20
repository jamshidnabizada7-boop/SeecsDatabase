import { db } from '@/lib/db'
import crypto from 'crypto'

// Simple SHA-256 hashing for dev-only passwords. NOT cryptographically strong
// for production - swap for bcrypt in real deployment. But it avoids extra deps.
export function hashPassword(pw: string): string {
  return crypto.createHash('sha256').update(pw).digest('hex')
}

export function verifyPassword(pw: string, hash: string): boolean {
  return hashPassword(pw) === hash
}

export const SESSION_COOKIE = 'seecs_admin_session'
export const COMPANY_COOKIE = 'seecs_company_session'

const SESSION_SECRET = process.env.SESSION_SECRET || 'seecs-dev-secret-change-me'

function sign(payload: string): string {
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

function verify<T>(token: string | undefined | null): T | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  const sig = parts.pop()!
  const payload = parts.join('.')
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  if (sig !== expected) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as T
  } catch {
    return null
  }
}

function makeToken(data: unknown): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
  return sign(payload)
}

// ---------- Admin session ----------
export type AdminSession = { adminId: string; email: string; role: string }

export function createAdminToken(s: AdminSession): string {
  return makeToken(s)
}

export function readAdminToken(token: string | undefined | null): AdminSession | null {
  return verify<AdminSession>(token)
}

// ---------- Company session ----------
export type CompanySession = { companyId: string; apiKey: string }

export function createCompanyToken(s: CompanySession): string {
  return makeToken(s)
}

export function readCompanyToken(token: string | undefined | null): CompanySession | null {
  return verify<CompanySession>(token)
}

// ---------- Server-side helpers (for API routes) ----------
import { cookies } from 'next/headers'

export async function getAdminFromRequest(): Promise<AdminSession | null> {
  const c = await cookies()
  return readAdminToken(c.get(SESSION_COOKIE)?.value)
}

export async function requireAdmin(): Promise<AdminSession> {
  const s = await getAdminFromRequest()
  if (!s) throw new Error('Unauthorized')
  return s
}

export async function getCompanyFromRequest(): Promise<CompanySession | null> {
  const c = await cookies()
  return readCompanyToken(c.get(COMPANY_COOKIE)?.value)
}

export async function requireCompany(): Promise<CompanySession> {
  const s = await getCompanyFromRequest()
  if (!s) throw new Error('Unauthorized')
  return s
}

// Resolve the actual Company row (verified) for the current company session.
// This is the single source of truth for "which company am I allowed to touch".
export async function getCurrentCompany() {
  const s = await requireCompany()
  const company = await db.company.findFirst({
    where: { id: s.companyId, apiKey: s.apiKey, apiKeyActive: true },
  })
  if (!company) throw new Error('Company not found or key revoked')
  return company
}
