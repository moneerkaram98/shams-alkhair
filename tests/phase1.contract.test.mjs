import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
test("all sensitive admission models live in correct physical schemas",()=>{
  const schema=read("prisma/schema.prisma");
  for(const [model,domain] of [["MenApplication","hifz_men"],["WomenApplication","hifz_women"],["AcademyApplication","academy"]]) {
    assert.match(schema,new RegExp(`model ${model} \\{[\\s\\S]*?@@schema\\("${domain}"\\)`));
  }
});
test("no owner DB URL is used by public API",()=>{
  const source=read("lib/db.ts");
  assert.match(source,/DATABASE_URL_MEN/);assert.match(source,/DATABASE_URL_WOMEN/);assert.match(source,/DATABASE_URL_ACADEMY/);assert.match(source,/DATABASE_URL_CONTACT/);
  assert.doesNotMatch(source,/process\.env\["DATABASE_URL"\]/);
});
test("database isolation privileges include per-scope limits",()=>{
  const sql=read("db/roles.sql");
  for(const tag of ["shams_registration_men","shams_registration_women","shams_registration_academy","shams_registration_contact"])assert.ok(sql.includes(tag));
  assert.ok(sql.includes('GRANT SELECT("id") ON core."ContactInquiry"'));
  assert.ok(sql.includes('REVOKE ALL ON ALL TABLES'));
});
test("required user journeys and API routes exist",()=>{
  for(const path of ["app/api/register/route.ts","app/api/contact/route.ts","app/api/placement/slots/route.ts","app/api/placement/book/route.ts","app/api/application/status/route.ts","app/register/page.tsx","app/placement/page.tsx","app/application-status/page.tsx","app/contact/page.tsx"])
    assert.ok(existsSync(new URL(`../${path}`,import.meta.url)),path);
});
