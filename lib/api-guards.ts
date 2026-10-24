import { NextRequest } from "next/server";

/** Local development limiter only. Production needs a distributed WAF/Redis limiter. */
const attempts = new Map<string,{count:number,until:number}>();
export function isRateLimited(req:NextRequest){
 const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
 const now=Date.now();
 // Cleanup avoids unbounded development memory use.
 if(attempts.size>3000)for(const [k,v] of attempts)if(v.until<=now)attempts.delete(k);
 const old=attempts.get(ip);
 const entry=old && old.until>now?old:{count:0,until:now+10*60_000};
 entry.count++;attempts.set(ip,entry);
 return entry.count>15;
}
export function allowedOrigin(req:NextRequest){
 const origin=req.headers.get("origin");
 const allowed=process.env.APP_ORIGIN;
 // Browsers provide Origin on POST; script clients may omit it.
 return !origin || (Boolean(allowed) && origin===allowed);
}
