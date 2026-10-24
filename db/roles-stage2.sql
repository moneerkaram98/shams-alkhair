-- Phase 2: run AS OWNER after Prisma migration and db/roles.sql.
-- PostgreSQL login roles must be created separately; never use owner credentials at runtime.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='shams_auth') THEN CREATE ROLE shams_auth NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='shams_staff_men') THEN CREATE ROLE shams_staff_men NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='shams_staff_women') THEN CREATE ROLE shams_staff_women NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='shams_staff_academy') THEN CREATE ROLE shams_staff_academy NOLOGIN; END IF;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA core,hifz_men,hifz_women,academy FROM PUBLIC;
GRANT USAGE ON SCHEMA core TO shams_auth;
GRANT SELECT ON core."AppUser",core."RoleAssignment",core."AccessScope",core."SensitiveAccessGrant",core."AuthSession" TO shams_auth;
GRANT INSERT,UPDATE ON core."AuthSession" TO shams_auth;
GRANT UPDATE("failedLogins","lockedUntil") ON core."AppUser" TO shams_auth;
GRANT INSERT,UPDATE ON core."SensitiveAccessGrant" TO shams_auth;
GRANT INSERT,SELECT("id") ON core."AuditEvent" TO shams_auth;
-- Staff connections are distinct. They cannot access another scoped schema.
GRANT USAGE ON SCHEMA core TO shams_staff_men,shams_staff_women,shams_staff_academy;
GRANT INSERT,SELECT("id") ON core."AuditEvent" TO shams_staff_men,shams_staff_women,shams_staff_academy;
GRANT USAGE ON SCHEMA hifz_men TO shams_staff_men;
GRANT USAGE ON SCHEMA hifz_women TO shams_staff_women;
GRANT USAGE ON SCHEMA academy TO shams_staff_academy;
GRANT SELECT ON hifz_men."MenApplication" TO shams_staff_men;
GRANT SELECT ON hifz_women."WomenApplication" TO shams_staff_women;
GRANT SELECT ON academy."AcademyApplication" TO shams_staff_academy;
GRANT SELECT,INSERT,UPDATE ON
 hifz_men."MenStudent",hifz_men."MenGuardianLink",hifz_men."MenClassGroup",hifz_men."MenEnrollment",hifz_men."MenTeacherAssignment",hifz_men."MenLessonSession",hifz_men."MenQrCredential",hifz_men."MenAttendance" TO shams_staff_men;
GRANT SELECT,INSERT,UPDATE ON
 hifz_women."WomenStudent",hifz_women."WomenGuardianLink",hifz_women."WomenClassGroup",hifz_women."WomenEnrollment",hifz_women."WomenTeacherAssignment",hifz_women."WomenLessonSession",hifz_women."WomenQrCredential",hifz_women."WomenAttendance" TO shams_staff_women;
GRANT SELECT,INSERT,UPDATE ON
 academy."AcademyStudent",academy."AcademyGuardianLink",academy."AcademyClassGroup",academy."AcademyEnrollment",academy."AcademyTeacherAssignment",academy."AcademyLessonSession",academy."AcademyQrCredential",academy."AcademyAttendance" TO shams_staff_academy;
COMMIT;
-- DBA creates 4 role-member LOGINs manually, with secrets held in .env:
-- CREATE ROLE shams_auth_login LOGIN PASSWORD 'GENERATE_SEPARATELY'; GRANT shams_auth TO shams_auth_login;
-- CREATE ROLE shams_staff_men_login LOGIN PASSWORD 'GENERATE_SEPARATELY'; GRANT shams_staff_men TO shams_staff_men_login;
-- CREATE ROLE shams_staff_women_login LOGIN PASSWORD 'GENERATE_SEPARATELY'; GRANT shams_staff_women TO shams_staff_women_login;
-- CREATE ROLE shams_staff_academy_login LOGIN PASSWORD 'GENERATE_SEPARATELY'; GRANT shams_staff_academy TO shams_staff_academy_login;
