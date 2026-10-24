#!/usr/bin/env bash
set -euo pipefail
: "${BACKUP_FILE:?Set BACKUP_FILE}"
: "${RESTORE_TARGET_URL:?Set RESTORE_TARGET_URL for isolated EMPTY testing database}"
if [[ "${RESTORE_CONFIRM:-}" != "RESTORE_TO_TEST_DB_ONLY" ]]; then echo 'Set RESTORE_CONFIRM=RESTORE_TO_TEST_DB_ONLY; refused.' >&2; exit 2; fi
if [[ ! -r "$BACKUP_FILE" ]]; then echo 'File not readable' >&2;exit 2;fi
pg_restore --list "$BACKUP_FILE" >/dev/null
pg_restore --verbose --no-owner --no-privileges --dbname="$RESTORE_TARGET_URL" "$BACKUP_FILE"
echo 'Restore finished; verify data integrity and role grants before declaring successful.'
