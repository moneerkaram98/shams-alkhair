import {NextRequest} from "next/server";
import {getIdentity,fail,privateJson} from "@/lib/phase2-auth";
import {isScope} from "@/lib/phase2-constants";
import {phase3Models,staffStudentAccess,uuid} from "@/lib/phase3";
export async function GET(req:NextRequest){const q=req.nextUrl.searchParams,scope=q.get("scope"),studentId=q.get("studentId");if(!isScope(scope)||!uuid.safeParse(studentId).success)return fail(400);const actor=await getIdentity(req);if(!actor)return fail(401);if(!await staffStudentAccess(actor,scope,studentId!))return fail();const d=phase3Models(scope);const guardians=await d.guardians.findMany({where:{studentId,active:true},select:{userId:true,relationship:true}});return privateJson({guardians});}
