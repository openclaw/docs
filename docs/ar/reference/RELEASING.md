---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرة إصدارها
summary: مسارات الإصدار، قائمة تحقق المشغّل، صناديق التحقق، تسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-05-06T18:02:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- المستقر: إصدارات موسومة تُنشر إلى npm `beta` افتراضياً، أو إلى npm `latest` عند طلب ذلك صراحةً
- التجريبي: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- التطوير: الرأس المتحرك لـ `main`

## تسمية الإصدارات

- إصدار الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار تصحيح مستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار تجريبي قبل الإصدار: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفاراً بادئة للشهر أو اليوم
- `latest` يعني إصدار npm المستقر المُرقّى حالياً
- `beta` يعني هدف التثبيت التجريبي الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضياً؛ يمكن لمشغّلي الإصدار استهداف `latest` صراحةً، أو ترقية بناء تجريبي مُراجع لاحقاً
- كل إصدار OpenClaw مستقر يشحن حزمة npm وتطبيق macOS معاً؛
  تتحقق الإصدارات التجريبية عادةً من مسار npm/الحزمة وتنشره أولاً، مع
  إبقاء إنشاء/توقيع/توثيق تطبيق mac للإصدار المستقر ما لم يُطلب ذلك صراحةً

## وتيرة الإصدارات

- تتحرك الإصدارات وفق نهج التجريبي أولاً
- لا يأتي المستقر إلا بعد التحقق من أحدث إصدار تجريبي
- ينشئ المشرفون الإصدارات عادةً من فرع `release/YYYY.M.D` مُنشأ
  من `main` الحالي، حتى لا يعرقل تحقق الإصدار وإصلاحاته
  التطوير الجديد على `main`
- إذا دُفع وسم تجريبي أو نُشر واحتاج إلى إصلاح، ينشئ المشرفون
  وسم `-beta.N` التالي بدلاً من حذف الوسم التجريبي القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغّل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد وسوم التوزيع، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار المخصص للمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وتأكد أن الالتزام الهدف قد دُفع،
   وتأكد أن CI الحالي لـ `main` أخضر بما يكفي لإنشاء فرع منه.
2. أعد كتابة القسم العلوي من `CHANGELOG.md` من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، واجعل الإدخالات موجهة للمستخدم، ثم ثبّته، وادفعه، وأعد الأساس/اسحب
   مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدارات في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب حمله
   عمداً.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. ارفع كل موضع إصدار مطلوب للوسم المقصود، ثم شغّل
   `pnpm plugins:sync` حتى تشارك حزم Plugin القابلة للنشر إصدار الإصدار
   وبيانات التوافق الوصفية، ثم شغّل الفحص المحلي الحتمي المسبق:
   `pnpm check:test-types`، و `pnpm check:architecture`،
   و `pnpm build && pnpm ui:build`، و `pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل بطول 40 محرفاً لفرع الإصدار للتحقق المسبق فقط.
   احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار، أو الوسم، أو SHA الالتزام الكامل. هذه هي نقطة الدخول اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest، و Docker، و QA Lab، و Package.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر
   ملف أو مسار أو مهمة سير عمل أو ملف تعريف حزمة أو مزود أو قائمة سماح نماذج فاشلة
   تثبت الإصلاح. أعد تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير
   الأدلة السابقة قديمة.
9. للتجريبي، ضع الوسم `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   ويرسل كل حزم Plugin القابلة للنشر إلى npm والمجموعة نفسها إلى
   ClawHub بالتوازي، ثم يرقّي أثر الفحص المسبق المحضّر لـ OpenClaw npm
   بوسم التوزيع المطابق بمجرد نجاح نشر Plugin على npm.
   قد يظل نشر ClawHub جارياً أثناء نشر OpenClaw على npm، لكن
   سير عمل نشر الإصدار لا ينتهي حتى يكتمل مسارا نشر Plugin
   ومسار نشر OpenClaw على npm بنجاح. بعد النشر، شغّل
   قبول الحزمة بعد النشر
   على حزمة `openclaw@YYYY.M.D-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاج إصدار ما قبل الإصدار المدفوع أو المنشور إلى إصلاح،
   فأنشئ رقم ما قبل الإصدار المطابق التالي؛ لا تحذف إصدار ما قبل الإصدار القديم
   ولا تعد كتابته.
10. للمستقر، لا تتابع إلا بعد أن يمتلك الإصدار التجريبي أو مرشح الإصدار المُراجع
    أدلة التحقق المطلوبة. يمر نشر npm المستقر أيضاً عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أثر الفحص المسبق الناجح عبر
    `preflight_run_id`؛ ويتطلب استعداد إصدار macOS المستقر أيضاً
    ملفات `.zip` و `.dmg` و `.dSYM.zip` المحزومة، وملف `appcast.xml` محدثاً على `main`.
11. بعد النشر، شغّل متحقق ما بعد النشر لـ npm، واختبار Telegram E2E الاختياري
    المستقل لـ npm المنشور عندما تحتاج إلى إثبات القناة بعد النشر،
    وترقية وسم التوزيع عند الحاجة، وملاحظات إصدار/ما قبل إصدار GitHub من
    قسم `CHANGELOG.md` المطابق الكامل، وخطوات إعلان الإصدار.

## الفحص المسبق للإصدار

- شغّل `pnpm check:test-types` قبل فحص ما قبل الإصدار حتى يبقى TypeScript للاختبارات
  مشمولًا خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل فحص ما قبل الإصدار حتى تكون فحوصات دورات
  الاستيراد الأوسع وحدود البنية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون آثار إصدار
  `dist/*` المتوقعة وحزمة واجهة Control UI موجودة لخطوة تحقق الحزمة
- شغّل `pnpm plugins:sync` بعد رفع إصدار الجذر وقبل وضع الوسم. يحدّث ذلك
  إصدارات حزم Plugin القابلة للنشر، وبيانات توافق OpenClaw للنظير/API،
  وبيانات البناء، ومسودات سجلات تغييرات Plugin لتطابق إصدار النواة.
  `pnpm plugins:sync:check` هو حارس الإصدار غير المُعدِّل؛ ويفشل سير عمل النشر
  قبل أي تعديل في السجل إذا نُسيت هذه الخطوة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل موافقة الإصدار لبدء
  جميع صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا أو وسمًا
  أو SHA التزامًا كاملًا، ويطلق `CI` يدويًا، ويطلق `OpenClaw Release Checks`
  لفحص تثبيت smoke، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل،
  وتكافؤ QA Lab، ومسارات Matrix وTelegram. تُبقي التشغيلات المستقرة/الافتراضية
  اختبارات live/E2E الشاملة ونقع مسار إصدار Docker خلف
  `run_release_soak=true`؛ بينما يفرض `release_profile=full` تشغيل النقع.
  مع `release_profile=full` و`rerun_group=all`، يشغّل أيضًا Telegram E2E للحزمة
  مقابل أثر `release-package-under-test` من فحوصات الإصدار. قدّم
  `npm_telegram_package_spec` بعد النشر عندما يجب أن يثبت Telegram E2E نفسه
  حزمة npm المنشورة أيضًا. قدّم `package_acceptance_package_spec` بعد النشر
  عندما يجب أن يشغّل Package Acceptance مصفوفة الحزمة/التحديث لديه مقابل حزمة
  npm المشحونة بدلًا من الأثر المبني من SHA. قدّم `evidence_package_spec`
  عندما يجب أن يثبت تقرير الأدلة الخاص أن التحقق يطابق حزمة npm منشورة دون
  فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد دليلًا من قناة جانبية
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` لـ
  `openclaw@beta` أو `openclaw@latest` أو إصدار دقيق؛ و`source=ref` لحزم فرع/وسم/SHA
  موثوق به في `package_ref` باستخدام عدة `workflow_ref` الحالية؛ و`source=url`
  لأرشيف tarball عبر HTTPS مع SHA-256 مطلوب؛ أو `source=artifact` لأرشيف tarball
  رُفع بواسطة تشغيل GitHub Actions آخر. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول Docker E2E للإصدار مقابل ذلك
  الأرشيف، ويمكنه تشغيل Telegram QA مقابل الأرشيف نفسه باستخدام
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن
  مسارات Docker المحددة `published-upgrade-survivor`، يكون أثر الحزمة هو
  المرشح وتحدد `published_upgrade_survivor_baseline` خط الأساس المنشور.
  يستخدم `update-restart-auth` حزمة المرشح بوصفها كلًا من CLI المثبتة
  وpackage-under-test بحيث يمرّن مسار إعادة التشغيل المُدار لأمر تحديث المرشح.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  ملفات تعريف شائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/إعادة التشغيل/Plugin الأصلية للأثر دون OpenWebUI أو ClawHub مباشر
  - `product`: ملف تعريف الحزمة إضافةً إلى قنوات MCP، وتنظيف cron/subagent،
    وبحث OpenAI على الويب، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` دقيق لإعادة تشغيل مركّزة
- شغّل سير العمل اليدوي `CI` مباشرةً عندما تحتاج فقط إلى تغطية CI العادية
  الكاملة لمرشح الإصدار. تتجاوز إطلاقات CI اليدوية تحديد النطاق حسب التغييرات
  وتفرض شظايا Linux Node، وشظايا Plugin المجمّعة، وعقود القنوات، وتوافق
  Node 22، و`check`، و`check-additional`، وفحص البناء smoke، وفحوصات المستندات،
  وSkills في Python، وWindows، وmacOS، وAndroid، ومسارات i18n لواجهة Control UI.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياس الإصدار عن بُعد. يمرّن
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء امتدادات trace المُصدّرة،
  والسمات المحدودة، وتنقيح المحتوى/المعرّفات دون الحاجة إلى Opik أو Langfuse
  أو مجمّع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المُعدِّل بعد وجود الوسم.
  أطلقه من `release/YYYY.M.D` (أو من `main` عند نشر وسم يمكن الوصول إليه من
  main)، ومرّر وسم الإصدار و`preflight_run_id` ناجحًا لـ OpenClaw npm، وأبقِ
  نطاق نشر Plugin الافتراضي `all-publishable` ما لم تكن تشغّل إصلاحًا مركّزًا
  عمدًا. يسلسل سير العمل نشر Plugin على npm، ونشر Plugin على ClawHub، ونشر
  OpenClaw على npm حتى لا تُنشر الحزمة الأساسية قبل Plugins الخارجية الخاصة بها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ محاكاة QA Lab إضافةً إلى
  ملف تعريف Matrix المباشر السريع ومسار Telegram QA قبل موافقة الإصدار. تستخدم
  المسارات المباشرة بيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا تأجيرات
  بيانات اعتماد Convex CI. شغّل سير العمل اليدوي `QA-Lab - All Lanes` مع
  `matrix_profile=all` و`matrix_shards=true` عندما تريد مخزون Matrix الكامل
  للنقل والوسائط وE2EE بالتوازي.
- تحقق وقت تشغيل التثبيت والترقية عبر أنظمة التشغيل جزء من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، اللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرةً
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا، وحتميًا، ومركّزًا على
  الآثار، بينما تبقى الفحوصات المباشرة الأبطأ في مسارها الخاص كي لا توقف
  النشر أو تحظره
- يجب إطلاق فحوصات الإصدار الحاملة للأسرار عبر `Full Release
Validation` أو من مرجع سير العمل `main`/release حتى تبقى منطق سير العمل
  والأسرار مضبوطة
- يقبل `OpenClaw Release Checks` فرعًا أو وسمًا أو SHA التزامًا كاملًا ما دام
  الالتزام المحلول يمكن الوصول إليه من فرع OpenClaw أو وسم إصدار
- يقبل فحص ما قبل الإصدار للتحقق فقط في `OpenClaw NPM Release` أيضًا SHA
  الالتزام الحالي الكامل ذي 40 محرفًا لفرع سير العمل دون الحاجة إلى وسم مدفوع
- مسار SHA هذا للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، يصطنع سير العمل `v<package.json version>` فقط لفحص بيانات الحزمة؛
  ما زال النشر الحقيقي يتطلب وسم إصدار حقيقيًا
- يبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات مستضافة لدى
  GitHub، بينما يمكن لمسار التحقق غير المُعدِّل استخدام مشغلات Blacksmith Linux
  الأكبر
- يشغّل ذلك سير العمل
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد فحص ما قبل إصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/correction المطابق) قبل الموافقة
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/correction المطابق) للتحقق من مسار تثبيت السجل المنشور في
  بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تهيئة الحزمة المثبتة، وإعداد Telegram، وTelegram E2E حقيقي مقابل
  حزمة npm المنشورة باستخدام مجمع بيانات اعتماد Telegram المشتركة المؤجرة.
  يمكن لعمليات maintainer المحلية لمرة واحدة حذف متغيرات Convex وتمرير بيانات
  اعتماد البيئة الثلاث `OPENCLAW_QA_TELEGRAM_*` مباشرةً.
- لتشغيل smoke الكامل بعد نشر beta من جهاز maintainer، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق npm update/fresh-target في Parallels، ويطلق `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل الدقيق، ويحمّل الأثر، ويطبع تقرير Telegram.
- يمكن للمشرفين تشغيل الفحص نفسه بعد النشر من GitHub Actions عبر سير العمل
  اليدوي `NPM Telegram Beta E2E`. إنه يدوي فقط عمدًا ولا يعمل عند كل دمج.
- تستخدم أتمتة إصدار maintainer الآن أسلوب فحص ما قبل الإصدار ثم الترقية:
  - يجب أن يمر نشر npm الحقيقي بـ `preflight_run_id` ناجح لـ npm
  - يجب إطلاق نشر npm الحقيقي من فرع `main` نفسه أو فرع
    `release/YYYY.M.D` نفسه مثل تشغيل فحص ما قبل الإصدار الناجح
  - تصدر إصدارات npm المستقرة افتراضيًا إلى `beta`
  - يمكن لنشر npm المستقر استهداف `latest` صراحةً عبر مُدخل سير العمل
  - يعيش تعديل dist-tag في npm المعتمد على الرمز الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` ما زال يحتاج إلى `NPM_TOKEN` بينما
    يحتفظ المستودع العام بالنشر عبر OIDC فقط
  - `macOS Release` العام للتحقق فقط؛ عندما يوجد وسم على فرع إصدار فقط لكن
    يُطلق سير العمل من `main`، اضبط `public_release_branch=release/YYYY.M.D`
  - يجب أن يمر نشر mac الخاص الحقيقي بـ `preflight_run_id` و`validate_run_id`
    ناجحين لـ mac الخاص
  - تروّج مسارات النشر الحقيقية الآثار المُحضّرة بدلًا من إعادة بنائها مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد
  النشر أيضًا من مسار ترقية البادئة المؤقتة نفسه من `YYYY.M.D` إلى
  `YYYY.M.D-N` حتى لا تترك تصحيحات الإصدار بصمت عمليات التثبيت العامة الأقدم
  على حمولة الإصدار المستقر الأساسي
- يفشل فحص ما قبل إصدار npm بصورة مغلقة ما لم يتضمن أرشيف tarball كلًا من
  `dist/control-ui/index.html` وحمولة `dist/control-ui/assets/` غير فارغة حتى لا
  نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق ما بعد النشر أيضًا من أن نقاط دخول Plugin المنشورة وبيانات الحزمة
  موجودة في تخطيط السجل المثبت. الإصدار الذي يشحن حمولات تشغيل Plugin مفقودة
  يفشل مدقق postpublish ولا يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` لحزمة npm على
  tarball تحديث المرشح، حتى يلتقط installer e2e تضخم الحزمة العرضي قبل مسار
  نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت Plugins، أو مصفوفات اختبارات
  Plugins، فأعد توليد ومراجعة مخرجات مصفوفة `plugin-prerelease-extension-shard`
  المملوكة للمخطط من `.github/workflows/plugin-prerelease.yml` قبل الموافقة حتى
  لا تصف ملاحظات الإصدار تخطيط CI قديمًا
- تشمل جاهزية إصدار macOS المستقر أيضًا أسطح التحديث:
  - يجب أن ينتهي إصدار GitHub وبداخله ملفات `.zip` و`.dmg` و`.dSYM.zip` المحزّمة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحتفظ التطبيق المحزّم بمعرّف حزمة غير debug، وعنوان URL تغذية Sparkle
    غير فارغ، و`CFBundleVersion` عند أو فوق حد بناء Sparkle القياسي لذلك إصدار

## صناديق اختبار الإصدار

`Full Release Validation` هي الطريقة التي يستخدمها المشغّلون لبدء جميع اختبارات
ما قبل الإصدار من نقطة دخول واحدة. لإثبات التزام مثبت على فرع سريع الحركة،
استخدم المساعد حتى يعمل كل سير عمل فرعي من فرع مؤقت مثبت عند SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويطلق `Full Release Validation` من ذلك
الفرع مع `ref=<sha>`، ويتحقق من أن كل `headSha` لسير عمل فرعي يطابق الهدف، ثم
يحذف الفرع المؤقت. يمنع هذا إثبات تشغيل فرعي أحدث لـ `main` عن طريق الخطأ.

للتحقق من فرع إصدار أو وسم، شغّله من مرجع سير العمل `main` الموثوق ومرّر فرع
الإصدار أو الوسم بوصفه `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

يحلّ سير العمل مرجع الهدف، ويطلق `CI` يدويًا مع
`target_ref=<release-ref>`، ويطلق `OpenClaw Release Checks`، ويحضّر أداة
أصلية `release-package-under-test` للفحوصات المواجهة للحزمة، ويطلق اختبار
Telegram E2E مستقلًا للحزمة عندما تكون `release_profile=full` مع
`rerun_group=all` أو عندما يتم تعيين `npm_telegram_package_spec`. ثم توسّع
`OpenClaw Release Checks` النطاق إلى اختبار دخان التثبيت، وفحوصات الإصدار عبر
أنظمة تشغيل متعددة، وتغطية مسار إصدار Docker الحية/E2E عندما يكون اختبار
التحمّل مفعّلًا، وقبول الحزمة مع QA حزمة Telegram، وتكافؤ مختبر QA، وMatrix
حي، وTelegram حي. لا يكون التشغيل الكامل مقبولًا إلا عندما يعرض ملخص
`Full Release Validation`
كلًا من `normal_ci` و`release_checks` على أنهما ناجحان. في وضع full/all، يجب
أن يكون الفرع الابن `npm_telegram` ناجحًا أيضًا؛ وخارج full/all يتم تخطيه ما
لم يتم توفير `npm_telegram_package_spec` منشور. يتضمن ملخص المتحقق النهائي
جداول أبطأ المهام لكل تشغيل ابن، حتى يتمكن مدير الإصدار من رؤية المسار الحرج
الحالي من دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، والفروق بين ملفي
التعريف المستقر والكامل، والأدوات الأصلية، ومقابض إعادة التشغيل المركزة.
تُطلق سير العمل الأبناء من المرجع الموثوق الذي يشغّل `Full Release
Validation`، وهو عادةً `--ref main`، حتى عندما يشير `ref` الهدف إلى فرع إصدار
أقدم أو وسم أقدم. لا يوجد إدخال منفصل لمرجع سير عمل التحقق الكامل من الإصدار؛
اختر حزام الاختبار الموثوق باختيار مرجع تشغيل سير العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات الالتزام الدقيق على `main` المتحرك؛
لا يمكن أن تكون قيم SHA الخام للالتزامات مراجع إطلاق لسير العمل، لذا استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبت.

استخدم `release_profile` لاختيار اتساع التغطية الحية/المزوّد:

- `minimum`: أسرع مسار OpenAI/النواة الحي وDocker الحرج للإصدار
- `stable`: الحد الأدنى بالإضافة إلى تغطية المزوّد/الخلفية المستقرة للموافقة على الإصدار
- `full`: المستقر بالإضافة إلى تغطية مزوّدين/وسائط استشارية واسعة

استخدم `run_release_soak=true` مع `stable` عندما تكون المسارات الحاجبة للإصدار
خضراء وتريد المسح الشامل للحية/E2E، ومسار إصدار Docker، ومسح الناجين من
الترقية المنشورة المحدود قبل الترويج. يغطي ذلك المسح أحدث أربع حزم مستقرة
بالإضافة إلى خطي أساس مثبتين `2026.4.23` و`2026.5.2` وتغطية أقدم لـ
`2026.4.15`، مع إزالة خطوط الأساس المكررة وتقسيم كل خط أساس إلى مهمة مشغل
Docker خاصة به. يتضمن `full` ضمنيًا `run_release_soak=true`.

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل مرجع الهدف مرة
واحدة باسم `release-package-under-test` وتعيد استخدام تلك الأداة الأصلية في
الفحوصات عبر أنظمة تشغيل متعددة، وقبول الحزمة، وفحوصات Docker لمسار الإصدار
عند تشغيل اختبار التحمّل. هذا يُبقي كل صناديق الاختبار المواجهة للحزمة على
نفس البايتات ويتجنب تكرار بناء الحزمة. يستخدم اختبار دخان تثبيت OpenAI عبر
أنظمة تشغيل متعددة `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يتم تعيين متغير
المستودع/المؤسسة، وإلا يستخدم `openai/gpt-5.4`، لأن هذا المسار يثبت تثبيت
الحزمة، والتهيئة الأولية، وبدء تشغيل Gateway، ودورة وكيل حية واحدة بدلًا من
قياس أداء أبطأ نموذج افتراضي. تبقى مصفوفة المزوّدين الحية الأوسع هي مكان
التغطية الخاصة بالنماذج.

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

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركّز. إذا فشل صندوق
واحد، فاستخدم سير العمل الابن الفاشل أو المهمة أو مسار Docker أو ملف تعريف
الحزمة أو مزوّد النموذج أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة
أخرى فقط عندما يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل دليل كل الصناديق
السابق قديمًا. يعيد المتحقق النهائي للمظلة فحص معرّفات تشغيل سير العمل الأبناء
المسجلة، لذا بعد إعادة تشغيل سير عمل ابن بنجاح، أعد تشغيل مهمة الأب الفاشلة
`Verify full validation` فقط.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل مرشح الإصدار
الحقيقي، و`ci` يشغّل ابن CI العادي فقط، و`plugin-prerelease` يشغّل ابن Plugin
الخاص بالإصدار فقط، و`release-checks` يشغّل كل صناديق الإصدار، ومجموعات
الإصدار الأضيق هي `install-smoke`، و`cross-os`، و`live-e2e`، و`package`،
و`qa`، و`qa-parity`، و`qa-live`، و`npm-telegram`.
تتطلب عمليات إعادة التشغيل المركزة لـ `npm-telegram` وجود
`npm_telegram_package_spec`؛ وتستخدم عمليات full/all مع `release_profile=full`
أداة حزمة release-checks الأصلية. يمكن لعمليات إعادة التشغيل المركزة عبر أنظمة
تشغيل متعددة إضافة `cross_os_suite_filter=windows/packaged-upgrade` أو مرشح
نظام تشغيل/مجموعة آخر. إخفاقات QA في release-checks استشارية؛ فشل QA فقط لا
يحجب التحقق من الإصدار.

### Vitest

صندوق Vitest هو سير العمل الابن `CI` اليدوي. يتجاوز CI اليدوي عمدًا تحديد
النطاق حسب التغييرات ويفرض مخطط الاختبار العادي لمرشح الإصدار: مقاطع Linux
Node، ومقاطع Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`،
و`check-additional`، واختبار دخان البناء، وفحوصات المستندات، وSkills الخاصة
بـ Python، وWindows، وmacOS، وAndroid، وControl UI i18n.

استخدم هذا الصندوق للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية
الكاملة؟" إنه ليس مماثلًا للتحقق من المنتج في مسار الإصدار. الدليل المطلوب
الاحتفاظ به:

- ملخص `Full Release Validation` الذي يعرض عنوان URL لتشغيل `CI` المُطلق
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء المقاطع الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- أدوات توقيت Vitest الأصلية مثل `.artifacts/vitest-shard-timings.json` عندما يحتاج التشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي ولكن لا يحتاج
إلى صناديق Docker أو QA Lab أو الحية أو عبر أنظمة التشغيل أو الحزمة:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker في `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، بالإضافة إلى سير عمل
`install-smoke` في وضع الإصدار. يتحقق من مرشح الإصدار عبر بيئات Docker
المحزّمة بدلًا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- اختبار دخان تثبيت كامل مع تفعيل اختبار دخان التثبيت العالمي البطيء لـ Bun
- تحضير/إعادة استخدام صورة اختبار دخان Dockerfile الجذر حسب SHA الهدف، مع تشغيل مهام QR، والجذر/Gateway، والمثبّت/Bun كمقاطع install-smoke منفصلة
- مسارات E2E الخاصة بالمستودع
- مقاطع Docker لمسار الإصدار: `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، و`plugins-runtime-install-a`، و`plugins-runtime-install-b`، و`plugins-runtime-install-c`، و`plugins-runtime-install-d`، و`plugins-runtime-install-e`، و`plugins-runtime-install-f`، و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل مقطع `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إلغاء تثبيت Plugin المضمّنة المقسمة من `bundled-plugin-install-uninstall-0` حتى `bundled-plugin-install-uninstall-23`
- مجموعات المزوّدين الحية/E2E وتغطية نموذج Docker الحي عندما تتضمن فحوصات الإصدار مجموعات حية

استخدم أدوات Docker الأصلية قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للاسترداد المركّز،
استخدم `docker_lanes=<lane[,lane]>` في سير العمل القابل لإعادة الاستخدام
للحية/E2E بدلًا من إعادة تشغيل كل مقاطع الإصدار. تتضمن أوامر إعادة التشغيل
المولدة `package_artifact_run_id` سابقًا ومدخلات صورة Docker المحضّرة عند
توفرها، بحيث يمكن لمسار فاشل إعادة استخدام نفس tarball وصور GHCR.

### QA Lab

صندوق QA Lab هو أيضًا جزء من `OpenClaw Release Checks`. إنه بوابة الإصدار
للسلوك الوكيلي ومستوى القناة، منفصلًا عن Vitest وآليات حزمة Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ وهمي يقارن مسار OpenAI المرشح بخط أساس Opus 4.6 باستخدام حزمة التكافؤ الوكيلي
- ملف تعريف QA سريع وحّي لـ Matrix باستخدام بيئة `qa-live-shared`
- مسار QA حي لـ Telegram باستخدام عقود إيجار بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج قياس الإصدار عن بُعد إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات الحية؟" احتفظ بعناوين URL للأدوات الأصلية لمسارات التكافؤ
وMatrix وTelegram عند الموافقة على الإصدار. تبقى تغطية Matrix الكاملة متاحة
كتشغيل QA-Lab يدوي مقسّم بدلًا من المسار الافتراضي الحرج للإصدار.

### الحزمة

صندوق الحزمة هو بوابة المنتج القابل للتثبيت. وهو مدعوم بـ
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبّع المحلل المرشح إلى
tarball `package-under-test` الذي يستهلكه Docker E2E، ويتحقق من مخزون الحزمة،
ويسجل إصدار الحزمة وSHA-256، ويبقي مرجع حزام اختبار سير العمل منفصلًا عن مرجع
مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: `openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيق
- `source=ref`: حزّم فرع `package_ref` موثوقًا أو وسمًا أو SHA التزامًا كاملًا مع حزام `workflow_ref` المحدد
- `source=url`: نزّل ملف `.tgz` عبر HTTPS مع `package_sha256` المطلوب
- `source=artifact`: أعد استخدام `.tgz` رُفع بواسطة تشغيل GitHub Actions آخر

تشغّل `OpenClaw Release Checks` قبول الحزمة مع `source=artifact`، وأداة حزمة
الإصدار الأصلية المحضّرة، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`،
و`telegram_mode=mock-openai`. يُبقي قبول الحزمة الترحيل، والتحديث، وإعادة
تشغيل تحديث المصادقة المضبوطة، وتنظيف اعتماد Plugin القديم، وتركيبات Plugin
غير المتصلة، وتحديث Plugin، وQA حزمة Telegram ضد نفس tarball المحلول. تستخدم
فحوصات الإصدار الحاجبة خط أساس أحدث حزمة منشورة افتراضيًا؛ ويوسّع
`run_release_soak=true` أو
`release_profile=full` ذلك إلى كل خط أساس مستقر منشور على npm من `2026.4.23`
حتى `latest` بالإضافة إلى تركيبات المشكلات المبلغ عنها. استخدم قبول الحزمة مع
`source=npm` لمرشح تم شحنه بالفعل، أو `source=ref`/`source=artifact` لملف
tarball محلي من npm مدعوم بـ SHA قبل النشر. إنه البديل الأصلي في GitHub لمعظم
تغطية الحزمة/التحديث التي كانت تتطلب Parallels سابقًا. ما زالت فحوصات الإصدار
عبر أنظمة التشغيل مهمة للتهيئة الأولية الخاصة بنظام التشغيل، والمثبّت، وسلوك
المنصة، لكن يجب أن تفضل عملية التحقق من المنتج للحزمة/التحديث قبول الحزمة.

قائمة التحقق الرسمية للتحديث والتحقق من Plugin هي
[اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins). استخدمها عند تحديد
أي مسار محلي أو Docker أو قبول الحزمة أو فحص إصدار يثبت تثبيت/تحديث Plugin أو
تنظيف الطبيب أو تغيير ترحيل حزمة منشورة. ترحيل التحديث المنشور الشامل من كل
حزمة مستقرة `2026.4.23+` هو سير عمل يدوي منفصل `Update Migration`، وليس جزءًا
من CI الكامل للإصدار.

تساهل قبول الحزم القديم محدد زمنياً عمداً. يجوز للحزم حتى
`2026.4.25` استخدام مسار التوافق لفجوات البيانات الوصفية المنشورة سابقاً
إلى npm: مدخلات مخزون QA الخاص غير الموجودة في الأرشيف المضغوط، وغياب
`gateway install --wrapper`، وغياب ملفات التصحيح في تجهيزة git المشتقة من
الأرشيف المضغوط، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت
Plugin القديمة، وغياب استمرار سجلات التثبيت في السوق، وترحيل بيانات
تعريف الإعدادات أثناء `plugins update`. قد تصدر حزمة `2026.4.26` المنشورة
تحذيراً بشأن ملفات ختم بيانات تعريف البناء المحلي التي شُحنت سابقاً. يجب
أن تفي الحزم اللاحقة بعقود الحزم الحديثة؛ وتؤدي الفجوات نفسها إلى فشل
تحقق الإصدار.

استخدم ملفات تعريف قبول الحزمة الأوسع عندما يكون سؤال الإصدار متعلقاً
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

- `smoke`: مسارات سريعة لتثبيت الحزمة/القناة/الوكيل، وشبكة Gateway،
  وإعادة تحميل الإعدادات
- `package`: عقود التثبيت/التحديث/إعادة التشغيل/حزم Plugin من دون
  ClawHub مباشر؛ وهذا هو الافتراضي لفحص الإصدار
- `product`: `package` إضافة إلى قنوات MCP، وتنظيف Cron/الوكيل الفرعي،
  وبحث الويب من OpenAI، وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` الدقيقة لإعادات التشغيل المركزة

لإثبات Telegram الخاص بمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في قبول الحزمة. يمرر سير العمل أرشيف
`package-under-test` المضغوط بعد حله إلى مسار Telegram؛ ولا يزال سير عمل
Telegram المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة دخول النشر المعتادة التي تُجري تغييرات. وهو
ينسق مسارات عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. انتقل إلى وسم الإصدار وحدد SHA الالتزام الخاص به.
2. تحقق من أن الوسم قابل للوصول من `main` أو `release/*`.
3. شغّل `pnpm plugins:sync:check`.
4. أطلق `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. أطلق `Plugin ClawHub Release` بالنطاق وSHA نفسيهما.
6. أطلق `OpenClaw NPM Release` مع وسم الإصدار، ووسم توزيع npm، و
   `preflight_run_id` المحفوظ.

مثال نشر beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

نشر الإصدار المستقر إلى وسم توزيع beta الافتراضي:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

ترويج الإصدار المستقر مباشرة إلى `latest` صريح:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

استخدم مساري العمل ذوي المستوى الأدنى `Plugin NPM Release` و`Plugin ClawHub Release`
فقط لأعمال الإصلاح أو إعادة النشر المركزة. لإصلاح Plugin محدد، مرر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أطلق سير العمل الفرعي مباشرة عندما يجب عدم
نشر حزمة OpenClaw.

## مُدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المُدخلات التي يتحكم فيها المشغّل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ عندما تكون `preflight_only=true`، يمكن أن يكون أيضاً
  SHA الالتزام الكامل الحالي المؤلف من 40 محرفاً لفرع سير العمل من أجل تمهيد
  للتحقق فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الفعلي
- `preflight_run_id`: مطلوب في مسار النشر الفعلي كي يعيد سير العمل استخدام
  الأرشيف المضغوط المُعد من تشغيل التمهيد الناجح
- `npm_dist_tag`: وسم npm الهدف لمسار النشر؛ قيمته الافتراضية `beta`

يقبل `OpenClaw Release Publish` هذه المُدخلات التي يتحكم فيها المشغّل:

- `tag`: وسم إصدار مطلوب؛ يجب أن يكون موجوداً مسبقاً
- `preflight_run_id`: معرّف تشغيل تمهيد `OpenClaw NPM Release` الناجح؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm الهدف لحزمة OpenClaw
- `plugin_publish_scope`: قيمته الافتراضية `all-publishable`؛ استخدم
  `selected` فقط لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: قيمته الافتراضية `true`؛ اضبطه على `false` فقط
  عند استخدام سير العمل كمنسق إصلاح خاص بـ Plugin فقط

يقبل `OpenClaw Release Checks` هذه المُدخلات التي يتحكم فيها المشغّل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق منه. تتطلب الفحوصات التي تحمل
  أسراراً أن يكون الالتزام المحدد قابلاً للوصول من فرع OpenClaw أو وسم
  إصدار.
- `run_release_soak`: اختر تشغيل اختبار التحمل الشامل لمسارات live/E2E،
  ومسار إصدار Docker، واختبار تحمل نجاة الترقية منذ جميع الإصدارات في
  فحوصات الإصدار المستقر/الافتراضي. يُفرض تفعيله بواسطة `release_profile=full`.

القواعد:

- يجوز لوسوم الإصدار المستقر والتصحيح النشر إلى `beta` أو `latest`
- يجوز لوسوم ما قبل الإصدار beta النشر إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، لا يُسمح بإدخال SHA الالتزام الكامل إلا
  عندما تكون `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` هما دائماً للتحقق فقط
- يجب أن يستخدم مسار النشر الفعلي `npm_dist_tag` نفسه المستخدم أثناء التمهيد؛
  يتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر

## تسلسل إصدار npm المستقر

عند إنشاء إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الكامل الحالي لفرع سير العمل
     لتشغيل تجريبي للتحقق فقط من سير عمل التمهيد
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ بـ beta، أو `latest` فقط
   عندما تريد عمداً نشراً مستقراً مباشراً
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو SHA التزام
   كامل عندما تريد CI عادية إضافة إلى تغطية ذاكرة التخزين المؤقت المباشرة
   للمطالبات، وDocker، وQA Lab، وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمداً إلى رسم الاختبارات العادي الحتمي فقط، فشغّل سير عمل
   `CI` اليدوي على مرجع الإصدار بدلاً من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` مع `tag` نفسه، و`npm_dist_tag` نفسه،
   و`preflight_run_id` المحفوظ؛ ينشر Plugins الخارجية إلى npm وClawHub قبل
   ترويج حزمة OpenClaw على npm
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
8. إذا نُشر الإصدار عمداً مباشرة إلى `latest` وكان يجب أن يتبع `beta` نفس
   البناء المستقر فوراً، فاستخدم سير العمل الخاص نفسه لتوجيه وسمَي التوزيع
   كليهما إلى الإصدار المستقر، أو اترك مزامنة الإصلاح الذاتي المجدولة تنقل
   `beta` لاحقاً

تغيير وسم التوزيع موجود في المستودع الخاص لأسباب أمنية لأنه لا يزال
يتطلب `NPM_TOKEN`، بينما يبقي المستودع العام النشر مقتصراً على OIDC.

يبقي ذلك مسار النشر المباشر ومسار الترويج الذي يبدأ بـ beta موثقين ومرئيين
للمشغّل.

إذا اضطر مشرف إلى اللجوء إلى مصادقة npm المحلية، فشغّل أي أوامر 1Password
CLI (`op`) داخل جلسة tmux مخصصة فقط. لا تستدعِ `op` مباشرة من صدفة الوكيل
الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات والتنبيهات ومعالجة OTP قابلة
للملاحظة ويمنع تنبيهات المضيف المتكررة.

## مراجع عامة

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
من أجل دليل التشغيل الفعلي.

## ذات صلة

- [قنوات الإصدار](/ar/install/development-channels)
