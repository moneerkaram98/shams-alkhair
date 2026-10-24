import "server-only";
import {NextRequest} from "next/server";
import {z} from "zod";
import {createHash} from "node:crypto";
import {GetObjectCommand,PutObjectCommand,DeleteObjectCommand,S3Client} from "@aws-sdk/client-s3";
import {Scope,scopes,isScope} from "@/lib/phase2-constants";
import {db} from "@/lib/db";
import {getIdentity,Identity,fail,rolesFor} from "@/lib/phase2-auth";
import {familyAccess,staffStudentAccess,phase3Models} from "@/lib/phase3";
import {compareRecitation} from "@/lib/recitation-alignment";
export const uuid=z.string().uuid();
export const passage=z.object({scope:z.enum(["men","women","academy"]),studentId:uuid,surahNumber:z.coerce.number().int().min(1).max(114),ayahFrom:z.coerce.number().int().min(1).max(286),ayahTo:z.coerce.number().int().min(1).max(286),groupId:uuid.optional()}).refine(v=>v.ayahTo>=v.ayahFrom && v.ayahTo-v.ayahFrom<=14,{message:"اختر حتى 15 آية متتالية"});
export function recitationModels(scope:Scope){const d=phase3Models(scope),p=scopes[scope].prefix;return {...d,attempts:(d.client as any)[`${p}RecitationAttempt`],consents:(d.client as any)[`${p}RecitationConsent`]};}
export async function accessStudent(actor:Identity,scope:Scope,studentId:string){if(await familyAccess(actor,scope,studentId))return true;return staffStudentAccess(actor,scope,studentId);}
export async function canUpload(actor:Identity,scope:Scope,studentId:string){return Boolean(await familyAccess(actor,scope,studentId));}
export async function validConsent(_actor:Identity,scope:Scope,studentId:string){return activeStudentConsent(scope,studentId);}
const endpoint="https://apis.quran.foundation/content/api/v4/quran/verses/uthmani";
export type Verse={verse_key:string;text_uthmani:string};
export async function getPassage(surah:number,from:number,to:number):Promise<Verse[]>{
 const token=process.env.QURAN_FOUNDATION_TOKEN,client=process.env.QURAN_FOUNDATION_CLIENT_ID;
 if(!token||!client)throw Error("QURAN_NOT_CONFIGURED");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
 try{const u=new URL(endpoint);u.searchParams.set("chapter_number",String(surah));
 const res=await fetch(u,{headers:{"x-auth-token":token,"x-client-id":client},signal:controller.signal,next:{revalidate:86400}});
 if(!res.ok)throw Error("QURAN_SOURCE_UNAVAILABLE");const raw=await res.json() as {verses?:Verse[]};
 if(!Array.isArray(raw.verses))throw Error("QURAN_SOURCE_INVALID");
 const wanted=raw.verses.filter(v=>{const [chapter,verse]=String(v.verse_key).split(":").map(Number);return chapter===surah&&verse>=from&&verse<=to;});
 if(wanted.length!==to-from+1||wanted.some((v,i)=>v.verse_key!==`${surah}:${from+i}`||!v.text_uthmani?.trim()))throw Error("QURAN_PASSAGE_INVALID");return wanted;
 }finally{clearTimeout(timer);}
}
export function recordingBucket(scope:Scope){const key={men:"RECITATION_BUCKET_MEN",women:"RECITATION_BUCKET_WOMEN",academy:"RECITATION_BUCKET_ACADEMY"}[scope];const bucket=process.env[key];if(!bucket)throw Error(`${key} is required`);return bucket;}
const stores:Partial<Record<Scope,S3Client>>={};
function storage(scope:Scope){if(!stores[scope]){
 const postfix={men:"MEN",women:"WOMEN",academy:"ACADEMY"}[scope];
 const key=process.env[`RECITATION_S3_ACCESS_KEY_${postfix}`],secret=process.env[`RECITATION_S3_SECRET_KEY_${postfix}`];
 if(!key||!secret)throw Error(`Dedicated ${scope} object-storage credentials required`);
 stores[scope]=new S3Client({region:process.env.RECITATION_S3_REGION||"us-east-1",endpoint:process.env.RECITATION_S3_ENDPOINT||undefined,forcePathStyle:process.env.RECITATION_S3_PATH_STYLE==="true",credentials:{accessKeyId:key,secretAccessKey:secret}});
 }return stores[scope]!;
}
export async function putAudio(scope:Scope,key:string,buf:Buffer,type:string){await storage(scope).send(new PutObjectCommand({Bucket:recordingBucket(scope),Key:key,Body:buf,ContentType:type,ServerSideEncryption:process.env.RECITATION_S3_SSE_KMS_KEY?"aws:kms":"AES256",...(process.env.RECITATION_S3_SSE_KMS_KEY?{SSEKMSKeyId:process.env.RECITATION_S3_SSE_KMS_KEY}:{}),Metadata:{kind:"recitation"}}));}
export async function getAudio(scope:Scope,key:string){const obj=await storage(scope).send(new GetObjectCommand({Bucket:recordingBucket(scope),Key:key}));const data=await obj.Body?.transformToByteArray();if(!data)throw Error("RECORDING_NOT_FOUND");return Buffer.from(data);}
export async function deleteAudio(scope:Scope,key:string){await storage(scope).send(new DeleteObjectCommand({Bucket:recordingBucket(scope),Key:key}));}
export function sha256(data:Buffer){return createHash("sha256").update(data).digest("hex");}
export const mimeSet=new Set(["audio/webm","audio/ogg","audio/mp4","audio/wav","audio/mpeg"]);
export function safeAudio(buffer:Buffer,type:string){if(buffer.length===0||buffer.length>12*1024*1024||!mimeSet.has(type))return false;
 const head=buffer.subarray(0,16);return (type==="audio/webm"&&head.subarray(0,4).toString("hex")==="1a45dfa3") || (type==="audio/ogg"&&head.subarray(0,4).toString()==="OggS") || (type==="audio/mp4"&&head.subarray(4,8).toString()==="ftyp") || (type==="audio/wav"&&head.subarray(0,4).toString()==="RIFF"&&head.subarray(8,12).toString()==="WAVE") || (type==="audio/mpeg"&&(head.subarray(0,3).toString()==="ID3" || (head[0]===0xff&&(head[1]&0xe0)===0xe0)));
}
export async function activeStudentConsent(scope:Scope,studentId:string){
 const d=recitationModels(scope);const student=await d.students.findUnique({where:{id:studentId},select:{birthDate:true,userId:true}});if(!student)return false;
 const minor=(Date.now()-new Date(student.birthDate).getTime())<18*365.2425*86400000;
 const records=await d.consents.findMany({where:{studentId,revokedAt:null},select:{grantedBy:true}});
 if(minor){const guardians=await d.guardians.findMany({where:{studentId,active:true},select:{userId:true}});return records.some((r:any)=>guardians.some((g:any)=>g.userId===r.grantedBy));}
 return records.some((r:any)=>r.grantedBy===student.userId);
}
export async function askASR(audio:Buffer,type:string,scope:Scope){
 const endpoint=process.env.RECITATION_ASR_URL;if(!endpoint)throw Error("ASR_NOT_CONFIGURED");
 const url=new URL(endpoint);
 if(url.protocol!=="https:" && !(url.protocol==="http:"&&["localhost","127.0.0.1","asr"].includes(url.hostname)))throw Error("ASR_ENDPOINT_INSECURE");
 if(scope==="women"&&process.env.RECITATION_ASR_WOMEN_APPROVED!=="true")throw Error("WOMEN_ASR_REQUIRES_EXPLICIT_APPROVAL");
 const body=new FormData();body.set("audio",new Blob([new Uint8Array(audio)],{type}),`recording.${type.split("/")[1]}`);
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),90000);
 try{const r=await fetch(url,{method:"POST",headers:{...(process.env.RECITATION_ASR_TOKEN?{"Authorization":`Bearer ${process.env.RECITATION_ASR_TOKEN}`}:{})},body,signal:abort.signal,cache:"no-store"});if(!r.ok)throw Error("ASR_SERVICE_FAILED");const result=await r.json() as {text?:string;model?:string};if(typeof result.text!=="string"||result.text.length>15000)throw Error("ASR_RESULT_INVALID");return {text:result.text.trim(),model:String(result.model||"external").slice(0,100)};}finally{clearTimeout(timer);}
}
export async function processAttempt(scope:Scope,record:any){
 const d=recitationModels(scope);
 const stale=new Date(Date.now()-15*60*1000);
 const claimed=await d.attempts.updateMany({where:{id:record.id,attempts:{lt:3},OR:[{state:"QUEUED"},{state:"PROCESSING",processingStartedAt:{lt:stale}}]},data:{state:"PROCESSING",processingStartedAt:new Date(),attempts:{increment:1}}});if(!claimed.count)return false;
 const consent=await activeStudentConsent(scope,record.studentId);
 if(!consent){await d.attempts.update({where:{id:record.id},data:{state:"FAILED",failureCode:"CONSENT_REVOKED",processedAt:new Date()}});return false;}
 try{const verses=await getPassage(record.surahNumber,record.ayahFrom,record.ayahTo);const audio=await getAudio(scope,record.storageKey);const result=await askASR(audio,record.contentType,scope);
 const diff=compareRecitation(verses.map(v=>v.text_uthmani).join(" "),result.text);
 await d.attempts.update({where:{id:record.id},data:{state:"NEEDS_REVIEW",provider:result.model,transcript:result.text,alignment:diff as any,provisionalMatch:diff.agreement,processedAt:new Date(),failureCode:null}});
 return true;
 }catch(e){const code=e instanceof Error?e.message:"PROCESSING_ERROR";await d.attempts.update({where:{id:record.id},data:{state:"FAILED",failureCode:code.slice(0,100),processedAt:new Date()}});return false;}
}
export async function auditRecitation(scope:Scope,actorId:string,action:string,id:string){await db(scopes[scope].client).auditEvent.create({data:{scopeCode:scopes[scope].code,actorId,action,subjectType:"RECITATION",subjectId:id},select:{id:true}});}
export async function authorizedAttempt(req:NextRequest,scopeInput:unknown,idInput:unknown){if(!isScope(scopeInput)||!uuid.safeParse(idInput).success)return fail(400);const actor=await getIdentity(req);if(!actor)return fail(401);const scope=scopeInput,id=idInput as string,d=recitationModels(scope);const item=await d.attempts.findUnique({where:{id}});if(!item||item.state==="DELETED")return fail(404);if(!await accessStudent(actor,scope,item.studentId))return fail();return {actor,scope,item,d};}
/** Returns trusted Quran Foundation CDN links only; no reciter ID assumptions. */
export async function getReferenceAudio(surah:number,from:number,to:number){
 const recitation=process.env.QURAN_REFERENCE_RECITATION_ID;
 const token=process.env.QURAN_FOUNDATION_TOKEN,client=process.env.QURAN_FOUNDATION_CLIENT_ID;
 if(!recitation||!/^\d+$/.test(recitation)||!token||!client)return [];
 const startPage=Math.floor((from-1)/50)+1,endPage=Math.floor((to-1)/50)+1;
 const results:Array<{verse_key:string;url:string}>=[];
 for(let page=startPage;page<=endPage;page++){
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),8500);
  try{const url=`https://apis.quran.foundation/content/api/v4/recitations/${recitation}/by_chapter/${surah}?page=${page}&per_page=50`;
   const r=await fetch(url,{headers:{"x-auth-token":token,"x-client-id":client},signal:abort.signal,next:{revalidate:86400}});
   if(!r.ok)throw Error("REFERENCE_AUDIO_UNAVAILABLE");
   const json=await r.json() as {audio_files?:Array<{verse_key:string;url:string}>};
   for(const item of json.audio_files||[]){const number=Number(item.verse_key.split(":")[1]);if(item.verse_key.startsWith(`${surah}:`)&&number>=from&&number<=to){
    const safe=new URL(item.url,"https://verses.quran.foundation/");
    if(safe.protocol==="https:"&&safe.hostname==="verses.quran.foundation")results.push({verse_key:item.verse_key,url:safe.toString()});
   }}
  }finally{clearTimeout(timer);}
 }
 return results;
}
