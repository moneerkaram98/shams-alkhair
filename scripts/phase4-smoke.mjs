/** Non-destructive unauthenticated smoke checks. No child recordings are uploaded. */
import assert from 'node:assert/strict';
const base=process.env.SMOKE_URL||'http://localhost:3000';
async function request(path,method='GET',body){const r=await fetch(base+path,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});return r;}
for(const path of ['/api/recitation/attempts?scope=men&studentId=00000000-0000-4000-8000-000000000000','/api/recitation/passage?scope=men&studentId=00000000-0000-4000-8000-000000000000&surahNumber=1&ayahFrom=1&ayahTo=3','/api/recitation/audio?scope=women&id=00000000-0000-4000-8000-000000000000']){
 const r=await request(path);assert.equal(r.status,401,`${path} expected 401, got ${r.status}`);console.log(`${r.status} ${path}`);
}
const worker=await request('/api/recitation/process','POST');assert.equal(worker.status,401);console.log('401 worker without secret');
console.log('Phase 4 unauthenticated smoke checks passed. This is NOT a DB/ASR integration test.');
