import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
 title:{default:"مدرسة شمس الخير للقرآن الكريم",template:"%s | مدرسة شمس الخير"},
 description:"مدرسة شمس الخير لتعليم القرآن الكريم، نور البيان، التحفيظ، التجويد والإجازات.",
 robots:{index:process.env.SCHOOL_LIVE_READY==="true", follow:process.env.SCHOOL_LIVE_READY==="true"}
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="ar" dir="rtl"><body>
  <header className="header"><div className="container head-inner">
   <Link href="/" className="logo" aria-label="الرئيسية"><span className="emblem">۞</span><span>مدرسة <b>شمس الخير</b><small>للقرآن الكريم</small></span></Link>
   <nav aria-label="القائمة الرئيسية"><Link href="/">الرئيسية</Link><Link href="/about">من نحن</Link><Link href="/departments">الأقسام</Link><Link href="/teachers">المعلمون</Link><Link href="/courses">الدورات</Link><Link href="/news">الأخبار</Link><Link href="/gallery">المعرض</Link><Link href="/contact">تواصل معنا</Link><Link href="/application-status">حالة الطلب</Link></nav>
   <Link href="/family" className="btn secondary small">ولي الأمر</Link><Link href="/recitation" className="btn secondary small">التسميع الذاتي</Link><Link href="/dashboard/progress" className="btn secondary small">المتابعة الأكاديمية</Link><Link href="/library" className="btn secondary small">مكتبة الفيديوهات</Link><Link href="/dashboard/advanced" className="btn secondary small">الإدارة المتقدمة</Link><Link href="/family/achievements" className="btn secondary small">إنجازات الطالب</Link><Link href="/verify" className="btn secondary small">التحقق من الشهادات</Link><Link href="/login" className="btn secondary small">لوحة الإدارة</Link><Link href="/register" className="btn small">التسجيل الآن</Link>
  </div></header>
  {process.env.SCHOOL_LIVE_READY!=="true"&&<div role="status" style={{padding:"12px 20px",textAlign:"center",background:"#fff4d6",color:"#573a00",fontWeight:700}}>نسخة تجريبية للتصفح فقط — التسجيل والحضور وحسابات الطلاب ليست مفعلة بعد. يُرجى عدم إدخال أي بيانات شخصية.</div>}
  <main>{children}</main>
  <footer className="footer"><div className="container foot-inner"><span>۞ مدرسة شمس الخير للقرآن الكريم</span><span>التعليم بالرفق والإتقان · خصوصية الطلاب أمانة</span></div></footer>
 </body></html>
}
