---
read_when:
    - البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرة إصدارها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، وصناديق التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدارات
x-i18n:
    generated_at: "2026-05-04T07:10:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
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
- لا تضع أصفارًا بادئة للشهر أو اليوم
- `latest` يعني إصدار npm المستقر الحالي الذي تمت ترقيته
- `beta` يعني هدف التثبيت التجريبي الحالي
- تُنشر إصدارات المستقر وتصحيحات المستقر إلى npm `beta` افتراضيًا؛ ويمكن لمشغّلي الإصدار استهداف `latest` صراحةً، أو ترقية بنية تجريبية مُراجعة لاحقًا
- كل إصدار مستقر من OpenClaw يشحن حزمة npm وتطبيق macOS معًا؛
  تتحقق الإصدارات التجريبية عادةً من مسار npm/الحزمة وتنشره أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق Mac للمستقر ما لم يُطلب ذلك صراحةً

## وتيرة الإصدار

- تتحرك الإصدارات وفق نهج التجريبي أولًا
- لا يأتي المستقر إلا بعد التحقق من أحدث إصدار تجريبي
- عادةً ما يقتطع المشرفون الإصدارات من فرع `release/YYYY.M.D` مُنشأ
  من `main` الحالي، بحيث لا يمنع التحقق من الإصدار وإصلاحاته التطوير
  الجديد على `main`
- إذا دُفع وسم تجريبي أو نُشر واحتاج إلى إصلاح، يقتطع المشرفون
  وسم `-beta.N` التالي بدل حذف الوسم التجريبي القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغّل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد وسوم التوزيع، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار المخصص للمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وأكّد أن الالتزام الهدف قد دُفع،
   وأكّد أن CI الحالي لـ `main` أخضر بما يكفي للتفرع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، واجعل الإدخالات موجهة للمستخدمين، ثم التزم به وادفعه، ونفّذ rebase/pull
   مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب حمله عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. زد رقم الإصدار في كل موقع مطلوب للوسم المقصود، ثم شغّل
   `pnpm plugins:sync` حتى تشترك حزم Plugin القابلة للنشر في إصدار الإصدار
   وبيانات تعريف التوافق، ثم شغّل الفحص المحلي الحتمي السابق للإصدار:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل من 40 حرفًا لفرع الإصدار للتحقق فقط
   في الفحص السابق للإصدار. احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار، أو الوسم، أو SHA الالتزام الكامل. هذه هي نقطة الدخول اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest، وDocker، وQA Lab، وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر ملف، أو مسار، أو مهمة سير عمل، أو ملف تعريف حزمة، أو موفر، أو قائمة سماح نماذج فاشلة
   تثبت الإصلاح. أعد تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير
   الأدلة السابقة قديمة.
9. بالنسبة إلى التجريبي، ضع الوسم `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   وينشر كل حزم Plugin القابلة للنشر إلى npm أولًا، وينشر المجموعة نفسها
   إلى ClawHub ثانيًا كحزم tarball من ClawPack npm-pack، ثم يرقي
   أثر الفحص السابق للإصدار المحضر لـ OpenClaw npm مع وسم التوزيع المطابق. بعد
   النشر، شغّل قبول الحزمة بعد النشر
   مقابل حزمة `openclaw@YYYY.M.D-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاج ما قبل إصدار مدفوع أو منشور إلى إصلاح،
   فاقتطع رقم ما قبل الإصدار المطابق التالي؛ لا تحذف ما قبل الإصدار القديم
   أو تعيد كتابته.
10. بالنسبة إلى المستقر، لا تتابع إلا بعد أن يمتلك الإصدار التجريبي أو مرشح الإصدار المُراجع
    أدلة التحقق المطلوبة. نشر npm المستقر يمر أيضًا عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أثر الفحص السابق للإصدار الناجح عبر
    `preflight_run_id`؛ كما تتطلب جاهزية إصدار macOS المستقر وجود
    `.zip`، و`.dmg`، و`.dSYM.zip` المحزّمة، و`appcast.xml` محدثًا على `main`.
11. بعد النشر، شغّل متحقق npm بعد النشر، واختبار Telegram E2E الاختياري
    المستقل من npm المنشور عندما تحتاج إلى إثبات القناة بعد النشر،
    وترقية وسم التوزيع عند الحاجة، وملاحظات إصدار/ما قبل إصدار GitHub من
    قسم `CHANGELOG.md` المطابق الكامل، وخطوات إعلان الإصدار.

## الفحص السابق للإصدار

- شغّل `pnpm check:test-types` قبل فحص ما قبل الإصدار حتى يبقى TypeScript الخاص بالاختبارات
  مشمولاً خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل فحص ما قبل الإصدار حتى تكون فحوصات دورات الاستيراد
  الأوسع وحدود البنية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون عناصر إصدار
  `dist/*` المتوقعة وحزمة واجهة التحكم موجودة لخطوة تحقق الحزم
- شغّل `pnpm plugins:sync` بعد رفع إصدار الجذر وقبل الوسم. يحدّث هذا
  إصدارات حزم Plugin القابلة للنشر، وبيانات توافق OpenClaw النظير/API،
  وبيانات البناء، وقوالب سجل تغييرات Plugin لتطابق إصدار النواة.
  `pnpm plugins:sync:check` هو حارس الإصدار غير المعدِّل؛ يفشل سير عمل النشر
  قبل أي تعديل في السجل إذا نُسيت هذه الخطوة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل اعتماد الإصدار لبدء
  كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعاً أو وسماً
  أو SHA كاملاً للالتزام، ويطلق `CI` يدوياً، ويطلق
  `OpenClaw Release Checks` لمسارات اختبار التثبيت، وقبول الحزمة، وحزم
  مسار إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab،
  وMatrix، ومسارات Telegram. مع `release_profile=full` و`rerun_group=all`،
  يشغّل أيضاً Telegram E2E للحزمة مقابل عنصر `release-package-under-test`
  الناتج من فحوصات الإصدار. وفّر `npm_telegram_package_spec` بعد النشر عندما
  يجب أن يثبت Telegram E2E نفسه حزمة npm المنشورة أيضاً. وفّر
  `package_acceptance_package_spec` بعد النشر عندما يجب أن يشغّل قبول الحزمة
  مصفوفة الحزمة/التحديث الخاصة به مقابل حزمة npm المشحونة بدلاً من العنصر
  المبني من SHA. وفّر `evidence_package_spec` عندما يجب أن يثبت تقرير الأدلة
  الخاص أن التحقق يطابق حزمة npm منشورة دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد دليلاً جانبياً
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` مع
  `openclaw@beta` أو `openclaw@latest` أو إصدار دقيق؛ و`source=ref`
  لحزم فرع/وسم/SHA موثوق في `package_ref` باستخدام عُدة `workflow_ref`
  الحالية؛ و`source=url` لأرشيف HTTPS مع SHA-256 مطلوب؛ أو `source=artifact`
  لأرشيف رُفع بواسطة تشغيل GitHub Actions آخر. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E مقابل ذلك
  الأرشيف، ويمكنه تشغيل ضمان جودة Telegram مقابل الأرشيف نفسه باستخدام
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن
  مسارات Docker المحددة `published-upgrade-survivor`، يكون عنصر الحزمة هو
  المرشح، ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/Plugin الأصلية للعنصر دون OpenWebUI أو ClawHub حي
  - `product`: ملف الحزمة بالإضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي،
    وبحث الويب في OpenAI، وOpenWebUI
  - `full`: مقاطع مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` الدقيق لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI العادية
  الكاملة لمرشح الإصدار. تتجاوز تشغيلات CI اليدوية نطاق التغييرات وتفرض
  شظايا Linux Node، وشظايا Plugin المضمنة، وعقود القنوات، وتوافق Node 22،
  و`check`، و`check-additional`، واختبار البناء، وفحوصات التوثيق، وPython skills،
  وWindows، وmacOS، وAndroid، ومسارات i18n لواجهة التحكم.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. يمرّن
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء امتدادات التتبّع
  المصدّرة، والسمات المحدودة، وتنقيح المحتوى/المعرّفات دون الحاجة إلى
  Opik أو Langfuse أو جامع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المعدِّل بعد وجود الوسم.
  أطلقه من `release/YYYY.M.D` (أو `main` عند نشر وسم يمكن الوصول إليه من
  main)، ومرّر وسم الإصدار و`preflight_run_id` ناجحاً لـ OpenClaw npm،
  وأبقِ نطاق نشر Plugin الافتراضي `all-publishable` إلا إذا كنت تشغّل إصلاحاً
  مركزاً عمداً. ينسّق سير العمل نشر npm الخاص بـ Plugin، ونشر ClawHub الخاص
  بـ Plugin، ونشر OpenClaw على npm حتى لا تُنشر الحزمة الأساسية قبل Plugin
  الخارجية الخاصة بها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضاً مسار تكافؤ QA Lab الوهمي بالإضافة إلى
  ملف Matrix الحي السريع ومسار ضمان جودة Telegram قبل اعتماد الإصدار. تستخدم
  المسارات الحية بيئة `qa-live-shared`؛ ويستخدم Telegram أيضاً إيجارات بيانات
  اعتماد Convex CI. شغّل سير العمل اليدوي `QA-Lab - All Lanes` مع
  `matrix_profile=all` و`matrix_shards=true` عندما تريد مخزون نقل Matrix
  ووسائطه وE2EE كاملاً بالتوازي.
- يُعد تحقق وقت تشغيل التثبيت والترقية عبر أنظمة التشغيل جزءاً من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، اللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: إبقاء مسار إصدار npm الحقيقي قصيراً وحتمياً ومركزاً على
  العناصر، بينما تبقى الفحوصات الحية الأبطأ في مسارها الخاص حتى لا تؤخر
  النشر أو تمنعه
- يجب إطلاق فحوصات الإصدار التي تحمل أسراراً عبر `Full Release
Validation` أو من مرجع سير عمل `main`/الإصدار حتى يبقى منطق سير العمل
  والأسرار تحت السيطرة
- يقبل `OpenClaw Release Checks` فرعاً أو وسماً أو SHA كاملاً للالتزام ما دام
  الالتزام المحلول يمكن الوصول إليه من فرع OpenClaw أو وسم إصدار
- يقبل فحص ما قبل الإصدار الخاص بالتحقق فقط لـ `OpenClaw NPM Release` أيضاً
  SHA الحالي الكامل المؤلف من 40 محرفاً لالتزام فرع سير العمل دون اشتراط وسم
  مدفوع
- مسار SHA هذا مخصص للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط لفحص بيانات
  الحزمة؛ لا يزال النشر الحقيقي يتطلب وسم إصدار حقيقياً
- يُبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات GitHub-hosted،
  بينما يمكن لمسار التحقق غير المعدِّل استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل ذلك السير
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد فحص ما قبل إصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور في
  بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تهيئة الحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي
  مقابل حزمة npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المؤجرة
  المشتركة. يمكن للمشرفين المحليين في التشغيلات الفردية حذف متغيرات Convex
  وتمرير بيانات اعتماد البيئة الثلاث `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- لتشغيل اختبار beta الكامل بعد النشر من جهاز مشرف، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق Parallels من تحديث npm/الهدف الجديد، ويطلق `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل الدقيق، وينزّل العنصر، ويطبع تقرير Telegram.
- يمكن للمشرفين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر سير العمل
  اليدوي `NPM Telegram Beta E2E`. وهو يدوي فقط عمداً ولا يعمل مع كل دمج.
- تستخدم أتمتة إصدار المشرفين الآن أسلوب الفحص المسبق ثم الترقية:
  - يجب أن ينجح نشر npm الحقيقي في `preflight_run_id` الخاص بـ npm
  - يجب إطلاق نشر npm الحقيقي من فرع `main` أو `release/YYYY.M.D` نفسه
    الذي شُغّل منه فحص ما قبل الإصدار الناجح
  - الإصدارات المستقرة من npm تضبط افتراضياً على `beta`
  - يمكن لنشر npm المستقر استهداف `latest` صراحة عبر مدخل سير العمل
  - أصبح تعديل npm dist-tag المعتمد على الرمز يعيش الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    للأمان، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما
    يُبقي المستودع العام النشر عبر OIDC فقط
  - `macOS Release` العام مخصص للتحقق فقط؛ عندما يوجد الوسم على فرع إصدار فقط
    لكن سير العمل يُطلق من `main`، عيّن
    `public_release_branch=release/YYYY.M.D`
  - يجب أن ينجح نشر mac الخاص الحقيقي في `preflight_run_id` و`validate_run_id`
    الخاصين بـ mac الخاص
  - ترقّي مسارات النشر الحقيقية العناصر المحضّرة بدلاً من إعادة بنائها
    مرة أخرى
- بالنسبة لإصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد
  النشر أيضاً من مسار الترقية نفسه ببادئة مؤقتة من `YYYY.M.D` إلى
  `YYYY.M.D-N` حتى لا تترك تصحيحات الإصدار التثبيتات العامة الأقدم بصمت على
  حمولة الاستقرار الأساسية
- يفشل فحص ما قبل إصدار npm بإغلاق آمن ما لم يتضمن الأرشيف كلاً من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة متصفح فارغة مرة أخرى
- يتحقق ما بعد النشر أيضاً من وجود نقاط دخول Plugin المنشورة وبيانات الحزمة
  في تخطيط السجل المثبت. الإصدار الذي يشحن حمولات وقت تشغيل Plugin مفقودة
  يفشل في مدقق ما بعد النشر ولا يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضاً ميزانية `unpackedSize` لحزمة npm على
  أرشيف تحديث المرشح، حتى يلتقط installer e2e تضخم الحزم العرضي قبل مسار
  نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت extensions، أو مصفوفات اختبار
  extensions، فأعد توليد ومراجعة مخرجات مصفوفة
  `plugin-prerelease-extension-shard` المملوكة للمخطط من
  `.github/workflows/plugin-prerelease.yml` قبل الاعتماد حتى لا تصف ملاحظات
  الإصدار تخطيط CI قديماً
- تشمل جاهزية إصدار macOS المستقر أيضاً أسطح المحدّث:
  - يجب أن ينتهي إصدار GitHub بملفات `.zip` و`.dmg` و`.dSYM.zip` المعبأة
  - يجب أن يشير `appcast.xml` على `main` إلى zip المستقر الجديد بعد النشر
  - يجب أن يحافظ التطبيق المعبأ على معرّف حزمة غير تصحيحي، وعنوان URL غير
    فارغ لتغذية Sparkle، و`CFBundleVersion` يساوي أو يتجاوز حد بناء Sparkle
    القياسي لذلك الإصدار

## صناديق اختبار الإصدار

`Full Release Validation` هو ما يستخدمه المشغّلون لبدء كل اختبارات ما قبل الإصدار من
نقطة دخول واحدة. للحصول على إثبات التزام مثبت على فرع سريع الحركة، استخدم
المساعد حتى يعمل كل سير عمل فرعي من فرع مؤقت مثبت على SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويطلق `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن كل `headSha` في سير عمل فرعي
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

يعالج سير العمل مرجع الهدف، ويطلق `CI` يدويًا باستخدام
`target_ref=<release-ref>`، ويطلق `OpenClaw Release Checks`، ويحضّر أداة
`release-package-under-test` أصلية للفحوصات الموجّهة للحِزم، ويطلق Telegram E2E
للحزمة المستقلة عندما تكون `release_profile=full` مع
`rerun_group=all` أو عندما يتم ضبط `npm_telegram_package_spec`. بعد ذلك تتوسع
`OpenClaw Release Checks` إلى فحص install smoke، وفحوصات الإصدار عبر أنظمة
التشغيل، وتغطية مسار إصدار Docker المباشر/E2E، وPackage Acceptance مع QA لحزمة
Telegram، وتكافؤ QA Lab، وMatrix المباشر، وTelegram المباشر. لا يكون التشغيل
الكامل مقبولًا إلا عندما يُظهر ملخص
`Full Release Validation`
أن `normal_ci` و`release_checks` ناجحان. في وضع full/all، يجب أن يكون الفرع
الابن `npm_telegram` ناجحًا أيضًا؛ وخارج full/all يتم تخطيه ما لم تُقدَّم
`npm_telegram_package_spec` منشورة. يتضمن ملخص
التحقق النهائي جداول أبطأ المهام لكل تشغيل ابن، حتى يتمكن مدير الإصدار من رؤية
المسار الحرج الحالي دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، والفروق بين ملفي stable
وfull، والأدوات، ومعالجات إعادة التشغيل المركزة.
تُطلق سير العمل الأبناء من المرجع الموثوق الذي يشغّل `Full Release
Validation`، عادة `--ref main`، حتى عندما يشير `ref` الهدف إلى
فرع إصدار أقدم أو وسم أقدم. لا يوجد إدخال منفصل لمرجع سير عمل Full Release Validation؛
اختر حاضنة الاختبار الموثوقة باختيار مرجع تشغيل سير العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات التزام دقيق على `main` متحرك؛
لا يمكن أن تكون SHAs الأولية للالتزامات مراجع dispatch لسير العمل، لذا استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبّت.

استخدم `release_profile` لتحديد اتساع الفحوصات المباشرة/المزوّد:

- `minimum`: أسرع مسار مباشر حرج للإصدار لـ OpenAI/النواة وDocker
- `stable`: minimum بالإضافة إلى تغطية المزوّدات/الخلفيات المستقرة لاعتماد الإصدار
- `full`: stable بالإضافة إلى تغطية واسعة للمزوّدات/الوسائط الاستشارية

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل مرجع الهدف مرة واحدة
باسم `release-package-under-test` وتعيد استخدام تلك الأداة في فحوصات Docker لمسار
الإصدار وفي Package Acceptance. هذا يُبقي كل الصناديق الموجّهة للحِزم على نفس
البايتات ويتجنب بناء الحِزم المتكرر.
يستخدم فحص install smoke لـ OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون
متغير المستودع/المؤسسة مضبوطًا، وإلا يستخدم `openai/gpt-5.4`، لأن هذا المسار
يثبت تثبيت الحزمة، والإعداد الأولي، وبدء تشغيل Gateway، ودورة وكيل مباشرة واحدة
بدلًا من قياس أداء أبطأ نموذج افتراضي. تبقى مصفوفة المزوّدات المباشرة الأوسع
هي موضع التغطية الخاصة بالنماذج.

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
فاستخدم سير العمل الابن الفاشل، أو المهمة، أو مسار Docker، أو ملف الحزمة، أو
مزوّد النموذج، أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة أخرى فقط عندما
يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل دليل كل الصناديق السابق قديمًا.
يعيد متحقق المظلة النهائي فحص معرفات تشغيل سير العمل الأبناء المسجلة، لذا بعد
إعادة تشغيل سير عمل ابن بنجاح، أعد تشغيل مهمة الأصل الفاشلة
`Verify full validation` فقط.

للاستعادة المحدودة، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل مرشح الإصدار
الحقيقي، و`ci` يشغّل ابن CI العادي فقط، و`plugin-prerelease`
يشغّل ابن Plugin الخاص بالإصدار فقط، و`release-checks` يشغّل كل صندوق إصدار،
ومجموعات الإصدار الأضيق هي `install-smoke`، و`cross-os`،
و`live-e2e`، و`package`، و`qa`، و`qa-parity`، و`qa-live`، و`npm-telegram`.
تتطلب إعادات التشغيل المركزة لـ `npm-telegram` وجود `npm_telegram_package_spec`؛ أما تشغيلات full/all
مع `release_profile=full` فتستخدم أداة حزمة release-checks.

### Vitest

صندوق Vitest هو سير العمل الابن `CI` اليدوي. يتجاوز CI اليدوي عمدًا النطاق
المتغير ويفرض مخطط الاختبار العادي لمرشح الإصدار: شظايا Linux Node،
وشظايا Plugin المجمّعة، وعقود القنوات، وتوافق Node 22، و`check`،
و`check-additional`، وفحص build smoke، وفحوصات المستندات، وPython
skills، وWindows، وmacOS، وAndroid، وControl UI i18n.

استخدم هذا الصندوق للإجابة عن: "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية الكاملة؟"
إنه ليس نفسه تحقق المنتج في مسار الإصدار. الأدلة التي يجب الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض عنوان URL لتشغيل `CI` المُطلق
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الشظايا الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- أدوات توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما
  يحتاج التشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي ولكن لا يحتاج
إلى صناديق Docker، أو QA Lab، أو المباشر، أو عبر أنظمة التشغيل، أو الحِزم:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker داخل `OpenClaw Release Checks` من خلال
`openclaw-live-and-e2e-checks-reusable.yml`، بالإضافة إلى سير عمل
`install-smoke` في وضع الإصدار. يتحقق من مرشح الإصدار عبر بيئات Docker
المغلّفة بدلًا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- فحص install smoke كامل مع تمكين فحص Bun global install smoke البطيء
- إعداد/إعادة استخدام صورة smoke لـ Dockerfile الجذر حسب SHA الهدف، مع تشغيل مهام QR،
  والجذر/Gateway، والمثبت/Bun smoke كشظايا install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`,
  و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`,
  و`plugins-runtime-services`,
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`,
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`,
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`,
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند الطلب
- مسارات تثبيت/إزالة تثبيت Plugin المجمّعة والمقسّمة
  من `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات المزوّد المباشرة/E2E وتغطية نماذج Docker المباشرة عندما
  تشمل فحوصات الإصدار المجموعات المباشرة

استخدم أدوات Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للاستعادة المركزة،
استخدم `docker_lanes=<lane[,lane]>` على سير العمل المباشر/E2E القابل لإعادة الاستخدام بدلًا من
إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل المُولّدة
`package_artifact_run_id` السابقة ومدخلات صورة Docker المُحضّرة عند توفرها، حتى يستطيع
المسار الفاشل إعادة استخدام نفس tarball وصور GHCR.

### QA Lab

صندوق QA Lab هو أيضًا جزء من `OpenClaw Release Checks`. إنه بوابة الإصدار
للسلوك الوكيلي ومستوى القناة، منفصلًا عن Vitest وآليات حزمة Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ mock يقارن مسار OpenAI المرشح بخط أساس Opus 4.6
  باستخدام حزمة التكافؤ الوكيلية
- ملف QA سريع مباشر لـ Matrix باستخدام بيئة `qa-live-shared`
- مسار QA مباشر لـ Telegram باستخدام إيجارات بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج قياس الإصدار إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن: "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات المباشرة؟" احتفظ بعناوين URL للأدوات الخاصة بمسارات التكافؤ،
وMatrix، وTelegram عند اعتماد الإصدار. تبقى تغطية Matrix الكاملة متاحة كتشغيل
QA-Lab يدوي مقسم إلى شظايا بدلًا من المسار الحرج الافتراضي للإصدار.

### Package

صندوق Package هو بوابة المنتج القابل للتثبيت. يستند إلى
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبّع المحلل المرشح إلى
tarball `package-under-test` الذي يستهلكه Docker E2E، ويتحقق من مخزون الحزمة،
ويسجل إصدار الحزمة وSHA-256، ويبقي مرجع حاضنة سير العمل منفصلًا عن مرجع مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: `openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيق
  منشور
- `source=ref`: حزم فرع `package_ref` موثوق، أو وسم، أو SHA التزام كامل
  مع حاضنة `workflow_ref` المحددة
- `source=url`: تنزيل `.tgz` عبر HTTPS مع `package_sha256` مطلوب
- `source=artifact`: إعادة استخدام `.tgz` مرفوع بواسطة تشغيل GitHub Actions آخر

تشغّل `OpenClaw Release Checks` عملية Package Acceptance باستخدام `source=artifact`،
وأداة حزمة الإصدار المُحضّرة، و`suite_profile=custom`,
و`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
و`published_upgrade_survivor_baselines=all-since-2026.4.23`,
و`published_upgrade_survivor_scenarios=reported-issues`، و
`telegram_mode=mock-openai`. تُبقي Package Acceptance فحوصات الهجرة، والتحديث،
وتنظيف اعتماديات Plugin القديمة، ومثبتات Plugin غير المتصلة، وتحديث Plugin، وQA
لحزمة Telegram ضد نفس tarball المحلول. تغطي مصفوفة الترقية كل خط أساس مستقر منشور على npm من `2026.4.23` حتى `latest`؛ استخدم
Package Acceptance مع `source=npm` لمرشح تم شحنه بالفعل، أو
`source=ref`/`source=artifact` من أجل tarball npm محلي مدعوم بـ SHA قبل
النشر. إنها البديل الأصلي في GitHub لمعظم تغطية الحزمة/التحديث التي كانت
تتطلب Parallels سابقًا. لا تزال فحوصات الإصدار عبر أنظمة التشغيل مهمة للإعداد
الأولي الخاص بنظام التشغيل، والمثبت، وسلوك المنصة، لكن تحقق منتج الحزمة/التحديث
يجب أن يفضّل Package Acceptance.

قائمة التحقق المعتمدة للتحديث والتحقق من Plugin هي
[اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins). استخدمها عند
تحديد أي مسار محلي، أو Docker، أو Package Acceptance، أو release-check يثبت
تثبيت/تحديث Plugin، أو تنظيف doctor، أو تغيير هجرة حزمة منشورة.
الهجرة المنشورة الشاملة للتحديث من كل حزمة مستقرة `2026.4.23+` هي
سير عمل يدوي منفصل `Update Migration`، وليست جزءًا من Full Release CI.

تساهل package-acceptance القديم محدد زمنيًا عن قصد. قد تستخدم الحِزم حتى
`2026.4.25` مسار التوافق لفجوات البيانات الوصفية المنشورة بالفعل
إلى npm: إدخالات مخزون QA الخاصة المفقودة من tarball، وغياب
`gateway install --wrapper`، وغياب ملفات patch في مثبت git المشتق من tarball،
وغياب `update.channel` المستمر، ومواقع سجل تثبيت Plugin القديمة،
وغياب استمرار سجل تثبيت السوق، وهجرة بيانات config الوصفية
أثناء `plugins update`. قد تحذر حزمة `2026.4.26` المنشورة
بشأن ملفات ختم بيانات build الوصفية المحلية التي شُحنت بالفعل. يجب أن تستوفي
الحِزم اللاحقة عقود الحزمة الحديثة؛ وتؤدي نفس الفجوات إلى فشل تحقق الإصدار.

استخدم ملفات Package Acceptance الأوسع عندما يكون سؤال الإصدار متعلقًا بحزمة
فعلية قابلة للتثبيت:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

ملفات الحزمة الشائعة:

- `smoke`: مسارات تثبيت الحزمة/القناة/الوكيل السريعة، وشبكة Gateway، وإعادة تحميل
  الإعدادات
- `package`: عقود تثبيت/تحديث/Plugin الحزمة من دون ClawHub مباشر؛ هذا هو الإعداد
  الافتراضي لفحص الإصدار
- `product`: `package` بالإضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي، وبحث OpenAI
  على الويب، وOpenWebUI
- `full`: مقاطع مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` الدقيقة لإعادات التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في Package Acceptance. يمرر سير العمل ملف tarball
المحلول `package-under-test` إلى مسار Telegram؛ ولا يزال سير عمل Telegram المستقل
يقبل مواصفة npm منشورة لفحوص ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة إدخال النشر المعدِّلة العادية. وهو
ينسق مهام سير عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. اسحب وسم الإصدار وحدد SHA الالتزام الخاص به.
2. تحقق من أن الوسم قابل للوصول من `main` أو `release/*`.
3. شغّل `pnpm plugins:sync:check`.
4. أطلق `Plugin NPM Release` باستخدام `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. أطلق `Plugin ClawHub Release` باستخدام النطاق نفسه وSHA نفسه.
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

استخدم مهام سير العمل ذات المستوى الأدنى `Plugin NPM Release` و`Plugin ClawHub Release`
فقط لأعمال الإصلاح أو إعادة النشر المركزة. لإصلاح Plugin محدد، مرر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أطلق سير العمل الفرعي مباشرة عندما يجب ألا تُنشر
حزمة OpenClaw.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم الإصدار مطلوب، مثل `v2026.4.2`، أو `v2026.4.2-1`، أو
  `v2026.4.2-beta.1`؛ عندما تكون `preflight_only=true`، يمكن أن يكون أيضًا SHA الالتزام
  الكامل الحالي بطول 40 حرفًا لفرع سير العمل لأغراض التحقق فقط قبل النشر
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار
  النشر الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي لكي يعيد سير العمل استخدام
  ملف tarball المُعد من تشغيل ما قبل النشر الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ الافتراضي هو `beta`

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم الإصدار مطلوب؛ يجب أن يكون موجودًا مسبقًا
- `preflight_run_id`: معرف تشغيل ما قبل النشر الناجح لـ `OpenClaw NPM Release`؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm المستهدف لحزمة OpenClaw
- `plugin_publish_scope`: الافتراضي هو `all-publishable`؛ استخدم `selected` فقط
  لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: الافتراضي هو `true`؛ عيّنه إلى `false` فقط عند استخدام
  سير العمل كمنسق إصلاح خاص بالـ Plugin فقط

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق. تتطلب الفحوص التي تحمل أسرارًا
  أن يكون الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو
  وسم إصدار.

القواعد:

- قد تُنشر وسوم الإصدارات المستقرة والتصحيحية إلى `beta` أو `latest`
- قد تُنشر وسوم إصدارات بيتا التمهيدية إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، يُسمح بإدخال SHA الالتزام الكامل فقط عندما تكون
  `preflight_only=true`
- تكون `OpenClaw Release Checks` و`Full Release Validation` دائمًا
  للتحقق فقط
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء ما قبل النشر؛
  ويتحقق سير العمل من استمرار صحة تلك البيانات الوصفية قبل النشر

## تسلسل إصدار npm مستقر

عند إنشاء إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الكامل الحالي لفرع سير العمل
     لتشغيل تجريبي للتحقق فقط لسير عمل ما قبل النشر
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ ببيتا، أو `latest` فقط
   عندما تريد عمدًا نشرًا مستقرًا مباشرًا
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو SHA
   الالتزام الكامل عندما تريد CI العادي بالإضافة إلى تغطية ذاكرة التخزين المؤقت للمطالبات المباشرة، وDocker، وQA Lab،
   وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدًا إلى مخطط الاختبارات العادي الحتمي فقط، فشغّل سير عمل
   `CI` اليدوي على مرجع الإصدار بدلًا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` باستخدام `tag` نفسه، و`npm_dist_tag` نفسه،
   و`preflight_run_id` المحفوظ؛ فهو ينشر الـ Plugins الخارجية إلى npm
   وClawHub قبل ترقية حزمة npm الخاصة بـ OpenClaw
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
8. إذا نُشر الإصدار عمدًا مباشرة إلى `latest` وينبغي أن يتبع `beta`
   البناء المستقر نفسه فورًا، فاستخدم سير العمل الخاص نفسه
   لتوجيه وسمي التوزيع كليهما إلى الإصدار المستقر، أو دع مزامنة الإصلاح الذاتي المجدولة
   تنقل `beta` لاحقًا

توجد عملية تعديل وسم التوزيع في المستودع الخاص لأسباب أمنية لأنها لا تزال
تتطلب `NPM_TOKEN`، بينما يحتفظ المستودع العام بالنشر المعتمد على OIDC فقط.

وهذا يجعل كلًا من مسار النشر المباشر ومسار الترقية الذي يبدأ ببيتا
موثقين ومرئيين للمشغل.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر 1Password
CLI (`op`) فقط داخل جلسة tmux مخصصة. لا تستدعِ `op`
مباشرة من صدفة الوكيل الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات،
والتنبيهات، ومعالجة OTP قابلة للملاحظة ويمنع تنبيهات المضيف المتكررة.

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
