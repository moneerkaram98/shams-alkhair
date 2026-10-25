import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Scope,scopes } from "@/lib/phase2-constants";
export const COOKIE="shams_session";
const ONE_WEEK=7*24*60*60*1000;
export const hashToken=(token:string)=>createHash("sha256").update(token).digest("hex");
export const newToken=()=>randomBytes(32).toString("base64url");
export function hashPassword(password:string):string{const salt=randomBytes(16).toString("hex");return `scrypt$${salt}$${scryptSync(password,salt,64).toString("hex")}`;}
export function verifyPassword(password:string,encoded:string|null):boolean{
 if(!encoded || !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded))return false;
 const parts=encoded.split("$");const old=Buffer.from(parts[2],"hex"),candidate=scryptSync(password,parts[1],64);
 return timingSafeEqual(Uint8Array.from(old),Uint8Array.from(candidate));
}
export async function createSession(userId:string){
 const token=newToken(), expiresAt=new Date(Date.now()+ONE_WEEK);
 await db("auth").authSession.create({data:{userId,tokenHash:hashToken(token),expiresAt}});
 return {token,expiresAt};
}
export function applySessionCookie(res:NextResponse,token:string,expiresAt:Date){res.cookies.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires:expiresAt});}
export type Identity={id:string;name:string;email:string;roles:Array<{role:string;code:string}>};
export async function getIdentity(req:NextRequest):Promise<Identity|null>{
 const cookie=req.cookies.get(COOKIE)?.value;if(!cookie || cookie.length>100)return null;
 const s=await db("auth").authSession.findUnique({where:{tokenHash:hashToken(cookie)},select:{revokedAt:true,expiresAt:true,user:{select:{id:true,email:true,displayName:true,isActive:true,roles:{where:{active:true},select:{role:true,validFrom:true,validTo:true,scope:{select:{code:true}}}}}}}});
 if(!s || s.revokedAt || s.expiresAt<=new Date() || !s.user.isActive)return null;
 const now=new Date();return {id:s.user.id,name:s.user.displayName,email:s.user.email,roles:s.user.roles.filter(r=>r.validFrom<=now&&(!r.validTo||r.validTo>now)).map(r=>({role:r.role,code:r.scope.code}))};
}
export async function hasWomenGrant(actor:Identity){
 const grant=await db("auth").sensitiveAccessGrant.findFirst({where:{requesterId:actor.id,scope:{code:"HIFZ_WOMEN"},approvedAt:{not:null},expiresAt:{gt:new Date()},revokedAt:null,approverId:{not:actor.id}}});return Boolean(grant);
}
export function rolesFor(actor:Identity,code:string,role:string){return actor.roles.some(r=>r.role===role && r.code===code);}
export async function canAccess(actor:Identity,scope:Scope,operation:"read"|"manage"|"mark"|"supervise"){
 const code=scopes[scope].code;
 const admin=rolesFor(actor,"SCHOOL","SUPER_ADMIN");
 if(admin && (scope!=="women" || await hasWomenGrant(actor)))return true;
 if(operation==="read")return actor.roles.some(r=>r.code===code&&["SUPERVISOR","RECEPTION","TEACHER"].includes(r.role));
 if(operation==="mark")return actor.roles.some(r=>r.code===code&&["SUPERVISOR","RECEPTION","TEACHER"].includes(r.role));
 return actor.roles.some(r=>r.code===code&&["SUPERVISOR","RECEPTION"].includes(r.role));
}
export async function canTeachGroup(actor:Identity,scope:Scope,groupId:string){
 if(!rolesFor(actor,scopes[scope].code,"TEACHER"))return false;
 const d=db(scopes[scope].client) as any;return Boolean(await d[`${scopes[scope].prefix}TeacherAssignment`].findFirst({where:{userId:actor.id,groupId,active:true},select:{id:true}}));
}
export function fail(status=403,message="غير مصرح بهذا الإجراء"){return NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});}
export function privateJson(payload:unknown,status=200){return NextResponse.json(payload,{status,headers:{"Cache-Control":"no-store"}});}
export function safeOrigin(req:NextRequest){const origin=req.headers.get("origin");if(!origin)return true;try{return new URL(origin).host===req.nextUrl.host;}catch{return false;}}
export async function auditRead(scope:Scope,actor:Identity,subjectType:string,subjectId:string|null){
 if(scope!=="women")return;
 await db(scopes[scope].client).auditEvent.create({data:{actorId:actor.id,scopeCode:"HIFZ_WOMEN",action:"SENSITIVE_READ",subjectType,subjectId,reason:"authorized section access"},select:{id:true}});
}
