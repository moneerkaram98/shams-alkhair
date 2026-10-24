#!/usr/bin/env node
/** Publish gate for a school handling children's data.
 * Scans the tree or a supplied release directory; no network, no secrets printed.
 * Do not treat this as a complete security audit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const exclusions=new Set(['.git','node_modules','.next','coverage','dist','.cache','__pycache__','.venv']);
const allowEnv=new Set(['.env.example','.env.runtime.example']);
const allowExtensions=new Set(['.md','.json','.yml','.yaml','.js','.mjs','.cjs','.ts','.tsx','.css','.sql','.sh','.py','.txt','.prisma','.html','.xml','.toml']);
const sensitiveExtension=/\.(?:pem|key|p12|pfx|jks|keystore|sqlite|sqlite3|db|mp3|m4a|wav|aac|ogg|mp4|mov|avi|webm)$/i;
const secrets=[
  /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
  /(?:postgres(?:ql)?:\/\/)[^\s'"<>]*:[^\s'"<>]*@/g,
  /(?:ghp_|github_pat_|gho_|ghu_|ghs_)[a-zA-Z0-9_]{20,}/g,
  /(?:sk_live_|rk_live_|whsec_)[a-zA-Z0-9]{12,}/g,
];
const issue=[];
let scanned=0;
function walk(dir){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(exclusions.has(e.name))continue;
  const absolute=path.join(dir,e.name),relative=path.relative(root,absolute).replaceAll('\\','/');
  if(e.isSymbolicLink()){issue.push(`Symbolic link cannot ship: ${relative}`);continue;}
  if(e.isDirectory()){walk(absolute);continue;}
  if(!e.isFile())continue;
  if(/^\.env(?:\.|$)/.test(e.name) && !allowEnv.has(e.name)){
   issue.push(`Runtime environment file must not ship: ${relative}`);continue;
  }
  if(sensitiveExtension.test(e.name)){
   issue.push(`Private data/credential file must not ship: ${relative}`);continue;
  }
  if(/(?:^|\/)(?:uploads|recordings|backups|private-data|storage)(?:\/|$)/i.test(relative)){
   issue.push(`Private runtime data directory must not ship: ${relative}`);continue;
  }
  if(/\.log$/i.test(e.name)){
   issue.push(`Build/runtime log must not ship: ${relative}`);continue;
  }
  const info=fs.statSync(absolute);
  if(info.size>10*1024*1024){issue.push(`Review unusually large file: ${relative}`);continue;}
  if(!allowExtensions.has(path.extname(e.name)))continue;
  scanned++;
  const str=fs.readFileSync(absolute,'utf8');
  for(const regex of secrets){regex.lastIndex=0;if(regex.test(str)){
    // Both CI synthetic credentials and URL templates are allowed in templates only.
    if(regex.source.includes('postgres') && (relative.endsWith('.example')||relative==='scripts/ci-postgres-integration.sh'))continue;
    issue.push(`Potential embedded secret in ${relative}`);break;
  }}
 }
}
if(!fs.existsSync(root)){console.error('Release directory not found');process.exit(2);}
walk(root);
if(issue.length){console.error(`RELEASE BLOCKED (${issue.length} finding(s)):`);for(const i of issue)console.error(` - ${i}`);process.exitCode=1;}
else console.log(`PASS: source release scan (${scanned} text files); no forbidden private files or matching credential patterns.`);
