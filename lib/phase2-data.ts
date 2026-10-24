import "server-only";
import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {Scope,scopes,isScope} from "@/lib/phase2-constants";
import {getIdentity,Identity,canAccess,canTeachGroup,fail,rolesFor,auditRead} from "@/lib/phase2-auth";
/** Domain delegates are resolved only after validating the scope and the authenticated role. */
export function scoped(scope:Scope){
 const cfg=scopes[scope],client=db(cfg.client) as any,prefix=cfg.prefix;
 return {client,students:client[`${prefix}Student`],guardians:client[`${prefix}GuardianLink`],groups:client[`${prefix}ClassGroup`],enrollments:client[`${prefix}Enrollment`],teachers:client[`${prefix}TeacherAssignment`],sessions:client[`${prefix}LessonSession`],attendance:client[`${prefix}Attendance`],credentials:client[`${prefix}QrCredential`],applications:client[`${prefix}Application`]};
}
export async function guard(req:NextRequest,scopeValue:unknown,operation:"read"|"manage"|"mark"|"supervise",groupId?:string):Promise<{actor:Identity,scope:Scope}|ReturnType<typeof fail>>{
 if(!isScope(scopeValue))return fail(400,"نطاق غير صحيح");
 const actor=await getIdentity(req);if(!actor)return fail(401,"يلزم تسجيل الدخول");
 if(!await canAccess(actor,scopeValue,operation))return fail();
 if(rolesFor(actor,scopes[scopeValue].code,"TEACHER")&&!actor.roles.some(r=>["SUPERVISOR","RECEPTION"].includes(r.role)&&r.code===scopes[scopeValue].code)&&!rolesFor(actor,"SCHOOL","SUPER_ADMIN")){
  if(!groupId || !await canTeachGroup(actor,scopeValue,groupId))return fail(403,"المعلم مخوّل بحلقاته فقط");
 }
 return {actor,scope:scopeValue};
}
export function isGuardError(v:unknown):v is ReturnType<typeof fail>{return v instanceof Response;}
export async function checkWomenRead(scope:Scope,actor:Identity,type:string,id:string|null){await auditRead(scope,actor,type,id);}
