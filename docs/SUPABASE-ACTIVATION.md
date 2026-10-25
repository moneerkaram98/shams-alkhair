## Pooler host confirmed by school administrator (25 October 2026)
- Verified Supabase Session Pooler host supplied by the user: `aws-1-eu-central-1.pooler.supabase.com`.
- Session pooler port: `5432`; PostgreSQL database: `postgres`.
- Username for custom role follows `<role>.ixslanpanembouobgrrc`; the actual restricted Postgres role is `<role>`.
- Runtime variables: `DATABASE_URL_MEN`, `DATABASE_URL_WOMEN`, `DATABASE_URL_ACADEMY`, `DATABASE_URL_CONTACT`, `DATABASE_URL_AUTH`, `DATABASE_URL_STAFF_MEN`, `DATABASE_URL_STAFF_WOMEN`, `DATABASE_URL_STAFF_ACADEMY`.
- Use unique 32+ byte randomly generated secrets for every login. Never use the schema owner's `postgres` password in the deployed application. Store the eight complete URLs in Vercel Sensitive/Encrypted environment variables, not in GitHub.
- **Connection has NOT been established**: provisioning database LOGIN accounts is still pending; API readiness remains 503.
- Vercel now explicitly stores `SCHOOL_LIVE_READY=false` for preview and production. Do not activate before DB permission tests and privacy signoff.
- GitHub includes additional UI protection for unactivated registration/contact/placement pages and demo login, but this change must still be redeployed before it is visible.

# Shams Alkhair – Supabase PostgreSQL activation status

## Completed (25 October 2026)
- Created independent Supabase project `shams-alkhair` (ref `ixslanpanembouobgrrc`) in `eu-central-1`, currently Free.
- Generated initial DDL from the same Prisma 6 schema committed to GitHub. Applied to the NEW project only.
- Four private PostgreSQL schemas: `core` (11 tables), `hifz_men` (29), `hifz_women` (29), `academy` (29); **98 tables** total.
- All six sets of custom constraints and role GRANTs applied via Supabase migrations.
- Fixed obsolete `shams_contact` references in stage 5 and 6 scripts: proper NOLOGIN role is `shams_registration_contact`.
- Hardened the audit trigger `search_path`; moved `btree_gist` to `extensions`.
- Supabase Security Advisors: **zero reported security lints** after fixes.
- Database permissions verified: anon/authenticated have no access to any school table. Men/women supervisors cannot read the opposite section.
- Reference data: 1 main branch, 5 departments, 5 programs, 5 levels, 7 scopes; zero students.
- No persistent database passwords, administrator accounts, or private student information have been provided or stored in repository.

## Pending: actual Vercel connection
1. In [the new Supabase project](https://supabase.com/dashboard/project/ixslanpanembouobgrrc), select **Connect → Session pooler**.
2. Copy **ONLY the hostname** shown before `:5432`. Example *format* only: `aws-INDEX-eu-central-1.pooler.supabase.com`. The correct index/host MUST come from Supabase; don't infer it from region.
3. Do not share the database password or full connection string in chat or GitHub.
4. Once that hostname is provided, create eight **distinct least-privilege LOGIN roles**, one per DATABASE_URL_* domain, with generated random credentials; add each credential to Vercel as encrypted/sensitive preview env vars, without granting cross-schema roles.
5. Supabase pooler usernames for custom roles are `<role>.<project-ref>`; use Session pooler on port 5432, database `postgres`, and the correct `?schema=<scope>&connection_limit=1` per Prisma Client.
6. Keep `SCHOOL_LIVE_READY=false`. Rebuild a **preview** and require `/api/health=200` before considering any login/registration smoke test.
7. Test no cross-schema permissions, contact-only inserts, registration, logins, staff permissions, audit trigger, backup/restore, and placement capacity with synthetic records.
8. Set `SCHOOL_LIVE_READY=true` only after security acceptance and school signoff. Voice, video and mobile integrations remain separate incomplete products.

## Migration bookkeeping
Supabase's migration table records the actual schema and permission changes. `db/generated-prisma-initial.sql` is a reference copy and is **not** a Prisma migration history entry. Do not blindly run `prisma migrate deploy` against this populated database: baseline/migration history must first be reconciled.
Do not run `prisma db push` against the persistent school database; it is for disposable CI only.

## Security limitation
Prisma `@db.Uuid` defaults are generated client-side; do not insert missing IDs manually. The public source GitHub repository is NOT an appropriate place for connection strings, passwords, child identities or recordings.
