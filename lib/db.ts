import "server-only";
import { PrismaClient } from "@prisma/client";
import {validateRuntimeDbConfig} from "@/lib/runtime-db-config";
export type DataDomain = "men" | "women" | "academy" | "contact" | "auth" | "staffMen" | "staffWomen" | "staffAcademy";
const keys: Record<DataDomain, string> = {
 men: "DATABASE_URL_MEN", women:"DATABASE_URL_WOMEN",academy:"DATABASE_URL_ACADEMY",
 contact:"DATABASE_URL_CONTACT", auth:"DATABASE_URL_AUTH",
 staffMen:"DATABASE_URL_STAFF_MEN",staffWomen:"DATABASE_URL_STAFF_WOMEN",staffAcademy:"DATABASE_URL_STAFF_ACADEMY"
};
const cache = globalThis as unknown as { shamsClients?: Partial<Record<DataDomain, PrismaClient>> };
export function db(domain: DataDomain): PrismaClient {
 validateRuntimeDbConfig(process.env,process.env.NODE_ENV==="production");
 const key=keys[domain]; const url=process.env[key];
 if(!url) throw new Error(`Missing dedicated restricted credential: ${key}`);
 cache.shamsClients ??= {};
 cache.shamsClients[domain] ??= new PrismaClient({datasources:{db:{url}},log:["error"]});
 return cache.shamsClients[domain]!;
}
