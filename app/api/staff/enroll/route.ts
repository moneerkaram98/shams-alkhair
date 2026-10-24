import {NextRequest} from "next/server";
import {z} from "zod";
import {guard,isGuardError,scoped} from "@/lib/phase2-data";
import {fail,privateJson,safeOrigin} from "@/lib/phase2-auth";
import {scopes} from "@/lib/phase2-constants";
const schema=z.object({scope:z.enum(["men","women","academy"]),studentId:z.string().uuid(),groupId:z.string().uuid()});
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();let parsed;try{parsed=schema.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400);const v=parsed.data,g=await guard(req,v.scope,"manage");if(isGuardError(g))return g;const d=scoped(v.scope);
 try{const id=await d.client.$transaction(async(tx:any)=>{
  const grp=await tx[`${scopes[v.scope].prefix}ClassGroup`].findUnique({where:{id:v.groupId}}),student=await tx[`${scopes[v.scope].prefix}Student`].findUnique({where:{id:v.studentId}});
  if(!grp?.active||!student?.active)throw new Error("NOT_FOUND");
  const count=await tx[`${scopes[v.scope].prefix}Enrollment`].count({where:{groupId:v.groupId,active:true}});
  const existing=await tx[`${scopes[v.scope].prefix}Enrollment`].findUnique({where:{studentId_groupId:{studentId:v.studentId,groupId:v.groupId}}});
  if(count>=grp.capacity&&!existing?.active)throw new Error("FULL");
  const e=await tx[`${scopes[v.scope].prefix}Enrollment`].upsert({where:{studentId_groupId:{studentId:v.studentId,groupId:v.groupId}},create:{studentId:v.studentId,groupId:v.groupId},update:{active:true}});
  await tx.auditEvent.create({data:{actorId:g.actor.id,scopeCode:scopes[v.scope].code,action:"STUDENT_ENROLL",subjectType:"ENROLLMENT",subjectId:e.id},select:{id:true}});return e.id;
 },{isolationLevel:"Serializable"});return privateJson({id});}catch(e){return fail(409,e instanceof Error && e.message==="FULL"?"الحلقة مكتملة": "تعذر تسجيل الطالب، تأكد من البيانات والسعة");}
}
