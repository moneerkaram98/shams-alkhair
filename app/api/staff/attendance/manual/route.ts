import {NextRequest} from "next/server";
import {z} from "zod";
import {guard,isGuardError,scoped} from "@/lib/phase2-data";
import {fail,privateJson,safeOrigin,getIdentity,canAccess} from "@/lib/phase2-auth";
import {scopes,attendanceStatuses} from "@/lib/phase2-constants";
const input=z.object({scope:z.enum(["men","women","academy"]),sessionId:z.string().uuid(),studentId:z.string().uuid(),status:z.enum(attendanceStatuses),reason:z.string().trim().min(6).max(250)});
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();let parsed;try{parsed=input.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400);const v=parsed.data,requester=await getIdentity(req);if(!requester)return fail(401);if(!await canAccess(requester,v.scope,"mark"))return fail();const d=scoped(v.scope);
 const session=await d.sessions.findUnique({where:{id:v.sessionId}});if(!session)return fail(404);const g=await guard(req,v.scope,"mark",session.groupId);if(isGuardError(g))return g;
 const enrollment=await d.enrollments.findUnique({where:{studentId_groupId:{studentId:v.studentId,groupId:session.groupId}}});if(!enrollment?.active)return fail(403,"الطالب غير مقيد بهذه الحلقة");
 try{const row=await d.client.$transaction(async(tx:any)=>{const value=await tx[`${scopes[v.scope].prefix}Attendance`].create({data:{studentId:v.studentId,sessionId:v.sessionId,status:v.status,recordedBy:g.actor.id,reason:v.reason}});await tx.auditEvent.create({data:{actorId:g.actor.id,scopeCode:scopes[v.scope].code,action:"ATTENDANCE_MANUAL",subjectType:"ATTENDANCE",subjectId:value.id,reason:v.reason,metadata:{status:v.status}},select:{id:true}});return value;});return privateJson({id:row.id},201);}catch{return fail(409,"سبق تسجيل حالة لهذا الطالب في هذه الحصة");}
}
