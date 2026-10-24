-- Apply once after the phase-2 Prisma migration, as DB owner.
-- Audit rows must be append-only for all non-owner operational connections.
CREATE OR REPLACE FUNCTION core.shams_reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit history is append-only'; END; $$;
DROP TRIGGER IF EXISTS audit_is_append_only ON core."AuditEvent";
CREATE TRIGGER audit_is_append_only BEFORE UPDATE OR DELETE ON core."AuditEvent"
FOR EACH ROW EXECUTE FUNCTION core.shams_reject_audit_mutation();
ALTER TABLE academy."AcademyClassGroup" ADD CONSTRAINT "academy_group_department_check" CHECK ("department" IN ('NURSERY','TAJWEED','IJAZAT'));
DO $$DECLARE rec record;
BEGIN
 FOR rec IN SELECT table_schema,table_name FROM information_schema.tables
   WHERE table_schema IN ('hifz_men','hifz_women','academy') AND table_name LIKE '%Attendance' LOOP
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I CHECK (status IN (''PRESENT'',''LATE'',''ABSENT'',''EXCUSED'',''LEFT_EARLY''))',rec.table_schema,rec.table_name,rec.table_name||'_status_check');
 END LOOP;
END $$;
