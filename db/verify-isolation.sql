-- Execute as DBA AFTER db/roles.sql; verifies grants, not authenticated API policy.
DO $$
BEGIN
 IF has_schema_privilege('shams_registration_men', 'hifz_women', 'USAGE') THEN
   RAISE EXCEPTION 'MEN ROLE CAN USE WOMEN SCHEMA';
 END IF;
 IF has_schema_privilege('shams_registration_women', 'hifz_men', 'USAGE') THEN
   RAISE EXCEPTION 'WOMEN ROLE CAN USE MEN SCHEMA';
 END IF;
 IF has_table_privilege('shams_registration_men', 'hifz_women."WomenApplication"','SELECT') THEN
   RAISE EXCEPTION 'MEN ROLE CAN READ WOMEN APPLICATIONS';
 END IF;
 IF has_column_privilege('shams_registration_women', 'hifz_women."WomenApplication"', 'fullName', 'SELECT') THEN
   RAISE EXCEPTION 'PUBLIC REGISTRATION ROLE CAN READ WOMEN NAMES';
 END IF;
 IF NOT has_table_privilege('shams_registration_women','hifz_women."WomenApplication"','INSERT') THEN
   RAISE EXCEPTION 'WOMEN REGISTRATION ROLE CANNOT INSERT ITS OWN APPLICATION';
 END IF;
 IF has_table_privilege('shams_registration_academy','hifz_women."WomenApplication"','INSERT') THEN
   RAISE EXCEPTION 'ACADEMY ROLE CAN INSERT WOMEN APPLICATION';
 END IF;
 IF has_schema_privilege('shams_registration_contact', 'hifz_women', 'USAGE') THEN
   RAISE EXCEPTION 'CONTACT ROLE CAN ACCESS WOMEN SCHEMA';
 END IF;
 IF has_column_privilege('shams_registration_contact', 'core."ContactInquiry"', 'message', 'SELECT') THEN
   RAISE EXCEPTION 'CONTACT FORM ROLE CAN READ PRIVATE MESSAGES';
 END IF;
 RAISE NOTICE 'PASS: Phase 1 physical schema privilege isolation';
END $$;
