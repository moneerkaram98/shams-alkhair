-- Execute as database owner AFTER stage 4 Prisma migration and constraints.
-- No schema owner rights at runtime. Scoped staff login is the only role with access.
BEGIN;
REVOKE ALL ON ALL TABLES IN SCHEMA hifz_men,hifz_women,academy FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON hifz_men."MenRecitationAttempt",hifz_men."MenRecitationConsent" TO shams_staff_men;
GRANT SELECT,INSERT,UPDATE ON hifz_women."WomenRecitationAttempt",hifz_women."WomenRecitationConsent" TO shams_staff_women;
GRANT SELECT,INSERT,UPDATE ON academy."AcademyRecitationAttempt",academy."AcademyRecitationConsent" TO shams_staff_academy;
-- Cross-section access is NEVER granted. No SELECT from audio buckets at PostgreSQL level.
COMMIT;
