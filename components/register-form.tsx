"use client";
import Link from "next/link";
import {useState} from "react";
import {useSearchParams} from "next/navigation";
import {departments} from "@/lib/shared";
const opts:{code:string;label:string}[]=[{code:"NURSERY",label:"الحضانة"},{code:"HIFZ_MEN",label:"تحفيظ الرجال"},{code:"HIFZ_WOMEN",label:"تحفيظ النساء"},{code:"TAJWEED",label:"التجويد"},{code:"IJAZAT",label:"الإجازات"}];
type Receipt={reference:string;accessToken:string};
export function RegisterForm(){
 const query=useSearchParams();const initial=query.get("department")??"";
 const [department,setDepartment]=useState(departments.some(d=>d===initial)?initial:"NURSERY");
 const [receipt,setReceipt]=useState<Receipt|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");
  try{
   const form=new FormData(e.currentTarget);
   const body=Object.fromEntries(form.entries());
   const res=await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,privacyConsent:form.get("privacyConsent")==="on"})});
   const data:Receipt & {error?:string}=await res.json();
   if(!res.ok)throw new Error(data.error||"تعذر حفظ الطلب");
   setReceipt({reference:data.reference,accessToken:data.accessToken});
  }catch(err){setError(err instanceof Error?err.message:"خطأ غير متوقع");}
  finally{setBusy(false);}
 }
 if(receipt)return <section className="panel success" aria-live="polite"><h2>تم استلام طلبك بنجاح</h2><p>احفظ المرجع ورمز الوصول الآن. لن يُعرض رمز الوصول مرة ثانية حفاظًا على الخصوصية.</p>
 <div className="receipt"><strong>رقم الطلب</strong><code dir="ltr">{receipt.reference}</code><strong>رمز حجز الاختبار</strong><code dir="ltr" className="token">{receipt.accessToken}</code></div>
 <button className="btn secondary" onClick={()=>navigator.clipboard?.writeText(`رقم الطلب: ${receipt.reference}\nرمز الوصول: ${receipt.accessToken}`)}>نسخ بيانات الطلب</button> <Link className="btn" href="/placement">حجز اختبار المستوى ←</Link></section>;
 return <form className="panel form" onSubmit={submit}>
 <div className="form-grid"><label>القسم المطلوب<select name="department" value={department} onChange={e=>setDepartment(e.target.value)} required>{opts.map(o=><option value={o.code} key={o.code}>{o.label}</option>)}</select></label>
 <label>الاسم رباعي / الكامل<input name="fullName" required minLength={3} maxLength={120} autoComplete="name" /></label>
 <label>تاريخ الميلاد<input type="date" name="birthDate" required /></label>
 <label>النوع<select name="gender" required defaultValue=""><option value="" disabled>اختر</option><option value="MALE">ذكر</option><option value="FEMALE">أنثى</option></select></label>
 <label>رقم الهاتف / واتساب<input name="phone" required autoComplete="tel" maxLength={22} /></label>
 <label>البريد الإلكتروني (اختياري)<input name="email" type="email" autoComplete="email" /></label>
 <label>اسم ولي الأمر (إلزامي لمن هم دون 18)<input name="guardianName" maxLength={120}/></label>
 <label>هاتف ولي الأمر (إلزامي لمن هم دون 18)<input name="guardianPhone" maxLength={22}/></label>
 <label>البريد الإلكتروني لولي الأمر (اختياري)<input name="guardianEmail" type="email"/></label>
 <label className="full">ملاحظات (اختياري)<textarea name="notes" rows={3} maxLength={600}/></label></div>
 <div className="honeypot" aria-hidden="true"><label>اترك هذا الحقل فارغًا<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
 <label className="check"><input type="checkbox" name="privacyConsent" required /> أوافق على استخدام هذه البيانات بغرض مراجعة الطلب وتحديد المستوى، وفق <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{textDecoration:"underline"}}>إشعار الخصوصية</a> (نسخة تطويرية).</label>
 <p className="hint">نموذج المرحلة الأولى لا يدعم رفع المستندات حتى اعتماد التخزين الخاص والصلاحيات. لا ترسل مستندات شخصية داخل حقل الملاحظات.</p>
 {error&&<p className="form-error" role="alert">{error}</p>}
 <button className="btn" disabled={busy} type="submit">{busy?"جارٍ إرسال الطلب...":"إرسال طلب الالتحاق ←"}</button></form>;
}
