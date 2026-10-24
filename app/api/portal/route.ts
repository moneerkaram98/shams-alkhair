import {NextRequest} from "next/server";
import {getIdentity,rolesFor,fail,privateJson} from "@/lib/phase2-auth";
import {scoped} from "@/lib/phase2-data";
import {domains,scopes} from "@/lib/phase2-constants";
export async function GET(req:NextRequest){const actor=await getIdentity(req);if(!actor)return fail(401);
 const children:Array<{id:string,name:string,section:string,groups:string[]}>=[];
 for(const scope of domains){const code=scopes[scope].code;const isGuardian=rolesFor(actor,code,"PARENT"),isStudent=rolesFor(actor,code,"STUDENT");if(!isGuardian&&!isStudent)continue;
  const d=scoped(scope);const students=await d.students.findMany({where:{active:true,OR:[...(isGuardian?[{guardians:{some:{userId:actor.id,active:true}}}]:[]),...(isStudent?[{userId:actor.id}]:[])]},select:{id:true,fullName:true,enrollments:{where:{active:true},select:{group:{select:{nameAr:true}}}}}});
  for(const s of students){children.push({id:s.id,name:s.fullName,section:scopes[scope].name,groups:s.enrollments.map((e:any)=>e.group.nameAr)});}
  if(scope==="women"&&students.length)await d.client.auditEvent.create({data:{actorId:actor.id,scopeCode:code,action:"SENSITIVE_READ",subjectType:"STUDENT_PORTAL",reason:"linked family member"},select:{id:true}});
 }
 return privateJson({children});}
