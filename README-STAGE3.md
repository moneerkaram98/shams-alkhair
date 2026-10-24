# مدرسة شمس الخير — المراحل 1–4

اقرأ [README-STAGE4.md](README-STAGE4.md) للتحديثات الجديدة.

# مدرسة شمس الخير — المرحلة الثالثة

**Includes source from stages 1 + 2 + 3.** This is a source-code deliverable for local development, **not a verified production deployment**. Live public links show independently hosted design previews, not an enabled database application.

## Added in Stage 3

- `/family`: guardian/student view restricted to active `GuardianLink` / own `Student.userId`; multi-child selector, attendances, teacher assessments, progress bars, published reports, guardian notification preferences, messaging.
- `/dashboard/progress`: authorized staff recording of new memorization/review, verse range, 0–100 teacher mastery score and error counts, private notes, draft/approve reports, teacher messaging.
- Separate tables for MEN, WOMEN, and ACADEMY: `LearningRecord`, `StudentReport`, `ReportPreference`, `ReportDelivery`, `FamilyMessage`, `FamilyNotification` (18 models). No female-student personal files moved to `core`.
- Teacher may access only students actively enrolled in assigned groups. Guardian sees only actively linked children. School administrator needs approved, time-limited grant to inspect women's records.
- Weekly/monthly report snapshots capture the **recorded** attendance/assessments for UTC report periods, not missing/unrecorded classes. Only published reports are accessible to parents.
- Reports have authenticated, printable HTML routes, so users can select **Save as PDF** in the browser. **No server-side PDF generation yet.**
- Daily UTC cron endpoint `/api/jobs/reports` with `Authorization: Bearer CRON_SECRET`: on Mondays prepares the previous week; on the first of the month prepares the previous calendar month. Default DRAFT for teacher review. Approved reports notify the guardian in-app if opted-in. Optional Resend email sends a login link **only to explicitly opted-in guardians**. WhatsApp and native push remain unimplemented.

## Install / update

Requirements: Node.js 22, npm, PostgreSQL 16+, a local SSL-aware configuration for production. Copy your existing settings. No real student data until an independent security test. Never commit `.env` or a database-owner password.

```bash
npm install
# In a LOCAL maintenance shell, set owner DATABASE_URL for migrations ONLY
npx prisma validate
npx prisma generate
npx prisma migrate dev --name stage3_parent_progress_reports
# Database OWNER, after stage 1 + stage 2 grants have been applied:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/constraints-stage3.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/roles-stage3.sql
```

**Important:** `db/constraints-stage3.sql` is designed to be repeatable; `db/roles-stage3.sql` grants only the new scoped models. Owner credentials must be **removed** from deployment runtime. Keep all eight `DATABASE_URL_*` restricted connection strings (phase 1 registration and phase 2 staff/auth) scoped to separate PostgreSQL LOGINs as described in `README.md` and `README-STAGE2.md`. `GRANT` only to the role for the appropriate section. Re-audit privileges after every migration.

```bash
npm run test:contracts   # static/source contract checks, no Postgres
npm run test:phase3
npm run typecheck        # needs npm dependencies + Prisma generated client
npm run build            # needs npm dependencies + runtime/build variables
npm run dev
```

Open:

- `http://localhost:3000/login`
- `http://localhost:3000/family` (guardian/student account)
- `http://localhost:3000/dashboard/progress` (authorized teacher/supervisor)
- `http://localhost:3000/dashboard` (stage 2 admin management)

### Provisioning and links

Use `npm run staff:create-user` with env vars `STAFF_ROLE=PARENT`, `STAFF_SCOPE=HIFZ_MEN` (or `HIFZ_WOMEN` / `ACADEMY`) and a distinct strong password. Then link that guardian's UUID to their child using staff's `/api/staff/guardians` endpoint or the admin dashboard. If children span sections, give the parent **separate section-scoped roles** via a DBA-approved provisioning script (don't grant gender data to parents generally). Use unique email per login and do not email temporary passwords.

Teacher's role must be scoped to the relevant section and attached to group with `/api/staff/assign`. Staff can add students and enroll them using the stage-2 dashboard. For report notification preferences, the parent visits `/family` and opts into email; **the parent cannot disable required teacher review**. Authorized teacher/supervisor may set approval policy via `PUT /api/staff/report-approval`.

### Scheduled reports / email provider

- `CRON_SECRET`: at least 32 random characters in deployment secrets; Vercel Cron supplies `Authorization: Bearer ...` when configured.
- `NEXT_PUBLIC_SITE_URL`: the real HTTPS web domain. The email sends a link to authenticated `/family` and does **not attach private report contents**.
- `RESEND_API_KEY`, `REPORT_EMAIL_FROM`: verified domain email credentials; both optional, leave blank to keep all email deliveries queued.
- `vercel.json` schedules `03:00 UTC` daily, generating weekly/monthly drafts when due and retrying opted-in email deliveries. The scope processing cap is 150 students per section per run to limit function runtime; above that requires durable job queue/pagination before use at scale.
- No WhatsApp integration, native push or background live messaging in this stage. Chats are database stored; users must refresh to see replies.
- PDF is browser **Print/Save as PDF**, not auto-generated PDF file on server.

### Development integration smoke test (writes ONLY synthetic students)

Use a disposable **staging** database and a staged SUPER_ADMIN login:

```bash
export SMOKE_ADMIN_EMAIL='staging-admin@example.org'
export SMOKE_ADMIN_PASSWORD='your-own-staging-password'
export SMOKE_URL='http://localhost:3000'
npm run test:phase3:e2e
```

Smoke test checks: stage 2 login/group/student, stage 3 saved academic record, report draft+publish, guardian isolation rejecting unrelated access. It must not be pointed at production.

## Before any real use / production blockers

1. Run Prisma validation, TypeScript typecheck, Next build, schema migrations and full DB integration tests with actual PostgreSQL. Dependency installation was blocked in our build environment (npm DNS `EAI_AGAIN`), so these tests have **not** passed here.
2. Test women/men SQL login cross-schema access is denied. Check student/guardian/teacher unauthorized IDs and no cache of private content. Deploy only with restricted login roles.
3. Add API throttling (especially auth), CSRF hardening, request logging redaction, staff MFA, and independent penetration/privacy review appropriate for children's records.
4. Implement durable mail/report queue, pagination above 150 students per scope, verified retention policies, backup restore drills and approved institutional notices.
5. Validate Arabic PDF font/rendering for all browsers. For server-side generation, choose a vetted RTL-capable renderer after font licensing verification.

`docs/PHASE3-API.md` and `docs/PHASE3-ERD.md` provide developer references.
