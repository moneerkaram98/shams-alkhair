import {NextRequest} from "next/server";
import {getIdentity,rolesFor,canAccess,fail,privateJson,auditRead} from "@/lib/phase2-auth";
import {scopes,isScope} from "@/lib/phase2-constants";
import {scoped} from "@/lib/phase2-data";
export async function GET(req:NextRequest){
 const scope=req.nextUrl.searchParams.get("scope");if(!isScope(scope))return fail(400);
 const actor=await getIdentity(req);if(!actor||!await canAccess(actor,scope,"read"))return fail(403);
 const code=scopes[scope].code;
 const senior=rolesFor(actor,"SCHOOL","SUPER_ADMIN")||rolesFor(actor,code,"SUPERVISOR"),teacher=rolesFor(actor,code,"TEACHER");
 if(!senior&&!teacher)return fail(403);
 const d=scoped(scope);
 const rows=await d.groups.findMany({where:{active:true,...(senior?{}:{teachers:{some:{userId:actor.id,active:true}}})},select:{id:true,nameAr:true,levelId:true},take:150,orderBy:{nameAr:"asc"}});
 if(scope==="women")await auditRead(scope,actor,"VIDEO_GROUP_TARGETS",null);
 const levels=Array.from(new Map(rows.filter((r:any)=>r.levelId).map((r:any)=>[r.levelId,{id:r.levelId,label:`مستوى حلقة ${r.nameAr}`}])).values());
 return privateJson({groups:rows,levels,teacherOnly:teacher&&!senior});
}
