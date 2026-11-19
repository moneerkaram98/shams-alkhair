import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

// Parse-only: does not run bootstrap scripts or touch any database.
const dir=fileURLToPath(new URL('../scripts/',import.meta.url));
for(const filename of readdirSync(dir).filter(name=>name.endsWith('.mjs')).sort()){
  test(`CLI parses without a syntax error: ${filename}`,()=>{
    const result=spawnSync(process.execPath,['--check',join(dir,filename)],{encoding:'utf8',timeout:10000});
    assert.equal(result.status,0,result.stderr||result.error?.message||'node --check failed');
  });
}
