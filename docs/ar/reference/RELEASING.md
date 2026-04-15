---
read_when:
    - أبحث عن تعريفات قنوات الإصدار العامة
    - أبحث عن تسمية الإصدارات والوتيرة
summary: قنوات الإصدار العامة، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-04-15T07:17:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88724307269ab783a9fbf8a0540fea198d8a3add68457f4e64d5707114fa518c
    source_path: reference/RELEASING.md
    workflow: 15
---

# سياسة الإصدار

لدى OpenClaw ثلاث مسارات إصدار عامة:

- stable: إصدارات موسومة تُنشَر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند الطلب الصريح
- beta: وسوم إصدارات تمهيدية تُنشَر إلى npm `beta`
- dev: الرأس المتحرك لفرع `main`

## تسمية الإصدارات

- إصدار الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار التصحيح للإصدار المستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار beta التمهيدي: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفارًا بادئة إلى الشهر أو اليوم
- `latest` يعني إصدار npm المستقر المُرقّى الحالي
- `beta` يعني هدف تثبيت beta الحالي
- تُنشَر الإصدارات المستقرة وتصحيحات الإصدارات المستقرة إلى npm `beta` افتراضيًا؛ ويمكن لمشغّلي الإصدار استهداف `latest` صراحةً، أو ترقية بنية beta تم التحقق منها لاحقًا
- كل إصدار من OpenClaw يشحن حزمة npm وتطبيق macOS معًا

## وتيرة الإصدار

- تبدأ الإصدارات عبر beta أولًا
- لا يأتي الإصدار المستقر إلا بعد التحقق من أحدث إصدار beta
- إن إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصّصة للمشرفين فقط

## الفحوصات التمهيدية للإصدار

- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون
  عناصر الإصدار المتوقعة `dist/*` وحزمة Control UI موجودة من أجل
  خطوة التحقق من الحزمة
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- تعمل فحوصات الإصدار الآن ضمن سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يتم إرسال التحقق من التثبيت والترقية عبر الأنظمة المختلفة وقت التشغيل من
  سير العمل الخاص المستدعي
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  الذي يستدعي سير العمل العام القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- هذا الفصل مقصود: للحفاظ على مسار إصدار npm الفعلي قصيرًا،
  وحتميًا، ومركّزًا على العناصر، بينما تبقى الفحوصات الحية الأبطأ في
  مسارها الخاص حتى لا تؤخر أو تمنع النشر
- يجب إرسال فحوصات الإصدار من مرجع سير عمل `main` حتى تبقى
  منطقية سير العمل والأسرار معتمدة وقياسية
- يقبل سير العمل هذا إما وسم إصدار موجودًا أو قيمة SHA كاملة من 40 حرفًا
  لالتزام `main` الحالي
- في وضع SHA الخاص بالالتزام، لا يقبل إلا HEAD الحالي لـ `origin/main`؛ استخدم
  وسم إصدار لالتزامات الإصدار الأقدم
- إن الفحص التمهيدي للتحقق فقط في `OpenClaw NPM Release` يقبل أيضًا
  قيمة SHA كاملة من 40 حرفًا لالتزام `main` الحالي دون الحاجة إلى وسم مدفوع
- هذا المسار الخاص بـ SHA مخصّص للتحقق فقط ولا يمكن ترقيته إلى نشر فعلي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط من أجل
  فحص بيانات الحزمة؛ أما النشر الفعلي فما زال يتطلب وسم إصدار حقيقي
- يحافظ كلا سيرَي العمل على مسار النشر والترقية الفعليين على
  GitHub-hosted runners، بينما يمكن لمسار التحقق غير المعدِّل استخدام
  مشغلات Blacksmith Linux الأكبر
- يشغّل سير العمل هذا
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سريَّي سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد الفحص التمهيدي لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الموافقة
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/التصحيح المطابق) للتحقق من مسار التثبيت من السجل المنشور
  في بادئة مؤقتة جديدة
- تستخدم أتمتة الإصدار الخاصة بالمشرفين الآن أسلوب الفحص التمهيدي ثم الترقية:
  - يجب أن يجتاز نشر npm الفعلي قيمة `preflight_run_id` ناجحة لـ npm
  - تُوجَّه إصدارات npm المستقرة إلى `beta` افتراضيًا
  - يمكن لنشر npm المستقر استهداف `latest` صراحةً عبر مدخلات سير العمل
  - أصبحت عملية تغيير npm dist-tag المعتمدة على الرمز المميز موجودة الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما يحتفظ
    المستودع العام بنشر يعتمد على OIDC فقط
  - إن `macOS Release` العام مخصّص للتحقق فقط
  - يجب أن يجتاز النشر الخاص الفعلي لـ mac قيمة mac خاصة ناجحة لكل من
    `preflight_run_id` و`validate_run_id`
  - تقوم مسارات النشر الفعلية بترقية العناصر المُحضّرة بدلًا من
    إعادة بنائها مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق فاحص ما بعد النشر
  أيضًا من مسار الترقية نفسه في البادئة المؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار تثبيتات global الأقدم بصمت على
  الحمولة الأساسية للإصدار المستقر
- يفشل الفحص التمهيدي لإصدار npm بشكل مغلق ما لم تتضمن الحزمة المضغوطة كِلا
  `dist/control-ui/index.html` وحمولة غير فارغة لـ `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` الخاصة بحزمة npm على
  الحزمة المضغوطة المرشحة للتحديث، بحيث تلتقط اختبارات المُثبّت الشاملة
  التضخم العرضي في الحزمة قبل مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI أو ملفات توقيت الإضافات أو
  مصفوفات اختبارات الإضافات، فأعد توليد وراجع مخرجات مصفوفة سير العمل
  `checks-node-extensions` المملوكة للمخطط من `.github/workflows/ci.yml`
  قبل الموافقة حتى لا تصف ملاحظات الإصدار بنية CI قديمة
- يتضمن جاهزية إصدار macOS المستقر أيضًا أسطح التحديث:
  - يجب أن ينتهي إصدار GitHub مع الحزم `.zip` و`.dmg` و`.dSYM.zip`
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحتفظ التطبيق المعبأ بمعرّف حزمة غير خاص بالتصحيح، وعنوان URL غير فارغ
    لخلاصة Sparkle، وقيمة `CFBundleVersion` تساوي أو تتجاوز الحد الأدنى
    المعتمد لبناء Sparkle لذلك الإصدار

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` مدخلات يتحكم بها المشغّل التالية:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`; وعندما يكون `preflight_only=true`، يمكن أن يكون أيضًا
  قيمة SHA كاملة من 40 حرفًا لالتزام `main` الحالي للتحقق التمهيدي فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الفعلي
- `preflight_run_id`: مطلوب في مسار النشر الفعلي حتى يعيد سير العمل استخدام
  الحزمة المضغوطة المُحضّرة من تشغيل الفحص التمهيدي الناجح
- `npm_dist_tag`: وسم npm الهدف لمسار النشر؛ والقيمة الافتراضية هي `beta`

يقبل `OpenClaw Release Checks` مدخلات يتحكم بها المشغّل التالية:

- `ref`: وسم إصدار موجود أو قيمة SHA كاملة من 40 حرفًا لالتزام `main`
  الحالي من أجل التحقق

القواعد:

- يمكن لوسوم stable وcorrection النشر إلى `beta` أو `latest`
- يمكن لوسوم beta التمهيدية النشر إلى `beta` فقط
- يُسمح بإدخال SHA الكامل للالتزام فقط عندما يكون `preflight_only=true`
- يتطلب وضع SHA الخاص بالالتزام في فحوصات الإصدار أيضًا HEAD الحالي لـ `origin/main`
- يجب أن يستخدم مسار النشر الفعلي نفس `npm_dist_tag` المستخدم أثناء الفحص التمهيدي؛
  ويتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر

## تسلسل إصدار npm المستقر

عند إصدار نسخة npm مستقرة:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام قيمة SHA الكاملة الحالية لفرع `main`
     لإجراء تشغيل تجريبي للتحقق فقط من سير عمل الفحص التمهيدي
2. اختر `npm_dist_tag=beta` للتدفق المعتاد الذي يبدأ عبر beta، أو `latest` فقط
   عندما تريد عمدًا نشر إصدار مستقر مباشر
3. شغّل `OpenClaw Release Checks` بشكل منفصل باستخدام الوسم نفسه أو
   قيمة SHA الكاملة الحالية لفرع `main` عندما تريد تغطية حية لذاكرة التخزين المؤقت للمطالبات
   - هذا الفصل مقصود حتى يبقى التغطية الحية متاحة دون
     إعادة ربط الفحوصات الطويلة أو غير المستقرة بسير عمل النشر
4. احفظ قيمة `preflight_run_id` الناجحة
5. شغّل `OpenClaw NPM Release` مرة أخرى مع `preflight_only=false`، ونفس
   `tag`، ونفس `npm_dist_tag`، وقيمة `preflight_run_id` المحفوظة
6. إذا نزل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
7. إذا نُشر الإصدار عمدًا مباشرة إلى `latest` وكان ينبغي أن يتبعه `beta`
   بالبنية المستقرة نفسها فورًا، فاستخدم سير العمل الخاص نفسه
   لتوجيه كلا dist-tags إلى الإصدار المستقر، أو اترك مزامنة الإصلاح الذاتي
   المجدولة تنقل `beta` لاحقًا

توجد عملية تعديل dist-tag في المستودع الخاص لأسباب أمنية لأنها ما تزال
تتطلب `NPM_TOKEN`، بينما يحتفظ المستودع العام بنشر يعتمد على OIDC فقط.

وهذا يُبقي كلاً من مسار النشر المباشر ومسار الترقية الذي يبدأ عبر beta
موثّقين ومرئيين للمشغّل.

## المراجع العامة

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

يستخدم المشرفون وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
لدليل التشغيل الفعلي.
