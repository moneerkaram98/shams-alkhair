-- Run as migration OWNER only; reapply after every migration.
BEGIN;
ALTER TABLE hifz_men."MenRecitationAttempt" ADD CONSTRAINT men_recitation_ref_bounds CHECK ("surahNumber" BETWEEN 1 AND 114 AND "ayahFrom" BETWEEN 1 AND 286 AND "ayahTo" BETWEEN "ayahFrom" AND LEAST(286,"ayahFrom"+14));
ALTER TABLE hifz_women."WomenRecitationAttempt" ADD CONSTRAINT women_recitation_ref_bounds CHECK ("surahNumber" BETWEEN 1 AND 114 AND "ayahFrom" BETWEEN 1 AND 286 AND "ayahTo" BETWEEN "ayahFrom" AND LEAST(286,"ayahFrom"+14));
ALTER TABLE academy."AcademyRecitationAttempt" ADD CONSTRAINT academy_recitation_ref_bounds CHECK ("surahNumber" BETWEEN 1 AND 114 AND "ayahFrom" BETWEEN 1 AND 286 AND "ayahTo" BETWEEN "ayahFrom" AND LEAST(286,"ayahFrom"+14));
DO $f$ DECLARE s text; p text; BEGIN
 FOR s,p IN SELECT * FROM (VALUES ('hifz_men','Men'),('hifz_women','Women'),('academy','Academy')) AS t(s,p) LOOP
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT recitation_size CHECK ("byteSize" > 0 AND "byteSize" <= 12582912)',s,p||'RecitationAttempt');
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT recitation_score CHECK ("provisionalMatch" IS NULL OR "provisionalMatch" BETWEEN 0 AND 100)',s,p||'RecitationAttempt');
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT teacher_recitation_score CHECK ("teacherMastery" IS NULL OR "teacherMastery" BETWEEN 0 AND 100)',s,p||'RecitationAttempt');
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT recitation_state_check CHECK (state IN (''QUEUED'',''PROCESSING'',''NEEDS_REVIEW'',''REVIEWED'',''FAILED'',''DELETED''))',s,p||'RecitationAttempt');
 END LOOP;
END $f$;
COMMIT;
