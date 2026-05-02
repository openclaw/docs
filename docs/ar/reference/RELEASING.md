---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرتها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، وصناديق التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-05-02T07:42:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce52c9144de3c8b914954db64f6ca5b2196edbbdcc7385984235a39c208bb59e
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- المستقر: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- التجريبي: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- التطوير: الرأس المتحرك لـ `main`

## تسمية الإصدارات

- إصدار الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار التصحيح المستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار تجريبي لما قبل الإصدار: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تُضِف صفرًا بادئًا إلى الشهر أو اليوم
- يعني `latest` إصدار npm المستقر والمروَّج حاليًا
- يعني `beta` هدف تثبيت النسخة التجريبية الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضيًا؛ ويمكن لمشغّلي الإصدار استهداف `latest` صراحةً، أو ترقية بناء تجريبي جرى التحقق منه لاحقًا
- يشحن كل إصدار مستقر من OpenClaw حزمة npm وتطبيق macOS معًا؛
  تتحقق الإصدارات التجريبية عادةً من مسار npm/الحزمة وتنشره أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق mac لما هو مستقر ما لم يُطلب ذلك صراحةً

## وتيرة الإصدار

- تتحرك الإصدارات وفق نهج النسخة التجريبية أولًا
- لا يأتي الإصدار المستقر إلا بعد التحقق من أحدث نسخة تجريبية
- ينشئ المشرفون عادةً الإصدارات من فرع `release/YYYY.M.D` مُنشأ
  من `main` الحالي، حتى لا تمنع عمليات تحقق الإصدار وإصلاحاته
  التطوير الجديد على `main`
- إذا دُفع وسم تجريبي أو نُشر واحتاج إلى إصلاح، ينشئ المشرفون
  وسم `-beta.N` التالي بدلًا من حذف وسم النسخة التجريبية القديم أو إعادة إنشائه
- تظل إجراءات الإصدار التفصيلية والموافقات وبيانات الاعتماد وملاحظات الاسترداد
  خاصة بالمشرفين فقط

## قائمة تحقق مشغّل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد dist-tag، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار الخاص بالمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وأكّد أن الالتزام الهدف قد دُفع،
   وأكّد أن CI الحالي لـ `main` أخضر بما يكفي لإنشاء فرع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، وأبقِ الإدخالات موجهة للمستخدمين، ثم التزم به، وادفعه، ونفّذ rebase/سحب
   مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل
   التوافق المنتهي فقط عندما يظل مسار الترقية مغطى، أو سجّل سبب
   الاحتفاظ به عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفّذ عمل الإصدار العادي
   مباشرةً على `main`.
5. ارفع كل موقع إصدار مطلوب للوسم المقصود، ثم شغّل
   `pnpm plugins:sync` حتى تشترك حزم Plugin القابلة للنشر في إصدار
   الإصدار وبيانات تعريف التوافق، ثم شغّل التحقق المحلي التمهيدي الحتمي:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل بطول 40 حرفًا من فرع الإصدار للتحقق التمهيدي فقط.
   احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار أو الوسم أو SHA الالتزام الكامل. هذه هي نقطة الإدخال اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest، وDocker، وQA Lab، وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر
   ملف أو مسار أو مهمة workflow أو ملف تعريف حزمة أو موفّر أو قائمة سماح نماذج فاشلة
   تثبت الإصلاح. أعد تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير
   الأدلة السابقة قديمة.
9. بالنسبة للنسخة التجريبية، ضع الوسم `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   وينشر أولًا كل حزم Plugin القابلة للنشر إلى npm، ثم ينشر المجموعة نفسها
   إلى ClawHub ثانيًا، ثم يروّج أثر التحقق التمهيدي الجاهز لـ OpenClaw npm
   باستخدام dist-tag `beta`. بعد النشر، شغّل قبول الحزمة بعد النشر
   مقابل حزمة `openclaw@YYYY.M.D-beta.N` أو `openclaw@beta` المنشورة.
   إذا احتاجت نسخة تجريبية مدفوعة أو منشورة إلى إصلاح، فأنشئ `-beta.N` التالي؛
   لا تحذف النسخة التجريبية القديمة ولا تعِد كتابتها.
10. بالنسبة للإصدار المستقر، لا تتابع إلا بعد أن يمتلك الإصدار التجريبي أو مرشح الإصدار المتحقق منه
    أدلة التحقق المطلوبة. يمر نشر npm المستقر أيضًا عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أثر التحقق التمهيدي الناجح عبر
    `preflight_run_id`؛ كما تتطلب جاهزية إصدار macOS المستقر
    وجود ملفات `.zip` و`.dmg` و`.dSYM.zip` المعبأة، و`appcast.xml` المحدّث على `main`.
11. بعد النشر، شغّل مدقق npm بعد النشر، واختبار Telegram E2E الاختياري المستقل
    لـ published-npm عندما تحتاج إلى إثبات قناة بعد النشر،
    وترقية dist-tag عند الحاجة، وملاحظات إصدار/ما قبل إصدار GitHub من
    قسم `CHANGELOG.md` الكامل المطابق، وخطوات إعلان الإصدار.

## التحقق التمهيدي للإصدار

- شغّل `pnpm check:test-types` قبل الفحص التمهيدي للإصدار حتى يبقى TypeScript الخاص بالاختبارات
  مغطى خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل الفحص التمهيدي للإصدار حتى تكون فحوصات دورات الاستيراد
  الأوسع وحدود البنية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون عناصر الإصدار
  المتوقعة `dist/*` وحزمة Control UI موجودة لخطوة التحقق من الحزمة
- شغّل `pnpm plugins:sync` بعد زيادة إصدار الجذر وقبل وضع الوسم. فهو
  يحدّث إصدارات حزم Plugin القابلة للنشر، وبيانات توافق نظير/API الخاصة بـ OpenClaw،
  وبيانات البناء، وقوالب سجل تغييرات Plugin لتطابق إصدار
  النواة. يُعد `pnpm plugins:sync:check` حارس الإصدار غير المُعدِّل؛
  ويفشل سير عمل النشر قبل أي تعديل في السجل إذا نُسيت هذه الخطوة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل اعتماد الإصدار
  لتشغيل كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعا
  أو وسما أو SHA كاملا للالتزام، ويطلق `CI` اليدوي، ويطلق
  `OpenClaw Release Checks` لفحص التثبيت السريع، وقبول الحزمة، ومجموعات مسار إصدار Docker،
  والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. مع
  `release_profile=full` و`rerun_group=all`، يشغّل أيضا
  Telegram E2E للحزمة مقابل عنصر `release-package-under-test` الناتج من فحوصات
  الإصدار. وفّر `npm_telegram_package_spec` بعد النشر عندما يجب أن يثبت
  Telegram E2E نفسه حزمة npm المنشورة أيضا. وفّر
  `evidence_package_spec` عندما يجب أن يثبت تقرير الأدلة الخاص أن
  التحقق يطابق حزمة npm منشورة من دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد دليلا من قناة جانبية
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` من أجل
  `openclaw@beta` أو `openclaw@latest` أو إصدار إصدار محدد؛ و`source=ref`
  لحزم فرع/وسم/SHA موثوق به في `package_ref` باستخدام أداة الاختبار الحالية في
  `workflow_ref`؛ و`source=url` لأرشيف HTTPS tarball مع
  SHA-256 مطلوب؛ أو `source=artifact` لأرشيف tarball مرفوع بواسطة تشغيل GitHub
  Actions آخر. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E مقابل ذلك
  الأرشيف، ويمكنه تشغيل ضمان جودة Telegram مقابل الأرشيف نفسه باستخدام
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن
  مسارات Docker المحددة `published-upgrade-survivor`، يكون عنصر الحزمة
  هو المرشح ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات الشخصية الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعداد
  - `package`: مسارات الحزمة/التحديث/Plugin الأصلية للعنصر من دون OpenWebUI أو ClawHub حي
  - `product`: ملف الحزمة الشخصي بالإضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي،
    وبحث OpenAI على الويب، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` المحدد لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI العادية الكاملة
  لمرشح الإصدار. تتجاوز عمليات تشغيل CI اليدوية نطاق التغييرات
  وتفرض أجزاء Linux Node، وأجزاء Plugin المضمنة، وعقود القنوات،
  وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء السريع،
  وفحوصات المستندات، وPython skills، وWindows، وmacOS، وAndroid، ومسارات Control UI i18n.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. فهو يمارس
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء span للتتبع
  المصدّرة، والسمات المحدودة، وتنقيح المحتوى/المعرّفات من دون
  الحاجة إلى Opik أو Langfuse أو جامع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المُعدِّل بعد وجود
  الوسم. أطلقه من `release/YYYY.M.D` (أو من `main` عند نشر وسم
  يمكن الوصول إليه من main)، ومرر وسم الإصدار و`preflight_run_id` الناجح الخاص بـ OpenClaw npm،
  وأبقِ نطاق نشر Plugin الافتراضي
  `all-publishable` إلا إذا كنت تشغّل إصلاحا مركزا عن قصد. يسلسل
  سير العمل نشر Plugin إلى npm، ونشر Plugin إلى ClawHub، ونشر OpenClaw
  إلى npm حتى لا تُنشر حزمة النواة قبل Plugins الخارجية الخاصة بها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضا بوابة تكافؤ QA Lab الوهمية بالإضافة إلى ملف
  Matrix الحي السريع ومسار ضمان جودة Telegram قبل اعتماد الإصدار. تستخدم
  المسارات الحية بيئة `qa-live-shared`؛ ويستخدم Telegram أيضا عقود تأجير
  بيانات اعتماد Convex CI. شغّل سير العمل اليدوي `QA-Lab - All Lanes` مع
  `matrix_profile=all` و`matrix_shards=true` عندما تريد مخزون Matrix كاملا
  للنقل والوسائط وE2EE بالتوازي.
- يُعد التحقق من وقت تشغيل التثبيت والترقية عبر أنظمة التشغيل جزءا من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، اللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا التقسيم مقصود: أبقِ مسار إصدار npm الحقيقي قصيرا،
  وحتميا، ومركزا على العناصر، بينما تبقى الفحوصات الحية الأبطأ في
  مسارها الخاص حتى لا تؤخر النشر أو تحظره
- يجب إطلاق فحوصات الإصدار الحاملة للأسرار عبر `Full Release
Validation` أو من مرجع سير عمل `main`/الإصدار حتى تبقى منطق سير العمل
  والأسرار مضبوطة
- يقبل `OpenClaw Release Checks` فرعا أو وسما أو SHA كاملا للالتزام ما دام
  الالتزام المحلول قابلا للوصول من فرع OpenClaw أو وسم إصدار
- يقبل الفحص التمهيدي للتحقق فقط في `OpenClaw NPM Release` أيضا
  SHA الكامل الحالي المؤلف من 40 محرفا لالتزام فرع سير العمل من دون الحاجة إلى وسم مدفوع
- مسار SHA هذا مخصص للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط لأجل
  فحص بيانات تعريف الحزمة؛ لا يزال النشر الحقيقي يتطلب وسم إصدار حقيقيا
- يُبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات GitHub المستضافة،
  بينما يمكن لمسار التحقق غير المُعدِّل استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل ذلك سير العمل
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد الفحص التمهيدي لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم البيتا/التصحيح المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار البيتا/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور
  في بادئة مؤقتة جديدة
- بعد نشر بيتا، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من إعداد حزمة مثبتة لأول مرة، وإعداد Telegram، وTelegram E2E الحقيقي
  مقابل حزمة npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المؤجرة المشتركة.
  يمكن لمحافظي المشروع في التشغيلات المحلية المنفردة حذف متغيرات Convex وتمرير بيانات اعتماد البيئة الثلاثة
  `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- يستطيع المحافظون تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر
  سير العمل اليدوي `NPM Telegram Beta E2E`. وهو يدوي فقط عن قصد ولا
  يعمل عند كل دمج.
- تستخدم أتمتة إصدار المحافظين الآن أسلوب الفحص التمهيدي ثم الترقية:
  - يجب أن يمر نشر npm الحقيقي عبر `preflight_run_id` ناجح من npm
  - يجب إطلاق نشر npm الحقيقي من فرع `main` أو
    `release/YYYY.M.D` نفسه مثل تشغيل الفحص التمهيدي الناجح
  - تفترض إصدارات npm المستقرة افتراضيا `beta`
  - يمكن أن يستهدف نشر npm المستقر `latest` صراحة عبر مدخل سير العمل
  - أصبح تعديل dist-tag في npm المعتمد على الرمز المميز موجودا الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما
    يُبقي المستودع العام النشر عبر OIDC فقط
  - `macOS Release` العام مخصص للتحقق فقط؛ عندما يوجد وسم على فرع
    إصدار فقط ولكن يُطلق سير العمل من `main`، عيّن
    `public_release_branch=release/YYYY.M.D`
  - يجب أن يمر نشر mac الخاص الحقيقي عبر `preflight_run_id` و`validate_run_id`
    ناجحين خاصين بـ mac
  - تروّج مسارات النشر الحقيقية العناصر المحضّرة بدلا من إعادة بنائها
    مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد النشر
  أيضا من مسار الترقية نفسه ببادئة مؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار التثبيتات العامة الأقدم بصمت على
  حمولة المستقر الأساسية
- يفشل الفحص التمهيدي لإصدار npm بإغلاق آمن ما لم يتضمن الأرشيف كلا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق التحقق بعد النشر أيضا من وجود نقاط دخول Plugin المنشورة
  وبيانات تعريف الحزمة في تخطيط السجل المثبت. يفشل الإصدار الذي
  يشحن حمولات تشغيل Plugin مفقودة في مدقق ما بعد النشر ولا يمكن
  ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضا ميزانية `unpackedSize` لحزمة npm على
  أرشيف تحديث المرشح، بحيث يكتشف installer e2e تضخم الحزمة العرضي
  قبل مسار نشر الإصدار
- إذا مس عمل الإصدار تخطيط CI، أو بيانات توقيت الامتدادات، أو
  مصفوفات اختبار الامتدادات، فأعد توليد ومراجعة مخرجات مصفوفة
  `plugin-prerelease-extension-shard` المملوكة للمخطط من
  `.github/workflows/plugin-prerelease.yml` قبل الاعتماد حتى لا
  تصف ملاحظات الإصدار تخطيط CI قديما
- تشمل جاهزية إصدار macOS المستقر أيضا أسطح المحدث:
  - يجب أن ينتهي إصدار GitHub بالملفات المعبأة `.zip` و`.dmg` و`.dSYM.zip`
  - يجب أن يشير `appcast.xml` على `main` إلى zip المستقر الجديد بعد النشر
  - يجب أن يحافظ التطبيق المعبأ على معرف حزمة غير مخصص للتصحيح، ورابط موجز Sparkle
    غير فارغ، و`CFBundleVersion` عند أو فوق الحد الأدنى المعتمد لبناء Sparkle
    لذلك الإصدار

## صناديق اختبار الإصدار

`Full Release Validation` هو الطريقة التي يشغّل بها المشغلون كل اختبارات ما قبل الإصدار من
نقطة دخول واحدة. لإثبات التزام مثبت على فرع سريع الحركة، استخدم
المساعد حتى يعمل كل سير عمل فرعي من فرع مؤقت مثبت عند SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويطلق `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن `headSha` لكل سير عمل فرعي
يطابق الهدف، ثم يحذف الفرع المؤقت. يتجنب ذلك إثبات تشغيل فرعي
أحدث من `main` عن طريق الخطأ.

للتحقق من فرع إصدار أو وسم إصدار، شغّله من مرجع سير العمل `main`
الموثوق ومرر فرع الإصدار أو الوسم كـ `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

يحلّ سير العمل مرجع الهدف، ويشغّل `CI` يدويًا مع
`target_ref=<release-ref>`، ويشغّل `OpenClaw Release Checks`، ويشغّل
Telegram E2E للحزمة المستقلة عندما يكون `release_profile=full` مع
`rerun_group=all` أو عندما تكون `npm_telegram_package_spec` مضبوطة. ثم توسّع
`OpenClaw Release Checks` النطاق ليشمل smoke تثبيت، وفحوصات إصدار عبر أنظمة تشغيل متعددة، وتغطية live/E2E Docker
لمسار الإصدار، وقبول الحزمة مع Telegram package QA، وتكافؤ QA Lab،
وMatrix المباشر، وTelegram المباشر. لا يُقبل التشغيل الكامل إلا عندما يُظهر
ملخص `Full Release Validation`
نجاح `normal_ci` و`release_checks`. في وضع full/all،
يجب أن ينجح الطفل `npm_telegram` أيضًا؛ وخارج full/all يتم تخطيه
ما لم تُقدَّم `npm_telegram_package_spec` منشورة. يتضمن ملخص
المحقق النهائي جداول أبطأ المهام لكل تشغيل فرعي، بحيث يستطيع مدير الإصدار
رؤية المسار الحرج الحالي دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، وفروق الملف الشخصي المستقر مقابل الكامل،
والآثار، ومقابض إعادة التشغيل المركزة.
تُشغَّل سير العمل الفرعية من المرجع الموثوق الذي يشغّل `Full Release
Validation`، وعادةً `--ref main`، حتى عندما يشير `ref` الهدف إلى
فرع إصدار أو وسم أقدم. لا يوجد مُدخل منفصل لمرجع سير عمل Full Release Validation؛
اختر حزام الاختبار الموثوق باختيار مرجع تشغيل سير العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات commit دقيق على `main` متحرك؛
لا يمكن أن تكون commit SHAs الخام مراجع لتشغيل سير العمل، لذا استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبت.

استخدم `release_profile` لاختيار اتساع live/provider:

- `minimum`: أسرع مسار مباشر وDocker حرج للإصدار لـ OpenAI/core
- `stable`: الحد الأدنى بالإضافة إلى تغطية provider/backend مستقرة لاعتماد الإصدار
- `full`: المستقر بالإضافة إلى تغطية واسعة advisory provider/media

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل مرجع الهدف
مرة واحدة باسم `release-package-under-test` وتعيد استخدام ذلك الأثر في كل من
فحوصات Docker لمسار الإصدار وPackage Acceptance. هذا يُبقي كل صناديق مواجهة
الحزمة على نفس البايتات ويتجنب تكرار بناء الحزمة.
يستخدم smoke تثبيت OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون
متغير repo/org مضبوطًا، وإلا `openai/gpt-5.5`، لأن هذا المسار
يثبت تثبيت الحزمة، والإعداد الأولي، وبدء Gateway، ودورة وكيل مباشرة واحدة
بدلًا من قياس أبطأ نموذج افتراضي. تظل مصفوفة provider المباشرة الأوسع
هي المكان المخصص للتغطية الخاصة بالنماذج.

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

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركّز. إذا فشل صندوق واحد،
فاستخدم سير العمل الفرعي الفاشل، أو المهمة، أو مسار Docker، أو ملف الحزمة الشخصي، أو موفر النموذج،
أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة أخرى فقط عندما
يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل أدلة كل الصناديق السابقة
قديمة. يعيد المحقق النهائي للمظلة فحص معرفات تشغيل سير العمل الفرعية المسجلة،
لذلك بعد إعادة تشغيل سير عمل فرعي بنجاح، أعد تشغيل مهمة الأصل الفاشلة
`Verify full validation` فقط.

للتعافي المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل
مرشح الإصدار الحقيقي، و`ci` يشغّل فقط فرع CI العادي، و`plugin-prerelease`
يشغّل فقط فرع plugin الخاص بالإصدار، و`release-checks` يشغّل كل صناديق الإصدار،
ومجموعات الإصدار الأضيق هي `install-smoke`، و`cross-os`،
و`live-e2e`، و`package`، و`qa`، و`qa-parity`، و`qa-live`، و`npm-telegram`.
تتطلب عمليات إعادة التشغيل المركزة لـ `npm-telegram` وجود `npm_telegram_package_spec`؛ أما تشغيلات full/all
مع `release_profile=full` فتستخدم أثر حزمة release-checks.

### Vitest

صندوق Vitest هو سير العمل الفرعي اليدوي `CI`. يتجاوز CI اليدوي عمدًا
تحديد النطاق حسب التغييرات ويفرض مخطط الاختبار العادي لمرشح الإصدار: شظايا Linux Node،
وشظايا plugin المضمّنة، وعقود القنوات، وتوافق Node 22،
و`check`، و`check-additional`، وsmoke البناء، وفحوصات الوثائق، وPython
skills، وWindows، وmacOS، وAndroid، وControl UI i18n.

استخدم هذا الصندوق للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية الكاملة؟"
إنه ليس مماثلًا للتحقق من المنتج عبر مسار الإصدار. الأدلة التي يجب الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يُظهر عنوان URL لتشغيل `CI` الذي تم تشغيله
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الشظايا الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- آثار توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما
  يحتاج التشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي ولكن
لا يحتاج صناديق Docker أو QA Lab أو live أو cross-OS أو package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker في `OpenClaw Release Checks` من خلال
`openclaw-live-and-e2e-checks-reusable.yml`، بالإضافة إلى سير عمل
`install-smoke` في وضع الإصدار. يتحقق من مرشح الإصدار عبر بيئات
Docker المعبأة بدلًا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- smoke تثبيت كامل مع تمكين smoke تثبيت Bun العالمي البطيء
- إعداد/إعادة استخدام صورة smoke لـ Dockerfile الجذري حسب SHA الهدف، مع تشغيل مهام QR،
  وroot/gateway، وinstaller/Bun smoke كشظايا install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`،
  و`plugins-runtime-services`،
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند الطلب
- مسارات تثبيت/إلغاء تثبيت plugin المضمّنة المقسمة
  `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات provider live/E2E وتغطية نماذج Docker المباشرة عندما تتضمن فحوصات الإصدار
  مجموعات live

استخدم آثار Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للتعافي المركّز،
استخدم `docker_lanes=<lane[,lane]>` على سير عمل live/E2E القابل لإعادة الاستخدام بدلًا من
إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل المولّدة
`package_artifact_run_id` السابق ومدخلات صور Docker المعدّة عندما تكون متاحة، بحيث يمكن
للمسار الفاشل إعادة استخدام نفس tarball وصور GHCR.

### QA Lab

صندوق QA Lab هو أيضًا جزء من `OpenClaw Release Checks`. إنه بوابة
السلوك الوكيلي وإصدار مستوى القنوات، منفصل عن آليات حزمة Vitest وDocker.

تشمل تغطية QA Lab للإصدار:

- بوابة تكافؤ mock تقارن مسار مرشح OpenAI بخط أساس Opus 4.6
  باستخدام حزمة التكافؤ الوكيلية
- ملف Matrix QA مباشر وسريع باستخدام بيئة `qa-live-shared`
- مسار Telegram QA مباشر باستخدام إيجارات بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما تحتاج telemetry الإصدار إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات المباشرة؟" احتفظ بعناوين URL للآثار الخاصة بمسارات التكافؤ وMatrix وTelegram
عند اعتماد الإصدار. تظل تغطية Matrix الكاملة متاحة كتشغيل QA-Lab مقسم يدويًا
بدلًا من المسار الافتراضي الحرج للإصدار.

### الحزمة

صندوق الحزمة هو بوابة المنتج القابل للتثبيت. تدعمه
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يقوم المحلل بتطبيع
المرشح إلى tarball `package-under-test` الذي يستهلكه Docker E2E، ويتحقق من
مخزون الحزمة، ويسجل إصدار الحزمة وSHA-256، ويحافظ على مرجع حزام سير العمل
منفصلًا عن مرجع مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: `openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيق
  من الإصدارات
- `source=ref`: حزم فرع `package_ref` موثوقًا، أو وسمًا، أو commit SHA كاملًا
  مع حزام `workflow_ref` المحدد
- `source=url`: نزّل `.tgz` عبر HTTPS مع `package_sha256` مطلوب
- `source=artifact`: أعد استخدام `.tgz` مرفوعًا بواسطة تشغيل GitHub Actions آخر

تشغّل `OpenClaw Release Checks` قبول الحزمة مع `source=artifact`،
وأثر حزمة الإصدار المعد، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
و`published_upgrade_survivor_baselines=release-history`,
و`published_upgrade_survivor_scenarios=reported-issues`، و
`telegram_mode=mock-openai`. يحافظ Package Acceptance على الهجرة، والتحديث، وتنظيف
تبعية plugin القديمة، وتجهيزات plugin دون اتصال، وتحديث plugin، وTelegram
package QA مقابل نفس tarball المحلول. إنه البديل الأصلي في GitHub
لمعظم تغطية الحزمة/التحديث التي كانت تتطلب سابقًا Parallels. تظل فحوصات cross-OS release
مهمة للإعداد الأولي الخاص بنظام التشغيل، والمثبت، وسلوك المنصة، لكن يجب
أن تفضل عملية تحقق منتج الحزمة/التحديث Package Acceptance.

قائمة التحقق القانونية للتحقق من التحديث وplugin هي
[اختبار التحديثات وplugins](/ar/help/testing-updates-plugins). استخدمها عند
تحديد أي مسار محلي أو Docker أو Package Acceptance أو release-check يثبت
تثبيت/تحديث plugin، أو تنظيف doctor، أو تغيير هجرة حزمة منشورة.
تُعد هجرة التحديث المنشورة الشاملة من كل حزمة مستقرة `2026.4.23+`
سير عمل يدويًا منفصلًا باسم `Update Migration`، وليست جزءًا من Full Release CI.

تسامح package-acceptance القديم محدود زمنيًا عمدًا. يمكن للحزم حتى
`2026.4.25` استخدام مسار التوافق لفجوات metadata المنشورة بالفعل
إلى npm: إدخالات مخزون QA الخاصة المفقودة من tarball، وغياب
`gateway install --wrapper`، وغياب ملفات patch في fixture git المشتق من tarball،
وغياب `update.channel` المستمر، ومواقع سجلات تثبيت plugin القديمة،
وغياب استمرار سجل تثبيت marketplace، وهجرة config metadata
أثناء `plugins update`. قد تحذر حزمة `2026.4.26` المنشورة
بشأن ملفات stamp لبيانات بناء محلية كانت قد شُحنت بالفعل. يجب أن تفي الحزم اللاحقة
بعقود الحزمة الحديثة؛ إذ تفشل الفجوات نفسها في التحقق من الإصدار.

استخدم ملفات Package Acceptance الشخصية الأوسع عندما يكون سؤال الإصدار متعلقًا
بحزمة قابلة للتثبيت فعلية:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

ملفات الحزمة الشخصية الشائعة:

- `smoke`: مسارات تثبيت/قناة/وكيل سريعة للحزمة، وشبكة Gateway، وإعادة تحميل config
- `package`: عقود حزمة التثبيت/التحديث/plugin دون ClawHub مباشر؛ هذا هو الافتراضي في release-check
- `product`: `package` بالإضافة إلى قنوات MCP، وتنظيف cron/subagent، وبحث ويب OpenAI،
  وOpenWebUI
- `full`: أجزاء Docker لمسار الإصدار مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لعمليات إعادة التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في Package Acceptance. يمرّر سير العمل حزمة
`package-under-test` بصيغة tarball بعد حلها إلى مسار Telegram؛ وما زال سير عمل
Telegram المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة الدخول العادية للنشر المُعدِّل. وهو
ينسّق تدفقات عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. التحقق من وسم الإصدار وحل SHA الالتزام الخاص به.
2. التحقق من أن الوسم قابل للوصول من `main` أو `release/*`.
3. تشغيل `pnpm plugins:sync:check`.
4. إرسال `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. إرسال `Plugin ClawHub Release` بالنطاق نفسه وSHA نفسه.
6. إرسال `OpenClaw NPM Release` مع وسم الإصدار، ووسم توزيع npm، و
   `preflight_run_id` المحفوظ.

مثال نشر تجريبي:

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

استخدم تدفقات العمل الأدنى مستوى `Plugin NPM Release` و`Plugin ClawHub Release`
فقط لأعمال الإصلاح أو إعادة النشر المركزة. لإصلاح Plugin محدد، مرّر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أرسل سير العمل الفرعي مباشرة عندما يجب عدم
نشر حزمة OpenClaw.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ عندما تكون `preflight_only=true`، يجوز أن يكون أيضًا
  SHA الالتزام الكامل الحالي المكوّن من 40 حرفًا لفرع سير العمل للتمهيد
  المخصص للتحقق فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي كي يعيد سير العمل استخدام
  حزمة tarball المُحضّرة من تشغيل التمهيد الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ الافتراضي هو `beta`

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب؛ يجب أن يكون موجودًا مسبقًا
- `preflight_run_id`: معرف تشغيل تمهيد `OpenClaw NPM Release` الناجح؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm المستهدف لحزمة OpenClaw
- `plugin_publish_scope`: الافتراضي هو `all-publishable`؛ استخدم `selected`
  فقط لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: الافتراضي هو `true`؛ اضبطه على `false` فقط عند
  استخدام سير العمل كمنسق إصلاح مخصص للـ Plugin فقط

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق منه. تتطلب الفحوصات الحاملة
  للأسرار أن يكون الالتزام الذي تم حله قابلًا للوصول من فرع OpenClaw أو
  وسم إصدار.

القواعد:

- يجوز نشر الوسوم المستقرة ووسوم التصحيح إلى `beta` أو `latest`
- يجوز نشر وسوم الإصدارات التجريبية beta المسبقة إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، لا يُسمح بمدخل SHA الالتزام الكامل إلا
  عندما تكون `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` مخصصان دائمًا للتحقق فقط
- يجب أن يستخدم مسار النشر الحقيقي نفس `npm_dist_tag` المستخدم أثناء التمهيد؛
  يتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر

## تسلسل إصدار npm المستقر

عند إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الكامل الحالي لفرع سير العمل
     لتشغيل تجريبي للتحقق فقط من سير عمل التمهيد
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ بـ beta، أو `latest` فقط
   عندما تريد عمدًا نشرًا مستقرًا مباشرًا
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو SHA
   الالتزام الكامل عندما تريد CI العادي مع تغطية ذاكرة التخزين المؤقت
   للمطالبات الحية وDocker وQA Lab وMatrix وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدًا إلى مخطط الاختبار العادي الحتمي فقط، فشغّل سير العمل
   اليدوي `CI` على مرجع الإصدار بدلًا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` باستخدام نفس `tag` ونفس `npm_dist_tag`
   و`preflight_run_id` المحفوظ؛ ينشر Plugins الخارجية إلى npm وClawHub قبل
   ترقية حزمة OpenClaw npm
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
8. إذا نُشر الإصدار عمدًا مباشرة إلى `latest` وكان ينبغي أن يتبع `beta`
   نفس البناء المستقر فورًا، فاستخدم سير العمل الخاص نفسه لتوجيه وسمي
   التوزيع كليهما إلى الإصدار المستقر، أو اترك مزامنة الإصلاح الذاتي المجدولة
   الخاصة به تنقل `beta` لاحقًا

توجد عملية تعديل وسم التوزيع في المستودع الخاص لأسباب أمنية لأنها ما زالت
تتطلب `NPM_TOKEN`، بينما يبقي المستودع العام النشر معتمدًا على OIDC فقط.

يبقي ذلك مسار النشر المباشر ومسار الترقية الذي يبدأ بـ beta موثقين ومرئيين
للمشغلين.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر
1Password CLI (`op`) داخل جلسة tmux مخصصة فقط. لا تستدعِ `op` مباشرة من
صدفة الوكيل الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات والتنبيهات والتعامل
مع OTP قابلة للملاحظة ويمنع تنبيهات المضيف المتكررة.

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
