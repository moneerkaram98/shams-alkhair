import "dotenv/config";
import {scryptSync,randomBytes} from "node:crypto";
import {PrismaClient} from "@prisma/client";
// DBA-only bootstrap, never exposed as an HTTP route.
if(!process.env.DATABASE_URL)throw Error("Owner DATABASE_URL required for local bootstrap");
const email=(process.env.STAFF_EMAIL||"").trim().toLowerCase();
const name=(process.env.STAFF_NAME||"").trim();
const password=process.env.STAFF_PASSWORD||"";
const scope=process.env.STAFF_SCOPE||"SCHOOL";
const role=process.env.STAFF_ROLE||"SUPER_ADMIN";
const gender=process.env.STAFF_GENDER||"UNSPECIFIED";
const roles=["SUPER_ADMIN","SUPERVISOR","RECEPTION","TEACHER","PARENT","STUDENT"];
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||name.length<3||password.length<14||!roles.includes(role)||!(["SCHOOL","HIFZ_MEN","HIFZ_WOMEN","ACADEMY"].includes(scope))||!["MALE","FEMALE","UNSPECIFIED"].includes(gender))throw Error("Specify STAFF_EMAIL, STAFF_NAME, STAFF_PASSWORD (14+ chars), STAFF_ROLE, STAFF_SCOPE, STAFF_GENDER via secure environment");
if(role==="SUPER_ADMIN"&&scope!=="SCHOOL")throw Error("SUPER_ADMIN must be scoped to SCHOOL");
if(role==="TEACHER" && ((scope==="HIFZ_WOMEN"&&gender!=="FEMALE")||(scope==="HIFZ_MEN"&&gender!=="MALE")))throw Error("Male/female HIFZ teacher roles must match section gender");
const prisma=new PrismaClient();
try{
 const existing=await prisma.appUser.findUnique({where:{email}});
 if(existing)throw Error("Account already exists; no silent password resets or role elevation");
 const salt=randomBytes(16).toString("hex"),hash=`scrypt$${salt}$${scryptSync(password,salt,64).toString("hex")}`;
 const sec=await prisma.accessScope.upsert({where:{code:scope},create:{code:scope,nameAr:scope==="SCHOOL"?"المدرسة":scope},update:{}});
 const user=await prisma.appUser.create({data:{email,displayName:name,gender,passwordHash:hash,roles:{create:{scopeId:sec.id,role}}}}});
 console.log(`Created ${role} account in ${scope}: ${user.id}`);
}finally{await prisma.$disconnect();}
