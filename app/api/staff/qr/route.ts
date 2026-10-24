import {NextRequest} from "next/server";
import {z} from "zod";
import {newToken,hashToken,fail,privateJson,safeOrigin} from "@/lib/phase2-auth";
import {guard,isGuardError,scoped} from "@/lib/phase2-data";
import {scopes} from "@/lib/phase2-constants";
const input=z.object({scope:z.enum(["men","women","academy"]),studentIds:z.array(z.string().uuid()).min(1).max(40)});
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();let parsed;try{parsed=input.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400);
 const v=parsed.data,g=await guard(req,v.scope,"manage");if(isGuardError(g))return g;
 const ids=[...new Set(v.studentIds)];if(ids.length!==v.studentIds.length)return fail(400,"تكرار معرفات الطلاب");
 const d=scoped(v.scope),students=await d.students.findMany({where:{id:{in:ids},active:true},select:{id:true,fullName:true}});if(students.length!==ids.length)return fail(404,"طالب غير موجود في النطاق");
 const cards=students.map((s:any)=>({...s,token:newToken()}));
 await d.client.$transaction(async(tx:any)=>{
  await tx[`${scopes[v.scope].prefix}QrCredential`].updateMany({where:{studentId:{in:ids},revokedAt:null},data:{revokedAt:new Date()}});
  for(const card of cards){await tx[`${scopes[v.scope].prefix}QrCredential`].create({data:{studentId:card.id,tokenHash:hashToken(card.token)}});await tx.auditEvent.create({data:{actorId:g.actor.id,action:"QR_ISSUE",scopeCode:scopes[v.scope].code,subjectType:"STUDENT",subjectId:card.id},select:{id:true}});}
 });
 // The raw token is returned one time only. Never store it in clear text or logs.
 return privateJson({cards:cards.map(c=>({id:c.id,name:c.fullName,token:c.token}))},201);
}
