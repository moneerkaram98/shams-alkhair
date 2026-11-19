import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('public admissions and contact are fail-closed until explicitly approved', () => {
  for (const path of ['app/api/register/route.ts','app/api/contact/route.ts','app/api/placement/book/route.ts','app/api/placement/slots/route.ts','app/api/application/status/route.ts']) {
    const source=load(path);
    const gate='process.env.SCHOOL_LIVE_READY!=="true"';
    assert.ok(source.includes(gate), `${path} must reject requests by default`);
    const gateAt=source.indexOf(gate);
    const payloadAt=source.indexOf('await req.json()');
    const expectedCall=path.includes('/register/')?'await createAdmission('
      :path.includes('/contact/')?'await db("contact").contactInquiry.create('
      :path.includes('/placement/book/')?'await reservePlacement('
      :path.includes('/placement/slots/')?'await availableSlotsForApplicant('
      :'await applicantStatus(';
    const dbAccessAt=source.indexOf(expectedCall);
    assert.ok(dbAccessAt>0,`${path} must contain expected DB access point`);
    assert.ok(gateAt>source.indexOf('export async function POST('), `${path} must gate its POST handler`);
    assert.ok(payloadAt<0 || gateAt<payloadAt, `${path} must gate before reading student or contact input`);
    assert.ok(gateAt<dbAccessAt, `${path} must gate before database access`);
    assert.match(source.slice(gateAt,gateAt+250), /status:503/);
  }
});

test('staff authentication compares Origin with the configured canonical site origin',()=>{
  const source=load('lib/phase2-auth.ts');
  assert.match(source,/function safeOrigin\(/);
  assert.match(source,/process\.env\.APP_ORIGIN/);
  assert.match(source,/origin===new URL\(configured\)\.origin/);
  assert.doesNotMatch(source,/req\.nextUrl\.host/);
});
