import {NextRequest} from "next/server";
import {z} from "zod";
import {isScope} from "@/lib/phase2-constants";
import {webhookValid,videoScope} from "@/lib/video";
import {fail,privateJson} from "@/lib/phase2-auth";
const payload=z.object({uid:z.string().regex(/^[a-f0-9]{32}$/i),readyToStream:z.boolean().optional(),status:z.object({state:z.string(),pctComplete:z.union([z.string(),z.number()]).optional()}).optional(),duration:z.number().min(0).optional()});
export async function POST(req:NextRequest){
 const scope=req.nextUrl.searchParams.get("scope");if(!isScope(scope))return fail(404);
 const secret=process.env[`VIDEO_CF_WEBHOOK_${scope.toUpperCase()}`];
 const raw=await req.text();if(raw.length>30000||!secret||!webhookValid(raw,req.headers.get("Webhook-Signature"),secret))return fail(401);
 let parsed;try{parsed=payload.safeParse(JSON.parse(raw));}catch{return fail(400);}if(!parsed.success)return fail(400);
 const v=parsed.data,client=videoScope(scope);
 const state=v.status?.state?.toLowerCase();const next=state==="error"?"ERROR":state==="ready"&&v.readyToStream===true?"READY":"PROCESSING";
 await client.videos.updateMany({where:{providerUid:v.uid,deletedAt:null,status:{not:"ERROR"}},data:{status:next,...(v.duration!=null?{durationSeconds:v.duration}:{})}});
 return privateJson({received:true});
}
