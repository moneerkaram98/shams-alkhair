import {NextRequest} from "next/server";
import {z} from "zod";
import {safeOrigin,getIdentity,rolesFor,canAccess,fail,privateJson} from "@/lib/phase2-auth";
import {scopes} from "@/lib/phase2-constants";
import {videoScope,auditVideo} from "@/lib/video";
const request=z.object({scope:z.enum(["men","women","academy"]),videoId:z.string().uuid(),decision:z.enum(["APPROVED","REJECTED"])});
export async function POST(req:NextRequest){
 if(!safeOrigin(req))return fail();const actor=await getIdentity(req);if(!actor)return fail(401);
 let parsed;try{parsed=request.safeParse(await req.json());}catch{return fail(400);}
 if(!parsed.success)return fail(400);
 const {scope,videoId,decision}=parsed.data,code=scopes[scope].code;
 const supervisor=rolesFor(actor,code,"SUPERVISOR")||rolesFor(actor,"SCHOOL","SUPER_ADMIN");
 if(!supervisor||!await canAccess(actor,scope,"supervise"))return fail();
 const db=videoScope(scope),video=await db.videos.findUnique({where:{id:videoId}});
 if(!video||video.deletedAt)return fail(404);
 if(video.uploadedBy===actor.id)return fail(403,"تستلزم الموافقة مراجعة مستقلة عن صاحب الرفع");
 if(decision==="APPROVED"&&video.status!=="READY")return fail(409,"الفيديو لم تكتمل معالجته");
 const changed=await db.videos.updateMany({where:{id:videoId,deletedAt:null,reviewStatus:"PENDING",...(decision==="APPROVED"?{status:"READY"}:{})},data:{reviewStatus:decision,reviewedBy:actor.id,reviewedAt:new Date(),publishedAt:decision==="APPROVED"?new Date():null}});
 if(!changed.count)return fail(409,"سبق مراجعة الفيديو أو تغيّرت حالته");
 await auditVideo(scope,actor.id,`VIDEO_${decision}`,videoId);
 return privateJson({status:decision});
}
