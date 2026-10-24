import "server-only";
import { db } from "@/lib/db";
import { newReceipt, hashToken, scopeForDepartment } from "@/lib/registration";
import type { RegistrationInput, BookingInput, SlotListInput } from "@/lib/registration";

export class ApiError extends Error { constructor(public status:number, message:string) { super(message); } }

export async function createAdmission(input:RegistrationInput) {
  const {reference, accessToken, accessTokenHash} = newReceipt();
  const data = {
    reference, accessTokenHash, fullName: input.fullName,
    birthDate: new Date(`${input.birthDate}T00:00:00.000Z`), gender: input.gender,
    phone: input.phone, email: input.email || null,
    guardianName:input.guardianName || null, guardianPhone: input.guardianPhone || null,
    guardianEmail: input.guardianEmail || null, notes:input.notes || null,
    consentVersion:"privacy-v1", privacyConsentAt:new Date(), status:"PENDING"
  };
  const domain = scopeForDepartment(input.department);
  if(domain === "men") await db("men").menApplication.create({data:{...data,programCode:"HIFZ"},select:{id:true,reference:true}});
  else if(domain === "women") await db("women").womenApplication.create({data:{...data,programCode:"HIFZ"},select:{id:true,reference:true}});
  else await db("academy").academyApplication.create({data:{...data,department:input.department,programCode:input.department},select:{id:true,reference:true}});
  return {reference, accessToken};
}

export async function availableSlotsForApplicant(input:SlotListInput) {
  const department=input.department;
  const tokenHash=hashToken(input.accessToken);
  const scope=scopeForDepartment(department);
  let application;
  if(scope==="men") application=await db("men").menApplication.findFirst({where:{reference:input.reference,accessTokenHash:tokenHash},select:{id:true}});
  else if(scope==="women") application=await db("women").womenApplication.findFirst({where:{reference:input.reference,accessTokenHash:tokenHash},select:{id:true}});
  else application=await db("academy").academyApplication.findFirst({where:{reference:input.reference,accessTokenHash:tokenHash,department},select:{id:true}});
  if(!application) throw new ApiError(403,"بيانات الطلب غير صحيحة");
  const where={active:true, startsAt:{gt:new Date()}};
  const select = {id:true,startsAt:true,durationMin:true,capacity:true,locationAr:true,_count:{select:{bookings:true}}} as const;
  let slots;
  const domain=scopeForDepartment(department);
  if(domain === "men") slots=await db("men").menPlacementSlot.findMany({where,select,orderBy:{startsAt:"asc"},take:80});
  else if(domain === "women") slots=await db("women").womenPlacementSlot.findMany({where,select,orderBy:{startsAt:"asc"},take:80});
  else slots=await db("academy").academyPlacementSlot.findMany({where:{...where, department},select,orderBy:{startsAt:"asc"},take:80});
  return slots.filter(s=>s._count.bookings<s.capacity).map(s=>({id:s.id,startsAt:s.startsAt,durationMin:s.durationMin,locationAr:s.locationAr,remaining:s.capacity-s._count.bookings}));
}

/** Advisory transaction lock prevents oversubscribing a slot under concurrent bookings. */
export async function reservePlacement(input:BookingInput) {
  const tokenHash=hashToken(input.accessToken);
  const domain=scopeForDepartment(input.department);
  if(domain==="men")return db("men").$transaction(async tx=>{
    await tx.$queryRaw`SELECT 1 AS lock_acquired FROM pg_advisory_xact_lock(hashtext(${input.slotId})::bigint)`;
    const app=await tx.menApplication.findFirst({where:{reference:input.reference,accessTokenHash:tokenHash},select:{id:true}});
    if(!app)throw new ApiError(404,"المرجع أو رمز الوصول غير صحيح");
    const slot=await tx.menPlacementSlot.findUnique({where:{id:input.slotId},select:{active:true,startsAt:true,capacity:true,_count:{select:{bookings:true}}}});
    if(!slot?.active || slot.startsAt<=new Date() || slot._count.bookings>=slot.capacity)throw new ApiError(409,"الموعد لم يعد متاحًا");
    const existing=await tx.menPlacementBooking.findUnique({where:{applicationId:app.id},select:{id:true}});
    if(existing)throw new ApiError(409,"هذا الطلب لديه حجز قائم بالفعل");
    return tx.menPlacementBooking.create({data:{applicationId:app.id,slotId:input.slotId},select:{id:true,slotId:true}});
  });
  if(domain==="women")return db("women").$transaction(async tx=>{
    await tx.$queryRaw`SELECT 1 AS lock_acquired FROM pg_advisory_xact_lock(hashtext(${input.slotId})::bigint)`;
    const app=await tx.womenApplication.findFirst({where:{reference:input.reference,accessTokenHash:tokenHash},select:{id:true}});
    if(!app)throw new ApiError(404,"المرجع أو رمز الوصول غير صحيح");
    const slot=await tx.womenPlacementSlot.findUnique({where:{id:input.slotId},select:{active:true,startsAt:true,capacity:true,_count:{select:{bookings:true}}}});
    if(!slot?.active || slot.startsAt<=new Date() || slot._count.bookings>=slot.capacity)throw new ApiError(409,"الموعد لم يعد متاحًا");
    const existing=await tx.womenPlacementBooking.findUnique({where:{applicationId:app.id},select:{id:true}});
    if(existing)throw new ApiError(409,"هذا الطلب لديه حجز قائم بالفعل");
    return tx.womenPlacementBooking.create({data:{applicationId:app.id,slotId:input.slotId},select:{id:true,slotId:true}});
  });
  return db("academy").$transaction(async tx=>{
    await tx.$queryRaw`SELECT 1 AS lock_acquired FROM pg_advisory_xact_lock(hashtext(${input.slotId})::bigint)`;
    const app=await tx.academyApplication.findFirst({where:{reference:input.reference,accessTokenHash:tokenHash,department:input.department},select:{id:true}});
    if(!app)throw new ApiError(404,"المرجع أو رمز الوصول غير صحيح");
    const slot=await tx.academyPlacementSlot.findUnique({where:{id:input.slotId},select:{department:true,active:true,startsAt:true,capacity:true,_count:{select:{bookings:true}}}});
    if(!slot?.active || slot.department!==input.department || slot.startsAt<=new Date() || slot._count.bookings>=slot.capacity)throw new ApiError(409,"الموعد لم يعد متاحًا");
    const existing=await tx.academyPlacementBooking.findUnique({where:{applicationId:app.id},select:{id:true}});
    if(existing)throw new ApiError(409,"هذا الطلب لديه حجز قائم بالفعل");
    return tx.academyPlacementBooking.create({data:{applicationId:app.id,slotId:input.slotId},select:{id:true,slotId:true}});
  });
}


/** Read only the public status for the person holding the one-time secret. */
export async function applicantStatus(input:SlotListInput) {
  const tokenHash = hashToken(input.accessToken);
  const domain = scopeForDepartment(input.department);
  const args = {where:{reference:input.reference,accessTokenHash:tokenHash},select:{status:true,bookings:{select:{slot:{select:{startsAt:true,durationMin:true,locationAr:true}}},take:1}}} as const;
  let application;
  if (domain === "men") application = await db("men").menApplication.findFirst(args);
  else if (domain === "women") application = await db("women").womenApplication.findFirst(args);
  else application = await db("academy").academyApplication.findFirst({
    where:{reference:input.reference,accessTokenHash:tokenHash,department:input.department},
    select:args.select,
  });
  if (!application) throw new ApiError(403,"رقم الطلب أو رمز الوصول غير صحيح");
  return {status:application.status,appointment:application.bookings[0]?.slot ?? null};
}
