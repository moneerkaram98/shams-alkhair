import {NextRequest} from "next/server";
import {getIdentity,privateJson,fail} from "@/lib/phase2-auth";
export async function GET(req:NextRequest){const identity=await getIdentity(req);return identity?privateJson({identity}):fail(401,"يلزم تسجيل الدخول");}
