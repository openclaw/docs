---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرة صدورها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، وبيئات التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدارات
x-i18n:
    generated_at: "2026-05-01T07:42:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- مستقر: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- تجريبي: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- تطوير: الرأس المتحرك لـ `main`

## تسمية الإصدارات

- نسخة الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- نسخة إصدار التصحيح المستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- نسخة ما قبل الإصدار التجريبي: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفارًا بادئة للشهر أو اليوم
- يعني `latest` إصدار npm المستقر المُروَّج الحالي
- يعني `beta` هدف التثبيت التجريبي الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضيًا؛ يمكن لمشغلي الإصدار استهداف `latest` صراحةً، أو ترقية بناء تجريبي مُدقَّق لاحقًا
- يشحن كل إصدار مستقر من OpenClaw حزمة npm وتطبيق macOS معًا؛
  تتحقق الإصدارات التجريبية عادةً من مسار npm/الحزمة وتنشره أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق mac لإصدارات المستقر ما لم يُطلب ذلك صراحةً

## وتيرة الإصدارات

- تنتقل الإصدارات بالمسار التجريبي أولًا
- لا يتبع المستقر إلا بعد التحقق من أحدث إصدار تجريبي
- ينشئ المشرفون عادةً الإصدارات من فرع `release/YYYY.M.D` تم إنشاؤه
  من `main` الحالي، كي لا تمنع عملية التحقق من الإصدار وإصلاحاته التطوير
  الجديد على `main`
- إذا دُفع وسم تجريبي أو نُشر وكان يحتاج إلى إصلاح، ينشئ المشرفون
  وسم `-beta.N` التالي بدلًا من حذف الوسم التجريبي القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد وسوم التوزيع، وتفاصيل الرجوع الطارئ في
دليل تشغيل الإصدار المخصص للمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وأكد أن الالتزام المستهدف قد دُفع،
   وأكد أن CI الحالي على `main` سليم بما يكفي لإنشاء فرع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، واجعل الإدخالات موجهة للمستخدمين، ثم التزم بها، وادفعها، وأعد الأساس/اسحب
   مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدارات في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب الإبقاء عليه
   عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. ارفع كل موضع نسخة مطلوب للوسم المقصود، ثم شغّل الفحص التمهيدي
   الحتمي المحلي:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل بطول 40 حرفًا لفرع الإصدار للتحقق التمهيدي
   فقط. احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار، أو الوسم، أو SHA الالتزام الكامل. هذه هي نقطة الدخول اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest وDocker وQA Lab وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر ملف فاشل،
   أو مسار، أو مهمة سير عمل، أو ملف تعريف حزمة، أو موفر، أو قائمة سماح نماذج
   تثبت الإصلاح. لا تُعد تشغيل المظلة الكاملة إلا عندما يجعل السطح المتغير
   الأدلة السابقة قديمة.
9. بالنسبة للتجريبي، ضع الوسم `vYYYY.M.D-beta.N`، وانشر بوسم توزيع npm `beta`، ثم شغّل
   قبول الحزمة بعد النشر ضد حزمة `openclaw@YYYY.M.D-beta.N`
   أو `openclaw@beta` المنشورة. إذا احتاج إصدار تجريبي مدفوع أو منشور إلى إصلاح، فأنشئ
   `-beta.N` التالي؛ لا تحذف الإصدار التجريبي القديم أو تعيد كتابته.
10. بالنسبة للمستقر، لا تتابع إلا بعد أن يمتلك الإصدار التجريبي المُدقَّق أو مرشح الإصدار
    أدلة التحقق المطلوبة. يعيد نشر npm المستقر استخدام أداة الفحص التمهيدي
    الناجحة عبر `preflight_run_id`؛ كما تتطلب جاهزية إصدار macOS المستقر
    وجود `.zip` و`.dmg` و`.dSYM.zip` المحزمة، وملف
    `appcast.xml` المحدّث على `main`.
11. بعد النشر، شغّل متحقق npm بعد النشر، واختبار Telegram E2E الاختياري
    لحزمة npm المنشورة المستقلة عندما تحتاج إلى دليل قناة بعد النشر،
    وترقية وسم التوزيع عند الحاجة، وملاحظات إصدار/ما قبل إصدار GitHub من
    قسم `CHANGELOG.md` المطابق الكامل، وخطوات إعلان الإصدار.

## الفحص التمهيدي للإصدار

- شغّل `pnpm check:test-types` قبل فحص ما قبل الإصدار حتى يظل TypeScript الخاص بالاختبارات
  مغطى خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل فحص ما قبل الإصدار حتى تكون فحوصات دورات الاستيراد
  الأوسع وحدود البنية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون آثار الإصدار
  المتوقعة `dist/*` وحزمة Control UI موجودة لخطوة التحقق من الحزمة
- شغّل سير العمل اليدوي `Full Release Validation` قبل اعتماد الإصدار لبدء جميع صناديق
  اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا أو وسمًا أو SHA كاملًا للالتزام،
  ويطلق `CI` يدويًا، ويطلق `OpenClaw Release Checks` لمسارات اختبار التثبيت، وقبول الحزمة،
  ومجموعات مسار إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix،
  ومسارات Telegram. وفّر `npm_telegram_package_spec` فقط بعد نشر حزمة وعندما ينبغي تشغيل
  Telegram E2E لما بعد النشر أيضًا. وفّر `evidence_package_spec` عندما ينبغي لتقرير الأدلة
  الخاص إثبات أن التحقق يطابق حزمة npm منشورة دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد دليلًا من قناة جانبية لمرشح حزمة
  بينما يستمر عمل الإصدار. استخدم `source=npm` لـ
  `openclaw@beta` أو `openclaw@latest` أو إصدار محدد بدقة؛ واستخدم `source=ref`
  لحزم فرع/وسم/SHA موثوق في `package_ref` باستخدام أداة `workflow_ref` الحالية؛
  واستخدم `source=url` لأرشيف tarball عبر HTTPS مع SHA-256 مطلوب؛ أو `source=artifact`
  لأرشيف tarball رُفع بواسطة تشغيل GitHub Actions آخر. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E مقابل ذلك الأرشيف،
  ويمكنه تشغيل ضمان جودة Telegram مقابل الأرشيف نفسه باستخدام
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن مسارات Docker
  المحددة `published-upgrade-survivor`، يكون أثر الحزمة هو المرشح ويحدد
  `published_upgrade_survivor_baseline` خط الأساس المنشور.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  ملفات التعريف الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/Plugin الأصلية للأثر دون OpenWebUI أو ClawHub حي
  - `product`: ملف تعريف الحزمة بالإضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي،
    وبحث الويب في OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` دقيق لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI طبيعية كاملة
  لمرشح الإصدار. تتجاوز إطلاقات CI اليدوية نطاق التغييرات وتفرض مقاطع Linux Node،
  ومقاطع Plugin المضمنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`،
  واختبار البناء السريع، وفحوصات المستندات، وPython skills، وWindows، وmacOS، وAndroid،
  ومسارات تدويل Control UI.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. يمرّن
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء مقاطع التتبع المصدرة،
  والسمات المحدودة، وتنقيح المحتوى/المعرفات دون الحاجة إلى Opik أو Langfuse
  أو مجمّع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا بوابة تكافؤ QA Lab الوهمية بالإضافة إلى ملف
  تعريف Matrix الحي السريع ومسار ضمان جودة Telegram قبل اعتماد الإصدار. تستخدم المسارات
  الحية بيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا عقود استعارة بيانات اعتماد Convex CI.
  شغّل سير العمل اليدوي `QA-Lab - All Lanes` مع `matrix_profile=all` و`matrix_shards=true`
  عندما تريد جرد نقل Matrix والوسائط وE2EE بالكامل على التوازي.
- تحقق التشغيل للتثبيت والترقية عبر أنظمة التشغيل جزء من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، اللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا وحتميًا ومركزًا على الآثار،
  بينما تبقى الفحوصات الحية الأبطأ في مسارها الخاص حتى لا تؤخر النشر أو تمنعه
- ينبغي إطلاق فحوصات الإصدار التي تحمل أسرارًا عبر `Full Release
Validation` أو من مرجع سير عمل `main`/release حتى تبقى منطق سير العمل
  والأسرار مضبوطة
- يقبل `OpenClaw Release Checks` فرعًا أو وسمًا أو SHA كاملًا للالتزام ما دام
  الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار
- يقبل فحص ما قبل الإصدار للتحقق فقط في `OpenClaw NPM Release` أيضًا SHA الحالي
  الكامل ذي 40 حرفًا لالتزام فرع سير العمل دون اشتراط وسم مدفوع
- مسار SHA هذا للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط لفحص بيانات
  تعريف الحزمة؛ ما زال النشر الحقيقي يتطلب وسم إصدار حقيقيًا
- يبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات مستضافة من GitHub،
  بينما يمكن لمسار التحقق غير المعدِّل استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل ذلك سير العمل
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد فحص ما قبل إصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور
  في بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تهيئة الحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي
  مقابل حزمة npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المستعارة المشتركة.
  يمكن للمشرفين في التشغيلات المحلية لمرة واحدة حذف متغيرات Convex وتمرير بيانات
  اعتماد البيئة الثلاثة `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- يمكن للمشرفين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر سير العمل
  اليدوي `NPM Telegram Beta E2E`. وهو يدوي فقط عمدًا ولا يعمل عند كل دمج.
- تستخدم أتمتة إصدار المشرفين الآن أسلوب فحص ما قبل الإصدار ثم الترقية:
  - يجب أن يجتاز نشر npm الحقيقي `preflight_run_id` ناجحًا لـ npm
  - يجب إطلاق نشر npm الحقيقي من فرع `main` نفسه أو فرع
    `release/YYYY.M.D` نفسه الذي شُغّل منه فحص ما قبل الإصدار الناجح
  - إصدارات npm المستقرة تفترض `beta` افتراضيًا
  - يمكن لنشر npm المستقر استهداف `latest` صراحة عبر إدخال سير العمل
  - أصبحت عملية تعديل npm dist-tag المعتمدة على الرمز موجودة الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    للأمان، لأن `npm dist-tag add` ما زالت تحتاج إلى `NPM_TOKEN` بينما
    يحافظ المستودع العام على نشر OIDC فقط
  - `macOS Release` العام للتحقق فقط؛ عندما يوجد وسم فقط على فرع إصدار
    لكن سير العمل يُطلق من `main`، اضبط
    `public_release_branch=release/YYYY.M.D`
  - يجب أن يجتاز نشر mac الخاص الحقيقي `preflight_run_id` و`validate_run_id`
    ناجحين للـ mac الخاص
  - ترقي مسارات النشر الحقيقية الآثار المعدة بدلًا من إعادة بنائها مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد النشر
  أيضًا من مسار الترقية نفسه في بادئة مؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار التثبيتات العامة الأقدم بصمت على حمولة المستقر الأساسية
- يفشل فحص ما قبل إصدار npm بإغلاق آمن ما لم يتضمن أرشيف tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق فحص ما بعد النشر أيضًا من أن تثبيت السجل المنشور يحتوي على تبعيات تشغيل
  Plugin المضمنة غير الفارغة تحت تخطيط الجذر `dist/*`. يفشل الإصدار الذي يُشحن
  مع حمولات تبعيات Plugin مفقودة أو فارغة في مدقق ما بعد النشر ولا يمكن ترقيته
  إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` لحزمة npm على
  أرشيف تحديث المرشح، حتى يلتقط installer e2e تضخم الحزمة العرضي
  قبل مسار نشر الإصدار
- إذا مس عمل الإصدار تخطيط CI أو بيانات توقيت Plugin أو
  مصفوفات اختبار Plugin، فأعد توليد ومراجعة مخرجات مصفوفة
  `plugin-prerelease-extension-shard` المملوكة للمخطط من
  `.github/workflows/plugin-prerelease.yml` قبل الاعتماد حتى لا تصف ملاحظات الإصدار
  تخطيط CI قديمًا
- يشمل جاهزية إصدار macOS المستقر أيضًا أسطح المحدّث:
  - يجب أن ينتهي إصدار GitHub بالحزم `.zip` و`.dmg` و`.dSYM.zip`
  - يجب أن يشير `appcast.xml` على `main` إلى zip المستقر الجديد بعد النشر
  - يجب أن يحتفظ التطبيق المعبأ بمعرف حزمة غير تصحيحي، ورابط تغذية Sparkle غير فارغ،
    و`CFBundleVersion` عند أرضية بناء Sparkle القياسية لذلك الإصدار أو أعلى منها

## صناديق اختبار الإصدار

`Full Release Validation` هو الأسلوب الذي يستخدمه المشغلون لبدء جميع اختبارات ما قبل الإصدار من
نقطة دخول واحدة. شغّله من مرجع سير العمل الموثوق `main` ومرر فرع الإصدار
أو الوسم أو SHA الكامل للالتزام كـ `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

يحل سير العمل المرجع الهدف، ويطلق `CI` يدويًا مع
`target_ref=<release-ref>`، ويطلق `OpenClaw Release Checks`، و
يطلق اختياريًا Telegram E2E مستقلًا لما بعد النشر عندما يكون
`npm_telegram_package_spec` مضبوطًا. بعد ذلك يوزع `OpenClaw Release Checks`
اختبار التثبيت السريع، وفحوصات الإصدار عبر أنظمة التشغيل، وتغطية مسار إصدار Docker
الحية/E2E، وPackage Acceptance مع ضمان جودة حزمة Telegram، وتكافؤ QA Lab، وMatrix
الحي، وTelegram الحي. لا يكون التشغيل الكامل مقبولًا إلا عندما يُظهر ملخص
`Full Release Validation` أن `normal_ci` و`release_checks` ناجحان، وأن أي ابن
`npm_telegram` اختياري إما ناجح أو متروك عمدًا. يتضمن ملخص المدقق النهائي جداول
أبطأ المهام لكل تشغيل ابن، حتى يتمكن مدير الإصدار من رؤية المسار الحرج الحالي
دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، والاختلافات بين ملفي تعريف
stable وfull، والآثار، ومقابض إعادة التشغيل المركزة.
تُطلق سير العمل الأبناء من المرجع الموثوق الذي يشغّل `Full Release
Validation`، وعادة يكون `--ref main`، حتى عندما يشير `ref` الهدف إلى فرع إصدار
أو وسم أقدم. لا يوجد إدخال منفصل لمرجع سير العمل الخاص بـ Full Release Validation؛
اختر أداة التشغيل الموثوقة باختيار مرجع تشغيل سير العمل.

استخدم `release_profile` لاختيار اتساع مزود/اختبار حي:

- `minimum`: أسرع مسار OpenAI/core حي ومسار Docker حرج للإصدار
- `stable`: minimum بالإضافة إلى تغطية مزود/خلفية مستقرة لاعتماد الإصدار
- `full`: stable بالإضافة إلى تغطية واسعة للمزودين/الوسائط الاستشارية

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع الهدف مرة واحدة باسم `release-package-under-test` ويعيد استخدام ذلك الأثر في كل من فحوصات Docker لمسار الإصدار وPackage Acceptance. هذا يُبقي كل الصناديق الموجّهة للحزم على نفس البايتات ويتجنب تكرار بناء الحزمة. يستخدم اختبار تثبيت OpenAI العابر لأنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون متغير المستودع/المؤسسة مضبوطًا، وإلا يستخدم `openai/gpt-5.4-mini`، لأن هذا المسار يثبت تثبيت الحزمة، والإعداد الأولي، وبدء تشغيل Gateway، ودورة واحدة مباشرة للوكيل، بدلًا من قياس أداء أبطأ نموذج افتراضي. تبقى مصفوفة مزودي الخدمة المباشرة الأوسع هي موضع التغطية الخاصة بالنماذج.

استخدم هذه الصيغ بحسب مرحلة الإصدار:

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

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركّز. إذا فشل صندوق واحد، فاستخدم سير العمل الفرعي الفاشل، أو المهمة، أو مسار Docker، أو ملف تعريف الحزمة، أو مزود النموذج، أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة أخرى فقط عندما يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل أدلة كل الصناديق السابقة قديمة. يعيد المدقق النهائي للمظلة التحقق من معرفات تشغيل سير العمل الفرعي المسجلة، لذلك بعد إعادة تشغيل سير عمل فرعي بنجاح، أعد تشغيل مهمة الأصل الفاشلة `Verify full validation` فقط.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل مرشح الإصدار الحقيقي، و`ci` يشغّل فقط سير العمل الفرعي العادي CI، و`plugin-prerelease` يشغّل فقط سير العمل الفرعي الخاص بالإصدار للـ plugin، و`release-checks` يشغّل كل صندوق إصدار، ومجموعات الإصدار الأضيق هي `install-smoke` و`cross-os` و`live-e2e` و`package` و`qa` و`qa-parity` و`qa-live` و`npm-telegram` عندما يكون مسار Telegram المستقل للحزمة مزودًا.

### Vitest

صندوق Vitest هو سير العمل الفرعي اليدوي `CI`. يتجاوز CI اليدوي عمدًا النطاق المستند إلى التغييرات ويفرض رسم الاختبارات العادي لمرشح الإصدار: شظايا Linux Node، وشظايا الـ plugin المجمّعة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، واختبار البناء السريع، وفحوصات المستندات، وPython skills، وWindows، وmacOS، وAndroid، وControl UI i18n.

استخدم هذا الصندوق للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية الكاملة؟" وهو ليس مماثلًا للتحقق من المنتج عبر مسار الإصدار. الأدلة التي يجب الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض عنوان URL لتشغيل `CI` المرسل
- تشغيل `CI` ناجح على SHA الهدف الدقيق
- أسماء الشظايا الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- آثار توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما يحتاج التشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي دون صناديق Docker أو QA Lab أو المباشر أو العابر لأنظمة التشغيل أو الحزم:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker في `OpenClaw Release Checks` من خلال `openclaw-live-and-e2e-checks-reusable.yml`، إضافةً إلى سير العمل `install-smoke` في وضع الإصدار. يتحقق من مرشح الإصدار عبر بيئات Docker المعبأة بدلًا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- اختبار تثبيت سريع كامل مع تفعيل اختبار التثبيت العام البطيء لـ Bun
- إعداد/إعادة استخدام صورة اختبار Dockerfile الجذر بحسب SHA الهدف، مع تشغيل مهام QR، والجذر/Gateway، والمثبّت/Bun كشرائح install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، و`plugins-runtime-install-a`، و`plugins-runtime-install-b`، و`plugins-runtime-install-c`، و`plugins-runtime-install-d`، و`plugins-runtime-install-e`، و`plugins-runtime-install-f`، و`plugins-runtime-install-g`، و`plugins-runtime-install-h`، و`bundled-channels-core`، و`bundled-channels-update-a`، و`bundled-channels-update-discord`، و`bundled-channels-update-b`، و`bundled-channels-contracts`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند طلبها
- تقسيم مسارات تبعيات القنوات المجمّعة عبر channel-smoke، وupdate-target، وأجزاء عقد الإعداد/التشغيل بدلًا من مهمة bundled-channel كبيرة واحدة
- تقسيم مسارات تثبيت/إزالة تثبيت الـ plugin المجمّعة من `bundled-plugin-install-uninstall-0` حتى `bundled-plugin-install-uninstall-23`
- مجموعات مزودي الخدمة المباشرة/E2E وتغطية نماذج Docker المباشرة عندما تتضمن فحوصات الإصدار مجموعات مباشرة

استخدم آثار Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار `.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للاسترداد المركّز، استخدم `docker_lanes=<lane[,lane]>` في سير العمل المباشر/E2E القابل لإعادة الاستخدام بدلًا من إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل المولدة `package_artifact_run_id` السابق ومدخلات صور Docker المعدّة عند توفرها، بحيث يمكن لمسار فاشل إعادة استخدام نفس tarball وصور GHCR.

### QA Lab

صندوق QA Lab جزء أيضًا من `OpenClaw Release Checks`. وهو بوابة الإصدار للسلوك الوكيلي ومستوى القنوات، منفصلة عن آليات حزم Vitest وDocker.

تشمل تغطية QA Lab للإصدار:

- بوابة تكافؤ وهمية تقارن مسار مرشح OpenAI بخط أساس Opus 4.6 باستخدام حزمة التكافؤ الوكيلي
- ملف تعريف Matrix QA مباشر سريع باستخدام بيئة `qa-live-shared`
- مسار Telegram QA مباشر باستخدام تأجيرات بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج قياس الإصدار عن بُعد إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA وتدفقات القنوات المباشرة؟" احتفظ بعناوين URL للآثار الخاصة بمسارات التكافؤ وMatrix وTelegram عند اعتماد الإصدار. تبقى تغطية Matrix الكاملة متاحة كتشغيل QA-Lab يدوي مقسّم إلى شظايا بدلًا من المسار الافتراضي الحرج للإصدار.

### الحزمة

صندوق Package هو بوابة المنتج القابل للتثبيت. وهو مدعوم بـ `Package Acceptance` والمحلل `scripts/resolve-openclaw-package-candidate.mjs`. يطبع المحلل المرشح إلى tarball باسم `package-under-test` الذي تستهلكه Docker E2E، ويتحقق من مخزون الحزمة، ويسجل إصدار الحزمة وSHA-256، ويحافظ على مرجع حزام سير العمل منفصلًا عن مرجع مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: `openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيق
- `source=ref`: حزم فرع `package_ref` موثوق، أو وسم، أو SHA التزام كامل باستخدام حزام `workflow_ref` المحدد
- `source=url`: تنزيل `.tgz` عبر HTTPS مع `package_sha256` المطلوب
- `source=artifact`: إعادة استخدام `.tgz` مرفوع بواسطة تشغيل GitHub Actions آخر

يشغّل `OpenClaw Release Checks` ‏Package Acceptance باستخدام `source=ref`، و`package_ref=<release-ref>`، و`suite_profile=custom`، و`docker_lanes=bundled-channel-deps-compat plugins-offline`، و`telegram_mode=mock-openai`. تغطي أجزاء Docker لمسار الإصدار مسارات التثبيت والتحديث وتحديث الـ plugin المتداخلة؛ وتحتفظ Package Acceptance بتوافق القنوات المجمّعة الأصلي للآثار، وتجهيزات الـ plugin غير المتصلة، وTelegram package QA مقابل نفس tarball المحلول. وهي البديل الأصلي في GitHub لمعظم تغطية الحزمة/التحديث التي كانت تتطلب Parallels سابقًا. لا تزال فحوصات الإصدار العابرة لأنظمة التشغيل مهمة للإعداد الأولي الخاص بنظام التشغيل، والمثبّت، وسلوك المنصة، لكن يجب أن يفضل تحقق منتج الحزمة/التحديث Package Acceptance.

تساهل package-acceptance القديم محدد زمنيًا عمدًا. يمكن للحزم حتى `2026.4.25` استخدام مسار التوافق لفجوات البيانات الوصفية المنشورة بالفعل إلى npm: إدخالات مخزون QA الخاصة المفقودة من tarball، و`gateway install --wrapper` المفقود، وملفات التصحيح المفقودة في تجهيز git المشتق من tarball، و`update.channel` المستمر المفقود، ومواقع سجلات تثبيت الـ plugin القديمة، واستمرارية سجل تثبيت marketplace المفقودة، وترحيل بيانات التكوين الوصفية أثناء `plugins update`. قد تحذر حزمة `2026.4.26` المنشورة بشأن ملفات ختم بيانات البناء المحلية التي شُحنت بالفعل. يجب أن تستوفي الحزم اللاحقة عقود الحزم الحديثة؛ وتفشل تلك الفجوات نفسها تحقق الإصدار.

استخدم ملفات تعريف Package Acceptance الأوسع عندما يكون سؤال الإصدار متعلقًا بحزمة فعلية قابلة للتثبيت:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

ملفات تعريف الحزم الشائعة:

- `smoke`: مسارات تثبيت الحزمة/القناة/الوكيل السريعة، وشبكة Gateway، وإعادة تحميل التكوين
- `package`: عقود حزمة التثبيت/التحديث/Plugin دون ClawHub مباشر؛ هذا هو افتراضي فحص الإصدار
- `product`: ‏`package` إضافةً إلى قنوات MCP، وتنظيف cron/subagent، وبحث OpenAI على الويب، وOpenWebUI
- `full`: أجزاء Docker لمسار الإصدار مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لإعادات التشغيل المركّزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو `telegram_mode=live-frontier` في Package Acceptance. يمرر سير العمل tarball المحلول `package-under-test` إلى مسار Telegram؛ ولا يزال سير عمل Telegram المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغّل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2`، أو `v2026.4.2-1`، أو `v2026.4.2-beta.1`؛ عندما تكون `preflight_only=true`، قد يكون أيضًا SHA الالتزام الكامل الحالي المؤلف من 40 حرفًا لفرع سير العمل من أجل فحص ما قبل النشر الخاص بالتحقق فقط
- `preflight_only`: ‏`true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى يعيد سير العمل استخدام tarball المعدّ من تشغيل ما قبل النشر الناجح
- `npm_dist_tag`: وسم هدف npm لمسار النشر؛ افتراضيًا `beta`

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغّل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق. تتطلب الفحوصات الحاملة للأسرار أن يكون الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار.

القواعد:

- يمكن نشر وسوم الإصدارات المستقرة والتصحيحية إلى `beta` أو `latest`
- يمكن نشر وسوم الإصدارات التجريبية المسبقة إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، يُسمح بإدخال SHA التزام كامل فقط عندما تكون `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` دائمًا للتحقق فقط
- يجب أن يستخدم مسار النشر الحقيقي نفس `npm_dist_tag` المستخدم أثناء ما قبل النشر؛ يتحقق سير العمل من استمرار البيانات الوصفية قبل النشر

## تسلسل إصدار npm مستقر

عند إنشاء إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الحالي الكامل لالتزام فرع سير العمل
     لتشغيل تجريبي جاف مخصص للتحقق فقط لسير عمل الفحص المسبق
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ بـ beta، أو `latest` فقط
   عندما تريد عمدًا نشرًا مستقرًا مباشرًا
3. شغّل `Full Release Validation` على فرع الإصدار، أو وسم الإصدار، أو SHA الالتزام
   الكامل عندما تريد CI عاديًا مع تغطية ذاكرة التخزين المؤقت للمطالبات الحية، وDocker، وQA Lab،
   وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدًا إلى مخطط الاختبارات العادي الحتمي فقط، فشغّل سير العمل
   اليدوي `CI` على مرجع الإصدار بدلًا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw NPM Release` مرة أخرى مع `preflight_only=false`، ونفس
   `tag`، ونفس `npm_dist_tag`، و`preflight_run_id` المحفوظ
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية تلك النسخة المستقرة من `beta` إلى `latest`
8. إذا نُشر الإصدار عمدًا مباشرةً إلى `latest` وكان ينبغي لـ `beta`
   أن يتبع نفس البناء المستقر فورًا، فاستخدم سير العمل الخاص نفسه
   لتوجيه كلا dist-tags إلى النسخة المستقرة، أو دع مزامنة الإصلاح الذاتي
   المجدولة الخاصة به تنقل `beta` لاحقًا

يوجد تعديل dist-tag في المستودع الخاص لأسباب أمنية لأنه لا يزال
يتطلب `NPM_TOKEN`، بينما يحتفظ المستودع العام بنشر يعتمد على OIDC فقط.

هذا يُبقي كلًا من مسار النشر المباشر ومسار الترقية الذي يبدأ بـ beta
موثقين ومرئيين للمشغل.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر
لـ 1Password CLI (`op`) داخل جلسة tmux مخصصة فقط. لا تستدعِ `op`
مباشرةً من صدفة الوكيل الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات،
والتنبيهات، والتعامل مع OTP قابلة للملاحظة ويمنع تنبيهات المضيف المتكررة.

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
