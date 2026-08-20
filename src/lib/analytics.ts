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
  byDegreeField: { name: string; value: number }[]
  byYear: { year: number; revenue: number; employees: number; projects: number }[]
  topCompaniesByRevenue: { name: string; revenue: number; sector: string }[]
  recentCompanies: { id: string; name: string; sector: string; city: string; registeredAt: string; apiKey: string; status: string | null }[]
  // monthly revenue trend per year (12 buckets per year, averaged across companies)
  monthlyTrend: { month: string; value: number }[]
}

const GENDER_COLORS: Record<string, string> = {
  Male: 'hsl(217 91% 45%)',
  Female: 'hsl(330 81% 60%)',
  Other: 'hsl(38 92% 50%)',
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [sectors, cities, degrees, founders, companies, annualData] = await Promise.all([
    db.sector.findMany({ include: { _count: { select: { companies: true } } } }),
    db.city.findMany({ include: { _count: { select: { companies: true } } } }),
    db.degree.findMany({ include: { _count: { select: { founders: true } } } }),
    db.founder.findMany(),
    db.company.findMany({ include: { sector: true, city: true, annualData: true }, orderBy: { registeredAt: 'desc' } }),
    db.companyAnnualData.findMany({ include: { company: { include: { sector: true } } }, orderBy: { year: 'asc' } }),
  ])

  const maleFounders = founders.filter((f) => f.gender === 'Male').length
  const femaleFounders = founders.filter((f) => f.gender === 'Female').length
  const otherFounders = founders.length - maleFounders - femaleFounders

  // sector breakdown with revenue
  const sectorRevenue: Record<string, number> = {}
  for (const r of annualData) {
    const s = r.company.sector.name
    sectorRevenue[s] = (sectorRevenue[s] || 0) + Number(r.totalRevenue)
  }
  const bySector = sectors
    .map((s) => ({
      name: s.name,
      companies: s._count.companies,
      revenue: sectorRevenue[s.name] || 0,
    }))
    .sort((a, b) => b.companies - a.companies)

  const byCity = cities
    .map((c) => ({ name: c.name, companies: c._count.companies }))
    .sort((a, b) => b.companies - a.companies)

  const genderAgg: Record<string, number> = { Male: maleFounders, Female: femaleFounders, Other: otherFounders }
  const byGender = Object.entries(genderAgg)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: GENDER_COLORS[name] || 'hsl(0 0% 50%)' }))

  // by degree field
  const fieldAgg: Record<string, number> = {}
  for (const d of degrees) {
    const f = d.field || 'Unspecified'
    fieldAgg[f] = (fieldAgg[f] || 0) + d._count.founders
  }
  const byDegreeField = Object.entries(fieldAgg).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  // by year
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

  // top companies by total revenue across all years
  const companyRev: Record<string, { name: string; sector: string; revenue: number }> = {}
  for (const r of annualData) {
    const key = r.company.name
    if (!companyRev[key]) companyRev[key] = { name: key, sector: r.company.sector.name, revenue: 0 }
    companyRev[key].revenue += Number(r.totalRevenue)
  }
  const topCompaniesByRevenue = Object.values(companyRev).sort((a, b) => b.revenue - a.revenue).slice(0, 8)

  const totalRevenueAllTime = annualData.reduce((s, r) => s + Number(r.totalRevenue), 0)
  const avgMonthlyRevenue = annualData.length
    ? annualData.reduce((s, r) => s + Number(r.monthlyRevenue), 0) / annualData.length
    : 0

  // monthly trend (across all years, per-month average of monthlyRevenue)
  // This gives 12 buckets representing seasonality across all years of data.
  const monthAgg: number[] = new Array(12).fill(0)
  const monthCount: number[] = new Array(12).fill(0)
  for (const r of annualData) {
    // we only have annual data; spread monthlyRevenue evenly across 12 months of that year
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
    byDegreeField,
    byYear,
    topCompaniesByRevenue,
    recentCompanies,
    monthlyTrend,
  }
}
