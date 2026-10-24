"use client";
import {useState} from "react";
export function ContactForm(){
  const [busy,setBusy]=useState(false),[ok,setOk]=useState(false),[error,setError]=useState("");
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError("");
    try{const form=new FormData(e.currentTarget);const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...Object.fromEntries(form.entries()),consent:form.get("consent")==="on"})});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذر إرسال الرسالة");setOk(true);}catch(e){setError(e instanceof Error?e.message:"حدث خطأ");}finally{setBusy(false);}
  }
  if(ok)return <div className="panel success" role="status"><h2>وصلتنا رسالتك بنجاح</h2><p>سيتم الاطلاع عليها بواسطة الإدارة. لا تتضمن هذه الرسالة موعدًا مضمونًا للرد.</p></div>;
  return <form onSubmit={submit} className="panel form"><h2>أرسل استفسارك</h2><p className="hint">من فضلك لا تضع معلومات صحية أو صورًا أو بيانات أطفال حساسة في الرسالة.</p>
    <div className="form-grid"><label>الاسم<input name="name" required minLength={3} maxLength={100} /></label>
      <label>هاتف التواصل<input name="phone" required minLength={8} maxLength={22}/></label>
      <label>البريد الإلكتروني (اختياري)<input name="email" type="email" /></label>
      <label>نوع الاستفسار<select name="topic" required><option value="GENERAL">استفسار عام</option><option value="COURSES">الدورات</option><option value="ADMISSIONS">التسجيل</option><option value="OTHER">أخرى</option></select></label>
      <label className="full">نص الرسالة<textarea required name="message" minLength={10} maxLength={800} rows={5}/></label></div>
    <div className="honeypot" aria-hidden="true"><label>اترك الحقل فارغًا<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <label className="check"><input type="checkbox" name="consent" required/> أوافق على استخدام بيانات التواصل للرد على الاستفسار وفق إشعار الخصوصية.</label>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <button type="submit" className="btn" disabled={busy}>{busy?"جارٍ الإرسال...":"إرسال الاستفسار"}</button>
  </form>;
}
