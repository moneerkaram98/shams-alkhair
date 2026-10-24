import { NextRequest,NextResponse } from "next/server";
import { bookingSchema } from "@/lib/registration";
import { reservePlacement, ApiError } from "@/lib/admissions";
import { allowedOrigin, isRateLimited } from "@/lib/api-guards";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 if(!allowedOrigin(req))return NextResponse.json({error:"مصدر طلب غير مسموح"},{status:403});
 if(isRateLimited(req))return NextResponse.json({error:"محاولات كثيرة، حاول لاحقًا"},{status:429});
 if(!req.headers.get("content-type")?.startsWith("application/json"))return NextResponse.json({error:"JSON مطلوب"},{status:415});
 try{
  const parsed=bookingSchema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:"بيانات الحجز غير صحيحة"},{status:400});
  const booking=await reservePlacement(parsed.data);
  return NextResponse.json({bookingId:booking.id},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(e instanceof ApiError)return NextResponse.json({error:e.message},{status:e.status});
  console.error("Placement booking failed:", e instanceof Error?e.name:"unknown");
  return NextResponse.json({error:"تعذر الحجز، يرجى المحاولة مرة أخرى"},{status:500});
 }
}
