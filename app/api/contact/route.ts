import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {contactSchema} from "@/lib/contact";
import {allowedOrigin,isRateLimited} from "@/lib/api-guards";
export const runtime="nodejs";
export async function POST(req:NextRequest){
  if(!allowedOrigin(req))return NextResponse.json({error:"مصدر الطلب غير مسموح"},{status:403});
  if(isRateLimited(req))return NextResponse.json({error:"محاولات كثيرة، حاول لاحقًا"},{status:429});
  if(!req.headers.get("content-type")?.startsWith("application/json"))return NextResponse.json({error:"JSON مطلوب"},{status:415});
  try{
    const parsed=contactSchema.safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({error:"تحقق من حقول الرسالة"},{status:400});
    const {name,email,phone,topic,message}=parsed.data;
    await db("contact").contactInquiry.create({data:{name,email:email||null,phone,topic,message,consentAt:new Date()},select:{id:true}});
    return NextResponse.json({ok:true},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch {return NextResponse.json({error:"تعذر إرسال الرسالة. حاول لاحقًا"},{status:500});}
}
