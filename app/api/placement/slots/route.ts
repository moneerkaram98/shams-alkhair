import { NextRequest,NextResponse } from "next/server";
import { slotListSchema } from "@/lib/registration";
import { availableSlotsForApplicant,ApiError } from "@/lib/admissions";
import { allowedOrigin,isRateLimited } from "@/lib/api-guards";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 if(!allowedOrigin(req))return NextResponse.json({error:"مصدر طلب غير مسموح"},{status:403});
 if(isRateLimited(req))return NextResponse.json({error:"محاولات كثيرة، حاول لاحقًا"},{status:429});
 if(!req.headers.get("content-type")?.startsWith("application/json"))return NextResponse.json({error:"JSON مطلوب"},{status:415});
 try{
  const parsed=slotListSchema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:"بيانات الطلب غير صحيحة"},{status:400});
  return NextResponse.json({slots:await availableSlotsForApplicant(parsed.data)},{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(e instanceof ApiError)return NextResponse.json({error:e.message},{status:e.status});
  return NextResponse.json({error:"تعذر قراءة المواعيد"},{status:500});
 }
}
