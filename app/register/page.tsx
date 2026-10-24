import {Suspense} from "react";
import {RegisterForm} from "@/components/register-form";
export default function Register(){return <div className="container inner-page"><span className="eyebrow">بوابة الالتحاق</span><h1>تسجيل طالب جديد</h1><p className="lead">املأ بيانات الطلب بعناية. بعد التسجيل احتفظ برقم الطلب ورمز الوصول لحجز اختبار تحديد المستوى.</p><Suspense fallback={<p>تحميل الاستمارة...</p>}><RegisterForm/></Suspense></div>}
