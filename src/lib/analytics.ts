import { db } from '@/lib/db'

export interface DashboardStats {
  totalCompanies: number
  totalFounders: number
  maleFounders: number
  femaleFounders: number
  otherFounders: number
  totalSectors: number
  totalCities: number
  totalDegrees: number
  totalAnnualRecords: number
  totalRevenueAllTime: number
  avgMonthlyRevenue: number
  totalEmployees: number
  totalProjects: number
  bySector: { name: string; companies: number; revenue: number }[]
  byCity: { name: string; companies: number }[]
  byGender: { name: string; value: number; color: string }[]
  byStatus: { name: string; value: number; color: string }[]
  byDepartment: { name: string; value: number }[]
  byDegreeField: { name: string; value: number }[]
  byYear: { year: number; revenue: number; employees: number; projects: number }[]
  topCompaniesByRevenue: { name: string; revenue: number; sector: string }[]
  recentCompanies: { id: string; name: string; sector: string; city: string; registeredAt: string; apiKey: string; status: string | null }[]
  notableHighlights: { title: string; subtitle: string; tag: string }[]
  monthlyTrend: { month: string; value: number }[]
}

const GENDER_COLORS: Record<string, string> = {
  Male: '#3B82F6',
  Female: '#EC4899',
  Other: '#9CA3AF',
}

const STATUS_COLORS: Record<string, string> = {
  Operational: '#10B981',
  Active: '#059669',
  Acquired: '#3B82F6',
  Inactive: '#F59E0B',
  Discontinued: '#EF4444',
  Registered: '#6B7280',
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [sectors, cities, degrees, founders, companies, annualData] = await Promise.all([
    db.sector.findMany({ include: { _count: { select: { companies: true } } } }),
    db.city.findMany({ include: { _count: { select: { companies: true } } } }),
    db.degree.findMany({ include: { _count: { select: { founders: true } } } }),
    db.founder.findMany({ include: { degree: true } }),
    db.company.findMany({ include: { sector: true, city: true, annualData: true }, orderBy: { registeredAt: 'desc' } }),
    db.companyAnnualData.findMany({ include: { company: { include: { sector: true } } }, orderBy: { year: 'asc' } }),
  ])

  const maleFounders = founders.filter((f) => f.gender === 'Male').length
  const femaleFounders = founders.filter((f) => f.gender === 'Female').length
  const otherFounders = founders.length - maleFounders - femaleFounders

  // 1. Sector breakdown (ONLY sectors that have companies registered, top 10)
  const sectorRevenue: Record<string, number> = {}
  for (const r of annualData) {
    const s = r.company.sector.name
    sectorRevenue[s] = (sectorRevenue[s] || 0) + Number(r.totalRevenue)
  }
  const bySector = sectors
    .filter((s) => s._count.companies > 0)
    .map((s) => ({
      name: s.name,
      companies: s._count.companies,
      revenue: sectorRevenue[s.name] || 0,
    }))
    .sort((a, b) => b.companies - a.companies)
    .slice(0, 10)

  // 2. City breakdown (ONLY cities that have companies, top 8)
  const byCity = cities
    .filter((c) => c._count.companies > 0)
    .map((c) => ({ name: c.name, companies: c._count.companies }))
    .sort((a, b) => b.companies - a.companies)
    .slice(0, 8)

  // 3. Gender breakdown
  const genderAgg: Record<string, number> = { Male: maleFounders, Female: femaleFounders, Other: otherFounders }
  const byGender = Object.entries(genderAgg)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: GENDER_COLORS[name] || '#9CA3AF' }))

  // 4. Status / Lifecycle breakdown
  const statusAgg: Record<string, number> = {}
  for (const c of companies) {
    const st = c.status || 'Operational'
    statusAgg[st] = (statusAgg[st] || 0) + 1
  }
  const byStatus = Object.entries(statusAgg).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name] || '#10B981',
  }))

  // 5. Academic Department breakdown
  const deptAgg: Record<string, number> = {}
  for (const f of founders) {
    let dept = f.department || f.degree?.field || f.degree?.name || 'Computer Science'
    if (dept.toLowerCase().includes('comp') || dept.toLowerCase().includes('cs')) dept = 'Computer Science (CS)'
    else if (dept.toLowerCase().includes('soft') || dept.toLowerCase().includes('se')) dept = 'Software Engineering (SE)'
    else if (dept.toLowerCase().includes('elec') || dept.toLowerCase().includes('ee')) dept = 'Electrical Engineering (EE)'
    else if (dept.toLowerCase().includes('data') || dept.toLowerCase().includes('ai')) dept = 'AI & Data Science'
    deptAgg[dept] = (deptAgg[dept] || 0) + 1
  }
  const byDepartment = Object.entries(deptAgg)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // 6. Degree breakdown
  const fieldAgg: Record<string, number> = {}
  for (const d of degrees) {
    const f = d.field || d.name
    fieldAgg[f] = (fieldAgg[f] || 0) + d._count.founders
  }
  const byDegreeField = Object.entries(fieldAgg)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // 7. Year-over-Year aggregation
  const yearAgg: Record<number, { revenue: number; employees: number; projects: number }> = {}
  for (const r of annualData) {
    if (!yearAgg[r.year]) yearAgg[r.year] = { revenue: 0, employees: 0, projects: 0 }
    yearAgg[r.year].revenue += Number(r.totalRevenue)
    yearAgg[r.year].employees += r.employeeCount
    yearAgg[r.year].projects += r.projectCount
  }
  const byYear = Object.entries(yearAgg)
    .map(([year, v]) => ({ year: Number(year), ...v }))
    .sort((a, b) => a.year - b.year)

  // 8. Top companies by revenue (annual data + declared company revenue)
  const companyRev: Record<string, { name: string; sector: string; revenue: number }> = {}
  for (const c of companies) {
    let rev = c.revenue || 0
    for (const ad of c.annualData) {
      rev += Number(ad.totalRevenue || 0)
    }
    if (rev > 0) {
      companyRev[c.name] = { name: c.name, sector: c.sector.name, revenue: rev }
    }
  }
  const topCompaniesByRevenue = Object.values(companyRev).sort((a, b) => b.revenue - a.revenue).slice(0, 8)

  const annualRevSum = annualData.reduce((s, r) => s + Number(r.totalRevenue), 0)
  const declaredRevSum = companies.reduce((s, c) => s + (c.revenue || 0), 0)
  const totalRevenueAllTime = annualRevSum + declaredRevSum
  const avgMonthlyRevenue = annualData.length
    ? annualData.reduce((s, r) => s + Number(r.monthlyRevenue), 0) / annualData.length
    : 0

  const monthAgg: number[] = new Array(12).fill(0)
  const monthCount: number[] = new Array(12).fill(0)
  for (const r of annualData) {
    for (let m = 0; m < 12; m++) {
      monthAgg[m] += Number(r.monthlyRevenue)
      monthCount[m] += 1
    }
  }
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyTrend = monthLabels.map((month, i) => ({
    month,
    value: monthCount[i] ? Math.round(monthAgg[i] / monthCount[i]) : 0,
  }))

  const recentCompanies = companies.slice(0, 8).map((c) => ({
    id: c.id,
    name: c.name,
    sector: c.sector.name,
    city: c.city.name,
    registeredAt: c.registeredAt.toISOString(),
    apiKey: c.apiKey,
    status: c.status,
  }))

  const notableHighlights = [
    { title: 'Presize.ai', subtitle: 'Acquired by Meta (Facebook) — Forbes 30 Under 30 Europe', tag: 'Acquired' },
    { title: 'TalkwithStranger!', subtitle: '3M+ Daily Visitors Social Network, founded from MS Thesis', tag: 'Global Scale' },
    { title: 'Pantera Energy', subtitle: 'Nationwide Renewable Energy leader with country-wide presence', tag: 'Market Leader' },
    { title: 'Vyro / LearnOBots', subtitle: 'Top EdTech & Mobile AI content studios incubated at SEECS', tag: 'Innovation' },
  ]

  return {
    totalCompanies: companies.length,
    totalFounders: founders.length,
    maleFounders,
    femaleFounders,
    otherFounders,
    totalSectors: sectors.length,
    totalCities: cities.length,
    totalDegrees: degrees.length,
    totalAnnualRecords: annualData.length,
    totalRevenueAllTime,
    avgMonthlyRevenue,
    totalEmployees: annualData.reduce((s, r) => s + r.employeeCount, 0),
    totalProjects: annualData.reduce((s, r) => s + r.projectCount, 0),
    bySector,
    byCity,
    byGender,
    byStatus,
    byDepartment,
    byDegreeField,
    byYear,
    topCompaniesByRevenue,
    recentCompanies,
    notableHighlights,
    monthlyTrend,
  }
}
