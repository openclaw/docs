---
read_when:
    - البحث عن تعريفات قنوات الإصدار العامة
    - البحث عن تسمية الإصدارات والوتيرة الزمنية للإصدار
summary: قنوات الإصدار العامة، وتسمية الإصدارات، والوتيرة الزمنية للإصدار
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-04-11T02:47:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca613d094c93670c012f0b79720fad0d5d85be802f54b0acb7a8f22aca5bde12
    source_path: reference/RELEASING.md
    workflow: 15
---

# سياسة الإصدار

لدى OpenClaw ثلاث مسارات إصدار عامة:

- stable: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- beta: وسوم إصدارات تجريبية مسبقة تُنشر إلى npm `beta`
- dev: الرأس المتحرك للفرع `main`

## تسمية الإصدارات

- إصدار stable: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار تصحيحي لـ stable: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار beta تمهيدي: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفارًا بادئة إلى الشهر أو اليوم
- `latest` يعني إصدار npm المستقر المروّج الحالي
- `beta` يعني هدف التثبيت التجريبي الحالي
- تُنشر إصدارات stable والإصدارات التصحيحية لـ stable إلى npm `beta` افتراضيًا؛ ويمكن لمشغلي الإصدار الاستهداف الصريح لـ `latest`، أو ترقية بناء beta مُتحقق منه لاحقًا
- يشحن كل إصدار من OpenClaw حزمة npm وتطبيق macOS معًا

## وتيرة الإصدار

- تنتقل الإصدارات عبر beta أولًا
- لا يتبع stable إلا بعد التحقق من أحدث إصدار beta
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## الفحص التمهيدي للإصدار

- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون
  عناصر الإصدار المتوقعة في `dist/*` وحزمة Control UI موجودة من أجل خطوة
  التحقق من الحزمة
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- يشغّل الفحص التمهيدي لـ npm على الفرع الرئيسي أيضًا
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  قبل تغليف tarball، باستخدام كل من سرّي سير العمل `OPENAI_API_KEY` و
  `ANTHROPIC_API_KEY`
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الموافقة
- بعد النشر إلى npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو الإصدار المطابق لـ beta/التصحيح) للتحقق من
  مسار التثبيت المنشور في السجل ضمن بادئة temp جديدة
- تستخدم أتمتة الإصدار الخاصة بالمشرفين الآن أسلوب الفحص التمهيدي ثم الترقية:
  - يجب أن يجتاز النشر الفعلي إلى npm قيمة `preflight_run_id` ناجحة لـ npm
  - تُوجَّه إصدارات npm المستقرة إلى `beta` افتراضيًا
  - يمكن أن يستهدف نشر npm المستقر `latest` صراحةً عبر مدخلات سير العمل
  - ما تزال ترقية npm المستقرة من `beta` إلى `latest` متاحة كوضع يدوي صريح في سير العمل الموثوق `OpenClaw NPM Release`
  - ما يزال وضع الترقية هذا يحتاج إلى `NPM_TOKEN` صالح في بيئة `npm-release` لأن إدارة npm `dist-tag` منفصلة عن النشر الموثوق
  - إن `macOS Release` العام مخصص للتحقق فقط
  - يجب أن يجتاز النشر الخاص الفعلي على mac عمليتي
    `preflight_run_id` و`validate_run_id` الخاصتين بـ mac الخاص بنجاح
  - تقوم مسارات النشر الفعلية بترقية العناصر المُحضّرة بدلًا من إعادة بنائها
    مرة أخرى
- بالنسبة إلى الإصدارات التصحيحية المستقرة مثل `YYYY.M.D-N`، يتحقق المدقق بعد النشر
  أيضًا من مسار الترقية نفسه في بادئة temp من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك التصحيحات القديمة للتثبيتات العامة
  على حمولة stable الأساسية بصمت
- يفشل الفحص التمهيدي لإصدار npm بشكل مغلق ما لم تتضمن tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة لـ `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- إذا كان عمل الإصدار قد مس تخطيط CI، أو بيانات توقيت الإضافات، أو
  مصفوفات اختبارات الإضافات، فأعد توليد وراجع نواتج مصفوفة سير العمل
  `checks-node-extensions` المملوكة للمخطِّط من `.github/workflows/ci.yml`
  قبل الموافقة حتى لا تصف ملاحظات الإصدار تخطيط CI قديمًا
- تشمل جاهزية إصدار macOS المستقر أيضًا أسطح التحديث:
  - يجب أن ينتهي إصدار GitHub وفيه الملفات المعبأة `.zip` و`.dmg` و`.dSYM.zip`
  - يجب أن يشير `appcast.xml` على `main` إلى zip المستقر الجديد بعد النشر
  - يجب أن يحتفظ التطبيق المعبأ بمعرّف حزمة غير مخصص للتصحيح، وعنوان URL غير فارغ
    لتغذية Sparkle، وقيمة `CFBundleVersion` مساوية أو أعلى من الحد الأدنى
    القياسي لبناء Sparkle لذلك الإصدار

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغّل:

- `tag`: وسم الإصدار المطلوب، مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`
- `preflight_only`: القيمة `true` للتحقق/البناء/التغليف فقط، و`false` لمسار النشر
  الفعلي
- `preflight_run_id`: مطلوب في مسار النشر الفعلي حتى يعيد سير العمل استخدام
  tarball المُحضّرة من تشغيل الفحص التمهيدي الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ والقيمة الافتراضية هي `beta`
- `promote_beta_to_latest`: القيمة `true` لتخطي النشر ونقل بناء stable
  منشور بالفعل على `beta` إلى `latest`

القواعد:

- يمكن لوسوم stable ووسوم التصحيح النشر إلى `beta` أو `latest`
- لا يمكن لوسوم الإصدارات التمهيدية beta النشر إلا إلى `beta`
- يجب أن يستخدم مسار النشر الفعلي نفس `npm_dist_tag` المستخدم أثناء الفحص التمهيدي؛
  ويتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر
- يجب أن يستخدم وضع الترقية وسم stable أو وسم تصحيح، و`preflight_only=false`،
  و`preflight_run_id` فارغًا، و`npm_dist_tag=beta`
- يتطلب وضع الترقية أيضًا `NPM_TOKEN` صالحًا في بيئة `npm-release`
  لأن `npm dist-tag add` ما يزال يحتاج إلى مصادقة npm العادية

## تسلسل إصدار npm المستقر

عند إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
2. اختر `npm_dist_tag=beta` لتدفق beta-first العادي، أو `latest` فقط
   عندما تريد عمدًا نشر stable مباشر
3. احفظ `preflight_run_id` الناجح
4. شغّل `OpenClaw NPM Release` مرة أخرى مع `preflight_only=false`، ونفس
   `tag`، ونفس `npm_dist_tag`، و`preflight_run_id` المحفوظ
5. إذا وصل الإصدار إلى `beta`، فشغّل `OpenClaw NPM Release` لاحقًا مع
   نفس وسم stable، و`promote_beta_to_latest=true`، و`preflight_only=false`،
   و`preflight_run_id` فارغًا، و`npm_dist_tag=beta` عندما تريد نقل ذلك
   البناء المنشور إلى `latest`

ما يزال وضع الترقية يتطلب موافقة بيئة `npm-release` ووجود
`NPM_TOKEN` صالح في تلك البيئة.

وهذا يبقي كلًا من مسار النشر المباشر ومسار الترقية من beta-first
موثقين ومرئيين للمشغل.

## المراجع العامة

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

يستخدم المشرفون وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
كدليل التشغيل الفعلي.
