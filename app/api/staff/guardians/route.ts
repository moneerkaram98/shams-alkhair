import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {scoped,guard,isGuardError} from "@/lib/phase2-data";
import {safeOrigin,fail,privateJson} from "@/lib/phase2-auth";
import {scopes} from "@/lib/phase2-constants";
const schema=z.object({scope:z.enum(["men","women","academy"]),studentId:z.string().uuid(),userId:z.string().uuid(),relationship:z.enum(["PARENT","LEGAL_GUARDIAN"])});
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();let parsed;try{parsed=schema.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400);const v=parsed.data,g=await guard(req,v.scope,"manage");if(isGuardError(g))return g;
 const user=await db("auth").appUser.findUnique({where:{id:v.userId},include:{roles:{include:{scope:true}}}});
 if(!user?.isActive || !user.roles.some(r=>r.active&&r.role==="PARENT"&&r.scope.code===scopes[v.scope].code))return fail(403,"ولي الأمر غير مخوّل لهذا القسم");
 const d=scoped(v.scope);if(!await d.students.findUnique({where:{id:v.studentId}}))return fail(404);
 const row=await d.client.$transaction(async(tx:any)=>{const entry=await tx[`${scopes[v.scope].prefix}GuardianLink`].upsert({where:{studentId_userId:{studentId:v.studentId,userId:v.userId}},update:{active:true,relationship:v.relationship},create:{studentId:v.studentId,userId:v.userId,relationship:v.relationship}});await tx.auditEvent.create({data:{actorId:g.actor.id,action:"GUARDIAN_LINK",scopeCode:scopes[v.scope].code,subjectType:"STUDENT",subjectId:v.studentId,metadata:{guardianUserId:v.userId}},select:{id:true}});return entry;});return privateJson({id:row.id});}
