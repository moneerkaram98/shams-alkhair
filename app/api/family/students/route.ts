import {NextRequest} from "next/server";
import {getIdentity,fail,privateJson,rolesFor} from "@/lib/phase2-auth";
import {domains,scopes} from "@/lib/phase2-constants";
import {phase3Models} from "@/lib/phase3";
import {checkWomenRead} from "@/lib/phase2-data";
export async function GET(req:NextRequest){
 const actor=await getIdentity(req);if(!actor)return fail(401);
 const students:Array<{scope:string;id:string;name:string;groups:string[]}>=[];
 for(const scope of domains){const code=scopes[scope].code;
  const parent=rolesFor(actor,code,"PARENT"),student=rolesFor(actor,code,"STUDENT");if(!parent&&!student)continue;
  const d=phase3Models(scope);
  const where:any={active:true,OR:[...(parent?[{guardians:{some:{userId:actor.id,active:true}}}]:[]),...(student?[{userId:actor.id}]:[])]};
  const rows=await d.students.findMany({where,take:100,select:{id:true,fullName:true,enrollments:{where:{active:true},select:{group:{select:{nameAr:true}}}}}});
  if(rows.length)await checkWomenRead(scope,actor,"FAMILY_STUDENT_LIST",null);
  for(const row of rows)students.push({scope,id:row.id,name:row.fullName,groups:row.enrollments.map((e:any)=>e.group.nameAr)});
 }
 return privateJson({students});
}
