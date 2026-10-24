import {NextRequest,NextResponse} from "next/server";
import {models} from "@/lib/stage6";
import type {Scope} from "@/lib/phase2-constants";
export const runtime="nodejs";
/** Public lookup purposely never reveals name, birth date, sanad, section or enrolment. */
export async function GET(req:NextRequest){
 const code=req.nextUrl.searchParams.get("code")??"";
 const scope:Scope|undefined=code.startsWith("M_")?"men":code.startsWith("W_")?"women":code.startsWith("A_")?"academy":undefined;
 if(!scope||!(/^[MWA]_[A-Za-z0-9_-]{32}$/.test(code)))return NextResponse.json({valid:false},{headers:{"Cache-Control":"no-store"}});
 try{
  const certificate=await models(scope).cert.findUnique({where:{verifyCode:code},select:{serial:true,kind:true,revokedAt:true,publicVerification:true,approvedAt:true}});
  const valid=Boolean(certificate?.publicVerification&&certificate?.approvedAt&&!certificate?.revokedAt);
  return NextResponse.json(valid?{valid:true,serial:certificate.serial,kind:certificate.kind}:{valid:false},{headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"}});
 }catch{return NextResponse.json({valid:false},{status:503,headers:{"Cache-Control":"no-store"}});}
}
