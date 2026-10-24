import {NextRequest} from "next/server";
import {z} from "zod";
import {getIdentity,fail,privateJson,safeOrigin,rolesFor} from "@/lib/phase2-auth";
import {familyAccess} from "@/lib/phase3";
import {scopes} from "@/lib/phase2-constants";
import {uuid,recitationModels,auditRecitation} from "@/lib/recitation";
const input=z.object({scope:z.enum(["men","women","academy"]),studentId:uuid,consent:z.boolean(),privacyVersion:z.literal("2026-10")});
async function consentChange(req:NextRequest){if(!safeOrigin(req))return fail(403);const v=input.safeParse(await req.json().catch(()=>null));if(!v.success)return fail(400);const actor=await getIdentity(req);if(!actor)return fail(401);
 const {scope,studentId,consent}=v.data;const relation=await familyAccess(actor,scope,studentId);if(!relation)return fail(403);
 const d=recitationModels(scope);const student=await d.students.findUnique({where:{id:studentId},select:{birthDate:true,userId:true}});if(!student)return fail(404);
 const minor=(Date.now()-new Date(student.birthDate).getTime())<18*365.2425*86400000;
 if(minor){if(relation!=="PARENT")return fail(403,"موافقة ولي الأمر مطلوبة قبل تسجيل طفل");}
 else if(relation!=="STUDENT" || student.userId!==actor.id)return fail(403,"الموافقة للطالب البالغ نفسه");
 await d.consents.upsert({where:{studentId_grantedBy:{studentId,grantedBy:actor.id}},create:{studentId,grantedBy:actor.id,acceptedPrivacyVersion:v.data.privacyVersion,...(consent?{}:{revokedAt:new Date()})},update:{acceptedPrivacyVersion:v.data.privacyVersion,grantedAt:new Date(),revokedAt:consent?null:new Date()}});
 await auditRecitation(scope,actor.id,consent?"RECITATION_CONSENT_GRANT":"RECITATION_CONSENT_REVOKE",studentId);
 return privateJson({active:consent,notice:consent?"تم تسجيل الموافقة":"تم إلغاء الموافقة. احذف التسجيلات السابقة من لوحة التحكم عند الحاجة."});
}
export const POST=consentChange;
