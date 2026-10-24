-- Run as schema-owner *once* after `prisma migrate`. Must not be executed twice.
BEGIN;
DO $block$ DECLARE s text; prefix text; BEGIN
 FOR s,prefix IN SELECT * FROM (VALUES ('hifz_men','Men'),('hifz_women','Women'),('academy','Academy')) AS x(s,prefix) LOOP
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT video_visibility_check CHECK ("visibility" IN (''PUBLIC'',''ENROLLED'',''LEVEL'',''GROUP''))',s,prefix||'Video');
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT video_status_check CHECK ("status" IN (''UPLOADING'',''PROCESSING'',''READY'',''ERROR''))',s,prefix||'Video');
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT video_review_check CHECK ("reviewStatus" IN (''PENDING'',''APPROVED'',''REJECTED''))',s,prefix||'Video');
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT video_target_check CHECK (("visibility" <> ''GROUP'' OR "groupId" IS NOT NULL) AND ("visibility" <> ''LEVEL'' OR "levelId" IS NOT NULL))',s,prefix||'Video');
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT video_publish_check CHECK ("publishedAt" IS NULL OR ("reviewStatus" = ''APPROVED'' AND "status" = ''READY''))',s,prefix||'Video');
 END LOOP;
END $block$;
ALTER TABLE hifz_men."MenVideo" ADD CONSTRAINT men_video_never_public CHECK ("visibility" <> 'PUBLIC');
ALTER TABLE hifz_women."WomenVideo" ADD CONSTRAINT women_video_never_public CHECK ("visibility" <> 'PUBLIC');
COMMIT;
