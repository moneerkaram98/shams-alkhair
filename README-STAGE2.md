# شمس الخير | المرحلة الثانية (إضافة إلى المرحلة الأولى)

**Deliverable:** full source-code update for roles, sessions, school management, private scoped student records, printable QR, guardian links, teacher assignments and attendance. **NOT yet a deployed, tested production backend.** Public Vercel link currently hosts a static UI preview separate from the application.

## Prerequisites
Node 22, npm, PostgreSQL 16+, Prisma 6, same database and phase-one `.env` and SQL grants. Database owner `DATABASE_URL` is used **only** for migrations, seed and CLI account provisioning, and MUST be absent from deployed runtime.

### 1 — Apply schema
```bash
npm install
npx prisma validate
npx prisma generate
npx prisma migrate dev --name phase2_staff_attendance
# Run phase1 constraints/permissions if this is a fresh DB:
# psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/constraints.sql
# psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/roles.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/constraints-stage2.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/roles-stage2.sql
```
`constraints-stage2.sql` installs a named CHECK constraint; execute it once per database. Do not run twice without reviewing/removing the existing constraint.

### 2 — Create separate runtime database login roles
Use a DBA console, replace each random password **separately**:
```sql
CREATE ROLE shams_auth_login LOGIN PASSWORD 'AUTH_RANDOM_SECRET';
GRANT shams_auth TO shams_auth_login;
CREATE ROLE shams_staff_men_login LOGIN PASSWORD 'MEN_RANDOM_SECRET';
GRANT shams_staff_men TO shams_staff_men_login;
CREATE ROLE shams_staff_women_login LOGIN PASSWORD 'WOMEN_RANDOM_SECRET';
GRANT shams_staff_women TO shams_staff_women_login;
CREATE ROLE shams_staff_academy_login LOGIN PASSWORD 'ACADEMY_RANDOM_SECRET';
GRANT shams_staff_academy TO shams_staff_academy_login;
```
Use `.env.runtime.example` as reference to populate four runtime URLs and Phase 1's four public URLs with login-level accounts only. **PostgreSQL OWNER `DATABASE_URL` MUST NEVER be in the live runtime**. Prisma generated client works across multiple schemas even with a restricted runtime login, but only tables that the login can query are accessible.

### 3 — Initial accounts (owner CLI only)
With `.env` configured for local maintenance:

PowerShell:
```powershell
$env:STAFF_EMAIL='admin@example.com'
$env:STAFF_NAME='مدير المدرسة'
$env:STAFF_PASSWORD='REPLACE_WITH_STRONG_UNIQUE_PASSWORD_14_CHARS_PLUS'
$env:STAFF_ROLE='SUPER_ADMIN'
$env:STAFF_SCOPE='SCHOOL'
$env:STAFF_GENDER='MALE'
npm run staff:create-user
Remove-Item Env:STAFF_PASSWORD
```

For a **women supervisor** use `STAFF_ROLE=SUPERVISOR`, `STAFF_SCOPE=HIFZ_WOMEN`, `STAFF_GENDER=FEMALE` and a different email/password. For a teacher: use `TEACHER` and matching gender/scope. For parents: `PARENT` scoped to their children's section; parent link is added by authorized staff using the dashboard/API. This bootstrap tool **rejects existing accounts** to prevent accidental password resets and uncontrolled privilege elevation. Do not store secrets in source-control or pass them in command-line arguments.

### 4 — Run & test
```bash
npm run test:contracts
npm run test:security
npm run typecheck
npm run build
npm run dev
```
Open http://localhost:3000/login then http://localhost:3000/dashboard. Login as admin; create groups, student profiles, enroll students, create a session, issue/print a QR, and scan within the session window. QR is encoded only as a random token; it never embeds student profile data. A new QR issuance invalidates earlier cards. Staff can record absence/excuse via `/api/staff/attendance/manual` or correct existing attendance with written reason.

**Acceptance checks (must run on a REAL PostgreSQL test DB before launch):**
1. men staff DB login tries `SELECT * FROM hifz_women."WomenStudent"` → permission denied;
2. women staff DB login tries `SELECT * FROM hifz_men."MenStudent"` → permission denied;
3. generic admin without approved grant requests women list → 403;
4. women supervisor grants admin access → allowed for up to 2 hours, then denied after expiry/revocation;
5. teacher cannot access unassigned group/QR issue;
6. same student/session QR scanned twice → second scan 409, only one database record;
7. revoked token fails, no presence is written;
8. woman data list action logs `SENSITIVE_READ`; attendance change logs `ATTENDANCE_CORRECT` with reason;
9. guardian A cannot see child linked to guardian B;
10. app check static/contract tests plus `npm run build` succeed.

The tests included in this deliverable are **source contracts**, not substitutes for a real PostgreSQL integration test, E2E browser testing, rate-limiting infrastructure, threat modeling, external audit or production readiness review.

### Limitations planned for next stages
- Direct server-side PDF generation and notification to parents not enabled (the browser allows print/save to PDF).
- Bulk issue supports max 40 fresh cards per request and prints them together; old cards are revoked.
- Full student academic profile, reports, voice recitation, recurring auto-absence scheduler (staff session closure currently records missing attendees), distributed rate limiting and push notifications are for later stages.
- Authentication uses a small self-contained scrypt+server-side session implementation. Before production, consider migrating to a maintained audited auth library, MFA for staff, IP/edge login throttling and account recovery.
- Real address, course fees, and teacher directory require official school-provided content.

See `docs/PHASE2-ERD.md` and `docs/PHASE2-API.md`.
