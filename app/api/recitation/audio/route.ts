import {NextRequest,NextResponse} from "next/server";
import {authorizedAttempt,getAudio,auditRecitation} from "@/lib/recitation";
export async function GET(req:NextRequest){const g=await authorizedAttempt(req,req.nextUrl.searchParams.get("scope"),req.nextUrl.searchParams.get("id"));if(g instanceof Response)return g;
 try{const audio=await getAudio(g.scope,g.item.storageKey);if(g.scope==="women")await auditRecitation(g.scope,g.actor.id,"RECITATION_AUDIO_READ",g.item.id);return new NextResponse(new Uint8Array(audio),{headers:{"Content-Type":g.item.contentType,"Content-Length":String(audio.length),"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Disposition":"inline"}});}catch{return NextResponse.json({error:"التسجيل غير متاح"},{status:404,headers:{"Cache-Control":"no-store"}});}
}
