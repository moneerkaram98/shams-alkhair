import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {COOKIE,hashToken,safeOrigin,fail} from "@/lib/phase2-auth";
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail(403);const token=req.cookies.get(COOKIE)?.value;
 if(token)await db("auth").authSession.updateMany({where:{tokenHash:hashToken(token)},data:{revokedAt:new Date()}});
 const res=NextResponse.json({ok:true});res.cookies.set(COOKIE,"",{httpOnly:true,path:"/",maxAge:0});return res;}
