import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('audit trigger uses valid PostgreSQL dollar quoting', () => {
  const sql=readFileSync(new URL('../db/constraints-stage2.sql',import.meta.url),'utf8');
  assert.match(sql,/CREATE OR REPLACE FUNCTION core\.shams_reject_audit_mutation\(\)[\s\S]*? AS \$\$\s*BEGIN[\s\S]*?END; \$\$;/);
});
