/** Optional API smoke. Requires a separate staging DB and seeded test accounts. No real student data. */
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
if(process.env.CONFIRM_TEST_DATABASE!=='YES'){console.error('Set CONFIRM_TEST_DATABASE=YES only for an isolated test deployment');process.exit(1)}
const guest=await fetch(base+'/api/stage6?scope=women&kind=overview');assert.equal(guest.status,401,'Anonymous access denied');
const publicResult=await fetch(base+'/api/verify-certificate?code=W_nonexistent');assert.equal(publicResult.status,200);assert.equal((await publicResult.json()).valid,false);
const post=await fetch(base+'/api/stage6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope:'women',action:'award.create',studentId:'00000000-0000-0000-0000-000000000000',points:50,reason:'test'})});assert.equal(post.status,401);
console.log('Guest access safely denied, public verifier no-match. Run logged-in E2E tests on staging before real use.');
