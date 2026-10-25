import {NextRequest} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {fail,privateJson} from "@/lib/phase2-auth";
import {recitationModels,processAttempt} from "@/lib/recitation";
import {domains} from "@/lib/phase2-constants";
export const maxDuration=300;
export async function POST(req:NextRequest){const key=process.env.RECITATION_JOB_SECRET,got=req.headers.get("authorization")?.replace(/^Bearer /,"");if(!key||key.length<32||!got||Buffer.byteLength(got)!==Buffer.byteLength(key)||!timingSafeEqual(Uint8Array.from(Buffer.from(got)),Uint8Array.from(Buffer.from(key))))return fail(401);
 const result:Record<string,{queued:number;completed:number}>={};for(const scope of domains){const d=recitationModels(scope);const pending=await d.attempts.findMany({where:{attempts:{lt:3},OR:[{state:"QUEUED"},{state:"PROCESSING",processingStartedAt:{lt:new Date(Date.now()-15*60*1000)}}]},orderBy:{submittedAt:"asc"},take:2});let completed=0;for(const item of pending){if(await processAttempt(scope,item))completed++;}result[scope]={queued:pending.length,completed};}return privateJson({processed:result});}
