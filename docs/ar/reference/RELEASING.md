---
read_when:
    - البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرة إصدارها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، ومربعات التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-05-10T19:59:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- المستقر: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- التجريبي: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- التطوير: الرأس المتحرك لفرع `main`

## تسمية الإصدارات

- إصدار الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار التصحيح المستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار ما قبل الإصدار التجريبي: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفارًا بادئة للشهر أو اليوم
- `latest` يعني إصدار npm المستقر الحالي الذي تمت ترقيته
- `beta` يعني هدف التثبيت التجريبي الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضيًا؛ ويمكن لمشغلي الإصدار استهداف `latest` صراحةً، أو ترقية بنية تجريبية جرى التحقق منها لاحقًا
- يشحن كل إصدار OpenClaw مستقر حزمة npm وتطبيق macOS معًا؛
  أما الإصدارات التجريبية فتتحقق عادةً من مسار npm/الحزمة وتنشره أولًا، مع
  حجز بناء تطبيق Mac وتوقيعه وتوثيقه للإصدارات المستقرة ما لم يُطلب ذلك صراحةً

## وتيرة الإصدارات

- تنتقل الإصدارات وفق نهج التجريبي أولًا
- لا يأتي المستقر إلا بعد التحقق من أحدث إصدار تجريبي
- ينشئ المشرفون عادةً الإصدارات من فرع `release/YYYY.M.D` مُنشأ
  من `main` الحالي، بحيث لا تعطل عملية التحقق من الإصدار وإصلاحاته التطوير
  الجديد على `main`
- إذا دُفع وسم تجريبي أو نُشر وكان يحتاج إلى إصلاح، ينشئ المشرفون
  وسم `-beta.N` التالي بدلًا من حذف الوسم التجريبي القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد dist-tag، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدارات المخصص للمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وتأكد من أن الالتزام المستهدف قد دُفع،
   وتأكد من أن CI الحالي على `main` أخضر بما يكفي لإنشاء فرع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، واجعل الإدخالات موجهة للمستخدمين، ثم التزم به، وادفعه، وأعد
   تنفيذ rebase/pull مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب حمله عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. ارفع كل موضع إصدار مطلوب للوسم المقصود، ثم شغّل
   `pnpm release:prep`. يحدّث ذلك إصدارات Plugin، ومخزون Plugin، ومخطط
   الإعدادات، وبيانات تعريف إعدادات القنوات المضمّنة، وخط أساس وثائق
   الإعدادات، وصادرات SDK الخاصة بـ Plugin، وخط أساس API الخاصة بـ SDK
   الخاصة بـ Plugin بالترتيب الصحيح. التزم بأي انجراف مولّد قبل الوسم. ثم شغّل
   التمهيد المحلي الحتمي:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل من 40 محرفًا لفرع الإصدار للتحقق التمهيدي فقط.
   احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار أو الوسم أو SHA الالتزام الكامل. هذه هي نقطة الإدخال اليدوية
   الوحيدة لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest وDocker وQA Lab
   وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر ملف أو مسار أو مهمة
   سير عمل أو ملف تعريف حزمة أو مزود أو قائمة سماح نماذج يثبت الإصلاح. أعد
   تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير الدليل السابق قديمًا.
9. بالنسبة إلى التجريبي، أضف الوسم `vYYYY.M.D-beta.N`، ثم شغّل
   `OpenClaw Release Publish` من فرع `release/YYYY.M.D` المطابق. يتحقق من
   `pnpm plugins:sync:check`، ويرسل كل حزم Plugin القابلة للنشر إلى npm
   والمجموعة نفسها إلى ClawHub بالتوازي، ثم يرقي أثر التمهيد المسبق المعد
   لـ OpenClaw npm باستخدام dist-tag المطابق فور نجاح نشر Plugin على npm.
   بعد نجاح ابن نشر OpenClaw npm، ينشئ صفحة إصدار/ما قبل إصدار GitHub
   المطابقة أو يحدّثها من قسم `CHANGELOG.md` المطابق الكامل. تصبح الإصدارات
   المستقرة المنشورة إلى npm `latest` أحدث إصدار GitHub؛ أما إصدارات الصيانة
   المستقرة المحفوظة على npm `beta` فتُنشأ مع GitHub `latest=false`.
   قد يظل نشر ClawHub قيد التشغيل أثناء نشر OpenClaw npm، لكن سير عمل نشر
   الإصدار يطبع معرفات تشغيل الأبناء فورًا. افتراضيًا، لا ينتظر ClawHub بعد
   إرساله، لذلك لا تُحجب إتاحة OpenClaw npm بسبب موافقات ClawHub أو عمل
   السجل الأبطأ؛ اضبط `wait_for_clawhub=true` عندما يجب أن يحجب ClawHub
   اكتمال سير العمل. يعيد مسار ClawHub محاولة إخفاقات تثبيت تبعيات CLI
   العابرة، وينشر إضافات اجتازت المعاينة حتى عندما تتعثر خلية معاينة واحدة،
   وينتهي بالتحقق من السجل لكل إصدار Plugin متوقع بحيث تبقى عمليات النشر
   الجزئية مرئية وقابلة لإعادة المحاولة. بعد النشر، شغّل
   قبول الحزمة بعد النشر ضد حزمة `openclaw@YYYY.M.D-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاج ما قبل إصدار مدفوع أو منشور إلى إصلاح،
   فأنشئ رقم ما قبل الإصدار المطابق التالي؛ لا تحذف ما قبل الإصدار القديم
   أو تعيد كتابته.
10. بالنسبة إلى المستقر، لا تتابع إلا بعد امتلاك الإصدار التجريبي أو مرشح
    الإصدار الذي جرى التحقق منه دليل التحقق المطلوب. يمر نشر npm المستقر
    أيضًا عبر `OpenClaw Release Publish`، مع إعادة استخدام أثر التمهيد
    المسبق الناجح عبر `preflight_run_id`؛ كما تتطلب جاهزية إصدار macOS
    المستقر وجود `.zip` و`.dmg` و`.dSYM.zip` المعبأة و`appcast.xml` المحدّث
    على `main`. ينشر سير عمل نشر macOS الخاص موجز التطبيق الموقع إلى `main`
    العام تلقائيًا بعد التحقق من أصول الإصدار؛ وإذا منعت حماية الفرع الدفع
    المباشر، فإنه يفتح طلب سحب لتحديث appcast أو يحدّثه.
11. بعد النشر، شغّل محقق npm بعد النشر، واختبار Telegram E2E الاختياري
    المستقل لحزمة npm المنشورة عندما تحتاج إلى إثبات قناة بعد النشر،
    وترقية dist-tag عند الحاجة، وتحقق من صفحة إصدار GitHub المولّدة،
    وشغّل خطوات إعلان الإصدار.

## التحقق التمهيدي للإصدار

- شغّل `pnpm check:test-types` قبل الفحص التمهيدي للإصدار حتى تبقى TypeScript الخاصة بالاختبارات
  مشمولة خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل الفحص التمهيدي للإصدار حتى تكون فحوصات دورات
  الاستيراد الأوسع وحدود المعمارية ناجحة خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون عناصر الإصدار المتوقعة
  `dist/*` وحزمة واجهة Control UI موجودة لخطوة التحقق من الحزمة
- شغّل `pnpm release:prep` بعد رفع إصدار الجذر وقبل وضع الوسم. يشغّل
  كل مولّد إصدار حتمي ينحرف عادة بعد تغيير إصدار/إعداد/API: إصدارات Plugin، ومخزون Plugin، ومخطط الإعداد الأساسي، وبيانات تعريف إعداد القناة المضمّنة، وخط أساس مستندات الإعداد، وصادرات SDK الخاصة بـ Plugin، وخط أساس API الخاص بـ SDK الخاصة بـ Plugin. يعيد `pnpm release:check` تشغيل تلك
  الحراس في وضع الفحص ويبلّغ عن كل فشل انحراف مولّد يجده في تمريرة واحدة
  قبل تشغيل فحوصات إصدار الحزمة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل اعتماد الإصدار
  لبدء كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا،
  أو وسمًا، أو SHA كاملًا للالتزام، ويشغّل `CI` يدويًا، ويشغّل
  `OpenClaw Release Checks` لفحص التثبيت السريع، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وتكافؤ QA Lab، ومسارات Matrix وTelegram. تبقي عمليات التشغيل المستقرة/الافتراضية فحوصات live/E2E الشاملة ونقع مسار إصدار Docker خلف
  `run_release_soak=true`؛ ويجبر `release_profile=full` تشغيل النقع. مع
  `release_profile=full` و`rerun_group=all`، يشغّل أيضًا Telegram E2E للحزمة
  مقابل عنصر `release-package-under-test` من فحوصات الإصدار.
  قدّم `npm_telegram_package_spec` بعد النشر عندما يجب أن يثبت Telegram E2E نفسه حزمة npm المنشورة أيضًا. قدّم
  `package_acceptance_package_spec` بعد النشر عندما يجب أن يشغّل Package Acceptance
  مصفوفة الحزمة/التحديث الخاصة به مقابل حزمة npm المشحونة بدلًا
  من العنصر المبني من SHA. قدّم
  `evidence_package_spec` عندما يجب أن يثبت تقرير الأدلة الخاص أن
  التحقق يطابق حزمة npm منشورة من دون إجبار Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد إثباتًا من قناة جانبية
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` لـ
  `openclaw@beta`، أو `openclaw@latest`، أو إصدار دقيق؛ و`source=ref`
  لحزم فرع/وسم/SHA موثوق به في `package_ref` باستخدام إطار `workflow_ref` الحالي؛ و`source=url` لأرشيف tarball عبر HTTPS مع SHA-256 مطلوب؛ أو `source=artifact` لأرشيف tarball مرفوع بواسطة تشغيل GitHub
  Actions آخر. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E مقابل ذلك
  الأرشيف، ويمكنه تشغيل QA الخاص بـ Telegram مقابل الأرشيف نفسه باستخدام
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تشمل
  مسارات Docker المحددة `published-upgrade-survivor`، يكون عنصر الحزمة
  هو المرشح وتحدد `published_upgrade_survivor_baseline` خط الأساس المنشور. يستخدم `update-restart-auth` حزمة المرشح
  بوصفها CLI المثبتة والحزمة قيد الاختبار معًا حتى يختبر
  مسار إعادة التشغيل المُدار لأمر تحديث المرشح.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات الشخصية الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/إعادة التشغيل/Plugin الأصلية للعنصر من دون OpenWebUI أو ClawHub مباشر
  - `product`: ملف package الشخصي إضافة إلى قنوات MCP، وتنظيف cron/subagent،
    وبحث الويب من OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` دقيق لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI عادية كاملة
  لمرشح الإصدار. تتجاوز عمليات تشغيل CI اليدوية النطاق المتغير
  وتجبر شرائح Linux Node، وشرائح Plugin المضمّنة، وعقود القنوات،
  وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء السريع،
  وفحوصات المستندات، وPython Skills، وWindows، وmacOS، وAndroid، ومسارات i18n الخاصة بـ Control UI.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. يمرّن
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء مقاطع التتبع
  المصدّرة، والسمات المحدودة، وتنقيح المحتوى/المعرّفات من دون
  الحاجة إلى Opik أو Langfuse أو مجمّع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المُغيِّر بعد وجود
  الوسم. شغّله من `release/YYYY.M.D` (أو `main` عند نشر وسم
  يمكن الوصول إليه من main)، ومرر وسم الإصدار و`preflight_run_id` الناجح لـ npm الخاص بـ OpenClaw،
  وأبق نطاق نشر Plugin الافتراضي
  `all-publishable` إلا إذا كنت تشغّل إصلاحًا مركزًا عمدًا. ينسّق
  سير العمل نشر npm الخاص بـ Plugin، ونشر ClawHub الخاص بـ Plugin، ونشر npm الخاص بـ OpenClaw
  حتى لا تُنشر الحزمة الأساسية قبل Plugins الخارجية الخاصة بها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ QA Lab الوهمي إضافة إلى ملف Matrix المباشر السريع ومسار QA الخاص بـ Telegram قبل اعتماد الإصدار. تستخدم المسارات المباشرة بيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا إيجارات بيانات اعتماد Convex CI. شغّل سير العمل اليدوي `QA-Lab - All Lanes` مع
  `matrix_profile=all` و`matrix_shards=true` عندما تريد مخزون نقل Matrix
  والوسائط وE2EE الكامل بالتوازي.
- تحقق وقت التشغيل للتثبيت والترقية عبر أنظمة التشغيل هو جزء من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، اللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا التقسيم مقصود: إبقاء مسار إصدار npm الحقيقي قصيرًا،
  وحتميًا، ومركّزًا على العناصر، بينما تبقى الفحوصات المباشرة الأبطأ في مسارها
  الخاص حتى لا تؤخر النشر أو تحظره
- يجب تشغيل فحوصات الإصدار الحاملة للأسرار عبر `Full Release
Validation` أو من مرجع سير عمل `main`/release حتى تبقى منطق سير العمل
  والأسرار مضبوطة
- يقبل `OpenClaw Release Checks` فرعًا أو وسمًا أو SHA كاملًا للالتزام ما دام
  الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار
- يقبل الفحص التمهيدي للتحقق فقط في `OpenClaw NPM Release` أيضًا SHA الكامل الحالي
  ذي 40 محرفًا لالتزام فرع سير العمل من دون طلب وسم مدفوع
- مسار SHA هذا للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط من أجل
  فحص بيانات تعريف الحزمة؛ وما يزال النشر الحقيقي يتطلب وسم إصدار حقيقي
- يبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات GitHub المستضافة،
  بينما يمكن لمسار التحقق غير المُغيِّر استخدام مشغلات
  Blacksmith Linux الأكبر
- يشغّل ذلك سير العمل
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد الفحص التمهيدي لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/correction المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/correction المطابق) للتحقق من مسار تثبيت السجل المنشور
  في بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من إلحاق الحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي
  مقابل حزمة npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المؤجرة المشتركة.
  يمكن لعمليات الصيانة المحلية الفردية حذف متغيرات Convex وتمرير بيانات اعتماد البيئة الثلاث
  `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- لتشغيل فحص beta السريع الكامل بعد النشر من جهاز مشرف، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق تحديث/fresh-target من npm عبر Parallels، ويشغّل `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل الدقيق، وينزّل العنصر، ويطبع تقرير Telegram.
- يمكن للمشرفين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر
  سير العمل اليدوي `NPM Telegram Beta E2E`. وهو يدوي فقط عمدًا ولا
  يعمل عند كل دمج.
- تستخدم أتمتة إصدار المشرفين الآن نمط الفحص التمهيدي ثم الترقية:
  - يجب أن ينجح نشر npm الحقيقي في `preflight_run_id` ناجح لـ npm
  - يجب تشغيل نشر npm الحقيقي من فرع `main` أو
    `release/YYYY.M.D` نفسه مثل تشغيل الفحص التمهيدي الناجح
  - إصدارات npm المستقرة تضبط افتراضيًا إلى `beta`
  - يمكن لنشر npm المستقر استهداف `latest` صراحة عبر إدخال سير العمل
  - أصبحت عملية تغيير npm dist-tag المعتمدة على الرمز المميز موجودة الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` ما يزال يحتاج إلى `NPM_TOKEN` بينما
    يبقي المستودع العام النشر بنمط OIDC فقط
  - `macOS Release` العام للتحقق فقط؛ عندما يكون الوسم موجودًا فقط على
    فرع إصدار لكن سير العمل مشغّلًا من `main`، اضبط
    `public_release_branch=release/YYYY.M.D`
  - يجب أن ينجح نشر mac الخاص الحقيقي في `preflight_run_id` و`validate_run_id` خاصين ناجحين لـ mac
  - تروّج مسارات النشر الحقيقية العناصر المحضّرة بدلًا من إعادة بنائها
    مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد النشر
  أيضًا من مسار الترقية نفسه ذي البادئة المؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تتمكن تصحيحات الإصدار من ترك التثبيتات العالمية الأقدم بصمت على
  حمولة المستقر الأساسية
- يفشل الفحص التمهيدي لإصدار npm بشكل مغلق ما لم يتضمن أرشيف tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة معلومات متصفح فارغة مرة أخرى
- يتحقق التحقق بعد النشر أيضًا من وجود نقاط دخول Plugin المنشورة
  وبيانات تعريف الحزمة في تخطيط السجل المثبت. أي إصدار
  يشحن حمولات وقت تشغيل Plugin مفقودة يفشل في مدقق ما بعد النشر ولا
  يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` الخاصة بـ npm pack على
  أرشيف تحديث المرشح، حتى يلتقط installer e2e تضخم الحزمة العرضي
  قبل مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت Plugin، أو
  مصفوفات اختبار Plugin، فأعد توليد ومراجعة مخرجات مصفوفة
  `plugin-prerelease-extension-shard` المملوكة للمخطط من
  `.github/workflows/plugin-prerelease.yml` قبل الاعتماد حتى لا
  تصف ملاحظات الإصدار تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح المحدّث:
  - يجب أن ينتهي إصدار GitHub باحتواء `.zip` و`.dmg` و`.dSYM.zip` المعبأة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر؛
    يلتزم سير عمل نشر macOS الخاص به تلقائيًا، أو يفتح PR لـ appcast
    عندما يكون الدفع المباشر محظورًا
  - يجب أن يحافظ التطبيق المعبأ على معرّف حزمة غير خاص بالتصحيح، وعنوان URL غير فارغ لتغذية Sparkle،
    و`CFBundleVersion` عند أو فوق حد بناء Sparkle القانوني
    لإصدار ذلك الإصدار

## صناديق اختبار الإصدار

`Full Release Validation` هي الطريقة التي يشغّل بها المشغلون كل اختبارات ما قبل الإصدار من
نقطة دخول واحدة. للحصول على إثبات التزام مثبت على فرع سريع الحركة، استخدم
المساعد حتى يعمل كل سير عمل فرعي من فرع مؤقت مثبت عند SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ثم يشغّل `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن كل `headSha` لتدفق عمل فرعي
يطابق الهدف، ثم يحذف الفرع المؤقت. هذا يتجنب إثبات تشغيل فرعي من `main`
أحدث عن طريق الخطأ.

للتحقق من فرع إصدار أو وسم إصدار، شغّله من مرجع تدفق العمل الموثوق `main`
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

يحل تدفق العمل مرجع الهدف، ويشغّل `CI` اليدوي مع
`target_ref=<release-ref>`، ويشغّل `OpenClaw Release Checks`، ويحضّر
أثرًا أبويًا `release-package-under-test` للفحوصات المواجهة للحزمة، ويشغّل
Telegram E2E للحزمة المستقلة عند `release_profile=full` مع
`rerun_group=all` أو عند ضبط `npm_telegram_package_spec`. بعد ذلك يوزّع
`OpenClaw Release Checks` العمل على فحص تثبيت سريع، وفحوصات إصدار عبر أنظمة
تشغيل متعددة، وتغطية مباشرة/E2E Docker لمسار الإصدار عند تفعيل الاختبار
المطوّل، وPackage Acceptance مع QA لحزمة Telegram، وتكافؤ QA Lab، وMatrix
المباشر، وTelegram المباشر. لا يكون التشغيل الكامل مقبولًا إلا عندما يعرض
ملخص `Full Release Validation` أن `normal_ci` و`release_checks` ناجحان. في
وضع full/all، يجب أن يكون الطفل `npm_telegram` ناجحًا أيضًا؛ وخارج full/all
يُتخطى ما لم تُقدَّم قيمة `npm_telegram_package_spec` منشورة. يتضمن ملخص
المحقق النهائي جداول أبطأ المهام لكل تشغيل فرعي، حتى يتمكن مدير الإصدار من
رؤية المسار الحرج الحالي دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع
على مصفوفة المراحل الكاملة، وأسماء مهام تدفق العمل الدقيقة، والاختلافات بين
ملفي stable وfull، والآثار، ومقابض إعادة التشغيل المركزة.
تُشغَّل تدفقات العمل الفرعية من المرجع الموثوق الذي يشغّل
`Full Release Validation`، وهو عادة `--ref main`، حتى عندما يشير `ref` الهدف
إلى فرع إصدار أو وسم أقدم. لا يوجد إدخال منفصل لمرجع تدفق عمل Full Release
Validation؛ اختر إطار التشغيل الموثوق باختيار مرجع تشغيل تدفق العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات التزام دقيق على `main` المتحرك؛
لا يمكن أن تكون قيم SHA الخام للالتزامات مراجع لتشغيل تدفق العمل، لذا استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبت.

استخدم `release_profile` لاختيار نطاق التشغيل المباشر/المزوّد:

- `minimum`: أسرع مسار مباشر ومسار Docker حرجين للإصدار لـ OpenAI/core
- `stable`: الحد الأدنى إضافة إلى تغطية المزوّد/الخلفية المستقرة لاعتماد الإصدار
- `full`: stable إضافة إلى تغطية واسعة للمزوّدين/الوسائط الاستشارية

استخدم `run_release_soak=true` مع `stable` عندما تكون المسارات المانعة للإصدار
خضراء وتريد المسح الشامل المباشر/E2E، ومسار إصدار Docker، ومسح ترقية البقاء
للإصدارات المنشورة ضمن حدود قبل الترقية. يغطي ذلك المسح أحدث أربع حزم مستقرة
إضافة إلى خطوط الأساس المثبتة `2026.4.23` و`2026.5.2` وتغطية `2026.4.15`
الأقدم، مع إزالة خطوط الأساس المكررة وتقسيم كل خط أساس إلى مهمة Docker runner
خاصة به. يتضمن `full` ضمنيًا `run_release_soak=true`.

يستخدم `OpenClaw Release Checks` مرجع تدفق العمل الموثوق لحل مرجع الهدف مرة
واحدة كـ `release-package-under-test` ويعيد استخدام ذلك الأثر في فحوصات
أنظمة التشغيل المتعددة وPackage Acceptance وفحوصات Docker لمسار الإصدار عند
تشغيل الاختبار المطوّل. هذا يبقي كل الصناديق المواجهة للحزمة على نفس البايتات
ويتجنب بناء الحزمة مرارًا. يستخدم فحص تثبيت OpenAI عبر أنظمة تشغيل متعددة
`OPENCLAW_CROSS_OS_OPENAI_MODEL` عند ضبط متغير المستودع/المؤسسة، وإلا يستخدم
`openai/gpt-5.4`، لأن هذا المسار يثبت تثبيت الحزمة، والإعداد الأولي، وبدء
Gateway، ودورة وكيل مباشرة واحدة، وليس قياس أداء أبطأ نموذج افتراضي. تبقى
مصفوفة المزوّدين المباشرة الأوسع هي المكان المناسب للتغطية الخاصة بالنماذج.

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
فاستخدم تدفق العمل الفرعي الفاشل، أو المهمة، أو مسار Docker، أو ملف الحزمة، أو
مزوّد النموذج، أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة أخرى فقط
عندما يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل أدلة جميع الصناديق السابقة
قديمة. يعيد المحقق النهائي للمظلة فحص معرفات تشغيل تدفقات العمل الفرعية
المسجلة، لذا بعد إعادة تشغيل تدفق عمل فرعي بنجاح، أعد تشغيل مهمة الأب
`Verify full validation` الفاشلة فقط.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل مرشح الإصدار
الحقيقي، و`ci` يشغّل الطفل CI العادي فقط، و`plugin-prerelease` يشغّل الطفل
Plugin الخاص بالإصدار فقط، و`release-checks` يشغّل كل صندوق إصدار، ومجموعات
الإصدار الأضيق هي `install-smoke` و`cross-os` و`live-e2e` و`package` و`qa`
و`qa-parity` و`qa-live` و`npm-telegram`. تتطلب إعادة تشغيل `npm-telegram`
المركزة `npm_telegram_package_spec`؛ أما تشغيلات full/all مع
`release_profile=full` فتستخدم أثر حزمة release-checks. يمكن لإعادة تشغيل
cross-OS المركزة إضافة `cross_os_suite_filter=windows/packaged-upgrade` أو
مرشح آخر لنظام التشغيل/المجموعة. فشل فحوصات إصدار QA استشاري؛ فشل QA فقط لا
يحظر التحقق من الإصدار.

### Vitest

صندوق Vitest هو تدفق العمل الفرعي اليدوي `CI`. يتجاوز CI اليدوي عمدًا تحديد
النطاق حسب التغييرات ويفرض مخطط الاختبارات العادي لمرشح الإصدار: شظايا Linux
Node، وشظايا Plugins المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`،
و`check-additional`، وفحص البناء السريع، وفحوصات الوثائق، وSkills في Python،
وWindows، وmacOS، وAndroid، وControl UI i18n.

استخدم هذا الصندوق للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية
الكاملة؟" إنه ليس مثل التحقق من المنتج عبر مسار الإصدار. الأدلة التي يجب
الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض عنوان URL لتشغيل `CI` المشغّل
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الشظايا الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- آثار توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما يحتاج
  التشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي، وليس إلى
صناديق Docker أو QA Lab أو المباشر أو أنظمة التشغيل المتعددة أو الحزم:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker في `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، إضافة إلى تدفق عمل وضع الإصدار
`install-smoke`. يتحقق من مرشح الإصدار عبر بيئات Docker المعبأة بدلًا من
الاختبارات على مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- فحص تثبيت سريع كامل مع تفعيل فحص تثبيت Bun العام البطيء
- إعداد/إعادة استخدام صورة فحص Dockerfile الجذرية حسب SHA الهدف، مع تشغيل
  مهام QR وroot/gateway وفحص installer/Bun كشظايا install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`،
  و`plugins-runtime-plugins`، و`plugins-runtime-services`،
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إزالة تثبيت Plugin المضمّنة المنقسمة
  `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات المزوّدين المباشرة/E2E وتغطية نماذج Docker المباشرة عندما تتضمن
  فحوصات الإصدار مجموعات مباشرة

استخدم آثار Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`،
و`failures.json`، وتوقيتات المراحل، وJSON لخطة المجدول، وأوامر إعادة التشغيل.
للاسترداد المركّز، استخدم `docker_lanes=<lane[,lane]>` على تدفق العمل القابل
لإعادة الاستخدام للمباشر/E2E بدلًا من إعادة تشغيل كل أجزاء الإصدار. تتضمن
أوامر إعادة التشغيل المولدة `package_artifact_run_id` السابق ومدخلات صورة
Docker المحضّرة عند توفرها، بحيث يمكن للمسار الفاشل إعادة استخدام نفس tarball
وصور GHCR.

### QA Lab

صندوق QA Lab هو أيضًا جزء من `OpenClaw Release Checks`. إنه بوابة إصدار
السلوك الوكيلي ومستوى القنوات، منفصلًا عن Vitest وآليات حزمة Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ وهمي يقارن مسار مرشح OpenAI بخط أساس Opus 4.6 باستخدام حزمة
  التكافؤ الوكيلية
- ملف QA سريع مباشر لـ Matrix باستخدام بيئة `qa-live-shared`
- مسار QA مباشر لـ Telegram باستخدام إيجارات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج قياس الإصدار عن بُعد إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات المباشرة؟" احتفظ بعناوين URL للآثار الخاصة بمسارات التكافؤ
وMatrix وTelegram عند اعتماد الإصدار. تبقى تغطية Matrix الكاملة متاحة كتشغيل
QA-Lab يدوي مقسّم، لا كمسار حرج افتراضي للإصدار.

### الحزمة

صندوق الحزمة هو بوابة المنتج القابل للتثبيت. تدعمه `Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبع المحلل المرشح إلى
tarball `package-under-test` الذي يستهلكه Docker E2E، ويتحقق من مخزون الحزمة،
ويسجل إصدار الحزمة وSHA-256، ويبقي مرجع إطار تدفق العمل منفصلًا عن مرجع مصدر
الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: ‏`openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيق
- `source=ref`: حزم فرع `package_ref` موثوقًا، أو وسمًا، أو SHA التزام كاملًا
  مع إطار `workflow_ref` المحدد
- `source=url`: تنزيل `.tgz` عبر HTTPS مع `package_sha256` المطلوب
- `source=artifact`: إعادة استخدام `.tgz` مرفوع بواسطة تشغيل GitHub Actions آخر

يشغّل `OpenClaw Release Checks` ‏Package Acceptance مع `source=artifact`، وأثر
حزمة الإصدار المحضّر، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`،
و`telegram_mode=mock-openai`. يبقي Package Acceptance الترحيل، والتحديث، وإعادة
تشغيل تحديث المصادقة المهيأة، وتثبيت Skill مباشرة من ClawHub، وتنظيف تبعيات
Plugin القديمة، وتجهيزات Plugin بلا اتصال، وتحديث Plugin، وQA لحزمة Telegram
ضد نفس tarball المحلول. تستخدم فحوصات الإصدار الحاجزة خط أساس أحدث حزمة منشورة
افتراضيًا؛ ويوسّع `run_release_soak=true` أو `release_profile=full` ذلك إلى كل
خط أساس مستقر منشور على npm من `2026.4.23` حتى `latest` إضافة إلى تجهيزات
المشكلات المبلّغ عنها. استخدم Package Acceptance مع `source=npm` لمرشح شُحن
بالفعل، أو `source=ref`/`source=artifact` لـ tarball npm محلي مدعوم بـ SHA قبل
النشر. إنه البديل الأصلي في GitHub لمعظم تغطية الحزمة/التحديث التي كانت تتطلب
Parallels سابقًا. لا تزال فحوصات الإصدار عبر أنظمة تشغيل متعددة مهمة للإعداد
الأولي الخاص بنظام التشغيل، والمثبّت، وسلوك المنصة، لكن تحقق المنتج الخاص
بالحزمة/التحديث ينبغي أن يفضل Package Acceptance.

قائمة التحقق المعيارية للتحقق من التحديثات وPlugin هي
[اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins). استخدمها عند
تحديد مسار التحقق المحلي أو Docker أو Package Acceptance أو release-check الذي يثبت
تثبيت/تحديث Plugin أو تنظيف doctor أو تغيير ترحيل حزمة منشورة.
إن ترحيل التحديث المنشور الشامل من كل حزمة مستقرة `2026.4.23+` هو
سير عمل يدوي منفصل باسم `Update Migration`، وليس جزءا من Full Release CI.

تساهل قبول الحزم القديمة محدود زمنيا عمدا. قد تستخدم الحزم حتى
`2026.4.25` مسار التوافق لفجوات بيانات التعريف المنشورة مسبقا
إلى npm: إدخالات مخزون QA الخاصة المفقودة من tarball، وغياب
`gateway install --wrapper`، وغياب ملفات التصحيح في fixture git
المشتق من tarball، وغياب `update.channel` المحفوظ، ومواقع سجلات
تثبيت Plugin القديمة، وغياب حفظ سجل تثبيت marketplace، وترحيل بيانات تعريف
الإعدادات أثناء `plugins update`. قد تحذر حزمة `2026.4.26` المنشورة
من ملفات ختم بيانات تعريف البناء المحلي التي شحنت مسبقا. يجب أن تستوفي الحزم
اللاحقة عقود الحزم الحديثة؛ وتفشل تلك الفجوات نفسها تحقق الإصدار.

استخدم ملفات تعريف Package Acceptance الأوسع عندما يكون سؤال الإصدار عن
حزمة قابلة للتثبيت فعليا:

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

- `smoke`: مسارات تثبيت الحزمة/القناة/الوكيل السريعة، وشبكة Gateway، وإعادة
  تحميل الإعدادات
- `package`: عقود تثبيت/تحديث/إعادة تشغيل/حزمة Plugin مع إثبات تثبيت Skill مباشر من ClawHub؛ هذا هو الافتراضي لفحص الإصدار
- `product`: `package` مع قنوات MCP، وتنظيف cron/subagent، وبحث OpenAI على الويب، وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لإعادات التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في Package Acceptance. يمرر سير العمل ملف
tarball المحلول `package-under-test` إلى مسار Telegram؛ ولا يزال سير عمل
Telegram المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة الدخول العادية للنشر المعدل. إنه
ينسق سير عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. جلب وسم الإصدار وحل SHA الخاص بالالتزام.
2. التحقق من إمكانية الوصول إلى الوسم من `main` أو `release/*`.
3. تشغيل `pnpm plugins:sync:check`.
4. إرسال `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. إرسال `Plugin ClawHub Release` بالنطاق وSHA نفسيهما.
6. إرسال `OpenClaw NPM Release` مع وسم الإصدار، ووسم توزيع npm، و
   `preflight_run_id` المحفوظ.

مثال نشر beta:

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

استخدم سيري العمل الأدنى مستوى `Plugin NPM Release` و`Plugin ClawHub Release`
فقط لأعمال الإصلاح أو إعادة النشر المركزة. لإصلاح Plugin محدد، مرر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أرسل سير العمل الفرعي مباشرة عندما يجب ألا
تنشر حزمة OpenClaw.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ عندما يكون `preflight_only=true`، يمكن أن يكون أيضا
  SHA التزام فرع سير العمل الحالي الكامل المكون من 40 حرفا للتحقق التمهيدي فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار
  النشر الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي كي يعيد سير العمل استخدام
  tarball المجهز من تشغيل التحقق التمهيدي الناجح
- `npm_dist_tag`: وسم npm الهدف لمسار النشر؛ الافتراضي هو `beta`

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم الإصدار المطلوب؛ يجب أن يكون موجودا مسبقا
- `preflight_run_id`: معرف تشغيل التحقق التمهيدي الناجح لـ`OpenClaw NPM Release`؛
  مطلوب عندما يكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm الهدف لحزمة OpenClaw
- `plugin_publish_scope`: الافتراضي هو `all-publishable`؛ استخدم `selected` فقط
  لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما يكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: الافتراضي هو `true`؛ اضبطه على `false` فقط عند استخدام
  سير العمل كمنسق إصلاح خاص بـPlugin فقط

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق. تتطلب الفحوصات الحاملة للأسرار
  أن يكون الالتزام المحلول قابلا للوصول من فرع OpenClaw أو وسم إصدار.
- `run_release_soak`: الاشتراك في فحص التحمل الشامل للتشغيل المباشر/E2E، ومسار إصدار Docker،
  وكل upgrade-survivor منذ البداية في فحوصات الإصدار المستقر/الافتراضي. يتم فرضه
  بواسطة `release_profile=full`.

القواعد:

- يمكن للوسوم المستقرة ووسوم التصحيح النشر إلى `beta` أو `latest`
- يمكن لوسوم الإصدارات التمهيدية beta النشر إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، يسمح بإدخال SHA الالتزام الكامل فقط عندما
  يكون `preflight_only=true`
- يكون `OpenClaw Release Checks` و`Full Release Validation` دائما
  للتحقق فقط
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء التحقق التمهيدي؛
  يتحقق سير العمل من استمرار بيانات التعريف تلك قبل النشر

## تسلسل إصدار npm المستقر

عند إعداد إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA التزام فرع سير العمل الحالي الكامل
     لتشغيل تجريبي جاف للتحقق فقط من سير عمل التحقق التمهيدي
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ بـbeta، أو `latest` فقط
   عندما تريد عمدا نشرا مستقرا مباشرا
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو SHA
   الالتزام الكامل عندما تريد CI العادي مع تغطية cache المطالبات المباشرة، وDocker، وQA Lab،
   وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدا إلى الرسم البياني العادي الحتمي للاختبارات فقط، فشغّل
   سير عمل `CI` اليدوي على مرجع الإصدار بدلا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` باستخدام `tag` نفسه، و`npm_dist_tag` نفسه،
   و`preflight_run_id` المحفوظ؛ ينشر Plugins الخارجية إلى npm
   وClawHub قبل ترقية حزمة OpenClaw على npm
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية تلك النسخة المستقرة من `beta` إلى `latest`
8. إذا نشر الإصدار عمدا مباشرة إلى `latest` ويجب أن يتبع `beta`
   البناء المستقر نفسه فورا، فاستخدم سير العمل الخاص نفسه
   لتوجيه وسمي التوزيع كليهما إلى النسخة المستقرة، أو اترك مزامنة
   الإصلاح الذاتي المجدولة تنقل `beta` لاحقا

توجد عملية تعديل وسم التوزيع في المستودع الخاص لأسباب أمنية لأنها لا تزال
تتطلب `NPM_TOKEN`، بينما يحافظ المستودع العام على نشر OIDC فقط.

هذا يبقي مسار النشر المباشر ومسار الترقية الذي يبدأ بـbeta موثقين ومرئيين
للمشغل.

إذا اضطر المشرف إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر 1Password
CLI (`op`) داخل جلسة tmux مخصصة فقط. لا تستدع `op`
مباشرة من صدفة الوكيل الرئيسية؛ إبقاؤه داخل tmux يجعل المطالبات،
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

يستخدم المشرفون مستندات الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
لدليل التشغيل الفعلي.

## ذات صلة

- [قنوات الإصدار](/ar/install/development-channels)
