---
read_when:
    - البحث عن تعريفات قنوات الإصدار العامة
    - البحث عن تسمية الإصدارات والوتيرة الزمنية
summary: قنوات الإصدارات العامة وتسمية الإصدارات والوتيرة الزمنية
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-04-24T08:02:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

يمتلك OpenClaw ثلاثة مسارات إصدار عامة:

- stable: إصدارات موسومة تُنشر إلى npm ‏`beta` افتراضيًا، أو إلى npm ‏`latest` عند طلب ذلك صراحةً
- beta: وسوم prerelease تُنشر إلى npm ‏`beta`
- dev: الرأس المتحرك للفرع `main`

## تسمية الإصدارات

- إصدار stable: ‏`YYYY.M.D`
  - وسم Git: ‏`vYYYY.M.D`
- إصدار تصحيح stable: ‏`YYYY.M.D-N`
  - وسم Git: ‏`vYYYY.M.D-N`
- إصدار prerelease من نوع beta: ‏`YYYY.M.D-beta.N`
  - وسم Git: ‏`vYYYY.M.D-beta.N`
- لا تقم بإضافة أصفار بادئة إلى الشهر أو اليوم
- `latest` تعني إصدار npm stable الحالي الذي تمت ترقيته
- `beta` تعني هدف التثبيت الحالي لقناة beta
- تُنشر إصدارات stable وإصدارات التصحيح stable إلى npm ‏`beta` افتراضيًا؛ ويمكن لمشغلي الإصدارات استهداف `latest` صراحةً، أو ترقية بنية beta معتمدة لاحقًا
- يشحن كل إصدار stable من OpenClaw حزمة npm وتطبيق macOS معًا؛
  أما إصدارات beta فعادةً ما تتحقق وتنشر مسار npm/package أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق mac للإصدارات stable ما لم يُطلب ذلك صراحةً

## وتيرة الإصدارات

- تنتقل الإصدارات وفق مبدأ beta-first
- يتبع stable فقط بعد التحقق من أحدث beta
- يقوم المشرفون عادةً بقطع الإصدارات من فرع `release/YYYY.M.D` تم إنشاؤه
  من `main` الحالية، بحيث لا تمنع
  التحققات والإصلاحات الخاصة بالإصدار التطوير الجديد على `main`
- إذا تم دفع أو نشر وسم beta واحتاج إلى إصلاح، يقوم المشرفون بقطع
  وسم `-beta.N` التالي بدلًا من حذف أو إعادة إنشاء وسم beta القديم
- تكون إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  خاصة بالمشرفين فقط

## التحقق المسبق للإصدار

- شغّل `pnpm check:test-types` قبل التحقق المسبق للإصدار حتى تبقى TypeScript الخاصة بالاختبارات
  مغطاة خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل التحقق المسبق للإصدار حتى تكون
  فحوصات دورات الاستيراد وحدود البنية الأوسع سليمة خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون
  مكونات الإصدار المتوقعة `dist/*` وحزمة Control UI موجودة من أجل
  خطوة التحقق من الحزمة
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا بوابة QA Lab mock parity بالإضافة إلى
  مساري QA المباشرين لـ Matrix وTelegram قبل الموافقة على الإصدار. تستخدم المسارات المباشرة
  البيئة `qa-live-shared`؛ كما يستخدم Telegram أيضًا عقود استئجار بيانات اعتماد Convex CI.
- يتم إرسال تحقق وقت التشغيل عبر أنظمة التشغيل المختلفة للتثبيت والترقية من
  سير العمل الخاص بالمتصل
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  الذي يستدعي سير العمل العام القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- هذا الانقسام مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا،
  وحتميًا، ومركزًا على المكونات، بينما تبقى الفحوصات الحية الأبطأ في
  مسارها الخاص حتى لا تعطل أو تمنع النشر
- يجب إرسال فحوصات الإصدار من مرجع سير العمل `main` أو من
  مرجع سير العمل `release/YYYY.M.D` حتى يبقى منطق سير العمل والأسرار
  تحت التحكم
- يقبل سير العمل هذا إما وسم إصدار موجود أو SHA كاملًا مكونًا من 40 حرفًا
  لالتزام فرع سير العمل الحالي
- في وضع commit-SHA، يقبل فقط HEAD الحالية لفرع سير العمل؛ استخدم
  وسم إصدار للالتزامات الأقدم الخاصة بالإصدار
- يقبل التحقق المسبق لأغراض التحقق فقط في `OpenClaw NPM Release`
  أيضًا SHA الكامل الحالي المكون من 40 حرفًا لالتزام فرع سير العمل من دون الحاجة إلى وسم مدفوع
- يكون هذا المسار عبر SHA للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، يقوم سير العمل بتوليف `v<package.json version>` فقط من أجل فحص بيانات الحزمة الوصفية؛ أما النشر الحقيقي فلا يزال يتطلب وسم إصدار حقيقي
- يبقي كلا سيرَي العمل مسار النشر والترقية الحقيقيين على GitHub-hosted
  runners، بينما يمكن لمسار التحقق غير المغير استخدام
  Blacksmith Linux runners الأكبر
- يشغّل سير العمل هذا
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام كل من أسرار سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد التحقق المسبق من إصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  ‏(أو وسم beta/التصحيح المطابق) قبل الموافقة
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  ‏(أو إصدار beta/التصحيح المطابق) للتحقق من مسار
  التثبيت من السجل المنشور في بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من onboarding الخاصة بالحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقية
  مقابل الحزمة المنشورة على npm باستخدام مجموعة بيانات اعتماد Telegram المشتركة والمؤجرة.
  ويمكن للعمليات الفردية المحلية للمشرفين حذف متغيرات Convex وتمرير
  بيانات اعتماد البيئة الثلاثة `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- يمكن للمشرفين تشغيل التحقق نفسه بعد النشر من GitHub Actions عبر
  سير العمل اليدوي `NPM Telegram Beta E2E`. وهو يدوي فقط عمدًا ولا يعمل مع كل merge.
- تستخدم أتمتة الإصدار الخاصة بالمشرفين الآن النمط preflight-then-promote:
  - يجب أن يجتاز نشر npm الحقيقي `preflight_run_id` ناجحًا
  - يجب إرسال نشر npm الحقيقي من الفرع `main` أو
    `release/YYYY.M.D` نفسه الذي خرج منه التحقق المسبق الناجح
  - تستخدم إصدارات npm المستقرة افتراضيًا `beta`
  - يمكن لنشر npm المستقر استهداف `latest` صراحةً عبر مدخل سير العمل
  - يوجد الآن تعديل npm dist-tag المعتمد على token في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما يحتفظ
    المستودع العام بالنشر المعتمد على OIDC فقط
  - `macOS Release` العامة للتحقق فقط
  - يجب أن يجتاز نشر mac الخاص الحقيقي فحصي preflight وvalidate
    الخاصين بالـ mac الخاصة عبر `preflight_run_id` و`validate_run_id` الناجحين
  - تقوم مسارات النشر الحقيقية بترقية المكونات المُحضّرة بدلًا من إعادة بنائها مرة أخرى
- بالنسبة إلى إصدارات تصحيح stable مثل `YYYY.M.D-N`، يتحقق
  محقق ما بعد النشر أيضًا من مسار الترقية نفسه في البادئة المؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدارات بصمت عمليات التثبيت العامة الأقدم على حمولة stable
  الأساسية
- يفشل التحقق المسبق من إصدار npm بشكل مغلق ما لم يتضمن tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة لـ `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق أيضًا التحقق بعد النشر من أن التثبيت المنشور من السجل
  يحتوي على تبعيات وقت تشغيل غير فارغة لـ Plugins المضمنة تحت
  التخطيط الجذري `dist/*`. ويفشل إصدار يشحن مع حمولات
  تبعيات مفقودة أو فارغة للPlugins المضمنة في محقق ما بعد النشر ولا يمكن ترقيته
  إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` الخاصة بـ npm pack على
  tarball تحديث المرشح، بحيث يلتقط installer e2e تضخم الحزم العرضي
  قبل مسار نشر الإصدار
- إذا لامس عمل الإصدار تخطيط CI، أو بيانات توقيت الإضافات، أو مصفوفات
  اختبار الإضافات، فأعد إنشاء وراجع
  مخرجات مصفوفة سير العمل `checks-node-extensions` المملوكة للمخطط من `.github/workflows/ci.yml`
  قبل الموافقة حتى لا تصف ملاحظات الإصدار تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح أداة التحديث:
  - يجب أن ينتهي إصدار GitHub إلى وجود الحزم `.zip` و`.dmg` و`.dSYM.zip`
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحتفظ التطبيق المعبأ بمعرّف حزمة غير تصحيحي، وعنوان URL غير فارغ
    لخلاصة Sparkle، و`CFBundleVersion` عند أو فوق الحد الأدنى القياسي لبناء Sparkle
    لإصدار ذلك الإصدار

## مدخلات سير عمل NPM

تقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم فيها المشغل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ وعندما تكون `preflight_only=true`، يمكن أن يكون أيضًا
  SHA الكامل الحالي المكون من 40 حرفًا لالتزام فرع سير العمل للتحقق المسبق فقط
- `preflight_only`: ‏`true` للتحقق/البناء/الحزم فقط، و`false` لمسار
  النشر الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى يعيد سير العمل استخدام
  tarball المُحضّرة من تشغيل التحقق المسبق الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ والافتراضي هو `beta`

تقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم فيها المشغل:

- `ref`: وسم إصدار موجود أو SHA الكامل الحالي المكون من 40 حرفًا لالتزام
  `main` للتحقق عند الإرسال من `main`؛ أما من فرع إصدار فاستخدم
  وسم إصدار موجود أو SHA الكامل الحالي المكون من 40 حرفًا لالتزام فرع الإصدار

القواعد:

- يمكن لوسوم stable وcorrection النشر إلى `beta` أو `latest`
- يمكن لوسوم beta prerelease النشر إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، يُسمح بإدخال SHA الكامل فقط عندما
  تكون `preflight_only=true`
- تكون `OpenClaw Release Checks` للتحقق فقط دائمًا وتقبل أيضًا
  SHA الالتزام الحالي لفرع سير العمل
- يتطلب وضع commit-SHA الخاص بفحوصات الإصدار أيضًا HEAD الحالية لفرع سير العمل
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسها المستخدمة أثناء التحقق المسبق؛
  إذ يتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر

## تسلسل إصدار npm المستقر

عند قطع إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الكامل الحالي لفرع سير العمل
     لإجراء تشغيل جاف للتحقق فقط من سير العمل الخاص بالتحقق المسبق
2. اختر `npm_dist_tag=beta` للتدفق العادي beta-first، أو `latest` فقط
   عندما تريد عمدًا نشر stable مباشرة
3. شغّل `OpenClaw Release Checks` بشكل منفصل مع الوسم نفسه أو
   SHA الكامل الحالي لفرع سير العمل عندما تريد تغطية مباشرة لـ prompt cache،
   وQA Lab parity، وMatrix، وTelegram
   - هذا الانفصال مقصود حتى تظل التغطية الحية متاحة من دون
     إعادة ربط الفحوصات الطويلة أو المتقلبة بسير عمل النشر
4. احفظ `preflight_run_id` الناجح
5. شغّل `OpenClaw NPM Release` مرة أخرى مع `preflight_only=false`، والوسم
   نفسه، و`npm_dist_tag` نفسها، و`preflight_run_id` المحفوظ
6. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
7. إذا تم نشر الإصدار عمدًا مباشرة إلى `latest` وكان من المفترض أن
   تتبع `beta` البنية المستقرة نفسها فورًا، فاستخدم سير العمل الخاص نفسه
   للإشارة إلى الإصدار المستقر في كلتا dist-tags، أو دع المزامنة الذاتية المجدولة
   تنقل `beta` لاحقًا

يوجد تعديل dist-tag في المستودع الخاص لأسباب أمنية لأنه لا يزال
يتطلب `NPM_TOKEN`، بينما يحتفظ المستودع العام بالنشر المعتمد على OIDC فقط.

وهذا يبقي كلًا من مسار النشر المباشر ومسار الترقية beta-first موثقين
ومرئيين للمشغل.

## مراجع عامة

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

يستخدم المشرفون وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
كدليل التشغيل الفعلي.

## ذو صلة

- [قنوات الإصدار](/ar/install/development-channels)
