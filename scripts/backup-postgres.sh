#!/usr/bin/env bash
# Schema owner/backup account required; no credentials are logged. Run only via controlled staff workstation or secure job runner.
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL only on private backup workstation}"
: "${BACKUP_DIRECTORY:?Set BACKUP_DIRECTORY (secure directory, not webroot)}"
umask 077
mkdir -p -- "$BACKUP_DIRECTORY"
chmod 700 "$BACKUP_DIRECTORY"
filename="$BACKUP_DIRECTORY/shams-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --no-owner --format=custom --compress=6 --file="$filename" "$DATABASE_URL"
chmod 600 "$filename"
printf 'Backup saved at %s; encrypt offsite and test restores regularly.
' "$filename"
