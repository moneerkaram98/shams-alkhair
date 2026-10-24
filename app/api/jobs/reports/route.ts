import {NextRequest} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {db} from "@/lib/db";
import {fail,privateJson} from "@/lib/phase2-auth";
import {domains,Scope,scopes} from "@/lib/phase2-constants";
import {phase3Models,parsePeriod,makeSnapshot} from "@/lib/phase3";
/** Dedicated server-side cron; never called by browsers. Configure CRON_SECRET in your hosting environment. */
function validCron(req:NextRequest){const expected=process.env.CRON_SECRET||"";const provided=req.headers.get("authorization")||"";if(expected.length<32||!provided.startsWith("Bearer "))return false;const supplied=provided.slice(7);const a=Buffer.from(expected),b=Buffer.from(supplied);return a.length===b.length&&timingSafeEqual(a,b);}
function duePeriods(now:Date){const periods:Array<{type:"WEEKLY"|"MONTHLY";start:string}>=[];
 // UTC date windows for deterministic idempotent reporting. Cron runs at 03:00 UTC.
 if(now.getUTCDay()===1){const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-7));periods.push({type:"WEEKLY",start:start.toISOString().slice(0,10)});}
 if(now.getUTCDate()===1){const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-1,1));periods.push({type:"MONTHLY",start:start.toISOString().slice(0,10)});}
 return periods;
}
export async function GET(req:NextRequest){if(!validCron(req))return fail(401);const now=new Date(),periods=duePeriods(now);let generated=0,skipped=0,remaining=0,delivered=0,failures=0;
 for(const scope of domains){const d=phase3Models(scope);const prefix=scopes[scope].prefix;
 for(const period of periods){const {start,end}=parsePeriod(period.type,period.start);
 // Capped batch. Add a durable job queue/pagination before operating above 150 students per scope.
 const students=await d.students.findMany({where:{active:true},orderBy:{id:"asc"},take:151,select:{id:true}});if(students.length>150)remaining+=students.length-150;
 for(const student of students.slice(0,150)){
  const existing=await d.reports.findUnique({where:{studentId_periodType_periodStart:{studentId:student.id,periodType:period.type,periodStart:start}},select:{id:true}});if(existing){skipped++;continue;}
  try{const snap=await makeSnapshot(scope,student.id,start,end);const guardians=await d.guardians.findMany({where:{studentId:student.id,active:true},select:{userId:true}});
   const prefs=await d.prefs.findMany({where:{studentId:student.id,guardianUserId:{in:guardians.map((g:any)=>g.userId)}}});
   const canAutopublish=guardians.length>0&&guardians.every((g:any)=>prefs.some((pref:any)=>pref.guardianUserId===g.userId&&!pref.requireTeacherApproval&&(period.type==="WEEKLY"?pref.weekly:pref.monthly)));
   await d.client.$transaction(async(tx:any)=>{const report=await tx[`${prefix}StudentReport`].create({data:{studentId:student.id,periodType:period.type,periodStart:start,periodEnd:end,snapshot:snap,status:canAutopublish?"PUBLISHED":"DRAFT",publishedAt:canAutopublish?new Date():null}});
    if(canAutopublish){for(const g of guardians){const pref=prefs.find((pref:any)=>pref.guardianUserId===g.userId);if(pref?.inApp){await tx[`${prefix}FamilyNotification`].create({data:{studentId:student.id,recipientId:g.userId,kind:"REPORT_READY",title:"تقرير دراسي جديد",text:"أصبح التقرير الدوري متاحًا داخل حسابك"}});await tx[`${prefix}ReportDelivery`].create({data:{reportId:report.id,guardianUserId:g.userId,method:"IN_APP",status:"SENT",attempts:1,deliveredAt:new Date()}});}
      if(pref?.email&&pref?.emailOptInAt)await tx[`${prefix}ReportDelivery`].create({data:{reportId:report.id,guardianUserId:g.userId,method:"EMAIL",status:"QUEUED"}});
    }}await tx.auditEvent.create({data:{scopeCode:scopes[scope].code,action:"SCHEDULED_REPORT_GENERATION",subjectType:"REPORT",subjectId:report.id},select:{id:true}});});generated++;
  }catch(error){failures++;console.error("Stage 3 report job failed",scope,period.type, String(error).slice(0,140));}
 }
 }
 // Only email verified opt-in recipients, using Resend if configured. Otherwise the queue remains pending.
 if(process.env.RESEND_API_KEY&&process.env.REPORT_EMAIL_FROM){const queue=await d.deliveries.findMany({where:{method:"EMAIL",OR:[{status:"QUEUED"},{status:"FAILED",attempts:{lt:3}},{status:"PROCESSING",processingAt:{lt:new Date(Date.now()-30*60_000)}}]},orderBy:{createdAt:"asc"},take:35,include:{report:true}});
  for(const item of queue){if(item.report.status!=="PUBLISHED")continue;
   const claimed=await d.deliveries.updateMany({where:{id:item.id,status:item.status},data:{status:"PROCESSING",processingAt:new Date(),attempts:{increment:1}}});if(!claimed.count)continue;
   try{const pref=await d.prefs.findUnique({where:{studentId_guardianUserId:{studentId:item.report.studentId,guardianUserId:item.guardianUserId}}});const link=await d.guardians.findFirst({where:{studentId:item.report.studentId,userId:item.guardianUserId,active:true}});if(!pref?.email||!pref.emailOptInAt||!link){await d.deliveries.update({where:{id:item.id},data:{status:"FAILED",lastError:"Consent or guardian link removed",processingAt:null}});continue;}
    const user=await db("auth").appUser.findUnique({where:{id:item.guardianUserId},select:{email:true,isActive:true}});if(!user?.isActive||!user.email)throw Error("Recipient no longer active");
    const origin=(process.env.NEXT_PUBLIC_SITE_URL||"").replace(/\/$/,"");if(!/^https:\/\//.test(origin))throw Error("Missing HTTPS site URL");
    const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":item.id},body:JSON.stringify({from:process.env.REPORT_EMAIL_FROM,to:[user.email],subject:"تقرير دوري جديد — مدرسة شمس الخير",html:`<div lang="ar" dir="rtl"><h2>تقرير دوري جديد</h2><p>تم نشر تقرير متابعة جديد داخل حسابك في مدرسة شمس الخير.</p><p><a href="${origin}/family">تسجيل الدخول وعرض التقرير</a></p><p>لا تشارك بيانات الدخول أو هذا البريد مع الآخرين.</p></div>`})});if(!res.ok)throw Error(`Provider returned ${res.status}`);const body=await res.json() as {id?:string};await d.deliveries.update({where:{id:item.id},data:{status:"SENT",providerId:body.id||null,deliveredAt:new Date(),processingAt:null,lastError:null}});delivered++;
   }catch(error){failures++;await d.deliveries.update({where:{id:item.id},data:{status:"FAILED",lastError:String(error).slice(0,180),processingAt:null}});}
  }
 }
 }
 return privateJson({generated,alreadyExist:skipped,capExceeded:remaining,emailsSent:delivered,errors:failures});
}
