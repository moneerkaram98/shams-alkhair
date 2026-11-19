# مدرسة شمس الخير — تسليم إعداد نسخة المعاينة الآمنة
**آخر تحقق:** 19 نوفمبر 2026. **الحالة:** التعديلات على فرع `safety/live-intake-server-gate` وداخل PR #1 كمسودة، وليست منشورة إنتاجيًا.

## نتائج مؤكدة
- تشغيل [GitHub Actions #60](https://github.com/moneerkaram98/shams-alkhair/actions/runs/44622280962) نجح في المهمتين: PostgreSQL synthetic integration وfail-closed-preview.
- النسخة التجريبية المغلقة تُبنى دون `DATABASE_URL*` ولا تطلب معلومات طلاب؛ جميع واجهات الالتحاق والبحث والحجز وتسجيل الدخول ترجع HTTP 503، و`/api/health` ترجع unavailable.
- اختبار التكامل يعمل حصريًا على PostgreSQL تجريبية عابرة ويشمل بيانات وهمية، اختبارات العزل، والتأكد من الاستعادة.
- مشروع Vercel الحالي: `shams-alkhair-full`، داخل فريق `vipjruj492e-3384`. مشروع Vercel **ليس موصولًا بـ GitHub** وفق فحص وصلات المشاريع، والنشر باستخدام GitHub Source فشل سابقًا برمز `git_info_fail`.
- متغير Vercel `SCHOOL_LIVE_READY=false` مفعل للـ Preview وProduction؛ **لا تغيّر قيمته** لمجرد تجربة المعاينة.

## إجراء مطلوب من مالك الحساب لربط GitHub (لا يحتاج مشاركة أسرار)
1. افتح [Vercel — إعدادات Git للمشروع](https://vercel.com/vipjruj492e-3384/shams-alkhair-full/settings/git).
2. اختر **Connect Git Repository** ثم GitHub، أو راجع صلاحية تثبيت GitHub App إن ظهرت رسالة عدم السماح.
3. امنح اتصال Vercel حق الوصول إلى المستودع `moneerkaram98/shams-alkhair` فقط حيث أمكن. لا تنسخ Tokens أو كلمات مرور في المحادثات أو الملفات.
4. استخدم فرع `safety/live-intake-server-gate` لاختبار **Preview**؛ لا تعتمد فرع main للإطلاق قبل مراجعة PR ودمجه.
5. تحقّق من أن النشر مذكور كـ **Preview** وأن SHA يوافق آخر HEAD من الفرع، وليس نسخة Preview قديمة. لا تحوّله إلى Production ولا تغيّر الـ domains العامة.

## قبول معاينة مغلقة بدون قاعدة بيانات
- إعدادات Vercel Preview: `SCHOOL_LIVE_READY=false`؛ **لا تضف** `DATABASE_URL` ولا مفاتيح `DATABASE_URL_*` في هذه الخطوة.
- يجب أن تفتح صفحات `/`, `/register`, `/contact`, `/placement` بشكل عادي دون استمارات لجمع بيانات شخصية.
- يجب أن ترجع `GET /api/health` HTTP **503** وJSON يحوي `status: unavailable`.
- يجب أن ترجع POST على `/api/register`, `/api/contact`, `/api/placement/book`, `/api/placement/slots`, `/api/application/status`, `/api/auth/login` HTTP **503** دون قراءة الطلب.
- لا تعتبر HTTP 503 هنا خطأ إطلاق؛ هو قفل متعمد حتى اختبار قاعدة بيانات منفصلة واعتماد السلامة.

## المرحلة التالية: Staging متصل ببيانات وهمية فقط
1. احصل على موافقة المالك على **مشروع PostgreSQL/Supabase تجريبي مستقل** مع تأكيد أي تكلفة. **لا تستخدم أو تعيد تهيئة مشروع المدرسة الفعلي** ولا تنسخ بيانات الأطفال.
2. أنشئ جداول القاعدة التجريبية الفارغة من migrations معتمدة، وراجع أدوار SQL وقيود المرحلة 1–6. `prisma db push` في CI لا يكفي لإنتاج migrations.
3. اربط 8 حسابات تشغيل **مستقلة، محدودة الصلاحيات** داخل متغيرات Vercel Preview المشفرة فقط، لا حساب postgres أو schema owner. يظل متغير الاتصال الإداري خارج Runtime.
4. عين `APP_ORIGIN` للعنوان الرسمي الثابت للـ Staging مطابقًا بالضبط للـ Origin، و`NEXT_PUBLIC_SITE_URL` له، ثم أعد النشر.
5. فعّل حماية وصول Staging قبل أي اختبار متصل بالقاعدة. تأكد من صلاحيات الرجال والنساء، وعمليات grant/revoke، وواجهات ولي الأمر. لا تشغل استقبال المستخدمين الحقيقيين.
6. اختبار كامل للنسخ/الاستعادة، WAF/تحديد معدل موزع، وسياسة البيانات والخصوصية وموافقة أولياء الأمور قبل أي انتقال للإنتاج.

## التراجع الفوري
- أبقِ `SCHOOL_LIVE_READY=false` دائمًا حتى اعتماد الإطلاق؛ إذا ظهر نموذج بيانات شخصية دون تصريح **أوقف المعاينة أو الترويج** وافحص متغيرات البيئة وSHA.
- لا تدمج PR #1 ولا تُروّج أي deployment إلى Production دون مراجعة مسؤول المدرسة.
- لا تنشر صور أو تسجيلات أو نسخ احتياطية أو بيانات طلاب في GitHub أو سجلات CI.
