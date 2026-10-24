import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript');}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');}
const file=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../lib/runtime-db-config.ts');
const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
vm.runInNewContext('(function(module,exports){'+js+'\n})',{URL})(mod,mod.exports);
const {runtimeDbKeys,validateRuntimeDbConfig}=mod.exports;
function env(){const out={};let i=0;for(const [key,schema] of Object.values(runtimeDbKeys))out[key]='postgresql://restricted_'+(++i)+':safe_dev_pass' + `@127.0.0.1:5432/shams_alkhair_test?schema=${schema}`;return out;}
test('eight distinct section-scoped credentials are accepted',()=>{assert.doesNotThrow(()=>validateRuntimeDbConfig(env(),true));});
test('shared men/women database user is rejected',()=>{const e=env();e.DATABASE_URL_WOMEN=e.DATABASE_URL_MEN.replace('schema=hifz_men','schema=hifz_women');assert.throws(()=>validateRuntimeDbConfig(e,true),/reused/);});
test('scope mismatch is rejected',()=>{const e=env();e.DATABASE_URL_WOMEN=e.DATABASE_URL_WOMEN.replace('schema=hifz_women','schema=core');assert.throws(()=>validateRuntimeDbConfig(e,true),/Wrong PostgreSQL schema/);});
test('schema owner credential forbidden in app runtime',()=>{const e=env();e.DATABASE_URL='postgresql://postgres:owner'+'@127.0.0.1:5432/shams_alkhair_test';assert.throws(()=>validateRuntimeDbConfig(e,true),/Schema-owner/);});
test('app runtime cannot use postgres superuser',()=>{const e=env();e.DATABASE_URL_AUTH=e.DATABASE_URL_AUTH.replace('restricted_5','postgres');assert.throws(()=>validateRuntimeDbConfig(e,true),/Privileged/);});
test('missing isolated roles fail closed in production',()=>{const e=env();delete e.DATABASE_URL_STAFF_WOMEN;assert.throws(()=>validateRuntimeDbConfig(e,true),/Missing restricted/);});
