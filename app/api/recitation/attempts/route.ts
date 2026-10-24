import {NextRequest} from "next/server";
import {randomUUID} from "node:crypto";
import {getIdentity,fail,privateJson,safeOrigin} from "@/lib/phase2-auth";
import {getPassage,recitationModels,passage,canUpload,accessStudent,validConsent,putAudio,deleteAudio,safeAudio,sha256,auditRecitation} from "@/lib/recitation";
import {isScope} from "@/lib/phase2-constants";
import {z} from "zod";
export async function GET(req:NextRequest){const q=req.nextUrl.searchParams,scope=q.get("scope"),studentId=q.get("studentId");if(!isScope(scope)||!z.string().uuid().safeParse(studentId).success)return fail(400);const actor=await getIdentity(req);if(!actor)return fail(401);if(!await accessStudent(actor,scope,studentId!))return fail(403);const d=recitationModels(scope);const attempts=await d.attempts.findMany({where:{studentId:studentId!,state:{not:"DELETED"}},orderBy:{submittedAt:"desc"},take:35,select:{id:true,surahNumber:true,ayahFrom:true,ayahTo:true,submittedAt:true,state:true,transcript:true,alignment:true,provisionalMatch:true,provider:true,failureCode:true,teacherMastery:true,teacherMemoryErrors:true,teacherTajweedErrors:true,teacherMakharijErrors:true,teacherComment:true,reviewedAt:true}});if(scope==="women")await auditRecitation(scope,actor.id,"RECITATION_LIST_READ",studentId!);return privateJson({attempts});}
export async function POST(req:NextRequest){if(!safeOrigin(req))return fail(403);if(Number(req.headers.get("content-length")||0)>13*1024*1024)return fail(413,"التسجيل كبير جدًا");const actor=await getIdentity(req);if(!actor)return fail(401);
 const f=await req.formData().catch(()=>null);if(!f)return fail(400);
 const v=passage.safeParse({scope:f.get("scope"),studentId:f.get("studentId"),surahNumber:f.get("surahNumber"),ayahFrom:f.get("ayahFrom"),ayahTo:f.get("ayahTo"),...(f.get("groupId")?{groupId:f.get("groupId")}: {})});if(!v.success)return fail(400,v.error.issues[0]?.message);const {scope,studentId,surahNumber,ayahFrom,ayahTo,groupId}=v.data;
 if(!await canUpload(actor,scope,studentId))return fail(403,"التسميع متاح للطالب أو ولي الأمر المرتبط به");if(!await validConsent(actor,scope,studentId))return fail(403,"يجب تسجيل موافقة صالحة أولًا");
 const d=recitationModels(scope);if(groupId&&!await d.enrollments.findFirst({where:{studentId,groupId,active:true},select:{id:true}}))return fail(403,"الطالب غير مسجل في الحلقة");
 const audio=f.get("audio");if(!(audio instanceof File))return fail(400,"ملف الصوت مطلوب");if(audio.size>12*1024*1024)return fail(413,"الحد 12 ميجابايت");const mime=audio.type.toLowerCase().split(";")[0];const bytes=Buffer.from(await audio.arrayBuffer());if(!safeAudio(bytes,mime))return fail(415,"صيغة التسجيل غير معتمدة");
 const count=await d.attempts.count({where:{studentId,submittedAt:{gte:new Date(Date.now()-60*60*1000)}}});if(count>=5)return fail(429,"الحد الأقصى خمس محاولات في الساعة");
 try{await getPassage(surahNumber,ayahFrom,ayahTo);}catch{return fail(503,"تعذر التحقق من نص الآيات من المصدر الموثوق");}
 const id=randomUUID(),key=`recitations/${studentId}/${id}`;
 try{await putAudio(scope,key,bytes,mime);}catch{return fail(503,"تعذر تخزين التسجيل بصورة آمنة");}
 try{const item=await d.attempts.create({data:{id,studentId,uploadedBy:actor.id,groupId,surahNumber,ayahFrom,ayahTo,storageKey:key,contentType:mime,byteSize:bytes.length,sha256:sha256(bytes)}});await auditRecitation(scope,actor.id,"RECITATION_UPLOAD",id);return privateJson({id:item.id,state:"QUEUED",message:"تم حفظ التسجيل في مساحة خاصة؛ ستتم المقارنة عند تشغيل معالج التسميع"},201);}catch{try{const {deleteAudio}=await import("@/lib/recitation");await deleteAudio(scope,key);}catch{}return fail(500,"تعذر حفظ المحاولة");}
}

// Self-service deletion removes the audio object AND transcription. Academic scores already
// confirmed by a teacher remain in the separate learning record (required school record).
export async function DELETE(req:NextRequest){if(!safeOrigin(req))return fail(403);const actor=await getIdentity(req);if(!actor)return fail(401);const input=z.object({scope:z.enum(["men","women","academy"]),attemptId:z.string().uuid()}).safeParse(await req.json().catch(()=>null));if(!input.success)return fail(400);
 const {scope,attemptId}=input.data,d=recitationModels(scope);const attempt=await d.attempts.findUnique({where:{id:attemptId}});if(!attempt)return fail(404);if(!await canUpload(actor,scope,attempt.studentId))return fail(403);
 if(attempt.state==="PROCESSING")return fail(409,"التسجيل قيد المعالجة؛ حاول بعد انتهائها");
 try{await deleteAudio(scope,attempt.storageKey);}catch{return fail(503,"تعذر حذف الملف الصوتي من التخزين؛ لم يتم تأكيد الحذف");}
 await d.attempts.update({where:{id:attemptId},data:{state:"DELETED",transcript:null,alignment:{},provisionalMatch:null,provider:null,sha256:"deleted",failureCode:null}});
 await auditRecitation(scope,actor.id,"RECITATION_AUDIO_DELETE",attemptId);return privateJson({deleted:true});
}
