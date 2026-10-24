import {NextRequest} from "next/server";
import {getIdentity,canAccess,rolesFor,privateJson,fail,auditRead} from "@/lib/phase2-auth";
import {isScope,scopes} from "@/lib/phase2-constants";
import {videoScope,canActorWatch} from "@/lib/video";
export const dynamic="force-dynamic";
// Catalog is never a substitute for playback authorization: signed token requires a fresh check.
export async function GET(req:NextRequest){
 const scope=req.nextUrl.searchParams.get("scope")||"academy";if(!isScope(scope))return fail(400);
 const actor=await getIdentity(req),manage=req.nextUrl.searchParams.get("manage")==="1";
 if(manage && (!actor || !await canAccess(actor,scope,"read") || !actor.roles.some(r=>r.code===scopes[scope].code&&["TEACHER","SUPERVISOR"].includes(r.role)||r.code==="SCHOOL"&&r.role==="SUPER_ADMIN")))return fail(403);
 if(scope!=="academy"&&!actor)return fail(401);
 const {videos}=videoScope(scope);
 const conditions=manage?{deletedAt:null}:{deletedAt:null,status:"READY",reviewStatus:"APPROVED",publishedAt:{not:null}};
 const rows=await videos.findMany({where:conditions,orderBy:{createdAt:"desc"},take:100,select:{id:true,title:true,description:true,category:true,levelId:true,groupId:true,visibility:true,status:true,reviewStatus:true,publishedAt:true,deletedAt:true,durationSeconds:true,uploadedBy:true,createdAt:true}});
 const result=[];
 for(const row of rows){if(manage){const senior=rolesFor(actor!,"SCHOOL","SUPER_ADMIN")||rolesFor(actor!,scopes[scope].code,"SUPERVISOR");
 if(senior){result.push(row);continue;}
 if(row.uploadedBy===actor!.id)result.push(row);
 }else if(await canActorWatch(actor,scope,row))result.push({id:row.id,title:row.title,description:row.description,category:row.category,visibility:row.visibility,durationSeconds:row.durationSeconds,publishedAt:row.publishedAt});}
 if(scope==="women"&&actor)await auditRead(scope,actor,"VIDEO_CATALOG",null);
 return privateJson({videos:result});
}
