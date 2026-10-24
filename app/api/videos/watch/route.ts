import {NextRequest} from "next/server";
import {getIdentity,fail,privateJson,auditRead} from "@/lib/phase2-auth";
import {isScope} from "@/lib/phase2-constants";
import {videoScope,canActorWatch,playback} from "@/lib/video";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(req:NextRequest){
 const scope=req.nextUrl.searchParams.get("scope"),id=req.nextUrl.searchParams.get("id");
 if(!isScope(scope)||!id||!uuid.test(id))return fail(400);
 const actor=await getIdentity(req);if(!actor&&scope!=="academy")return fail(401);
 const video=await videoScope(scope).videos.findUnique({where:{id}});
 if(!video||!await canActorWatch(actor,scope,video))return fail(404,"الفيديو غير متاح");
 if(scope==="women"&&actor)await auditRead(scope,actor,"VIDEO_PLAYBACK",id);
 try{return privateJson({iframeUrl:await playback(scope,video.providerUid),ttlSeconds:600});}catch{return fail(503,"تعذر تجهيز مشغل الفيديو");}
}
