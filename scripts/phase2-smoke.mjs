/** Destructive development-only smoke test, deliberately uses invented child identity. */
const base=process.env.SMOKE_URL||"http://localhost:3000";
const email=process.env.SMOKE_ADMIN_EMAIL, password=process.env.SMOKE_ADMIN_PASSWORD;
if(!email||!password||process.env.NODE_ENV==="production")throw Error("Set SMOKE_ADMIN_EMAIL/PASSWORD for LOCAL staging only");
let cookie="";
async function call(path,body,method="POST",okStatus){
 const headers={"Content-Type":"application/json","Origin":base};if(cookie)headers.Cookie=cookie;
 const response=await fetch(base+path,{method,headers,body:body?JSON.stringify(body):undefined,redirect:"manual"});
 const json=await response.json();
 if(okStatus!==undefined){if(response.status!==okStatus)throw Error(`${path}: expected ${okStatus}, got ${response.status}: ${JSON.stringify(json)}`)}else if(!response.ok)throw Error(`${path}: ${response.status} ${JSON.stringify(json)}`);
 return {json,response};
}
const login=await call("/api/auth/login",{email,password});cookie=login.response.headers.get("set-cookie")?.split(";")[0]||"";
if(!cookie)throw Error("no session cookie");
const suffix=Date.now();const scope="men";
const group=(await call("/api/staff/groups",{scope,nameAr:"حلقة اختبار "+suffix,capacity:3},"POST",201)).json.id;
const student=(await call("/api/staff/students",{scope,fullName:"طالب اختبار تجريبي",birthDate:"2017-03-10"},"POST",201)).json.id;
await call("/api/staff/enroll",{scope,studentId:student,groupId:group});
const start=new Date(Date.now()-3*60000),end=new Date(Date.now()+35*60000);
const session=(await call("/api/staff/sessions",{scope,groupId:group,startsAt:start.toISOString(),endsAt:end.toISOString()},"POST",201)).json.id;
const cards=(await call("/api/staff/qr",{scope,studentIds:[student]},"POST",201)).json.cards;
const first=await call("/api/staff/attendance",{scope,sessionId:session,token:cards[0].token},"POST",201);
await call("/api/staff/attendance",{scope,sessionId:session,token:cards[0].token},"POST",409);
const roster=(await call(`/api/staff/attendance?scope=${scope}&sessionId=${session}`,null,"GET")).json;
if(roster.records.length!==1||roster.records[0].studentId!==student)throw Error("Roster record mismatch");
await call("/api/staff/attendance",{scope,sessionId:session,attendanceId:first.json.attendanceId,status:"EXCUSED",reason:"تصحيح حالة تجريبية"},"PATCH");
await call("/api/auth/logout",{});
console.log("PASS: login; group; student; enroll; session; QR; first scan; duplicate=409; roster; audited correction; logout");
