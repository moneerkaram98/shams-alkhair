// Auth-negative API tests against a *running* configured Next.js server. No real data needed.
const base=process.env.APP_URL||"http://localhost:3000";
for (const [path,method,body] of [
 ["/api/videos/upload-init","POST",{}],
 ["/api/videos/review","POST",{}],
 ["/api/videos/remove","POST",{}],
 ["/api/videos/watch?scope=women&id=8f0e0d55-89e9-4b5a-a120-bcd786bd03bf","GET",undefined]
]){
 const r=await fetch(base+path,{method,...(body?{headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:{})});
 if(![401,403].includes(r.status))throw Error(`Unauthorized route was not blocked: ${path} -> ${r.status}`);
 console.log("PASS",method,path,r.status);
}
