#!/usr/bin/env bash
# Synthetic-only integration test. NEVER point at a live school database.
set -Eeuo pipefail
: "${PGPASSWORD:?Set a throwaway PostgreSQL password in the CI runner}"
: "${CI_TEST_ONLY:?Set CI_TEST_ONLY=YES for an ephemeral empty database}"
if [[ "${CI_TEST_ONLY}" != 'YES' || "${PGDATABASE:-}" != 'shams_alkhair_test' || "${PGHOST:-}" != '127.0.0.1' ]]; then
  echo 'REFUSED: requires CI_TEST_ONLY=YES, PGDATABASE=shams_alkhair_test, PGHOST=127.0.0.1' >&2
  exit 1
fi
export PGUSER=postgres PGPORT="${PGPORT:-5432}"
if [[ "${NODE_ENV:-}" == 'production' ]]; then echo 'Refusing to seed/demo-test production' >&2;exit 1;fi
if [[ ! -f prisma/schema.prisma || ! -f package.json ]]; then echo 'Run from the project root' >&2;exit 1;fi
psql -v ON_ERROR_STOP=1 -tAc 'SELECT current_database()' | grep -qx 'shams_alkhair_test'
existing="$(psql -v ON_ERROR_STOP=1 -tAc "SELECT count(*) FROM pg_tables WHERE schemaname IN ('core','academy','hifz_men','hifz_women')")"
if [[ "$existing" != '0' ]]; then echo 'REFUSED: test database is not empty. Never reset an existing database.' >&2;exit 1;fi
export DATABASE_URL="postgresql://postgres:${PGPASSWORD}@127.0.0.1:${PGPORT}/shams_alkhair_test?schema=core"
export APP_ORIGIN='http://127.0.0.1:3000'
export NEXT_PUBLIC_SITE_URL="$APP_ORIGIN"

echo '== Installing and compiling the exact project in a disposable environment =='
npm install --no-audit --no-fund
npx prisma validate
npx prisma generate
# Fresh disposable database only. db push is NOT a substitute for a reviewed
# production migration history: it exercises the current Prisma model schema.
npx prisma db push

echo '== Applying the section constraints and least-privilege roles =='
for file in \
  db/constraints.sql db/constraints-stage2.sql db/constraints-stage3.sql \
  db/constraints-stage4.sql db/constraints-stage5.sql db/constraints-stage6.sql \
  db/roles.sql db/roles-stage2.sql db/roles-stage3.sql \
  db/roles-stage4.sql db/roles-stage5.sql db/roles-stage6.sql; do
  psql -X -v ON_ERROR_STOP=1 -f "$file" >/dev/null
  echo "OK: $file"
done

# Synthetic credentials are unique for each user/section and discarded with CI.
# Do not use these examples for any internet-exposed or persistent database.
psql -X -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
CREATE ROLE shams_men_login LOGIN PASSWORD 'ci_men_7P2vH9';
CREATE ROLE shams_women_login LOGIN PASSWORD 'ci_women_2K8dC4';
CREATE ROLE shams_academy_login LOGIN PASSWORD 'ci_academy_9R1xM6';
CREATE ROLE shams_contact_login LOGIN PASSWORD 'ci_contact_6L2yV7';
CREATE ROLE shams_auth_login LOGIN PASSWORD 'ci_auth_4J8nB5';
CREATE ROLE shams_staff_men_login LOGIN PASSWORD 'ci_staff_men_2A3sH7';
CREATE ROLE shams_staff_women_login LOGIN PASSWORD 'ci_staff_women_1F4pT8';
CREATE ROLE shams_staff_academy_login LOGIN PASSWORD 'ci_staff_academy_4N6gQ2';
GRANT shams_registration_men TO shams_men_login;
GRANT shams_registration_women TO shams_women_login;
GRANT shams_registration_academy TO shams_academy_login;
GRANT shams_registration_contact TO shams_contact_login;
GRANT shams_auth TO shams_auth_login;
GRANT shams_staff_men TO shams_staff_men_login;
GRANT shams_staff_women TO shams_staff_women_login;
GRANT shams_staff_academy TO shams_staff_academy_login;
SQL
export DATABASE_URL_MEN="postgresql://shams_men_login:ci_men_7P2vH9@127.0.0.1:${PGPORT}/shams_alkhair_test?schema=hifz_men"
export DATABASE_URL_WOMEN="postgresql://shams_women_login:ci_women_2K8dC4@127.0.0.1:${PGPORT}/shams_alkhair_test?schema=hifz_women"
export DATABASE_URL_ACADEMY="postgresql://shams_academy_login:ci_academy_9R1xM6@127.0.0.1:${PGPORT}/shams_alkhair_test?schema=academy"
export DATABASE_URL_CONTACT="postgresql://shams_contact_login:ci_contact_6L2yV7@127.0.0.1:${PGPORT}/shams_alkhair_test?schema=core"
export DATABASE_URL_AUTH="postgresql://shams_auth_login:ci_auth_4J8nB5@127.0.0.1:${PGPORT}/shams_alkhair_test?schema=core"
export DATABASE_URL_STAFF_MEN="postgresql://shams_staff_men_login:ci_staff_men_2A3sH7@127.0.0.1:${PGPORT}/shams_alkhair_test?schema=hifz_men"
export DATABASE_URL_STAFF_WOMEN="postgresql://shams_staff_women_login:ci_staff_women_1F4pT8@127.0.0.1:${PGPORT}/shams_alkhair_test?schema=hifz_women"
export DATABASE_URL_STAFF_ACADEMY="postgresql://shams_staff_academy_login:ci_staff_academy_4N6gQ2@127.0.0.1:${PGPORT}/shams_alkhair_test?schema=academy"

npm run db:seed
npm run verify:strict
CONFIRM_TEST_DATABASE=YES npm run verify:db-isolation
npm run typecheck

echo '== Creating synthetic user fixtures before removing owner credentials =='
STAFF_EMAIL='ci.admin@example.com' STAFF_NAME='CI Admin Only' \
 STAFF_PASSWORD='OnlyForDisposableCI_2026_Extra' STAFF_ROLE='SUPER_ADMIN' \
 STAFF_SCOPE='SCHOOL' STAFF_GENDER='UNSPECIFIED' npm run staff:create-user
STAFF_EMAIL='ci.women@example.com' STAFF_NAME='CI Women Supervisor' \
 STAFF_PASSWORD='DisposableWomenCI_2026_Extra' STAFF_ROLE='SUPERVISOR' \
 STAFF_SCOPE='HIFZ_WOMEN' STAFF_GENDER='FEMALE' npm run staff:create-user
STAFF_EMAIL='ci.men@example.com' STAFF_NAME='CI Men Supervisor' \
 STAFF_PASSWORD='DisposableMenCI_2026_Extra' STAFF_ROLE='SUPERVISOR' \
 STAFF_SCOPE='HIFZ_MEN' STAFF_GENDER='MALE' npm run staff:create-user
# Schema-owner credential is NEVER supplied to the web server or Next.js build.
unset DATABASE_URL
npm run build
echo '== Starting development server and testing registration, login, QR attendance == '
npm run dev >/tmp/shams-ci-next.log 2>&1 &
server_pid=$!
cleanup() { kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true; }
trap cleanup EXIT
ready=0
for attempt in {1..65}; do
 if curl --fail --silent --show-error "$APP_ORIGIN/api/health" >/dev/null 2>&1; then ready=1;break;fi
 sleep 2
done
if [[ "$ready" != '1' ]];then echo 'App never became healthy (showing safe build logs)' >&2;tail -45 /tmp/shams-ci-next.log >&2;exit 1;fi
RUN_DEMO_API_SMOKE=yes npm run test:smoke
SMOKE_URL="$APP_ORIGIN" SMOKE_ADMIN_EMAIL='ci.admin@example.com' \
 SMOKE_ADMIN_PASSWORD='OnlyForDisposableCI_2026_Extra' npm run test:phase2:e2e
CI_TEST_ONLY=YES node scripts/ci-privacy-smoke.mjs
printf '\nPASS: synthetic registration, booking, contact, login, QR attendance + cross-schema isolation.\n'
