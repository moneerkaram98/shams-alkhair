#!/usr/bin/env bash
# CI-only recovery drill. The source and restored DB are disposable and contain
# synthetic records only. Never run this against the actual school database.
set -Eeuo pipefail
if [[ "${CI_TEST_ONLY:-}" != "YES" || "${PGDATABASE:-}" != "shams_alkhair_test" ||
      "${PGHOST:-}" != "127.0.0.1" || "${PGUSER:-}" != "postgres" ||
      "${NODE_ENV:-}" == "production" ]]; then
  echo "REFUSED: backup drill requires local, disposable CI database" >&2
  exit 1
fi
: "${PGPASSWORD:?Missing disposable CI PostgreSQL password}"
restore_db="shams_alkhair_restore_test"
# Never replace or delete a database that was present before this script started.
existing="$(psql -X -v ON_ERROR_STOP=1 -d postgres -Atqc "SELECT count(*) FROM pg_database WHERE datname='$restore_db'")"
if [[ "$existing" != "0" ]]; then echo "REFUSED: recovery DB already exists" >&2; exit 1; fi

# The PostgreSQL 17 service image provides matching pg_dump/pg_restore binaries.
# Ubuntu runners may only have a v16 client, which cannot dump a v17 server.
mapfile -t containers < <(docker ps -q --filter "ancestor=postgres:17-alpine")
if [[ "${#containers[@]}" != "1" ]]; then
  echo "REFUSED: expected exactly one disposable PostgreSQL 17 service container" >&2
  exit 1
fi
service_container="${containers[0]}"
archive=/tmp/shams_ci_synthetic_recovery.dump
created=0
cleanup(){
  docker exec "$service_container" rm -f "$archive" >/dev/null 2>&1 || true
  if [[ "$created" == "1" ]]; then
    dropdb -h "$PGHOST" -U "$PGUSER" "$restore_db" >/dev/null 2>&1 || echo "WARNING: cleanup of disposable restore DB failed" >&2
  fi
}
trap cleanup EXIT

table_query="SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname IN ('core','academy','hifz_men','hifz_women')"
rows_query=$(cat <<'SQL'
SELECT concat_ws(':',
  (SELECT count(*) FROM core."AppUser"),
  (SELECT count(*) FROM hifz_men."MenStudent"),
  (SELECT count(*) FROM hifz_women."WomenStudent"),
  (SELECT count(*) FROM academy."AcademyApplication"))
SQL
)
source_tables="$(psql -X -v ON_ERROR_STOP=1 -Atqc "$table_query")"
source_rows="$(psql -X -v ON_ERROR_STOP=1 -Atqc "$rows_query")"
if (( source_tables < 60 )); then echo "REFUSED: source fixture schema is incomplete" >&2; exit 1; fi

# Keep the archive exclusively in ephemeral runner storage, never as a CI artifact.
docker exec "$service_container" pg_dump -U postgres -d "$PGDATABASE" -Fc -f "$archive"
createdb -h "$PGHOST" -U "$PGUSER" "$restore_db"
created=1
docker exec "$service_container" pg_restore -U postgres --exit-on-error -d "$restore_db" "$archive"

restored_tables="$(psql -X -v ON_ERROR_STOP=1 -d "$restore_db" -Atqc "$table_query")"
restored_rows="$(psql -X -v ON_ERROR_STOP=1 -d "$restore_db" -Atqc "$rows_query")"
if [[ "$restored_tables" != "$source_tables" || "$restored_rows" != "$source_rows" ]]; then
  echo "FAIL: restored schema/data counts differ from the disposable source" >&2
  exit 1
fi
# Verify a section account still has its own schema and not the women's schema.
allowed="$(psql -X -v ON_ERROR_STOP=1 -d "$restore_db" -Atqc "SELECT has_schema_privilege('shams_staff_men_login','hifz_men','USAGE') AND NOT has_schema_privilege('shams_staff_men_login','hifz_women','USAGE')")"
if [[ "$allowed" != "t" ]]; then echo "FAIL: recovered section grants are not isolated" >&2; exit 1; fi
echo "PASS: synthetic backup restored; table counts, fixture record counts and section grants match."
