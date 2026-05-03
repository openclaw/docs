---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرتها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، وصناديق التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-05-03T21:40:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- stable: الإصدارات الموسومة التي تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- beta: وسوم الإصدارات التمهيدية التي تُنشر إلى npm `beta`
- dev: الرأس المتحرك لـ `main`

## تسمية الإصدارات

- نسخة الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- نسخة إصدار تصحيح مستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- نسخة الإصدار التمهيدي التجريبي: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تُضِف أصفارًا بادئة للشهر أو اليوم
- يعني `latest` إصدار npm المستقر والمُرقّى حاليًا
- يعني `beta` هدف التثبيت التجريبي الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضيًا؛ يمكن لمشغّلي الإصدار استهداف `latest` صراحةً، أو ترقية بناء تجريبي مُراجع لاحقًا
- يشحن كل إصدار OpenClaw مستقر حزمة npm وتطبيق macOS معًا؛
  تتحقق إصدارات beta عادةً من مسار npm/الحزمة وتنشره أولًا، مع إبقاء
  بناء/توقيع/توثيق تطبيق Mac للإصدار المستقر ما لم يُطلب ذلك صراحةً

## وتيرة الإصدارات

- تتحرك الإصدارات وفق نهج beta أولًا
- لا يأتي الإصدار المستقر إلا بعد التحقق من أحدث beta
- يقتطع المشرفون عادةً الإصدارات من فرع `release/YYYY.M.D` يُنشأ
  من `main` الحالي، بحيث لا تمنع عمليات تحقق الإصدار وإصلاحاته
  التطوير الجديد على `main`
- إذا دُفع وسم beta أو نُشر واحتاج إلى إصلاح، يقتطع المشرفون
  وسم `-beta.N` التالي بدل حذف وسم beta القديم أو إعادة إنشائه
- تظل إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات التعافي
  خاصة بالمشرفين فقط

## قائمة تحقق مشغّل الإصدار

هذه القائمة تمثل الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واستعادة dist-tag، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار الخاص بالمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وتأكد من دفع الالتزام المستهدف،
   وتأكد من أن CI الحالي على `main` أخضر بما يكفي لإنشاء فرع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، واجعل الإدخالات موجهة للمستخدمين، ثم ثبّته، وادفعه، وأعد إجراء rebase/pull
   مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزِل التوافق المنتهي
   فقط عندما يظل مسار الترقية مغطى، أو سجّل سبب حمله
   عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. ارفع كل موضع نسخة مطلوب للوسم المقصود، وشغّل
   `pnpm plugins:sync` حتى تشارك حزم Plugin القابلة للنشر نسخة الإصدار
   وبيانات التوافق، ثم شغّل التمهيد المحلي الحتمي:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، و`pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل من 40 حرفًا لفرع الإصدار للتحقق التمهيدي فقط.
   احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار أو الوسم أو SHA الالتزام الكامل. هذه هي نقطة الدخول اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest وDocker وQA Lab وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر
   ملف أو مسار أو مهمة workflow أو ملف تعريف حزمة أو موفر أو قائمة سماح نماذج فاشلة
   تثبت الإصلاح. أعد تشغيل المظلة الكاملة فقط عندما يجعل سطح التغيير
   الأدلة السابقة قديمة.
9. بالنسبة إلى beta، ضع الوسم `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   وينشر كل حزم Plugin القابلة للنشر إلى npm أولًا، ثم ينشر المجموعة نفسها
   إلى ClawHub ثانيًا كحزم tarball من نوع ClawPack npm-pack، ثم يرقّي
   أداة التمهيد المعدّة لـ OpenClaw npm مع dist-tag المطابق. بعد
   النشر، شغّل قبول الحزمة بعد النشر
   مقابل حزمة `openclaw@YYYY.M.D-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاج إصدار تمهيدي مدفوع أو منشور إلى إصلاح،
   فاقتطع رقم الإصدار التمهيدي المطابق التالي؛ لا تحذف الإصدار التمهيدي القديم
   أو تعيد كتابته.
10. بالنسبة إلى المستقر، لا تتابع إلا بعد أن يمتلك beta المُراجع أو مرشح الإصدار
    أدلة التحقق المطلوبة. يمر نشر npm المستقر أيضًا عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أداة التمهيد الناجحة عبر
    `preflight_run_id`؛ كما يتطلب جاهزية إصدار macOS المستقر وجود
    ملفات `.zip` و`.dmg` و`.dSYM.zip` المعبأة، و`appcast.xml` مُحدّثًا على `main`.
11. بعد النشر، شغّل متحقق ما بعد نشر npm، واختبار Telegram E2E الاختياري
    المستقل من npm المنشور عندما تحتاج إلى دليل القناة بعد النشر،
    وترقية dist-tag عند الحاجة، وملاحظات إصدار/إصدار تمهيدي GitHub من قسم
    `CHANGELOG.md` المطابق الكامل، وخطوات إعلان الإصدار.

## تمهيد الإصدار

- شغّل `pnpm check:test-types` قبل الفحص التمهيدي للإصدار حتى تبقى TypeScript الخاصة بالاختبارات
  مغطاة خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل الفحص التمهيدي للإصدار حتى تكون فحوصات دورات الاستيراد
  الأوسع وحدود المعمارية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى توجد عناصر الإصدار المتوقعة
  `dist/*` وحزمة Control UI لخطوة التحقق من الحزمة
- شغّل `pnpm plugins:sync` بعد رفع إصدار الجذر وقبل وضع الوسم. إنه
  يحدّث إصدارات حزم Plugin القابلة للنشر، وبيانات توافق OpenClaw peer/API
  الوصفية، وبيانات البناء الوصفية، ومسودات سجل تغييرات Plugin لتطابق إصدار
  النواة. `pnpm plugins:sync:check` هو حارس الإصدار غير المُعدِّل؛
  ويفشل سير عمل النشر قبل أي تعديل في السجل إذا نُسيت هذه الخطوة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل الموافقة على الإصدار
  لبدء كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا،
  أو وسمًا، أو SHA كاملًا للالتزام، ويشغّل `CI` يدويًا، ويشغّل
  `OpenClaw Release Checks` لاختبارات تثبيت الدخان، وقبول الحزمة، ومجموعات
  مسار إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab،
  وMatrix، ومسارات Telegram. مع `release_profile=full` و`rerun_group=all`،
  يشغّل أيضًا E2E حزمة Telegram ضد عنصر `release-package-under-test` من فحوصات
  الإصدار. وفّر `npm_telegram_package_spec` بعد النشر عندما ينبغي لنفس
  Telegram E2E إثبات حزمة npm المنشورة أيضًا. وفّر
  `package_acceptance_package_spec` بعد النشر عندما ينبغي لـ Package Acceptance
  تشغيل مصفوفة الحزمة/التحديث الخاصة بها ضد حزمة npm المشحونة بدلًا من
  العنصر المبني من SHA. وفّر
  `evidence_package_spec` عندما ينبغي لتقرير الأدلة الخاص إثبات أن
  التحقق يطابق حزمة npm منشورة دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد إثباتًا عبر قناة جانبية
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` من أجل
  `openclaw@beta` أو `openclaw@latest` أو إصدار إصدار دقيق؛ و`source=ref`
  لحزم فرع/وسم/SHA موثوق في `package_ref` باستخدام حاضنة `workflow_ref`
  الحالية؛ و`source=url` لأرشيف tarball عبر HTTPS مع SHA-256 مطلوب؛
  أو `source=artifact` لأرشيف tarball مرفوع بواسطة تشغيل GitHub
  Actions آخر. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E ضد ذلك
  الأرشيف، ويمكنه تشغيل QA الخاص بـ Telegram ضد الأرشيف نفسه مع
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن
  مسارات Docker المحددة `published-upgrade-survivor`، يكون عنصر الحزمة
  هو المرشح ويحدد `published_upgrade_survivor_baseline`
  خط الأساس المنشور.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات الشخصية الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/Plugin الأصلية للعنصر دون OpenWebUI أو ClawHub حي
  - `product`: ملف الحزمة الشخصي بالإضافة إلى قنوات MCP، وتنظيف cron/subagent،
    وبحث OpenAI على الويب، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` دقيق لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI العادية الكاملة
  لمرشح الإصدار. تتجاوز تشغيلات CI اليدوية تحديد النطاق حسب التغييرات
  وتفرض شظايا Linux Node، وشظايا Plugin المضمّنة، وعقود القنوات،
  وتوافق Node 22، و`check`، و`check-additional`، واختبار البناء الدخاني،
  وفحوصات المستندات، وPython skills، وWindows، وmacOS، وAndroid، ومسارات Control UI i18n.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. إنه يمرّن
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء مقاطع التتبع
  المصدّرة، والسمات المحدودة، وتنقيح المحتوى/المعرّفات دون الحاجة إلى
  Opik أو Langfuse أو جامع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المُعدِّل بعد وجود
  الوسم. شغّله من `release/YYYY.M.D` (أو `main` عند نشر وسم يمكن الوصول إليه من
  main)، ومرّر وسم الإصدار و`preflight_run_id` الناجح الخاص بـ OpenClaw npm،
  واحتفظ بنطاق نشر Plugin الافتراضي
  `all-publishable` إلا إذا كنت تشغّل إصلاحًا مركزًا عمدًا. يقوم
  سير العمل بتسلسل نشر Plugin إلى npm، ونشر Plugin إلى ClawHub، ونشر OpenClaw
  إلى npm حتى لا تُنشر حزمة النواة قبل Plugins الخارجية الخاصة بها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ QA Lab الوهمي بالإضافة إلى ملف
  Matrix الحي السريع ومسار QA الخاص بـ Telegram قبل الموافقة على الإصدار. تستخدم
  المسارات الحية بيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا عقود إيجار
  بيانات اعتماد Convex CI. شغّل سير العمل اليدوي `QA-Lab - All Lanes` مع
  `matrix_profile=all` و`matrix_shards=true` عندما تريد جرد نقل Matrix الكامل،
  والوسائط، وE2EE بالتوازي.
- تحقق وقت التشغيل للتثبيت والترقية عبر أنظمة التشغيل جزء من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، اللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا،
  وحتميًا، ومركّزًا على العناصر، بينما تبقى الفحوصات الحية الأبطأ في مسارها
  الخاص حتى لا تعطل النشر أو تمنعه
- ينبغي تشغيل فحوصات الإصدار التي تحمل أسرارًا عبر `Full Release
Validation` أو من مرجع سير عمل `main`/الإصدار حتى يظل منطق سير العمل
  والأسرار تحت السيطرة
- يقبل `OpenClaw Release Checks` فرعًا، أو وسمًا، أو SHA كاملًا للالتزام ما دام
  الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار
- يقبل الفحص التمهيدي المخصص للتحقق فقط في `OpenClaw NPM Release` أيضًا SHA
  الكامل الحالي المكون من 40 حرفًا لالتزام فرع سير العمل دون الحاجة إلى وسم مدفوع
- مسار SHA هذا مخصص للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط لفحص بيانات
  الحزمة الوصفية؛ ولا يزال النشر الحقيقي يتطلب وسم إصدار حقيقي
- يحافظ كلا سيري العمل على مسار النشر والترقية الحقيقي على مشغلات GitHub-hosted،
  بينما يمكن لمسار التحقق غير المُعدِّل استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل سير العمل ذلك
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سريّ سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد الفحص التمهيدي لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الموافقة
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور
  في بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تهيئة الحزمة المثبتة، وإعداد Telegram، وTelegram E2E حقيقي
  ضد حزمة npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المشتركة المؤجرة.
  يمكن لعمليات المشرف المحلية لمرة واحدة حذف متغيرات Convex وتمرير بيانات اعتماد البيئة
  الثلاث `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- يمكن للمشرفين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر
  سير العمل اليدوي `NPM Telegram Beta E2E`. إنه يدوي فقط عمدًا ولا يعمل
  عند كل دمج.
- تستخدم أتمتة إصدارات المشرفين الآن نمط الفحص التمهيدي ثم الترقية:
  - يجب أن يمر نشر npm الحقيقي عبر `preflight_run_id` ناجح من npm
  - يجب تشغيل نشر npm الحقيقي من الفرع نفسه `main` أو
    `release/YYYY.M.D` مثل تشغيل الفحص التمهيدي الناجح
  - إصدارات npm المستقرة تستخدم `beta` افتراضيًا
  - يمكن لنشر npm المستقر استهداف `latest` صراحة عبر مدخل سير العمل
  - أصبح تعديل npm dist-tag المعتمد على الرمز المميز موجودًا الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` ما زال يحتاج إلى `NPM_TOKEN` بينما
    يحتفظ المستودع العام بالنشر عبر OIDC فقط
  - `macOS Release` العام مخصص للتحقق فقط؛ عندما يوجد وسم فقط على
    فرع إصدار لكن سير العمل يُشغّل من `main`، اضبط
    `public_release_branch=release/YYYY.M.D`
  - يجب أن يمر نشر mac الخاص الحقيقي عبر `preflight_run_id` و`validate_run_id`
    ناجحين للـ mac الخاص
  - تروّج مسارات النشر الحقيقية العناصر المحضّرة بدلًا من إعادة بنائها
    مرة أخرى
- بالنسبة لإصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد النشر
  أيضًا من مسار الترقية نفسه ذي البادئة المؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار التثبيتات العامة الأقدم بصمت على
  حمولة الاستقرار الأساسية
- يفشل الفحص التمهيدي لإصدار npm بإغلاق افتراضي ما لم يتضمن أرشيف tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق ما بعد النشر أيضًا من وجود نقاط دخول Plugin المنشورة وبيانات
  الحزمة الوصفية في تخطيط تثبيت السجل. يفشل الإصدار الذي يشحن حمولات وقت تشغيل
  Plugin مفقودة في مدقق ما بعد النشر ولا يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` لحزمة npm على
  أرشيف tarball المرشح للتحديث، حتى يلتقط installer e2e تضخم الحزمة العرضي
  قبل مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت الامتدادات، أو
  مصفوفات اختبار الامتدادات، فأعد توليد وراجع مخرجات مصفوفة
  `plugin-prerelease-extension-shard` المملوكة للمخطط من
  `.github/workflows/plugin-prerelease.yml` قبل الموافقة حتى لا تصف ملاحظات الإصدار
  تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح التحديث:
  - يجب أن ينتهي إصدار GitHub بملفات `.zip` و`.dmg` و`.dSYM.zip` المعبأة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحافظ التطبيق المعبأ على معرف حزمة غير مخصص للتصحيح، وعنوان URL غير فارغ
    لخلاصة Sparkle، و`CFBundleVersion` عند حد أرضية بناء Sparkle القياسي
    أو أعلى منه لذلك إصدار الإصدار

## صناديق اختبار الإصدار

`Full Release Validation` هو الطريقة التي يستخدمها المشغلون لبدء كل اختبارات ما قبل الإصدار من
نقطة دخول واحدة. لإثبات التزام مثبت على فرع سريع الحركة، استخدم
المساعد حتى يعمل كل سير عمل فرعي من فرع مؤقت مثبت عند SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويشغّل `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن كل `headSha` لسير عمل فرعي
يطابق الهدف، ثم يحذف الفرع المؤقت. هذا يتجنب إثبات تشغيل فرعي أحدث على
`main` عن طريق الخطأ.

للتحقق من فرع إصدار أو وسم، شغّله من مرجع سير العمل الموثوق `main`
ومرّر فرع الإصدار أو الوسم كـ `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

يعالج سير العمل مرجع الهدف، ويرسل `CI` يدويًا مع
`target_ref=<release-ref>`، ويرسل `OpenClaw Release Checks`، ويحضّر أداة
`release-package-under-test` أصلية للفحوصات الموجهة إلى الحزمة، ويرسل اختبار
Telegram E2E المستقل للحزمة عندما تكون `release_profile=full` مع
`rerun_group=all` أو عندما يتم ضبط `npm_telegram_package_spec`. بعد ذلك توسّع
`OpenClaw Release Checks` التنفيذ إلى smoke التثبيت، وفحوصات الإصدار عبر أنظمة
التشغيل، وتغطية مسار إصدار Docker الحية/E2E، وPackage Acceptance مع QA لحزمة
Telegram، وتكافؤ QA Lab، وMatrix الحية، وTelegram الحي. لا يكون التشغيل الكامل
مقبولًا إلا عندما يعرض ملخص `Full Release Validation` نجاح `normal_ci` و
`release_checks`. في وضع full/all، يجب أن يكون الابن `npm_telegram` ناجحًا
أيضًا؛ وخارج full/all يتم تخطيه ما لم يتم توفير `npm_telegram_package_spec`
منشور. يتضمن ملخص التحقق النهائي جداول أبطأ المهام لكل تشغيل ابن، بحيث يستطيع
مدير الإصدار رؤية المسار الحرج الحالي دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، والفروقات بين ملفي
التعريف stable وfull، والأدوات، ومؤشرات إعادة التشغيل المركزة.
تُرسل سير عمل الأبناء من المرجع الموثوق الذي يشغّل `Full Release Validation`،
وعادةً `--ref main`، حتى عندما يشير `ref` الهدف إلى فرع إصدار أو وسم أقدم. لا
يوجد إدخال workflow-ref منفصل لـ Full Release Validation؛ اختر حزمة الاختبار
الموثوقة عبر اختيار مرجع تشغيل سير العمل. لا تستخدم `--ref main -f ref=<sha>`
لإثبات commit دقيق على `main` متحرك؛ لا يمكن أن تكون SHAs الخام الخاصة بـ commit
مراجع dispatch لسير العمل، لذلك استخدم `pnpm ci:full-release --sha <sha>` لإنشاء
الفرع المؤقت المثبت.

استخدم `release_profile` لاختيار اتساع التغطية الحية/المزود:

- `minimum`: أسرع مسار حي حرج للإصدار لـ OpenAI/النواة وDocker
- `stable`: الحد الأدنى إضافة إلى تغطية المزود/الخلفية المستقرة لاعتماد الإصدار
- `full`: stable إضافة إلى تغطية واسعة للمزودين/الوسائط الاستشارية

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لمعالجة مرجع الهدف مرة
واحدة باسم `release-package-under-test` وتعيد استخدام تلك الأداة في كل من فحوصات
Docker لمسار الإصدار وPackage Acceptance. يحافظ هذا على تشغيل كل البيئات الموجهة
إلى الحزمة على البايتات نفسها ويتجنب بناء الحزمة مرارًا.
يستخدم smoke تثبيت OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL`
عندما يكون متغير المستودع/المؤسسة مضبوطًا، وإلا يستخدم `openai/gpt-5.4`، لأن
هذا المسار يثبت تثبيت الحزمة، والإعداد الأولي، وبدء Gateway، ودورة وكيل حية
واحدة بدلًا من قياس أبطأ نموذج افتراضي. تبقى مصفوفة المزودين الحية الأوسع هي
مكان التغطية الخاصة بالنماذج.

استخدم هذه المتغيرات حسب مرحلة الإصدار:

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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركز. إذا فشلت بيئة واحدة،
فاستخدم سير عمل الابن الفاشل، أو المهمة، أو مسار Docker، أو ملف تعريف الحزمة، أو
مزود النموذج، أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة أخرى فقط عندما
يغير الإصلاح تنسيق الإصدار المشترك أو يجعل أدلة كل البيئات السابقة قديمة. يعيد
مدقق المظلة النهائي فحص معرّفات تشغيل سير عمل الأبناء المسجلة، لذلك بعد نجاح
إعادة تشغيل سير عمل ابن، أعد تشغيل مهمة الأصل الفاشلة `Verify full validation`
فقط.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل مرشح الإصدار
الحقيقي، و`ci` يشغّل ابن CI العادي فقط، و`plugin-prerelease` يشغّل ابن Plugin
الخاص بالإصدار فقط، و`release-checks` يشغّل كل بيئات الإصدار، ومجموعات الإصدار
الأضيق هي `install-smoke`، و`cross-os`، و`live-e2e`، و`package`، و`qa`،
و`qa-parity`، و`qa-live`، و`npm-telegram`. تتطلب إعادة تشغيل `npm-telegram`
المركزة `npm_telegram_package_spec`؛ وتستخدم تشغيلات full/all مع
`release_profile=full` أداة حزمة release-checks.

### Vitest

بيئة Vitest هي سير عمل الابن `CI` اليدوي. يتجاوز CI اليدوي عمدًا تحديد النطاق
حسب التغييرات ويفرض رسم الاختبارات العادي لمرشح الإصدار: أجزاء Linux Node،
وأجزاء Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`،
و`check-additional`، وsmoke البناء، وفحوصات المستندات، وSkills Python، وWindows،
وmacOS، وAndroid، وControl UI i18n.

استخدم هذه البيئة للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية
الكاملة؟" وهي ليست مثل التحقق من المنتج في مسار الإصدار. الأدلة التي يجب
الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض URL تشغيل `CI` المرسل
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الأجزاء الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- أدوات توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما يحتاج
  التشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي، لكن لا يحتاج إلى
بيئات Docker أو QA Lab أو الحية أو عبر أنظمة التشغيل أو الحزمة:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

توجد بيئة Docker في `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، إضافة إلى سير عمل `install-smoke`
في وضع الإصدار. تتحقق من مرشح الإصدار من خلال بيئات Docker المحزّمة بدلًا من
الاختبارات على مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- smoke تثبيت كامل مع تمكين smoke التثبيت العام البطيء لـ Bun
- تحضير/إعادة استخدام صورة smoke لـ Dockerfile الجذري حسب SHA الهدف، مع تشغيل
  مهام QR، والجذر/Gateway، وsmoke المثبت/Bun كأجزاء install-smoke منفصلة
- مسارات E2E في المستودع
- مقاطع Docker لمسار الإصدار: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`،
  و`plugins-runtime-plugins`، و`plugins-runtime-services`،
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل مقطع `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إلغاء تثبيت Plugin المضمّنة المقسمة
  `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات مزودي live/E2E وتغطية نموذج Docker الحية عندما تتضمن فحوصات الإصدار
  مجموعات حية

استخدم أدوات Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للاسترداد المركز،
استخدم `docker_lanes=<lane[,lane]>` على سير عمل live/E2E القابل لإعادة الاستخدام
بدلًا من إعادة تشغيل كل مقاطع الإصدار. تتضمن أوامر إعادة التشغيل المولدة
`package_artifact_run_id` السابق ومدخلات صورة Docker المحضّرة عند توفرها، بحيث
يمكن لمسار فاشل إعادة استخدام tarball نفسه وصور GHCR نفسها.

### QA Lab

بيئة QA Lab جزء أيضًا من `OpenClaw Release Checks`. وهي بوابة الإصدار الخاصة
بسلوك الوكيل ومستوى القناة، منفصلة عن Vitest وآليات حزمة Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ وهمي يقارن مسار OpenAI المرشح بمرجعية Opus 4.6 باستخدام حزمة
  التكافؤ الوكيلية
- ملف تعريف QA سريع لـ Matrix الحية باستخدام بيئة `qa-live-shared`
- مسار QA لـ Telegram الحي باستخدام عقود إيجار بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما تحتاج قياسات Telemetry للإصدار إلى إثبات محلي صريح

استخدم هذه البيئة للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات الحية؟" احتفظ بعناوين URL للأدوات الخاصة بمسارات التكافؤ وMatrix
وTelegram عند اعتماد الإصدار. تبقى تغطية Matrix الكاملة متاحة كتشغيل QA-Lab
يدوي مجزأ بدلًا من المسار الافتراضي الحرج للإصدار.

### الحزمة

بيئة الحزمة هي بوابة المنتج القابل للتثبيت. تستند إلى `Package Acceptance`
والمعالج `scripts/resolve-openclaw-package-candidate.mjs`. يطبع المعالج المرشح
إلى tarball `package-under-test` الذي يستهلكه Docker E2E، ويتحقق من مخزون
الحزمة، ويسجل إصدار الحزمة وSHA-256، ويحافظ على فصل مرجع حزمة سير العمل عن مرجع
مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: `openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيق
- `source=ref`: حزّم فرع `package_ref` موثوقًا أو وسمًا أو SHA commit كاملًا مع
  حزمة `workflow_ref` المحددة
- `source=url`: نزّل `.tgz` عبر HTTPS مع `package_sha256` المطلوب
- `source=artifact`: أعد استخدام `.tgz` مرفوع من تشغيل GitHub Actions آخر

تشغّل `OpenClaw Release Checks` عملية Package Acceptance مع `source=artifact`،
وأداة حزمة الإصدار المحضّرة، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`،
و`published_upgrade_survivor_baselines=all-since-2026.4.23`،
و`published_upgrade_survivor_scenarios=reported-issues`، و`telegram_mode=mock-openai`.
تحافظ Package Acceptance على الترحيل، والتحديث، وتنظيف اعتماديات Plugin القديمة،
وتركيبات Plugin دون اتصال، وتحديث Plugin، وQA حزمة Telegram على tarball المعالج
نفسه. تغطي مصفوفة الترقية كل مرجعية مستقرة منشورة على npm من `2026.4.23` حتى
`latest`؛ استخدم Package Acceptance مع `source=npm` لمرشح تم شحنه بالفعل، أو
`source=ref`/`source=artifact` لـ tarball npm محلي مدعوم بـ SHA قبل النشر. إنها
البديل الأصلي في GitHub لمعظم تغطية الحزمة/التحديث التي كانت تتطلب Parallels
سابقًا. لا تزال فحوصات الإصدار عبر أنظمة التشغيل مهمة للإعداد الأولي الخاص
بالنظام، والمثبت، وسلوك المنصة، لكن التحقق من منتج الحزمة/التحديث يجب أن يفضل
Package Acceptance.

القائمة المرجعية الأساسية للتحقق من التحديث وPlugin هي
[اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins). استخدمها عند تحديد
أي مسار محلي أو Docker أو Package Acceptance أو release-check يثبت تغيير تثبيت/
تحديث Plugin أو تنظيف doctor أو ترحيل حزمة منشورة. ترحيل التحديث المنشور الشامل
من كل حزمة مستقرة `2026.4.23+` هو سير عمل يدوي منفصل `Update Migration`، وليس
جزءًا من Full Release CI.

تسامح package-acceptance القديم مؤطر زمنيًا عن قصد. يمكن للحزم حتى `2026.4.25`
استخدام مسار التوافق لفجوات البيانات الوصفية المنشورة أصلًا إلى npm: إدخالات
مخزون QA الخاصة المفقودة من tarball، و`gateway install --wrapper` المفقود، وملفات
patch المفقودة في تركيب git المشتق من tarball، و`update.channel` غير المحفوظ،
ومواضع سجل تثبيت Plugin القديمة، واستمرار سجل تثبيت marketplace المفقود، وترحيل
بيانات تعريف الإعدادات أثناء `plugins update`. قد تحذر الحزمة المنشورة
`2026.4.26` بخصوص ملفات ختم بيانات تعريف البناء المحلي التي تم شحنها بالفعل.
يجب أن تفي الحزم اللاحقة بعقود الحزمة الحديثة؛ تفشل تلك الفجوات نفسها التحقق من
الإصدار.

استخدم ملفات تعريف Package Acceptance الأوسع عندما يكون سؤال الإصدار متعلقًا
بحزمة فعلية قابلة للتثبيت:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

ملفات تعريف الحزمة الشائعة:

- `smoke`: مسارات سريعة لتثبيت الحزمة/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
- `package`: عقود تثبيت/تحديث/حزم Plugin من دون ClawHub مباشر؛ هذا هو الإعداد الافتراضي لفحص الإصدار
- `product`: `package` إضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي، وبحث OpenAI على الويب، وOpenWebUI
- `full`: مقاطع مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` الدقيقة لإعادات التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في Package Acceptance. يمرر سير العمل ملف tarball
المحلول `package-under-test` إلى مسار Telegram؛ ولا يزال سير عمل Telegram
المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة الدخول العادية للنشر المعدّل. ينسق
سير عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. سحب وسم الإصدار وحل SHA الخاص بالالتزام.
2. التحقق من أن الوسم قابل للوصول من `main` أو `release/*`.
3. تشغيل `pnpm plugins:sync:check`.
4. إرسال `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. إرسال `Plugin ClawHub Release` بالنطاق وSHA نفسيهما.
6. إرسال `OpenClaw NPM Release` مع وسم الإصدار، ووسم توزيع npm، و
   `preflight_run_id` المحفوظ.

مثال نشر بيتا:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

نشر مستقر إلى وسم توزيع beta الافتراضي:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

الترقية المستقرة مباشرة إلى `latest` صريحة:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

استخدم سيري العمل منخفضي المستوى `Plugin NPM Release` و`Plugin ClawHub Release`
فقط لأعمال الإصلاح أو إعادة النشر المركزة. لإصلاح Plugin محدد، مرر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أرسل سير العمل الفرعي مباشرة عندما يجب عدم نشر
حزمة OpenClaw.

## مُدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المُدخلات التي يتحكم بها المشغل:

- `tag`: وسم الإصدار المطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ عندما تكون `preflight_only=true`، يمكن أن يكون أيضًا SHA
  الالتزام الحالي الكامل المكون من 40 حرفًا لفرع سير العمل من أجل التحقق فقط
  قبل الإطلاق
- `preflight_only`: `true` للتحقق/البناء/الحزم فقط، و`false` لمسار النشر
  الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي كي يعيد سير العمل استخدام
  ملف tarball المُحضّر من تشغيل ما قبل الإطلاق الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ الإعداد الافتراضي هو `beta`

يقبل `OpenClaw Release Publish` هذه المُدخلات التي يتحكم بها المشغل:

- `tag`: وسم الإصدار المطلوب؛ يجب أن يكون موجودًا مسبقًا
- `preflight_run_id`: معرف تشغيل ما قبل الإطلاق الناجح لـ`OpenClaw NPM Release`؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm المستهدف لحزمة OpenClaw
- `plugin_publish_scope`: الإعداد الافتراضي هو `all-publishable`؛ استخدم
  `selected` فقط لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: الإعداد الافتراضي هو `true`؛ اضبطه إلى `false` فقط
  عند استخدام سير العمل كمنسق إصلاح خاص بـPlugin فقط

يقبل `OpenClaw Release Checks` هذه المُدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق منه. تتطلب الفحوصات التي تحمل
  أسرارًا أن يكون الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار.

القواعد:

- يمكن للوسوم المستقرة ووسوم التصحيح النشر إلى `beta` أو `latest`
- يمكن لوسوم بيتا ما قبل الإصدار النشر إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، لا يُسمح بإدخال SHA الالتزام الكامل إلا
  عندما تكون `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` للتحقق فقط دائمًا
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء ما قبل
  الإطلاق؛ يتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر

## تسلسل إصدار npm مستقر

عند إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الحالي الكامل لفرع سير العمل
     لتشغيل تجريبي للتحقق فقط من سير عمل ما قبل الإطلاق
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ بالبيتا، أو `latest` فقط
   عندما تريد عمدًا نشرًا مستقرًا مباشرًا
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو SHA
   الالتزام الكامل عندما تريد CI العادي إضافة إلى تغطية ذاكرة التخزين المؤقت
   للمطالبات المباشرة، وDocker، وQA Lab، وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدًا إلى مخطط الاختبار العادي الحتمي فقط، شغّل سير عمل `CI`
   اليدوي على مرجع الإصدار بدلًا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` باستخدام `tag` نفسه، و`npm_dist_tag` نفسه،
   و`preflight_run_id` المحفوظ؛ فهو ينشر Plugins الخارجية إلى npm وClawHub قبل
   ترقية حزمة npm الخاصة بـOpenClaw
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
8. إذا نُشر الإصدار عمدًا مباشرة إلى `latest` وكان ينبغي أن يتبع `beta` البناء
   المستقر نفسه فورًا، فاستخدم سير العمل الخاص نفسه لتوجيه وسمي التوزيع إلى
   الإصدار المستقر، أو دع مزامنة التعافي الذاتي المجدولة تنقل `beta` لاحقًا

يوجد تعديل وسم التوزيع في المستودع الخاص لأسباب أمنية لأنه لا يزال يتطلب
`NPM_TOKEN`، بينما يحتفظ المستودع العام بالنشر المعتمد على OIDC فقط.

يبقي ذلك مسار النشر المباشر ومسار الترقية الذي يبدأ بالبيتا موثقين ومرئيين
للمشغل.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر
1Password CLI (`op`) داخل جلسة tmux مخصصة فقط. لا تستدعِ `op` مباشرة من
صدفة الوكيل الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات والتنبيهات ومعالجة OTP
قابلة للملاحظة ويمنع تنبيهات المضيف المتكررة.

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

يستخدم المشرفون مستندات الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
لدليل التشغيل الفعلي.

## ذو صلة

- [قنوات الإصدار](/ar/install/development-channels)
