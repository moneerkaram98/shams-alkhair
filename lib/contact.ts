import { z } from "zod";
export const contactSchema=z.object({
  name:z.string().trim().min(3).max(100),phone:z.string().trim().min(8).max(22),
  email:z.union([z.string().trim().email().max(200),z.literal("")]).optional(),
  topic:z.enum(["GENERAL","COURSES","ADMISSIONS","OTHER"]),
  message:z.string().trim().min(10).max(800),consent:z.literal(true),
  website:z.string().max(0).optional()
});
