import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {guard,isGuardError,scoped} from "@/lib/phase2-data";
import {fail,privateJson,safeOrigin} from "@/lib/phase2-auth";
import {scopes} from "@/lib/phase2-constants";
const schema=z.object({scope:z.enum(["men","women","academy"]),groupId:z.string().uuid(),userId:z.string().uuid()});
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();let parsed;try{parsed=schema.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400);const v=parsed.data,g=await guard(req,v.scope,"manage");if(isGuardError(g))return g;
 const teacher=await db("auth").appUser.findUnique({where:{id:v.userId},include:{roles:{include:{scope:true}}}});
 if(!teacher || !teacher.isActive || !teacher.roles.some(r=>r.active&&r.role==="TEACHER"&&r.scope.code===scopes[v.scope].code))return fail(400,"المعلم غير مخوّل بهذا القسم");
 if(v.scope==="women"&&teacher.gender!=="FEMALE"||v.scope==="men"&&teacher.gender!=="MALE")return fail(403,"جنس المعلم لا يناسب قسم التحفيظ المحدد");
 const d=scoped(v.scope),group=await d.groups.findUnique({where:{id:v.groupId}});if(!group)return fail(404);
 const row=await d.client.$transaction(async(tx:any)=>{const rec=await tx[`${scopes[v.scope].prefix}TeacherAssignment`].upsert({where:{userId_groupId:{userId:v.userId,groupId:v.groupId}},update:{active:true},create:{userId:v.userId,groupId:v.groupId}});await tx.auditEvent.create({data:{actorId:g.actor.id,action:"TEACHER_ASSIGN",scopeCode:scopes[v.scope].code,subjectType:"CLASS_GROUP",subjectId:v.groupId,metadata:{teacherUserId:v.userId}},select:{id:true}});return rec;});return privateJson({id:row.id});}
