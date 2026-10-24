-- Run as DB owner AFTER `prisma migrate dev` has generated all tables.
-- For phase 1, web app credentials are each restricted to its own domain.
-- NO passwords are stored in this script. Create separate LOGIN roles as the DBA.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='shams_registration_men') THEN CREATE ROLE shams_registration_men NOLOGIN; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='shams_registration_women') THEN CREATE ROLE shams_registration_women NOLOGIN; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='shams_registration_academy') THEN CREATE ROLE shams_registration_academy NOLOGIN; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='shams_registration_contact') THEN CREATE ROLE shams_registration_contact NOLOGIN; END IF;
END $$;
REVOKE ALL ON SCHEMA hifz_men,hifz_women,academy,core FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA hifz_men,hifz_women,academy,core FROM PUBLIC;
-- Keep the database owner credential out of the deployed application.
GRANT USAGE ON SCHEMA hifz_men TO shams_registration_men;
GRANT USAGE ON SCHEMA hifz_women TO shams_registration_women;
GRANT USAGE ON SCHEMA academy TO shams_registration_academy;
GRANT USAGE ON SCHEMA core TO shams_registration_contact;
GRANT INSERT ON core."ContactInquiry" TO shams_registration_contact;
GRANT SELECT("id") ON core."ContactInquiry" TO shams_registration_contact;

GRANT INSERT ON hifz_men."MenApplication" TO shams_registration_men;
GRANT SELECT("id","reference","accessTokenHash","status") ON hifz_men."MenApplication" TO shams_registration_men;
GRANT SELECT ON hifz_men."MenPlacementSlot" TO shams_registration_men;
GRANT INSERT ON hifz_men."MenPlacementBooking" TO shams_registration_men;
GRANT SELECT("id","applicationId","slotId") ON hifz_men."MenPlacementBooking" TO shams_registration_men;

GRANT INSERT ON hifz_women."WomenApplication" TO shams_registration_women;
GRANT SELECT("id","reference","accessTokenHash","status") ON hifz_women."WomenApplication" TO shams_registration_women;
GRANT SELECT ON hifz_women."WomenPlacementSlot" TO shams_registration_women;
GRANT INSERT ON hifz_women."WomenPlacementBooking" TO shams_registration_women;
GRANT SELECT("id","applicationId","slotId") ON hifz_women."WomenPlacementBooking" TO shams_registration_women;

GRANT INSERT ON academy."AcademyApplication" TO shams_registration_academy;
GRANT SELECT("id","reference","accessTokenHash","department","status") ON academy."AcademyApplication" TO shams_registration_academy;
GRANT SELECT ON academy."AcademyPlacementSlot" TO shams_registration_academy;
GRANT INSERT ON academy."AcademyPlacementBooking" TO shams_registration_academy;
GRANT SELECT("id","applicationId","slotId") ON academy."AcademyPlacementBooking" TO shams_registration_academy;
COMMIT;

-- Example: create these LOGINs manually with strong generated passwords, and grant membership:
-- CREATE ROLE shams_men_login LOGIN PASSWORD 'REPLACE_WITH_GENERATED_SECRET';
-- GRANT shams_registration_men TO shams_men_login;
-- CREATE ROLE shams_women_login LOGIN PASSWORD 'REPLACE_WITH_DIFFERENT_GENERATED_SECRET';
-- GRANT shams_registration_women TO shams_women_login;
-- CREATE ROLE shams_academy_login LOGIN PASSWORD 'REPLACE_WITH_THIRD_GENERATED_SECRET';
-- GRANT shams_registration_academy TO shams_academy_login;
-- CREATE ROLE shams_contact_login LOGIN PASSWORD 'REPLACE_WITH_FOURTH_SECRET';
-- GRANT shams_registration_contact TO shams_contact_login;
-- IMPORTANT: do not make any LOGIN an owner, superuser, or member of another domain role.
