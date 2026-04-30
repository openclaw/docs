---
read_when:
    - البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرتها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، وصناديق التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-04-30T08:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

يملك OpenClaw ثلاثة مسارات إصدار عامة:

- المستقر: إصدارات موسومة تُنشر إلى npm `beta` افتراضياً، أو إلى npm `latest` عند طلب ذلك صراحة
- بيتا: وسوم إصدار تمهيدي تُنشر إلى npm `beta`
- التطوير: الرأس المتحرك للفرع `main`

## تسمية الإصدارات

- إصدار مستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار تصحيح مستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار بيتا تمهيدي: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفاراً بادئة إلى الشهر أو اليوم
- يعني `latest` إصدار npm المستقر المرقى الحالي
- يعني `beta` هدف تثبيت بيتا الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضياً؛ يمكن لمشغلي الإصدار استهداف `latest` صراحة، أو ترقية بنية بيتا مفحوصة لاحقاً
- كل إصدار مستقر من OpenClaw يشحن حزمة npm وتطبيق macOS معاً؛
  تتحقق إصدارات بيتا عادةً من مسار npm/الحزمة وتنشره أولاً، مع
  حجز بناء/توقيع/توثيق تطبيق mac للإصدار المستقر ما لم يُطلب ذلك صراحة

## وتيرة الإصدار

- تتحرك الإصدارات بطريقة بيتا أولاً
- لا يتبع الإصدار المستقر إلا بعد التحقق من أحدث بيتا
- ينشئ المشرفون الإصدارات عادةً من فرع `release/YYYY.M.D` مُنشأ
  من `main` الحالي، كي لا يمنع تحقق الإصدار وإصلاحاته التطوير الجديد
  على `main`
- إذا دُفع وسم بيتا أو نُشر واحتاج إلى إصلاح، ينشئ المشرفون
  وسم `-beta.N` التالي بدلاً من حذف وسم بيتا القديم أو إعادة إنشائه
- تظل إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  للمشرفين فقط

## قائمة تحقق مشغل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد وسم التوزيع، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار المخصص للمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وأكد أن الالتزام الهدف مدفوع،
   وأكد أن CI للفرع `main` الحالي أخضر بما يكفي للتفرع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، وأبقِ الإدخالات موجهة للمستخدم، ثم التزم بها وادفعها وأعد الأساس/اسحب
   مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب الاحتفاظ به
   عمداً.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ أعمال الإصدار العادية
   مباشرة على `main`.
5. ارفع كل موضع إصدار مطلوب للوسم المقصود، ثم شغّل فحص ما قبل الإطلاق
   المحلي الحتمي:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل من 40 حرفاً لفرع الإصدار للتحقق فقط
   في فحص ما قبل الإطلاق. احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار، أو الوسم، أو SHA الالتزام الكامل. هذه هي نقطة الدخول اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest، وDocker، وQA Lab، وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر
   ملف أو مسار أو مهمة سير عمل أو ملف تعريف حزمة أو مزود أو قائمة سماح نموذج
   يثبت الإصلاح. أعد تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير
   الأدلة السابقة قديمة.
9. بالنسبة لبيتا، ضع الوسم `vYYYY.M.D-beta.N`، وانشر بوسم توزيع npm `beta`، ثم شغّل
   قبول الحزمة بعد النشر ضد حزمة `openclaw@YYYY.M.D-beta.N`
   أو `openclaw@beta` المنشورة. إذا احتاجت بيتا مدفوعة أو منشورة إلى إصلاح، فأنشئ
   `-beta.N` التالي؛ لا تحذف بيتا القديمة ولا تعيد كتابتها.
10. بالنسبة للإصدار المستقر، لا تتابع إلا بعد أن تملك بيتا المفحوصة أو مرشح الإصدار
    أدلة التحقق المطلوبة. يعيد نشر npm المستقر استخدام أثر فحص ما قبل الإطلاق
    الناجح عبر `preflight_run_id`؛ كما تتطلب جاهزية إصدار macOS المستقر
    وجود `.zip` و`.dmg` و`.dSYM.zip` المعبأة، وملف
    `appcast.xml` المحدث على `main`.
11. بعد النشر، شغّل مدقق npm بعد النشر، واختبار Telegram E2E الاختياري المستقل
    لحزمة npm المنشورة عندما تحتاج إلى دليل قناة بعد النشر،
    وترقية وسم التوزيع عند الحاجة، وملاحظات إصدار/إصدار تمهيدي على GitHub من
    قسم `CHANGELOG.md` المطابق الكامل، وخطوات إعلان الإصدار.

## فحص ما قبل الإصدار

- شغّل `pnpm check:test-types` قبل فحص ما قبل الإصدار حتى يظل TypeScript الخاص بالاختبارات
  مشمولًا خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل فحص ما قبل الإصدار حتى تكون فحوصات دورات الاستيراد
  وحدود البنية الأوسع ناجحة خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون عناصر
  الإصدار المتوقعة `dist/*` وحزمة Control UI موجودة لخطوة التحقق من الحزمة
- شغّل سير العمل اليدوي `Full Release Validation` قبل الموافقة على الإصدار
  لبدء كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا،
  أو وسمًا، أو SHA كاملًا للالتزام، ويرسل `CI` يدويًا، ويرسل
  `OpenClaw Release Checks` لاختبارات تثبيت smoke، وقبول الحزمة، وحزم مسار
  إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix،
  ومسارات Telegram. قدّم `npm_telegram_package_spec` فقط بعد نشر حزمة
  وعندما ينبغي تشغيل Telegram E2E بعد النشر أيضًا. قدّم
  `evidence_package_spec` عندما ينبغي أن يثبت تقرير الأدلة الخاص أن التحقق
  يطابق حزمة npm منشورة من دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد دليلًا جانبيًا
  لحزمة مرشحة بينما يستمر عمل الإصدار. استخدم `source=npm` من أجل
  `openclaw@beta` أو `openclaw@latest` أو إصدار دقيق؛ و`source=ref`
  لحزم فرع/وسم/SHA موثوق به في `package_ref` باستخدام حزمة الاختبار الحالية
  `workflow_ref`؛ و`source=url` لأرشيف tarball عبر HTTPS مع SHA-256 مطلوب؛
  أو `source=artifact` لأرشيف tarball مرفوع بواسطة تشغيل آخر من GitHub
  Actions. يحل سير العمل المرشح إلى `package-under-test`، ويعيد استخدام
  مجدول إصدار Docker E2E ضد ذلك الأرشيف، ويمكنه تشغيل Telegram QA ضد
  الأرشيف نفسه باستخدام `telegram_mode=mock-openai` أو
  `telegram_mode=live-frontier`.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  الملفات الشخصية الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/Plugin الأصلية للأثر من دون OpenWebUI أو ClawHub حي
  - `product`: ملف الحزمة الشخصي إضافة إلى قنوات MCP، وتنظيف cron/subagent،
    وبحث الويب عبر OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار دقيق لـ `docker_lanes` لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI العادية
  الكاملة لمرشح الإصدار. تتجاوز إرسالات CI اليدوية نطاق التغييرات
  وتفرض شظايا Linux Node، وشظايا Plugin المجمعة، وعقود القنوات، وتوافق
  Node 22، و`check`، و`check-additional`، واختبار build smoke، وفحوصات
  الوثائق، وPython skills، وWindows، وmacOS، وAndroid، ومسارات Control UI i18n.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. يمرّن
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء spans للتتبعات
  المصدّرة، والسمات المحدودة، وتنقيح المحتوى/المعرّفات من دون الحاجة إلى
  Opik أو Langfuse أو مجمع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا بوابة تكافؤ QA Lab الوهمية إضافة إلى
  ملف Matrix الحي السريع ومسار Telegram QA قبل الموافقة على الإصدار. تستخدم
  المسارات الحية بيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا إيجارات
  بيانات اعتماد Convex CI. شغّل سير العمل اليدوي `QA-Lab - All Lanes` مع
  `matrix_profile=all` و`matrix_shards=true` عندما تريد جرد نقل Matrix
  والوسائط وE2EE بالكامل بالتوازي.
- التحقق من وقت تشغيل التثبيت والترقية عبر أنظمة التشغيل جزء من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، اللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا،
  وحتميًا، ومركّزًا على الأثر، بينما تبقى الفحوصات الحية الأبطأ في مسارها
  الخاص حتى لا تؤخر النشر أو تمنعه
- ينبغي إرسال فحوصات الإصدار التي تحمل أسرارًا عبر `Full Release
Validation` أو من مرجع سير عمل `main`/release حتى يبقى منطق سير العمل
  والأسرار مضبوطين
- يقبل `OpenClaw Release Checks` فرعًا، أو وسمًا، أو SHA كاملًا للالتزام
  ما دام الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار
- يقبل فحص ما قبل الإصدار الخاص بالتحقق فقط في `OpenClaw NPM Release` أيضًا
  SHA الحالي الكامل المكوّن من 40 حرفًا لالتزام فرع سير العمل من دون طلب وسم مدفوع
- مسار SHA هذا مخصص للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط لفحص بيانات
  الحزمة الوصفية؛ لا يزال النشر الحقيقي يتطلب وسم إصدار حقيقيًا
- يبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات GitHub-hosted،
  بينما يمكن لمسار التحقق غير المعدِّل استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل سير العمل هذا
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد فحص ما قبل إصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/correction المطابق) قبل الموافقة
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/correction المطابق) للتحقق من مسار تثبيت السجل المنشور
  في بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من إعداد حزمة مثبتة، وإعداد Telegram، وTelegram E2E حقيقي ضد حزمة
  npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المشتركة المؤجرة. قد
  تحذف عمليات maintainer المحلية المنفردة متغيرات Convex وتمرر بيانات اعتماد
  البيئة الثلاث `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- يمكن للمشرفين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر سير العمل
  اليدوي `NPM Telegram Beta E2E`. هو يدوي فقط عمدًا ولا يعمل عند كل دمج.
- تستخدم أتمتة إصدارات المشرفين الآن أسلوب الفحص المسبق ثم الترقية:
  - يجب أن ينجح النشر الحقيقي إلى npm في `preflight_run_id` الخاص بفحص npm المسبق
  - يجب إرسال النشر الحقيقي إلى npm من فرع `main` نفسه أو فرع
    `release/YYYY.M.D` نفسه مثل تشغيل الفحص المسبق الناجح
  - إصدارات npm المستقرة تضبط افتراضيًا إلى `beta`
  - يمكن للنشر المستقر إلى npm استهداف `latest` صراحة عبر إدخال سير العمل
  - أصبح تعديل dist-tag في npm المستند إلى الرمز المميز موجودًا الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    للأمان، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما
    يحتفظ المستودع العام بنشر OIDC فقط
  - `macOS Release` العام مخصص للتحقق فقط
  - يجب أن ينجح النشر الخاص الحقيقي لـ mac في `preflight_run_id` و`validate_run_id`
    الخاصين بـ mac الخاص
  - تروّج مسارات النشر الحقيقية الآثار المحضّرة بدل إعادة بنائها مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد
  النشر أيضًا من مسار ترقية البادئة المؤقتة نفسه من `YYYY.M.D` إلى
  `YYYY.M.D-N` حتى لا تترك تصحيحات الإصدار عمليات التثبيت العامة القديمة
  بصمت على حمولة الإصدار المستقر الأساسية
- يفشل فحص ما قبل إصدار npm مغلقًا ما لم يتضمن أرشيف tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق فحص ما بعد النشر أيضًا من أن تثبيت السجل المنشور يحتوي على تبعيات
  وقت تشغيل Plugin المجمعة غير الفارغة ضمن تخطيط `dist/*` الجذري. يفشل
  الإصدار الذي يشحن بحمولات تبعيات Plugin مجمعة مفقودة أو فارغة في مدقق
  ما بعد النشر ولا يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` لحزمة npm على
  أرشيف تحديث المرشح، حتى يلتقط installer e2e تضخم الحزمة غير المقصود قبل
  مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت Plugin، أو مصفوفات اختبار
  Plugin، فأعد توليد ومراجعة مخرجات مصفوفة
  `plugin-prerelease-extension-shard` المملوكة للمخطط من
  `.github/workflows/plugin-prerelease.yml` قبل الموافقة حتى لا تصف ملاحظات
  الإصدار تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح المحدّث:
  - يجب أن ينتهي إصدار GitHub بالحزم `.zip` و`.dmg` و`.dSYM.zip`
  - يجب أن يشير `appcast.xml` على `main` إلى zip المستقر الجديد بعد النشر
  - يجب أن يحتفظ التطبيق المحزم بمعرّف حزمة غير debug، وعنوان URL غير فارغ
    لتغذية Sparkle، و`CFBundleVersion` عند الحد الأدنى القانوني لبناء Sparkle
    لذلك الإصدار أو أعلى منه

## صناديق اختبار الإصدار

`Full Release Validation` هو طريقة المشغلين لبدء كل اختبارات ما قبل الإصدار من
نقطة دخول واحدة. شغّله من مرجع سير العمل الموثوق `main` ومرّر فرع الإصدار،
أو الوسم، أو SHA الكامل للالتزام على أنه `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

يحل سير العمل مرجع الهدف، ويرسل `CI` يدويًا مع
`target_ref=<release-ref>`، ويرسل `OpenClaw Release Checks`، ويرسل اختياريًا
Telegram E2E مستقلًا بعد النشر عندما يكون `npm_telegram_package_spec` مضبوطًا.
ثم يتوسع `OpenClaw Release Checks` إلى install smoke، وفحوصات إصدار عبر أنظمة
التشغيل، وتغطية مسار إصدار Docker الحية/E2E، وPackage Acceptance مع Telegram
package QA، وتكافؤ QA Lab، وMatrix حي، وTelegram حي. لا يكون التشغيل الكامل
مقبولًا إلا عندما يُظهر ملخص `Full Release Validation` أن `normal_ci` و
`release_checks` ناجحان، وأن أي فرع اختياري `npm_telegram` إما ناجح أو متروك
عمدًا. يتضمن ملخص المدقق النهائي جداول الوظائف الأبطأ لكل تشغيل فرعي، حتى
يستطيع مدير الإصدار رؤية المسار الحرج الحالي من دون تنزيل السجلات.
تُرسل سير العمل الفرعية من المرجع الموثوق الذي يشغّل `Full Release
Validation`، عادة `--ref main`، حتى عندما يشير `ref` الهدف إلى فرع أو وسم
إصدار أقدم. لا يوجد إدخال منفصل لمرجع سير عمل Full Release Validation؛ اختر
حزمة الاختبار الموثوقة باختيار مرجع تشغيل سير العمل.

استخدم `release_profile` لاختيار اتساع live/provider:

- `minimum`: أسرع مسار OpenAI/core حي وDocker حرج للإصدار
- `stable`: الحد الأدنى إضافة إلى تغطية provider/backend مستقرة للموافقة على الإصدار
- `full`: المستقر إضافة إلى تغطية واسعة لـ advisory provider/media

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل مرجع الهدف مرة
واحدة كـ `release-package-under-test` ويعيد استخدام ذلك الأثر في كل من فحوصات
Docker لمسار الإصدار وPackage Acceptance. هذا يبقي كل صناديق الاختبار المواجهة
للحزمة على البايتات نفسها ويتجنب عمليات بناء الحزمة المتكررة.
يستخدم OpenAI install smoke عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL`
عندما يكون متغير repo/org مضبوطًا، وإلا `openai/gpt-5.4-mini`، لأن هذا المسار
يثبت تثبيت الحزمة، والإعداد، وبدء Gateway، ودورة وكيل حية واحدة بدل قياس
أبطأ نموذج افتراضي. تظل مصفوفة provider الحية الأوسع هي المكان المخصص
للتغطية الخاصة بالنماذج.

استخدم هذه المتغيرات بحسب مرحلة الإصدار:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركز. إذا فشل صندوق واحد،
فاستخدم سير عمل الطفل الفاشل، أو المهمة، أو مسار Docker، أو ملف تعريف الحزمة،
أو مزود النموذج، أو مسار QA للإثبات التالي. شغل المظلة الكاملة مرة أخرى فقط عندما
يغير الإصلاح تنسيق الإصدار المشترك أو يجعل أدلة كل الصناديق السابقة قديمة. يعيد
المحقق النهائي للمظلة فحص معرفات تشغيل سير عمل الأطفال المسجلة، لذلك بعد إعادة
تشغيل سير عمل طفل بنجاح، أعد تشغيل مهمة الأصل الفاشلة
`Verify full validation` فقط.

للاسترداد المحدود، مرر `rerun_group` إلى المظلة. `all` هو تشغيل مرشح الإصدار
الحقيقي، و`ci` يشغل طفل CI العادي فقط، و`plugin-prerelease` يشغل طفل Plugin
الخاص بالإصدار فقط، و`release-checks` يشغل كل صناديق الإصدار، ومجموعات الإصدار
الأضيق هي `install-smoke`، و`cross-os`، و`live-e2e`، و`package`، و`qa`،
و`qa-parity`، و`qa-live`، و`npm-telegram` عندما يتم توفير مسار Telegram المستقل
للحزمة.

### Vitest

صندوق Vitest هو سير عمل الطفل اليدوي `CI`. يتجاوز CI اليدوي عمدا النطاق حسب
التغييرات ويفرض مخطط الاختبار العادي لمرشح الإصدار: أجزاء Linux Node، وأجزاء
Plugin المضمنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`،
واختبار البناء السريع، وفحوصات التوثيق، وSkills في Python، وWindows، وmacOS،
وAndroid، وi18n في Control UI.

استخدم هذا الصندوق للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية
الكاملة؟" وهو ليس مثل تحقق المنتج في مسار الإصدار. الأدلة التي ينبغي الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض URL تشغيل `CI` المرسل
- تشغيل `CI` أخضر على SHA الهدف المحدد
- أسماء الأجزاء الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- آثار توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما يحتاج
  التشغيل إلى تحليل أداء

شغل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي، لكن لا يحتاج إلى
صناديق Docker، أو QA Lab، أو التشغيل الحي، أو الأنظمة المتعددة، أو الحزمة:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker في `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، بالإضافة إلى سير عمل
`install-smoke` بوضع الإصدار. يتحقق من مرشح الإصدار عبر بيئات Docker المحزمة بدلا
من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- اختبار تثبيت سريع كامل مع تفعيل اختبار تثبيت Bun العام البطيء
- إعداد/إعادة استخدام صورة اختبار Dockerfile الجذري حسب SHA الهدف، مع تشغيل
  مهام QR والجذر/Gateway والمثبت/Bun كأجزاء install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`،
  و`plugins-runtime-services`،
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`،
  و`bundled-channels-core`، و`bundled-channels-update-a`،
  و`bundled-channels-update-discord`، و`bundled-channels-update-b`، و
  `bundled-channels-contracts`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند طلبها
- تقسيم مسارات تبعيات القنوات المضمنة عبر أجزاء channel-smoke وupdate-target
  وعقود الإعداد/التشغيل بدلا من مهمة قناة مضمنة كبيرة واحدة
- تقسيم مسارات تثبيت/إلغاء تثبيت Plugin المضمنة
  `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات مزودي التشغيل الحي/E2E وتغطية نماذج Docker الحية عندما تتضمن فحوصات
  الإصدار مجموعات حية

استخدم آثار Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للاسترداد المركز،
استخدم `docker_lanes=<lane[,lane]>` في سير عمل التشغيل الحي/E2E القابل لإعادة
الاستخدام بدلا من إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل المولدة
`package_artifact_run_id` السابق ومدخلات صور Docker المعدة عند توفرها، بحيث يمكن
لمسار فاشل إعادة استخدام ملف tarball نفسه وصور GHCR نفسها.

### QA Lab

صندوق QA Lab جزء أيضا من `OpenClaw Release Checks`. وهو بوابة الإصدار للسلوك
العاملاتي وعلى مستوى القنوات، منفصل عن آليات حزم Vitest وDocker.

تشمل تغطية QA Lab للإصدار:

- بوابة تكافؤ وهمية تقارن مسار مرشح OpenAI بخط أساس Opus 4.6 باستخدام حزمة
  التكافؤ العاملاتي
- ملف تعريف Matrix QA حي سريع باستخدام بيئة `qa-live-shared`
- مسار Telegram QA حي باستخدام إيجارات بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما تحتاج قياسات الإصدار إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات الحية؟" احتفظ بعناوين URL للآثار لمسارات التكافؤ وMatrix وTelegram
عند اعتماد الإصدار. تظل تغطية Matrix الكاملة متاحة كتشغيل QA-Lab يدوي مجزأ بدلا
من المسار الافتراضي الحرج للإصدار.

### الحزمة

صندوق الحزمة هو بوابة المنتج القابل للتثبيت. يستند إلى
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبع المحلل المرشح إلى tarball
`package-under-test` الذي يستهلكه Docker E2E، ويتحقق من مخزون الحزمة، ويسجل
إصدار الحزمة وSHA-256، ويبقي مرجع حزام سير العمل منفصلا عن مرجع مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيق
- `source=ref`: حزم فرع `package_ref` موثوقا، أو وسم، أو SHA التزام كاملا
  مع حزام `workflow_ref` المحدد
- `source=url`: تنزيل `.tgz` عبر HTTPS مع `package_sha256` مطلوب
- `source=artifact`: إعادة استخدام `.tgz` رفعه تشغيل GitHub Actions آخر

يشغل `OpenClaw Release Checks` قبول الحزمة مع `source=ref`،
و`package_ref=<release-ref>`، و`suite_profile=custom`،
و`docker_lanes=bundled-channel-deps-compat plugins-offline`، و
`telegram_mode=mock-openai`. تغطي أجزاء Docker لمسار الإصدار مسارات التثبيت
والتحديث وتحديثات Plugin المتداخلة؛ ويحافظ قبول الحزمة على توافق القنوات المضمنة
الأصلي للآثار، وتجهيزات Plugin غير المتصلة، وTelegram package QA مقابل tarball
المحلول نفسه. وهو البديل الأصلي في GitHub لمعظم تغطية الحزم/التحديث التي كانت
تتطلب Parallels سابقا. ما زالت فحوصات الأنظمة المتعددة مهمة للإعداد الأولي
والتثبيت وسلوك المنصة الخاص بكل نظام، لكن تحقق منتج الحزمة/التحديث ينبغي أن يفضل
قبول الحزمة.

التساهل القديم في قبول الحزم محدود زمنيا عمدا. قد تستخدم الحزم حتى `2026.4.25`
مسار التوافق لفجوات البيانات الوصفية المنشورة مسبقا إلى npm: إدخالات مخزون QA
الخاصة المفقودة من tarball، و`gateway install --wrapper` المفقود، وملفات patch
المفقودة في تجهيز git المشتق من tarball، و`update.channel` الدائم المفقود، ومواقع
سجلات تثبيت Plugin القديمة، واستمرارية سجل تثبيت السوق المفقودة، وترحيل بيانات
تعريف الإعداد أثناء `plugins update`. قد تحذر حزمة `2026.4.26` المنشورة من ملفات
ختم بيانات تعريف البناء المحلي التي شحنت مسبقا. يجب أن تستوفي الحزم اللاحقة عقود
الحزم الحديثة؛ وتفشل الفجوات نفسها تحقق الإصدار.

استخدم ملفات تعريف قبول الحزمة الأوسع عندما يكون سؤال الإصدار عن حزمة قابلة
للتثبيت فعليا:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

ملفات تعريف الحزمة الشائعة:

- `smoke`: مسارات تثبيت الحزمة/القناة/الوكيل السريعة، وشبكة Gateway، وإعادة تحميل
  الإعداد
- `package`: عقود حزمة التثبيت/التحديث/Plugin دون ClawHub حي؛ وهذا هو الافتراضي
  لفحص الإصدار
- `product`: `package` بالإضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي، وبحث
  OpenAI على الويب، وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لإعادات التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في قبول الحزمة. يمرر سير العمل tarball
`package-under-test` المحلول إلى مسار Telegram؛ وما زال سير عمل Telegram المستقل
يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ عندما يكون `preflight_only=true`، يمكن أن يكون أيضا SHA
  التزام فرع سير العمل الحالي كاملا المكون من 40 حرفا للتحقق التمهيدي فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى يعيد سير العمل استخدام
  tarball المعد من تشغيل التمهيد الناجح
- `npm_dist_tag`: وسم هدف npm لمسار النشر؛ الافتراضي هو `beta`

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق. تتطلب الفحوصات التي تحمل أسرارا أن
  يكون الالتزام المحلول قابلا للوصول من فرع OpenClaw أو وسم إصدار.

القواعد:

- يمكن نشر الوسوم المستقرة ووسوم التصحيح إلى `beta` أو `latest`
- يمكن نشر وسوم الإصدار التمهيدي Beta إلى `beta` فقط
- في `OpenClaw NPM Release`، يسمح بإدخال SHA التزام كامل فقط عندما يكون
  `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` هما دائما للتحقق فقط
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء التمهيد؛
  يتحقق سير العمل من أن البيانات الوصفية ما زالت صحيحة قبل متابعة النشر

## تسلسل إصدار npm مستقر

عند إصدار npm مستقر:

1. شغل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA التزام فرع سير العمل الحالي كاملا لتشغيل
     جاف للتحقق فقط من سير عمل التمهيد
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ ببيتا، أو `latest` فقط عندما
   تريد عمدا نشرا مستقرا مباشرا
3. شغل `Full Release Validation` على فرع الإصدار، أو وسم الإصدار، أو SHA الالتزام
   الكامل عندما تريد CI عاديا بالإضافة إلى تغطية ذاكرة التخزين المؤقت للمطالبات
   الحية، وDocker، وQA Lab، وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدا إلى مخطط الاختبار العادي الحتمي فقط، فشغل سير عمل `CI`
   اليدوي على مرجع الإصدار بدلا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغل `OpenClaw NPM Release` مرة أخرى مع `preflight_only=false`، ونفس `tag`،
   ونفس `npm_dist_tag`، و`preflight_run_id` المحفوظ
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
8. إذا نشر الإصدار عمدا مباشرة إلى `latest` وكان ينبغي أن يتبع `beta` البناء
   المستقر نفسه فورا، فاستخدم سير العمل الخاص نفسه لتوجيه كلا dist-tags إلى
   الإصدار المستقر، أو دع مزامنة الإصلاح الذاتي المجدولة تنقل `beta` لاحقا

يوجد تغيير dist-tag في المستودع الخاص للأمان لأنه ما زال يتطلب `NPM_TOKEN`، بينما
يحافظ المستودع العام على نشر OIDC فقط.

بهذا يبقى كل من مسار النشر المباشر ومسار الترقية الذي يبدأ ببيتا موثقين ومرئيين
للمشغل.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر
1Password CLI (`op`) فقط داخل جلسة tmux مخصصة. لا تستدعِ `op`
مباشرة من غلاف الوكيل الرئيسي؛ فإبقاؤه داخل tmux يجعل المطالبات
والتنبيهات ومعالجة OTP قابلة للملاحظة ويمنع تنبيهات المضيف المتكررة.

## المراجع العامة

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

يستخدم المشرفون وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
لدليل التشغيل الفعلي.

## ذات صلة

- [قنوات الإصدار](/ar/install/development-channels)
