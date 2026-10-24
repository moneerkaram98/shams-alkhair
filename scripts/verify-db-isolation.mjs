#!/usr/bin/env node
/** Read-only integration test for a THROWAWAY PostgreSQL database only. */
import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
if(process.env.CONFIRM_TEST_DATABASE!=='YES')throw Error('Set CONFIRM_TEST_DATABASE=YES for a synthetic test database only');
const vars=['DATABASE_URL_STAFF_MEN','DATABASE_URL_STAFF_WOMEN','DATABASE_URL_STAFF_ACADEMY','DATABASE_URL_MEN','DATABASE_URL_WOMEN','DATABASE_URL_ACADEMY'];
for(const name of vars){
 const v=process.env[name];if(!v)throw Error(`${name} missing`);
 const url=new URL(v);
 if(!url.pathname.toLowerCase().includes('test'))throw Error(`${name} must connect to a test-named database`);
 if(['postgres','root'].includes(decodeURIComponent(url.username).toLowerCase()))throw Error(`${name} uses an owner/superuser role`);
}
const clients=Object.fromEntries(vars.map(name=>[name,new PrismaClient({datasources:{db:{url:process.env[name]}}})]));
const cases=[
 ['DATABASE_URL_STAFF_MEN','hifz_men."MenStudent"',true],
 ['DATABASE_URL_STAFF_MEN','hifz_women."WomenStudent"',false],
 ['DATABASE_URL_STAFF_WOMEN','hifz_women."WomenStudent"',true],
 ['DATABASE_URL_STAFF_WOMEN','hifz_men."MenStudent"',false],
 ['DATABASE_URL_STAFF_ACADEMY','academy."AcademyStudent"',true],
 ['DATABASE_URL_STAFF_ACADEMY','hifz_women."WomenStudent"',false],
 ['DATABASE_URL_MEN','hifz_men."MenApplication"',true],
 ['DATABASE_URL_MEN','hifz_women."WomenApplication"',false],
 ['DATABASE_URL_WOMEN','hifz_women."WomenApplication"',true],
 ['DATABASE_URL_WOMEN','hifz_men."MenApplication"',false],
 ['DATABASE_URL_ACADEMY','academy."AcademyApplication"',true],
 ['DATABASE_URL_ACADEMY','hifz_women."WomenApplication"',false]
];
let failed=0;
try{
 for(const [name,table,allowed] of cases){
  const sql=`SELECT "id" FROM ${table} LIMIT 0`; // table names are hardcoded, not user-supplied
  let success=false;
  try{await clients[name].$queryRawUnsafe(sql);success=true;}catch{}
  if(success!==allowed){failed++;console.error(`FAIL ${name} -> ${table}: expected ${allowed?'ALLOW':'DENY'}, got ${success?'ALLOW':'DENY'}`);}
  else console.log(`PASS ${name} -> ${table}: ${success?'ALLOW':'DENY'}`);
 }
}finally{await Promise.all(Object.values(clients).map(client=>client.$disconnect()));}
if(failed)process.exitCode=1;
else console.log('PASS: test database section isolation (12 read-only checks)');
