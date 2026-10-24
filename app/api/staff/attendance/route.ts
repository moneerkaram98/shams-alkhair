import {NextRequest} from "next/server";
import {z} from "zod";
import {hashToken,fail,privateJson,safeOrigin,rolesFor,getIdentity,canAccess} from "@/lib/phase2-auth";
import {guard,isGuardError,scoped,checkWomenRead} from "@/lib/phase2-data";
import {scopes,isScope,attendanceStatuses} from "@/lib/phase2-constants";
const base=z.object({scope:z.enum(["men","women","academy"]),sessionId:z.string().uuid()});
const create=base.extend({token:z.string().min(20).max(100)});
const amend=base.extend({attendanceId:z.string().uuid(),status:z.enum(attendanceStatuses),reason:z.string().trim().min(6).max(250)});
export async function GET(req:NextRequest){const scope=req.nextUrl.searchParams.get("scope"),sessionId=req.nextUrl.searchParams.get("sessionId");if(!isScope(scope)||!sessionId)return fail(400);const requester=await getIdentity(req);if(!requester)return fail(401);if(!await canAccess(requester,scope,"read"))return fail();const d=scoped(scope);
 // Resolve the group BEFORE authorization only by a scoped UUID; no student info is leaked.
 const session=await d.sessions.findUnique({where:{id:sessionId},select:{id:true,groupId:true,startsAt:true,endsAt:true}});if(!session)return fail(404);
 const g=await guard(req,scope,"read",session.groupId);if(isGuardError(g))return g;
 await checkWomenRead(scope,g.actor,"ATTENDANCE_ROSTER",sessionId);
 const [roster,records]=await Promise.all([d.enrollments.findMany({where:{groupId:session.groupId,active:true},select:{student:{select:{id:true,fullName:true}}}}),d.attendance.findMany({where:{sessionId},select:{id:true,studentId:true,status:true,markedAt:true,reason:true}})]);
 return privateJson({session,roster:roster.map((r:any)=>r.student),records});}
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();let parsed;try{parsed=create.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400);
 const v=parsed.data,requester=await getIdentity(req);if(!requester)return fail(401);if(!await canAccess(requester,v.scope,"mark"))return fail();const d=scoped(v.scope),session=await d.sessions.findUnique({where:{id:v.sessionId},select:{groupId:true,startsAt:true,endsAt:true,status:true}});if(!session)return fail(404);
 const g=await guard(req,v.scope,"mark",session.groupId);if(isGuardError(g))return g;
 if(session.status!=="PLANNED"&&session.status!=="OPEN")return fail(409,"الحصة مغلقة");
 const record=await d.credentials.findUnique({where:{tokenHash:hashToken(v.token)},select:{studentId:true,revokedAt:true}});if(!record||record.revokedAt)return fail(400,"كارت غير صحيح أو تم إلغاؤه");
 const enrolled=await d.enrollments.findUnique({where:{studentId_groupId:{studentId:record.studentId,groupId:session.groupId}},select:{active:true}});if(!enrolled?.active)return fail(403,"الطالب ليس مسجلًا بهذه الحلقة");
 const now=new Date();if(now<new Date(session.startsAt.getTime()-60*60*1000) || now>new Date(session.endsAt.getTime()+60*60*1000))return fail(409,"الحضور خارج نافذة الحصة");
 const status=now<=new Date(session.startsAt.getTime()+10*60000)?"PRESENT":"LATE";
 try{const row=await d.client.$transaction(async(tx:any)=>{const rec=await tx[`${scopes[v.scope].prefix}Attendance`].create({data:{studentId:record.studentId,sessionId:v.sessionId,status,recordedBy:g.actor.id}});await tx.auditEvent.create({data:{actorId:g.actor.id,scopeCode:scopes[v.scope].code,action:"ATTENDANCE_SCAN",subjectType:"ATTENDANCE",subjectId:rec.id,metadata:{status,sessionId:v.sessionId}},select:{id:true}});return rec;});return privateJson({status:row.status,attendanceId:row.id},201);}catch{return fail(409,"تم تسجيل حضور الطالب لهذه الحصة مسبقًا");}
}
export async function PATCH(req:NextRequest){if(!safeOrigin(req))return fail();let parsed;try{parsed=amend.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400);
 const v=parsed.data,requester=await getIdentity(req);if(!requester)return fail(401);if(!await canAccess(requester,v.scope,"mark"))return fail();const d=scoped(v.scope),session=await d.sessions.findUnique({where:{id:v.sessionId}});if(!session)return fail(404);
 const g=await guard(req,v.scope,"mark",session.groupId);if(isGuardError(g))return g;
 const old=await d.attendance.findUnique({where:{id:v.attendanceId},select:{sessionId:true,status:true}});if(!old||old.sessionId!==v.sessionId)return fail(404);
 const row=await d.client.$transaction(async(tx:any)=>{const rec=await tx[`${scopes[v.scope].prefix}Attendance`].update({where:{id:v.attendanceId},data:{status:v.status,reason:v.reason,recordedBy:g.actor.id}});await tx.auditEvent.create({data:{actorId:g.actor.id,action:"ATTENDANCE_CORRECT",scopeCode:scopes[v.scope].code,subjectType:"ATTENDANCE",subjectId:v.attendanceId,reason:v.reason,metadata:{previous:old.status,current:v.status}},select:{id:true}});return rec;});return privateJson({id:row.id,status:row.status});
}
