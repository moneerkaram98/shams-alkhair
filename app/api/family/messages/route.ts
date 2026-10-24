import {NextRequest} from "next/server";
import {z} from "zod";
import {getIdentity,fail,privateJson,safeOrigin,rolesFor} from "@/lib/phase2-auth";
import {scopeSchema,uuid,familyAccess,phase3Models,staffStudentAccess} from "@/lib/phase3";
import {isScope,scopes} from "@/lib/phase2-constants";
import {checkWomenRead} from "@/lib/phase2-data";
const post=z.object({scope:scopeSchema,studentId:uuid,recipientId:uuid,body:z.string().trim().min(1).max(2000)});
async function maySee(actor:any,scope:any,studentId:string){return Boolean(await familyAccess(actor,scope,studentId))||await staffStudentAccess(actor,scope,studentId);}
export async function GET(req:NextRequest){const q=req.nextUrl.searchParams,scope=q.get("scope"),studentId=q.get("studentId");if(!isScope(scope)||!uuid.safeParse(studentId).success)return fail(400);
 const actor=await getIdentity(req);if(!actor)return fail(401);if(!await maySee(actor,scope,studentId!))return fail();
 const d=phase3Models(scope);await checkWomenRead(scope,actor,"FAMILY_MESSAGES",studentId);
 const messages=await d.messages.findMany({where:{studentId,OR:[{senderId:actor.id},{recipientId:actor.id}]},orderBy:{createdAt:"asc"},take:100});return privateJson({messages});
}
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();const parsed=post.safeParse(await req.json().catch(()=>null));if(!parsed.success)return fail(400);
 const v=parsed.data,actor=await getIdentity(req);if(!actor)return fail(401);if(v.recipientId===actor.id)return fail(400);
 const d=phase3Models(v.scope);const relationship=await familyAccess(actor,v.scope,v.studentId);
 if(relationship){ // Family may message a teacher assigned to this student's current class.
  const teacher=await d.teachers.findFirst({where:{userId:v.recipientId,active:true,group:{enrollments:{some:{studentId:v.studentId,active:true}}}},select:{id:true}});if(!teacher)return fail(403,"المستلم ليس معلمًا مرتبطًا بهذه الحلقة");
 }else{if(!await staffStudentAccess(actor,v.scope,v.studentId))return fail();
  const link=await d.guardians.findFirst({where:{userId:v.recipientId,studentId:v.studentId,active:true},select:{id:true}});if(!link)return fail(403,"يجب أن يكون المستلم ولي أمر مرتبطًا بالطالب");
 }
 const row=await d.client.$transaction(async(tx:any)=>{const prefix=scopes[v.scope].prefix;const message=await tx[`${prefix}FamilyMessage`].create({data:{studentId:v.studentId,senderId:actor.id,recipientId:v.recipientId,body:v.body}});await tx[`${prefix}FamilyNotification`].create({data:{studentId:v.studentId,recipientId:v.recipientId,kind:"NEW_MESSAGE",title:"رسالة جديدة",text:"لديك رسالة جديدة في منصة المدرسة"}});await tx.auditEvent.create({data:{scopeCode:scopes[v.scope].code,actorId:actor.id,action:"FAMILY_MESSAGE_SEND",subjectType:"MESSAGE",subjectId:message.id},select:{id:true}});return message;});
 return privateJson({id:row.id},201);
}
