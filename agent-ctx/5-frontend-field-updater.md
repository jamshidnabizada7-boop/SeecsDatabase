---
Task ID: 5
Agent: frontend-field-updater
Task: Update all frontend pages for new Java fields + custom columns support

Work Log:
- Read all existing admin pages, company portal, API routes, and prisma schema to understand current state
- Updated `CompaniesPage.tsx`: added 9 new fields (status, statusReason, sinceDate, foundedYear, discontinuedDate, branchesCount, revenue, revenueMin, revenueMax) to the Company interface, company card display (status badge, founded year, since date, branches count, revenue display), and the create/edit form dialog (organized into Status & Lifecycle, Revenue, Classification sections)
- Updated `CompaniesPage.tsx`: added custom columns support — fetches `customColumns` from the companies API response, displays custom values inline in each company card with expand/collapse toggle, and adds custom column inputs to the create/edit form with proper type handling (text, number, date, boolean, url)
- Updated `FoundersPage.tsx`: added `department` field to the Founder interface, card display (shows department with Building icon), and create/edit form (new department input field)
- Updated `LocationsPage.tsx`: added `country` field to the Location interface, card display (shows country badge when not Pakistan with Globe icon), and create/edit form (new country input field, defaults to Pakistan)
- Created `CustomColumnsPage.tsx`: full admin page for managing dynamic custom columns with create/edit/delete operations, supports columnType (text/number/date/boolean/url), targetTable (company/founder), description, required flag, sort order. Shows usage count per column and slug.
- Updated `AdminShell.tsx`: added `custom-columns` tab to the Tab type union, added Columns3 icon import, added Custom Columns nav item under Master Data group, added route rendering for the new page
- Updated `CompanyPortal.tsx`: added all 9 new Company fields to CompanyFull interface, added read-only display of status, foundedYear, sinceDate, branchesCount, revenue/revenueRange in profile tab, added Custom Fields card section where companies can fill in their custom column values with type-appropriate inputs, handles custom values save via PUT to /api/company/self
- Ran `bun run lint` — passed with zero errors

Stage Summary:
- 4 existing files updated (CompaniesPage, FoundersPage, LocationsPage, CompanyPortal)
- 1 new file created (CustomColumnsPage)
- 1 file updated for routing (AdminShell)
- All frontend pages now reflect the backend schema changes from Task 4
- Custom columns are fully integrated into both admin and company portal workflows
