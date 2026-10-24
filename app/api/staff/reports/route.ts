import {NextRequest} from "next/server";
import {z} from "zod";
import {getIdentity,fail,privateJson,safeOrigin} from "@/lib/phase2-auth";
import {scopeSchema,uuid,dateOnly,parsePeriod,makeSnapshot,phase3Models,staffStudentAccess} from "@/lib/phase3";
import {isScope,scopes} from "@/lib/phase2-constants";
import {checkWomenRead} from "@/lib/phase2-data";
const schema=z.object({scope:scopeSchema,studentId:uuid,periodType:z.enum(["WEEKLY","MONTHLY"]),periodStart:dateOnly});
export async function GET(req:NextRequest){const q=req.nextUrl.searchParams,scope=q.get("scope"),studentId=q.get("studentId");if(!isScope(scope)||!uuid.safeParse(studentId).success)return fail(400);
 const actor=await getIdentity(req);if(!actor)return fail(401);if(!await staffStudentAccess(actor,scope,studentId!))return fail();
 await checkWomenRead(scope,actor,"REPORT_LIST",studentId);const d=phase3Models(scope);
 const reports=await d.reports.findMany({where:{studentId},orderBy:{periodStart:"desc"},take:24});return privateJson({reports});
}
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();const b=schema.safeParse(await req.json().catch(()=>null));if(!b.success)return fail(400);
 const a=await getIdentity(req);if(!a)return fail(401);const v=b.data;if(!await staffStudentAccess(a,v.scope,v.studentId,undefined,"write"))return fail();
 let dates;try{dates=parsePeriod(v.periodType,v.periodStart)}catch(e){return fail(400,(e as Error).message)};
 const snapshot=await makeSnapshot(v.scope,v.studentId,dates.start,dates.end);const d=phase3Models(v.scope);
 // Upsert is idempotent, but we never overwrite reports already approved and delivered.
 const current=await d.reports.findUnique({where:{studentId_periodType_periodStart:{studentId:v.studentId,periodType:v.periodType,periodStart:dates.start}}});
 if(current?.status==="PUBLISHED")return fail(409,"لا يمكن تعديل تقرير تم نشره");
 let report;
 try{report=await d.client.$transaction(async(tx:any)=>{const delegate=tx[`${scopes[v.scope].prefix}StudentReport`];let row;
 if(current){const result=await delegate.updateMany({where:{id:current.id,status:"DRAFT"},data:{snapshot,generatedBy:a.id}});if(result.count!==1)throw Error("PUBLISHED_CONFLICT");row={id:current.id,status:"DRAFT"};}
 else{row=await delegate.create({data:{studentId:v.studentId,periodType:v.periodType,periodStart:dates.start,periodEnd:dates.end,snapshot,generatedBy:a.id}});}
 await tx.auditEvent.create({data:{scopeCode:scopes[v.scope].code,actorId:a.id,action:"REPORT_DRAFT_GENERATE",subjectType:"REPORT",subjectId:row.id},select:{id:true}});return row;});}catch{return fail(409,"تعارض في إصدار التقرير؛ حدّث القائمة ثم أعد المحاولة");}
 return privateJson({id:report.id,status:report.status},201);
}
