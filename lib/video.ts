import "server-only";
import {createHmac,timingSafeEqual} from "node:crypto";
import {NextRequest} from "next/server";
import {Identity,canAccess,rolesFor,fail,auditRead} from "@/lib/phase2-auth";
import {Scope,scopes} from "@/lib/phase2-constants";
import {scoped} from "@/lib/phase2-data";
import {db} from "@/lib/db";
import {familyAccess} from "@/lib/phase3";
import {canViewVideo,validateVisibility} from "@/lib/video-policy.mjs";
export {canViewVideo,validateVisibility};
export const videoScope=(scope:Scope)=>({client:scoped(scope).client,videos:(scoped(scope).client as any)[`${scopes[scope].prefix}Video`]});
const envSuffix:Record<Scope,string>={men:"MEN",women:"WOMEN",academy:"ACADEMY"};
function config(scope:Scope){const n=envSuffix[scope],id=process.env[`VIDEO_CF_ACCOUNT_${n}`],token=process.env[`VIDEO_CF_TOKEN_${n}`],customer=process.env[`VIDEO_CF_CUSTOMER_${n}`];
 if(!id||!token||!customer||!/^customer-[a-z0-9-]+$/i.test(customer))throw Error(`VIDEO_PROVIDER_NOT_CONFIGURED_${n}`);
 const ids=(["MEN","WOMEN","ACADEMY"] as const).map(s=>process.env[`VIDEO_CF_ACCOUNT_${s}`]).filter(Boolean);
 if(new Set(ids).size!==ids.length)throw Error("VIDEO_PROVIDER_ACCOUNTS_MUST_BE_DISTINCT");
 return {id,token,customer};}
export async function streamApi(scope:Scope,path:string,opts:RequestInit={}){
 const {id,token}=config(scope);if(!path.startsWith("/"))throw Error("INVALID_PATH");
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),16000);
 try{const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(id)}/stream${path}`,{...opts,headers:{Authorization:`Bearer ${token}`,...(opts.body?{"Content-Type":"application/json"}:{}),...(opts.headers||{})},signal:controller.signal,cache:"no-store"});
 const result=await response.json() as {success?:boolean;result?:any};if(!response.ok||result.success!==true)throw Error("VIDEO_PROVIDER_FAILED");return result.result;
 }finally{clearTimeout(timeout);}}
export async function reserveUpload(scope:Scope,ownerId:string,minutes:number,title:string){
 const result=await streamApi(scope,"/direct_upload",{method:"POST",body:JSON.stringify({maxDurationSeconds:Math.min(3600,Math.max(60,Math.ceil(minutes*60))),expiry:new Date(Date.now()+30*60*1000).toISOString(),requireSignedURLs:true,creator:ownerId.slice(0,64),meta:{name:title.slice(0,120)}})});
 if(!result || typeof result.uid!=="string"||!/^[a-f0-9]{32}$/i.test(result.uid))throw Error("VIDEO_PROVIDER_INVALID_UID");
 if(typeof result.uploadURL!=="string")throw Error("VIDEO_PROVIDER_INVALID_URL");const upload=new URL(result.uploadURL);
 if(upload.protocol!=="https:"||upload.hostname!=="upload.videodelivery.net")throw Error("VIDEO_PROVIDER_INVALID_UPLOAD_URL");
 return {uid:result.uid as string,url:upload.toString()};
}
export async function playback(scope:Scope,uid:string){if(!/^[a-f0-9]{32}$/i.test(uid))throw Error("INVALID_UID");
 const response=await streamApi(scope,`/${uid}/token`,{method:"POST",body:JSON.stringify({exp:Math.floor(Date.now()/1000)+600})});
 if(!response?.token||typeof response.token!=="string")throw Error("STREAM_TOKEN_INVALID");return `https://${config(scope).customer}.cloudflarestream.com/${encodeURIComponent(response.token)}/iframe`;
}
export function webhookValid(raw:string,header:string|null,secret:string){
 if(!header||!secret)return false;const match=/^time=(\d+),sig1=([a-f0-9]{64})$/i.exec(header.trim());if(!match)return false;
 const stamp=Number(match[1]);if(!Number.isSafeInteger(stamp)||Math.abs(Math.floor(Date.now()/1000)-stamp)>300)return false;
 const expected=createHmac("sha256",secret).update(`${stamp}.${raw}`).digest();const actual=Buffer.from(match[2],"hex");return actual.length===expected.length&&timingSafeEqual(expected,actual);
}
// The viewer's active enrollments are verified in the matching schema; a guardian's other children never grant access.
export async function viewerContext(actor:Identity|null,scope:Scope){
 const d=scoped(scope),code=scopes[scope].code;
 if(!actor)return null;
 const staff=await canAccess(actor,scope,"read") && (rolesFor(actor,code,"TEACHER")||rolesFor(actor,code,"SUPERVISOR")||rolesFor(actor,"SCHOOL","SUPER_ADMIN"));
 // A teacher can view videos only targeting one of their groups; staff permission is filtered again by groupId in canActorWatch.
 const studentIds:string[]=[];
 if(rolesFor(actor,code,"STUDENT")){
  const x=await d.students.findMany({where:{userId:actor.id,active:true},select:{id:true}});studentIds.push(...x.map((r:any)=>r.id));
 }
 if(rolesFor(actor,code,"PARENT")){
  const x=await d.guardians.findMany({where:{userId:actor.id,active:true,student:{active:true}},select:{studentId:true}});studentIds.push(...x.map((r:any)=>r.studentId));
 }
 const enrollment=studentIds.length?await d.enrollments.findMany({where:{studentId:{in:studentIds},active:true,group:{active:true}},select:{groupId:true,group:{select:{levelId:true}}}}):[];
 return {scope,staffAccess:Boolean(staff && !rolesFor(actor,code,"TEACHER")),activeEnrollments:enrollment.map((r:any)=>({groupId:r.groupId,levelId:r.group.levelId})),teacher:rolesFor(actor,code,"TEACHER")&&Boolean(staff)};
}
export async function canActorWatch(actor:Identity|null,scope:Scope,video:any){
 if(!actor&&video.visibility!=="PUBLIC")return false;
 const viewer=await viewerContext(actor,scope);
 if(viewer?.teacher){const d=scoped(scope);if(video.groupId){const assigned=await d.teachers.findFirst({where:{groupId:video.groupId,userId:actor!.id,active:true},select:{id:true}});if(assigned) viewer.staffAccess=true;}
 // teachers can also view ENROLLED or LEVEL content for assigned active groups
 else if(video.visibility!=="PUBLIC") {const assigned=await d.teachers.findFirst({where:{userId:actor!.id,active:true,group:{active:true,...(video.levelId?{levelId:video.levelId}:{})}},select:{id:true}});if(assigned)viewer.staffAccess=true;}}
 return canViewVideo({...video,scope},viewer);
}
export async function validateVideoTarget(scope:Scope,visibility:string,groupId:string|undefined,levelId:string|undefined,actor:Identity){
 if(!validateVisibility(scope,visibility,levelId,groupId))return false;
 const d=scoped(scope),teacher=rolesFor(actor,scopes[scope].code,"TEACHER"),supervisor=rolesFor(actor,scopes[scope].code,"SUPERVISOR")||rolesFor(actor,"SCHOOL","SUPER_ADMIN");
 if(!teacher&&!supervisor)return false;
 // Teacher content must always be restricted to their own group.
 if(teacher&&!supervisor){if(!groupId||visibility!=="GROUP")return false;const ass=await d.teachers.findFirst({where:{groupId,userId:actor.id,active:true,group:{active:true}},select:{id:true}});return Boolean(ass);}
 if(groupId){const group=await d.groups.findUnique({where:{id:groupId},select:{levelId:true,active:true}});if(!group?.active)return false;if(levelId&&group.levelId!==levelId)return false;}
 if(levelId){const groups=await d.groups.count({where:{levelId,active:true}});if(!groups)return false;}
 return true;
}
export async function auditVideo(scope:Scope,actorId:string|null,action:string,id:string,reason?:string){await db(scopes[scope].client).auditEvent.create({data:{actorId,action,scopeCode:scopes[scope].code,subjectType:"VIDEO",subjectId:id,reason},select:{id:true}});}
