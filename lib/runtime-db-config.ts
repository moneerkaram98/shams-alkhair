/** Fail-closed credential checks before creating Prisma runtime clients.
 * Connection-string validation is not a substitute for SQL GRANT/REVOKE checks.
 */
export const runtimeDbKeys = {
 men: ['DATABASE_URL_MEN','hifz_men'],
 women: ['DATABASE_URL_WOMEN','hifz_women'],
 academy: ['DATABASE_URL_ACADEMY','academy'],
 contact: ['DATABASE_URL_CONTACT','core'],
 auth: ['DATABASE_URL_AUTH','core'],
 staffMen: ['DATABASE_URL_STAFF_MEN','hifz_men'],
 staffWomen: ['DATABASE_URL_STAFF_WOMEN','hifz_women'],
 staffAcademy: ['DATABASE_URL_STAFF_ACADEMY','academy'],
} as const;

const forbiddenUsers=new Set(['postgres','root','supabase_admin','service_role']);
export function validateRuntimeDbConfig(env:Record<string,string|undefined>,production=false){
 if(production&&env.DATABASE_URL)throw new Error('Schema-owner DATABASE_URL must not be present in app runtime');
 const seen=new Map<string,string>();
 for(const [key,expectedSchema] of Object.values(runtimeDbKeys)){
  const value=env[key];
  if(!value){if(production)throw new Error(`Missing restricted database credential: ${key}`);continue;}
  let parsed:URL;
  try{parsed=new URL(value);}catch{throw new Error(`Invalid PostgreSQL URL in ${key}`);}
  if(!['postgresql:','postgres:'].includes(parsed.protocol)||!parsed.hostname||!parsed.username)
   throw new Error(`Invalid PostgreSQL credential in ${key}`);
  const username=decodeURIComponent(parsed.username).toLowerCase();
  if(forbiddenUsers.has(username))throw new Error(`Privileged database user forbidden in ${key}`);
  const previous=seen.get(username);
  if(previous)throw new Error(`Database user reused across isolated credentials: ${previous} and ${key}`);
  seen.set(username,key);
  if(parsed.searchParams.get('schema')!==expectedSchema)
   throw new Error(`Wrong PostgreSQL schema in ${key}: expected ${expectedSchema}`);
 }
}
