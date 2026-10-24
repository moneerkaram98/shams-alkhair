import {NextRequest} from "next/server";
import {z} from "zod";
import {guard,isGuardError,scoped,checkWomenRead} from "@/lib/phase2-data";
import {getIdentity,canAccess,rolesFor,fail,privateJson,safeOrigin} from "@/lib/phase2-auth";
import {isScope,scopes} from "@/lib/phase2-constants";
const create=z.object({scope:z.enum(["men","women","academy"]),groupId:z.string().uuid(),startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true})});
export async function GET(req:NextRequest){const scope=req.nextUrl.searchParams.get("scope"),groupId=req.nextUrl.searchParams.get("groupId");if(!isScope(scope)||!groupId)return fail(400);
 const g=await guard(req,scope,"read",groupId);if(isGuardError(g))return g;await checkWomenRead(scope,g.actor,"LESSON_SESSION_LIST",groupId);
 const sessions=await scoped(scope).sessions.findMany({where:{groupId},orderBy:{startsAt:"desc"},take:50});return privateJson({sessions});}
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail();let parsed;try{parsed=create.safeParse(await req.json())}catch{return fail(400)}if(!parsed.success)return fail(400);
 const v=parsed.data,g=await guard(req,v.scope,"manage");if(isGuardError(g))return g;const start=new Date(v.startsAt),end=new Date(v.endsAt);if(end<=start||end.valueOf()-start.valueOf()>6*3600000)return fail(400,"وقت الحصة غير صحيح");const d=scoped(v.scope);if(!await d.groups.findUnique({where:{id:v.groupId}}))return fail(404);
 try{const created=await d.client.$transaction(async(tx:any)=>{const row=await tx[`${scopes[v.scope].prefix}LessonSession`].create({data:{groupId:v.groupId,startsAt:start,endsAt:end}});await tx.auditEvent.create({data:{actorId:g.actor.id,scopeCode:scopes[v.scope].code,action:"SESSION_CREATE",subjectType:"LESSON_SESSION",subjectId:row.id},select:{id:true}});return row;});return privateJson({id:created.id},201);}catch{return fail(409,"قد توجد حصة في نفس التوقيت");}
}
