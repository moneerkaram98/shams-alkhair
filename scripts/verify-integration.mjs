#!/usr/bin/env node
/** Offline-safe preflight. Does not connect to a real school DB or print credentials. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=path.resolve(import.meta.dirname,'..');
const strict=process.argv.includes('--strict');
const status=[];
const check=(name,success,detail)=>{status.push({name,success,detail});console.log(`${success?'PASS':'BLOCK'} ${name}${detail?': '+detail:''}`);};
const exists=p=>fs.existsSync(path.join(root,p));
const expected=['prisma/schema.prisma','db/roles-stage2.sql','db/roles-stage6.sql','db/constraints-stage6.sql',
'lib/manual-payment.mjs','app/api/stage6/route.ts','app/api/health/route.ts','scripts/phase6-smoke.mjs'];
check('Repository files',expected.every(exists),`${expected.filter(x=>!exists(x)).join(', ')||'present'}`);
const schema=fs.readFileSync(path.join(root,'prisma/schema.prisma'),'utf8');
const sql=fs.readFileSync(path.join(root,'db/roles-stage6.sql'),'utf8');
const scopeNames=['Men','Women','Academy'];
const idempotent=scopeNames.every(x=>new RegExp(`model ${x}Payment \\{[\\s\\S]*?idempotencyKey String @unique @db.Uuid[\\s\\S]*?\\}`).test(schema));
check('Idempotency in all three isolated payment models',idempotent);
check('No database UPDATE privilege on recorded payments',sql.includes("IF t = 'Payment' THEN EXECUTE format('REVOKE UPDATE,DELETE"));
const route=fs.readFileSync(path.join(root,'app/api/stage6/route.ts'),'utf8');
check('Serializable payment transaction and transactional audits',route.includes('isolationLevel:"Serializable"')&&route.includes('recordManualPaymentWithinTransaction')&&route.includes('function auditedInsert'));
let ts;try{ts=require('typescript');}catch{try{ts=require(path.join(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript'));}catch{ts=null;}}
if(ts){
 const target=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.next','.git'].includes(e.name))continue;const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(/\.tsx?$/.test(e.name))target.push(full);}}
 for(const area of ['app','components','lib','prisma','scripts'])if(exists(area))walk(path.join(root,area));
 let bad=0;for(const p of target){const source=ts.createSourceFile(p,fs.readFileSync(p,'utf8'),ts.ScriptTarget.Latest,true,p.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);for(const diagnostic of source.parseDiagnostics){bad++;if(bad<=10)console.log(`  ${path.relative(root,p)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')}`)}}
 check('TypeScript/TSX syntax parse',bad===0,`${target.length} files examined; ${bad} syntax errors (not semantic typecheck)`);
}else check('TypeScript parser available',false,'npm install required');
let env={...process.env};const envFile=path.join(root,'.env.runtime');
if(fs.existsSync(envFile))for(const line of fs.readFileSync(envFile,'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!env[m[1]])env[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'');}
const required=['DATABASE_URL_MEN','DATABASE_URL_WOMEN','DATABASE_URL_ACADEMY','DATABASE_URL_CONTACT','DATABASE_URL_AUTH','DATABASE_URL_STAFF_MEN','DATABASE_URL_STAFF_WOMEN','DATABASE_URL_STAFF_ACADEMY','APP_ORIGIN'];
const missing=required.filter(k=>!env[k]||/(REPLACE|CHANGE_ME|example\.org|db-host)/i.test(env[k]));
check('Runtime configuration',missing.length===0,missing.length?`missing/unconfigured variable names: ${missing.join(', ')}`:'configured');
check('Node dependencies',exists('node_modules/@prisma/client')&&exists('node_modules/next'));
const cleanOwner=(!env.DATABASE_URL || !process.env.NODE_ENV || process.env.NODE_ENV!=='production');
check('Schema-owner secret excluded from production runtime',cleanOwner,cleanOwner?'not observed as a production runtime variable':'DATABASE_URL must NOT be deployed');
if(strict&&status.some(x=>!x.success)){console.error('BLOCKED: integration cannot be approved yet');process.exitCode=1;}
else if(!strict)console.log('This is an offline inspection, not a Prisma migration, database security test or Next.js build.');
