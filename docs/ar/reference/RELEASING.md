---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من صحة الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرة طرحها
    - تخطيط خطوط إصدارات الدعم الشهرية أو الدعم طويل الأمد
summary: مسارات الإصدار، وقائمة التحقق للمشغّل، وبيئات التحقق، وتسمية الإصدارات، وخطوط الدعم الشهرية المخطط لها، والإيقاع
title: سياسة الإصدارات
x-i18n:
    generated_at: "2026-05-07T01:54:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw لديه ثلاثة مسارات إصدار عامة:

- stable: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحة
- beta: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- dev: الرأس المتحرك لـ `main`

## تسمية الإصدارات

- إصدار مستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار تصحيح مستقر قديم: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار تجريبي قبل الإصدار: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف صفرًا بادئًا للشهر أو اليوم
- `latest` يعني إصدار npm المستقر الحالي المُرقّى
- `beta` يعني هدف تثبيت beta الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح القديمة إلى npm `beta` افتراضيًا؛ يمكن لمشغّلي الإصدار استهداف `latest` صراحة، أو ترقية بناء beta مُدقّق لاحقًا
- كل إصدار OpenClaw مستقر يشحن حزمة npm وتطبيق macOS معًا؛
  إصدارات beta تتحقق عادةً من مسار npm/الحزمة وتنشره أولًا، مع حجز
  بناء تطبيق mac وتوقيعه وتوثيقه للإصدار المستقر ما لم يُطلب ذلك صراحة

### التخطيط لإصدارات الدعم الشهرية

لا يملك OpenClaw حتى الآن قناة LTS أو قناة دعم شهرية. يعمل المشرفون
على خطوط دعم شهرية متوافقة مع SemVer، لكن قنوات التحديث المشحونة
اليوم لا تزال `stable` و`beta` و`dev`.

الشكل المخطط للإصدار هو `YYYY.M.PATCH`:

- `YYYY` هي السنة.
- `M` هو خط الإصدار الشهري، دون صفر بادئ.
- `PATCH` يزيد ضمن ذلك الخط الشهري ويمكن أن يرتفع بقدر الحاجة.

على سبيل المثال، ستكون `2026.6.0` و`2026.6.1` و`2026.6.2` كلها على خط يونيو
2026. قد يشير وسم توزيع دعم شهري مستقبلي مثل `stable-2026-6` أو
`lts-2026-6` إلى ذلك الخط، بينما يواصل `latest` التحرك بسرعة.

يستبدل هذا النموذج المستقبلي الحاجة إلى إصدارات تصحيح جديدة بصيغة `YYYY.M.D-N`.
تبقى إصدارات التصحيح القديمة الحالية معترفًا بها كي تستمر الحزم الأقدم
ومسارات الترقية في العمل.

## وتيرة الإصدار

- تنتقل الإصدارات بنهج beta أولًا
- يتبع الإصدار المستقر فقط بعد التحقق من أحدث beta
- عادةً ينشئ المشرفون الإصدارات من فرع `release/YYYY.M.D` مُنشأ
  من `main` الحالي، بحيث لا يمنع التحقق من الإصدار وإصلاحاته
  التطوير الجديد على `main`
- إذا دُفع وسم beta أو نُشر وكان يحتاج إلى إصلاح، ينشئ المشرفون
  وسم `-beta.N` التالي بدلًا من حذف وسم beta القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية والموافقات وبيانات الاعتماد وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغّل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد وسوم التوزيع، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار الخاص بالمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وتأكد من دفع commit الهدف،
   وتأكد من أن CI الحالي لـ `main` أخضر بما يكفي للتفرع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل commit الحقيقي باستخدام
   `/changelog`، واجعل الإدخالات موجهة للمستخدم، ثم اعمل commit لها، وادفعها، ونفّذ rebase/pull
   مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب حمله عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرة على `main`.
5. ارفع كل موضع إصدار مطلوب للوسم المقصود، وشغّل
   `pnpm plugins:sync` حتى تشارك حزم Plugin القابلة للنشر إصدار الإصدار
   وبيانات التوافق الوصفية، ثم شغّل الفحص التمهيدي المحلي الحتمي:
   `pnpm check:test-types` و`pnpm check:architecture` و
   `pnpm build && pnpm ui:build` و`pnpm plugins:sync:check` و
   `pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل من 40 حرفًا لفرع الإصدار للتحقق التمهيدي فقط.
   احفظ `preflight_run_id` الناجح.
7. ابدأ جميع اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار أو الوسم أو SHA كامل للـ commit. هذه هي نقطة الدخول اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest وDocker وQA Lab وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر ملف فاشل
   أو مسار أو مهمة workflow أو ملف تعريف حزمة أو موفر أو قائمة سماح نماذج
   يثبت الإصلاح. أعد تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير
   الأدلة السابقة قديمة.
9. بالنسبة إلى beta، ضع الوسم `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   ويرسل جميع حزم Plugin القابلة للنشر إلى npm والمجموعة نفسها إلى
   ClawHub بالتوازي، ثم يرقّي أثر الفحص التمهيدي المعدّ لـ OpenClaw npm
   بوسم التوزيع المطابق بمجرد نجاح نشر Plugin npm.
   قد يظل نشر ClawHub قيد التشغيل أثناء نشر OpenClaw npm، لكن
   workflow نشر الإصدار لا ينتهي حتى تكتمل مسارات نشر Plugin ومسار نشر
   OpenClaw npm بنجاح. بعد النشر، شغّل قبول الحزمة بعد النشر
   ضد حزمة `openclaw@YYYY.M.D-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاج ما قبل الإصدار المدفوع أو المنشور إلى إصلاح،
   فأنشئ رقم ما قبل الإصدار المطابق التالي؛ لا تحذف ما قبل الإصدار القديم
   أو تعيد كتابته.
10. بالنسبة إلى الإصدار المستقر، تابع فقط بعد أن يمتلك beta المُدقّق أو مرشح الإصدار
    أدلة التحقق المطلوبة. نشر npm المستقر يمر أيضًا عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أثر الفحص التمهيدي الناجح عبر
    `preflight_run_id`؛ كما تتطلب جاهزية إصدار macOS المستقر وجود
    `.zip` و`.dmg` و`.dSYM.zip` المحزمة، و`appcast.xml` المحدّث على `main`.
11. بعد النشر، شغّل متحقق npm بعد النشر، واختبار Telegram E2E الاختياري المستقل
    لـ published-npm عندما تحتاج إلى إثبات القناة بعد النشر،
    وترقية وسم التوزيع عند الحاجة، وملاحظات إصدار/ما قبل إصدار GitHub من
    قسم `CHANGELOG.md` المطابق الكامل، وخطوات إعلان الإصدار.

## الفحص التمهيدي للإصدار

- شغّل `pnpm check:test-types` قبل الفحص التمهيدي للإصدار حتى يبقى TypeScript الخاص بالاختبارات
  مغطى خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل الفحص التمهيدي للإصدار حتى تكون فحوصات دورات الاستيراد
  وحدود البنية الأوسع ناجحة خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون عناصر الإصدار المتوقعة
  `dist/*` وحزمة Control UI موجودة لخطوة التحقق من الحزمة
- شغّل `pnpm plugins:sync` بعد رفع إصدار الجذر وقبل وضع الوسم. إنه يحدّث
  إصدارات حزم plugin القابلة للنشر، وبيانات توافق OpenClaw peer/API الوصفية،
  وبيانات تعريف البناء، ومسودات سجلات تغييرات plugin لتطابق إصدار
  النواة. `pnpm plugins:sync:check` هو حارس الإصدار غير المعدِّل؛
  يفشل سير عمل النشر قبل أي تعديل في السجل إذا نُسيت هذه الخطوة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل موافقة الإصدار
  لبدء جميع صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا،
  أو وسمًا، أو SHA التزامًا كاملًا، ويُطلق `CI` يدويًا، ويُطلق
  `OpenClaw Release Checks` لاختبار تثبيت smoke، وقبول الحزمة، وفحوصات
  الحزم عبر أنظمة التشغيل، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. التشغيلات المستقرة/الافتراضية
  تبقي فحوصات live/E2E الشاملة واختبار تحمل مسار إصدار Docker خلف
  `run_release_soak=true`؛ ويفرض `release_profile=full` تشغيل اختبار التحمل. مع
  `release_profile=full` و`rerun_group=all`، يشغّل أيضًا Telegram
  E2E للحزمة مقابل الأثر `release-package-under-test` من فحوصات الإصدار.
  وفّر `npm_telegram_package_spec` بعد النشر عندما يجب أن يثبت Telegram E2E نفسه
  حزمة npm المنشورة أيضًا. وفّر
  `package_acceptance_package_spec` بعد النشر عندما يجب أن يشغّل Package Acceptance
  مصفوفة الحزمة/التحديث الخاصة به مقابل حزمة npm المشحونة بدلًا
  من الأثر المبني من SHA. وفّر
  `evidence_package_spec` عندما يجب أن يثبت تقرير الأدلة الخاص أن
  التحقق يطابق حزمة npm منشورة من دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد دليلًا من قناة جانبية
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` من أجل
  `openclaw@beta`، أو `openclaw@latest`، أو إصدار إصدار محدد؛ و`source=ref`
  لحزم فرع/وسم/SHA موثوق به في `package_ref` مع مجموعة اختبار
  `workflow_ref` الحالية؛ و`source=url` لأرشيف tarball عبر HTTPS مع
  SHA-256 مطلوب؛ أو `source=artifact` لأرشيف tarball مرفوع بواسطة تشغيل آخر في
  GitHub Actions. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E مقابل ذلك
  الأرشيف، ويمكنه تشغيل Telegram QA مقابل الأرشيف نفسه باستخدام
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن
  مسارات Docker المحددة `published-upgrade-survivor`، يكون أثر الحزمة
  هو المرشح ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور.
  يستخدم `update-restart-auth` حزمة المرشح باعتبارها CLI المثبتة
  وpackage-under-test معًا، حتى يختبر مسار إعادة التشغيل المُدار لأمر تحديث
  المرشح.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات الشخصية الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/إعادة التشغيل/plugin الأصلية للأثر من دون OpenWebUI أو ClawHub live
  - `product`: ملف الحزمة الشخصي بالإضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي،
    وبحث ويب OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: تحديد `docker_lanes` الدقيق لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI العادية الكاملة
  لمرشح الإصدار. تتجاوز إطلاقات CI اليدوية تحديد النطاق بحسب التغييرات
  وتفرض شظايا Linux Node، وشظايا plugin المضمنة، وعقود القنوات،
  وتوافق Node 22، و`check`، و`check-additional`، واختبار build smoke،
  وفحوصات المستندات، وPython skills، وWindows، وmacOS، وAndroid، ومسارات i18n
  في Control UI.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. إنه يختبر
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء مقاطع التتبع
  المصدّرة، والسمات المحدودة، وتنقيح المحتوى/المعرّفات من دون
  الحاجة إلى Opik أو Langfuse أو مجمّع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المعدِّل بعد أن يكون
  الوسم موجودًا. أطلقه من `release/YYYY.M.D` (أو `main` عند نشر
  وسم يمكن الوصول إليه من main)، ومرّر وسم الإصدار ومعرّف تشغيل
  OpenClaw npm `preflight_run_id` الناجح، وأبقِ نطاق نشر plugin الافتراضي
  `all-publishable` ما لم تكن تشغّل إصلاحًا مركزًا عمدًا. يسلسل
  سير العمل نشر plugin على npm، ونشر plugin على ClawHub، ونشر OpenClaw
  على npm حتى لا تُنشر حزمة النواة قبل Plugins الخارجية التابعة لها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ QA Lab الوهمي بالإضافة إلى ملف
  Matrix live السريع ومسار Telegram QA قبل موافقة الإصدار. تستخدم مسارات live
  بيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا عقود استعارة بيانات اعتماد Convex CI.
  شغّل سير العمل اليدوي `QA-Lab - All Lanes` باستخدام
  `matrix_profile=all` و`matrix_shards=true` عندما تريد مخزون نقل Matrix
  ووسائطه وE2EE بالكامل بالتوازي.
- يعد التحقق من وقت تشغيل التثبيت والترقية عبر أنظمة التشغيل جزءًا من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، اللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا التقسيم مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا،
  حتميًا، ومركزًا على الآثار، بينما تبقى فحوصات live الأبطأ في مسارها
  الخاص حتى لا توقف النشر أو تعرقله
- يجب إطلاق فحوصات الإصدار الحاملة للأسرار عبر `Full Release
Validation` أو من مرجع سير عمل `main`/release حتى تبقى منطق سير العمل
  والأسرار مضبوطة
- يقبل `OpenClaw Release Checks` فرعًا، أو وسمًا، أو SHA التزامًا كاملًا طالما
  أن الالتزام المحلول قابل للوصول من فرع OpenClaw أو وسم إصدار
- يقبل الفحص التمهيدي للتحقق فقط في `OpenClaw NPM Release` أيضًا
  SHA الالتزام الكامل الحالي ذي 40 حرفًا لفرع سير العمل من دون طلب وسم مدفوع
- مسار SHA هذا مخصص للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط لفحص
  بيانات تعريف الحزمة؛ لا يزال النشر الحقيقي يتطلب وسم إصدار حقيقي
- يبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات مستضافة من GitHub،
  بينما يمكن لمسار التحقق غير المعدِّل استخدام مشغلات
  Blacksmith Linux الأكبر
- يشغّل ذلك سير العمل
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد الفحص التمهيدي لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/correction المطابق) قبل الموافقة
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/correction المطابق) للتحقق من مسار تثبيت السجل المنشور
  في بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من إعداد onboarding للحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي
  مقابل حزمة npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المستعارة المشتركة.
  قد تحذف تشغيلات المشرف المحلية لمرة واحدة متغيرات Convex وتمرر بيانات اعتماد البيئة
  الثلاث `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- لتشغيل smoke beta الكامل بعد النشر من جهاز مشرف، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق تحديث npm في Parallels/هدف جديد، ويطلق `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل الدقيق، ويحمّل الأثر، ويطبع تقرير Telegram.
- يمكن للمشرفين تشغيل الفحص نفسه بعد النشر من GitHub Actions عبر
  سير العمل اليدوي `NPM Telegram Beta E2E`. إنه يدوي فقط عن قصد ولا
  يعمل عند كل دمج.
- تستخدم أتمتة إصدار المشرفين الآن الفحص التمهيدي ثم الترقية:
  - يجب أن يجتاز نشر npm الحقيقي `preflight_run_id` ناجحًا في npm
  - يجب إطلاق نشر npm الحقيقي من فرع `main` نفسه أو
    `release/YYYY.M.D` نفسه الذي كان فيه تشغيل الفحص التمهيدي ناجحًا
  - الإصدارات المستقرة على npm تستهدف `beta` افتراضيًا
  - يمكن لنشر npm المستقر استهداف `latest` صراحة عبر مدخل سير العمل
  - أصبح تعديل dist-tag في npm المعتمد على الرمز موجودًا الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما يبقي
    المستودع العام النشر باستخدام OIDC فقط
  - `macOS Release` العام مخصص للتحقق فقط؛ عندما يوجد وسم على
    فرع إصدار فقط لكن سير العمل يُطلق من `main`، عيّن
    `public_release_branch=release/YYYY.M.D`
  - يجب أن يجتاز نشر mac الخاص الحقيقي `preflight_run_id` و`validate_run_id`
    ناجحين للـ mac الخاص
  - تروّج مسارات النشر الحقيقية الآثار المحضرة بدلًا من إعادة بنائها
    مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة القديمة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد النشر
  أيضًا من مسار الترقية نفسه بالبادئة المؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار التثبيتات العامة الأقدم بصمت على
  حمولة الإصدار المستقر الأساسية
- يفشل الفحص التمهيدي لإصدار npm بإغلاق آمن ما لم يتضمن أرشيف tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق ما بعد النشر أيضًا من وجود نقاط دخول plugin المنشورة
  وبيانات تعريف الحزمة في تخطيط السجل المثبت. الإصدار الذي
  يشحن حمولات وقت تشغيل plugin مفقودة يفشل مدقق ما بعد النشر ولا
  يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` الخاصة بحزمة npm على
  أرشيف tarball لتحديث المرشح، لذلك يلتقط installer e2e تضخم الحزمة العرضي
  قبل مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت الإضافات، أو
  مصفوفات اختبار الإضافات، فأعد إنشاء ومراجعة مخرجات مصفوفة
  `plugin-prerelease-extension-shard` المملوكة للمخطط من
  `.github/workflows/plugin-prerelease.yml` قبل الموافقة حتى لا
  تصف ملاحظات الإصدار تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح المحدث:
  - يجب أن ينتهي إصدار GitHub بالحزم `.zip` و`.dmg` و`.dSYM.zip`
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحافظ التطبيق المحزوم على bundle id غير تصحيحي، وعنوان URL غير فارغ لخلاصة Sparkle
    و`CFBundleVersion` عند حد بناء Sparkle الرسمي لذلك الإصدار أو أعلى منه

## صناديق اختبار الإصدار

`Full Release Validation` هو الطريقة التي يستخدمها المشغلون لبدء جميع اختبارات ما قبل الإصدار من
نقطة دخول واحدة. لإثبات التزام مثبت على فرع سريع الحركة، استخدم
المساعد حتى يعمل كل سير عمل تابع من فرع مؤقت مثبت عند SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويطلق `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن كل `headSha` في سير عمل تابع
يطابق الهدف، ثم يحذف الفرع المؤقت. يمنع هذا إثبات تشغيل تابع أحدث من
`main` عن طريق الخطأ.

للتحقق من فرع إصدار أو وسم، شغّله من مرجع سير عمل `main` الموثوق
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

يحلّ سير العمل مرجع الهدف، ويُشغّل `CI` اليدوي مع
`target_ref=<release-ref>`، ويُشغّل `OpenClaw Release Checks`، ويحضّر أداة
parent `release-package-under-test` لفحوصات الحزم، ويُشغّل Telegram E2E المستقلة للحزمة عندما يكون `release_profile=full` مع
`rerun_group=all` أو عندما تكون `npm_telegram_package_spec` مضبوطة. ثم توسّع `OpenClaw Release
Checks` النطاق إلى فحص التثبيت، وفحوصات الإصدار عبر أنظمة التشغيل، وتغطية مسار إصدار Docker الحية/E2E عند تفعيل soak، وقبول الحزمة مع QA لحزمة Telegram، وتكافؤ QA Lab، وMatrix الحية، وTelegram الحية. لا يكون التشغيل الكامل مقبولًا إلا عندما يعرض ملخص
`Full Release Validation`
نجاح `normal_ci` و`release_checks`. في وضع full/all، يجب أن يكون الابن `npm_telegram` ناجحًا أيضًا؛ وخارج full/all يتم تخطيه إلا إذا قُدّمت `npm_telegram_package_spec` منشورة. يتضمن ملخص
التحقق النهائي جداول أبطأ المهام لكل تشغيل ابن، بحيث يمكن لمدير الإصدار رؤية المسار الحرج الحالي دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) لمعرفة
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، والاختلافات بين ملفي تعريف stable وfull، والأدوات، ومقابض إعادة التشغيل المركزة.
تُشغّل مسارات العمل الابنة من المرجع الموثوق الذي يشغّل `Full Release
Validation`، وعادةً `--ref main`، حتى عندما يشير `ref` الهدف إلى
فرع إصدار أو وسم أقدم. لا يوجد إدخال منفصل لمرجع سير عمل Full Release Validation؛ اختر الغلاف الموثوق باختيار مرجع تشغيل سير العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات commit دقيق على `main` المتحرك؛
لا يمكن أن تكون قيم SHA الخام الخاصة بـ commit مراجع dispatch لسير العمل، لذا استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبّت.

استخدم `release_profile` لاختيار اتساع التغطية الحية/المزوّد:

- `minimum`: أسرع مسار حي ومسار Docker حاسمين للإصدار لـ OpenAI/core
- `stable`: الحد الأدنى إضافةً إلى تغطية المزوّد/الخلفية المستقرة لاعتماد الإصدار
- `full`: stable إضافةً إلى تغطية واسعة للمزوّدين/الوسائط الاستشارية

استخدم `run_release_soak=true` مع `stable` عندما تكون المسارات الحاجبة للإصدار
خضراء وتريد sweep شاملًا حيًا/E2E، ومسار إصدار Docker، و
فحص ترقية منشورة محدود البقاء قبل الترقية. يغطي ذلك الفحص
أحدث أربع حزم stable إضافةً إلى خطوط أساس مثبتة `2026.4.23` و`2026.5.2`
إضافةً إلى تغطية أقدم `2026.4.15`، مع إزالة خطوط الأساس المكررة وتقسيم
كل خط أساس إلى مهمة Docker runner خاصة به. يعني `full`
ضمنيًا `run_release_soak=true`.

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل مرجع الهدف
مرة واحدة باسم `release-package-under-test` وتعيد استخدام تلك الأداة في فحوصات cross-OS،
وقبول الحزمة، وفحوصات Docker لمسار الإصدار عند تشغيل soak. هذا يبقي
كل صناديق الحزم على البايتات نفسها ويتجنب عمليات بناء الحزمة المتكررة.
يستخدم فحص تثبيت OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون
متغير repo/org مضبوطًا، وإلا `openai/gpt-5.4`، لأن هذا المسار
يثبت تثبيت الحزمة، والإعداد الأولي، وبدء Gateway، ودورة agent حية واحدة
بدلًا من قياس أداء أبطأ نموذج افتراضي. تبقى مصفوفة المزوّدين الحية الأوسع
هي موضع التغطية الخاصة بالنماذج.

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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركز. إذا فشل صندوق واحد،
فاستخدم سير العمل الابن الفاشل، أو المهمة، أو مسار Docker، أو ملف تعريف الحزمة، أو مزوّد النموذج،
أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة أخرى فقط عندما
يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل دليل كل الصناديق السابق
قديمًا. يعيد المتحقق النهائي في المظلة فحص معرّفات تشغيل سير العمل الابنة
المسجلة، لذا بعد إعادة تشغيل سير عمل ابن بنجاح، أعد تشغيل مهمة parent الفاشلة
`Verify full validation` فقط.

للتعافي المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل
مرشح الإصدار الحقيقي، و`ci` يشغّل ابن CI العادي فقط، و`plugin-prerelease`
يشغّل ابن Plugin الخاص بالإصدار فقط، و`release-checks` يشغّل كل صناديق الإصدار،
ومجموعات الإصدار الأضيق هي `install-smoke`، و`cross-os`،
و`live-e2e`، و`package`، و`qa`، و`qa-parity`، و`qa-live`، و`npm-telegram`.
تتطلب إعادات تشغيل `npm-telegram` المركزة `npm_telegram_package_spec`؛ أما تشغيلات full/all
مع `release_profile=full` فتستخدم أداة حزمة release-checks. يمكن لإعادات تشغيل
cross-OS المركزة إضافة `cross_os_suite_filter=windows/packaged-upgrade` أو
مرشح OS/suite آخر. إخفاقات QA ضمن release-checks استشارية؛ فشل QA فقط
لا يحجب التحقق من الإصدار.

### Vitest

صندوق Vitest هو سير العمل الابن `CI` اليدوي. يتجاوز CI اليدوي عمدًا
تحديد النطاق حسب التغييرات ويفرض مخطط الاختبار العادي لمرشح الإصدار:
شرائح Linux Node، وشرائح Plugin المضمنة، وعقود القنوات، وتوافق Node 22،
و`check`، و`check-additional`، وفحص البناء، وفحوصات المستندات، وSkills في Python،
وWindows، وmacOS، وAndroid، وControl UI i18n.

استخدم هذا الصندوق للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية الكاملة؟"
إنه ليس مثل التحقق من المنتج في مسار الإصدار. الأدلة التي يجب الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض URL تشغيل `CI` المُشغّل
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الشرائح الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- أدوات توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما
  يحتاج التشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرةً فقط عندما يحتاج الإصدار إلى CI عادي حتمي لكن
ليس صناديق Docker أو QA Lab أو الحية أو cross-OS أو الحزم:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker في `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، إضافةً إلى سير عمل
`install-smoke` في وضع الإصدار. يتحقق من مرشح الإصدار عبر بيئات Docker
المعبأة بدلًا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- فحص تثبيت كامل مع تمكين فحص التثبيت العالمي البطيء لـ Bun
- تحضير/إعادة استخدام صورة فحص Dockerfile الجذر حسب SHA الهدف، مع مهام QR،
  وroot/Gateway، وinstaller/Bun تعمل كشرائح install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`،
  و`plugins-runtime-services`،
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إلغاء تثبيت Plugin المضمنة المقسمة
  `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات المزوّدين الحية/E2E وتغطية نماذج Docker الحية عندما تتضمن فحوصات الإصدار
  مجموعات حية

استخدم أدوات Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وملف JSON لخطة المجدول، وأوامر إعادة التشغيل. للتعافي المركز،
استخدم `docker_lanes=<lane[,lane]>` على سير العمل الحي/E2E القابل لإعادة الاستخدام بدلًا من
إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل المولدة
`package_artifact_run_id` السابق ومدخلات صورة Docker المحضّرة عند توفرها، بحيث يمكن
لمسار فاشل إعادة استخدام ملف tarball نفسه وصور GHCR نفسها.

### QA Lab

صندوق QA Lab هو أيضًا جزء من `OpenClaw Release Checks`. إنه بوابة الإصدار
لسلوك agentic ومستوى القناة، منفصلًا عن Vitest وآليات حزم Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ وهمي يقارن مسار مرشح OpenAI بخط أساس Opus 4.6
  باستخدام حزمة التكافؤ agentic
- ملف تعريف Matrix QA حي سريع يستخدم بيئة `qa-live-shared`
- مسار Telegram QA حي يستخدم إيجارات بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما تحتاج قياسات telemetry للإصدار إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات الحية؟" احتفظ بعناوين URL للأدوات لمسارات التكافؤ وMatrix وTelegram
عند اعتماد الإصدار. تبقى تغطية Matrix الكاملة متاحة كتشغيل QA-Lab يدوي مقسم
بدلًا من المسار الافتراضي الحاسم للإصدار.

### الحزمة

صندوق الحزمة هو بوابة المنتج القابل للتثبيت. تدعمه
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبّع المحلل
المرشح إلى tarball `package-under-test` الذي تستهلكه Docker E2E، ويتحقق من
مخزون الحزمة، ويسجل إصدار الحزمة وSHA-256، ويحافظ على فصل
مرجع غلاف سير العمل عن مرجع مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: `openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيق
- `source=ref`: تعبئة فرع `package_ref` موثوق، أو وسم، أو SHA commit كامل
  باستخدام غلاف `workflow_ref` المحدد
- `source=url`: تنزيل `.tgz` عبر HTTPS مع `package_sha256` مطلوب
- `source=artifact`: إعادة استخدام `.tgz` مرفوع بواسطة تشغيل GitHub Actions آخر

تشغّل `OpenClaw Release Checks` قبول الحزمة مع `source=artifact`، وأداة
حزمة الإصدار المحضّرة، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
و`telegram_mode=mock-openai`. يحافظ قبول الحزمة على اختبارات migration، وupdate،
وإعادة تشغيل update مع auth مضبوط، وتنظيف تبعيات Plugin القديمة، وتجهيزات Plugin دون اتصال،
وتحديث Plugin، وQA لحزمة Telegram ضد tarball المحلول نفسه. تستخدم فحوصات الإصدار الحاجبة
خط أساس الحزمة المنشورة latest افتراضيًا؛ ويوسّع `run_release_soak=true` أو
`release_profile=full` النطاق إلى كل خطوط الأساس المستقرة المنشورة على npm من
`2026.4.23` حتى `latest` إضافةً إلى تجهيزات القضايا المبلغ عنها. استخدم
قبول الحزمة مع `source=npm` لمرشح منشور بالفعل، أو
`source=ref`/`source=artifact` لملف npm tarball محلي مدعوم بـ SHA قبل
النشر. إنه البديل الأصلي في GitHub
لمعظم تغطية الحزمة/update التي كانت تتطلب Parallels سابقًا. ما تزال فحوصات cross-OS للإصدار مهمة للإعداد الأولي الخاص بنظام التشغيل،
والمثبّت، وسلوك المنصة، لكن يجب أن يفضل تحقق المنتج للحزمة/update
قبول الحزمة.

قائمة التحقق المعيارية للتحقق من update وPlugin هي
[اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins). استخدمها عند
تحديد أي مسار محلي، أو Docker، أو قبول حزمة، أو release-check يثبت
تثبيت/تحديث Plugin، أو تنظيف doctor، أو تغيير migration لحزمة منشورة.
migration تحديث منشور شامل من كل حزمة stable `2026.4.23+` هو
سير عمل يدوي منفصل `Update Migration`، وليس جزءًا من Full Release CI.

تُحصر مهلة التساهل القديمة في قبول الحزم زمنيا عن قصد. يمكن للحزم حتى
`2026.4.25` استخدام مسار التوافق لفجوات البيانات الوصفية المنشورة مسبقا
إلى npm: إدخالات مخزون QA الخاصة المفقودة من tarball، وغياب
`gateway install --wrapper`، وغياب ملفات التصحيح في fixture الخاص بـ git
المشتق من tarball، وغياب `update.channel` المستمر، ومواقع سجل تثبيت
Plugin القديمة، وغياب استمرار سجل تثبيت السوق، وترحيل بيانات الإعدادات
الوصفية أثناء `plugins update`. قد تعرض حزمة `2026.4.26` المنشورة تحذيرا
لملفات ختم بيانات وصفية للبناء المحلي كانت قد شُحنت مسبقا. يجب على الحزم
الأحدث استيفاء عقود الحزم الحديثة؛ وتؤدي تلك الفجوات نفسها إلى فشل تحقق
الإصدار.

استخدم ملفات تعريف Package Acceptance الأوسع عندما يكون سؤال الإصدار متعلقًا
بحزمة قابلة للتثبيت فعليا:

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

- `smoke`: مسارات سريعة لتثبيت الحزمة/القناة/الوكيل، وشبكة Gateway، وإعادة
  تحميل الإعدادات
- `package`: عقود التثبيت/التحديث/إعادة التشغيل/حزمة Plugin من دون ClawHub
  مباشر؛ وهذا هو الافتراضي لفحص الإصدار
- `product`: `package` بالإضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي،
  وبحث OpenAI على الويب، وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لإعادات التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في Package Acceptance. يمرر سير العمل tarball
المحلول `package-under-test` إلى مسار Telegram؛ ولا يزال سير عمل Telegram
المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة الدخول العادية للنشر المُعدِّل. ينسق
تدفقات عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. يجلب وسم الإصدار ويحل commit SHA الخاص به.
2. يتحقق من أن الوسم قابل للوصول من `main` أو `release/*`.
3. يشغل `pnpm plugins:sync:check`.
4. يرسل `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. يرسل `Plugin ClawHub Release` بالنطاق وSHA نفسيهما.
6. يرسل `OpenClaw NPM Release` مع وسم الإصدار، ووسم توزيع npm، و
   `preflight_run_id` المحفوظ.

مثال نشر Beta:

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

استخدم تدفقات العمل الأدنى مستوى `Plugin NPM Release` و
`Plugin ClawHub Release` فقط لأعمال الإصلاح أو إعادة النشر المركزة. لإصلاح
Plugin محدد، مرر `plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أرسل سير العمل الفرعي مباشرة عندما يجب ألا
تُنشر حزمة OpenClaw.

## مُدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المُدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ عندما تكون `preflight_only=true`، يمكن أن يكون أيضا
  commit SHA الحالي الكامل بطول 40 حرفا لفرع سير العمل للتمهيد المخصص
  للتحقق فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى يعيد سير العمل استخدام
  tarball المُحضّر من تشغيل التمهيد الناجح
- `npm_dist_tag`: وسم npm الهدف لمسار النشر؛ افتراضه `beta`

يقبل `OpenClaw Release Publish` هذه المُدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب؛ يجب أن يكون موجودا مسبقا
- `preflight_run_id`: معرف تشغيل تمهيد `OpenClaw NPM Release` ناجح؛ مطلوب
  عندما تكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm الهدف لحزمة OpenClaw
- `plugin_publish_scope`: افتراضه `all-publishable`؛ استخدم `selected` فقط
  لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: افتراضه `true`؛ اضبطه على `false` فقط عند استخدام
  سير العمل كمنسق إصلاح مخصص للـ Plugin فقط

يقبل `OpenClaw Release Checks` هذه المُدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو وسم أو commit SHA كامل للتحقق. تتطلب الفحوصات الحاملة
  للأسرار أن يكون commit المحلول قابلا للوصول من فرع OpenClaw أو وسم إصدار.
- `run_release_soak`: الاشتراك في اختبار استيعاب شامل مباشر/E2E، ومسار إصدار
  Docker، وجميع الناجين من الترقية منذ البداية في فحوصات الإصدار المستقر/
  الافتراضي. يُفرض تشغيله بواسطة `release_profile=full`.

القواعد:

- يمكن للوسوم المستقرة ووسوم التصحيح النشر إلى `beta` أو `latest`
- يمكن لوسوم الإصدارات التمهيدية Beta النشر إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، لا يُسمح بإدخال commit SHA الكامل إلا
  عندما تكون `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` للتحقق فقط دائما
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء
  التمهيد؛ ويتحقق سير العمل من استمرار تلك البيانات الوصفية قبل النشر

## تسلسل إصدار npm مستقر

عند إنشاء إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام commit SHA الكامل الحالي لفرع سير العمل
     لتشغيل تجريبي جاف للتحقق فقط من سير عمل التمهيد
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ بـ beta، أو `latest` فقط
   عندما تريد عمدا نشرا مستقرا مباشرا
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو commit
   SHA الكامل عندما تريد CI عاديا بالإضافة إلى تغطية مباشرة لذاكرة التخزين
   المؤقت للمطالبات، وDocker، وQA Lab، وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدا إلى مخطط الاختبارات العادي الحتمي فقط، فشغّل سير عمل
   `CI` اليدوي على مرجع الإصدار بدلا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` مع `tag` نفسه، و`npm_dist_tag` نفسه،
   و`preflight_run_id` المحفوظ؛ ينشر Plugins الخارجية إلى npm وClawHub قبل
   ترقية حزمة OpenClaw على npm
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
8. إذا نُشر الإصدار عمدا مباشرة إلى `latest` وكان يجب أن يتبع `beta` البناء
   المستقر نفسه فورا، فاستخدم سير العمل الخاص نفسه لتوجيه وسمي التوزيع إلى
   الإصدار المستقر، أو اترك مزامنة الإصلاح الذاتي المجدولة تنقل `beta` لاحقا

يعيش تعديل وسم التوزيع في المستودع الخاص للأمان لأنه لا يزال يتطلب
`NPM_TOKEN`، بينما يحتفظ المستودع العام بالنشر المعتمد على OIDC فقط.

يبقي ذلك كلا من مسار النشر المباشر ومسار الترقية الذي يبدأ بـ beta موثقين
ومرئيين للمشغل.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر
1Password CLI (`op`) داخل جلسة tmux مخصصة فقط. لا تستدع `op` مباشرة من shell
الوكيل الرئيسي؛ فإبقاؤه داخل tmux يجعل المطالبات والتنبيهات ومعالجة OTP
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

يستخدم المشرفون وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
لدليل التشغيل الفعلي.

## ذات صلة

- [قنوات الإصدار](/ar/install/development-channels)
