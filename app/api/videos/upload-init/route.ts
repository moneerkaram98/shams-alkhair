import {NextRequest} from "next/server";
import {z} from "zod";
import {safeOrigin,getIdentity,canAccess,rolesFor,privateJson,fail} from "@/lib/phase2-auth";
import {scopes} from "@/lib/phase2-constants";
import {reserveUpload,videoScope,validateVideoTarget,auditVideo} from "@/lib/video";
const body=z.object({scope:z.enum(["men","women","academy"]),title:z.string().trim().min(5).max(140),description:z.string().trim().max(1500).optional(),category:z.enum(["LESSON","QURAN","NOOR_BAYAN","TAJWEED","IJAZA","ACTIVITY"]),visibility:z.enum(["PUBLIC","ENROLLED","LEVEL","GROUP"]),levelId:z.string().uuid().optional(),groupId:z.string().uuid().optional(),fileSize:z.number().int().min(1).max(200*1024*1024),fileType:z.enum(["video/mp4","video/webm","video/quicktime"]),maxDurationMinutes:z.number().int().min(1).max(60)});
export async function POST(req:NextRequest){
 if(!safeOrigin(req))return fail(403);const actor=await getIdentity(req);if(!actor)return fail(401);
 let data;try{data=body.safeParse(await req.json());}catch{return fail(400);}
 if(!data.success)return fail(400,data.error.issues[0]?.message);
 const v=data.data,code=scopes[v.scope].code;
 const senior=rolesFor(actor,code,"SUPERVISOR")||rolesFor(actor,"SCHOOL","SUPER_ADMIN");
 const teacher=rolesFor(actor,code,"TEACHER");
 if(!teacher&&!senior||!await canAccess(actor,v.scope,"read"))return fail();
 if(!await validateVideoTarget(v.scope,v.visibility,v.groupId,v.levelId,actor))return fail(403,"لا يمكنك رفع فيديو خارج حلقاتك أو نطاق صلاحياتك");
 const d=videoScope(v.scope);
 const recent=await d.videos.count({where:{uploadedBy:actor.id,createdAt:{gte:new Date(Date.now()-24*3600*1000)}}});
 if(recent>=10)return fail(429,"الحد الأقصى عشرة فيديوهات خلال 24 ساعة");
 let upload;
 try{upload=await reserveUpload(v.scope,actor.id,v.maxDurationMinutes,v.title);}catch{return fail(503,"خدمة رفع الفيديو غير متاحة الآن");}
 try{const video=await d.videos.create({data:{title:v.title,description:v.description,category:v.category,visibility:v.visibility,levelId:v.levelId,groupId:v.groupId,uploadedBy:actor.id,providerUid:upload.uid,status:"UPLOADING",reviewStatus:"PENDING"},select:{id:true}});
 await auditVideo(v.scope,actor.id,"VIDEO_UPLOAD_RESERVED",video.id);
 return privateJson({id:video.id,uploadURL:upload.url,expiresInSeconds:1800},201);
 }catch{return fail(503,"تعذر تسجيل رفع الفيديو؛ تواصل مع الإدارة لإلغاء الرفع المحجوز");}
}
