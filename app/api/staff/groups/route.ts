import {NextRequest} from "next/server";
import {z} from "zod";
import {guard,isGuardError,scoped,checkWomenRead} from "@/lib/phase2-data";
import {getIdentity,canAccess,fail,privateJson,safeOrigin,rolesFor} from "@/lib/phase2-auth";
import {isScope,scopes} from "@/lib/phase2-constants";
const create=z.object({scope:z.enum(["men","women","academy"]),nameAr:z.string().trim().min(2).max(90),department:z.enum(["NURSERY","TAJWEED","IJAZAT"]).optional(),capacity:z.number().int().min(1).max(80)});
export async function GET(req:NextRequest){const scope=req.nextUrl.searchParams.get("scope"),actor=await getIdentity(req);if(!actor)return fail(401);if(!isScope(scope))return fail(400);if(!await canAccess(actor,scope,"read"))return fail();
 const d=scoped(scope),teacher=rolesFor(actor,scopes[scope].code,"TEACHER"),privileged=rolesFor(actor,scopes[scope].code,"SUPERVISOR")||rolesFor(actor,scopes[scope].code,"RECEPTION")||rolesFor(actor,"SCHOOL","SUPER_ADMIN");
 await checkWomenRead(scope,actor,"CLASS_GROUP_LIST",null);
 const groups=await d.groups.findMany({where:teacher&&!privileged?{teachers:{some:{userId:actor.id,active:true}}}:{},orderBy:{createdAt:"desc"},take:100,include:{_count:{select:{enrollments:true,sessions:true}}}});return privateJson({groups});}
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();let parsed;try{parsed=create.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400);
 const v=parsed.data,g=await guard(req,v.scope,"manage");if(isGuardError(g))return g;const d=scoped(v.scope);if(v.scope==="academy"&&!v.department)return fail(400,"حدد القسم الأكاديمي");
 const created=await d.client.$transaction(async(tx:any)=>{const row=await tx[`${scopes[v.scope].prefix}ClassGroup`].create({data:{nameAr:v.nameAr,capacity:v.capacity,...(v.scope==="academy"?{department:v.department}:{})}});await tx.auditEvent.create({data:{actorId:g.actor.id,action:"GROUP_CREATE",scopeCode:scopes[v.scope].code,subjectType:"CLASS_GROUP",subjectId:row.id},select:{id:true}});return row;});return privateJson({id:created.id},201);}
