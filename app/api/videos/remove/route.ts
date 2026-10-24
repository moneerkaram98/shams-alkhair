import {NextRequest} from "next/server";
import {z} from "zod";
import {safeOrigin,getIdentity,rolesFor,canAccess,fail,privateJson} from "@/lib/phase2-auth";
import {scopes} from "@/lib/phase2-constants";
import {videoScope,auditVideo,streamApi} from "@/lib/video";
const schema=z.object({scope:z.enum(["men","women","academy"]),videoId:z.string().uuid()});
export async function POST(req:NextRequest){
 if(!safeOrigin(req))return fail();const actor=await getIdentity(req);if(!actor)return fail(401);
 let q;try{q=schema.safeParse(await req.json());}catch{return fail(400);}
 if(!q.success)return fail(400);const {scope,videoId}=q.data;
 const senior=rolesFor(actor,scopes[scope].code,"SUPERVISOR")||rolesFor(actor,"SCHOOL","SUPER_ADMIN");
 if(!senior||!await canAccess(actor,scope,"manage"))return fail();
 const {videos}=videoScope(scope),v=await videos.findUnique({where:{id:videoId}});if(!v)return fail(404);
 if(v.deletedAt)return privateJson({deleted:true});
 // Hide before sending provider deletion so concurrent viewers are denied immediately.
 await videos.update({where:{id:videoId},data:{deletedAt:new Date(),publishedAt:null}});
 await auditVideo(scope,actor.id,"VIDEO_DELETE_REQUEST",videoId);
 try{await streamApi(scope,`/${v.providerUid}`,{method:"DELETE"});await auditVideo(scope,actor.id,"VIDEO_PROVIDER_DELETED",videoId);return privateJson({deleted:true});}
 catch{return privateJson({hidden:true,providerDeletionPending:true},202);} // requires reconciliation by admin
}
