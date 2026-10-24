import "server-only";
import {NextRequest} from "next/server";
import {z} from "zod";
import {getIdentity,rolesFor,fail,Identity,canAccess} from "@/lib/phase2-auth";
import {scoped,checkWomenRead} from "@/lib/phase2-data";
import {Scope,scopes,isScope} from "@/lib/phase2-constants";
export const scopeSchema=z.enum(["men","women","academy"]);
export const uuid=z.string().uuid();
export const progressSchema=z.object({scope:scopeSchema,studentId:uuid,groupId:uuid,activity:z.enum(["NEW_MEMORIZATION","REVIEW"]),surahNumber:z.number().int().min(1).max(114),ayahFrom:z.number().int().min(1).max(286),ayahTo:z.number().int().min(1).max(286),mastery:z.number().int().min(0).max(100),memoryErrors:z.number().int().min(0).max(200),tajweedErrors:z.number().int().min(0).max(200),makharijErrors:z.number().int().min(0).max(200),teacherNote:z.string().trim().max(2000).optional()}).refine(x=>x.ayahTo>=x.ayahFrom,{message:"بداية المقطع يجب أن تسبق نهايته"});
export function phase3Models(scope:Scope){const d=scoped(scope),prefix=scopes[scope].prefix;return {...d,records:(d.client as any)[`${prefix}LearningRecord`],reports:(d.client as any)[`${prefix}StudentReport`],prefs:(d.client as any)[`${prefix}ReportPreference`],deliveries:(d.client as any)[`${prefix}ReportDelivery`],messages:(d.client as any)[`${prefix}FamilyMessage`],notifications:(d.client as any)[`${prefix}FamilyNotification`]};}
export async function actorOr401(req:NextRequest){const actor=await getIdentity(req);return actor??fail(401,"يلزم تسجيل الدخول");}
export async function familyAccess(actor:Identity,scope:Scope,studentId:string){
 const d=phase3Models(scope),code=scopes[scope].code;
 if(rolesFor(actor,code,"PARENT")){const link=await d.guardians.findFirst({where:{studentId,userId:actor.id,active:true},select:{id:true}});if(link)return "PARENT" as const;}
 if(rolesFor(actor,code,"STUDENT")){const s=await d.students.findFirst({where:{id:studentId,userId:actor.id,active:true},select:{id:true}});if(s)return "STUDENT" as const;}
 return null;
}
export async function staffStudentAccess(actor:Identity,scope:Scope,studentId:string,groupId?:string,mode:"read"|"write"="read"){
 const code=scopes[scope].code;
 if(!await canAccess(actor,scope,mode==="write"?"mark":"read"))return false;
 const d=phase3Models(scope);
 const student=await d.students.findUnique({where:{id:studentId},select:{id:true,active:true}});if(!student?.active)return false;
 const privileged=rolesFor(actor,code,"SUPERVISOR") || rolesFor(actor,"SCHOOL","SUPER_ADMIN");
 if(privileged){if(groupId){return Boolean(await d.enrollments.findFirst({where:{studentId,groupId,active:true},select:{id:true}}));}return true;}
 // RECEPTION cannot read private teaching notes or author academic assessments.
 if(!rolesFor(actor,code,"TEACHER"))return false;
 return Boolean(await d.enrollments.findFirst({where:{studentId,active:true,...(groupId?{groupId}:{}),group:{teachers:{some:{userId:actor.id,active:true}}}},select:{id:true}}));
}
export async function privateFamilyCheck(req:NextRequest,scopeVal:unknown,studentVal:unknown){
 if(!isScope(scopeVal)||!uuid.safeParse(studentVal).success)return fail(400);
 const actor=await getIdentity(req);if(!actor)return fail(401);
 const relationship=await familyAccess(actor,scopeVal,studentVal as string);
 if(!relationship)return fail(403);
 await checkWomenRead(scopeVal,actor,"PARENT_STUDENT_VIEW",studentVal as string);
 return {actor,scope:scopeVal,studentId:studentVal as string,relationship};
}
export function isFailure(r:unknown):r is Response{return r instanceof Response;}
export const dateOnly=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export function parsePeriod(kind:"WEEKLY"|"MONTHLY",dateStr:string){
 const start=new Date(`${dateStr}T00:00:00.000Z`);if(!Number.isFinite(start.getTime())||start.toISOString().slice(0,10)!==dateStr)throw Error("تاريخ غير صحيح");
 if(kind==="WEEKLY"&&start.getUTCDay()!==1)throw Error("الفترة الأسبوعية تبدأ يوم الاثنين");
 if(kind==="MONTHLY"&&start.getUTCDate()!==1)throw Error("الفترة الشهرية تبدأ يوم 1");
 const end=new Date(start);if(kind==="WEEKLY")end.setUTCDate(end.getUTCDate()+7);else end.setUTCMonth(end.getUTCMonth()+1);
 if(end>new Date())throw Error("لا يمكن إصدار تقرير لفترة لم تنتهِ بعد");return {start,end};
}
export function aggregate(attendances:Array<{status:string}>,records:Array<{mastery:number;activity:string;memoryErrors:number;tajweedErrors:number;makharijErrors:number;surahNumber:number;ayahFrom:number;ayahTo:number}>){
 const marked=attendances.filter(x=>x.status!=="EXCUSED");const attended=marked.filter(x=>["PRESENT","LATE","LEFT_EARLY"].includes(x.status)).length;
 const total=records.length;
 return {scheduled:attendances.length,attended,absent:attendances.filter(x=>x.status==="ABSENT").length,late:attendances.filter(x=>x.status==="LATE").length,excused:attendances.filter(x=>x.status==="EXCUSED").length,attendanceRate:marked.length?Math.round(attended/marked.length*100):null,assessments:total,memorizationSessions:records.filter(x=>x.activity==="NEW_MEMORIZATION").length,reviewSessions:records.filter(x=>x.activity==="REVIEW").length,masteryAverage:total?Math.round(records.reduce((s,x)=>s+x.mastery,0)/total):null,errors:{memorization:records.reduce((s,x)=>s+x.memoryErrors,0),tajweed:records.reduce((s,x)=>s+x.tajweedErrors,0),makharij:records.reduce((s,x)=>s+x.makharijErrors,0)},passages:records.map(r=>({surahNumber:r.surahNumber,ayahFrom:r.ayahFrom,ayahTo:r.ayahTo,activity:r.activity,mastery:r.mastery})).slice(0,100)};
}
export async function makeSnapshot(scope:Scope,studentId:string,periodStart:Date,periodEnd:Date){
 const d=phase3Models(scope);
 const [records,attendance,student]=await Promise.all([
   d.records.findMany({where:{studentId,assessedAt:{gte:periodStart,lt:periodEnd}},select:{mastery:true,activity:true,memoryErrors:true,tajweedErrors:true,makharijErrors:true,surahNumber:true,ayahFrom:true,ayahTo:true}}),
   d.attendance.findMany({where:{studentId,session:{startsAt:{gte:periodStart,lt:periodEnd}}},select:{status:true}}),
   d.students.findUnique({where:{id:studentId},select:{fullName:true}})
 ]);
 if(!student)throw Error("Student not found");
 return {studentName:student.fullName,periodStart:periodStart.toISOString().slice(0,10),periodEnd:periodEnd.toISOString().slice(0,10),...aggregate(attendance,records)};
}
export function safeHtml(input:string){return input.replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"} as Record<string,string>)[character]||character);}
