# مدرسة شمس الخير — رفع خاص إلى GitHub وتشغيل PostgreSQL CI

## حالة التنفيذ المثبتة
- فحص `npm run verify:release` نجح بعد حذف سجلات التشغيل المحلية وعدم إدراج الملفات السرية.
- `npm run verify:offline` نجح: 82 اختبار Node أوليًا. لا يتضمن تشغيل خادم Next.js أو PostgreSQL.
- تثبيت npm محليًا غير متاح في بيئة الإنشاء لعدم الوصول إلى registry.npmjs.org.
- **لم يتم رفع ملفات المشروع إلى GitHub** لأن مستودع `moneerkaram98/shams-alkhair` ظهر بحالة Public عند الفحص. لا تنشر الكود أو الأسرار قبل تغييره إلى Private.

## خطوة الأمان الأولى
1. افتح `https://github.com/moneerkaram98/shams-alkhair/settings`.
2. في `General` انتقل إلى `Danger Zone` ثم `Change repository visibility` ثم `Private`، وأكّد التغيير.
3. تحقق من ظهور شارة `Private` بجانب اسم المستودع، وأن اتصال GitHub في ChatGPT يستطيع الوصول إليه.

## طريقة الرفع من جهاز التطوير (بدون نسخ أسرار)
فكّ ضغط الحزمة في مجلد جديد، ثم نفّذ من جذر المشروع:

```bash
npm run verify:release

git init
git branch -M main
git remote add origin https://github.com/moneerkaram98/shams-alkhair.git
git add .
git status --short
git commit -m "Initial private Shams Alkhair integration"
git push -u origin main
```

> لا تشغّل `git add -f` على أي ملفات بيئة أو تسجيلات أو نسخ احتياطي. ملف `.gitignore` يستبعدها؛ راجع `git status --short` قبل أي Commit. لا تلصق كلمات مرور أو Tokens في المحادثة أو المستودع.

## تشغيل GitHub Actions
بعد رفع الكود في مستودع **خاص**، افتح `Actions → Synthetic PostgreSQL Integration → Run workflow`.
المهمة تستخدم PostgreSQL 17 مؤقتًا وبيانات تجريبية، وتنفذ:
- تثبيت الحزم و`prisma validate` و`prisma generate`.
- `prisma db push` على قاعدة فارغة مؤقتة، ثم تطبيق قيود وصلاحيات SQL.
- اختبارات عزل الأقسام، واختبارات TypeScript، ثم Next.js build.
- اختبار API من داخل GitHub Actions، بما فيها الدخول والحضور وتصاريح قسم النساء.

هذا الاختبار لا يعتمد إطلاقًا على خادم مدرسة حقيقي. فشل أي خطوة **يمنع اعتماد النشر**، ولا ينبغي تجاهله. `db push` لا يغني عن Migrations الإنتاجية.

## بعد اجتياز GitHub Actions
انشر Staging خاصًا متصلًا بقاعدة PostgreSQL تجريبية جديدة، بحقوق قاعدة بيانات منفصلة ومحدودة، وHTTPS. لا تُدخِل بيانات طلاب أو طالبات حقيقية. يجب اجتياز اختبارات الخصوصية وقابلية النسخ الاحتياطي والاستعادة وفحص مسارات ولي الأمر قبل الانتقال للإنتاج.
