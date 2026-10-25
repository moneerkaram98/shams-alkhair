# تفعيل قاعدة بيانات شمس الخير — قائمة قبول النسخة التجريبية

**الحالة:** واجهات Next.js منشورة للتصفح فقط. لم يتم تفعيل قاعدة PostgreSQL الجديدة، ولا يجوز قبول بيانات طلاب حقيقية الآن.

## 1. مشروع مستقل
- إنشاء مشروع PostgreSQL جديد خاص بمدرسة شمس الخير، **لا** استخدام قاعدة `teacher-platform-demo`.
- مراجعة تكلفة الاستضافة وحدود الخطة المجانية قبل الإنشاء.
- الاحتفاظ بكل كلمة مرور وسلسلة اتصال في إعدادات الاستضافة المحمية، وليس داخل GitHub أو المحادثة.
- الاعتماد على `core`, `hifz_men`, `hifz_women`, `academy` بوصفها PostgreSQL schemas خاصة.
- لا تستخدم `anon` أو `authenticated` من Supabase Data API للوصول إلى جداول المدرسة؛ راجع قابلية انكشاف schemas وRLS.

## 2. اختبارات على قاعدة فارغة — شرط سابق للتفعيل
- نجاح `.github/workflows/integration.yml` ضد PostgreSQL 17 التجريبي، وتأكيد `prisma validate` و`prisma generate` و`prisma db push` على قاعدة Disposable فقط.
- تطبيق `db/constraints*.sql` و`db/roles*.sql` وفحص أخطائها بالكامل.
- صلاحيات ثمانية حسابات PostgreSQL منفصلة وعدم استخدام `postgres` لتشغيل Next.js.
- فحص عزل بيانات الرجال والنساء من خلال `npm run verify:db-isolation`.
- تسجيل ولي أمر وطلب قبول وحجز موعد وتجربة حضور QR باستخدام أشخاص وهميين.
- فحص تصاريح المدير لقسم النساء والموافقة والتوقيت وسجلات التدقيق.
- التأكد من عمل نسخ احتياطي مشفر وخطة استعادة مجربة.
- تجميد/مراجعة migrations الإنتاجية؛ `prisma db push` في CI ليس بديلًا معتمدًا عن migrations.

## 3. تجهيز Vercel
- تحت Settings → Environment Variables اضبط ثمانية متغيرات قاعدة البيانات المذكورة في `.env.runtime.example`، و`APP_ORIGIN`.
- لا تضف `DATABASE_URL` صاحب الجداول إلى مشروع Vercel.
- اترك `SCHOOL_LIVE_READY=false` خلال الاختبارات. سيمنع `proxy.ts` كل طلبات `/api/` عدا `/api/health` من العمل في بيئة الإنتاج.
- تحقق من `/api/health` (200 عند اتصال كل الحسابات، وإلا 503)، ثم من خطط الدخول والحضور.
- **فقط بعد النجاح ومراجعة حماية القُصّر** يمكن لمسؤول المدرسة ضبط `SCHOOL_LIVE_READY=true` وإعادة النشر.

## 4. نشر GitHub والتحديثات
- الكود متاح على `moneerkaram98/shams-alkhair`.
- اتصال GitHub داخل Vercel لم يكتمل؛ النشر الأخير نُفذ بنقل المصدر مباشرة إلى Vercel.
- يجب إكمال GitHub Login Connection داخل Vercel للحصول على نشر تلقائي متصل بالفرع `main`. لا تفترض أن Push وحده يحدث الموقع.

## تعريف حالة القبول
- BUILD PASS: نجاح ترجمة Next.js وفحص TypeScript.
- PREVIEW PASS: الصفحة الرئيسية 200، وكل API خاصة 503 قبل التفعيل.
- DATABASE PASS: `/api/health` يرجع 200 مع حسابات محدودة، ونجاح اختبارات الأمان وPostgreSQL الحقيقية.
- PRODUCTION PASS: موافقة المدرسة على حماية البيانات وتفعيل `SCHOOL_LIVE_READY=true` بعد التحقق من الإعدادات.

**لا تدرج كلمات مرور أو بيانات شخصية في Issue أو Log أو Pull Request عام.**
