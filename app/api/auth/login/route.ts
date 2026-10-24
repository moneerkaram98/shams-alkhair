import { NextRequest,NextResponse } from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {hashPassword,verifyPassword,newToken,hashToken,applySessionCookie,safeOrigin,fail} from "@/lib/phase2-auth";
export const runtime="nodejs";
const input=z.object({email:z.string().email().max(255),password:z.string().min(1).max(512)});
// Equalize the scrypt work for unknown/inactive users to reduce account enumeration.
const DUMMY_HASH=hashPassword("dummy-account-cannot-login");
export async function POST(req:NextRequest){
 if(!safeOrigin(req))return fail(403);
 if(!req.headers.get("content-type")?.startsWith("application/json"))return fail(415);
 let parsed;try{parsed=input.safeParse(await req.json())}catch{return fail(400)}
 if(!parsed.success)return fail(400);
 const email=parsed.data.email.toLowerCase().trim(),password=parsed.data.password;
 // Serialize password attempts for one email across ALL app instances. The lock,
 // failed-attempt update and session creation run in the same DB transaction.
 // This prevents concurrent guesses from reading the same stale failedLogins.
 const session=await db("auth").$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 AS lock_acquired FROM pg_advisory_xact_lock(hashtext(${email})::bigint)`;
  const user=await tx.appUser.findUnique({where:{email},select:{id:true,isActive:true,passwordHash:true,lockedUntil:true,failedLogins:true}});
  const now=new Date();
  if(!user||!user.isActive||(user.lockedUntil&&user.lockedUntil>now)){
   verifyPassword(password,DUMMY_HASH);
   return null;
  }
  if(!verifyPassword(password,user.passwordHash)){
   const failed=user.failedLogins+1;
   await tx.appUser.update({where:{id:user.id},data:{failedLogins:failed>=6?0:failed,lockedUntil:failed>=6?new Date(Date.now()+15*60*1000):null}});
   return null;
  }
  const token=newToken(),expiresAt=new Date(Date.now()+7*24*60*60*1000);
  await tx.appUser.update({where:{id:user.id},data:{failedLogins:0,lockedUntil:null}});
  await tx.authSession.create({data:{userId:user.id,tokenHash:hashToken(token),expiresAt}});
  return {token,expiresAt};
 });
 if(!session)return fail(401,"بيانات الدخول غير صحيحة أو الحساب مقفل مؤقتًا");
 const res=NextResponse.json({ok:true});
 applySessionCookie(res,session.token,session.expiresAt);
 res.headers.set("Cache-Control","no-store");
 return res;
}
