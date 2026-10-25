-- Apply as schema-owner after stage 5 migration. Runtime roles never receive DDL or cross-section grants.
BEGIN;
REVOKE ALL ON hifz_men."MenVideo",hifz_women."WomenVideo",academy."AcademyVideo" FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON hifz_men."MenVideo" TO shams_staff_men;
GRANT SELECT,INSERT,UPDATE ON hifz_women."WomenVideo" TO shams_staff_women;
GRANT SELECT,INSERT,UPDATE ON academy."AcademyVideo" TO shams_staff_academy;
-- Explicit cross-schema enforcement; tables are not shared via auth/contact accounts.
REVOKE ALL ON hifz_women."WomenVideo" FROM shams_staff_men,shams_staff_academy,shams_auth,shams_registration_contact;
REVOKE ALL ON hifz_men."MenVideo" FROM shams_staff_women,shams_staff_academy,shams_auth,shams_registration_contact;
REVOKE ALL ON academy."AcademyVideo" FROM shams_staff_women,shams_staff_men,shams_auth,shams_registration_contact;
COMMIT;
