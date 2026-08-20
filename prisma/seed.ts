import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ── MySQL data from the uploaded MySql.zip ──

const SECTORS = [
  'Fintech / Software / SaaS',
  'Software Development / IT Services',
  'Marketing / Advertising / Software',
  'Social Networking / Online Platform',
  'Renewable Energy / Energy Solutions',
  'AI / Software / Fashion Tech',
  'Digital Product Design / Development',
  'Remote Hiring / Software Services',
  'AI Recruitment / Enterprise IT / Cybersecurity',
  'Film / Photography / Media',
  'Web / Mobile / Digital Marketing',
  'Web / Mobile / AI / Computer Vision',
  'Engineering / Manufacturing / R&D',
  'Multiple Industries',
  'Marketing / E-commerce',
  'AI / Automation / Mobility / Embedded Systems',
  'Software / Design / AI / Digital Agency',
  'Digital Products / Software / Consulting',
  'Event Planning / Services Marketplace',
  'Web / App Development / Digital Solutions',
  'AI / Business Analytics / Chatbots',
  'Web Development / Digital Marketing / Software Solutions',
  'STEAM Education / EdTech',
  'AI / Content Creation / Mobile Apps',
  'Image Processing / Machine Learning / Embedded Systems',
  'Software House / Web & App Development / E-Commerce',
  'Co-working Spaces / Business Services',
  'AI / Machine Learning / Automation',
  'AI / Product Development / Strategy',
  'Music / Media / Production',
  'Generative AI / Web & Mobile Development',
  'Tourism / Travel / Content Creation',
]

const CITIES = [
  'Islamabad',
  'Rawalpindi',
  'Lahore',
  'Karachi',
  'Multan',
  'Peshawar',
]

// company_name → city index (into CITIES array)
const COMPANY_CITY: Record<string, number> = {
  'HYPOTERS': 0,            // Islamabad
  'Hashlogics': 0,           // Islamabad
  'Aclan': 0,                // Islamabad
  'TalkwithStranger!': 0,    // Islamabad
  'Pantera Energy': 0,       // Islamabad
  'Presize.ai': 0,           // Islamabad (acquired by Meta, was based in EU)
  'Chakor': 2,               // Lahore
  'Teamo': 0,                // Islamabad
  'Search O Pal & Simcoe IT': 0, // Islamabad
  'Ali Chaudhry Films': 2,   // Lahore
  'Mexil Software Solutions': 0, // Islamabad (offices in Italy and Pakistan)
  'Alfabolt': 0,             // Islamabad
  'Zambeels': 0,             // Islamabad
  'codistan': 0,             // Islamabad
  'walee': 3,                // Karachi
  'VRESOLVIO': 0,            // Islamabad
  'DOERZ': 0,                // Islamabad
  'CODE JUNKIE': 2,          // Lahore
  'Shadiyana': 2,            // Lahore
  'hactric': 0,              // Islamabad
  'Botnostic Solutions': 0,  // Islamabad
  'Crafty Pixels': 0,        // Islamabad (now NZ, originally Pakistan)
  'LearnOBots': 0,           // Islamabad
  'Vyro': 0,                 // Islamabad
  'Esper Solutions': 0,      // Islamabad
  'Creatrixe': 0,            // Islamabad
  'WORKZONE': 0,             // Islamabad
  'neurallines': 0,          // Islamabad
  'thinksoft.': 0,           // Islamabad
  'WE RCORDS': 2,            // Lahore
  'Cogentlabs': 0,           // Islamabad
  'Traverse Pakistan': 0,    // Islamabad
}

const COMPANIES = [
  { name: 'HYPOTERS', status: 'Operational', sectorIdx: 0, website: 'https://www.hypoters.com/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Specialized in developing fault-tolerant mission-critical systems for small to medium fintech startups. Clients include cryptocurrency exchanges, banking/payment apps, and fintech SaaS startups. Expertise in crypto trading integration, charting platforms, and SaaS development.' },
  { name: 'Hashlogics', status: 'Operational', sectorIdx: 1, website: 'http://www.hashlogics.com', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Global software development firm for Silicon Valley startups. Works on startups by employees of Fortune 500 firms like Apple, Netflix, and Coinbase. Registered in Pakistan and Australia.' },
  { name: 'Aclan', status: 'Operational', sectorIdx: 2, website: 'https://aclan.co/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Multi-dimensional youth organization offering marketing, advertising, and software services. 350+ clients in a decade with international exposure.' },
  { name: 'TalkwithStranger!', status: 'Operational', sectorIdx: 3, website: 'https://talkwithstranger.com/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: '2016-02-01', discontinuedDate: null, description: 'Irish-based online social networking platform founded in 2016. Over 3 million daily visitors. Started as a Master\'s Thesis project.' },
  { name: 'Pantera Energy', status: 'Operational', sectorIdx: 4, website: 'https://panteraenergy.pk/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Leading renewable energy provider in Pakistan with offices in major cities and installer base across all provinces.' },
  { name: 'Presize.ai', status: 'Acquired', sectorIdx: 5, website: 'http://www.presize.ai', branchesCount: null, statusReason: 'Acquired by META (Facebook)', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Award-winning startup acquired by Meta. 100M+ recommendations. European market leader. Forbes 30 under 30 Europe, Rector\'s Gold Medal.' },
  { name: 'Chakor', status: 'Operational', sectorIdx: 6, website: 'https://thechakor.com/', branchesCount: 2, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Lahore-based company focused on MVPs, management systems, and business automation tools for startups.' },
  { name: 'Teamo', status: 'Operational', sectorIdx: 7, website: 'https://teamo.io/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Platform for hiring vetted remote developers from emerging countries. Recognized by Draper University, Startup Istanbul, and NYU Edtech Incubator.' },
  { name: 'Search O Pal & Simcoe IT', status: 'Operational', sectorIdx: 8, website: 'http://www.SearchOPal.com, http://www.SimcoeIT.com', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Search O Pal: AI-based recruitment & training. Simcoe IT: intelligent systems, enterprise software, cybersecurity. 30+ years combined experience.' },
  { name: 'Ali Chaudhry Films', status: 'Operational', sectorIdx: 9, website: 'http://alichaudhryfilms.com/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Photography and filmmaking studio with 10+ years of experience. Clients include Uber, The World Bank, Pepsi, Cadbury, Spotify.' },
  { name: 'Mexil Software Solutions', status: 'Operational', sectorIdx: 10, website: 'https://mexil.it/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Expert in website design, web development, mobile apps, and digital marketing. Uses technology to boost client efficiency and growth, serving startups to SMBs. Offices in Italy and Pakistan, fostering a global work culture.' },
  { name: 'Alfabolt', status: 'Operational', sectorIdx: 11, website: 'https://www.alfabolt.com/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'A digital products development studio specializing in web apps, mobile apps, computer vision, and AI. Develops custom solutions globally with a collaborative approach. Parent company of "Trumroll", an AI-based HR-tech solution.' },
  { name: 'Zambeels', status: 'Operational', sectorIdx: 12, website: 'https://www.zambeel.ltd/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Indigenous Engineering Manufacturer rebuilding Pakistan\'s manufacturing. Collaborates with Defense and Private sectors. Partners with NUST for R&D. Offers rapid prototyping services.' },
  { name: 'codistan', status: 'Operational', sectorIdx: 13, website: null, branchesCount: null, statusReason: null, foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Serves clients and partners such as c-distan, Renome, Ranchers, Robert\'s Coffee, BIZ, MOVINGSTONE, Piyall, and Paklogics.' },
  { name: 'walee', status: 'Operational', sectorIdx: 14, website: 'https://www.walee.pk/', branchesCount: 5, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Region\'s largest influencer marketing and social commerce platform. Provides services to top global advertisers. Operating in Pakistan and expanding in MENA.' },
  { name: 'VRESOLVIO', status: 'Operational', sectorIdx: 15, website: 'https://vresolv.io', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Innovative AI, automation, and mobility solutions. Expertise in embedded engineering and ADAS. Offers end-to-end system design, software, schematics, and PCB design. Collaborations with Senis, Cariad, Magna, and Volkswagen.' },
  { name: 'DOERZ', status: 'Operational', sectorIdx: 16, website: 'http://doerz.tech/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Full-stack services agency specializing in Web & App Design/Development, Digital Marketing, Graphic & Motion Design. Builds AI, Computer Vision, and ML-powered solutions for startups and small businesses globally.' },
  { name: 'CODE JUNKIE', status: 'Operational', sectorIdx: 17, website: 'https://codejunkie.co/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Award-winning digital product development firm. Worked with Unicorns and Fortune 500s like Porsche, Kuwait Finance House, Philip Morris, British Council, Keyhole Analytics, and SadaPay.' },
  { name: 'Shadiyana', status: 'Operational', sectorIdx: 18, website: 'https://www.shadiyana.pk/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Pakistan\'s largest wedding resource hub. Find and compare photographers, makeup artists, venues, and more. Simplifies shaadi planning through technology.' },
  { name: 'hactric', status: 'Operational', sectorIdx: 19, website: 'https://hactric.com/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Provides digital solutions including Web and Mobile App Development and Digital Marketing. Focused on solving daily life problems through innovative tech. Known for quality service and global recognition.' },
  { name: 'Botnostic Solutions', status: 'Operational', sectorIdx: 20, website: 'https://www.botnosticsolutions.ai/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Specializing in AI, Business Analytics, and Chatbot solutions for business growth. Offers AI-driven Recruitment, Career Advisory, and Talent Management services. Serving over 0.5 million users in 100+ countries globally.' },
  { name: 'Crafty Pixels', status: 'Operational', sectorIdx: 21, website: 'https://craftypixels.com/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'A modern software tech firm, originally from Pakistan, now headquartered in Auckland, New Zealand. Includes Crafty Ventures (B2C) and Crafty Digital (B2B). Focused on design, UX, and engineering excellence with creative, high-quality services.' },
  { name: 'LearnOBots', status: 'Operational', sectorIdx: 22, website: 'https://learnobots.com/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Operating since 2014, LearnOBots promotes STEAM learning for primary and secondary students in Pakistan. Offers playful, experiential education to develop 21st-century skills through an outcome-based curriculum.' },
  { name: 'Vyro', status: 'Operational', sectorIdx: 23, website: 'https://www.vyro.ai/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Vyro creates AI-powered content creation tools with a global reach. Operates 20 apps serving 5 million monthly users. Their team, "Vyronauts", is driven by creativity and purpose. Explore the AI Art Generator at https://www.imagine.art/.' },
  { name: 'Esper Solutions', status: 'Operational', sectorIdx: 24, website: 'https://www.esper.solutions/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Global software company offering custom solutions in Image Processing, Machine Learning, Business Intelligence, Computer Vision, Embedded Systems, and Marketing.' },
  { name: 'Creatrixe', status: 'Operational', sectorIdx: 25, website: 'https://www.creatrixe.com/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'An international full-cycle software house with 100+ completed projects. Provides software development for businesses of all sizes. Services include mobile and web development, e-commerce, and custom business solutions.' },
  { name: 'WORKZONE', status: 'Operational', sectorIdx: 26, website: 'https://workzonespaces.com/', branchesCount: 2, statusReason: 'Company is actively running', foundedYear: null, sinceDate: '2020-01-01', discontinuedDate: null, description: 'WorkZone has been offering cost-effective workspaces since 2020. Serves 56 companies and 220+ individuals across 2 branches in Islamabad. Grew MRR from 0.4M to 2.7M in a year. Mission: Foster innovation and collaboration in an inclusive work environment.' },
  { name: 'neurallines', status: 'Operational', sectorIdx: 27, website: 'https://neurallines.com/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Provides AI/ML solutions in NLP, Image & Video Processing, Predictive Analytics, RPA. Specializes in information extraction and workflow automation for optimized business operations.' },
  { name: 'thinksoft.', status: 'Operational', sectorIdx: 28, website: 'https://www.thinksoft.io/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Bootstrap product development company offering AI-based custom solutions that outperform big vendors. Expertise in Education, Agri Tech, Online Marketing, Sports & Entertainment, Business Strategy, and Content Design.' },
  { name: 'WE RCORDS', status: 'Operational', sectorIdx: 29, website: 'https://werecords.org/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Music content aggregator from Pakistan. Partners with 40+ music labels and licenses 5000+ original tracks in various regional languages. Owns a music production house supporting artists, with a focus on creativity, sound, global reach, and branding.' },
  { name: 'Cogentlabs', status: 'Operational', sectorIdx: 30, website: 'https://www.cogentlabs.co/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Provides Generative AI and full-stack solutions using LangChain, Django, React, and React Native. Served clients like UNICEF, University of Oxford, Chughtai Lab, and Maxab.' },
  { name: 'Traverse Pakistan', status: 'Operational', sectorIdx: 31, website: 'https://www.traversepakistan.com/', branchesCount: null, statusReason: 'Company is actively running', foundedYear: null, sinceDate: null, discontinuedDate: null, description: 'Top-rated tourism company in Pakistan. Produces content to promote tourism globally. Offers tailored trips from adventure to luxury. Broad geographic coverage with a revenue exceeding 130 million. Driven by the belief in Pakistan\'s potential.' },
]

// Degrees from MySQL (deduplicated by name+department)
const DEGREES_RAW = [
  { name: 'BSCS', department: 'Computer Science' },
  { name: 'BESE', department: 'Software Engineering' },
  { name: 'BEE', department: 'Electrical Engineering' },
  { name: 'BIT', department: 'Information Technology' },
  { name: 'BICSE', department: 'Information & Communication Systems Engineering' },
]

// Founders: [firstName, lastName, gender, degreeIndex (into DEGREES_RAW, 1-based, 0=none)]
const FOUNDERS_RAW: [string, string, string, number][] = [
  ['Jawad', 'Haider', 'Male', 0],           // 1 - BSCS CS
  ['Usman', 'Ishaq', 'Male', 0],             // 2 - BSCS CS
  ['Abdul', 'Basit', 'Male', 1],              // 3 - BESE SE
  ['Usama', 'Tauqeer', 'Male', 1],            // 4 - BESE SE
  ['Umair', 'Javaid', 'Male', 1],             // 5 - BESE SE
  ['Faizan', 'Zahid', 'Male', 0],             // 6 - BSCS CS
  ['Farooq', 'Saeed', 'Male', 2],             // 7 - BEE EE
  ['Awais', 'Shafique', 'Male', 2],           // 8 - BEE EE
  ['Hamza', 'Shahid', 'Male', 1],             // 9 - BESE SE
  ['Annus', 'Shahid', 'Male', 2],             // 10 - BEE EE
  ['Sohaib', 'Ishtiaq', 'Male', 2],           // 11 - BEE EE
  ['Ameer Hamza', 'Baig', 'Male', 1],         // 12 - BESE SE
  ['Faraz', 'Mirza', 'Male', 3],              // 13 - BIT IT
  ['Muhammad', 'Ali', 'Male', 0],             // 14 - BSCS CS
  ['Asif', 'Ahmed Ali', 'Male', 0],           // 15 - BSCS CS
  ['Ali', 'Farooq', 'Male', 0],               // 16 - BSCS CS
  ['Momin', 'Munir', 'Male', 2],              // 17 - BEE EE
  ['Afnan', 'Sharief', 'Male', 1],            // 18 - BESE SE
  ['Waseem', 'Khan', 'Male', 1],              // 19 - BESE SE
  ['Ahsan', 'Tahir', 'Male', 1],              // 20 - BESE SE
  ['Daniyal', 'Yasin', 'Male', 2],            // 21 - BEE EE
  ['Aadil Jaleel', 'Choudhry', 'Male', 2],    // 22 - BEE EE
  ['Yousaf', 'Iqbal', 'Male', 1],             // 23 - BESE SE
  ['Junaid', 'Khattak', 'Male', 2],           // 24 - BEE EE
  ['Muhammad Shehroz', 'Sajjad', 'Male', 0],  // 25 - BSCS CS
  ['Syed Muhammad', 'Tayyab', 'Male', 0],     // 26 - BSCS CS
  ['Izzah', 'Zaman', 'Female', 0],            // 27 - BSCS CS
  ['Neelam', 'Shoaib', 'Female', 1],          // 28 - BESE SE
  ['Muhammad Kamran', 'Akbar', 'Male', 0],    // 29 - BSCS CS
  ['Farah', 'Tahir', 'Female', 2],            // 30 - BEE EE
  ['Ramsha', 'Khuram', 'Female', 1],          // 31 - BESE SE
  ['Faisal', 'Zahid', 'Male', 0],             // 32 - BSCS CS
  ['Faisal', 'Laghari', 'Male', 3],           // 33 - BIT IT
  ['Muhammad Abdullah', 'Rafique', 'Male', 0], // 34 - BSCS CS
  ['Zain ul', 'Abedien', 'Male', 0],          // 35 - BSCS CS
  ['Abuzar', 'Faris', 'Male', 2],             // 36 - BEE EE
  ['Abdul Moeed', 'Khalid', 'Male', 2],       // 37 - BEE EE
  ['Junaid', 'Naeem', 'Male', 2],             // 38 - BEE EE
  ['Muhammad', 'Mohsin', 'Male', 2],          // 39 - BEE EE
  ['Ameed', 'Khalid', 'Male', 3],             // 40 - BIT IT
  ['Syed Muneeb', 'Ali', 'Male', 3],          // 41 - BIT IT
  ['Talha', 'Irfan', 'Male', 1],              // 42 - BESE SE
  ['Uridah Sami', 'Ahmed', 'Female', 0],      // 43 - BSCS CS
  ['Hassan', 'Jalil', 'Male', 1],             // 44 - BESE SE
  ['Iqra', 'Irfan', 'Female', 1],             // 45 - BESE SE
  ['Waqas', 'Ahmed', 'Male', 0],              // 46 - BSCS CS
  ['Ehmad', 'Zubair', 'Male', 4],             // 47 - BICSE ICSE
  ['Abdul', 'Hanan', 'Male', 1],              // 48 - BESE SE
  ['Kashif', 'Manzoor', 'Male', 1],           // 49 - BESE SE
]

// company_founder: [companyIndex (0-based), founderIndex (0-based), role]
const COMPANY_FOUNDERS: [number, number, string][] = [
  [0, 0, 'CEO'],          // HYPOTERS - Jawad Haider
  [0, 1, 'CEO'],          // HYPOTERS - Usman Ishaq
  [1, 2, 'CEO'],          // Hashlogics - Abdul Basit
  [2, 3, 'Managing Partner'],   // Aclan - Usama Tauqeer
  [2, 4, 'Partner & COO'],      // Aclan - Umair Javaid
  [3, 5, 'CEO'],          // TalkwithStranger! - Faizan Zahid
  [4, 6, 'Director Operations'], // Pantera Energy - Farooq Saeed
  [5, 7, 'Co-Founder, CPO'],  // Presize.ai - Awais Shafique
  [6, 8, 'Co-Founder'],   // Chakor - Hamza Shahid
  [6, 9, 'Co-Founder'],   // Chakor - Annus Shahid
  [7, 10, 'Founder & CEO'], // Teamo - Sohaib Ishtiaq
  [8, 11, 'CTO'],         // Search O Pal - Ameer Hamza Baig
  [8, 12, 'CEO'],         // Search O Pal - Faraz Mirza
  [9, 13, 'CEO'],         // Ali Chaudhry Films - Muhammad Ali
  [10, 14, 'CEO'],        // Mexil - Asif Ahmed Ali
  [11, 15, 'CEO'],        // Alfabolt - Ali Farooq
  [12, 16, 'COO'],        // Zambeels - Momin Munir
  [13, 17, 'CEO'],        // codistan - Afnan Sharief
  [13, 18, 'CTO'],        // codistan - Waseem Khan
  [14, 19, 'CEO'],        // walee - Ahsan Tahir
  [15, 20, 'CTO'],        // VRESOLVIO - Daniyal Yasin
  [15, 21, 'CEO'],        // VRESOLVIO - Aadil Jaleel Choudhry
  [16, 22, 'CEO'],        // DOERZ - Yousaf Iqbal
  [16, 23, 'CTO'],        // DOERZ - Junaid Khattak
  [17, 24, 'CEO'],        // CODE JUNKIE - Muhammad Shehroz Sajjad
  [17, 25, 'CTO'],        // CODE JUNKIE - Syed Muhammad Tayyab
  [18, 26, 'CEO'],        // Shadiyana - Izzah Zaman
  [18, 27, 'COO'],        // Shadiyana - Neelam Shoaib
  [19, 28, 'CEO'],        // hactric - Muhammad Kamran Akbar
  [19, 29, 'CTO'],        // hactric - Farah Tahir
  [20, 30, 'CEO'],        // Botnostic Solutions - Ramsha Khuram
  [21, 31, 'COO'],        // Crafty Pixels - Faisal Zahid
  [22, 32, 'CEO'],        // LearnOBots - Faisal Laghari
  [23, 33, 'CTO'],        // Vyro - Muhammad Abdullah Rafique
  [23, 34, 'CPO'],        // Vyro - Zain ul Abedien
  [24, 35, 'Partner'],    // Esper Solutions - Abuzar Faris
  [24, 36, 'Partner'],    // Esper Solutions - Abdul Moeed Khalid
  [24, 37, 'Partner'],    // Esper Solutions - Junaid Naeem
  [24, 38, 'Partner'],    // Esper Solutions - Muhammad Mohsin
  [25, 39, 'Co-Founder'], // Creatrixe - Ameed Khalid
  [25, 40, 'Co-Founder'], // Creatrixe - Syed Muneeb Ali
  [26, 41, 'CEO'],        // WORKZONE - Talha Irfan
  [27, 42, 'Co-Founder & CEO'], // neurallines - Uridah Sami Ahmed
  [27, 43, 'Co-Founder'], // neurallines - Hassan Jalil
  [28, 44, 'CEO'],        // thinksoft. - Iqra Irfan
  [29, 45, 'CEO'],        // WE RCORDS - Waqas Ahmed
  [30, 46, 'Founder & CEO'], // Cogentlabs - Ehmad Zubair
  [31, 47, 'Partner'],    // Traverse Pakistan - Abdul Hanan
  [31, 48, 'Partner'],    // Traverse Pakistan - Kashif Manzoor
]

function genApiKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'sk_seecs_'
  for (let i = 0; i < 24; i++) key += chars[Math.floor(Math.random() * chars.length)]
  return key
}

async function main() {
  console.log('🧹 Clearing existing data...')
  await db.companyCustomValue.deleteMany()
  await db.companyFounder.deleteMany()
  await db.companyAnnualData.deleteMany()
  await db.company.deleteMany()
  await db.customColumn.deleteMany()
  await db.founder.deleteMany()
  await db.degree.deleteMany()
  await db.location.deleteMany()
  await db.city.deleteMany()
  await db.sector.deleteMany()
  await db.chatLog.deleteMany()
  await db.llmSettings.deleteMany()
  // Keep AdminUser - don't delete

  console.log('📊 Creating sectors...')
  const sectorIds: string[] = []
  for (const name of SECTORS) {
    const s = await db.sector.create({ data: { name } })
    sectorIds.push(s.id)
  }

  console.log('🏙️ Creating cities...')
  const cityIds: string[] = []
  for (const name of CITIES) {
    const c = await db.city.create({ data: { name } })
    cityIds.push(c.id)
  }

  console.log('📍 Creating locations...')
  const locationIds: string[] = []
  for (let i = 0; i < COMPANIES.length; i++) {
    const comp = COMPANIES[i]
    const cityIdx = COMPANY_CITY[comp.name] ?? 0
    const loc = await db.location.create({
      data: { address: comp.name + ' HQ', country: 'Pakistan', cityId: cityIds[cityIdx] },
    })
    locationIds.push(loc.id)
  }

  console.log('🎓 Creating degrees...')
  const degreeIds: string[] = []
  for (const d of DEGREES_RAW) {
    const deg = await db.degree.create({ data: { name: d.name, field: d.department } })
    degreeIds.push(deg.id)
  }

  console.log('👤 Creating founders...')
  const founderIds: string[] = []
  for (const [firstName, lastName, gender, degIdx] of FOUNDERS_RAW) {
    const f = await db.founder.create({
      data: { firstName, lastName, gender, degreeId: degIdx > 0 ? degreeIds[degIdx - 1] : null, department: degIdx > 0 ? DEGREES_RAW[degIdx - 1].department : undefined },
    })
    founderIds.push(f.id)
  }

  console.log('🏢 Creating companies...')
  const companyIds: string[] = []
  for (let i = 0; i < COMPANIES.length; i++) {
    const comp = COMPANIES[i]
    const cityIdx = COMPANY_CITY[comp.name] ?? 0
    const c = await db.company.create({
      data: {
        name: comp.name,
        description: comp.description,
        website: comp.website,
        status: comp.status,
        statusReason: comp.statusReason,
        sinceDate: comp.sinceDate,
        foundedYear: comp.foundedYear,
        discontinuedDate: comp.discontinuedDate,
        branchesCount: comp.branchesCount,
        apiKey: genApiKey(),
        sectorId: sectorIds[comp.sectorIdx],
        cityId: cityIds[cityIdx],
        locationId: locationIds[i],
      },
    })
    companyIds.push(c.id)
  }

  console.log('🔗 Creating company-founder links...')
  for (const [compIdx, founderIdx, role] of COMPANY_FOUNDERS) {
    await db.companyFounder.create({
      data: { companyId: companyIds[compIdx], founderId: founderIds[founderIdx], role },
    })
  }

  console.log('🤖 Creating default LLM settings...')
  await db.llmSettings.create({ data: {} })

  console.log('👤 Checking admin user...')
  const adminEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@seecs.nust.edu.pk').toLowerCase()
  const existingAdmin = await db.adminUser.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    const rawPw = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'admin12345'
    const crypto = await import('crypto')
    const passwordHash = crypto.createHash('sha256').update(rawPw).digest('hex')
    await db.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'SEECS Database Manager',
        role: 'superadmin',
      },
    })
    console.log('👤 Created default admin user:', adminEmail)
  }

  const counts = await Promise.all([
    db.company.count(),
    db.founder.count(),
    db.sector.count(),
    db.city.count(),
    db.degree.count(),
    db.companyFounder.count(),
  ])
  console.log(`\n✅ Seed complete! Companies: ${counts[0]}, Founders: ${counts[1]}, Sectors: ${counts[2]}, Cities: ${counts[3]}, Degrees: ${counts[4]}, Links: ${counts[5]}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
