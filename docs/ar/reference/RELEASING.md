---
read_when:
    - البحث عن تعريفات قنوات الإصدار العامة
    - البحث عن تسمية الإصدارات والوتيرة
summary: قنوات الإصدار العامة، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-04-26T11:39:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

يمتلك OpenClaw ثلاث مسارات إصدار عامة:

- stable: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- beta: وسوم الإصدارات التمهيدية التي تُنشر إلى npm `beta`
- dev: الرأس المتحرك للفرع `main`

## تسمية الإصدارات

- إصدار stable: ‏`YYYY.M.D`
  - وسم Git: ‏`vYYYY.M.D`
- إصدار تصحيحي لـ stable: ‏`YYYY.M.D-N`
  - وسم Git: ‏`vYYYY.M.D-N`
- إصدار prerelease من beta: ‏`YYYY.M.D-beta.N`
  - وسم Git: ‏`vYYYY.M.D-beta.N`
- لا تضع أصفارًا بادئة للشهر أو اليوم
- تعني `latest` إصدار npm المستقر المُرقّى الحالي
- تعني `beta` هدف التثبيت الحالي لـ beta
- تُنشر إصدارات stable والتصحيحية لـ stable إلى npm `beta` افتراضيًا؛ ويمكن لمشغلي الإصدار استهداف `latest` صراحةً، أو ترقية بنية beta مُدققة لاحقًا
- يُشحن كل إصدار stable من OpenClaw مع حزمة npm وتطبيق macOS معًا؛
  أما إصدارات beta فتتحقق عادةً وتنشر أولًا مسار npm/package، مع
  حجز بناء/توقيع/توثيق تطبيق mac للإصدارات stable ما لم يُطلب خلاف ذلك صراحةً

## وتيرة الإصدار

- تنتقل الإصدارات وفق نهج beta-first
- لا تتبع stable إلا بعد التحقق من أحدث beta
- يقتطع المشرفون الإصدارات عادةً من فرع `release/YYYY.M.D` منشأ
  من `main` الحالي، بحيث لا يحجب التحقق من الإصدار والإصلاحات التطوير الجديد
  على `main`
- إذا جرى دفع أو نشر وسم beta واحتاج إلى إصلاح، يقتطع المشرفون
  وسم `-beta.N` التالي بدلًا من حذف وسم beta القديم أو إعادة إنشائه
- إجراء الإصدار التفصيلي، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## الفحص التمهيدي للإصدار

- شغّل `pnpm check:test-types` قبل الفحص التمهيدي للإصدار حتى تبقى اختبارات TypeScript
  مغطاة خارج البوابة المحلية الأسرع `pnpm check`
- شغّل `pnpm check:architecture` قبل الفحص التمهيدي للإصدار حتى تكون
  فحوصات دورة الاستيراد وحدود البنية الأوسع خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تتوفر
  artifacts الإصدار المتوقعة في `dist/*` وحزمة Control UI من أجل خطوة
  التحقق من الحزم
- شغّل `pnpm qa:otel:smoke` عند التحقق من telemetry الخاصة بالإصدار. فهو يمارس
  QA-lab عبر مستقبِل محلي OTLP/HTTP ويتحقق من أسماء spans المصدّرة،
  والسمات المحدودة، وإخفاء المحتوى/المعرّفات من دون الحاجة إلى
  Opik أو Langfuse أو أي مجمّع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- تعمل فحوصات الإصدار الآن في workflow يدوية منفصلة:
  `OpenClaw Release Checks`
- كما تشغّل `OpenClaw Release Checks` أيضًا بوابة تكافؤ QA Lab الوهمية بالإضافة إلى
  مساري QA الحيين لـ Matrix وTelegram قبل الموافقة على الإصدار. وتستخدم المسارات الحية
  البيئة `qa-live-shared`؛ كما تستخدم Telegram أيضًا تأجيرات بيانات اعتماد Convex الخاصة بـ CI.
- يُرسل التحقق من التثبيت والترقية عبر أنظمة تشغيل متعددة وقت التشغيل من
  workflow المستدعية الخاصة
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  التي تستدعي workflow العامة القابلة لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- هذا التقسيم مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا،
  وحتميًا، ومركّزًا على artifacts، بينما تبقى الفحوصات الحية الأبطأ في
  مسارها الخاص حتى لا تُبطئ النشر أو تعيقه
- يجب إرسال فحوصات الإصدار من مرجع workflow الخاص بـ `main` أو من
  مرجع workflow خاص بـ `release/YYYY.M.D` حتى تبقى منطق workflow والأسرار
  تحت السيطرة
- تقبل تلك workflow إما وسم إصدار موجودًا أو SHA كاملًا بطول 40 حرفًا لالتزام فرع workflow الحالي
- في وضع SHA الخاص بالالتزام، لا تقبل إلا HEAD الحالي لفرع workflow؛ استخدم
  وسم إصدار للالتزامات الأقدم الخاصة بالإصدار
- يقبل الفحص التمهيدي للتحقق فقط في `OpenClaw NPM Release` أيضًا
  SHA كاملًا بطول 40 حرفًا لالتزام فرع workflow الحالي من دون اشتراط وجود وسم مدفوع
- مسار SHA هذا مخصص للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، تركّب workflow القيمة `v<package.json version>` فقط
  من أجل فحص بيانات تعريف الحزمة؛ ولا يزال النشر الحقيقي يتطلب وسم إصدار حقيقي
- تُبقي كلتا workflow مسار النشر والترقية الحقيقيين على مشغلات GitHub-hosted، بينما يمكن لمسار التحقق غير المعدِّل
  أن يستخدم مشغلات Blacksmith Linux الأكبر
- تشغّل تلك workflow
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري workflow ‏`OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد الفحص التمهيدي لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  ‏(أو وسم beta/التصحيح المطابق) قبل الموافقة
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  ‏(أو الإصدار المطابق من beta/التصحيح) للتحقق من مسار التثبيت من السجل المنشور
  في temp prefix جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من الإعداد الأولي للحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي
  مقابل حزمة npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المشتركة والمؤجرة.
  ويمكن لتشغيلات المشرف المحلية الفردية حذف متغيرات Convex وتمرير بيانات اعتماد
  env الثلاثة `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- يمكن للمشرفين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر
  workflow اليدوية `NPM Telegram Beta E2E`. وهي عمدًا يدوية فقط
  ولا تعمل عند كل merge.
- تستخدم أتمتة الإصدار الخاصة بالمشرفين الآن نهج preflight-then-promote:
  - يجب أن يمر نشر npm الحقيقي بعملية `preflight_run_id` ناجحة لإصدار npm
  - يجب إرسال نشر npm الحقيقي من الفرع نفسه `main` أو
    `release/YYYY.M.D` الذي خرجت منه عملية الفحص التمهيدي الناجحة
  - تستخدم إصدارات npm المستقرة افتراضيًا `beta`
  - يمكن لنشر npm المستقر أن يستهدف `latest` صراحةً عبر مدخل workflow
  - أصبح تغيير npm dist-tag المعتمد على الرمز موجودًا الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما
    يحتفظ المستودع العام بالنشر عبر OIDC فقط
  - `macOS Release` العامة مخصصة للتحقق فقط
  - يجب أن يجتاز النشر الخاص الحقيقي لـ mac عمليتي
    `preflight_run_id` و`validate_run_id` الخاصتين بالتحقق المسبق
  - تقوم مسارات النشر الحقيقية بترقية artifacts المُجهَّزة بدلًا من إعادة
    بنائها مرة أخرى
- بالنسبة إلى إصدارات stable التصحيحية مثل `YYYY.M.D-N`، يتحقق
  الفاحص بعد النشر أيضًا من مسار الترقية نفسه في temp-prefix من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك التصحيحات إصدارات التثبيتات العامة الأقدم
  على حمولة stable الأساسية بصمت
- يفشل الفحص التمهيدي لإصدار npm بشكل مغلق ما لم تتضمن tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة داخل `dist/control-ui/assets/`
  حتى لا نشحن لوحة متصفح فارغة مرة أخرى
- يتحقق التحقق بعد النشر أيضًا من أن التثبيت المنشور من السجل
  يحتوي على تبعيات وقت تشغيل غير فارغة للـ Plugins المضمّنة تحت تخطيط الجذر `dist/*`.
  وأي إصدار يُشحن مع حمولة تبعيات مفقودة أو فارغة للـ Plugin
  يفشل في فاحص ما بعد النشر ولا يمكن ترقيته
  إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` الخاصة بـ npm pack على
  tarball التحديث المرشحة، بحيث يلتقط installer e2e الانتفاخ غير المقصود في الحزم
  قبل مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو ملفات manifest الخاصة بتوقيت extension، أو
  مصفوفات اختبارات extension، فأعِد توليد وراجع
  مخرجات مصفوفة workflow `checks-node-extensions` المملوكة للمخطط من `.github/workflows/ci.yml`
  قبل الموافقة حتى لا تصف ملاحظات الإصدار تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح updater:
  - يجب أن ينتهي GitHub release مع الملفات المعبأة `.zip` و`.dmg` و`.dSYM.zip`
  - يجب أن يشير `appcast.xml` على `main` إلى zip المستقرة الجديدة بعد النشر
  - يجب أن يحافظ التطبيق المعبأ على bundle id غير خاص بالتصحيح، وعنوان Sparkle feed غير فارغ،
    و`CFBundleVersion` عند أو فوق الحد الأدنى القياسي لبنية Sparkle
    لذلك الإصدار

## مدخلات NPM workflow

تقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغّل:

- `tag`: وسم الإصدار المطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ وعندما تكون `preflight_only=true`، يمكن أن تكون أيضًا
  SHA الكامل الحالي بطول 40 حرفًا لالتزام فرع workflow من أجل فحص تمهيدي للتحقق فقط
- `preflight_only`: ‏`true` للتحقق/البناء/الحزم فقط، و`false` لمسار
  النشر الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى تعيد workflow استخدام
  tarball المُجهَّزة من عملية الفحص التمهيدي الناجحة
- `npm_dist_tag`: وسم npm الهدف لمسار النشر؛ والافتراضي `beta`

تقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغّل:

- `ref`: وسم إصدار موجود أو SHA كامل حالي بطول 40 حرفًا لالتزام `main`
  للتحقق منه عند الإرسال من `main`؛ ومن فرع إصدار، استخدم
  وسم إصدار موجودًا أو SHA كاملًا حاليًا بطول 40 حرفًا لالتزام فرع الإصدار

القواعد:

- يمكن لوسوم stable والتصحيح أن تنشر إلى `beta` أو `latest`
- لا يمكن لوسوم prerelease الخاصة بـ beta أن تنشر إلا إلى `beta`
- بالنسبة إلى `OpenClaw NPM Release`، يُسمح بإدخال SHA الكامل فقط عندما تكون
  `preflight_only=true`
- تكون `OpenClaw Release Checks` دائمًا مخصصة للتحقق فقط وتقبل أيضًا
  SHA الالتزام الحالية لفرع workflow
- كما يتطلب وضع SHA الخاص بالالتزام في فحوصات الإصدار أيضًا HEAD الحالي لفرع workflow
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسها المستخدمة أثناء الفحص التمهيدي؛
  وتتحقق workflow من استمرار تلك البيانات التعريفية قبل النشر

## تسلسل إصدار npm المستقر

عند قطع إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الكاملة الحالية لفرع workflow
     لإجراء dry run للتحقق فقط من workflow الخاصة بالفحص التمهيدي
2. اختر `npm_dist_tag=beta` لتدفّق beta-first المعتاد، أو `latest` فقط
   عندما تريد عمدًا نشر stable مباشرة
3. شغّل `OpenClaw Release Checks` بشكل منفصل باستخدام الوسم نفسه أو
   SHA الكاملة الحالية لفرع workflow عندما تريد تغطية live prompt cache،
   وQA Lab parity، وMatrix، وTelegram
   - هذا منفصل عن عمد حتى تبقى التغطية الحية متاحة من دون
     إعادة ربط الفحوصات الطويلة أو غير المستقرة بـ workflow الخاصة بالنشر
4. احفظ `preflight_run_id` الناجحة
5. شغّل `OpenClaw NPM Release` مرة أخرى مع `preflight_only=false`، وباستخدام
   `tag` نفسها، و`npm_dist_tag` نفسها، و`preflight_run_id` المحفوظة
6. إذا وصل الإصدار إلى `beta`، فاستخدم workflow الخاصة
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
7. إذا نُشر الإصدار عمدًا مباشرة إلى `latest` وكان ينبغي أن تتبعه `beta`
   بالبنية المستقرة نفسها فورًا، فاستخدم تلك workflow الخاصة نفسها
   لتوجيه كلا dist-tag إلى الإصدار المستقر، أو اترك مزامنة
   self-healing المجدولة الخاصة بها تنقل `beta` لاحقًا

يوجد تغيير dist-tag في المستودع الخاص لأسباب أمنية لأنه لا يزال
يتطلب `NPM_TOKEN`، بينما يحتفظ المستودع العام بالنشر عبر OIDC فقط.

وهذا يبقي مسار النشر المباشر ومسار الترقية beta-first موثقين وكلاهما
مرئيين للمشغّل.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر
1Password CLI ‏(`op`) داخل جلسة tmux مخصصة فقط. ولا تستدعِ `op`
مباشرة من shell الوكيل الرئيسية؛ فإبقاؤها داخل tmux يجعل المطالبات،
والتنبيهات، ومعالجة OTP قابلة للملاحظة ويمنع تكرار تنبيهات المضيف.

## المراجع العامة

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

يستخدم المشرفون وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
كسجل التشغيل الفعلي.

## ذو صلة

- [قنوات الإصدار](/ar/install/development-channels)
