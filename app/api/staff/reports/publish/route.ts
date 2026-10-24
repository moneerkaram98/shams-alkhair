import {NextRequest} from "next/server";
import {z} from "zod";
import {getIdentity,fail,privateJson,safeOrigin} from "@/lib/phase2-auth";
import {phase3Models,scopeSchema,uuid,staffStudentAccess} from "@/lib/phase3";
import {scopes} from "@/lib/phase2-constants";
const schema=z.object({scope:scopeSchema,reportId:uuid,teacherComment:z.string().trim().max(2000)});
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();const v=schema.safeParse(await req.json().catch(()=>null));if(!v.success)return fail(400);
 const actor=await getIdentity(req);if(!actor)return fail(401);const d=phase3Models(v.data.scope);
 const report=await d.reports.findUnique({where:{id:v.data.reportId},select:{id:true,studentId:true,status:true,periodType:true}});if(!report)return fail(404);
 if(!await staffStudentAccess(actor,v.data.scope,report.studentId,undefined,"write"))return fail();if(report.status!=="DRAFT")return fail(409,"هذا التقرير منشور بالفعل");
 const guardians=await d.guardians.findMany({where:{studentId:report.studentId,active:true},select:{userId:true}});
 await d.client.$transaction(async(tx:any)=>{const prefix=scopes[v.data.scope].prefix;const changed=await tx[`${prefix}StudentReport`].updateMany({where:{id:report.id,status:"DRAFT"},data:{status:"PUBLISHED",teacherComment:v.data.teacherComment,approvedBy:actor.id,publishedAt:new Date()}});if(changed.count!==1)throw Error("Already published");
 for(const g of guardians){const pref=await tx[`${prefix}ReportPreference`].findUnique({where:{studentId_guardianUserId:{studentId:report.studentId,guardianUserId:g.userId}}});
  if(!pref||!(report.periodType==="WEEKLY"?pref.weekly:pref.monthly))continue;
  if(pref.inApp){await tx[`${prefix}FamilyNotification`].create({data:{studentId:report.studentId,recipientId:g.userId,kind:"REPORT_READY",title:"تقرير دراسي جديد",text:"أصبح التقرير الدوري متاحًا داخل حسابك"}});await tx[`${prefix}ReportDelivery`].create({data:{reportId:report.id,guardianUserId:g.userId,method:"IN_APP",status:"SENT",attempts:1,deliveredAt:new Date()}});}
  if(pref.email && pref.emailOptInAt)await tx[`${prefix}ReportDelivery`].create({data:{reportId:report.id,guardianUserId:g.userId,method:"EMAIL",status:"QUEUED"}});
 }
 await tx.auditEvent.create({data:{scopeCode:scopes[v.data.scope].code,actorId:actor.id,action:"REPORT_PUBLISH",subjectType:"REPORT",subjectId:report.id},select:{id:true}});
 });return privateJson({success:true});
}
