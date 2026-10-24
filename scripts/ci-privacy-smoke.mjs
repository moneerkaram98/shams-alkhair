/** Synthetic-only HTTP authorization checks. Requires demo staff accounts and a throwaway DB. */
import assert from 'node:assert/strict';
if(process.env.CI_TEST_ONLY!=='YES'||process.env.NODE_ENV==='production')
 throw Error('Privacy smoke is allowed only with CI_TEST_ONLY=YES on a disposable environment');
const base=process.env.APP_ORIGIN||'http://127.0.0.1:3000';
const credentials={
 admin:['ci.admin@example.com','OnlyForDisposableCI_2026_Extra'],
 women:['ci.women@example.com','DisposableWomenCI_2026_Extra'],
 men:['ci.men@example.com','DisposableMenCI_2026_Extra'],
};
async function post(path,data,cookie){
 const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data)});
 return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
async function get(path,cookie){
 const response=await fetch(base+path,{headers:{Cookie:cookie}});
 return {status:response.status,body:await response.json()};
}
async function login([email,password]){
 const result=await post('/api/auth/login',{email,password});
 assert.equal(result.status,200,`Could not log in synthetic ${email}: ${JSON.stringify(result.body)}`);
 assert.ok(result.cookie,'Missing session cookie');
 return result.cookie;
}
const [admin,women,men]=await Promise.all([login(credentials.admin),login(credentials.women),login(credentials.men)]);
const pathWomen='/api/staff/students?scope=women';
const pathMen='/api/staff/students?scope=men';
assert.equal((await get(pathWomen,men)).status,403,'Male supervisor must not read women students');
assert.equal((await get(pathMen,women)).status,403,'Female supervisor must not read men students');
assert.equal((await get(pathWomen,admin)).status,403,'Superadmin must not read women students before grant');
assert.equal((await get(pathWomen,women)).status,200,'Female supervisor must read own women section');
const request=await post('/api/staff/grants',{action:'request',purpose:'CI test for limited, audited, temporary women access'},admin);
assert.equal(request.status,201,`Grant request failed: ${JSON.stringify(request.body)}`);
assert.ok(request.body.id);
const approve=await post('/api/staff/grants',{action:'approve',grantId:request.body.id},women);
assert.equal(approve.status,200,`Grant approval failed: ${JSON.stringify(approve.body)}`);
assert.equal((await get(pathWomen,admin)).status,200,'Approved admin grant must work');
const revoke=await post('/api/staff/grants',{action:'revoke',grantId:request.body.id},women);
assert.equal(revoke.status,200,`Grant revoke failed: ${JSON.stringify(revoke.body)}`);
assert.equal((await get(pathWomen,admin)).status,403,'Revoked women grant must block access immediately');
console.log('PASS: women/men scope isolation; admin without grant denied; supervisor approval; grant revoked immediately.');
