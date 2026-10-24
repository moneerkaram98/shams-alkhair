import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const require=createRequire(import.meta.url);
let ts;
try {ts=require('typescript');}
catch {ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');}
const source=readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../app/api/auth/login/route.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;

/** Runs the actual login route with an in-memory serialized Prisma transaction double.
 * This is a unit/concurrency check, NOT proof of PostgreSQL transaction behavior.
 */
function fixture(){
 const state={user:{id:'user-1',isActive:true,passwordHash:'correct-pass',lockedUntil:null,failedLogins:0},sessions:[]};
 let queue=Promise.resolve();
 const tx={
  $queryRaw:async()=>[],
  appUser:{
   findUnique:async()=>({...state.user}),
   update:async({data})=>{Object.assign(state.user,data);return {...state.user};}
  },
  authSession:{create:async({data})=>{state.sessions.push({...data});return data;}}
 };
 const db={ $transaction:async fn=>{
   let release;const turn=new Promise(resolve=>{release=resolve;});
   const previous=queue;queue=turn;
   await previous;
   try{return await fn(tx);}finally{release();}
 }};
 let tokenCount=0;
 const zString={email(){return this;},max(){return this;},min(){return this;}};
 const z={string:()=>({...zString}),object:()=>({safeParse(data){return {success:typeof data.email==='string'&&typeof data.password==='string',data};}})};
 const mockRequire=name=>{
  if(name==='next/server')return {NextResponse:{json:(body,{status}={})=>({body,status:status??200,headers:{set(){}},cookies:{set(){}}})}};
  if(name==='zod')return {z};
  if(name==='@/lib/db')return {db:()=>db};
  if(name==='@/lib/phase2-auth')return {
   hashPassword:s=>'HASH:'+s,
   verifyPassword:(candidate,encoded)=>candidate===encoded,
   newToken:()=>`token-${++tokenCount}`,
   hashToken:s=>`hash:${s}`,
   applySessionCookie:(res,token)=>{res.cookie=token;},
   safeOrigin:()=>true,
   fail:(status,msg)=>({status,body:{error:msg}})
  };
  throw Error('Unexpected module '+name);
 };
 const exports={};
 const module={exports};
 const wrapper=vm.runInNewContext('(function(require,module,exports){'+compiled+'\n})',{}, {timeout:1000});
 wrapper(mockRequire,module,exports);
 const req=password=>({headers:{get:()=> 'application/json'},json:async()=>({email:'ADMIN@SCHOOL.COM',password})});
 return {state,post:pass=>module.exports.POST(req(pass))};
}

test('six simultaneous bad passwords lock the account consistently across transactions',async()=>{
 const f=fixture();
 const attempts=await Promise.all(Array.from({length:8},()=>f.post('wrong-password')));
 assert.equal(attempts.filter(x=>x.status===401).length,8);
 assert.equal(f.state.user.failedLogins,0);
 assert.ok(f.state.user.lockedUntil>new Date());
 assert.equal(f.state.sessions.length,0);
});

test('lockout rejects even correct password until expiry and then issues one session',async()=>{
 const f=fixture();
 f.state.user.lockedUntil=new Date(Date.now()+120000);
 assert.equal((await f.post('correct-pass')).status,401);
 f.state.user.lockedUntil=new Date(Date.now()-1000);
 const result=await f.post('correct-pass');
 assert.equal(result.status,200);
 assert.equal(result.cookie,'token-1');
 assert.equal(f.state.sessions.length,1);
 assert.equal(f.state.user.failedLogins,0);
});

test('failed attempts clear after valid login',async()=>{
 const f=fixture();
 await Promise.all([f.post('wrong-password'),f.post('wrong-password')]);
 assert.equal(f.state.user.failedLogins,2);
 await f.post('correct-pass');
 assert.equal(f.state.user.failedLogins,0);
 assert.equal(f.state.sessions.length,1);
});
