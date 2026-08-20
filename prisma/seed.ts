import { db } from '../src/lib/db'
import crypto from 'crypto'

// tiny hash helper (NOT for production secrets - just a dev bootstrap)
function hash(pw: string) {
  return crypto.createHash('sha256').update(pw).digest('hex')
}

async function main() {
  console.log('Seeding SEECS Database...')

  // ---- Admin user ----
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@seecs.nust.edu.pk'
  const adminPw = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'admin12345'
  const admin = await db.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'SEECS Database Manager',
      passwordHash: hash(adminPw),
      role: 'superadmin',
    },
  })
  console.log('  Admin user:', admin.email)

  // ---- Degrees ----
  const degrees = await Promise.all([
    db.degree.upsert({ where: { name: 'BS Computer Science' }, update: {}, create: { name: 'BS Computer Science', field: 'Software Engineering' } }),
    db.degree.upsert({ where: { name: 'BS Software Engineering' }, update: {}, create: { name: 'BS Software Engineering', field: 'Software Engineering' } }),
    db.degree.upsert({ where: { name: 'MS Data Science' }, update: {}, create: { name: 'MS Data Science', field: 'Data Science' } }),
    db.degree.upsert({ where: { name: 'BS Artificial Intelligence' }, update: {}, create: { name: 'BS Artificial Intelligence', field: 'Data Science' } }),
    db.degree.upsert({ where: { name: 'MS Cyber Security' }, update: {}, create: { name: 'MS Cyber Security', field: 'Cyber Security' } }),
    db.degree.upsert({ where: { name: 'BS Electrical Engineering' }, update: {}, create: { name: 'BS Electrical Engineering', field: 'Electrical Engineering' } }),
    db.degree.upsert({ where: { name: 'PhD Computer Science' }, update: {}, create: { name: 'PhD Computer Science', field: 'Software Engineering' } }),
  ])

  // ---- Sectors ----
  const sectors = await Promise.all([
    db.sector.upsert({ where: { name: 'Software Engineering' }, update: {}, create: { name: 'Software Engineering' } }),
    db.sector.upsert({ where: { name: 'Data Science' }, update: {}, create: { name: 'Data Science' } }),
    db.sector.upsert({ where: { name: 'Cyber Security' }, update: {}, create: { name: 'Cyber Security' } }),
    db.sector.upsert({ where: { name: 'Artificial Intelligence' }, update: {}, create: { name: 'Artificial Intelligence' } }),
    db.sector.upsert({ where: { name: 'IoT & Embedded Systems' }, update: {}, create: { name: 'IoT & Embedded Systems' } }),
    db.sector.upsert({ where: { name: 'Fintech' }, update: {}, create: { name: 'Fintech' } }),
    db.sector.upsert({ where: { name: 'Cloud & DevOps' }, update: {}, create: { name: 'Cloud & DevOps' } }),
  ])

  // ---- Cities ----
  const cities = await Promise.all([
    db.city.upsert({ where: { name: 'Islamabad' }, update: {}, create: { name: 'Islamabad' } }),
    db.city.upsert({ where: { name: 'Rawalpindi' }, update: {}, create: { name: 'Rawalpindi' } }),
    db.city.upsert({ where: { name: 'Lahore' }, update: {}, create: { name: 'Lahore' } }),
    db.city.upsert({ where: { name: 'Karachi' }, update: {}, create: { name: 'Karachi' } }),
    db.city.upsert({ where: { name: 'Peshawar' }, update: {}, create: { name: 'Peshawar' } }),
  ])

  // ---- Locations (with country from Java schema) ----
  const locations = await Promise.all([
    db.location.create({ data: { address: 'Sector H-12, NUST Campus', country: 'Pakistan', cityId: cities[0].id } }),
    db.location.create({ data: { address: 'Blue Area, Jinnah Avenue', country: 'Pakistan', cityId: cities[0].id } }),
    db.location.create({ data: { address: 'F-8 Markaz', country: 'Pakistan', cityId: cities[0].id } }),
    db.location.create({ data: { address: 'Saddar, Rawalpindi Cantt', country: 'Pakistan', cityId: cities[1].id } }),
    db.location.create({ data: { address: 'Gulberg III, Main Boulevard', country: 'Pakistan', cityId: cities[2].id } }),
    db.location.create({ data: { address: 'Shahrah-e-Faisal', country: 'Pakistan', cityId: cities[3].id } }),
  ])

  // ---- Founders (with department field from Java schema) ----
  const founders = await Promise.all([
    db.founder.create({ data: { firstName: 'Ahmad', lastName: 'Jamshid', gender: 'Male', email: 'ahmad@seecs.nust.edu.pk', phone: '+92-300-1234567', department: 'Computer Science', degreeId: degrees[0].id } }),
    db.founder.create({ data: { firstName: 'Ayesha', lastName: 'Khan', gender: 'Female', email: 'ayesha@dataforge.pk', phone: '+92-301-2345678', department: 'Data Science', degreeId: degrees[2].id } }),
    db.founder.create({ data: { firstName: 'Bilal', lastName: 'Raza', gender: 'Male', email: 'bilal@cyberops.pk', phone: '+92-302-3456789', department: 'Cyber Security', degreeId: degrees[4].id } }),
    db.founder.create({ data: { firstName: 'Fatima', lastName: 'Zahra', gender: 'Female', email: 'fatima@ailabs.pk', phone: '+92-303-4567890', department: 'Artificial Intelligence', degreeId: degrees[3].id } }),
    db.founder.create({ data: { firstName: 'Hassan', lastName: 'Ali', gender: 'Male', email: 'hassan@cloudpeak.pk', phone: '+92-304-5678901', department: 'Computer Science', degreeId: degrees[6].id } }),
    db.founder.create({ data: { firstName: 'Zainab', lastName: 'Hussain', gender: 'Female', email: 'zainab@fintrust.pk', phone: '+92-305-6789012', department: 'Computer Science', degreeId: degrees[0].id } }),
    db.founder.create({ data: { firstName: 'Usman', lastName: 'Tariq', gender: 'Male', email: 'usman@iotree.pk', phone: '+92-306-7890123', department: 'Electrical Engineering', degreeId: degrees[5].id } }),
    db.founder.create({ data: { firstName: 'Maryam', lastName: 'Siddiqui', gender: 'Female', email: 'maryam@softforge.pk', phone: '+92-307-8901234', department: 'Software Engineering', degreeId: degrees[1].id } }),
    db.founder.create({ data: { firstName: 'Ali', lastName: 'Hamza', gender: 'Male', email: 'ali@devstream.pk', phone: '+92-308-9012345', department: 'Computer Science', degreeId: degrees[0].id } }),
    db.founder.create({ data: { firstName: 'Sana', lastName: 'Malik', gender: 'Female', email: 'sana@dataviz.pk', phone: '+92-309-0123456', department: 'Data Science', degreeId: degrees[2].id } }),
    db.founder.create({ data: { firstName: 'Omar', lastName: 'Farooq', gender: 'Male', email: 'omar@securenet.pk', phone: '+92-310-1234567', department: 'Cyber Security', degreeId: degrees[4].id } }),
    db.founder.create({ data: { firstName: 'Hira', lastName: 'Aslam', gender: 'Female', email: 'hira@neuralworks.pk', phone: '+92-311-2345678', department: 'Artificial Intelligence', degreeId: degrees[3].id } }),
  ])

  // ---- Companies (with ALL Java fields: status, sinceDate, foundedYear, branchesCount, revenue) ----
  const sectorByName = (n: string) => sectors.find((s) => s.name === n)!
  const cityByName = (n: string) => cities.find((c) => c.name === n)!
  const locByIndex = (i: number) => locations[i]
  const founderByIndex = (i: number) => founders[i]

  const companiesData = [
    { name: 'DataForge Analytics', sector: 'Data Science', city: 'Islamabad', loc: 0, founder: 1, founderRole: 'CEO', desc: 'BI dashboards and predictive analytics for enterprises.', email: 'info@dataforge.pk', phone: '+92-51-111111', website: 'https://dataforge.pk', status: 'Active', sinceDate: '2020-03-15', foundedYear: 2020, branches: 3, revenue: 12000000 },
    { name: 'CyberOps Pakistan', sector: 'Cyber Security', city: 'Islamabad', loc: 1, founder: 2, founderRole: 'CEO', desc: 'SOC services, penetration testing and threat intel.', email: 'contact@cyberops.pk', phone: '+92-51-222222', website: 'https://cyberops.pk', status: 'Active', sinceDate: '2019-07-01', foundedYear: 2019, branches: 5, revenue: 18000000 },
    { name: 'AILabs Islamabad', sector: 'Artificial Intelligence', city: 'Islamabad', loc: 2, founder: 3, founderRole: 'CTO', desc: 'Computer vision and NLP platforms for South Asian languages.', email: 'hello@ailabs.pk', phone: '+92-51-333333', website: 'https://ailabs.pk', status: 'Active', sinceDate: '2021-01-10', foundedYear: 2021, branches: 2, revenue: 8500000 },
    { name: 'CloudPeak Systems', sector: 'Cloud & DevOps', city: 'Rawalpindi', loc: 3, founder: 4, founderRole: 'CEO', desc: 'Kubernetes consulting and managed cloud migrations.', email: 'sales@cloudpeak.pk', phone: '+92-51-444444', website: 'https://cloudpeak.pk', status: 'Active', sinceDate: '2018-09-20', foundedYear: 2018, branches: 4, revenue: 22000000 },
    { name: 'FinTrust Technologies', sector: 'Fintech', city: 'Lahore', loc: 4, founder: 5, founderRole: 'CEO', desc: 'Digital wallet and lending platform infrastructure.', email: 'info@fintrust.pk', phone: '+92-42-555555', website: 'https://fintrust.pk', status: 'Active', sinceDate: '2020-06-01', foundedYear: 2020, branches: 6, revenue: 35000000 },
    { name: 'IoTree Embedded', sector: 'IoT & Embedded Systems', city: 'Islamabad', loc: 0, founder: 6, founderRole: 'CEO', desc: 'Smart agriculture and industrial IoT sensor kits.', email: 'info@iotree.pk', phone: '+92-51-666666', website: 'https://iotree.pk', status: 'Active', sinceDate: '2021-11-15', foundedYear: 2021, branches: 1, revenue: 5000000 },
    { name: 'SoftForge Studios', sector: 'Software Engineering', city: 'Lahore', loc: 4, founder: 7, founderRole: 'CEO', desc: 'Custom enterprise web and mobile development.', email: 'info@softforge.pk', phone: '+92-42-777777', website: 'https://softforge.pk', status: 'Active', sinceDate: '2019-04-01', foundedYear: 2019, branches: 3, revenue: 15000000 },
    { name: 'DevStream Labs', sector: 'Software Engineering', city: 'Karachi', loc: 5, founder: 8, founderRole: 'CTO', desc: 'Developer tooling and CI/CD SaaS products.', email: 'info@devstream.pk', phone: '+92-21-888888', website: 'https://devstream.pk', status: 'Active', sinceDate: '2020-08-01', foundedYear: 2020, branches: 2, revenue: 9500000 },
    { name: 'DataViz Pro', sector: 'Data Science', city: 'Islamabad', loc: 1, founder: 9, founderRole: 'CEO', desc: 'Interactive geospatial and BI visualizations.', email: 'info@dataviz.pk', phone: '+92-51-999999', website: 'https://dataviz.pk', status: 'Active', sinceDate: '2022-01-15', foundedYear: 2022, branches: 1, revenue: 4000000 },
    { name: 'SecureNet Solutions', sector: 'Cyber Security', city: 'Peshawar', loc: 3, founder: 10, founderRole: 'CEO', desc: 'Network security appliances and managed firewall services.', email: 'info@securenet.pk', phone: '+92-91-101010', website: 'https://securenet.pk', status: 'Active', sinceDate: '2018-03-01', foundedYear: 2018, branches: 2, revenue: 11000000 },
    { name: 'NeuralWorks AI', sector: 'Artificial Intelligence', city: 'Karachi', loc: 5, founder: 11, founderRole: 'CEO', desc: 'Generative AI assistants for Urdu and Pashto markets.', email: 'info@neuralworks.pk', phone: '+92-21-121212', website: 'https://neuralworks.pk', status: 'Active', sinceDate: '2023-02-01', foundedYear: 2023, branches: 1, revenue: 3000000 },
  ]

  for (let i = 0; i < companiesData.length; i++) {
    const c = companiesData[i]
    const company = await db.company.create({
      data: {
        name: c.name,
        description: c.desc,
        email: c.email,
        phone: c.phone,
        website: c.website,
        status: c.status,
        sinceDate: c.sinceDate,
        foundedYear: c.foundedYear,
        branchesCount: c.branches,
        revenue: c.revenue,
        sectorId: sectorByName(c.sector).id,
        cityId: cityByName(c.city).id,
        locationId: locByIndex(c.loc).id,
        founders: {
          create: [
            { founderId: founderByIndex(c.founder).id, role: c.founderRole },
          ],
        },
      },
    })

    // annual data for the last 3 years
    const base = 50000 + i * 23000
    for (let y = 2022; y <= 2024; y++) {
      const growth = 1 + (y - 2022) * (0.18 + i * 0.015)
      const monthly = Math.round(base * growth)
      const total = monthly * 12
      await db.companyAnnualData.create({
        data: {
          companyId: company.id,
          year: y,
          monthlyRevenue: monthly,
          totalRevenue: total,
          employeeCount: Math.round(8 + i * 2 + (y - 2022) * 3),
          projectCount: Math.round(3 + i + (y - 2022) * 2),
          notes: y === 2024 ? 'On-track to exceed annual target.' : null,
        },
      })
    }
  }

  // ---- LLM Settings (default) ----
  await db.llmSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      provider: 'zai',
      apiKey: process.env.ZAI_API_KEY || null,
      baseUrl: null,
      model: 'glm-4.6',
      systemPrompt: null,
      temperature: 0.3,
      enabled: true,
    },
  })

  console.log('Seed complete.')
  console.log('   Admin login:', adminEmail, '/', adminPw)
  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  db.$disconnect()
  process.exit(1)
})
