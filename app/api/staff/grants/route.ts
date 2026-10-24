import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {getIdentity,privateJson,fail,safeOrigin,rolesFor} from "@/lib/phase2-auth";
const schema=z.object({action:z.enum(["request","approve","revoke"]),grantId:z.string().uuid().optional(),purpose:z.string().trim().min(12).max(500).optional()});
export async function GET(req:NextRequest){const a=await getIdentity(req);if(!a)return fail(401);const admin=rolesFor(a,"SCHOOL","SUPER_ADMIN"),supervisor=rolesFor(a,"HIFZ_WOMEN","SUPERVISOR");if(!admin&&!supervisor)return fail();const entries=await db("auth").sensitiveAccessGrant.findMany({where:{scope:{code:"HIFZ_WOMEN"},...(admin&&!supervisor?{requesterId:a.id}:{})},select:{id:true,requesterId:true,approverId:true,purpose:true,requestedAt:true,approvedAt:true,expiresAt:true,revokedAt:true},orderBy:{requestedAt:"desc"},take:60});return privateJson({entries});}
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();const a=await getIdentity(req);if(!a)return fail(401);
 let parsed;try{parsed=schema.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400);
 const v=parsed.data, admin=rolesFor(a,"SCHOOL","SUPER_ADMIN"), supervisor=rolesFor(a,"HIFZ_WOMEN","SUPERVISOR");
 if(v.action==="request"){
  if(!admin||!v.purpose)return fail();const scope=await db("auth").accessScope.findUnique({where:{code:"HIFZ_WOMEN"}});if(!scope)return fail(500,"يجب إعداد نطاق النساء أولًا");
  const entry=await db("auth").$transaction(async tx=>{const grant=await tx.sensitiveAccessGrant.create({data:{requesterId:a.id,scopeId:scope.id,purpose:v.purpose}});await tx.auditEvent.create({data:{actorId:a.id,scopeCode:"HIFZ_WOMEN",action:"SENSITIVE_ACCESS_REQUEST",subjectType:"SENSITIVE_ACCESS_GRANT",subjectId:grant.id,reason:v.purpose},select:{id:true}});return grant;});return privateJson({id:entry.id,status:"PENDING"},201);
 }
 if(!v.grantId)return fail(400);const grant=await db("auth").sensitiveAccessGrant.findUnique({where:{id:v.grantId},include:{scope:true}});if(!grant||grant.scope.code!=="HIFZ_WOMEN")return fail(404);
 if(v.action==="approve"){
  if(!supervisor || grant.requesterId===a.id || grant.approvedAt || grant.revokedAt)return fail();
  const result=await db("auth").$transaction(async tx=>{const change=await tx.sensitiveAccessGrant.updateMany({where:{id:grant.id,approvedAt:null,revokedAt:null},data:{approverId:a.id,approvedAt:new Date(),expiresAt:new Date(Date.now()+2*60*60*1000)}});if(change.count===1)await tx.auditEvent.create({data:{actorId:a.id,scopeCode:"HIFZ_WOMEN",action:"SENSITIVE_ACCESS_APPROVE",subjectType:"SENSITIVE_ACCESS_GRANT",subjectId:grant.id},select:{id:true}});return change;});
  return result.count===1?privateJson({status:"APPROVED",durationMinutes:120}):fail(409);
 }
 if(grant.requesterId!==a.id&&!supervisor)return fail();await db("auth").$transaction(async tx=>{await tx.sensitiveAccessGrant.update({where:{id:grant.id},data:{revokedAt:new Date()}});await tx.auditEvent.create({data:{actorId:a.id,scopeCode:"HIFZ_WOMEN",action:"SENSITIVE_ACCESS_REVOKE",subjectType:"SENSITIVE_ACCESS_GRANT",subjectId:grant.id},select:{id:true}});});return privateJson({status:"REVOKED"});
}
