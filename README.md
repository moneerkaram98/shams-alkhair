# ملاحظة هامة: الإصدار الموحّد بعد المرحلة السادسة

تمت إضافة إصلاحات للمدفوعات والتدقيق، واختبارات جدوى التشغيل وعزل قاعدة البيانات. **ابدأ بقراءة [دليل التكامل](docs/INTEGRATION-HANDOFF.md) قبل التشغيل**. لا تعتبر روابط معاينة Vercel السابقة تشغيلًا حقيقيًا لهذا المستودع. **لا تستعمل بيانات طلاب فعلية قبل التحقق من الاتصال والخصوصية والصلاحيات.**

---

# مدرسة شمس الخير للقرآن الكريم — المرحلة الأولى

**Status: phase-one source implemented, NOT production-certified.** A functional Arabic RTL website, department pages, registration, private admission references, secured placement slot discovery/booking, application status, and contact forms. The implementation keeps admissions for men, women and academy physically separated in PostgreSQL schemas, with distinct limited runtime DB accounts. Operator testing is done with a LOCAL-ONLY CLI (no unprotected internet admin pages). Node 22, Next.js 16, React 19, Prisma 6 and PostgreSQL 17.

> Do not accept identifiable real student/child data until you have approved the site's actual privacy notice, hosting, backups, retention policy, TLS, external rate limiting, and authorized staff workflow. This repository has not run a complete database integration test in its creation environment; PostgreSQL and npm packages must be available locally. Do not publish with seeded fake data or developer credentials.

## 1. What's included

- `/` home; `/about`, `/departments`, five department detail routes, `/teachers`, `/courses`, `/news`, `/gallery`, `/contact`, `/privacy`.
- `/register`: validates age (4–100), gender/section and minor's guardian; returns a **one-time shown**, high-entropy access token and a reference; each private application is in its own schema.
- `/placement`: slot listing restricted by reference + token, capacity-aware booking, transactional advisory lock, protection against a duplicate booking.
- `/application-status`: shows applicant's status and booked appointment only after secret proof.
- `/contact`: general inquiry submission with its own insert-only database user.
- `content/site.json`: publish **approved** public teacher/course/news/gallery content; do not add personal images without explicit consent. Content changes require redeployment.
- `scripts/staff-dev.mjs`: local-only operator CLI for creating dates, changing application status, recording placement result and reviewing reference IDs. **Not** a role-authorized public admin dashboard.
- `scripts/smoke-api.mjs`: optional local end-to-end smoke scenario using invented test data.
- `docs/ERD-FINAL.md`: target ERD for all stages; Prisma Phase 1 contains 22 models.

## 2. Requirements

- Node.js 22 and npm
- PostgreSQL 16/17; `psql` client
- Docker optional. If Docker Desktop/WSL fails on Windows, use locally installed PostgreSQL and Node directly.
- A test database named `shams_alkhair` (never a production/student database for initial tests)

### A. Database preparation

Use a PostgreSQL administrator to create the database if it doesn't exist:

```sql
CREATE DATABASE shams_alkhair;
```

Or use Docker for just the database (separate from app):

```bash
# Export POSTGRES_PASSWORD with your secure local secret before running:
docker compose up -d
```

Copy `.env.example` to `.env` (`Copy-Item .env.example .env` on PowerShell) and replace `DATABASE_URL`'s password with the PostgreSQL database **owner** credentials for local migrations/seed. Keep that secret in an environment accessible only to administrators.

```bash
npm install
npm run db:validate
npm run db:generate
npm run db:migrate -- --name initial_stage1
# As PostgreSQL owner, one time on a fresh DB only:
psql "postgresql://postgres@localhost:5432/shams_alkhair" -v ON_ERROR_STOP=1 -f db/constraints.sql
npm run db:seed
psql "postgresql://postgres@localhost:5432/shams_alkhair" -v ON_ERROR_STOP=1 -f db/roles.sql
```

The seed creates **FAKE** branch/program data and **FAKE** placement slots for manual testing. Never present these as approved school appointments; clear and replace them before actual use.

### B. Create restricted LOGIN accounts

Run the following as DBA with **four independent randomly generated passwords**. These are illustrative placeholders, not safe passwords:

```sql
CREATE ROLE shams_men_login LOGIN PASSWORD 'REPLACE_MEN_WITH_RANDOM_SECRET';
GRANT shams_registration_men TO shams_men_login;
CREATE ROLE shams_women_login LOGIN PASSWORD 'REPLACE_WOMEN_WITH_RANDOM_SECRET';
GRANT shams_registration_women TO shams_women_login;
CREATE ROLE shams_academy_login LOGIN PASSWORD 'REPLACE_ACADEMY_WITH_RANDOM_SECRET';
GRANT shams_registration_academy TO shams_academy_login;
CREATE ROLE shams_contact_login LOGIN PASSWORD 'REPLACE_CONTACT_WITH_RANDOM_SECRET';
GRANT shams_registration_contact TO shams_contact_login;
```

Update the four `DATABASE_URL_*` variables in `.env` with the new roles/passwords. Passwords with special characters must be URL-encoded. Never point runtime credentials at `postgres` or use `DATABASE_URL` inside the web application. For a production container keep migration/admin credentials **out** of runtime secrets entirely.

**Verify isolation as DBA:**

```bash
psql "postgresql://postgres@localhost:5432/shams_alkhair" -v ON_ERROR_STOP=1 -f db/verify-isolation.sql
```

The DB grants restrict each public endpoint to its own schema. `roles.sql` should be reviewed after any subsequent migration that creates new tables or changes privileges.

### C. Start the website

```bash
npm run typecheck
npm run build
npm run dev
```

Open **http://localhost:3000**. Edit `SCHOOL_WHATSAPP`, `SCHOOL_ADDRESS`, and `SCHOOL_MAP_URL` only when the real school's information has been verified; otherwise the contact page doesn't display invented details.

### D. Inspect applications / configure appointment slots (development only)

Enable `ENABLE_LOCAL_STAFF_CLI=yes` in **local** `.env` temporarily. For women's demo admission records also set `ALLOW_WOMEN_STAFF_DEV=yes` in your isolated development environment. This is **not** a substitute for actual identity and exceptional-access approval. Do **not** enable these flags on live hosting.

```bash
npm run staff -- slots men
npm run staff -- slot-add men 2026-11-10T12:00:00+02:00 8 "قاعة ١"
npm run staff -- slot-add academy 2026-11-10T12:00:00+02:00 8 "قاعة الحضانة" NURSERY
npm run staff -- applications men
npm run staff -- application-get men SK-REFERENCE
npm run staff -- status men SK-REFERENCE ACCEPTED
npm run staff -- result men SK-REFERENCE 85 "المستوى الأول" true
```

For local inquiry review only, also set `ALLOW_CONTACT_STAFF_DEV=yes` and run `npm run staff -- inquiries contact`.

This CLI requires a local DB owner URL and **must not** be exposed on the public host. It logs an operational audit entry for status/result updates but does not authenticate the operator (its entries are not sufficient for regulated production auditing). Authorization and a real staff UI arrive with Phase 2.

## 3. Tests

```bash
npm run test:contracts  # 4 dependency-free source contract tests
npm run typecheck        # requires npm install
npm run db:validate
npm run build
```

After using a **throwaway test database** with the seeded demo slots and starting `npm run dev`:

```bash
# Linux/macOS:
RUN_DEMO_API_SMOKE=yes npm run test:smoke
# Windows PowerShell:
$env:RUN_DEMO_API_SMOKE="yes"; npm run test:smoke
```

The smoke test registers a fake male applicant, checks a bad token is rejected, lists slots, books once, verifies a duplicate is denied, checks appointment status, and sends a fake contact message. It creates **database rows**. Run only in your local test environment; never run in production.

Manual testing: enter ages below four and above one hundred; try a boy in the women's section, no guardian for a minor, invalid department, missing consent; all must return validation errors. Verify no cross-schema access with `db/verify-isolation.sql`. For concurrent booking capacity, open two separate test applicants and send parallel requests to a one-seat slot; only one should succeed.

## 4. Docker for the website

A `Dockerfile` and `compose.app.yml` are supplied. Provision PostgreSQL and four restricted roles separately first. Copy `.env.runtime.example` to `.env.runtime` and provide **only** the restricted runtime credentials (never the owner/migration `DATABASE_URL`), then:

```bash
docker compose -f compose.app.yml up --build
```

This binds the app to local port `127.0.0.1:3000`; deploy behind TLS reverse proxy when hosting. The DB owner credentials **must be removed** from the app's runtime environment when deployed. `compose.app.yml` is a convenience build example, not a fully secured production deployment configuration. Do not run the local staff CLI in a production image.

## 5. Important phase boundary

Phase 1 **does not** include: a secure web staff login, RBAC dashboards, level-to-student enrollment, teacher assignment, file uploads, QR attendance, parent dashboard, recitation AI, reports, certificate generation, or videos. The accepted ERD maps those workflows but database entities are added as their phases are implemented.

Manager's temporary access to women's details is **not switched on** in phase 1. It requires a separate supervisor approval flow, expiring grants, authenticated operators and complete access audit in Phase 2. An ordinary super-admin must not receive automatic access to all women's records.

The website supports Arabic RTL; an English translation, real official numbers, timetables, rates, and staff profiles are not fabricated. `content/site.json` is empty by design until approved records are available. File upload and private media storage await an authorized S3-compatible store in the appropriate phase.

## 6. Suggested first-stage sign-off checklist

- [ ] PostgreSQL migration completes, seed and grants applied
- [ ] Role isolation SQL verification passes
- [ ] Full TypeScript check and production Next build pass
- [ ] API smoke test passes against empty test DB
- [ ] Approved privacy notice and consent for children in place
- [ ] School phone/address/map, teacher profiles and schedule approved
- [ ] Proper production TLS, rate limiting, monitoring, backups and recovery tests

Do not mark production-ready until all above checks pass.

---

## تحديث التكامل v6.2 (بعد المراحل الست)

إصلاح أقفال تسجيل الدخول المتزامنة، وفحوص تمييز حسابات قواعد بيانات الأقسام، ومسار GitHub Actions لاختبار PostgreSQL 17 آليًا. راجع [دليل جاهزية الإصدار v6.2](docs/RELEASE-READINESS-V6.2.md).

**تنبيه:** 78 اختبارًا أوليًا ناجحًا لا تعني نشرًا جاهزًا أو نجاح الاختبارات الحقيقية؛ موقع Vercel السابق معاينات تصميم منفصلة. النسخة الموحّدة لا تزال بحاجة إلى CI/PostgreSQL وPrisma migrations ونشر staging حقيقي.


---

## تحديث الأمان للتسليم GitHub (v6.3-preflight)

أُضيف `npm run verify:release` لمنع تضمين ملفات البيئة والتسجيلات والنسخ الاحتياطي في الحزمة، مع أربعة اختبارات جديدة وتحسين `.gitignore`، ومهمة فحص أمني في GitHub Actions. نجح **82 اختبارًا أوليًا** فقط؛ لا توجد شهادة نجاح لـ Postgres/Prisma/Next build بعد. راجع [تسليم GitHub وخطوات staging](docs/GITHUB-STAGING-HANDOFF.md). **لا ترفع المصدر إلى مستودع عام**.
