-- Safe, idempotent baseline metadata for the dedicated Shams Alkhair database.
-- No demo students, logins, fake schedules, or private records.
BEGIN;
INSERT INTO core."Branch" ("id","code","nameAr","active","createdAt")
VALUES (gen_random_uuid(),'MAIN','الفرع الرئيسي',true,now())
ON CONFLICT ("code") DO NOTHING;
INSERT INTO core."Department" ("id","code","nameAr","createdAt")
VALUES (gen_random_uuid(),'NURSERY','الحضانة',now()),(gen_random_uuid(),'HIFZ_MEN','تحفيظ الرجال',now()),
(gen_random_uuid(),'HIFZ_WOMEN','تحفيظ النساء',now()),(gen_random_uuid(),'TAJWEED','التجويد',now()),
(gen_random_uuid(),'IJAZAT','الإجازات',now())
ON CONFLICT ("code") DO NOTHING;
INSERT INTO core."Program" ("id","departmentId","code","nameAr","active")
SELECT gen_random_uuid(),d."id",d."code",d."nameAr",true
FROM core."Department" d WHERE d."code" IN ('NURSERY','HIFZ_MEN','HIFZ_WOMEN','TAJWEED','IJAZAT')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO core."Level" ("id","programId","nameAr","order")
SELECT gen_random_uuid(),p."id",'المستوى الأول',1
FROM core."Program" p WHERE p."code" IN ('NURSERY','HIFZ_MEN','HIFZ_WOMEN','TAJWEED','IJAZAT')
ON CONFLICT ("programId","order") DO NOTHING;
INSERT INTO core."AccessScope" ("id","code","nameAr")
VALUES (gen_random_uuid(),'SCHOOL','إدارة المدرسة'),(gen_random_uuid(),'ACADEMY','الحضانة والتجويد والإجازات'),
(gen_random_uuid(),'NURSERY','الحضانة'),(gen_random_uuid(),'HIFZ_MEN','تحفيظ الرجال'),
(gen_random_uuid(),'HIFZ_WOMEN','تحفيظ النساء'),(gen_random_uuid(),'TAJWEED','التجويد'),
(gen_random_uuid(),'IJAZAT','الإجازات')
ON CONFLICT ("code") DO NOTHING;
COMMIT;
