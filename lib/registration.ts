import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

import { departments } from "@/lib/shared";
export const deptSchema = z.enum(departments);
export type DepartmentCode = z.infer<typeof deptSchema>;

export const registrationSchema = z.object({
  department: deptSchema,
  fullName: z.string().trim().min(3).max(120),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().trim().min(8).max(22),
  email: z.union([z.string().trim().email().max(200), z.literal("")]).optional(),
  guardianName: z.string().trim().max(120).optional(),
  guardianPhone: z.string().trim().max(22).optional(),
  guardianEmail: z.union([z.string().trim().email().max(200), z.literal("")]).optional(),
  notes: z.string().trim().max(600).optional(),
  privacyConsent: z.literal(true),
  website: z.string().max(0).optional() // honeypot
}).superRefine((value, ctx) => {
  const dt = new Date(`${value.birthDate}T00:00:00.000Z`);
  const valid = Number.isFinite(dt.valueOf()) && dt.toISOString().slice(0, 10) === value.birthDate;
  if (!valid) {ctx.addIssue({code:"custom", path:["birthDate"], message:"تاريخ ميلاد غير صحيح"});return;}
  const now = new Date();
  let age = now.getUTCFullYear() - dt.getUTCFullYear();
  const birthday = new Date(Date.UTC(now.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  if(now < birthday) age--;
  if (age < 4 || age > 100) ctx.addIssue({code:"custom",path:["birthDate"],message:"السن المسموح من 4 إلى 100 سنة"});
  if(age < 18 && (!value.guardianName?.trim() || !value.guardianPhone?.trim()))
    ctx.addIssue({code:"custom",path:["guardianPhone"],message:"اسم ولي الأمر ورقم هاتفه مطلوبان للقاصر"});
  if(value.department === "HIFZ_MEN" && value.gender !== "MALE")
    ctx.addIssue({code:"custom",path:["department"],message:"قسم تحفيظ الرجال مخصص للذكور"});
  if(value.department === "HIFZ_WOMEN" && value.gender !== "FEMALE")
    ctx.addIssue({code:"custom",path:["department"],message:"قسم تحفيظ النساء مخصص للإناث"});
});
export type RegistrationInput = z.infer<typeof registrationSchema>;
export const bookingSchema = z.object({
  department: deptSchema,
  reference: z.string().trim().min(8).max(90),
  accessToken: z.string().min(24).max(128),
  slotId: z.string().uuid(),
});
export type BookingInput = z.infer<typeof bookingSchema>;
export function scopeForDepartment(dept:DepartmentCode):"men"|"women"|"academy" {
  if(dept === "HIFZ_MEN")return "men";
  if(dept === "HIFZ_WOMEN")return "women";
  return "academy";
}
export function newReceipt(){
  const reference = `SK-${randomBytes(9).toString("hex").toUpperCase()}`;
  const accessToken = randomBytes(32).toString("base64url");
  return {reference,accessToken,accessTokenHash:hashToken(accessToken)};
}
export function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}

export const slotListSchema = bookingSchema.omit({slotId:true});
export type SlotListInput = z.infer<typeof slotListSchema>;
