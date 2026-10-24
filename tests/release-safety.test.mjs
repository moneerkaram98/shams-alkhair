import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const cmd=path.resolve('scripts/release-safety.mjs');
function fixture(entries){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shams-release-test-'));
 for(const [file,content] of Object.entries(entries)){
  const full=path.join(dir,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,content);
 }
 const out=spawnSync(process.execPath,[cmd,dir],{encoding:'utf8'});
 fs.rmSync(dir,{recursive:true,force:true});return out;
}
test('safe source code and sample environment files can ship',()=>{
 const run=fixture({'README.md':'Demo only','.env.example':'DATABASE_URL=replace-me','src/app.ts':'export const x=1;'});
 assert.equal(run.status,0,run.stderr);
});
test('production env files cannot ship even when named .env.production',()=>{
 const run=fixture({'.env.production':'TOKEN=some-secret'});
 assert.equal(run.status,1);assert.match(run.stderr,/Runtime environment file/);
});
test('private recordings and backups cannot ship',()=>{
 const run=fixture({'uploads/audio.wav':'x','backups/pgdump.txt':'x'});
 assert.equal(run.status,1);assert.match(run.stderr,/Private/);
});
test('embedded private-key and live payment token are blocked',()=>{
 const run=fixture({'config.js':'const x="'+'-----BEGIN '+'PRIVATE KEY-----'+'"','pay.js':'const key="'+'sk_live_'+'1234567890abcdef'+'"'});
 assert.equal(run.status,1);assert.match(run.stderr,/Potential embedded secret/);
});
