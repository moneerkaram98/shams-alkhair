import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('public admissions and contact are fail-closed until explicitly approved', () => {
  for (const path of ['app/api/register/route.ts','app/api/contact/route.ts','app/api/placement/book/route.ts']) {
    const source=load(path);
    const gate='process.env.SCHOOL_LIVE_READY!=="true"';
    assert.ok(source.includes(gate), `${path} must reject requests by default`);
    const gateAt=source.indexOf(gate);
    const payloadAt=source.indexOf('await req.json()');
    const dbWriteAt=path.includes('/register/')
      ? source.indexOf('await createAdmission(')
      : path.includes('/contact/')
        ? source.indexOf('await db("contact").contactInquiry.create(')
        : source.indexOf('await reservePlacement(');
    assert.ok(gateAt>source.indexOf('export async function POST('), `${path} must gate its POST handler`);
    assert.ok(payloadAt<0 || gateAt<payloadAt, `${path} must gate before reading student or contact input`);
    assert.ok(dbWriteAt<0 || gateAt<dbWriteAt, `${path} must gate before database writes`);
    assert.match(source.slice(gateAt,gateAt+250), /status:503/);
  }
});
