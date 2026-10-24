import { NextRequest, NextResponse } from "next/server";
import { createAdmission } from "@/lib/admissions";
import { registrationSchema } from "@/lib/registration";
import { allowedOrigin, isRateLimited } from "@/lib/api-guards";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 if(!allowedOrigin(req))return NextResponse.json({error:"مصدر طلب غير مسموح"},{status:403});
 if(isRateLimited(req))return NextResponse.json({error:"محاولات كثيرة، حاول لاحقًا"},{status:429});
 if(!req.headers.get("content-type")?.startsWith("application/json"))return NextResponse.json({error:"JSON مطلوب"},{status:415});
 try{
  const parsed=registrationSchema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:"البيانات غير صحيحة",issues:parsed.error.flatten().fieldErrors},{status:400});
  const result=await createAdmission(parsed.data);
  return NextResponse.json(result,{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){
  // Never log registration payloads or access tokens.
  console.error("Registration failed:",error instanceof Error?error.name:"unknown");
  return NextResponse.json({error:"تعذر حفظ الطلب، يرجى المحاولة مرة أخرى"},{status:500});
 }
}
