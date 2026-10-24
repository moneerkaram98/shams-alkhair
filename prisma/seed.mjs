import "dotenv/config";
import { PrismaClient } from "@prisma/client";
if(process.env.NODE_ENV === "production") throw new Error("Demo seed forbidden in production");
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required for local seed");
const prisma=new PrismaClient();
try{
 const depts=[
  ["NURSERY","الحضانة"],["HIFZ_MEN","تحفيظ الرجال"],["HIFZ_WOMEN","تحفيظ النساء"],["TAJWEED","التجويد"],["IJAZAT","الإجازات"]
 ];
 await prisma.branch.upsert({where:{code:"MAIN"},create:{code:"MAIN",nameAr:"الفرع الرئيسي (بيانات تجريبية)"},update:{}});
 for(const [code,nameAr] of [["SCHOOL","إدارة المدرسة"],["ACADEMY","الحضانة والتجويد والإجازات"]])await prisma.accessScope.upsert({where:{code},create:{code,nameAr},update:{}});
 for(const [code,nameAr] of depts){
  const d=await prisma.department.upsert({where:{code},create:{code,nameAr},update:{nameAr}});
  const program=await prisma.program.upsert({where:{code},create:{code, nameAr,departmentId:d.id},update:{nameAr}});
  await prisma.level.upsert({where:{programId_order:{programId:program.id,order:1}},create:{programId:program.id,order:1,nameAr:"المستوى الأول"},update:{}});
  await prisma.accessScope.upsert({where:{code},create:{code,nameAr},update:{nameAr}});
 }
 const tomorrow=new Date();tomorrow.setUTCDate(tomorrow.getUTCDate()+2);tomorrow.setUTCHours(8,0,0,0);
 // Each slot below is a DEMO placeholder, not a real school schedule.
 const make=(offset,dept)=>({startsAt:new Date(tomorrow.valueOf()+offset*86400000),durationMin:30,capacity:8,locationAr:"موعد تجريبي - الفرع الرئيسي",active:true,...(dept?{department:dept}:{})});
 if(await prisma.menPlacementSlot.count()===0)await prisma.menPlacementSlot.createMany({data:[make(0),make(4)]});
 if(await prisma.womenPlacementSlot.count()===0)await prisma.womenPlacementSlot.createMany({data:[make(1),make(5)]});
 if(await prisma.academyPlacementSlot.count()===0)await prisma.academyPlacementSlot.createMany({data:[make(0,"NURSERY"),make(1,"TAJWEED"),make(2,"IJAZAT")]});
 console.log("Development reference records & DEMO placement slots seeded.");
}finally{await prisma.$disconnect();}
