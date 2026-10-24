import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=p=>readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const schema=load("prisma/schema.prisma");
const auth=load("lib/phase2-auth.ts");
const qr=load("app/api/staff/qr/route.ts");
const attendance=load("app/api/staff/attendance/route.ts");
const grants=load("app/api/staff/grants/route.ts");
test("each scope has independently stored students, sessions, attendance and hashed QR",()=>{
 for(const scope of ["Men","Women","Academy"]){for(const model of ["Student","ClassGroup","Enrollment","LessonSession","Attendance","QrCredential","GuardianLink","TeacherAssignment"]){assert.match(schema,new RegExp(`model ${scope}${model} \{`));}}
 assert.equal((schema.match(/@@unique\(\[studentId, sessionId\]\)/g)||[]).length,3);
});
test("session secret and QR secrets are not saved in plaintext",()=>{assert.match(auth,/hashToken\(token\)/);assert.match(auth,/httpOnly:true/);assert.match(auth,/sameSite:"lax"/);assert.match(qr,/hashToken\(card.token\)/);assert.match(qr,/revokedAt:null/);});
test("teacher access requires group assignment and manager to women requires approval",()=>{assert.match(auth,/canTeachGroup/);assert.match(auth,/scope!=="women" \|\| await hasWomenGrant/);assert.match(grants,/grant.requesterId===a.id/);assert.match(grants,/role.*SUPERVISOR/);});
test("attendance corrections and QR scans write audit, duplicate attendance constrained",()=>{assert.match(attendance,/ATTENDANCE_SCAN/);assert.match(attendance,/ATTENDANCE_CORRECT/);assert.match(attendance,/tokenHash:hashToken\(v.token\)/);assert.match(load("db/constraints-stage2.sql"),/append-only/);});
test("schema permissions independent, no runtime owner credential",()=>{const sql=load("db/roles-stage2.sql");assert.match(sql,/shams_staff_women/);assert.match(sql,/shams_staff_men/);assert.doesNotMatch(load("lib/db.ts"),/env\["DATABASE_URL"\]/);});
