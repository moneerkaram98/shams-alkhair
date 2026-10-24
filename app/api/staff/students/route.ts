import {NextRequest} from "next/server";
import {z} from "zod";
import {guard,isGuardError,scoped,checkWomenRead} from "@/lib/phase2-data";
import {getIdentity,canAccess,fail,privateJson,safeOrigin,rolesFor} from "@/lib/phase2-auth";
import {isScope,scopes} from "@/lib/phase2-constants";
const payload=z.object({scope:z.enum(["men","women","academy"]),fullName:z.string().trim().min(3).max(140),birthDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),applicationId:z.string().uuid().optional(),userId:z.string().uuid().optional()});
export async function GET(req:NextRequest){const scope=req.nextUrl.searchParams.get("scope"),actor=await getIdentity(req);if(!actor)return fail(401);if(!isScope(scope))return fail(400);
 if(!await canAccess(actor,scope,"read"))return fail();
 const d=scoped(scope),teacher=rolesFor(actor,scopes[scope].code,"TEACHER"),privileged=rolesFor(actor,scopes[scope].code,"SUPERVISOR")||rolesFor(actor,scopes[scope].code,"RECEPTION")||rolesFor(actor,"SCHOOL","SUPER_ADMIN");
 const where=teacher&&!privileged?{enrollments:{some:{active:true,group:{teachers:{some:{userId:actor.id,active:true}}}}}}:{};
 await checkWomenRead(scope,actor,"STUDENT_LIST",null);
 const students=await d.students.findMany({where,orderBy:{createdAt:"desc"},take:120,select:{id:true,fullName:true,birthDate:true,active:true,enrollments:{where:{active:true},select:{group:{select:{id:true,nameAr:true}}}}}});
 return privateJson({students});}
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();let parsed;try{parsed=payload.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400,parsed.error.issues[0]?.message);
 const v=parsed.data,g=await guard(req,v.scope,"manage");if(isGuardError(g))return g;
 const d=scoped(v.scope);if(v.applicationId){const app=await d.applications.findUnique({where:{id:v.applicationId},select:{status:true}});if(!app||app.status!=="ACCEPTED")return fail(409,"يجب قبول الطلب قبل إنشاء ملف الطالب");}
 const date=new Date(v.birthDate+"T00:00:00Z");if(Number.isNaN(date.valueOf())||date>new Date())return fail(400,"تاريخ الميلاد غير صالح");
 const student=await d.client.$transaction(async(tx:any)=>{
  const row=await tx[`${scopes[v.scope].prefix}Student`].create({data:{fullName:v.fullName,birthDate:date,applicationId:v.applicationId,userId:v.userId}});
  await tx.auditEvent.create({data:{actorId:g.actor.id,action:"STUDENT_CREATE",scopeCode:scopes[v.scope].code,subjectType:"STUDENT",subjectId:row.id},select:{id:true}});return row;
 });return privateJson({id:student.id},201);
}
