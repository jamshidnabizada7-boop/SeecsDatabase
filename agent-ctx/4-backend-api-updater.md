---
Task ID: 4
Agent: backend-api-updater
Task: Update all API routes for new Java fields + custom columns

Work Log:
- Read all existing API route files to understand current structure
- Updated `/api/admin/companies/route.ts` GET to include `customValues` with `customColumn` relation, return `customColumns` alongside `items`, and include new fields (status, statusReason, sinceDate, foundedYear, discontinuedDate, branchesCount, revenue, revenueMin, revenueMax) in the response
- Updated `/api/admin/companies/route.ts` POST to accept all new Company fields
- Updated `/api/admin/companies/[id]/route.ts` with new GET handler (includes customValues + customColumns), updated PUT to handle all new fields plus `apiKey` direct set and `regenerateKey` boolean, includes customValues in response
- Updated `/api/admin/founders/route.ts` POST to accept `department` field
- Updated `/api/admin/founders/[id]/route.ts` PUT to accept `department` field
- Updated `/api/admin/locations/route.ts` POST to accept `country` field (defaults to 'Pakistan')
- Updated `/api/admin/locations/[id]/route.ts` PUT to accept `country` field
- Verified `/api/lookup/route.ts` already returns `country` (Prisma returns all scalar fields by default)
- Created `/api/admin/custom-columns/route.ts` (GET: list all columns ordered by sortOrder, POST: create with auto-generated slug and uniqueness enforcement)
- Created `/api/admin/custom-columns/[id]/route.ts` (GET, PUT, DELETE for single custom column)
- Created `/api/admin/custom-columns/bulk-values/route.ts` (PUT: upsert CompanyCustomValue records for a given company)
- Updated `/api/company/self/route.ts` GET to include `customColumns` and `customValues` in response
- Updated `/api/company/self/route.ts` PUT to allow companies to update their own custom column values (with validation)
- Verified `/api/company/auth/me/route.ts` still works (no changes needed)
- Ran `bun run lint` — passed with zero errors

Stage Summary:
- All 10 API route tasks completed successfully
- 3 new route files created (custom-columns list, [id], bulk-values)
- 7 existing route files updated with new schema fields
- All routes use `export const runtime = 'nodejs'` and `getAdminFromRequest()` from `@/lib/auth`
- API key is returned in full (no masking) on admin routes
- Custom column slug auto-generated from name with uniqueness enforcement
- Company self-service can update custom values but not sector/city/apiKey
