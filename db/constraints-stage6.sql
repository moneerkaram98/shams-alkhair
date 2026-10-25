-- Apply as schema owner AFTER stage6 migration; idempotent only if constraints do not yet exist.
BEGIN;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
DO $sql$ DECLARE section text; prefix text; t text; BEGIN
FOR section,prefix IN SELECT * FROM (VALUES ('hifz_men','Men'),('hifz_women','Women'),('academy','Academy')) x(s,p) LOOP
 t := prefix||'Invoice';
 EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT stage6_invoice_amounts CHECK ("amountPiasters" > 0 AND "discountPiasters" >= 0 AND "discountPiasters" < "amountPiasters")',section,t);
 EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT stage6_payment_amount CHECK ("amountPiasters" > 0 AND "method" IN (''CASH'',''BANK_TRANSFER'',''WALLET_MANUAL''))',section,prefix||'Payment');
 EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT stage6_exam_score CHECK ("total" > 0 AND "score" >= 0 AND "score" <= "total")',section,prefix||'Exam');
 EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT stage6_award_points CHECK ("points" BETWEEN 1 AND 50)',section,prefix||'Award');
 EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT stage6_review_bounds CHECK ("surah" BETWEEN 1 AND 114 AND "fromAyah" >= 1 AND "toAyah" >= "fromAyah" AND "intervalDays" BETWEEN 1 AND 90 AND ("lastMastery" IS NULL OR "lastMastery" BETWEEN 0 AND 100))',section,prefix||'ReviewTask');
 EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT stage6_cert_status CHECK (NOT "publicVerification" OR ("approvedAt" IS NOT NULL AND "verificationConsentAt" IS NOT NULL AND "revokedAt" IS NULL))',section,prefix||'Certificate');
 EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT stage6_schedule_time CHECK ("weekday" BETWEEN 0 AND 6 AND "fromMinute" >= 0 AND "toMinute" <= 1440 AND "toMinute" >= "fromMinute"+15)',section,prefix||'WeeklySchedule');
 -- Exclusion constraints prevent concurrent overlapping schedule reservations within this section.
 EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT stage6_no_group_overlap EXCLUDE USING gist ("groupId" WITH =,"weekday" WITH =,(int4range("fromMinute","toMinute",''[)'')) WITH &&) WHERE ("active")',section,prefix||'WeeklySchedule');
 EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT stage6_no_teacher_overlap EXCLUDE USING gist ("teacherId" WITH =,"weekday" WITH =,(int4range("fromMinute","toMinute",''[)'')) WITH &&) WHERE ("active")',section,prefix||'WeeklySchedule');
 EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT stage6_no_room_overlap EXCLUDE USING gist ("roomCode" WITH =,"weekday" WITH =,(int4range("fromMinute","toMinute",''[)'')) WITH &&) WHERE ("active")',section,prefix||'WeeklySchedule');
END LOOP;
END $sql$;
COMMIT;
