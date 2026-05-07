---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرتها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، وبيئات التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدارات
x-i18n:
    generated_at: "2026-05-07T15:08:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- stable: الإصدارات الموسومة التي تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- beta: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- dev: الرأس المتحرك للفرع `main`

## تسمية الإصدارات

- إصدار مستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار تصحيح مستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار beta قبل الإصدار: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف صفرًا بادئًا للشهر أو اليوم
- يعني `latest` إصدار npm المستقر الحالي الذي تمت ترقيته
- يعني `beta` هدف التثبيت التجريبي الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضيًا؛ يمكن لمشغلي الإصدار استهداف `latest` صراحةً، أو ترقية بناء beta مُدقّق لاحقًا
- يشحن كل إصدار مستقر من OpenClaw حزمة npm وتطبيق macOS معًا؛
  تتحقق إصدارات beta عادةً من مسار npm/الحزمة وتنشره أولًا، مع حجز
  بناء/توقيع/توثيق تطبيق mac للإصدار المستقر ما لم يُطلب ذلك صراحةً

## وتيرة الإصدار

- تتحرك الإصدارات وفق beta أولًا
- لا يأتي المستقر إلا بعد التحقق من أحدث beta
- يقتطع المشرفون عادةً الإصدارات من فرع `release/YYYY.M.D` يتم إنشاؤه
  من `main` الحالي، بحيث لا تمنع عملية التحقق من الإصدار وإصلاحاته
  التطوير الجديد على `main`
- إذا تم دفع وسم beta أو نشره وكان يحتاج إلى إصلاح، يقتطع المشرفون
  وسم `-beta.N` التالي بدلًا من حذف وسم beta القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغّل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد dist-tag، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار المخصص للمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وتأكد من دفع الالتزام الهدف،
   وتأكد من أن CI الحالي لـ `main` أخضر بما يكفي للتفريع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، واجعل الإدخالات موجهة للمستخدم، ثم التزم به، وادفعه، وأعد
   rebase/اسحب مرة أخرى قبل التفريع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب حمله عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. ارفع كل موضع إصدار مطلوب للوسم المقصود، ثم شغّل
   `pnpm release:prep`. يحدّث هذا إصدارات Plugin، ومخزون Plugin، ومخطط
   التهيئة، وبيانات تعريف تهيئة القنوات المضمنة، وخط أساس وثائق التهيئة،
   وتصديرات Plugin SDK، وخط أساس API لـ Plugin SDK بالترتيب الصحيح. التزم
   بأي انحراف مولّد قبل وضع الوسم. ثم شغّل الفحص التمهيدي المحلي الحتمي:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل من 40 محرفًا لفرع الإصدار للتحقق التمهيدي فقط.
   احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار أو الوسم أو SHA الالتزام الكامل. هذه هي نقطة الدخول اليدوية
   الوحيدة لصناديق اختبار الإصدار الكبيرة الأربعة: Vitest، وDocker، وQA Lab،
   وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر ملف أو مسار أو مهمة
   سير عمل أو ملف تعريف حزمة أو موفّر أو قائمة سماح للنماذج يثبت الإصلاح.
   أعد تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير الأدلة السابقة
   قديمة.
9. بالنسبة إلى beta، ضع الوسم `vYYYY.M.D-beta.N`، ثم شغّل
   `OpenClaw Release Publish` من فرع `release/YYYY.M.D` المطابق. يتحقق من
   `pnpm plugins:sync:check`، ويرسل كل حزم Plugin القابلة للنشر إلى npm
   والمجموعة نفسها إلى ClawHub بالتوازي، ثم يرقّي أثر الفحص التمهيدي
   المحضّر لـ OpenClaw على npm باستخدام dist-tag المطابق فور نجاح نشر
   Plugin على npm. قد يكون نشر ClawHub لا يزال قيد التشغيل أثناء نشر
   OpenClaw على npm، لكن سير عمل نشر الإصدار يطبع معرّفات التشغيل التابعة
   فورًا. افتراضيًا لا ينتظر ClawHub بعد إرساله، لذلك لا تُحجب إتاحة
   OpenClaw على npm بسبب موافقات ClawHub أو عمل السجل الأبطأ؛ اضبط
   `wait_for_clawhub=true` عندما يجب أن يمنع ClawHub اكتمال سير العمل. يعيد
   مسار ClawHub محاولة فشل تثبيت تبعية CLI العابر، وينشر Plugins التي تجتاز
   المعاينة حتى عند تعثر خلية معاينة واحدة، وينتهي بالتحقق من السجل لكل
   إصدار Plugin متوقع بحيث تبقى عمليات النشر الجزئية مرئية وقابلة لإعادة
   المحاولة. بعد النشر، شغّل
   قبول الحزمة بعد النشر
   مقابل حزمة `openclaw@YYYY.M.D-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاج إصدار ما قبل إصدار مدفوع أو منشور
   إلى إصلاح، فاقتطع رقم ما قبل الإصدار المطابق التالي؛ لا تحذف إصدار
   ما قبل الإصدار القديم ولا تعِد كتابته.
10. بالنسبة إلى المستقر، لا تتابع إلا بعد أن يمتلك beta المُدقّق أو مرشح
    الإصدار دليل التحقق المطلوب. يمر نشر npm المستقر أيضًا عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أثر الفحص التمهيدي الناجح
    عبر `preflight_run_id`؛ تتطلب جاهزية إصدار macOS المستقر أيضًا وجود
    ملفات `.zip`، و`.dmg`، و`.dSYM.zip` المحزومة، و`appcast.xml` المحدّث على
    `main`.
11. بعد النشر، شغّل متحقق npm بعد النشر، وTelegram E2E الاختياري المستقل
    المنشور من npm عندما تحتاج إلى إثبات القناة بعد النشر، وترقية dist-tag
    عند الحاجة، وملاحظات إصدار/ما قبل إصدار GitHub من قسم `CHANGELOG.md`
    المطابق الكامل، وخطوات إعلان الإصدار.

## الفحص التمهيدي للإصدار

- شغّل `pnpm check:test-types` قبل فحص ما قبل الإصدار حتى يظل TypeScript الخاص بالاختبارات
  مشمولاً خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل فحص ما قبل الإصدار حتى تكون فحوصات دورات
  الاستيراد الأوسع وحدود البنية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون
  مصنوعات الإصدار المتوقعة `dist/*` وحزمة Control UI موجودة لخطوة
  التحقق من الحزمة
- شغّل `pnpm release:prep` بعد رفع إصدار الجذر وقبل وضع الوسم. يشغّل
  كل مولّد إصدار حتمي ينجرف عادةً بعد تغيير إصدار/إعداد/API: إصدارات Plugin،
  مخزون Plugin، مخطط الإعداد الأساسي، بيانات تعريف إعداد القناة المضمّنة،
  خط أساس وثائق الإعداد، صادرات SDK الخاص بـ Plugin، وخط أساس API الخاص
  بـ SDK الخاص بـ Plugin. يعيد `pnpm release:check` تشغيل تلك الحراسات
  في وضع الفحص ويبلّغ عن كل فشل انجراف مولّد يجده في مرور واحد قبل تشغيل
  فحوصات إصدار الحزمة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل موافقة الإصدار
  لبدء كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعاً
  أو وسماً أو SHA التزاماً كاملاً، ويرسل `CI` يدوياً، ويرسل
  `OpenClaw Release Checks` لاختبار تثبيت smoke، وقبول الحزمة، وفحوصات
  الحزمة عبر أنظمة التشغيل، وتكافؤ QA Lab، وMatrix، ومسارات Telegram.
  التشغيلات المستقرة/الافتراضية تُبقي فحوصات live/E2E الشاملة وتمرين مسار
  إصدار Docker الطويل خلف `run_release_soak=true`؛ ويفرض
  `release_profile=full` تشغيلها. مع `release_profile=full` و
  `rerun_group=all`، يشغّل أيضاً Telegram E2E للحزمة على مصنوع
  `release-package-under-test` من فحوصات الإصدار. وفّر
  `npm_telegram_package_spec` بعد النشر عندما ينبغي لـ Telegram E2E نفسه
  إثبات حزمة npm المنشورة أيضاً. وفّر `package_acceptance_package_spec`
  بعد النشر عندما ينبغي لـ Package Acceptance تشغيل مصفوفة الحزمة/التحديث
  على حزمة npm المشحونة بدلاً من المصنوع المبني من SHA. وفّر
  `evidence_package_spec` عندما ينبغي لتقرير الأدلة الخاص إثبات أن التحقق
  يطابق حزمة npm منشورة بدون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد دليلاً من قناة جانبية
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` لـ
  `openclaw@beta` أو `openclaw@latest` أو إصدار محدد بدقة؛ واستخدم
  `source=ref` لحزم فرع/وسم/SHA موثوق من `package_ref` باستخدام
  حاضنة `workflow_ref` الحالية؛ واستخدم `source=url` لأرشيف tarball عبر
  HTTPS مع SHA-256 مطلوب؛ أو `source=artifact` لأرشيف tarball مرفوع بواسطة
  تشغيل GitHub Actions آخر. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E مقابل ذلك
  الأرشيف، ويمكنه تشغيل Telegram QA مقابل الأرشيف نفسه باستخدام
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن
  مسارات Docker المحددة `published-upgrade-survivor`، يكون مصنوع الحزمة هو
  المرشح ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور.
  يستخدم `update-restart-auth` حزمة المرشح بصفتها كلاً من CLI المثبت
  وpackage-under-test بحيث يختبر مسار إعادة التشغيل المُدار لأمر تحديث المرشح.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات الشخصية الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعداد
  - `package`: مسارات الحزمة/التحديث/إعادة التشغيل/Plugin الأصلية للمصنوع بدون OpenWebUI أو ClawHub مباشر
  - `product`: ملف الحزمة بالإضافة إلى قنوات MCP، وتنظيف cron/subagent،
    وبحث الويب من OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: تحديد `docker_lanes` بدقة لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرةً عندما تحتاج فقط إلى تغطية CI العادية
  الكاملة لمرشح الإصدار. تتجاوز إرسالات CI اليدوية تحديد النطاق حسب التغييرات
  وتفرض شظايا Linux Node، وشظايا Plugin المضمّنة، وعقود القنوات، وتوافق
  Node 22، و`check`، و`check-additional`، واختبار build smoke، وفحوصات
  الوثائق، وSkills الخاصة بـ Python، وWindows، وmacOS، وAndroid، ومسارات
  Control UI i18n.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. يختبر
  QA-lab عبر مستقبِل OTLP/HTTP محلي ويتحقق من أسماء span للتتبعات المصدّرة،
  والسمات المحدودة، وتنقيح المحتوى/المعرّفات بدون الحاجة إلى Opik أو Langfuse
  أو جامع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر الذي يُحدث تغييرات بعد وجود
  الوسم. أرسله من `release/YYYY.M.D` (أو `main` عند نشر وسم قابل للوصول من
  main)، ومرّر وسم الإصدار و`preflight_run_id` الناجح لـ npm الخاص بـ
  OpenClaw، وأبقِ نطاق نشر Plugin الافتراضي `all-publishable` إلا إذا كنت
  تشغّل إصلاحاً مركزاً عمداً. يقوم سير العمل بتسلسل نشر npm الخاص بـ Plugin،
  ونشر ClawHub الخاص بـ Plugin، ونشر npm الخاص بـ OpenClaw حتى لا تُنشر
  الحزمة الأساسية قبل Plugins الخارجية الخاصة بها.
- فحوصات الإصدار تعمل الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضاً مسار تكافؤ QA Lab mock بالإضافة إلى
  ملف Matrix live السريع ومسار Telegram QA قبل موافقة الإصدار. تستخدم مسارات
  live بيئة `qa-live-shared`؛ ويستخدم Telegram أيضاً عقود اعتماد Convex CI.
  شغّل سير العمل اليدوي `QA-Lab - All Lanes` مع `matrix_profile=all` و
  `matrix_shards=true` عندما تريد مخزون نقل Matrix والوسائط وE2EE كاملاً
  بالتوازي.
- تحقق وقت التشغيل للتثبيت والترقية عبر أنظمة التشغيل جزء من
  `OpenClaw Release Checks` العامة و`Full Release Validation`، واللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرةً
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيراً وحتمياً ومركزاً على
  المصنوعات، بينما تبقى الفحوصات المباشرة الأبطأ في مسارها الخاص حتى لا
  تعطل النشر أو تمنعه
- ينبغي إرسال فحوصات الإصدار الحاملة للأسرار عبر `Full Release
Validation` أو من مرجع سير عمل `main`/release حتى يبقى منطق سير العمل
  والأسرار تحت السيطرة
- يقبل `OpenClaw Release Checks` فرعاً أو وسماً أو SHA التزاماً كاملاً ما دام
  الالتزام المحلول قابلاً للوصول من فرع OpenClaw أو وسم إصدار
- يقبل فحص ما قبل الإصدار الخاص بالتحقق فقط لـ `OpenClaw NPM Release` أيضاً
  SHA الالتزام الكامل الحالي المؤلف من 40 حرفاً لفرع سير العمل بدون الحاجة
  إلى وسم مدفوع
- مسار SHA هذا للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط لفحص بيانات تعريف
  الحزمة؛ أما النشر الحقيقي فما زال يتطلب وسم إصدار حقيقياً
- يُبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغّلات GitHub-hosted،
  بينما يمكن لمسار التحقق غير المُحدِث استخدام مشغّلات Blacksmith Linux الأكبر
- يشغّل ذلك سير العمل
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
  للتحقق من تهيئة حزمة مثبتة، وإعداد Telegram، وTelegram E2E الحقيقي
  مقابل حزمة npm المنشورة باستخدام تجمع بيانات اعتماد Telegram المستأجر
  المشترك. يمكن لصيانة محلية لمرة واحدة حذف متغيرات Convex وتمرير بيانات
  اعتماد البيئة الثلاثة `OPENCLAW_QA_TELEGRAM_*` مباشرةً.
- لتشغيل اختبار beta smoke الكامل بعد النشر من جهاز صيانة، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق Parallels لتحديث npm/هدف جديد، ويرسل `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل المحدد، وينزّل المصنوع، ويطبع تقرير Telegram.
- يمكن للصائنين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر سير العمل
  اليدوي `NPM Telegram Beta E2E`. إنه يدوي فقط عن قصد ولا يعمل عند كل دمج.
- تستخدم أتمتة إصدارات الصائنين الآن أسلوب الفحص المسبق ثم الترقية:
  - يجب أن يمر نشر npm الحقيقي بـ `preflight_run_id` ناجح لـ npm
  - يجب إرسال نشر npm الحقيقي من فرع `main` أو `release/YYYY.M.D` نفسه
    الذي شُغّل منه الفحص المسبق الناجح
  - إصدارات npm المستقرة تفترض `beta` افتراضياً
  - يمكن أن يستهدف نشر npm المستقر `latest` صراحةً عبر إدخال سير العمل
  - أصبح تعديل npm dist-tag المستند إلى الرمز المميز الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    للأمان، لأن `npm dist-tag add` ما زال يحتاج إلى `NPM_TOKEN` بينما
    يحتفظ المستودع العام بنشر OIDC فقط
  - `macOS Release` العام للتحقق فقط؛ عندما يوجد وسم على فرع إصدار فقط
    لكن سير العمل مُرسل من `main`، عيّن `public_release_branch=release/YYYY.M.D`
  - يجب أن يمر نشر mac الخاص الحقيقي بـ `preflight_run_id` و
    `validate_run_id` ناجحين للـ mac الخاص
  - تروّج مسارات النشر الحقيقية المصنوعات المُعدة بدلاً من إعادة بنائها
    مرة أخرى
- بالنسبة لإصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يفحص متحقق ما بعد النشر
  أيضاً مسار الترقية نفسه ببادئة مؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار التثبيتات العمومية الأقدم بصمت على حمولة
  المستقر الأساسية
- يفشل فحص ما قبل إصدار npm بشكل مغلق ما لم يتضمن أرشيف tarball كلاً من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة متصفح فارغة مرة أخرى
- يتحقق ما بعد النشر أيضاً من أن نقاط دخول Plugin المنشورة وبيانات تعريف
  الحزمة موجودة في تخطيط السجل المثبت. الإصدار الذي يشحن حمولات وقت تشغيل
  Plugin ناقصة يفشل متحقق ما بعد النشر ولا يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضاً ميزانية `unpackedSize` لحزمة npm على
  tarball تحديث المرشح، بحيث تلتقط اختبارات e2e للمثبت تضخم الحزمة العرضي
  قبل مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت extension، أو مصفوفات اختبار
  extension، فأعد توليد ومراجعة مخرجات مصفوفة `plugin-prerelease-extension-shard`
  المملوكة للمخطط من `.github/workflows/plugin-prerelease.yml` قبل الموافقة
  حتى لا تصف ملاحظات الإصدار تخطيط CI قديماً
- تشمل جاهزية إصدار macOS المستقر أيضاً أسطح المحدّث:
  - يجب أن ينتهي إصدار GitHub باحتواء ملفات `.zip` و`.dmg` و`.dSYM.zip` المحزمة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحافظ التطبيق المحزم على معرّف حزمة غير debug، ورابط تغذية Sparkle
    غير فارغ، و`CFBundleVersion` عند أو فوق أرضية بناء Sparkle القانونية
    لذلك الإصدار

## صناديق اختبار الإصدار

`Full Release Validation` هو الطريقة التي يبدأ بها المشغلون كل اختبارات ما قبل الإصدار من
نقطة دخول واحدة. لإثبات التزام مثبت على فرع سريع الحركة، استخدم
المساعد حتى يعمل كل سير عمل فرعي من فرع مؤقت مثبت عند SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويرسل `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن كل `headSha` لسير عمل فرعي
يطابق الهدف، ثم يحذف الفرع المؤقت. هذا يتجنب إثبات تشغيل فرعي أحدث من
`main` عن طريق الخطأ.

للتحقق من فرع إصدار أو وسم إصدار، شغّله من مرجع سير عمل `main` الموثوق
ومرّر فرع الإصدار أو وسمه بوصفه `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

يحل سير العمل مرجع الهدف، ويطلق `CI` يدويًا مع
`target_ref=<release-ref>`، ويطلق `OpenClaw Release Checks`، ويحضّر
أثرًا أبويًا `release-package-under-test` للفحوصات المواجهة للحزمة، ويطلق
اختبار Telegram E2E المستقل للحزمة عندما تكون `release_profile=full` مع
`rerun_group=all` أو عند تعيين `npm_telegram_package_spec`. بعد ذلك يوسّع `OpenClaw Release
Checks` نطاقه إلى اختبار تثبيت smoke، وفحوصات الإصدار عبر أنظمة التشغيل، وتغطية مسار إصدار Docker المباشرة/E2E
عند تفعيل الاختبار الممتد، وPackage Acceptance مع QA لحزمة Telegram، وتكافؤ QA Lab، وMatrix المباشر، وTelegram المباشر. لا يكون التشغيل الكامل مقبولًا إلا عندما يعرض ملخص
`Full Release Validation`
أن `normal_ci` و`release_checks` ناجحان. في وضع full/all،
يجب أن ينجح الابن `npm_telegram` أيضًا؛ وخارج full/all يتم تخطيه
ما لم تُقدَّم `npm_telegram_package_spec` منشورة. يتضمن ملخص
التحقق النهائي جداول أبطأ المهام لكل تشغيل ابن، بحيث يستطيع مدير الإصدار
رؤية المسار الحرج الحالي دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، والفروق بين ملفي
stable وfull، والآثار، ومقابض إعادة التشغيل المركزة.
تُطلق سير العمل الأبناء من المرجع الموثوق الذي يشغّل `Full Release
Validation`، عادةً `--ref main`، حتى عندما يشير `ref` الهدف إلى
فرع إصدار أو وسم أقدم. لا يوجد إدخال منفصل لمرجع سير عمل Full Release Validation؛
اختر حزمة الاختبار الموثوقة باختيار مرجع تشغيل سير العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات التزام دقيق على `main` متحرك؛
لا يمكن أن تكون قيم SHA للالتزامات الخام مراجع إطلاق لسير العمل، لذلك استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبّت.

استخدم `release_profile` لاختيار نطاق البث المباشر/المزوّد:

- `minimum`: أسرع مسار OpenAI/النواة المباشر وDocker الحرج للإصدار
- `stable`: الحد الأدنى بالإضافة إلى تغطية المزوّد/الخلفية المستقرة لاعتماد الإصدار
- `full`: المستقر بالإضافة إلى تغطية واسعة للمزوّد/الوسائط الاستشارية

استخدم `run_release_soak=true` مع `stable` عندما تكون المسارات الحاجبة للإصدار
خضراء وتريد الفحص الشامل للبث المباشر/E2E، ومسار إصدار Docker، و
مسحًا محدودًا للترقية المنشورة القادرة على النجاة قبل الترويج. يغطي ذلك المسح
أحدث أربع حزم مستقرة بالإضافة إلى خطوط أساس `2026.4.23` و`2026.5.2`
المثبتة، بالإضافة إلى تغطية `2026.4.15` الأقدم، مع إزالة خطوط الأساس المكررة
وتقسيم كل خط أساس إلى مهمة مشغّل Docker خاصة به. `full` يعني ضمنيًا
`run_release_soak=true`.

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع الهدف
مرة واحدة بوصفه `release-package-under-test` وتعيد استخدام ذلك الأثر في فحوصات
عبر أنظمة التشغيل وPackage Acceptance وDocker لمسار الإصدار عند تشغيل الاختبار الممتد. هذا يبقي
كل صناديق الاختبار المواجهة للحزمة على البايتات نفسها ويتجنب بناء الحزمة مرارًا.
يستخدم اختبار تثبيت smoke عبر أنظمة التشغيل لـ OpenAI المتغير `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون
متغير المستودع/المؤسسة معينًا، وإلا يستخدم `openai/gpt-5.4`، لأن هذا المسار
يثبت تثبيت الحزمة، والإعداد الأولي، وبدء تشغيل Gateway، ودورة وكيل مباشرة واحدة
بدلًا من قياس أبطأ نموذج افتراضي. تبقى مصفوفة المزوّد المباشر الأوسع
هي المكان المخصص للتغطية الخاصة بالنماذج.

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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركّز. إذا فشل صندوق واحد،
فاستخدم سير العمل الابن الفاشل، أو المهمة، أو مسار Docker، أو ملف الحزمة،
أو مزوّد النموذج، أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة أخرى فقط عندما
يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل أدلة جميع الصناديق السابقة
قديمة. يعيد محقق المظلة النهائي فحص معرفات تشغيل سير العمل الأبناء
المسجلة، لذلك بعد إعادة تشغيل سير عمل ابن بنجاح، أعد تشغيل مهمة الأب
`Verify full validation` الفاشلة فقط.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل
مرشح الإصدار الحقيقي، و`ci` يشغّل ابن CI العادي فقط، و`plugin-prerelease`
يشغّل ابن Plugin المخصص للإصدار فقط، و`release-checks` يشغّل كل صناديق الإصدار،
ومجموعات الإصدار الأضيق هي `install-smoke` و`cross-os` و
`live-e2e` و`package` و`qa` و`qa-parity` و`qa-live` و`npm-telegram`.
تتطلب إعادات تشغيل `npm-telegram` المركزة `npm_telegram_package_spec`؛ وتستخدم تشغيلات full/all
مع `release_profile=full` أثر حزمة release-checks. يمكن لإعادات تشغيل
cross-OS المركزة إضافة `cross_os_suite_filter=windows/packaged-upgrade` أو
مرشح آخر لنظام تشغيل/حزمة. إخفاقات QA في release-checks استشارية؛ فشل QA فقط
لا يمنع التحقق من الإصدار.

### Vitest

صندوق Vitest هو سير عمل الابن `CI` اليدوي. يتجاوز CI اليدوي عمدًا
نطاق التغييرات ويفرض رسم الاختبار البياني العادي لمرشح الإصدار: أجزاء Linux Node،
وأجزاء Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`،
و`check-additional`، واختبار build smoke، وفحوصات المستندات، وSkills الخاصة بـ Python،
وWindows، وmacOS، وAndroid، وi18n لواجهة Control UI.

استخدم هذا الصندوق للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية الكاملة؟"
إنه ليس مماثلًا للتحقق من المنتج في مسار الإصدار. الأدلة التي يجب الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض URL تشغيل `CI` المُطلق
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الأجزاء الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- آثار توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما
  يحتاج التشغيل إلى تحليل الأداء

شغّل CI اليدوي مباشرةً فقط عندما يحتاج الإصدار إلى CI عادي حتمي، ولكن
ليس إلى صناديق Docker أو QA Lab أو البث المباشر أو عبر أنظمة التشغيل أو الحزم:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker في `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، بالإضافة إلى سير عمل
`install-smoke` بوضع الإصدار. إنه يتحقق من مرشح الإصدار عبر بيئات Docker
مغلّفة بدلًا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- اختبار تثبيت smoke كامل مع تفعيل اختبار smoke البطيء للتثبيت العام عبر Bun
- إعداد/إعادة استخدام صورة smoke لـ Dockerfile الجذري حسب SHA الهدف، مع تشغيل مهام QR،
  والجذر/Gateway، وinstaller/Bun smoke كأجزاء install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`،
  و`plugins-runtime-services`،
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إزالة تثبيت Plugin المضمّنة المقسمة
  `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات المزوّد المباشر/E2E وتغطية نموذج Docker المباشر عندما تتضمن فحوصات الإصدار
  مجموعات مباشرة

استخدم آثار Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للاسترداد المركّز،
استخدم `docker_lanes=<lane[,lane]>` على سير عمل live/E2E القابل لإعادة الاستخدام بدلًا من
إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل المولدة
`package_artifact_run_id` السابق ومدخلات صورة Docker المحضّرة عند توفرها، بحيث يمكن
لمسار فاشل إعادة استخدام ملف tarball نفسه وصور GHCR نفسها.

### QA Lab

صندوق QA Lab هو أيضًا جزء من `OpenClaw Release Checks`. إنه بوابة الإصدار
للسلوك الوكيلي ومستوى القنوات، منفصلًا عن Vitest وآليات حزم Docker.

تشمل تغطية QA Lab للإصدار:

- مسار التكافؤ الوهمي الذي يقارن مسار OpenAI المرشح بخط أساس Opus 4.6
  باستخدام حزمة التكافؤ الوكيلي
- ملف QA مباشر وسريع لـ Matrix باستخدام بيئة `qa-live-shared`
- مسار QA مباشر لـ Telegram باستخدام عقود تأجير بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج قياس الإصدار عن بُعد إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات المباشرة؟" احتفظ بعناوين URL للآثار الخاصة بمسارات التكافؤ وMatrix وTelegram
عند اعتماد الإصدار. تبقى تغطية Matrix الكاملة متاحة كتشغيل QA-Lab يدوي
مجزأ بدلًا من المسار الافتراضي الحرج للإصدار.

### الحزمة

صندوق الحزمة هو بوابة المنتج القابل للتثبيت. يستند إلى
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبّع المحلل المرشح
إلى ملف tarball باسم `package-under-test` الذي يستهلكه Docker E2E، ويتحقق
من مخزون الحزمة، ويسجل إصدار الحزمة وSHA-256، ويبقي مرجع حزمة سير العمل
منفصلًا عن مرجع مصدر الحزمة.

مصادر المرشح المدعومة:

- `source=npm`: `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيق
  للإصدار
- `source=ref`: حزم فرع `package_ref` موثوقًا أو وسمًا أو SHA التزام كاملًا
  مع حزمة `workflow_ref` المختارة
- `source=url`: تنزيل ملف `.tgz` عبر HTTPS مع `package_sha256` مطلوب
- `source=artifact`: إعادة استخدام ملف `.tgz` رُفع بواسطة تشغيل GitHub Actions آخر

تشغّل `OpenClaw Release Checks` Package Acceptance مع `source=artifact`،
وأثر حزمة الإصدار المحضّر، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
و`telegram_mode=mock-openai`. يبقي Package Acceptance الترحيل، والتحديث،
وإعادة تشغيل تحديث المصادقة المكوّنة، وتنظيف اعتمادية Plugin قديمة، وتجهيزات Plugin دون اتصال،
وتحديث Plugin، وQA لحزمة Telegram مقابل ملف tarball المحلول نفسه. تستخدم فحوصات الإصدار الحاجبة
خط أساس أحدث حزمة منشورة افتراضيًا؛ ويوسّع `run_release_soak=true` أو
`release_profile=full` ذلك ليشمل كل خطوط أساس npm المنشورة المستقرة من
`2026.4.23` حتى `latest` بالإضافة إلى تجهيزات المشكلات المبلّغ عنها. استخدم
Package Acceptance مع `source=npm` لمرشح شُحن بالفعل، أو
`source=ref`/`source=artifact` لملف npm tarball محلي مدعوم بـ SHA قبل
النشر. إنه البديل الأصلي في GitHub
لمعظم تغطية الحزمة/التحديث التي كانت تتطلب Parallels سابقًا. ما زالت فحوصات الإصدار
عبر أنظمة التشغيل مهمة للإعداد الأولي الخاص بنظام التشغيل، والمثبّت، وسلوك المنصة، لكن ينبغي
أن يفضّل التحقق من منتج الحزمة/التحديث Package Acceptance.

قائمة التحقق المعتمدة للتحقق من التحديث وPlugin هي
[اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins). استخدمها عند
تحديد أي مسار محلي أو Docker أو Package Acceptance أو release-check يثبت
تثبيت/تحديث Plugin أو تنظيف doctor أو تغيير ترحيل حزمة منشورة.
ترحيل التحديث المنشور الشامل من كل حزمة مستقرة `2026.4.23+` هو
سير عمل يدوي منفصل `Update Migration`، وليس جزءًا من Full Release CI.

تُحصر مرونة قبول الحزم القديمة زمنياً عن قصد. قد تستخدم الحزم حتى
`2026.4.25` مسار التوافق لفجوات البيانات الوصفية المنشورة مسبقاً
إلى npm: إدخالات مخزون QA الخاصة غير الموجودة في tarball، وغياب
`gateway install --wrapper`، وغياب ملفات التصحيح في مثبت git المشتق من tarball،
وغياب `update.channel` المحفوظ، ومواقع سجل تثبيت Plugin القديمة،
وغياب حفظ سجل تثبيت السوق، وترحيل بيانات الإعدادات الوصفية
أثناء `plugins update`. قد تُصدر الحزمة المنشورة `2026.4.26` تحذيراً
لملفات ختم بيانات البناء المحلية الوصفية التي شُحنت مسبقاً. يجب أن تستوفي الحزم اللاحقة
عقود الحزم الحديثة؛ وتفشل تلك الفجوات نفسها في تحقق الإصدار.

استخدم ملفات تعريف Package Acceptance الأوسع عندما يكون سؤال الإصدار متعلقاً
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

ملفات تعريف الحزم الشائعة:

- `smoke`: مسارات سريعة لتثبيت الحزمة/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل
  الإعدادات
- `package`: عقود التثبيت/التحديث/إعادة التشغيل/حزمة Plugin من دون ClawHub مباشر؛
  وهذا هو الإعداد الافتراضي لفحص الإصدار
- `product`: `package` بالإضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي، وبحث OpenAI على الويب،
  وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` الدقيقة لإعادات التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في Package Acceptance. يمرر سير العمل ملف tarball
المحلول `package-under-test` إلى مسار Telegram؛ وما يزال سير عمل
Telegram المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة الدخول العادية للنشر الذي يغيّر الحالة. إنه
ينسق سير عمل الناشر الموثوق به بالترتيب الذي يحتاجه الإصدار:

1. اسحب وسم الإصدار وحل SHA الخاص بالالتزام.
2. تحقق من أن الوسم قابل للوصول من `main` أو `release/*`.
3. شغّل `pnpm plugins:sync:check`.
4. أطلق `Plugin NPM Release` باستخدام `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. أطلق `Plugin ClawHub Release` بالنطاق نفسه وSHA نفسه.
6. أطلق `OpenClaw NPM Release` باستخدام وسم الإصدار، ووسم توزيع npm، و
   `preflight_run_id` المحفوظ.

مثال نشر بيتا:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

نشر مستقر إلى وسم توزيع بيتا الافتراضي:

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

استخدم سيرَي العمل منخفضَي المستوى `Plugin NPM Release` و`Plugin ClawHub Release`
فقط لأعمال الإصلاح المركزة أو إعادة النشر. لإصلاح Plugin محدد، مرّر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أطلق سير العمل الفرعي مباشرة عندما يجب ألا
تُنشر حزمة OpenClaw.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم فيها المشغل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ وعندما تكون `preflight_only=true`، يجوز أن يكون أيضاً
  SHA الالتزام الكامل الحالي ذي 40 حرفاً لفرع سير العمل للتحقق الأولي فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الفعلي
- `preflight_run_id`: مطلوب في مسار النشر الفعلي لكي يعيد سير العمل استخدام
  tarball المحضر من تشغيل التحقق الأولي الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ قيمته الافتراضية `beta`

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم فيها المشغل:

- `tag`: وسم إصدار مطلوب؛ يجب أن يكون موجوداً مسبقاً
- `preflight_run_id`: معرف تشغيل تحقق أولي ناجح لـ `OpenClaw NPM Release`؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm المستهدف لحزمة OpenClaw
- `plugin_publish_scope`: قيمته الافتراضية `all-publishable`؛ استخدم `selected` فقط
  لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: قيمته الافتراضية `true`؛ عيّنه إلى `false` فقط عند استخدام
  سير العمل كمنسق إصلاح خاص بالـ Plugin فقط

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم فيها المشغل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق منه. تتطلب الفحوصات التي تحمل أسراراً
  أن يكون الالتزام المحلول قابلاً للوصول من فرع OpenClaw أو
  وسم إصدار.
- `run_release_soak`: الاشتراك في تشغيل الاستقرار الشامل للاختبارات المباشرة/E2E، ومسار إصدار Docker، و
  جميع ناجي الترقية منذ البداية في فحوصات الإصدار المستقر/الافتراضي. يُفرض
  تشغيله عبر `release_profile=full`.

القواعد:

- يجوز للوسوم المستقرة ووسوم التصحيح النشر إلى `beta` أو `latest`
- يجوز لوسوم بيتا السابقة للإصدار النشر إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، يُسمح بإدخال SHA الالتزام الكامل فقط عندما تكون
  `preflight_only=true`
- إن `OpenClaw Release Checks` و`Full Release Validation` دائماً
  للتحقق فقط
- يجب أن يستخدم مسار النشر الفعلي `npm_dist_tag` نفسه المستخدم أثناء التحقق الأولي؛
  يتحقق سير العمل من استمرار تلك البيانات الوصفية قبل النشر

## تسلسل إصدار npm المستقر

عند إنشاء إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` باستخدام `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الكامل الحالي لفرع سير العمل
     لتشغيل تجريبي للتحقق فقط من سير عمل التحقق الأولي
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ ببيتا، أو `latest` فقط
   عندما تريد عمداً نشراً مستقراً مباشراً
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو SHA الالتزام الكامل
   عندما تريد CI العادي بالإضافة إلى تغطية ذاكرة التخزين المؤقت للمطالبات المباشرة، وDocker، وQA Lab،
   وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمداً إلى رسم الاختبار العادي الحتمي فقط، فشغّل
   سير عمل `CI` اليدوي على مرجع الإصدار بدلاً من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` باستخدام `tag` نفسه و`npm_dist_tag` نفسه،
   و`preflight_run_id` المحفوظ؛ ينشر ذلك الـ Plugins الخارجية إلى npm
   وClawHub قبل ترقية حزمة OpenClaw npm
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
8. إذا نُشر الإصدار عمداً مباشرة إلى `latest` وكان ينبغي أن يتبع `beta`
   البناء المستقر نفسه فوراً، فاستخدم سير العمل الخاص نفسه
   لتوجيه وسمَي التوزيع كليهما إلى الإصدار المستقر، أو اترك مزامنته ذاتية الإصلاح المجدولة
   تنقل `beta` لاحقاً

يقع تغيير وسم التوزيع في المستودع الخاص لأسباب أمنية لأنه ما يزال
يتطلب `NPM_TOKEN`، بينما يُبقي المستودع العام النشر معتمداً على OIDC فقط.

هذا يجعل مسار النشر المباشر ومسار الترقية الذي يبدأ ببيتا موثقين
ومرئيين للمشغلين.

إذا اضطر مشرف إلى الرجوع إلى مصادقة npm محلية، فشغّل أي أوامر 1Password
CLI (`op`) داخل جلسة tmux مخصصة فقط. لا تستدعِ `op`
مباشرة من صدفة الوكيل الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات،
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
للدليل التشغيلي الفعلي.

## ذات صلة

- [قنوات الإصدار](/ar/install/development-channels)
