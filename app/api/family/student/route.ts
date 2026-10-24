import {NextRequest} from "next/server";
import {fail,privateJson} from "@/lib/phase2-auth";
import {privateFamilyCheck,isFailure,phase3Models} from "@/lib/phase3";
export async function GET(req:NextRequest){
 const q=req.nextUrl.searchParams;const g=await privateFamilyCheck(req,q.get("scope"),q.get("studentId"));if(isFailure(g))return g;
 const d=phase3Models(g.scope),studentId=g.studentId;
 const [student,learning,attendance,reports,notifications,teachers]=await Promise.all([
 d.students.findUnique({where:{id:studentId},select:{id:true,fullName:true,enrollments:{where:{active:true},select:{group:{select:{id:true,nameAr:true,sessions:{where:{startsAt:{gte:new Date(Date.now()-7*86400000)}},orderBy:{startsAt:"asc"},take:20,select:{id:true,startsAt:true,endsAt:true}}}}}}}}),
 d.records.findMany({where:{studentId},orderBy:{assessedAt:"desc"},take:80,select:{id:true,assessedAt:true,activity:true,surahNumber:true,ayahFrom:true,ayahTo:true,mastery:true,memoryErrors:true,tajweedErrors:true,makharijErrors:true,teacherNote:true}}),
 d.attendance.findMany({where:{studentId},orderBy:{markedAt:"desc"},take:70,select:{id:true,status:true,markedAt:true,session:{select:{startsAt:true,group:{select:{nameAr:true}}}}}}),
 d.reports.findMany({where:{studentId,status:"PUBLISHED"},orderBy:{periodStart:"desc"},take:18,select:{id:true,periodType:true,periodStart:true,periodEnd:true,snapshot:true,teacherComment:true,publishedAt:true}}),
 d.notifications.findMany({where:{studentId,recipientId:g.actor.id},orderBy:{createdAt:"desc"},take:25,select:{id:true,kind:true,title:true,text:true,readAt:true,createdAt:true}}),
 d.teachers.findMany({where:{active:true,group:{enrollments:{some:{studentId,active:true}}}},select:{userId:true,group:{select:{nameAr:true}}}})
 ]);
 if(!student)return fail(404);
 return privateJson({student,learning,attendance,reports,notifications,teachers,relationship:g.relationship});
}
