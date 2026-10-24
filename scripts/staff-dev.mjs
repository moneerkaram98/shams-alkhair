/** Local-only admissions operator CLI for phase 1. Replace with audited authenticated UI in phase 2. */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV === "production" || process.env.ENABLE_LOCAL_STAFF_CLI !== "yes") {
  console.error("Local staff tool disabled. Set ENABLE_LOCAL_STAFF_CLI=yes only in a private development installation.");
  process.exit(1);
}
const [command,domain,...args] = process.argv.slice(2);
const scopes = {
  men:{application:"menApplication", slot:"menPlacementSlot", booking:"menPlacementBooking", result:"menPlacementResult"},
  women:{application:"womenApplication",slot:"womenPlacementSlot",booking:"womenPlacementBooking",result:"womenPlacementResult"},
  academy:{application:"academyApplication",slot:"academyPlacementSlot",booking:"academyPlacementBooking",result:"academyPlacementResult"}
};
if (!(command === "inquiries" && domain === "contact") && (!scopes[domain] || !["slots", "slot-add", "applications", "application-get", "status", "result"].includes(command))) {
  console.error(`Usage:
  npm run staff -- inquiries contact
  npm run staff -- slots men|women|academy
  npm run staff -- slot-add men|women|academy 2026-11-10T12:00:00+02:00 10 "قاعة 1" [NURSERY|TAJWEED|IJAZAT]
  npm run staff -- applications men|women|academy
  npm run staff -- application-get men|women|academy SK-REFERENCE
  npm run staff -- status men|women|academy SK-REFERENCE PENDING|ACCEPTED|REJECTED|WAITLISTED
  npm run staff -- result men|women|academy SK-REFERENCE 80 "المستوى الأول" true|false`);
  process.exit(1);
}
if (domain === "women" && process.env.ALLOW_WOMEN_STAFF_DEV !== "yes") {
  console.error("Women's records are blocked by default. Do not enable outside isolated authorized testing.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) { console.error("Owner DATABASE_URL required for LOCAL staff operations"); process.exit(1); }
const prisma = new PrismaClient();
const s = scopes[domain];
const audit = async (tx, action, subjectType, subjectId, reason) => tx.auditEvent.create({data:{action,scopeCode:domain,subjectType,subjectId,reason:`local-dev-cli: ${reason}`}});
const statuses = new Set(["PENDING", "ACCEPTED", "REJECTED", "WAITLISTED"]);
try {
  if (command === "inquiries") {
    if(process.env.ALLOW_CONTACT_STAFF_DEV !== "yes") throw new Error("Contact inquiries are blocked by default. Enable for authorized local tests only.");
    const inquiries=await prisma.contactInquiry.findMany({take:40,orderBy:{createdAt:"desc"},select:{id:true,name:true,phone:true,topic:true,message:true,createdAt:true}});
    console.table(inquiries);
  } else if (command === "slots") {
    const q = {where:{startsAt:{gte:new Date()}},take:50,orderBy:{startsAt:"asc"},select:{id:true,startsAt:true,capacity:true,locationAr:true,active:true}};
    console.table(await prisma[s.slot].findMany(q));
  } else if (command === "slot-add") {
    const [date,cap,location,department] = args;
    const startsAt = new Date(date);
    const capacity = Number(cap);
    if(!date || !/[zZ]|[+-]\d\d:\d\d$/.test(date) || isNaN(startsAt.valueOf()) || startsAt<=new Date() || !Number.isInteger(capacity)||capacity<1||capacity>1000||!location||location.length>160) throw new Error("Invalid slot arguments. Use ISO 8601 date with timezone.");
    if(domain === "academy" && !["NURSERY","TAJWEED","IJAZAT"].includes(department))throw new Error("Academy slot requires department code");
    const data = {startsAt,capacity,locationAr:location,...(domain === "academy"?{department}:{})};
    const item=await prisma.$transaction(async tx=>{const row=await tx[s.slot].create({data,select:{id:true,startsAt:true}});await audit(tx,"CREATE_SLOT","PlacementSlot",row.id,"New appointment created");return row;});
    console.log("Created",item);
  } else if (command === "applications") {
    const rows=await prisma[s.application].findMany({take:40,orderBy:{createdAt:"desc"},select:{reference:true,status:true,createdAt:true}});
    console.table(rows);
  } else if (command === "application-get") {
    const [reference]=args;if(!reference)throw new Error("Application reference is required");
    const record=await prisma.$transaction(async tx=>{
      const found=await tx[s.application].findUnique({where:{reference},select:{id:true,reference:true,fullName:true,birthDate:true,gender:true,phone:true,email:true,guardianName:true,guardianPhone:true,guardianEmail:true,status:true,notes:true,createdAt:true}});
      if(!found)throw new Error("Application not found");
      await audit(tx,"VIEW_PRIVATE_APPLICATION","Application",found.id,"Local review in developer CLI");
      return found;
    });
    console.log(record);
  } else if (command === "status") {
    const [reference,status]=args;
    if(!reference || !statuses.has(status))throw new Error("Unknown application reference or invalid status");
    await prisma.$transaction(async tx=>{const row=await tx[s.application].findUnique({where:{reference},select:{id:true,status:true}});if(!row)throw new Error("Application not found");await tx[s.application].update({where:{reference},data:{status},select:{id:true}});await audit(tx,"CHANGE_APPLICATION_STATUS","Application",row.id,`${row.status}->${status}`);});
    console.log("Application status updated");
  } else if(command === "result"){
    const [reference, scoreText, recommendedLevel, passedText]=args;
    const score=Number(scoreText);
    if(!reference||!Number.isInteger(score)||score<0||score>100||!recommendedLevel||recommendedLevel.length>120||!["true","false"].includes(passedText))throw new Error("Invalid result values");
    await prisma.$transaction(async tx=>{
      const row=await tx[s.application].findUnique({where:{reference},select:{id:true}});if(!row)throw new Error("Application not found");
      const booking=await tx[s.booking].findUnique({where:{applicationId:row.id},select:{id:true}});if(!booking)throw new Error("No booked placement exam");
      const saved=await tx[s.result].upsert({where:{bookingId:booking.id},create:{bookingId:booking.id,score,recommendedLevel,passed:passedText==="true"},update:{score,recommendedLevel,passed:passedText==="true"},select:{id:true}});
      await audit(tx,"UPSERT_PLACEMENT_RESULT","PlacementResult",saved.id,"Local result entered/updated");
    });console.log("Placement result saved. Student enrollment belongs to phase 2.");
  }
} catch(e) { console.error(e instanceof Error?e.message:"Operation failed");process.exitCode=1; }
finally{await prisma.$disconnect();}
