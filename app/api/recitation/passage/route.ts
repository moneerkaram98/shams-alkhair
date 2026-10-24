import {NextRequest} from "next/server";
import {getIdentity,fail,privateJson} from "@/lib/phase2-auth";
import {passage,accessStudent,getPassage,getReferenceAudio} from "@/lib/recitation";
export async function GET(req:NextRequest){const v=passage.safeParse(Object.fromEntries(req.nextUrl.searchParams));if(!v.success)return fail(400,v.error.issues[0]?.message);const actor=await getIdentity(req);if(!actor)return fail(401);if(!await accessStudent(actor,v.data.scope,v.data.studentId))return fail(403);
 try{const verses=await getPassage(v.data.surahNumber,v.data.ayahFrom,v.data.ayahTo);const referenceAudio=await getReferenceAudio(v.data.surahNumber,v.data.ayahFrom,v.data.ayahTo).catch(()=>[]);return privateJson({verses,referenceAudio,source:"Quran Foundation · Uthmani",notice:"هذا هو النص العثماني الأصلي دون تعديل. التطبيع يستخدم للمقارنة البرمجية فقط."});}catch{return fail(503,"المصحف المرجعي غير مهيأ أو غير متاح؛ لن نعرض نصًا غير موثق.");}
}
