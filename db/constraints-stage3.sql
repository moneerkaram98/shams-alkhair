-- Run as migration OWNER after Prisma migration. Repeatable phase-3 constraints.
BEGIN;
DO $$ DECLARE target text; prefix text;
BEGIN
 FOR target,prefix IN SELECT * FROM (VALUES ('hifz_men','Men'),('hifz_women','Women'),('academy','Academy')) AS v(schema_name,model_prefix) LOOP
   IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = lower(prefix)||'_learning_valid') THEN
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I CHECK ("mastery" BETWEEN 0 AND 100 AND "surahNumber" BETWEEN 1 AND 114 AND "ayahFrom" BETWEEN 1 AND "ayahTo" AND "memoryErrors">=0 AND "tajweedErrors">=0 AND "makharijErrors">=0 AND "activity" IN (''NEW_MEMORIZATION'',''REVIEW''))',target,prefix||'LearningRecord',lower(prefix)||'_learning_valid');
   END IF;
   IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname=lower(prefix)||'_report_period_valid') THEN
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I CHECK ("periodType" IN (''WEEKLY'',''MONTHLY'') AND "periodEnd">"periodStart" AND "status" IN (''DRAFT'',''PUBLISHED''))',target,prefix||'StudentReport',lower(prefix)||'_report_period_valid');
   END IF;
 END LOOP;
END $$;
COMMIT;
