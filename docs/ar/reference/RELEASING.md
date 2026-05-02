---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرتها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، وصناديق التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-05-02T21:01:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw أربعة مسارات إصدار عامة:

- المستقر: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحة
- ألفا: وسوم ما قبل الإصدار التي تُنشر إلى npm `alpha`
- بيتا: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- التطوير: الرأس المتحرك لـ `main`

## تسمية الإصدارات

- إصدار الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار التصحيح المستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار ألفا ما قبل الإصدار: `YYYY.M.D-alpha.N`
  - وسم Git: `vYYYY.M.D-alpha.N`
- إصدار بيتا ما قبل الإصدار: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف صفرًا بادئًا للشهر أو اليوم
- يعني `latest` إصدار npm المستقر والمروّج حاليًا
- يعني `alpha` هدف تثبيت ألفا الحالي
- يعني `beta` هدف تثبيت بيتا الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضيًا؛ ويمكن لمشغّلي الإصدار استهداف `latest` صراحة، أو ترقية بناء بيتا جرى التحقق منه لاحقًا
- يشحن كل إصدار OpenClaw مستقر حزمة npm وتطبيق macOS معًا؛
  عادةً ما تتحقق إصدارات بيتا من مسار npm/الحزمة وتنشره أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق mac لنظام macOS للإصدار المستقر ما لم يُطلب ذلك صراحة

## وتيرة الإصدار

- تتحرك الإصدارات وفق نهج بيتا أولًا
- لا يتبع الإصدار المستقر إلا بعد التحقق من أحدث بيتا
- عادةً ما يقتطع المشرفون الإصدارات من فرع `release/YYYY.M.D` يُنشأ
  من `main` الحالي، بحيث لا تعطل عمليات التحقق من الإصدار وإصلاحاته
  التطوير الجديد على `main`
- إذا دُفع وسم بيتا أو نُشر واحتاج إلى إصلاح، يقتطع المشرفون
  وسم `-beta.N` التالي بدلًا من حذف وسم بيتا القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغّل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد dist-tag، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار المخصص للمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وتأكد من دفع الالتزام المستهدف،
   وتأكد من أن CI الحالي لـ `main` أخضر بما يكفي للتفريع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، وأبقِ الإدخالات موجهة للمستخدم، وثبّتها في التزام، وادفعها، ثم أعد
   rebase/السحب مرة أخرى قبل التفريع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب حمله عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار المعتاد
   مباشرةً على `main`.
5. ارفع كل موقع إصدار مطلوب للوسم المقصود، وشغّل
   `pnpm plugins:sync` حتى تشارك حزم Plugin القابلة للنشر إصدار الإصدار
   وبيانات التوافق الوصفية، ثم شغّل التحقق المحلي التمهيدي الحتمي:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل بطول 40 حرفًا من فرع الإصدار للتحقق التمهيدي فقط.
   احفظ `preflight_run_id` الناجح.
7. ابدأ جميع اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار أو الوسم أو SHA الكامل للالتزام. هذه هي نقطة الدخول اليدوية الواحدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest، وDocker، وQA Lab، وPackage.
8. إذا فشل التحقق، فأصلح على فرع الإصدار وأعد تشغيل أصغر ملف فاشل
   أو مسار أو مهمة workflow أو ملف تعريف حزمة أو مزود أو allowlist نموذج
   يثبت الإصلاح. لا تُعد تشغيل المظلة الكاملة إلا عندما يجعل السطح المتغير
   الأدلة السابقة قديمة.
9. بالنسبة إلى ألفا أو بيتا، ضع الوسم `vYYYY.M.D-alpha.N` أو `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   وينشر جميع حزم Plugin القابلة للنشر إلى npm أولًا، وينشر المجموعة نفسها
   إلى ClawHub ثانيًا، ثم يروّج أداة OpenClaw npm التمهيدية المحضّرة
   مع dist-tag المطابق. بعد النشر، شغّل قبول الحزمة بعد النشر مقابل حزمة
   `openclaw@YYYY.M.D-alpha.N` أو `openclaw@alpha` أو
   `openclaw@YYYY.M.D-beta.N` أو `openclaw@beta` المنشورة. إذا احتاج ما قبل إصدار
   مدفوع أو منشور إلى إصلاح، فاقتطع رقم ما قبل الإصدار المطابق التالي؛
   لا تحذف ما قبل الإصدار القديم ولا تعد كتابته.
10. بالنسبة إلى المستقر، لا تتابع إلا بعد أن يمتلك بيتا أو مرشح الإصدار الذي جرى التحقق منه
    دليل التحقق المطلوب. يمر نشر npm المستقر أيضًا عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أداة التحقق التمهيدي الناجحة عبر
    `preflight_run_id`؛ كما تتطلب جاهزية إصدار macOS المستقر أيضًا
    ملفات `.zip` و`.dmg` و`.dSYM.zip` المعبأة، و`appcast.xml` المحدّث على `main`.
11. بعد النشر، شغّل مدقق npm بعد النشر، وTelegram E2E الاختياري المستقل
    المنشور من npm عندما تحتاج إلى إثبات قناة بعد النشر،
    وترقية dist-tag عند الحاجة، وملاحظات إصدار/ما قبل إصدار GitHub من
    قسم `CHANGELOG.md` الكامل المطابق، وخطوات إعلان الإصدار.

## التحقق التمهيدي للإصدار

- شغّل `pnpm check:test-types` قبل فحص ما قبل الإصدار حتى تظل TypeScript الخاصة بالاختبارات
  مشمولة خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل فحص ما قبل الإصدار حتى تكون فحوصات دورات الاستيراد
  وحدود البنية الأوسع ناجحة خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون عناصر الإصدار المتوقعة
  `dist/*` وحزمة واجهة Control UI موجودة لخطوة
  التحقق من الحزمة
- شغّل `pnpm plugins:sync` بعد رفع إصدار الجذر وقبل وضع الوسم. فهو
  يحدّث إصدارات حزم Plugin القابلة للنشر، وبيانات توافق OpenClaw للنظير/API،
  وبيانات البناء الوصفية، وقوالب سجلات تغييرات Plugin لتطابق إصدار
  النواة. `pnpm plugins:sync:check` هو حارس الإصدار غير المعدِّل؛
  وسيفشل مسار النشر قبل أي تعديل في السجل إذا تم
  نسيان هذه الخطوة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل اعتماد الإصدار
  لبدء جميع صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا
  أو وسمًا أو SHA كاملًا للالتزام، ويطلق `CI` يدويًا، ويطلق
  `OpenClaw Release Checks` لمسارات install smoke، وقبول الحزمة، ومجموعات
  مسار إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. مع `release_profile=full` و`rerun_group=all`، يشغّل أيضًا حزمة
  Telegram E2E مقابل الأثر `release-package-under-test` من فحوصات الإصدار. قدّم `npm_telegram_package_spec` بعد النشر عندما ينبغي لنفس
  Telegram E2E إثبات حزمة npm المنشورة أيضًا. قدّم
  `package_acceptance_package_spec` بعد النشر عندما ينبغي لقبول الحزمة
  تشغيل مصفوفة الحزمة/التحديث الخاصة به مقابل حزمة npm المشحونة بدلًا
  من الأثر المبني من SHA. قدّم
  `evidence_package_spec` عندما ينبغي لتقرير الأدلة الخاص إثبات أن
  التحقق يطابق حزمة npm منشورة دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد دليلًا جانبيًا
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` من أجل
  `openclaw@alpha` أو `openclaw@beta` أو `openclaw@latest` أو إصدار محدد بدقة؛ و`source=ref`
  لحزم فرع/وسم/SHA موثوق به في `package_ref` باستخدام عدة
  `workflow_ref` الحالية؛ و`source=url` لملف tarball عبر HTTPS مع
  SHA-256 مطلوب؛ أو `source=artifact` لملف tarball تم رفعه بواسطة تشغيل
  GitHub Actions آخر. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E مقابل ذلك
  الملف، ويمكنه تشغيل Telegram QA مقابل ملف tarball نفسه باستخدام
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن
  مسارات Docker المحددة `published-upgrade-survivor`، يكون أثر الحزمة
  هو المرشح ويحدد `published_upgrade_survivor_baseline`
  خط الأساس المنشور.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات الشخصية الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل التهيئة
  - `package`: مسارات الحزمة/التحديث/Plugin الأصلية للأثر دون OpenWebUI أو ClawHub حي
  - `product`: ملف الحزمة الشخصي بالإضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي،
    وبحث الويب من OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` بدقة لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرةً عندما تحتاج فقط إلى تغطية CI عادية
  كاملة لمرشح الإصدار. تتجاوز تشغيلات CI اليدوية نطاق التغييرات
  وتفرض شظايا Linux Node، وشظايا Plugin المضمّنة، وعقود القنوات، وتوافق
  Node 22، و`check`، و`check-additional`، واختبار البناء السريع،
  وفحوصات المستندات، وPython skills، وWindows، وmacOS، وAndroid، ومسارات Control UI i18n.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. فهو يمرّن
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء مقاطع التتبع
  المصدّرة، والسمات المحدودة، وتنقيح المحتوى/المعرّفات دون
  الحاجة إلى Opik أو Langfuse أو أي مجمّع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المعدِّل بعد وجود
  الوسم. أطلقه من `release/YYYY.M.D` (أو `main` عند نشر وسم
  يمكن الوصول إليه من main)، ومرّر وسم الإصدار و`preflight_run_id`
  ناجحًا لـ OpenClaw npm، وأبقِ نطاق نشر Plugin الافتراضي
  `all-publishable` ما لم تكن تشغّل إصلاحًا مركزًا عمدًا. يقوم سير
  العمل بتسلسل نشر Plugin إلى npm، ونشر Plugin إلى ClawHub، ونشر OpenClaw
  إلى npm بحيث لا تُنشر الحزمة الأساسية قبل Plugins الخارجية الخاصة بها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ QA Lab الوهمي بالإضافة إلى ملف Matrix الحي السريع ومسار Telegram QA قبل اعتماد الإصدار. تستخدم المسارات الحية بيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا عقود إيجار بيانات اعتماد Convex CI. شغّل سير العمل اليدوي `QA-Lab - All Lanes` مع
  `matrix_profile=all` و`matrix_shards=true` عندما تريد جرد نقل Matrix
  والوسائط وE2EE الكامل بالتوازي.
- يُعد التحقق التشغيلي للتثبيت والترقية عبر أنظمة التشغيل جزءًا من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، اللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرةً
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا،
  وحتميًا، ومركزًا على الأثر، بينما تبقى الفحوصات الحية الأبطأ في
  مسارها الخاص حتى لا تعطل النشر أو تحظره
- ينبغي إطلاق فحوصات الإصدار التي تحمل أسرارًا عبر `Full Release
Validation` أو من مرجع سير عمل `main`/الإصدار حتى يظل منطق سير العمل
  والأسرار تحت السيطرة
- يقبل `OpenClaw Release Checks` فرعًا أو وسمًا أو SHA كاملًا للالتزام ما دام
  الالتزام المحلول يمكن الوصول إليه من فرع OpenClaw أو وسم إصدار
- يقبل فحص ما قبل الإصدار للتحقق فقط في `OpenClaw NPM Release` أيضًا
  SHA الكامل الحالي ذي 40 حرفًا لالتزام فرع سير العمل دون الحاجة إلى وسم مدفوع
- مسار SHA هذا للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، يصنع سير العمل `v<package.json version>` فقط من أجل
  فحص بيانات الحزمة الوصفية؛ ولا يزال النشر الحقيقي يتطلب وسم إصدار حقيقيًا
- يحافظ كلا سيري العمل على مسار النشر والترقية الحقيقي على مشغلات
  GitHub المستضافة، بينما يمكن لمسار التحقق غير المعدِّل استخدام مشغلات
  Blacksmith Linux الأكبر
- يشغّل ذلك سير العمل
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY` كليهما
- لم يعد فحص ما قبل إصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور
  في بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تهيئة الحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي
  مقابل حزمة npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المؤجرة المشتركة. يمكن لعمليات المشرف المحلية لمرة واحدة حذف متغيرات Convex وتمرير
  بيانات اعتماد البيئة الثلاثة `OPENCLAW_QA_TELEGRAM_*` مباشرةً.
- يمكن للمشرفين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر
  سير العمل اليدوي `NPM Telegram Beta E2E`. وهو يدوي فقط عمدًا ولا
  يعمل عند كل دمج.
- تستخدم أتمتة إصدار المشرفين الآن أسلوب الفحص المسبق ثم الترقية:
  - يجب أن يمر نشر npm الحقيقي عبر `preflight_run_id` ناجح لـ npm
  - يجب إطلاق نشر npm الحقيقي من فرع `main` أو
    `release/YYYY.M.D` نفسه الذي انطلق منه تشغيل الفحص المسبق الناجح
  - إصدارات npm المستقرة تضبط افتراضيًا إلى `beta`
  - يمكن لنشر npm المستقر استهداف `latest` صراحةً عبر مدخل سير العمل
  - أصبح تعديل dist-tag في npm القائم على الرمز المميز موجودًا الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما
    يبقي المستودع العام النشر معتمدًا على OIDC فقط
  - `macOS Release` العام للتحقق فقط؛ عندما يوجد وسم فقط على
    فرع إصدار لكن سير العمل يُطلق من `main`، اضبط
    `public_release_branch=release/YYYY.M.D`
  - يجب أن يمر نشر mac الخاص الحقيقي عبر `preflight_run_id` و`validate_run_id`
    ناجحين لـ mac الخاص
  - تقوم مسارات النشر الحقيقية بترقية الآثار المحضّرة بدلًا من إعادة بنائها
    مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد النشر
  أيضًا من مسار الترقية نفسه ذي البادئة المؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار التثبيتات العامة الأقدم بصمت على
  حمولة الإصدار المستقر الأساسية
- يفشل فحص ما قبل إصدار npm مغلقًا ما لم يتضمن ملف tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق التحقق بعد النشر أيضًا من وجود نقاط دخول Plugin المنشورة
  وبيانات الحزمة الوصفية في تخطيط السجل المثبت. يفشل الإصدار الذي
  يشحن حمولات تشغيل Plugin مفقودة في مدقق ما بعد النشر ولا
  يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` لحزمة npm على
  ملف tarball المرشح للتحديث، بحيث تكتشف اختبارات e2e للمثبت تضخم الحزمة العرضي
  قبل مسار نشر الإصدار
- إذا مس عمل الإصدار تخطيط CI أو بيانات توقيت الإضافة أو
  مصفوفات اختبار الإضافة، فأعد توليد ومراجعة مخرجات مصفوفة
  `plugin-prerelease-extension-shard` المملوكة للمخطط من
  `.github/workflows/plugin-prerelease.yml` قبل الاعتماد حتى لا
  تصف ملاحظات الإصدار تخطيط CI قديمًا
- تشمل جاهزية إصدار macOS المستقر أيضًا أسطح المحدث:
  - يجب أن ينتهي إصدار GitHub بملفات `.zip` و`.dmg` و`.dSYM.zip` المحزّمة
  - يجب أن يشير `appcast.xml` على `main` إلى zip المستقر الجديد بعد النشر
  - يجب أن يحافظ التطبيق المحزّم على معرّف حزمة غير تصحيحي، وعنوان URL
    غير فارغ لتغذية Sparkle، و`CFBundleVersion` عند أو فوق حد أرضية بناء Sparkle القانوني
    لذلك الإصدار

## صناديق اختبار الإصدار

`Full Release Validation` هي الطريقة التي يبدأ بها المشغلون جميع اختبارات ما قبل الإصدار من
نقطة دخول واحدة. لإثبات التزام مثبت على فرع سريع الحركة، استخدم
المساعد حتى يعمل كل سير عمل فرعي من فرع مؤقت مثبت عند SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويطلق `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن كل `headSha` لسير عمل فرعي
يطابق الهدف، ثم يحذف الفرع المؤقت. وهذا يتجنب إثبات تشغيل فرعي أحدث من
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

يعالج سير العمل مرجع الهدف، ويشغّل `CI` يدويًا مع
`target_ref=<release-ref>`، ويشغّل `OpenClaw Release Checks`، ويشغّل
اختبار Telegram E2E المستقل للحزمة عندما تكون `release_profile=full` مع
`rerun_group=all` أو عند تعيين `npm_telegram_package_spec`. بعد ذلك، يتفرع
`OpenClaw Release Checks` إلى اختبارات install smoke، وفحوصات الإصدار عبر
أنظمة التشغيل، وتغطية مسار الإصدار live/E2E Docker، وPackage Acceptance مع
Telegram package QA، وتكافؤ QA Lab، وMatrix المباشر، وTelegram المباشر. لا
يُعد التشغيل الكامل مقبولًا إلا عندما يُظهر ملخص
`Full Release Validation`
أن `normal_ci` و`release_checks` ناجحان. في وضع full/all، يجب أن يكون الفرع
الابن `npm_telegram` ناجحًا أيضًا؛ وخارج full/all يُتخطى إلا إذا قُدمت
قيمة `npm_telegram_package_spec` منشورة. يتضمن ملخص أداة التحقق النهائي
جداول أبطأ المهام لكل تشغيل ابن، بحيث يستطيع مدير الإصدار رؤية المسار الحرج
الحالي من دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع
على مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، والفروق بين ملفي
التعريف stable وfull، والتحف، ومقابض إعادة التشغيل المركزة.
تُشغّل مهام سير العمل الابنة من المرجع الموثوق الذي يشغّل `Full Release
Validation`، وعادةً يكون `--ref main`، حتى عندما يشير `ref` الهدف إلى فرع
إصدار أو وسم أقدم. لا يوجد إدخال منفصل لمرجع سير عمل Full Release Validation؛
اختر الحاضنة الموثوقة عبر اختيار مرجع تشغيل سير العمل. لا تستخدم
`--ref main -f ref=<sha>` لإثبات الالتزام الدقيق على `main` المتحرك؛ لا يمكن
أن تكون قيم SHA الخام للالتزامات مراجع تشغيل لسير العمل، لذلك استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبت.

استخدم `release_profile` لاختيار اتساع live/provider:

- `minimum`: أسرع مسار live وDocker الحرج للإصدار في OpenAI/core
- `stable`: الحد الأدنى بالإضافة إلى تغطية provider/backend مستقرة لاعتماد الإصدار
- `full`: stable بالإضافة إلى تغطية استشارية واسعة للموفرين/الوسائط

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع الهدف
مرة واحدة باسم `release-package-under-test` ويعيد استخدام تلك التحفة في كل
من فحوصات Docker لمسار الإصدار وPackage Acceptance. يبقي هذا كل الصناديق
الموجهة للحزمة على البايتات نفسها ويتجنب بناء الحزمة مرارًا. يستخدم اختبار
OpenAI install smoke عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما
يكون متغير repo/org معينًا، وإلا يستخدم `openai/gpt-5.4`، لأن هذا المسار
يثبت تثبيت الحزمة، والإعداد الأولي، وبدء Gateway، ودورة واحدة لوكيل مباشر،
بدلًا من قياس أبطأ نموذج افتراضي. تظل مصفوفة provider المباشر الأوسع هي
المكان المخصص للتغطية الخاصة بالنماذج.

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

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركز. إذا فشل صندوق
واحد، فاستخدم سير العمل الابن الفاشل، أو المهمة، أو مسار Docker، أو ملف
تعريف الحزمة، أو موفر النموذج، أو مسار QA للإثبات التالي. شغّل المظلة الكاملة
مرة أخرى فقط عندما يغير الإصلاح تنسيق الإصدار المشترك أو يجعل دليل كل
الصناديق السابق قديمًا. تعيد أداة التحقق النهائية للمظلة فحص معرفات تشغيل
سير العمل الابن المسجلة، لذلك بعد إعادة تشغيل سير عمل ابن بنجاح، أعد تشغيل
مهمة الأصل الفاشلة `Verify full validation` فقط.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل مرشح الإصدار
الحقيقي، و`ci` يشغّل ابن CI العادي فقط، و`plugin-prerelease` يشغّل ابن Plugin
الخاص بالإصدار فقط، و`release-checks` يشغّل كل صناديق الإصدار، ومجموعات
الإصدار الأضيق هي `install-smoke`، و`cross-os`، و`live-e2e`، و`package`،
و`qa`، و`qa-parity`، و`qa-live`، و`npm-telegram`. تتطلب عمليات إعادة التشغيل
المركزة لـ `npm-telegram` وجود `npm_telegram_package_spec`؛ أما عمليات full/all
مع `release_profile=full` فتستخدم تحفة حزمة release-checks.

### Vitest

صندوق Vitest هو سير العمل الابن اليدوي `CI`. يتجاوز CI اليدوي عمدًا تحديد
النطاق حسب التغييرات ويفرض رسم الاختبارات العادي لمرشح الإصدار: شظايا Linux
Node، وشظايا Plugin المجمعة، وعقود القنوات، وتوافق Node 22، و`check`،
و`check-additional`، واختبار build smoke، وفحوصات docs، وPython skills،
وWindows، وmacOS، وAndroid، وControl UI i18n.

استخدم هذا الصندوق للإجابة عن سؤال: "هل اجتازت شجرة المصدر مجموعة الاختبارات
العادية الكاملة؟" وهو ليس مثل تحقق المنتج في مسار الإصدار. الأدلة التي يجب
الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض عنوان URL لتشغيل `CI` المشغّل
- تشغيل `CI` ناجح على SHA الهدف الدقيق
- أسماء الشظايا الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- تحف توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما يحتاج
  التشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي، لكن لا يحتاج
إلى صناديق Docker أو QA Lab أو live أو cross-OS أو package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker داخل `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، بالإضافة إلى سير عمل
`install-smoke` في وضع الإصدار. يتحقق من مرشح الإصدار عبر بيئات Docker
المحزمة بدلًا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- install smoke كامل مع تمكين اختبار Bun global install smoke البطيء
- إعداد/إعادة استخدام صورة smoke لـ Dockerfile الجذر حسب SHA الهدف، مع تشغيل
  مهام QR، وroot/gateway، وinstaller/Bun smoke كشظايا install-smoke منفصلة
- مسارات E2E للمستودع
- مقاطع Docker لمسار الإصدار: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`،
  و`plugins-runtime-services`,
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل مقطع `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إلغاء تثبيت Plugin المجمعة المقسمة
  `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات provider live/E2E وتغطية نموذج Docker المباشر عندما تتضمن فحوصات
  الإصدار مجموعات live

استخدم تحف Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON لخطة المجدول، وأوامر إعادة التشغيل. للاسترداد
المركز، استخدم `docker_lanes=<lane[,lane]>` على سير عمل live/E2E القابل
لإعادة الاستخدام بدلًا من إعادة تشغيل كل مقاطع الإصدار. تتضمن أوامر إعادة
التشغيل المولدة `package_artifact_run_id` السابق ومدخلات صور Docker المحضرة
عند توفرها، بحيث يستطيع المسار الفاشل إعادة استخدام tarball وصور GHCR نفسها.

### QA Lab

صندوق QA Lab جزء من `OpenClaw Release Checks` أيضًا. وهو بوابة الإصدار لسلوك
الوكلاء ومستوى القنوات، منفصلًا عن آليات حزم Vitest وDocker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ وهمي يقارن مسار OpenAI المرشح بخط أساس Opus 4.6 باستخدام حزمة
  التكافؤ الوكيلية
- ملف تعريف Matrix QA المباشر السريع باستخدام بيئة `qa-live-shared`
- مسار Telegram QA مباشر باستخدام عقود اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج قياس الإصدار عن بُعد إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن سؤال: "هل يتصرف الإصدار بشكل صحيح في سيناريوهات
QA وتدفقات القنوات المباشرة؟" احتفظ بعناوين URL للتحف الخاصة بمسارات التكافؤ
وMatrix وTelegram عند اعتماد الإصدار. تظل تغطية Matrix الكاملة متاحة كتشغيل
QA-Lab يدوي مقسم إلى شظايا بدلًا من المسار الافتراضي الحرج للإصدار.

### الحزمة

صندوق الحزمة هو بوابة المنتج القابل للتثبيت. يدعمه `Package Acceptance`
والمحلل `scripts/resolve-openclaw-package-candidate.mjs`. يطبع المحلل المرشح
إلى tarball `package-under-test` الذي تستهلكه Docker E2E، ويتحقق من مخزون
الحزمة، ويسجل إصدار الحزمة وSHA-256، ويبقي مرجع حاضنة سير العمل منفصلًا عن
مرجع مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: ‏`openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيق
- `source=ref`: حزم فرع `package_ref` أو وسمًا أو SHA التزام كاملًا موثوقًا
  باستخدام حاضنة `workflow_ref` المحددة
- `source=url`: تنزيل `.tgz` عبر HTTPS مع `package_sha256` مطلوب
- `source=artifact`: إعادة استخدام `.tgz` مرفوع بواسطة تشغيل GitHub Actions آخر

يشغّل `OpenClaw Release Checks` ‏Package Acceptance مع `source=artifact`،
وتحفة حزمة الإصدار المحضرة، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`،
و`published_upgrade_survivor_baselines=all-since-2026.4.23`،
و`published_upgrade_survivor_scenarios=reported-issues`، و`telegram_mode=mock-openai`.
يبقي Package Acceptance الترحيل، والتحديث، وتنظيف تبعيات Plugin القديمة،
وتجهيزات Plugin غير المتصلة، وتحديث Plugin، وTelegram package QA ضد tarball
المحلول نفسه. تغطي مصفوفة الترقية كل خط أساس npm منشور ومستقر من `2026.4.23`
حتى `latest`؛ استخدم Package Acceptance مع `source=npm` لمرشح شُحن بالفعل،
أو `source=ref`/`source=artifact` لـ tarball npm محلي مدعوم بـ SHA قبل النشر.
إنه البديل الأصلي في GitHub لمعظم تغطية الحزمة/التحديث التي كانت تتطلب
Parallels سابقًا. ما زالت فحوصات الإصدار عبر أنظمة التشغيل مهمة للإعداد
الأولي الخاص بنظام التشغيل، والمثبت، وسلوك المنصة، لكن تحقق منتج الحزمة/التحديث
يجب أن يفضل Package Acceptance.

قائمة التحقق الأساسية للتحقق من التحديث وPlugin هي
[اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins). استخدمها عند تحديد
أي مسار محلي أو Docker أو Package Acceptance أو release-check يثبت تثبيت/تحديث
Plugin أو تنظيف doctor أو تغيير ترحيل الحزمة المنشورة. الترحيل المنشور
الشامل للتحديث من كل حزمة مستقرة `2026.4.23+` هو سير عمل يدوي منفصل
`Update Migration`، وليس جزءًا من Full Release CI.

تسامح package-acceptance القديم محدود زمنيًا عمدًا. يمكن للحزم حتى `2026.4.25`
استخدام مسار التوافق للفجوات الوصفية المنشورة بالفعل إلى npm: إدخالات مخزون
QA خاصة مفقودة من tarball، و`gateway install --wrapper` مفقود، وملفات تصحيح
مفقودة في تجهيز git المشتق من tarball، و`update.channel` مستمر مفقود، ومواقع
سجلات تثبيت Plugin قديمة، واستمرار سجل تثبيت marketplace مفقود، وترحيل بيانات
config الوصفية أثناء `plugins update`. قد تحذر حزمة `2026.4.26` المنشورة
بالنسبة إلى ملفات ختم بيانات build الوصفية المحلية التي شُحنت بالفعل. يجب
أن تستوفي الحزم اللاحقة عقود الحزم الحديثة؛ وتؤدي الفجوات نفسها إلى فشل
تحقق الإصدار.

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

- `smoke`: مسارات تثبيت الحزمة/القناة/الوكيل السريعة، وشبكة Gateway، وإعادة
  تحميل config
- `package`: عقود حزمة التثبيت/التحديث/Plugin من دون ClawHub مباشر؛ هذا هو
  الافتراضي في release-check
- `product`: ‏`package` بالإضافة إلى قنوات MCP، وتنظيف cron/subagent، وبحث
  الويب OpenAI، وOpenWebUI
- `full`: مقاطع Docker لمسار الإصدار مع OpenWebUI
- `custom`: قائمة `docker_lanes` الدقيقة لإعادة التشغيل المركزة

لإثبات Telegram لحزمة مرشحة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في قبول الحزمة. يمرر سير العمل ملف tarball
المحلول `package-under-test` إلى مسار Telegram؛ ولا يزال سير عمل Telegram
المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة دخول النشر المعدِّلة الاعتيادية. ينسق
سير عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. سحب وسم الإصدار وحل SHA الالتزام الخاص به.
2. التحقق من أن الوسم قابل للوصول من `main` أو `release/*`.
3. تشغيل `pnpm plugins:sync:check`.
4. إرسال `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. إرسال `Plugin ClawHub Release` بالنطاق نفسه وSHA نفسه.
6. إرسال `OpenClaw NPM Release` مع وسم الإصدار ووسم dist-tag الخاص بـ npm و
   `preflight_run_id` المحفوظ.

مثال نشر بيتا:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

مثال نشر ألفا:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

نشر مستقر إلى وسم dist-tag الافتراضي beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

تكون الترقية المستقرة مباشرة إلى `latest` صريحة:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

استخدم سيري العمل الأدنى مستوى `Plugin NPM Release` و`Plugin ClawHub Release`
فقط لأعمال الإصلاح أو إعادة النشر المركزة. لإصلاح Plugin محدد، مرر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أرسل سير العمل الفرعي مباشرة عندما يجب عدم نشر
حزمة OpenClaw.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم الإصدار المطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-alpha.1` أو `v2026.4.2-beta.1`؛ عندما تكون `preflight_only=true`، يمكن أن يكون أيضًا SHA الالتزام الكامل الحالي ذي 40 حرفًا لفرع سير العمل من أجل اختبار تمهيدي للتحقق فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الفعلي
- `preflight_run_id`: مطلوب في مسار النشر الفعلي حتى يعيد سير العمل استخدام
  ملف tarball المجهز من تشغيل الاختبار التمهيدي الناجح
- `npm_dist_tag`: وسم npm الهدف لمسار النشر؛ القيمة الافتراضية `beta`

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم الإصدار المطلوب؛ يجب أن يكون موجودًا مسبقًا
- `preflight_run_id`: معرّف تشغيل الاختبار التمهيدي الناجح لـ `OpenClaw NPM Release`؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm الهدف لحزمة OpenClaw
- `plugin_publish_scope`: القيمة الافتراضية `all-publishable`؛ استخدم `selected` فقط
  لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: القيمة الافتراضية `true`؛ اضبطها على `false` فقط عند استخدام
  سير العمل كمنسق إصلاح للـ Plugin فقط

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق منه. تتطلب الفحوصات الحاملة للأسرار
  أن يكون الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار.

القواعد:

- يمكن للوسوم المستقرة ووسوم التصحيح النشر إلى `beta` أو `latest`
- يمكن لوسوم الإصدار التمهيدي ألفا النشر إلى `alpha` فقط
- يمكن لوسوم الإصدار التمهيدي بيتا النشر إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، يُسمح بإدخال SHA الالتزام الكامل فقط عندما تكون
  `preflight_only=true`
- يكون `OpenClaw Release Checks` و`Full Release Validation` دائمًا
  للتحقق فقط
- يجب أن يستخدم مسار النشر الفعلي `npm_dist_tag` نفسه المستخدم أثناء الاختبار التمهيدي؛
  يتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر

## تسلسل إصدار npm مستقر

عند إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الكامل الحالي لفرع سير العمل
     كتشغيل تجريبي للتحقق فقط لسير عمل الاختبار التمهيدي
2. اختر `npm_dist_tag=beta` للتدفق الاعتيادي الذي يبدأ ببيتا، أو `latest` فقط
   عندما تريد عمدًا نشرًا مستقرًا مباشرًا
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو SHA الالتزام الكامل
   عندما تريد CI الاعتيادي مع ذاكرة التخزين المؤقت الحية للمطالبات، وDocker، ومختبر ضمان الجودة،
   والمصفوفة، وتغطية Telegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدًا إلى رسم الاختبار الاعتيادي الحتمي فقط، فشغّل
   سير عمل `CI` اليدوي على مرجع الإصدار بدلًا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` مع `tag` نفسه و`npm_dist_tag` نفسه
   و`preflight_run_id` المحفوظ؛ ينشر Plugins الخارجية إلى npm
   وClawHub قبل ترقية حزمة npm الخاصة بـ OpenClaw
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
8. إذا نُشر الإصدار عمدًا مباشرة إلى `latest` ويجب أن يتبع `beta`
   البناء المستقر نفسه فورًا، فاستخدم سير العمل الخاص نفسه
   لتوجيه وسمي dist-tag كليهما إلى الإصدار المستقر، أو دع مزامنة الإصلاح الذاتي المجدولة
   تنقل `beta` لاحقًا

يوجد تعديل dist-tag في المستودع الخاص لأسباب أمنية لأنه لا يزال
يتطلب `NPM_TOKEN`، بينما يحافظ المستودع العام على نشر يعتمد على OIDC فقط.

يبقي ذلك مسار النشر المباشر ومسار الترقية الذي يبدأ ببيتا موثقين
ومرئيين للمشغلين.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر
CLI الخاصة بـ 1Password (`op`) داخل جلسة tmux مخصصة فقط. لا تستدعِ `op`
مباشرة من صدفة الوكيل الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات
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

## ذو صلة

- [قنوات الإصدار](/ar/install/development-channels)
