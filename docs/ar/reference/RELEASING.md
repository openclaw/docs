---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرة إصدارها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، وصناديق التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدارات
x-i18n:
    generated_at: "2026-05-07T13:29:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

يملك OpenClaw ثلاثة مسارات إصدار عامة:

- المستقر: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- التجريبي: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- التطوير: الرأس المتحرك لـ `main`

## تسمية الإصدارات

- إصدار الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار تصحيح مستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار تجريبي لما قبل الإصدار: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفارًا بادئة إلى الشهر أو اليوم
- يعني `latest` إصدار npm المستقر المُرقّى الحالي
- يعني `beta` هدف التثبيت التجريبي الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضيًا؛ يمكن لمشغّلي الإصدار استهداف `latest` صراحةً، أو ترقية بناء تجريبي مُدقّق لاحقًا
- يشحن كل إصدار OpenClaw مستقر حزمة npm وتطبيق macOS معًا؛
  تتحقق الإصدارات التجريبية عادةً من مسار npm/الحزمة وتنشره أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق Mac للإصدار المستقر ما لم يُطلب صراحةً

## وتيرة الإصدارات

- تنتقل الإصدارات عبر المسار التجريبي أولًا
- يأتي الإصدار المستقر فقط بعد التحقق من أحدث إصدار تجريبي
- يقتطع المشرفون عادةً الإصدارات من فرع `release/YYYY.M.D` مُنشأ
  من `main` الحالي، بحيث لا تمنع عملية التحقق من الإصدار وإصلاحاته
  التطوير الجديد على `main`
- إذا دُفع وسم تجريبي أو نُشر واحتاج إلى إصلاح، يقتطع المشرفون
  وسم `-beta.N` التالي بدل حذف الوسم التجريبي القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغّل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد dist-tag، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار المخصص للمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وأكد أن الالتزام الهدف قد دُفع،
   وأكد أن CI الحالي لـ `main` أخضر بما يكفي لإنشاء فرع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، وأبقِ الإدخالات موجهة للمستخدم، ثم التزم بها وادفعها وأعد
   rebase/السحب مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يظل مسار الترقية مغطى، أو سجّل سبب حمله عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. زد كل موضع إصدار مطلوب للوسم المقصود، وشغّل
   `pnpm plugins:sync` حتى تشارك حزم Plugin القابلة للنشر إصدار الإصدار
   وبيانات تعريف التوافق، ثم شغّل التمهيد المحلي الحتمي:
   `pnpm check:test-types` و `pnpm check:architecture` و
   `pnpm build && pnpm ui:build` و `pnpm plugins:sync:check` و
   `pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل مكوّن من 40 حرفًا لفرع الإصدار للتمهيد
   الخاص بالتحقق فقط. احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار أو الوسم أو SHA الالتزام الكامل. هذا هو مدخل التشغيل اليدوي
   الوحيد لصناديق اختبار الإصدار الكبيرة الأربعة: Vitest و Docker و QA Lab و Package.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر ملف أو مسار أو مهمة
   سير عمل أو ملف تعريف حزمة أو مزوّد أو قائمة سماح نماذج فاشلة تثبت الإصلاح.
   أعد تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير الأدلة السابقة قديمة.
9. للإصدار التجريبي، ضع وسم `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   ويطلق نشر كل حزم Plugin القابلة للنشر إلى npm والمجموعة نفسها إلى
   ClawHub بالتوازي، ثم يرقّي أثر تمهيد npm المُحضّر لـ OpenClaw
   باستخدام dist-tag المطابق بمجرد نجاح نشر Plugin إلى npm.
   قد يظل نشر ClawHub قيد التشغيل أثناء نشر OpenClaw إلى npm، لكن سير عمل
   نشر الإصدار لا ينتهي حتى يكتمل مسارا نشر Plugin ومسار نشر OpenClaw إلى npm
   بنجاح. بعد النشر، شغّل قبول الحزمة بعد النشر
   على حزمة `openclaw@YYYY.M.D-beta.N` المنشورة أو حزمة
   `openclaw@beta`. إذا احتاج إصدار ما قبل الإصدار مدفوع أو منشور إلى إصلاح،
   فاقتطع رقم ما قبل الإصدار المطابق التالي؛ لا تحذف إصدار ما قبل الإصدار
   القديم ولا تعد كتابته.
10. للإصدار المستقر، لا تتابع إلا بعد أن يملك الإصدار التجريبي المُدقّق أو
    مرشح الإصدار أدلة التحقق المطلوبة. يمر نشر npm المستقر أيضًا عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أثر التمهيد الناجح عبر
    `preflight_run_id`؛ كما تتطلب جاهزية إصدار macOS المستقر وجود
    ملفات `.zip` و `.dmg` و `.dSYM.zip` المعبأة، وملف `appcast.xml`
    المحدّث على `main`.
11. بعد النشر، شغّل مدقق ما بعد النشر لـ npm، واختبار Telegram E2E الاختياري
    المستقل لحزمة npm المنشورة عندما تحتاج إلى إثبات قناة بعد النشر،
    وترقية dist-tag عند الحاجة، وملاحظات إصدار/ما قبل إصدار GitHub من
    قسم `CHANGELOG.md` المطابق الكامل، وخطوات إعلان الإصدار.

## تمهيد الإصدار

- شغّل `pnpm check:test-types` قبل فحص ما قبل الإصدار حتى يظل TypeScript الخاص بالاختبارات
  مغطى خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل فحص ما قبل الإصدار حتى تكون فحوصات دورات
  الاستيراد الأوسع وحدود البنية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون عناصر
  إصدار `dist/*` المتوقعة وحزمة Control UI موجودة لخطوة التحقق من الحزمة
- شغّل `pnpm plugins:sync` بعد رفع إصدار الجذر وقبل الوسم. فهو يحدّث
  إصدارات حزم Plugin القابلة للنشر، وبيانات توافق OpenClaw النظير/API،
  وبيانات البناء، وبدايات سجل تغييرات Plugin لتطابق إصدار النواة.
  `pnpm plugins:sync:check` هو حارس الإصدار غير المعدّل؛ يفشل سير عمل النشر
  قبل أي تعديل في السجل إذا نُسيت هذه الخطوة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل اعتماد الإصدار
  لبدء كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا
  أو وسمًا أو SHA كاملًا للالتزام، ويطلق `CI` يدويًا، ويطلق
  `OpenClaw Release Checks` لفحص التثبيت السريع، وقبول الحزمة، وفحوصات
  الحزمة عبر أنظمة التشغيل، وتكافؤ QA Lab، ومسارات Matrix وTelegram. تُبقي
  عمليات التشغيل المستقرة/الافتراضية اختبارات live/E2E الشاملة وتمهيد
  مسار إصدار Docker خلف `run_release_soak=true`؛ بينما يفرض
  `release_profile=full` تشغيل التمهيد. ومع `release_profile=full` و
  `rerun_group=all`، يشغّل أيضًا Telegram E2E للحزمة مقابل عنصر
  `release-package-under-test` من فحوصات الإصدار. قدّم
  `npm_telegram_package_spec` بعد النشر عندما يجب أن يثبت Telegram E2E نفسه
  حزمة npm المنشورة أيضًا. قدّم `package_acceptance_package_spec` بعد النشر
  عندما يجب أن يشغّل Package Acceptance مصفوفة الحزمة/التحديث الخاصة به
  مقابل حزمة npm المشحونة بدلًا من العنصر المبني من SHA. قدّم
  `evidence_package_spec` عندما يجب أن يثبت تقرير الأدلة الخاص أن التحقق
  يطابق حزمة npm منشورة من دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد إثباتًا من قناة جانبية
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` مع
  `openclaw@beta` أو `openclaw@latest` أو إصدار محدد بالضبط؛ واستخدم `source=ref`
  لحزم فرع/وسم/SHA موثوق في `package_ref` باستخدام أداة `workflow_ref`
  الحالية؛ واستخدم `source=url` لأرشيف tarball عبر HTTPS مع SHA-256 إلزامي؛
  أو `source=artifact` لأرشيف tarball مرفوع بواسطة تشغيل GitHub Actions آخر.
  يحل سير العمل المرشح إلى `package-under-test`، ويعيد استخدام مجدول إصدار
  Docker E2E مقابل ذلك الأرشيف، ويمكنه تشغيل Telegram QA مقابل الأرشيف نفسه
  باستخدام `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما
  تتضمن مسارات Docker المحددة `published-upgrade-survivor`، يكون عنصر الحزمة
  هو المرشح ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور.
  يستخدم `update-restart-auth` حزمة المرشح بوصفها CLI المثبتة وpackage-under-test
  معًا، بحيث يمرّن مسار إعادة التشغيل المُدار لأمر تحديث المرشح.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  ملفات التعريف الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/إعادة التشغيل/Plugin الأصلية للعنصر من دون OpenWebUI أو ClawHub حي
  - `product`: ملف تعريف الحزمة إضافة إلى قنوات MCP، وتنظيف cron/subagent،
    وبحث الويب من OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` الدقيق لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما لا تحتاج إلا إلى تغطية CI العادية
  الكاملة لمرشح الإصدار. تتجاوز عمليات إطلاق CI اليدوية النطاق المعتمد على
  التغييرات وتفرض أجزاء Linux Node، وأجزاء Plugin المضمنة، وعقود القنوات،
  وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء السريع،
  وفحوصات الوثائق، وSkills الخاصة بـ Python، وWindows، وmacOS، وAndroid،
  ومسارات Control UI i18n.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. فهو يمرّن
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء مقاطع التتبع المصدّرة،
  والسمات المحدودة، وتنقيح المحتوى/المعرّفات من دون الحاجة إلى Opik أو Langfuse
  أو جامع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المعدّل بعد وجود الوسم.
  أطلقه من `release/YYYY.M.D` (أو `main` عند نشر وسم يمكن الوصول إليه من main)،
  ومرّر وسم الإصدار و`preflight_run_id` الناجح الخاص بـ OpenClaw npm،
  وأبقِ نطاق نشر Plugin الافتراضي `all-publishable` ما لم تكن تشغّل إصلاحًا
  مركزًا عن قصد. يسلسل سير العمل نشر Plugin إلى npm، ونشر Plugin إلى ClawHub،
  ونشر OpenClaw إلى npm حتى لا تُنشر حزمة النواة قبل Plugins الخارجية الخاصة بها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ QA Lab الوهمي إضافة إلى ملف
  Matrix الحي السريع ومسار Telegram QA قبل اعتماد الإصدار. تستخدم المسارات
  الحية بيئة `qa-live-shared`؛ كما يستخدم Telegram عقود إيجار بيانات اعتماد
  Convex CI. شغّل سير العمل اليدوي `QA-Lab - All Lanes` مع
  `matrix_profile=all` و`matrix_shards=true` عندما تريد جرد Matrix الكامل للنقل
  والوسائط وE2EE بالتوازي.
- يُعد التحقق من وقت تشغيل التثبيت والترقية عبر أنظمة التشغيل جزءًا من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، وهما يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا وحتميًا ومركزًا على
  العناصر، بينما تبقى الفحوصات الحية الأبطأ في مسارها الخاص حتى لا تؤخر النشر
  أو تمنعه
- يجب إطلاق فحوصات الإصدار التي تحمل أسرارًا عبر `Full Release
Validation` أو من مرجع سير عمل `main`/الإصدار حتى تبقى منطق سير العمل
  والأسرار مضبوطة
- يقبل `OpenClaw Release Checks` فرعًا أو وسمًا أو SHA كاملًا للالتزام ما دام
  الالتزام المحلول يمكن الوصول إليه من فرع OpenClaw أو وسم إصدار
- يقبل فحص ما قبل إصدار `OpenClaw NPM Release` المخصص للتحقق فقط أيضًا
  SHA الحالي الكامل بطول 40 محرفًا لالتزام فرع سير العمل من دون اشتراط وسم
  مدفوع
- مسار SHA هذا مخصص للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط لفحص بيانات تعريف
  الحزمة؛ وما زال النشر الحقيقي يتطلب وسم إصدار حقيقيًا
- يُبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات GitHub-hosted،
  بينما يمكن لمسار التحقق غير المعدّل استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل سير العمل ذلك
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد فحص ما قبل إصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور في بادئة
  مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تهيئة الحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي
  مقابل حزمة npm المنشورة باستخدام مجمع بيانات اعتماد Telegram المؤجرة
  المشتركة. يمكن لعمليات الصيانة المحلية لمرة واحدة حذف متغيرات Convex وتمرير
  بيانات اعتماد env الثلاثة `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- لتشغيل فحص beta السريع الكامل بعد النشر من جهاز أحد المشرفين، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق تحديث npm في Parallels/الهدف الجديد، ويطلق `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل المحدد، وينزّل العنصر، ويطبع تقرير Telegram.
- يمكن للمشرفين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر سير العمل
  اليدوي `NPM Telegram Beta E2E`. وهو يدوي فقط عن قصد ولا يعمل عند كل دمج.
- تستخدم أتمتة إصدار المشرفين الآن نهج الفحص المسبق ثم الترقية:
  - يجب أن ينجح نشر npm الحقيقي في `preflight_run_id` ناجح لـ npm
  - يجب إطلاق نشر npm الحقيقي من فرع `main` نفسه أو فرع
    `release/YYYY.M.D` نفسه الذي شُغّل منه الفحص المسبق الناجح
  - تكون إصدارات npm المستقرة افتراضيًا إلى `beta`
  - يمكن أن يستهدف نشر npm المستقر `latest` صراحة عبر مدخل سير العمل
  - أصبح تعديل npm dist-tag المعتمد على الرمز المميز في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` ما زال يحتاج إلى `NPM_TOKEN` بينما
    يبقي المستودع العام النشر قائمًا على OIDC فقط
  - إصدار `macOS Release` العام مخصص للتحقق فقط؛ عندما يوجد الوسم على فرع
    إصدار فقط لكن سير العمل يُطلق من `main`، عيّن
    `public_release_branch=release/YYYY.M.D`
  - يجب أن يمر نشر mac الخاص الحقيقي عبر `preflight_run_id` و`validate_run_id`
    ناجحين للـ mac الخاص
  - تروّج مسارات النشر الحقيقية العناصر المحضّرة بدلًا من إعادة بنائها مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد
  النشر أيضًا من مسار الترقية نفسه ذي البادئة المؤقتة من `YYYY.M.D` إلى
  `YYYY.M.D-N` حتى لا تترك تصحيحات الإصدار التثبيتات العامة الأقدم صامتة على
  حمولة الإصدار المستقر الأساسي
- يفشل فحص ما قبل إصدار npm مغلقًا ما لم يتضمن tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة متصفح فارغة مرة أخرى
- يتحقق فحص ما بعد النشر أيضًا من وجود نقاط دخول Plugin المنشورة وبيانات تعريف
  الحزمة في تخطيط السجل المثبت. يفشل الإصدار الذي يشحن حمولات وقت تشغيل Plugin
  مفقودة في مدقق ما بعد النشر ولا يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` لحزمة npm pack
  على tarball تحديث المرشح، بحيث يلتقط installer e2e تضخم الحزمة العرضي قبل
  مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت الإضافة، أو مصفوفات اختبار
  الإضافة، فأعد توليد ومراجعة مخرجات مصفوفة `plugin-prerelease-extension-shard`
  المملوكة للمخطط من `.github/workflows/plugin-prerelease.yml` قبل الاعتماد
  حتى لا تصف ملاحظات الإصدار تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح المحدّث:
  - يجب أن ينتهي إصدار GitHub متضمنًا ملفات `.zip` و`.dmg` و`.dSYM.zip` المعبأة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحتفظ التطبيق المعبأ بمعرّف حزمة غير تصحيحي، وعنوان URL غير فارغ
    لتغذية Sparkle، و`CFBundleVersion` عند حد أرضية بناء Sparkle المعياري
    لإصدار ذلك الإصدار أو أعلى منه

## صناديق اختبار الإصدار

`Full Release Validation` هو الطريقة التي يستخدمها المشغلون لبدء كل اختبارات
ما قبل الإصدار من نقطة دخول واحدة. لإثبات التزام مثبت على فرع سريع الحركة،
استخدم المساعد حتى يعمل كل سير عمل فرعي من فرع مؤقت مثبت على SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويطلق `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن `headSha` لكل سير عمل فرعي يطابق
الهدف، ثم يحذف الفرع المؤقت. يمنع هذا إثبات تشغيل فرعي أحدث من `main` عن طريق
الخطأ.

للتحقق من فرع إصدار أو وسم، شغّله من مرجع سير العمل الموثوق `main` ومرّر فرع
الإصدار أو الوسم باعتباره `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

يحل سير العمل مرجع الهدف، ويشغل `CI` اليدوي باستخدام
`target_ref=<release-ref>`، ويشغل `OpenClaw Release Checks`، ويعد أداة أثرية
أصلية باسم `release-package-under-test` للفحوصات الموجهة للحزم، ويشغل
Telegram E2E المستقل للحزمة عندما تكون `release_profile=full` مع
`rerun_group=all` أو عندما تكون `npm_telegram_package_spec` معينة. بعد ذلك
تتفرع `OpenClaw Release Checks` إلى فحص تثبيت سريع، وفحوصات إصدار عبر أنظمة
تشغيل متعددة، وتغطية مسار إصدار Docker المباشرة/E2E عندما يكون التشغيل
الممتد مفعلا، وPackage Acceptance مع ضمان جودة حزمة Telegram، وتكافؤ QA Lab،
وMatrix مباشر، وTelegram مباشر. لا يكون التشغيل الكامل مقبولا إلا عندما يعرض
ملخص `Full Release Validation` نجاح `normal_ci` و`release_checks`. في وضع
full/all، يجب أن ينجح الابن `npm_telegram` أيضا؛ وخارج full/all يتم تخطيه
ما لم يتم توفير `npm_telegram_package_spec` منشور. يتضمن ملخص المدقق النهائي
جداول أبطأ المهام لكل تشغيل ابن، بحيث يستطيع مدير الإصدار رؤية المسار الحرج
الحالي دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) لمعرفة
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، وفروق ملفي التعريف
stable وfull، والأدوات الأثرية، ومقابض إعادة التشغيل المركزة.
تشغل سير العمل الابنة من المرجع الموثوق الذي يشغل `Full Release
Validation`، وعادة يكون `--ref main`، حتى عندما يشير الهدف `ref` إلى فرع
إصدار أقدم أو وسم. لا يوجد إدخال منفصل لمرجع سير عمل Full Release Validation؛
اختر العدة الموثوقة باختيار مرجع تشغيل سير العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات commit دقيق على `main` متحرك؛
لا يمكن أن تكون قيم commit SHA الخام مراجع dispatch لسير العمل، لذلك استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبت.

استخدم `release_profile` لاختيار مدى التغطية المباشرة/المزود:

- `minimum`: أسرع مسار OpenAI/النواة المباشر وDocker الحرج للإصدار
- `stable`: الحد الأدنى بالإضافة إلى تغطية المزود/الخلفية المستقرة لاعتماد الإصدار
- `full`: المستقر بالإضافة إلى تغطية واسعة لمزودي ووسائط التنبيهات

استخدم `run_release_soak=true` مع `stable` عندما تكون المسارات الحاجبة
للإصدار خضراء وتريد فحصا شاملا للمسارات المباشرة/E2E، ومسار إصدار Docker،
ومسحا محدودا لبقاء الترقية من الحزم المنشورة قبل الترقية. يغطي هذا المسح
أحدث أربع حزم مستقرة بالإضافة إلى خطوط الأساس المثبتة `2026.4.23` و`2026.5.2`
وتغطية `2026.4.15` الأقدم، مع إزالة خطوط الأساس المكررة وتقسيم كل خط أساس
إلى مهمة Docker runner خاصة به. يتضمن `full` قيمة `run_release_soak=true`.

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل مرجع الهدف مرة
واحدة باسم `release-package-under-test`، وتعيد استخدام تلك الأداة الأثرية في
فحوصات عبر أنظمة تشغيل متعددة، وPackage Acceptance، وفحوصات Docker لمسار
الإصدار عندما يعمل التشغيل الممتد. هذا يبقي كل البيئات الموجهة للحزم على
نفس البايتات ويتجنب بناء الحزمة مرارا. يستخدم فحص التثبيت السريع عبر أنظمة
تشغيل متعددة لـ OpenAI قيمة `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون متغير
المستودع/المؤسسة معينا، وإلا يستخدم `openai/gpt-5.4`، لأن هذا المسار يثبت
تثبيت الحزمة، والإعداد الأولي، وبدء Gateway، ودورة وكيل مباشرة واحدة بدلا من
قياس أبطأ نموذج افتراضي. تبقى مصفوفة المزودين المباشرة الأوسع هي موضع
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

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركز. إذا فشلت بيئة
واحدة، فاستخدم سير العمل الابن الفاشل، أو المهمة، أو مسار Docker، أو ملف
تعريف الحزمة، أو مزود النموذج، أو مسار QA للإثبات التالي. شغل المظلة الكاملة
مرة أخرى فقط عندما يغير الإصلاح تنسيق الإصدار المشترك أو يجعل دليل كل
البيئات السابق قديما. يعيد المدقق النهائي للمظلة فحص معرفات تشغيل سير العمل
الابنة المسجلة، لذلك بعد إعادة تشغيل سير عمل ابن بنجاح، أعد تشغيل مهمة الأصل
الفاشلة `Verify full validation` فقط.

للاسترداد المحدود، مرر `rerun_group` إلى المظلة. `all` هو تشغيل مرشح
الإصدار الحقيقي، و`ci` يشغل ابن CI العادي فقط، و`plugin-prerelease` يشغل ابن
Plugin الخاص بالإصدار فقط، و`release-checks` يشغل كل بيئة إصدار، ومجموعات
الإصدار الأضيق هي `install-smoke`، و`cross-os`، و`live-e2e`، و`package`،
و`qa`، و`qa-parity`، و`qa-live`، و`npm-telegram`. تتطلب إعادات تشغيل
`npm-telegram` المركزة قيمة `npm_telegram_package_spec`؛ أما تشغيلات full/all
مع `release_profile=full` فتستخدم أداة حزمة release-checks الأثرية. يمكن
لإعادات تشغيل cross-OS المركزة إضافة
`cross_os_suite_filter=windows/packaged-upgrade` أو مرشح نظام تشغيل/مجموعة آخر.
إخفاقات QA في release-checks استشارية؛ ولا يحجب فشل QA فقط التحقق من الإصدار.

### Vitest

بيئة Vitest هي سير عمل الابن `CI` اليدوي. يتجاوز CI اليدوي عمدا النطاق
المتغير ويفرض مخطط الاختبار العادي لمرشح الإصدار: أجزاء Linux Node، وأجزاء
Plugin المجمعة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`،
وفحص بناء سريع، وفحوصات الوثائق، وSkills الخاصة بـ Python، وWindows، وmacOS،
وAndroid، وControl UI i18n.

استخدم هذه البيئة للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبار العادية
الكاملة؟" وهي ليست مطابقة للتحقق من المنتج عبر مسار الإصدار. الأدلة التي
ينبغي الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض URL تشغيل `CI` المشغل
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الأجزاء الفاشلة أو البطيئة من مهام CI عند التحقيق في التراجعات
- أدوات أثرية لتوقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما
  يحتاج التشغيل إلى تحليل أداء

شغل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي، لكن ليس إلى
بيئات Docker أو QA Lab أو المباشرة أو عبر أنظمة تشغيل متعددة أو الحزم:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

توجد بيئة Docker في `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، بالإضافة إلى سير عمل
`install-smoke` في وضع الإصدار. وهي تتحقق من مرشح الإصدار عبر بيئات Docker
المعبأة بدلا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- فحص تثبيت سريع كامل مع تفعيل فحص تثبيت Bun العام البطيء
- إعداد/إعادة استخدام صورة فحص Dockerfile الجذر حسب SHA الهدف، مع تشغيل مهام
  فحص QR والجذر/Gateway والمثبت/Bun كأجزاء install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`،
  و`plugins-runtime-plugins`، و`plugins-runtime-services`،
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إلغاء تثبيت Plugin المجمعة المقسمة
  من `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات المزودين المباشرة/E2E وتغطية نماذج Docker المباشرة عندما تتضمن
  فحوصات الإصدار مجموعات مباشرة

استخدم أدوات Docker الأثرية قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للاسترداد المركز،
استخدم `docker_lanes=<lane[,lane]>` في سير عمل live/E2E القابل لإعادة
الاستخدام بدلا من إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل
المولدة `package_artifact_run_id` السابق ومدخلات صورة Docker المعدة عندما
تكون متاحة، بحيث يمكن لمسار فاشل إعادة استخدام نفس tarball وصور GHCR.

### QA Lab

بيئة QA Lab هي أيضا جزء من `OpenClaw Release Checks`. وهي بوابة الإصدار
لسلوك الوكيل وعلى مستوى القناة، منفصلة عن Vitest وآليات حزم Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ وهمي يقارن مسار مرشح OpenAI بخط أساس Opus 4.6 باستخدام حزمة
  التكافؤ الوكيلية
- ملف تعريف Matrix QA مباشر سريع باستخدام بيئة `qa-live-shared`
- مسار Telegram QA مباشر باستخدام إيجارات بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج قياس بُعد الإصدار إلى إثبات محلي صريح

استخدم هذه البيئة للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات المباشرة؟" احتفظ بعناوين URL للأدوات الأثرية لمسارات التكافؤ
وMatrix وTelegram عند اعتماد الإصدار. تبقى تغطية Matrix الكاملة متاحة كتشغيل
QA-Lab يدوي مقسم بدلا من المسار الافتراضي الحرج للإصدار.

### الحزمة

بيئة Package هي بوابة المنتج القابل للتثبيت. وهي مدعومة من
`Package Acceptance` والمحلل `scripts/resolve-openclaw-package-candidate.mjs`.
يطبع المحلل المرشح إلى tarball باسم `package-under-test` تستهلكه Docker E2E،
ويتحقق من مخزون الحزمة، ويسجل إصدار الحزمة وSHA-256، ويبقي مرجع عدة سير
العمل منفصلا عن مرجع مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: `openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيق
- `source=ref`: حزم فرع `package_ref` موثوق أو وسم أو commit SHA كامل باستخدام
  عدة `workflow_ref` المختارة
- `source=url`: تنزيل `.tgz` عبر HTTPS مع `package_sha256` مطلوب
- `source=artifact`: إعادة استخدام `.tgz` رفعها تشغيل GitHub Actions آخر

تشغل `OpenClaw Release Checks` نظام Package Acceptance مع `source=artifact`،
وأداة حزمة الإصدار المحضرة الأثرية، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`،
و`telegram_mode=mock-openai`. يبقي Package Acceptance الترحيل، والتحديث،
وإعادة تشغيل التحديث بالمصادقة المضبوطة، وتنظيف اعتماد Plugin القديم، وتجهيزات
Plugin غير المتصلة، وتحديث Plugin، وضمان جودة حزمة Telegram مقابل tarball
المحلول نفسه. تستخدم فحوصات الإصدار الحاجبة أحدث خط أساس افتراضي للحزمة
المنشورة؛ ويوسع `run_release_soak=true` أو `release_profile=full` النطاق إلى
كل خط أساس مستقر منشور في npm من `2026.4.23` حتى `latest` بالإضافة إلى
تجهيزات المشكلات المبلغ عنها. استخدم Package Acceptance مع `source=npm` لمرشح
تم شحنه بالفعل، أو `source=ref`/`source=artifact` لحزمة npm tarball محلية
مدعومة بـ SHA قبل النشر. إنه البديل الأصلي في GitHub لمعظم تغطية
الحزمة/التحديث التي كانت تتطلب Parallels سابقا. ما زالت فحوصات الإصدار عبر
أنظمة تشغيل متعددة مهمة للإعداد الأولي، والمثبت، وسلوك المنصة الخاص بنظام
التشغيل، لكن ينبغي لتأكيد منتج الحزمة/التحديث تفضيل Package Acceptance.

القائمة المرجعية المعتمدة للتحقق من التحديث وPlugin هي
[اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins). استخدمها عند
تحديد أي مسار محلي، أو Docker، أو Package Acceptance، أو release-check يثبت
تثبيت/تحديث Plugin، أو تنظيف doctor، أو تغيير ترحيل حزمة منشورة. ترحيل
التحديث المنشور الشامل من كل حزمة مستقرة `2026.4.23+` هو سير عمل يدوي منفصل
باسم `Update Migration`، وليس جزءا من Full Release CI.

تساهل قبول الحزم القديمة محدود زمنيا عن قصد. قد تستخدم الحزم حتى
`2026.4.25` مسار التوافق لسد فجوات البيانات الوصفية المنشورة مسبقا
إلى npm: إدخالات مخزون QA الخاصة غير الموجودة في tarball، وغياب
`gateway install --wrapper`، وغياب ملفات التصحيح في fixture الخاص بـ git
المشتق من tarball، وغياب `update.channel` المستمر، ومواقع سجل تثبيت
Plugin القديمة، وغياب استمرار سجل تثبيت marketplace، وترحيل بيانات
الإعدادات الوصفية أثناء `plugins update`. قد تصدر حزمة `2026.4.26`
المنشورة تحذيرا بشأن ملفات ختم بيانات وصفية للبناء المحلي كانت قد شحنت
بالفعل. يجب أن تستوفي الحزم اللاحقة عقود الحزم الحديثة؛ وتؤدي الفجوات
نفسها إلى فشل تحقق الإصدار.

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

- `smoke`: مسارات سريعة لتثبيت الحزمة/القناة/الوكيل، وشبكة Gateway، وإعادة
  تحميل الإعدادات
- `package`: عقود التثبيت/التحديث/إعادة التشغيل/حزمة Plugin من دون
  ClawHub مباشر؛ وهذا هو الافتراضي لفحص الإصدار
- `product`: `package` بالإضافة إلى قنوات MCP، وتنظيف cron/subagent، وبحث
  OpenAI على الويب، وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` الدقيقة لإعادات التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في Package Acceptance. يمرر سير العمل
tarball المحلول `package-under-test` إلى مسار Telegram؛ وما زال سير عمل
Telegram المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة الدخول العادية للنشر المعدل للحالة. وهو
ينسق سير عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. استخرج وسم الإصدار وحدد commit SHA الخاص به.
2. تحقق من أن الوسم يمكن الوصول إليه من `main` أو `release/*`.
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

نشر مستقر إلى وسم التوزيع الافتراضي beta:

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

استخدم سيري العمل ذوي المستوى الأدنى `Plugin NPM Release` و
`Plugin ClawHub Release` فقط لأعمال الإصلاح أو إعادة النشر المركزة. لإصلاح
Plugin محدد، مرر `plugin_publish_scope=selected` و`plugins=@openclaw/name`
إلى `OpenClaw Release Publish`، أو أطلق سير العمل الفرعي مباشرة عندما يجب
عدم نشر حزمة OpenClaw.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم الإصدار المطلوب، مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ وعندما تكون `preflight_only=true`، قد يكون أيضا commit
  SHA الكامل الحالي بطول 40 حرفا لفرع سير العمل من أجل preflight للتحقق فقط
- `preflight_only`: ‏`true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الفعلي
- `preflight_run_id`: مطلوب في مسار النشر الفعلي لكي يعيد سير العمل استخدام
  tarball المحضر من تشغيل preflight الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ الافتراضي هو `beta`

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم الإصدار المطلوب؛ يجب أن يكون موجودا مسبقا
- `preflight_run_id`: معرف تشغيل preflight ناجح من `OpenClaw NPM Release`؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm المستهدف لحزمة OpenClaw
- `plugin_publish_scope`: الافتراضي هو `all-publishable`؛ استخدم `selected`
  فقط لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: الافتراضي هو `true`؛ اضبطه على `false` فقط عند
  استخدام سير العمل كمنسق إصلاح خاص بالـ Plugin فقط

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو وسم أو commit SHA كامل للتحقق منه. تتطلب الفحوصات الحاملة
  للأسرار أن يكون commit المحلول قابلا للوصول إليه من فرع OpenClaw أو وسم
  إصدار.
- `run_release_soak`: الاشتراك في soak شامل للفحوصات المباشرة/E2E، ومسار
  إصدار Docker، وكل ترقيات all-since upgrade-survivor في فحوصات الإصدار
  المستقرة/الافتراضية. يفرض تفعيله بواسطة `release_profile=full`.

القواعد:

- يمكن نشر وسوم الإصدارات المستقرة والتصحيحية إلى `beta` أو `latest`
- يمكن نشر وسوم الإصدارات التمهيدية beta إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، لا يسمح بإدخال commit SHA كامل إلا
  عندما تكون `preflight_only=true`
- إن `OpenClaw Release Checks` و`Full Release Validation` للتحقق فقط دائما
- يجب أن يستخدم مسار النشر الفعلي `npm_dist_tag` نفسه المستخدم أثناء
  preflight؛ ويتحقق سير العمل من استمرار صحة تلك البيانات الوصفية قبل النشر

## تسلسل إصدار npm المستقر

عند إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام commit SHA الكامل الحالي لفرع سير العمل
     لتشغيل تجريبي للتحقق فقط من سير عمل preflight
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ بـ beta، أو `latest` فقط
   عندما تريد عمدا نشرا مستقرا مباشرا
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو commit
   SHA الكامل عندما تريد CI عادي بالإضافة إلى تغطية cache المطالبات المباشرة،
   وDocker، وQA Lab، وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدا إلى الرسم البياني الحتمي العادي للاختبارات فقط، فشغّل
   سير عمل `CI` اليدوي على مرجع الإصدار بدلا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` باستخدام `tag` نفسه و`npm_dist_tag` نفسه
   و`preflight_run_id` المحفوظ؛ ينشر ذلك Plugins الخارجية إلى npm وClawHub
   قبل ترقية حزمة npm الخاصة بـ OpenClaw
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية تلك النسخة المستقرة من `beta` إلى `latest`
8. إذا نشر الإصدار عمدا مباشرة إلى `latest` وكان يجب أن يتبع `beta` البناء
   المستقر نفسه فورا، فاستخدم سير العمل الخاص نفسه لتوجيه وسمَي التوزيع إلى
   النسخة المستقرة، أو اترك مزامنة الإصلاح الذاتي المجدولة تنقل `beta` لاحقا

يوجد تغيير dist-tag في المستودع الخاص لأسباب أمنية لأنه ما زال يتطلب
`NPM_TOKEN`، بينما يحتفظ المستودع العام بالنشر المعتمد على OIDC فقط.

هذا يبقي كلّا من مسار النشر المباشر ومسار الترقية الذي يبدأ بـ beta موثقين
ومرئيين للمشغل.

إذا اضطر مشرف إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر 1Password
CLI (`op`) داخل جلسة tmux مخصصة فقط. لا تستدع `op` مباشرة من صدفة الوكيل
الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات والتنبيهات ومعالجة OTP قابلة
للملاحظة ويمنع تنبيهات المضيف المتكررة.

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
للدليل التشغيلي الفعلي.

## ذو صلة

- [قنوات الإصدار](/ar/install/development-channels)
