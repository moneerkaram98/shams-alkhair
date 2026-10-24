import "server-only";
import {NextRequest} from "next/server";
import {randomBytes} from "node:crypto";
import {scopeSchema,staffStudentAccess,familyAccess} from "@/lib/phase3";
import {getIdentity,canAccess,rolesFor,fail,Identity,auditRead} from "@/lib/phase2-auth";
import {Scope,scopes,isScope} from "@/lib/phase2-constants";
import {scoped} from "@/lib/phase2-data";
export const codeFor=(scope:Scope)=>({men:"M",women:"W",academy:"A"})[scope];
export const randomRef=(prefix:string)=>`${prefix}-${randomBytes(12).toString("hex").toUpperCase()}`;
export const randomVerify=(scope:Scope)=>`${codeFor(scope)}_${randomBytes(24).toString("base64url")}`;
export function models(scope:Scope){const d=scoped(scope),prefix=scopes[scope].prefix;return {...d,invoice:(d.client as any)[`${prefix}Invoice`],payment:(d.client as any)[`${prefix}Payment`],cert:(d.client as any)[`${prefix}Certificate`],sanad:(d.client as any)[`${prefix}SanadEntry`],exam:(d.client as any)[`${prefix}Exam`],review:(d.client as any)[`${prefix}ReviewTask`],award:(d.client as any)[`${prefix}Award`],schedule:(d.client as any)[`${prefix}WeeklySchedule`]};}
export async function viewAccess(actor:Identity,scope:Scope,studentId:string){
 if(await familyAccess(actor,scope,studentId))return true;
 return staffStudentAccess(actor,scope,studentId,undefined,"read");
}
export async function privileged(actor:Identity,scope:Scope,role:"FINANCE"|"SUPERVISOR"){
 if(!await canAccess(actor,scope,"manage"))return false;
 const code=scopes[scope].code;
 if(rolesFor(actor,"SCHOOL","SUPER_ADMIN"))return true;
 return role==="FINANCE"?rolesFor(actor,code,"SUPERVISOR")||rolesFor(actor,code,"RECEPTION"):rolesFor(actor,code,"SUPERVISOR");
}
export async function loggedRead(scope:Scope,actor:Identity,entity:string,id:string){await auditRead(scope,actor,entity,id);}
export async function validScopeActor(req:NextRequest,scopeValue:unknown){
 if(!isScope(scopeValue))return fail(400,"نطاق غير صحيح");
 const actor=await getIdentity(req);if(!actor)return fail(401);
 return {actor,scope:scopeValue};
}
export function isError(r:unknown):r is Response{return r instanceof Response;}
