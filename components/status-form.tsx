"use client";
import {useState} from "react";
const options=[{value:"NURSERY",text:"الحضانة"},{value:"HIFZ_MEN",text:"تحفيظ الرجال"},{value:"HIFZ_WOMEN",text:"تحفيظ النساء"},{value:"TAJWEED",text:"التجويد"},{value:"IJAZAT",text:"الإجازات"}];
type Status={status:string;appointment:{startsAt:string;durationMin:number;locationAr:string}|null};
const names:Record<string,string>={PENDING:"قيد المراجعة",ACCEPTED:"مقبول",REJECTED:"غير مقبول",WAITLISTED:"قائمة الانتظار"};
export function StatusForm(){
  const [result,setResult]=useState<Status|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError("");setResult(null);
    try{ const body=Object.fromEntries(new FormData(e.currentTarget));
      const response=await fetch("/api/application/status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذر الاستعلام");setResult(data);
    }catch(err){setError(err instanceof Error?err.message:"تعذر الاستعلام");}finally{setBusy(false);}
  }
  return <form onSubmit={submit} className="panel form"><div className="form-grid">
    <label>القسم<select name="department" required>{options.map(o=><option value={o.value} key={o.value}>{o.text}</option>)}</select></label>
    <label>رقم الطلب<input name="reference" required dir="ltr" autoComplete="off" placeholder="SK-..." /></label>
    <label className="full">رمز الوصول السري<input name="accessToken" required dir="ltr" type="password" autoComplete="off" /></label>
    </div><button className="btn" type="submit" disabled={busy}>{busy?"جارٍ البحث...":"الاستعلام عن الطلب"}</button>
    {error&&<p role="alert" className="form-error">{error}</p>}
    {result&&<section className="status-result" aria-live="polite"><h2>حالة الطلب: {names[result.status]??"قيد المتابعة"}</h2>{result.appointment?<p>موعد تحديد المستوى: {new Date(result.appointment.startsAt).toLocaleString("ar-EG",{dateStyle:"full",timeStyle:"short",timeZone:"Africa/Cairo"})} — {result.appointment.locationAr}</p>:<p>لم يتم حجز موعد اختبار تحديد المستوى بعد.</p>}</section>}
  </form>;
}
