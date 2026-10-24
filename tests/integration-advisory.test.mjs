import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
for(const name of ['lib/admissions.ts','app/api/auth/login/route.ts']){
 test(`PostgreSQL advisory locks in ${name} do not project unsupported void type`,()=>{
  const code=readFileSync(new URL(name,root),'utf8');
  assert.match(code,/SELECT 1 AS lock_acquired FROM pg_advisory_xact_lock/);
  assert.doesNotMatch(code,/SELECT pg_advisory_xact_lock\(/);
 });
}
