/** HTTP staging-preview test: must operate without ANY application DB credentials. */
import assert from 'node:assert/strict';

if (process.env.CI_TEST_ONLY !== 'YES') throw Error('Only use this script in isolated CI');
if (process.env.SCHOOL_LIVE_READY === 'true') throw Error('REFUSED: preview gate must be closed');
const domainKeys = ['DATABASE_URL','DATABASE_URL_MEN','DATABASE_URL_WOMEN',
  'DATABASE_URL_ACADEMY','DATABASE_URL_CONTACT','DATABASE_URL_AUTH',
  'DATABASE_URL_STAFF_MEN','DATABASE_URL_STAFF_WOMEN','DATABASE_URL_STAFF_ACADEMY'];
for (const key of domainKeys) if (process.env[key])
  throw Error(`REFUSED: ${key} must be absent for disconnected preview test`);
const origin = process.env.APP_ORIGIN;
assert.equal(origin,'http://127.0.0.1:3000','Use loopback only; never probe a real school site');

async function fetchWithTimeout(path, options = {}) {
  const response = await fetch(origin + path,{...options, signal: AbortSignal.timeout(15000)});
  return response;
}

for(const path of ['/','/register','/contact','/placement']){
  const response = await fetchWithTimeout(path);
  assert.equal(response.status,200,`${path} should render during staging`);
  const html = await response.text();
  if(path === '/') assert.match(html,/شمس الخير|رحلة النور/);
  else assert.match(html,/الخدمة قيد التجهيز/,`${path} must not solicit live personal data`);
}

const ready = await fetchWithTimeout('/api/health');
assert.equal(ready.status,503,'No application DB must return unavailable health');
assert.equal((await ready.json()).status,'unavailable');

for(const path of ['/api/register','/api/contact','/api/placement/book','/api/placement/slots','/api/application/status','/api/auth/login']){
  for(const body of ['{invalid-json','{}']){
    const response=await fetchWithTimeout(path,{
      method:'POST',
      headers:{Origin:origin,'Content-Type':'application/json'},
      body
    });
    assert.equal(response.status,503,`${path} accepted input while school is not live`);
    assert.match(response.headers.get('cache-control')||'',/no-store/i);
    const payload=await response.json();
    assert.equal(typeof payload.error,'string');
    assert.equal(payload.ok,undefined);
  }
}
console.log('PASS: no-DB preview pages render; health=503; all public admission lookups, booking, contact and login fail closed (503/no-store).');
