import {NextRequest} from "next/server";
import {z} from "zod";
import {guard,isGuardError,scoped} from "@/lib/phase2-data";
import {fail,privateJson,safeOrigin} from "@/lib/phase2-auth";
import {scopes} from "@/lib/phase2-constants";
const schema=z.object({scope:z.enum(["men","women","academy"]),sessionId:z.string().uuid()});
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();let parsed;try{parsed=schema.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400);
 const v=parsed.data,d=scoped(v.scope);const session=await d.sessions.findUnique({where:{id:v.sessionId}});if(!session)return fail(404);
 const g=await guard(req,v.scope,"mark",session.groupId);if(isGuardError(g))return g;
 if(session.endsAt>new Date())return fail(409,"لا يمكن إنهاء الحصة قبل موعد انتهائها");
 try{const result=await d.client.$transaction(async(tx:any)=>{
   const current=await tx[`${scopes[v.scope].prefix}LessonSession`].findUnique({where:{id:v.sessionId}});
   if(!current||current.status==="CLOSED")throw new Error("CLOSED");
   const enroll=await tx[`${scopes[v.scope].prefix}Enrollment`].findMany({where:{groupId:session.groupId,active:true},select:{studentId:true}});
   const marked=await tx[`${scopes[v.scope].prefix}Attendance`].findMany({where:{sessionId:v.sessionId},select:{studentId:true}});
   const done=new Set(marked.map((x:any)=>x.studentId));const missing=enroll.filter((e:any)=>!done.has(e.studentId));
   for(const e of missing){await tx[`${scopes[v.scope].prefix}Attendance`].create({data:{studentId:e.studentId,sessionId:v.sessionId,status:"ABSENT",recordedBy:g.actor.id,reason:"غياب تلقائي عند إغلاق الحصة"}});}
   await tx[`${scopes[v.scope].prefix}LessonSession`].update({where:{id:v.sessionId},data:{status:"CLOSED"}});
   await tx.auditEvent.create({data:{actorId:g.actor.id,scopeCode:scopes[v.scope].code,action:"SESSION_CLOSE",subjectType:"LESSON_SESSION",subjectId:v.sessionId,metadata:{autoAbsent:missing.length}},select:{id:true}});
   return {autoAbsent:missing.length};
 },{isolationLevel:"Serializable"});return privateJson(result);
 }catch{return fail(409,"الحصة مغلقة أو حدث تعديل متزامن؛ أعد المحاولة");}
}
