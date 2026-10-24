import {NextRequest} from "next/server";
import {z} from "zod";
import {getIdentity,canAccess,rolesFor,fail,privateJson,safeOrigin} from "@/lib/phase2-auth";
import {isScope,scopes,Scope} from "@/lib/phase2-constants";
import {models,privileged,viewAccess,loggedRead,randomRef,randomVerify} from "@/lib/stage6";
import {staffStudentAccess,familyAccess} from "@/lib/phase3";
import {invoiceBalance,nextReview,nextDue,safeTimeRange,progressBySurah} from "@/lib/stage6-calculations.mjs";
import {recordManualPaymentWithinTransaction} from "@/lib/manual-payment.mjs";

export const runtime="nodejs";
const uuid=z.string().uuid(),pos=z.number().int().positive(),money=z.number().int().min(0).max(100_000_000);
const base=z.object({scope:z.enum(["men","women","academy"]),action:z.string()});
const invoiceSchema=base.extend({studentId:uuid,title:z.string().trim().min(3).max(160),amountPiasters:pos.max(100_000_000),discountPiasters:money.default(0),dueAt:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)});
const paymentSchema=base.extend({invoiceId:uuid,amountPiasters:pos.max(100_000_000),method:z.enum(["CASH","BANK_TRANSFER","WALLET_MANUAL"]),reference:z.string().trim().max(150).optional(),idempotencyKey:z.string().uuid()});
const certificateSchema=base.extend({studentId:uuid,kind:z.enum(["TAJWEED","HIFZ","IJAZA_QURAN","IJAZA_NOOR_BAYAN"]),courseTitle:z.string().trim().min(4).max(160),sanad:z.array(z.string().trim().min(2).max(200)).max(60).default([])});
const examSchema=base.extend({studentId:uuid,groupId:uuid,kind:z.enum(["PLACEMENT","HIFZ","TAJWEED","WRITTEN"]),title:z.string().trim().min(2).max(160),score:money,total:pos.max(100000),notes:z.string().trim().max(2000).optional()});
const reviewSchema=base.extend({studentId:uuid,groupId:uuid,surah:z.number().int().min(1).max(114),fromAyah:z.number().int().min(1).max(286),toAyah:z.number().int().min(1).max(286),mastery:z.number().int().min(0).max(100)});
const awardSchema=base.extend({studentId:uuid,points:z.number().int().min(1).max(50),reason:z.string().trim().min(3).max(250)});
const scheduleSchema=base.extend({groupId:uuid,teacherId:uuid,weekday:z.number().int().min(0).max(6),fromMinute:z.number().int().min(0).max(1440),toMinute:z.number().int().min(0).max(1440),roomCode:z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{2,64}$/)});
async function authorized(req:NextRequest,scope:unknown){if(!isScope(scope))return fail(400);const actor=await getIdentity(req);if(!actor)return fail(401);return {actor,scope};}
const isError=(x:unknown):x is Response=>x instanceof Response;
async function studentExists(d:ReturnType<typeof models>,studentId:string){return Boolean(await d.students.findFirst({where:{id:studentId,active:true},select:{id:true}}));}
function auditRow(actorId:string,scope:Scope,action:string,subjectType:string,subjectId:string,reason?:string){
 return {actorId,scopeCode:scopes[scope].code,action,subjectType,subjectId,...(reason?{reason}:{})};
}
async function auditedInsert(d:ReturnType<typeof models>,actorId:string,scope:Scope,model:string,data:Record<string,unknown>,action:string,subjectType:string){
 return d.client.$transaction(async(tx:any)=>{
  const created=await tx[model].create({data});
  await tx.auditEvent.create({data:auditRow(actorId,scope,action,subjectType,created.id),select:{id:true}});
  return created;
 });
}
export async function GET(req:NextRequest){
 const u=req.nextUrl.searchParams,kind=u.get("kind")??"overview",studentId=u.get("studentId")??"",auth=await authorized(req,u.get("scope"));if(isError(auth))return auth;
 const {actor,scope}=auth,d=models(scope);
 if(kind==="overview"){
   if(!await privileged(actor,scope,"SUPERVISOR"))return fail(403);
   const [students,groups,invoices,payments,reviews,exams]=await Promise.all([d.students.count({where:{active:true}}),d.groups.count({where:{active:true}}),d.invoice.findMany({where:{voidedAt:null},select:{amountPiasters:true,discountPiasters:true},take:5000}),d.payment.findMany({select:{amountPiasters:true},take:5000}),d.review.count({where:{completedAt:null,dueAt:{lte:new Date()}}}),d.exam.count()]);
   await loggedRead(scope,actor,"ADMIN_STATS",scope);
   return privateJson({students,groups,invoicedPiasters:invoices.reduce((t:any,v:any)=>t+v.amountPiasters-v.discountPiasters,0),receivedPiasters:payments.reduce((t:any,v:any)=>t+v.amountPiasters,0),overdueReviews:reviews,exams,limitedToFirst:5000});
 }
 if(kind==="schedule"){
   if(!await privileged(actor,scope,"SUPERVISOR"))return fail(403);
   const items=await d.schedule.findMany({where:{active:true},orderBy:[{weekday:"asc"},{fromMinute:"asc"}],take:300,include:{group:{select:{nameAr:true}}}});
   const assignees=await d.teachers.findMany({where:{active:true},select:{groupId:true,userId:true},take:500});
   await loggedRead(scope,actor,"SCHEDULE",scope);return privateJson({items,assignees});
 }
 if(!uuid.safeParse(studentId).success)return fail(400,"حدد الطالب");
 if(!await viewAccess(actor,scope,studentId))return fail(403);
 if(!await studentExists(d,studentId))return fail(404);
 await loggedRead(scope,actor,`STAGE6_${kind.toUpperCase()}`,studentId);
 if(kind==="invoices"){
   const invoices=await d.invoice.findMany({where:{studentId},orderBy:{createdAt:"desc"},take:100,include:{payments:{select:{amountPiasters:true,method:true,receivedAt:true,receiptNo:true}}}});
   return privateJson({items:invoices.map((i:any)=>({id:i.id,number:i.number,title:i.title,dueAt:i.dueAt,balance:invoiceBalance(i,i.payments),payments:i.payments}))});
 }
 if(kind==="certificates"){
   const items=await d.cert.findMany({where:{studentId},orderBy:{issuedAt:"desc"},take:100,include:{sanad:{orderBy:{position:"asc"}},student:{select:{fullName:true}}}});
   return privateJson({items:items.map((c:any)=>({id:c.id,serial:c.serial,code:c.verifyCode,kind:c.kind,courseTitle:c.courseTitle,studentName:c.student.fullName,issuedAt:c.issuedAt,revokedAt:c.revokedAt,publicVerification:c.publicVerification,sanad:c.sanad.map((s:any)=>s.scholarName)}))});
 }
 if(kind==="exams")return privateJson({items:await d.exam.findMany({where:{studentId},orderBy:{assessedAt:"desc"},take:100})});
 if(kind==="reviews")return privateJson({items:await d.review.findMany({where:{studentId},orderBy:{dueAt:"asc"},take:100})});
 if(kind==="awards"){
   const items=await d.award.findMany({where:{studentId},orderBy:{createdAt:"desc"},take:100});
   return privateJson({items,points:items.reduce((v:any,r:any)=>v+r.points,0)});
 }
 if(kind==="progress"){
   const records=await (d.client as any)[`${scopes[scope].prefix}LearningRecord`].findMany({where:{studentId},orderBy:{assessedAt:"desc"},take:1000,select:{surahNumber:true,activity:true,mastery:true}});
   return privateJson({surahs:progressBySurah(records),recordsConsidered:records.length,notice:"مؤشرات مبنية على تقييمات المعلم وليست عدد الآيات المكتمل في الأجزاء الثلاثين"});
 }
 return fail(400,"نوع غير معروف");
}
export async function POST(req:NextRequest){
 if(!req.headers.get("origin")||!safeOrigin(req))return fail(403,"مصدر الطلب غير صحيح");
 let raw:unknown;try{raw=await req.json();}catch{return fail(400,"JSON غير صالح");}
 const b=base.safeParse(raw);if(!b.success)return fail(400,"بيانات الطلب غير صحيحة");
 const auth=await authorized(req,b.data.scope);if(isError(auth))return auth;
 const {actor,scope}=auth,d=models(scope);
 try{
  switch(b.data.action){
  case "invoice.create":{
   if(!await privileged(actor,scope,"FINANCE"))return fail(403);
   const x=invoiceSchema.parse(raw);if(x.discountPiasters>=x.amountPiasters)return fail(400,"الخصم يجب أن يكون أقل من المبلغ");
   const due=new Date(`${x.dueAt}T00:00:00Z`);if(!Number.isFinite(due.valueOf())||due.toISOString().slice(0,10)!==x.dueAt)return fail(400,"تاريخ غير صحيح");
   if(!await studentExists(d,x.studentId))return fail(404);
   const invoice=await auditedInsert(d,actor.id,scope,`${scopes[scope].prefix}Invoice`,{studentId:x.studentId,number:randomRef("INV"),title:x.title,amountPiasters:x.amountPiasters,discountPiasters:x.discountPiasters,dueAt:due,issuedBy:actor.id},"INVOICE_CREATE","INVOICE");return privateJson({id:invoice.id,number:invoice.number},201);
  }
  case "payment.record":{
   if(!await privileged(actor,scope,"FINANCE"))return fail(403);
   const x=paymentSchema.parse(raw);
   // A durable request key makes browser retries safe after a network timeout.
   // Serializable isolation also detects concurrent payments and invoice voids.
   const payment=await d.client.$transaction((tx:any)=>recordManualPaymentWithinTransaction({
      tx,prefix:scopes[scope].prefix,request:x,actorId:actor.id,scopeCode:scopes[scope].code,
      makeReceipt:()=>randomRef("RCPT"),calculateBalance:invoiceBalance
   }),{isolationLevel:"Serializable"});
   return privateJson({id:payment.payment.id,receiptNo:payment.payment.receiptNo,manualRecord:true,replayed:payment.replayed},payment.replayed?200:201);
  }
  case "certificate.issue":{
   if(!await privileged(actor,scope,"SUPERVISOR"))return fail(403);
   const x=certificateSchema.parse(raw);
   if(!await studentExists(d,x.studentId))return fail(404);
   if(x.kind.startsWith("IJAZA")&&x.sanad.length<2)return fail(400,"سلسلة السند مطلوبة للإجازة");
   const c=await auditedInsert(d,actor.id,scope,`${scopes[scope].prefix}Certificate`,{studentId:x.studentId,kind:x.kind,courseTitle:x.courseTitle,serial:randomRef("CERT"),verifyCode:randomVerify(scope),issuerId:actor.id,sanad:{create:x.sanad.map((scholarName,position)=>({position:position+1,scholarName}))}},"CERTIFICATE_ISSUE","CERTIFICATE");
   return privateJson({id:c.id,serial:c.serial,verifyUrl:`/verify?code=${encodeURIComponent(c.verifyCode)}`,publicVerification:false},201);
  }
  case "certificate.consent":{
   const x=base.extend({certificateId:uuid}).parse(raw);
   const c=await d.cert.findUnique({where:{id:x.certificateId},select:{id:true,studentId:true,revokedAt:true}});
   if(!c||c.revokedAt)return fail(404);
   if(!await familyAccess(actor,scope,c.studentId))return fail(403,"تستلزم الموافقة من الطالب أو ولي الأمر المرتبط");
   await d.client.$transaction(async(tx:any)=>{await tx[`${scopes[scope].prefix}Certificate`].update({where:{id:c.id},data:{verificationConsentAt:new Date(),verificationConsentBy:actor.id}});await tx.auditEvent.create({data:auditRow(actor.id,scope,"CERTIFICATE_PUBLIC_CONSENT","CERTIFICATE",c.id),select:{id:true}});});return privateJson({consented:true});
  }
  case "certificate.approve":{
   if(!await privileged(actor,scope,"SUPERVISOR"))return fail(403);
   const x=base.extend({certificateId:uuid}).parse(raw);
   const c=await d.cert.findUnique({where:{id:x.certificateId},select:{id:true,studentId:true,issuerId:true,verificationConsentAt:true,revokedAt:true}});
   if(!c||c.revokedAt)return fail(404);
   if(c.issuerId===actor.id)return fail(403,"لا يمكن إصدار الشهادة والموافقة على نشرها بنفس الحساب");
   if(!c.verificationConsentAt)return fail(409,"يلزم موافقة الطالب أو ولي الأمر أولًا");
   await d.client.$transaction(async(tx:any)=>{await tx[`${scopes[scope].prefix}Certificate`].update({where:{id:c.id},data:{publicVerification:true,approvedBy:actor.id,approvedAt:new Date()}});await tx.auditEvent.create({data:auditRow(actor.id,scope,"CERTIFICATE_PUBLIC_APPROVE","CERTIFICATE",c.id),select:{id:true}});});return privateJson({publicVerification:true});
  }
  case "certificate.revoke":{
   if(!await privileged(actor,scope,"SUPERVISOR"))return fail(403);
   const x=base.extend({certificateId:uuid,reason:z.string().trim().min(8).max(250)}).parse(raw);
   await d.client.$transaction(async(tx:any)=>{await tx[`${scopes[scope].prefix}Certificate`].update({where:{id:x.certificateId},data:{revokedAt:new Date(),publicVerification:false}});await tx.auditEvent.create({data:auditRow(actor.id,scope,"CERTIFICATE_REVOKE","CERTIFICATE",x.certificateId,x.reason),select:{id:true}});});
   return privateJson({revoked:true});
  }
  case "exam.record":{
   const x=examSchema.parse(raw);if(x.score>x.total)return fail(400,"الدرجة أكبر من النهائية");
   if(!await staffStudentAccess(actor,scope,x.studentId,x.groupId,"write"))return fail(403);
   const row=await auditedInsert(d,actor.id,scope,`${scopes[scope].prefix}Exam`,{studentId:x.studentId,groupId:x.groupId,kind:x.kind,title:x.title,score:x.score,total:x.total,notes:x.notes,assessedBy:actor.id},"EXAM_RECORD","EXAM");return privateJson({id:row.id},201);
  }
  case "review.assign":{
   const x=reviewSchema.parse(raw);if(x.fromAyah>x.toAyah)return fail(400);
   if(!await staffStudentAccess(actor,scope,x.studentId,x.groupId,"write"))return fail(403);
   const intervalDays=nextReview(x.mastery);const dueAt=nextDue(new Date(),intervalDays);
   const row=await auditedInsert(d,actor.id,scope,`${scopes[scope].prefix}ReviewTask`,{studentId:x.studentId,groupId:x.groupId,surah:x.surah,fromAyah:x.fromAyah,toAyah:x.toAyah,intervalDays,lastMastery:x.mastery,dueAt,createdBy:actor.id},"REVIEW_ASSIGN","REVIEW_TASK");return privateJson({id:row.id,dueAt},201);
  }
  case "review.complete":{
   const x=base.extend({reviewId:uuid,groupId:uuid,mastery:z.number().int().min(0).max(100)}).parse(raw);
   const row=await d.review.findUnique({where:{id:x.reviewId}});if(!row||row.completedAt)return fail(404);
   if(row.groupId!==x.groupId||!await staffStudentAccess(actor,scope,row.studentId,x.groupId,"write"))return fail(403);
   const days=nextReview(x.mastery,row.intervalDays);const dueAt=nextDue(new Date(),days);
   // Unique conditional update makes review completion idempotent even across concurrent devices.
   const result=await d.client.$transaction(async(tx:any)=>{
     const delegate=tx[`${scopes[scope].prefix}ReviewTask`];
     const updated=await delegate.updateMany({where:{id:row.id,completedAt:null},data:{completedAt:new Date(),lastMastery:x.mastery}});
     if(updated.count!==1)return null;
     const created=await delegate.create({data:{studentId:row.studentId,groupId:row.groupId,surah:row.surah,fromAyah:row.fromAyah,toAyah:row.toAyah,intervalDays:days,lastMastery:x.mastery,dueAt,createdBy:actor.id}});
     await tx.auditEvent.create({data:auditRow(actor.id,scope,"REVIEW_COMPLETE","REVIEW_TASK",row.id),select:{id:true}});
     return created;
   });if(!result)return fail(409,"تم تسجيل المراجعة بالفعل");return privateJson({nextId:result.id,dueAt});
  }
  case "schedule.cancel":{
   if(!await privileged(actor,scope,"SUPERVISOR"))return fail(403);
   const x=base.extend({scheduleId:uuid,reason:z.string().trim().min(8).max(250)}).parse(raw);
   const updated=await d.client.$transaction(async(tx:any)=>{const result=await tx[`${scopes[scope].prefix}WeeklySchedule`].updateMany({where:{id:x.scheduleId,active:true},data:{active:false}});if(result.count===1)await tx.auditEvent.create({data:auditRow(actor.id,scope,"SCHEDULE_CANCEL","WEEKLY_SCHEDULE",x.scheduleId,x.reason),select:{id:true}});return result;});
   if(updated.count!==1)return fail(404);
   return privateJson({cancelled:true});
  }
  case "invoice.void":{
   if(!await privileged(actor,scope,"FINANCE"))return fail(403);
   const x=base.extend({invoiceId:uuid,reason:z.string().trim().min(8).max(250)}).parse(raw);
   const outcome=await d.client.$transaction(async(tx:any)=>{
     const table=tx[`${scopes[scope].prefix}Invoice`];
     const current=await table.findUnique({where:{id:x.invoiceId},include:{payments:{select:{id:true}}}});
     if(!current||current.voidedAt)return "NOT_FOUND";
     if(current.payments.length)return "HAS_PAYMENTS";
     await table.update({where:{id:x.invoiceId},data:{voidedAt:new Date()}});
     await tx.auditEvent.create({data:auditRow(actor.id,scope,"INVOICE_VOID","INVOICE",x.invoiceId,x.reason),select:{id:true}});
     return "OK";
   },{isolationLevel:"Serializable"});
   if(outcome==="NOT_FOUND")return fail(404);
   if(outcome==="HAS_PAYMENTS")return fail(409,"لا يمكن إلغاء فاتورة لها مدفوعات مسجلة");
   return privateJson({voided:true});
  }
  case "award.create":{
   if(!await privileged(actor,scope,"SUPERVISOR"))return fail(403);
   const x=awardSchema.parse(raw);if(!await studentExists(d,x.studentId))return fail(404);
   const a=await auditedInsert(d,actor.id,scope,`${scopes[scope].prefix}Award`,{studentId:x.studentId,points:x.points,reason:x.reason,awardedBy:actor.id},"AWARD_CREATE","AWARD");return privateJson({id:a.id},201);
  }
  case "schedule.create":{
   if(!await privileged(actor,scope,"SUPERVISOR"))return fail(403);
   const x=scheduleSchema.parse(raw);
   if(!safeTimeRange(x.fromMinute,x.toMinute))return fail(400,"نطاق الوقت غير صحيح");
   const group=await d.groups.findFirst({where:{id:x.groupId,active:true},select:{id:true}});
   if(!group)return fail(404,"الحلقة غير موجودة");
   const assigned=await d.teachers.findFirst({where:{groupId:x.groupId,userId:x.teacherId,active:true},select:{id:true}});
   if(!assigned)return fail(400,"المعلم غير مسند للحلقة");
   const row=await auditedInsert(d,actor.id,scope,`${scopes[scope].prefix}WeeklySchedule`,{groupId:x.groupId,weekday:x.weekday,fromMinute:x.fromMinute,toMinute:x.toMinute,roomCode:x.roomCode,teacherId:x.teacherId,createdBy:actor.id},"SCHEDULE_CREATE","WEEKLY_SCHEDULE");return privateJson({id:row.id},201);
  }
  default:return fail(400,"عملية غير مدعومة");
  }
 }catch(error){
   if(error instanceof z.ZodError)return fail(400,"بيانات غير صحيحة");
   if(error instanceof Error&&error.message==="OVERPAYMENT")return fail(409,"المبلغ أكبر من المتبقي في الفاتورة");
   if(error instanceof Error&&error.message==="INVOICE_UNAVAILABLE")return fail(409,"الفاتورة غير متاحة");
   if(error instanceof Error&&error.message==="PAYMENT_KEY_CONFLICT")return fail(409,"معرّف العملية استُخدم لدفعة مختلفة");
   // Exclusion violations, serialization conflicts and duplicate numbers are conflicts, not internal details.
   if(error&&typeof error==="object"&&String((error as {code?:string}).code).match(/P2002|P2010|P2034/))return fail(409,"تعارض بيانات أو وقت محجوز؛ أعد المحاولة");
   console.error("Stage6 operation failed",error instanceof Error?error.name:"unknown");
   return fail(500,"تعذر إتمام العملية");
 }
}
