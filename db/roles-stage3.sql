-- Run as OWNER after db/roles-stage2.sql.
-- Re-apply after EVERY schema migration; migration owner must not be available to application runtime.
BEGIN;
REVOKE ALL ON ALL TABLES IN SCHEMA hifz_men,hifz_women,academy FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON
  hifz_men."MenLearningRecord",hifz_men."MenStudentReport",hifz_men."MenReportPreference",hifz_men."MenReportDelivery",hifz_men."MenFamilyMessage",hifz_men."MenFamilyNotification" TO shams_staff_men;
GRANT SELECT,INSERT,UPDATE ON
  hifz_women."WomenLearningRecord",hifz_women."WomenStudentReport",hifz_women."WomenReportPreference",hifz_women."WomenReportDelivery",hifz_women."WomenFamilyMessage",hifz_women."WomenFamilyNotification" TO shams_staff_women;
GRANT SELECT,INSERT,UPDATE ON
  academy."AcademyLearningRecord",academy."AcademyStudentReport",academy."AcademyReportPreference",academy."AcademyReportDelivery",academy."AcademyFamilyMessage",academy."AcademyFamilyNotification" TO shams_staff_academy;
COMMIT;
