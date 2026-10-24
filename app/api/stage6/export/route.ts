import {NextRequest} from "next/server";
import {getIdentity,fail} from "@/lib/phase2-auth";
import {isScope} from "@/lib/phase2-constants";
import {models,privileged,loggedRead} from "@/lib/stage6";
export const runtime="nodejs";
const csvCell=(v:unknown)=>{const s=String(v??"");const safe=/^[\s]*[=+@\-\t\r]/.test(s)?"'"+s:s;return '"'+safe.replaceAll('"','""')+'"';};
export async function GET(req:NextRequest){const scope=req.nextUrl.searchParams.get("scope"),actor=await getIdentity(req);if(!actor)return fail(401);if(!isScope(scope))return fail(400);
 if(!await privileged(actor,scope,"FINANCE"))return fail(403);
 const d=models(scope),invoices=await d.invoice.findMany({orderBy:{createdAt:"desc"},take:1000,include:{payments:{select:{amountPiasters:true}}}});
 const lines=[["Invoice","Student ID","Title","Due (UTC)","Total (piasters)","Paid (piasters)","Voided"],...invoices.map((i:any)=>[i.number,i.studentId,i.title,i.dueAt.toISOString().slice(0,10),i.amountPiasters-i.discountPiasters,i.payments.reduce((s:number,p:any)=>s+p.amountPiasters,0),i.voidedAt?"YES":"NO"])];
 await loggedRead(scope,actor,"FINANCIAL_EXPORT",scope);
 return new Response('\ufeff'+lines.map(line=>line.map(csvCell).join(',')).join('\r\n'),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="shams-${scope}-invoices.csv"`,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
