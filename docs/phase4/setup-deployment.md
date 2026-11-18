# إعداد Supabase والنشر — إجراء مراجَع، لا اتصال منفذ

## المتطلبات الحالية

لا توجد بيانات اتصال Supabase أو متغيرات Supabase في هذه البيئة. لم يُنشأ مشروع خارجي ولم تُرفع migrations إلى مشروع مستضاف. CLI المرجعي الذي فُحص هو 3.2.0، وPostgreSQL للاختبارات المحلية 17 (الإصدار الفعلي في نتائج الاختبار). عند استخدام مشروع قائم، افحص إصدار PostgreSQL والخدمات والمهاجرات الموجودة أولاً؛ لا تنفذ reset عليه.

المراجع الرسمية التي روجعت: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)، [Storage access](https://supabase.com/docs/guides/storage/security/access-control)، [Next.js SSR Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)، ووثائق Next المثبتة للتصدير الثابت ونشر Node.

## تشغيل الاختبارات المعزولة

المطلوب Docker وNode وnpm، دون حساب Supabase أو أسرار حقيقية:

```bash
npm run db:test:start
npm run db:test
npm run db:types:test
npm run typecheck
npm run build
```

ينشئ أمر البداية حاوية `sanaa-phase4a-pg`، صورة `postgres:17`، شبكة `none` ودون نشر منافذ. كلمة `local_test_only` ثابتة لهذه الحاوية المعزولة وليست سراً إنتاجياً. reset يدمر قاعدة `sanaa_test` داخل هذه الحاوية فقط بعد التحقق من الصورة والعزل وعدم وجود bind mounts. لا يقبل الاختبار DSN أو رابط مشروع خارجي. لا تستخدم هذا الحارس كأداة migrations للإنتاج.

`supabase/tests/platform-bootstrap.sql` يحاكي عقود `auth.uid()/auth.users/storage.objects/buckets` لاختبار PostgreSQL الحقيقي. لا تنشره إلى Supabase أبداً، ولا يعد اختباراً لـ GoTrue أو PostgREST أو Storage HTTP أو JWT signing. مسار migrations الفعلي يحتوي فقط الملفات الثلاثة في `supabase/migrations/`؛ تهيئة Supabase توفر auth/storage بنفسها.

للتحقق ببيئة Supabase الكاملة لاحقاً: CLI 3.2.0 مثبت على جهاز يستطيع كتابة إعداداته المحلية، ثم `supabase start` و`supabase db reset` على stack محلي جديد فقط. لا يوصف نجاح هذا المسار بأنه تحقق قبل تشغيله. في بيئة العمل الحالية فُحص CLI داخل الحاوية لأن مجلد إعداداته الافتراضي على المضيف للقراءة فقط؛ قراءة config نجحت، لكن status لم يتمكن من فحص Docker من داخل الحاوية. لم نشغّل stack Supabase كاملاً.

## تهيئة مشروع staging المستضاف

1. اختر/أنشئ مشروع Supabase staging منفصلاً، وفعّل النسخ الاحتياطي المناسب وخطة الاستعادة. إن كان المشروع قائماً، التقط نسخة وفحص schema والمهاجرات قبل أي دفع. الملفات الحالية migrations أولية وليست ترقيعاً تلقائياً لأي schema قائم.
2. أدخل القيم محلياً من `.env.example` أو في مخزن أسرار الاستضافة. رابط المشروع وpublishable key فقط يجوزان في المتصفح. `service_role/secret key/DB URL/password` في مدير أسرار الخادم وCLI الموثوق فقط. لا تلصقها في المحادثة أو التقرير، ولا تضعها في command arguments أو `NEXT_PUBLIC_*`.
3. نفذ `supabase login` بالطريقة التفاعلية الآمنة، ثم `supabase link --project-ref YOUR_PROJECT_REF`. مرر كلمة مرور القاعدة في prompt الآمن عند الطلب، لا في نص الأمر أو Git. تأكد من المشروع والبيئة قبل الخطوة التالية.
4. راجع `supabase db push --dry-run` ثم `supabase db push` على staging بعد تفويض النشر. لا تستخدم `db reset` على قاعدة مستضافة قائمة. طبّق seed المرجعي بالوسيلة المراجعة على staging فقط؛ لا ينشئ مستخدمين أو اتفاقيات نشطة.
5. ولّد أنواع Supabase الرسمية: `supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts`، ثم قارنها بالنسخة المحلية وأعد typecheck. لا تحذف سياسات Supabase الافتراضية عشوائياً؛ افحص أي سياسة Storage إضافية قد توسع الوصول.
6. اختبر مصفوفة الصلاحيات باستخدام JWT حقيقي لـ customer A/B وseller A/B وreviewer وoperator. اختبر الاستجابات من PostgREST وStorage، وليس SQL فقط. تحقق من عدم وجود grants أو views أو RPC خارج المراجعة.
7. اضبط Auth redirects واسم النطاق الحقيقي وSMTP والتأكيد بالبريد وإعادة تعيين كلمة المرور ومعدل الطلبات. مفاتيح الإدارة لا تُشتق من user_metadata. أول مسؤول يعيّنه مشغّل موثوق من قاعدة البيانات مع permissions محددة وسبب مسجل؛ لا زر signup يجعل الشخص Admin.

لا تُنفذ خطوات الاتصال أو النشر حتى تتوفر القيم في قناة آمنة. لا نطلب منك إرسال كلمة مرور أو service_role في هذه المحادثة.

## خطة الاستضافة الديناميكية 4B

الإعداد الحالي `.openai/hosting.json` يصف ملفات `out/` فقط. لم يتغير، ولم تُزل `output:'export'` من `next.config.ts`.

الخيار المفضل: staging على Node 22 (Vercel أو مضيف Node/Docker مؤهل تختاره). راجع `deployment/next.config.node.example.ts` و`deployment/Dockerfile.node.example`. نسخ config يجعل الناتج `.next/standalone` بدلاً من `out`، وبدء التشغيل `node server.js` بدلاً من خدمة الملفات الثابتة. نُشر القالب للمراجعة فقط، ولم يُبنَ/يُنشر Docker runtime أو يُختبر SSR Auth بعد.

عند اعتماد 4B: أنشئ staging منفصلاً أولاً، وافحص callback/logout/session refresh وOrigin/cookies، وأضف endpoints حقيقية محمية. بعدها اختبارات الواجهة وطلبات API والتحديث المباشر. لا تغيّر هوية المشروع/المشاركة أو رابط الموقع الحالي بصمت. نقل DNS أو النطاق والخادم قرار تشغيل مستقل بعد نجاح staging. الرجوع للرابط الثابت يعيد تجربة DEMO فقط، ولا يحل rollback schema للإنتاج.

بديل ممكن: الإبقاء على Sites static واستخدام Supabase Auth CSR وEdge Functions لكل الأوامر الحساسة؛ هذا لا يمنح Next Server Actions قدرة تشغيل. يحتاج اعتماداً معمارياً وتنفيذاً واختباراً منفصلاً في 4B، وليس تبديل متغير بيئة.

## ما يحتاج تدخل المالك

- اختيار مشروع Supabase staging وتزويد رابط المشروع وproject ref والمفتاح العام عبر إعدادات الاتصال المناسبة.
- ربط أسرار CLI/الخادم في مخزن آمن؛ لا أسرار في الرد النصي.
- اختيار مضيف Node وstaging domain وتحديد redirect URLs ومرسل البريد.
- موافقة صريحة على 4B قبل بدء ربط الواجهات أو Auth الحقيقي.
- لاحقاً: اتفاقيات البائعين/التوصيل وسياسة الضرائب والخصومات/التقريب/الاسترداد والتسوية، ومصادر تغطية المناطق وإثبات التوصيل. القيم الافتراضية غير النشطة لا تعتمد هذه القرارات التجارية.
