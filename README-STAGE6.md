# مدرسة شمس الخير — المرحلة السادسة (الإضافات الأساسية)

This directory contains the stage 1–5 **source** plus new stage 6 functions. It is **not a live school production deployment**, and should be tested only with synthetic data until integration, consent, backups, and account provisioning are verified.

## Newly coded

1. **Manual invoices/receipts** per section, with piaster-accurate amounts, sibling-discount *manual field*, serializable overpayment protection, CSV for Excel. **No Fawry/Vodafone Card autocharging.**
2. **Certificates and ijazat** with ordered sanad entries, private printable Arabic certificate and verification QR. Public verifier reveals **validity, kind, random certificate serial only** after student/guardian consent and **separate supervisor** approval. Initial code is private by default. The QR can be printed even before public activation; it will read invalid publicly until activated.
3. **Exams:** manual oral/written assessment and grades by assigned teacher. No question bank / automated marking yet.
4. **Weekly schedules:** section-only teacher/room/group collision exclusion constraints in PostgreSQL. Teacher must be assigned to group; recurring weekly schedule cancellation with audit. **Cross-section shared-room checks not implemented**; use reserved rooms per section until centralized scheduling.
5. **Spaced repetition:** teacher-triggered next review date based on mastery, section-isolated. Surah-level color-friendly history from real teacher records; **precise 30-juz map not built** pending authoritative verse/juz lookup.
6. **Motivation:** points per student, no public cross-gender or minor leaderboard.
7. **Admin analytics:** section-scoped counts, manual receipts, test and review counts (invoice/receipt totals currently first 5000 records, not accounting-grade aggregates).
8. **Export and backup utilities:** CSV, `pg_dump`/`pg_restore` shell templates; these are **NOT** automatic scheduled backup jobs.

## Important files

- `prisma/schema.prisma`: 24 stage-six models (8 per scope; all three schemas physically separated)
- `lib/stage6-calculations.mjs` and `lib/stage6.ts`: financial/review logic and data policy
- `app/api/stage6`, `app/api/verify-certificate`: private and public API
- `app/dashboard/advanced`, `app/family/achievements`, `app/certificate/print`, `app/verify`: pages
- `db/constraints-stage6.sql` and `db/roles-stage6.sql`: PostgreSQL constraints/permissions
- `tests/phase6.*.test.mjs`, `scripts/phase6-smoke.mjs`: initial tests
- `docs/PHASE6-ERD.md`, `docs/PHASE6-API.md`: ERD and API reference

## Setup on a DEVELOPMENT database

Follow `README.md`, `README-STAGE2.md`, `README-STAGE3.md`, `README-STAGE4.md`, `README-STAGE5.md` in order to configure auth, distinct database credentials and authorized school scopes. Never deploy `DATABASE_URL` owner credentials with public Next.js.

```bash
npm install
npx prisma validate
npx prisma generate
npx prisma migrate dev --name stage6_extended_school
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/constraints-stage6.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/roles-stage6.sql
npm run typecheck
npm run test:contracts
npm run build
npm run dev
```

The schema-owner `DATABASE_URL` is for local migration and SQL privileges only. Runtime app must have `DATABASE_URL_STAFF_MEN/WOMEN/ACADEMY` plus existing stage 1–5 auth/contact restricted roles. Apply constraints **before** students or financial records are written. The SQL uses `btree_gist`, which the schema owner must have permission to install.

**New routes:** `http://localhost:3000/dashboard/advanced`, `/family/achievements`, `/verify`, `/certificate/print` (authenticated only).

**Tests already runnable without database:** `npm run test:contracts`. Optional staging smoke (deliberately refuses production by default): `CONFIRM_TEST_DATABASE=YES npm run test:stage6:e2e`.

## Outstanding requirements before real launch

- Recheck Prisma validate, generate, Next.js typecheck/build on installed packages and run all SQL against a real PostgreSQL 16/17 instance. Validate actual SQL role isolation, trigger behavior, schedule conflicts, concurrent duplicate payments, audit durability, CSRF/browser behavior, certificate QR printing.
- **Must implement** a reliable cross-section room reservation service and audit atomicity for all mutations. The existing audit writes on some actions are after data mutation rather than in the same DB transaction; do not treat as tamper-evident financial accounting.
- Add retention, backup/restore verification, at-rest encryption, consent process for minors, approved Privacy Policy, transactional email/WhatsApp opt-in, rate limiting, risk reviews, access logs.
- Add official authenticated Egypt payment gateway and refunds/reconciliation; no payment capture has been connected.
- Add questions bank and assessment rules, full canonical Qur'an juz-to-ayah mapping, official server-generated PDF certificates with robust Arabic shaping, media and privacy authorizations, Zoom/Meet attendance integration, child-friendly app mode, native Android/iOS release.
- No cloud deployment for source project without real app database and approved security. Existing Vercel static previews are examples, **not** linked to data or login.

**Zero-cost mode:** Keep payments manual, limit cloud video storage to approved public media, and defer server-side ASR and paid provider integrations. Server, domains, backups and provider services may still cost money; a reliable entirely free always-on production platform cannot be guaranteed.
