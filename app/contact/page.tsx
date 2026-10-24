import {ContactForm} from "@/components/contact-form";
export const dynamic="force-dynamic";
const phone=process.env.SCHOOL_WHATSAPP?.replace(/[^0-9]/g,"");
const address=process.env.SCHOOL_ADDRESS;
const mapUrl=process.env.SCHOOL_MAP_URL;
export default function Contact(){return <div className="container inner-page"><span className="eyebrow">تواصل معنا</span><h1>يسعدنا تواصلك معنا</h1><p className="lead">يمكنك إرسال استفسار للإدارة من خلال النموذج. ولا تُعرض بيانات اتصال أو موقع غير معتمدة من المدرسة.</p>
  <div className="contact-pills">{phone&&<a className="btn secondary" href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer">التواصل عبر واتساب ↗</a>}{address&&<span className="contact-address">عنوان الفرع: {address}</span>}{mapUrl?.startsWith("https://")&&<a className="btn secondary" href={mapUrl} target="_blank" rel="noopener noreferrer">فتح الموقع على الخريطة ↗</a>}</div><ContactForm/>
  </div>}
