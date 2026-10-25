-- Schema owner only. Explicit role tables; no unrestricted public access.
BEGIN;
DO $sql$ DECLARE section text; prefix text; staff text; t text; BEGIN
FOR section,prefix,staff IN SELECT * FROM (VALUES ('hifz_men','Men','shams_staff_men'),('hifz_women','Women','shams_staff_women'),('academy','Academy','shams_staff_academy')) x(s,p,r) LOOP
 FOREACH t IN ARRAY ARRAY['Invoice','Payment','Certificate','SanadEntry','Exam','ReviewTask','Award','WeeklySchedule'] LOOP
  EXECUTE format('REVOKE ALL ON %I.%I FROM PUBLIC',section,prefix||t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE ON %I.%I TO %I',section,prefix||t,staff);
  IF t = 'Payment' THEN EXECUTE format('REVOKE UPDATE,DELETE ON %I.%I FROM %I',section,prefix||t,staff); END IF;
  EXECUTE format('REVOKE ALL ON %I.%I FROM shams_auth,shams_registration_contact',section,prefix||t);
  IF section <> 'hifz_men' THEN EXECUTE format('REVOKE ALL ON %I.%I FROM shams_staff_men',section,prefix||t);END IF;
  IF section <> 'hifz_women' THEN EXECUTE format('REVOKE ALL ON %I.%I FROM shams_staff_women',section,prefix||t);END IF;
  IF section <> 'academy' THEN EXECUTE format('REVOKE ALL ON %I.%I FROM shams_staff_academy',section,prefix||t);END IF;
 END LOOP;
END LOOP;
END $sql$;
COMMIT;
