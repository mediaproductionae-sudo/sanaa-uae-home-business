# اختبارات 4B وحدود نتائجها

## أوامر محلية

```bash
npm run db:test:start
npm run db:test
npm run staging:test:database
npm run staging:test:security
npm run staging:build
npm run staging:typecheck
npm run build
npm run typecheck
npm run staging:start
# في طرفية أخرى، دون بيانات اتصال حقيقية:
npm run staging:test:ui
```

`db:test` يحافظ على اختبار 4A، ويطبق أول ثلاث migrations فقط. `staging:test:database` يطبق الأربع في قاعدة `sanaa_test` المعزولة. لا يقبل test runner رابط قاعدة مستضافة؛ الحاوية بلا شبكة أو منافذ أو bind mounts، وتُفحص قبل reset.

اختبارات PostgreSQL تستخدم عقد Auth/Storage وهمياً مع محرك PostgreSQL فعلي. هي تثبت SQL/RLS والـgrants والمعاملات، ولا تثبت توقيع JWT أو إرسال البريد أو HTTP لـSupabase.

اختبارات واجهة Node في وضع missing-config تثبت العرض العربي والتجاوب والروابط وتوقف النماذج ورفض API وعدم توليد جلسة من رابط استعادة مزيف. لا تُستخدم لإثبات تسجيل حساب ناجح.

## اختبار JWT الحقيقي بعد الربط

أنشئ أربعة حسابات اختبار مخصصة ومؤكدة بالبريد على staging: Customer A/B وSeller A/B. اضبط secrets للعملية فقط:

- `SANAA_RUN_STAGING_AUTH_TESTS=true`.
- `SANAA_STAGING_TEST_ACCOUNT_SET=dedicated`.
- إعدادات Supabase staging المذكورة في runbook.
- `SANAA_TEST_CUSTOMER_A_EMAIL/PASSWORD`، ونظائرها CUSTOMER_B وSELLER_A وSELLER_B.

ثم نفذ `npm run staging:test:jwt`. الاختبار يصدر جلسات حقيقية من Auth ويتحقق من المستخدم عند المزود ويختبر عزل الملفات والمتاجر ومنع الأدوار والعمولات والرفع المباشر. ينشئ/يعيد استخدام متاجر اختبار واضحة الاسم؛ راجع المشروع والحسابات قبل تشغيله. لا يستخدم service_role ولا ينشر JWT أو كلمات مرور في النتائج. من دون opt-in والبيانات، يسجل `not_run` و0 اختبارات ناجحة، لا نجاحاً وهمياً.

هذا الاختبار لا يؤكد تلقائياً البريد عبر inbox ولا يختبر الاستعادة وتحديث Cookies من المتصفح أو رفع الملف عبر بوابة Node؛ نفّذ سيناريوهات القبول التالية أيضاً بعد الربط.

## قبول التكامل المستضاف المطلوب، ولم ينفذ بعد

1. تسجيل Customer وSeller جديدين من المتصفح؛ فتح رسالة التأكيد ثم الدخول، ورفض غير المؤكد، والتحقق من عدم اكتساب Admin من الطلب/metadata.
2. PKCE callback والتأكيد بـtoken_hash، وروابط منتهية ومُعادة الاستخدام؛ رفض open redirect.
3. استعادة على متصفح جديد، وإثبات purpose=recovery، وتغيير كلمة المرور، وانتهاء الإثبات، وتسجيل الخروج المحلي والعام وتجديد الجلسة وانتهاؤها.
4. ملف شخصي محفوظ بعد refresh؛ فشل تغيير ملف شخص آخر ودور نفسه.
5. إنشاء متجر ومنتج وتعديلهما وأرشفتهما، والتصفية وpagination، وعزل Seller A/B؛ لا يظهر متجر pending أو منتج مخفي في الكتالوج العام.
6. رفع صورة صحيحة وإزالة metadata، ورفض SVG/HTML وصورة تالفة/ضخمة؛ مستند خاص لا يقرؤه عميل أو بائع آخر، وروابط تنزيل تنتهي.
7. bootstrap أول مسؤول مرة واحدة بمشغّل، ورفضه من HTTP/anon/authenticated؛ قرار عرض متجر مستقل عن الترخيص.
8. فحص HTTPS وCookies وOrigin وcache والـreverse proxy وlogs وحدود الطلبات على مضيف Node المختار، ثم إعادة اختبار المقاسات السبعة في الجلسات الفعلية.

لا تتضمن هذه الدفعة checkout أو تشغيل المدفوعات أو العمولات أو التوصيل. لا تبدأ 4C قبل اعتمادها.
