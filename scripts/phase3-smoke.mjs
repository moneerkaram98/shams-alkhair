/** Development-only integration smoke test. Requires dedicated staging credentials and PostgreSQL; never runs against production. */
const base=process.env.SMOKE_URL||"http://localhost:3000",email=process.env.SMOKE_ADMIN_EMAIL,password=process.env.SMOKE_ADMIN_PASSWORD;
if(!email||!password||process.env.NODE_ENV==="production")throw Error("LOCAL staging credentials and NODE_ENV!=production required");
let cookie="";
async function api(route,method="GET",body=null,expected){const headers={"Origin":base,"Content-Type":"application/json"};if(cookie)headers.Cookie=cookie;const r=await fetch(base+route,{method,headers,body:body?JSON.stringify(body):undefined,redirect:"manual"});const value=await r.json();if(expected!==undefined&&r.status!==expected)throw Error(`${route} expected ${expected}, got ${r.status}: ${JSON.stringify(value)}`);if(expected===undefined&&!r.ok)throw Error(`${route}: ${r.status}: ${JSON.stringify(value)}`);return {r,value};}
const login=await api("/api/auth/login","POST",{email,password});cookie=login.r.headers.get("set-cookie")?.split(";")[0]||"";if(!cookie)throw Error("Session missing");
const scope="men",suffix=Date.now();
const group=(await api("/api/staff/groups","POST",{scope,nameAr:"حلقة اختبار مرحلي "+suffix,capacity:8},201)).value.id;
const student=(await api("/api/staff/students","POST",{scope,fullName:"طالب تجربة المرحلة الثالثة",birthDate:"2015-02-12"},201)).value.id;
await api("/api/staff/enroll","POST",{scope,studentId:student,groupId:group});
await api("/api/staff/progress","POST",{scope,studentId:student,groupId:group,activity:"REVIEW",surahNumber:1,ayahFrom:1,ayahTo:7,mastery:91,memoryErrors:1,tajweedErrors:0,makharijErrors:2,teacherNote:"تجربة اختبار محلي"},201);
const records=(await api(`/api/staff/progress?scope=men&studentId=${student}`)).value.records;if(records.length!==1||records[0].mastery!==91)throw Error("Learning record not stored");
const monday=new Date();const offset=(monday.getUTCDay()+6)%7;monday.setUTCHours(0,0,0,0);monday.setUTCDate(monday.getUTCDate()-offset-7);
const report=(await api("/api/staff/reports","POST",{scope,studentId:student,periodType:"WEEKLY",periodStart:monday.toISOString().slice(0,10)},201)).value;
await api("/api/staff/reports/publish","POST",{scope,reportId:report.id,teacherComment:"اختبار اعتماد"});
const reports=(await api(`/api/staff/reports?scope=men&studentId=${student}`)).value.reports;if(reports[0]?.status!=="PUBLISHED")throw Error("Report not published");
await api(`/api/family/student?scope=men&studentId=${student}`,"GET",null,403);
await api(`/api/family/report?scope=men&studentId=${student}&reportId=${report.id}`,"GET",null,403);
await api("/api/auth/logout","POST",{});
console.log("PASS: login, group, student, enrollment, progress, weekly report, publish, unauthorized family 403, logout");
