# SEECS Database Management System

A centralized registry and management system for SEECS-affiliated companies, founders, and annual financial/operational records at NUST Islamabad.

## Features

- **Admin Dashboard**: Comprehensive KPI tracking, Recharts data visualizations (geographic distribution, gender distribution, degree fields, sector analysis, financial trends), and quick actions.
- **Companies Management**: Server-side pagination, instant debounced search, status filters, table/card toggle views, and full CSV exports.
- **Company Self-Service Portal**: Secure per-company authentication with API keys, profile management, founder records, YoY growth tracking, and dynamic custom field values.
- **Dynamic Custom Fields**: Admin-configurable custom columns (text, number, date, boolean, url) attached to companies or founders.
- **AI Chatbot & Analytics**: Embedded AI-powered query assistant for dataset insights.
- **Dark Mode Support**: Seamless Light / Dark / System themes powered by `next-themes` and Tailwind CSS.
- **Database Flexibility**: Runs out-of-the-box on SQLite in development, and is fully compatible with PostgreSQL (e.g. Neon) for production.

---

## Tech Stack

- **Framework**: Next.js (App Router, Turbopack, Standalone output)
- **UI & Styling**: React 19, Tailwind CSS 4, Radix UI / Shadcn UI components, Lucide Icons, Framer Motion
- **Data & ORM**: Prisma ORM with SQLite / PostgreSQL
- **Charts**: Recharts
- **Forms & Validation**: React Hook Form, Zod

---

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm or bun

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create or check your `.env` file:

```env
# Development (SQLite)
DATABASE_URL="file:../db/custom.db"

# Production (PostgreSQL / Neon)
# DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.us-east-2.aws.neon.tech/seecs?sslmode=require"

ADMIN_BOOTSTRAP_EMAIL=admin@seecs.nust.edu.pk
ADMIN_BOOTSTRAP_PASSWORD=admin12345
```

### 3. Initialize Database

Generate the Prisma Client:

```bash
npx prisma generate
```

*(Optional) Push schema changes:*
```bash
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Admin Credentials

- **Email**: `admin@seecs.nust.edu.pk`
- **Password**: `admin12345`

---

## Deployment on Neon (PostgreSQL)

1. In `prisma/schema.prisma`, update the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in `.env` with your Neon PostgreSQL connection string.
3. Run `npm run db:push`.

---

## License

Private repository for SEECS - NUST University Islamabad.
