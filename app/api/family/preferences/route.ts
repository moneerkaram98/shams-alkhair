import {NextRequest} from "next/server";
import {z} from "zod";
import {fail,privateJson,safeOrigin} from "@/lib/phase2-auth";
import {isFailure,privateFamilyCheck,phase3Models,scopeSchema,uuid} from "@/lib/phase3";
const schema=z.object({scope:scopeSchema,studentId:uuid,weekly:z.boolean(),monthly:z.boolean(),inApp:z.boolean(),email:z.boolean()});
export async function GET(req:NextRequest){const q=req.nextUrl.searchParams;const g=await privateFamilyCheck(req,q.get("scope"),q.get("studentId"));if(isFailure(g))return g;
 if(g.relationship!=="PARENT")return fail(403);const d=phase3Models(g.scope);
 const p=await d.prefs.findUnique({where:{studentId_guardianUserId:{studentId:g.studentId,guardianUserId:g.actor.id}}});
 return privateJson({preference:p?{weekly:p.weekly,monthly:p.monthly,inApp:p.inApp,email:p.email,requireTeacherApproval:p.requireTeacherApproval}:{weekly:true,monthly:true,inApp:true,email:false,requireTeacherApproval:true}});
}
export async function PUT(req:NextRequest){if(!safeOrigin(req))return fail();const b=schema.safeParse(await req.json().catch(()=>null));if(!b.success)return fail(400);
 const g=await privateFamilyCheck(req,b.data.scope,b.data.studentId);if(isFailure(g))return g;if(g.relationship!=="PARENT")return fail(403);
 const d=phase3Models(g.scope);const x=b.data;
 await d.prefs.upsert({where:{studentId_guardianUserId:{studentId:g.studentId,guardianUserId:g.actor.id}},create:{studentId:g.studentId,guardianUserId:g.actor.id,weekly:x.weekly,monthly:x.monthly,inApp:x.inApp,email:x.email,emailOptInAt:x.email?new Date():null},update:{weekly:x.weekly,monthly:x.monthly,inApp:x.inApp,email:x.email,emailOptInAt:x.email?new Date():null}});
 return privateJson({success:true});
}
