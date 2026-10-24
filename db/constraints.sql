-- Supplementary integrity checks: run AFTER the generated Prisma migration.
-- In production incorporate this script into an audited SQL migration.
BEGIN;
ALTER TABLE core."SensitiveAccessGrant" ADD CONSTRAINT "grant_no_self_approval" CHECK ("approverId" IS NULL OR "approverId" <> "requesterId");
ALTER TABLE core."ContactInquiry" ADD CONSTRAINT "contact_topic_valid" CHECK ("topic" IN ('GENERAL','COURSES','ADMISSIONS','OTHER'));
ALTER TABLE core."SensitiveAccessGrant" ADD CONSTRAINT "grant_valid_time" CHECK ("approvedAt" IS NULL OR ("expiresAt" IS NOT NULL AND "expiresAt" > "approvedAt"));
ALTER TABLE hifz_men."MenApplication" ADD CONSTRAINT "men_gender_valid" CHECK ("gender" IN ('MALE','FEMALE'));
ALTER TABLE hifz_men."MenApplication" ADD CONSTRAINT "men_status_valid" CHECK ("status" IN ('PENDING','ACCEPTED','REJECTED','WAITLISTED'));
ALTER TABLE hifz_men."MenPlacementSlot" ADD CONSTRAINT "men_slot_capacity" CHECK ("capacity" BETWEEN 1 AND 1000 AND "durationMin" BETWEEN 10 AND 480);
ALTER TABLE hifz_women."WomenApplication" ADD CONSTRAINT "women_gender_valid" CHECK ("gender" IN ('MALE','FEMALE'));
ALTER TABLE hifz_women."WomenApplication" ADD CONSTRAINT "women_status_valid" CHECK ("status" IN ('PENDING','ACCEPTED','REJECTED','WAITLISTED'));
ALTER TABLE hifz_women."WomenPlacementSlot" ADD CONSTRAINT "women_slot_capacity" CHECK ("capacity" BETWEEN 1 AND 1000 AND "durationMin" BETWEEN 10 AND 480);
ALTER TABLE academy."AcademyApplication" ADD CONSTRAINT "academy_gender_valid" CHECK ("gender" IN ('MALE','FEMALE'));
ALTER TABLE academy."AcademyApplication" ADD CONSTRAINT "academy_status_valid" CHECK ("status" IN ('PENDING','ACCEPTED','REJECTED','WAITLISTED'));
ALTER TABLE academy."AcademyPlacementSlot" ADD CONSTRAINT "academy_slot_capacity" CHECK ("capacity" BETWEEN 1 AND 1000 AND "durationMin" BETWEEN 10 AND 480);
ALTER TABLE hifz_men."MenApplication" ADD CONSTRAINT "men_gender" CHECK ("gender"='MALE');
ALTER TABLE hifz_women."WomenApplication" ADD CONSTRAINT "women_gender" CHECK ("gender"='FEMALE');
ALTER TABLE academy."AcademyApplication" ADD CONSTRAINT "academy_dept" CHECK ("department" IN ('NURSERY','TAJWEED','IJAZAT'));
ALTER TABLE academy."AcademyPlacementSlot" ADD CONSTRAINT "academy_slot_dept" CHECK ("department" IN ('NURSERY','TAJWEED','IJAZAT'));
COMMIT;
