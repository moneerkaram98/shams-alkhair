"use client";
import {useRef,useState} from "react";
const opts=[{code:"NURSERY",label:"الحضانة"},{code:"HIFZ_MEN",label:"تحفيظ الرجال"},{code:"HIFZ_WOMEN",label:"تحفيظ النساء"},{code:"TAJWEED",label:"التجويد"},{code:"IJAZAT",label:"الإجازات"}];
type Slot={id:string;startsAt:string;durationMin:number;locationAr:string;remaining:number};
export function PlacementForm(){
 const formRef=useRef<HTMLFormElement|null>(null);
 const [department,setDepartment]=useState("NURSERY"),[slots,setSlots]=useState<Slot[]|null>(null),[selected,setSelected]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState("");
 async function load(){setError("");setBusy(true);setSelected("");try{
 const form=formRef.current;if(!form)throw new Error("النموذج غير جاهز");
 const fd=new FormData(form);
 if(!fd.get("reference")||!fd.get("accessToken"))throw new Error("اكتب رقم الطلب ورمز الوصول أولًا");
 const res=await fetch("/api/placement/slots",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({department,reference:fd.get("reference"),accessToken:fd.get("accessToken")})});
 const payload:{error?:string;slots?:Slot[]}=await res.json();if(!res.ok)throw new Error(payload.error||"تعذر تحميل المواعيد");setSlots(payload.slots??[]);
 }catch(e){setError(e instanceof Error?e.message:"خطأ");}finally{setBusy(false);}}
 async function book(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");try{
 const fd=new FormData(e.currentTarget);const res=await fetch("/api/placement/book",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({department,reference:fd.get("reference"),accessToken:fd.get("accessToken"),slotId:selected})});
 const data:{error?:string}=await res.json();if(!res.ok)throw new Error(data.error||"تعذر تأكيد الحجز");setDone(true);
 }catch(e){setError(e instanceof Error?e.message:"خطأ");}finally{setBusy(false);}}
 if(done)return <div className="panel success"><h2>تم حجز موعد اختبار المستوى</h2><p>احتفظ برقم الطلب. ستؤكد الإدارة تفاصيل الحضور من خلال قنوات الاتصال الرسمية عند تفعيلها.</p></div>;
 return <form ref={formRef} className="panel form" onSubmit={book}><div className="form-grid"><label>القسم<select value={department} onChange={e=>{setDepartment(e.target.value);setSlots(null);setSelected("");}}>{opts.map(x=><option key={x.code} value={x.code}>{x.label}</option>)}</select></label>
 <label>رقم الطلب<input required name="reference" placeholder="SK-..." dir="ltr" maxLength={90}/></label><label className="full">رمز الوصول<input required name="accessToken" placeholder="الرمز السري الذي ظهر بعد التسجيل" dir="ltr" maxLength={128}/></label></div>
 <button type="button" className="btn secondary" disabled={busy} onClick={load}>عرض المواعيد المتاحة</button>
 {slots&&<div className="slot-list" aria-live="polite">{slots.length===0?<p>لا توجد مواعيد متاحة حاليًا. ستضيف الإدارة مواعيد معتمدة.</p>:slots.map(s=><label key={s.id} className="slot"><input type="radio" name="slotId" value={s.id} checked={selected===s.id} onChange={()=>setSelected(s.id)}/><span>{new Date(s.startsAt).toLocaleString("ar-EG",{dateStyle:"full",timeStyle:"short",timeZone:"Africa/Cairo"})}<small>{s.locationAr} · متبقي {s.remaining}</small></span></label>)}</div>}
 {error&&<p role="alert" className="form-error">{error}</p>}
 {slots!==null&&slots.length>0&&<button className="btn" type="submit" disabled={!selected||busy}>{busy?"جارٍ التأكيد...":"تأكيد الحجز ←"}</button>}</form>;
}
