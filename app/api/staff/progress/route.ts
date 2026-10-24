import {NextRequest} from "next/server";
import {z} from "zod";
import {getIdentity,fail,privateJson,safeOrigin} from "@/lib/phase2-auth";
import {scopeSchema,uuid,progressSchema,phase3Models,staffStudentAccess} from "@/lib/phase3";
import {isScope,scopes} from "@/lib/phase2-constants";
import {checkWomenRead} from "@/lib/phase2-data";
export async function GET(req:NextRequest){const q=req.nextUrl.searchParams,scope=q.get("scope"),studentId=q.get("studentId");if(!isScope(scope)||!uuid.safeParse(studentId).success)return fail(400);
 const actor=await getIdentity(req);if(!actor)return fail(401);if(!await staffStudentAccess(actor,scope,studentId!))return fail();
 await checkWomenRead(scope,actor,"LEARNING_RECORD_LIST",studentId);const d=phase3Models(scope);
 const records=await d.records.findMany({where:{studentId},orderBy:{assessedAt:"desc"},take:120});return privateJson({records});
}
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();const data=progressSchema.safeParse(await req.json().catch(()=>null));if(!data.success)return fail(400,data.error.issues[0]?.message);
 const a=await getIdentity(req);if(!a)return fail(401);const v=data.data;if(!await staffStudentAccess(a,v.scope,v.studentId,v.groupId,"write"))return fail();
 const d=phase3Models(v.scope);const rec=await d.client.$transaction(async(tx:any)=>{const record=await tx[`${scopes[v.scope].prefix}LearningRecord`].create({data:{studentId:v.studentId,groupId:v.groupId,teacherId:a.id,activity:v.activity,surahNumber:v.surahNumber,ayahFrom:v.ayahFrom,ayahTo:v.ayahTo,mastery:v.mastery,memoryErrors:v.memoryErrors,tajweedErrors:v.tajweedErrors,makharijErrors:v.makharijErrors,teacherNote:v.teacherNote}});await tx.auditEvent.create({data:{scopeCode:scopes[v.scope].code,actorId:a.id,action:"LEARNING_RECORD_CREATE",subjectType:"LEARNING_RECORD",subjectId:record.id},select:{id:true}});return record;});
 return privateJson({id:rec.id},201);
}
