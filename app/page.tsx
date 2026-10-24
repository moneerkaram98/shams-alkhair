import Link from "next/link";
import {sections} from "@/lib/sections";
export default function Home(){return <>
 <section className="hero"><div className="container hero-wrap"><div className="hero-copy">
  <div className="eyebrow">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
  <h1>مع القرآن، تبدأ <em>رحلة النور</em></h1>
  <p>تعليم القرآن الكريم لجميع الأعمار من 4 إلى 100 سنة، في بيئة تربوية هادئة تجمع بين الحفظ، والإتقان، والتدرّج في التعلم.</p>
  <div className="hero-actions"><Link href="/register" className="btn">قدّم طلب الالتحاق ←</Link><Link href="/departments" className="btn secondary">استكشف الأقسام</Link><Link href="/application-status" className="btn secondary">متابعة الطلب</Link></div>
 </div><div className="hero-art" aria-hidden="true"><div className="sun-art">۞</div><p>خيرُكم من تعلّم القرآن وعلّمه</p><span>رسالة علم · تربية · إتقان</span></div></div></section>
 <section className="section"><div className="container"><div className="section-intro"><span className="eyebrow">برامجنا التعليمية</span><h2>مسار مناسب لكل مرحلة</h2><p>اختر القسم ثم سجّل طلبك، وسيساعد اختبار تحديد المستوى على اختيار الحلقة المناسبة.</p></div>
 <div className="cards">{sections.map(s=><Link className="info-card" href={`/departments/${s.slug}`} key={s.slug}><div className="card-icon">{s.symbol}</div><h3>{s.name}</h3><p>{s.summary}</p><span className="link-text">تعرف على القسم ←</span></Link>)}</div></div></section>
 <section className="section muted"><div className="container"><div className="section-intro"><span className="eyebrow">رحلة الالتحاق</span><h2>خطوات واضحة وبسيطة</h2></div><div className="steps"><div><b>١</b><h3>إرسال الطلب</h3><p>اختيار القسم وإدخال بيانات الالتحاق.</p></div><div><b>٢</b><h3>حجز تحديد المستوى</h3><p>اختيار موعد متاح والاحتفاظ برمز الطلب.</p></div><div><b>٣</b><h3>التقييم والقبول</h3><p>يحدد المختص المستوى المناسب والحلقة.</p></div></div></div></section>
 <section className="section"><div className="container cta"><div><h2>ابدأ رحلة التعلم اليوم</h2><p>التسجيل الأولي لا يعني القبول النهائي؛ تُستكمل الإجراءات بعد تقييم المستوى.</p></div><Link href="/register" className="btn light">تقديم طلب جديد ←</Link></div></section>
 </>}
