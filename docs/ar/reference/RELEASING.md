---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من صحة الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرتها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، وصناديق التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-05-05T01:50:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاث قنوات إصدار عامة:

- المستقر: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- التجريبي: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- التطوير: الرأس المتحرك لـ `main`

## تسمية الإصدارات

- إصدار الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار تصحيح مستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار تجريبي ما قبل الإصدار: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفارًا بادئة إلى الشهر أو اليوم
- `latest` يعني إصدار npm المستقر والمروّج الحالي
- `beta` يعني هدف التثبيت التجريبي الحالي
- تُنشر إصدارات المستقر وتصحيحات المستقر إلى npm `beta` افتراضيًا؛ يمكن لمشغّلي الإصدار استهداف `latest` صراحةً، أو ترقية بناء تجريبي مُدقّق لاحقًا
- كل إصدار مستقر من OpenClaw يشحن حزمة npm وتطبيق macOS معًا؛
  تتحقق الإصدارات التجريبية عادةً من مسار npm/الحزمة وتنشره أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق Mac للإصدارات المستقرة ما لم يُطلب ذلك صراحةً

## وتيرة الإصدار

- تنتقل الإصدارات بطريقة التجريبي أولًا
- لا يتبع المستقر إلا بعد التحقق من أحدث إصدار تجريبي
- عادةً ما ينشئ المشرفون الإصدارات من فرع `release/YYYY.M.D` أُنشئ
  من `main` الحالي، بحيث لا تعطل عملية التحقق من الإصدار والإصلاحات
  التطوير الجديد على `main`
- إذا دُفع وسم تجريبي أو نُشر وكان يحتاج إلى إصلاح، ينشئ المشرفون
  وسم `-beta.N` التالي بدلًا من حذف الوسم التجريبي القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية والموافقات وبيانات الاعتماد وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغّل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد وسوم التوزيع، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار المخصص للمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وتأكد من دفع الالتزام الهدف،
   وتأكد من أن CI لـ `main` الحالي أخضر بما يكفي لإنشاء فرع منه.
2. أعد كتابة القسم العلوي من `CHANGELOG.md` من تاريخ الالتزامات الحقيقي باستخدام
   `/changelog`، وأبقِ الإدخالات موجّهة للمستخدمين، ثم التزم به، وادفعه، ونفّذ rebase/pull
   مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يظل مسار الترقية مغطى، أو سجّل سبب حمله عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. ارفع كل موضع إصدار مطلوب للوسم المقصود، وشغّل
   `pnpm plugins:sync` حتى تشارك حزم Plugin القابلة للنشر إصدار الإصدار
   وبيانات التوافق الوصفية، ثم شغّل الفحص المسبق المحلي الحتمي:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل من 40 محرفًا لفرع الإصدار لغرض التحقق فقط
   في الفحص المسبق. احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار، أو الوسم، أو SHA الالتزام الكامل. هذه هي نقطة الدخول اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest، وDocker، وQA Lab، وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر ملف فاشل،
   أو قناة، أو مهمة workflow، أو ملف تعريف حزمة، أو موفر، أو قائمة سماح للنموذج
   يثبت الإصلاح. لا تعِد تشغيل المظلة الكاملة إلا عندما يجعل السطح المتغير
   الأدلة السابقة قديمة.
9. بالنسبة إلى التجريبي، ضع الوسم `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   وينشر كل حزم Plugin القابلة للنشر إلى npm أولًا، وينشر المجموعة نفسها
   إلى ClawHub ثانيًا كملفات tarball بصيغة ClawPack npm-pack، ثم يروّج
   أداة الفحص المسبق المعدّة لحزمة OpenClaw npm باستخدام وسم التوزيع المطابق. بعد
   النشر، شغّل قبول الحزمة بعد النشر ضد حزمة
   `openclaw@YYYY.M.D-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاج إصدار ما قبل الإصدار مدفوع أو منشور إلى إصلاح،
   فأنشئ رقم ما قبل الإصدار المطابق التالي؛ لا تحذف إصدار ما قبل الإصدار القديم
   أو تعيد كتابته.
10. بالنسبة إلى المستقر، لا تتابع إلا بعد أن يمتلك الإصدار التجريبي المدقّق أو مرشح الإصدار
    أدلة التحقق المطلوبة. يمر نشر npm المستقر أيضًا عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أداة الفحص المسبق الناجحة عبر
    `preflight_run_id`؛ كما تتطلب جاهزية إصدار macOS المستقر وجود
    ملفات `.zip`، و`.dmg`، و`.dSYM.zip` المحزّمة، و`appcast.xml` المحدّث على `main`.
11. بعد النشر، شغّل أداة التحقق بعد نشر npm، واختبار Telegram E2E الاختياري
    المستقل لحزمة published-npm عندما تحتاج إلى دليل قناة بعد النشر،
    وترقية وسم التوزيع عند الحاجة، وملاحظات إصدار/ما قبل إصدار GitHub من
    قسم `CHANGELOG.md` المطابق الكامل، وخطوات إعلان الإصدار.

## الفحص المسبق للإصدار

- شغّل `pnpm check:test-types` قبل الفحص التمهيدي للإصدار حتى يظل TypeScript الخاص بالاختبارات مغطى خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل الفحص التمهيدي للإصدار حتى تكون فحوصات دورات الاستيراد الأوسع وحدود المعمارية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون عناصر إصدار `dist/*` المتوقعة وحزمة Control UI موجودة لخطوة التحقق من الحزمة
- شغّل `pnpm plugins:sync` بعد رفع إصدار الجذر وقبل وضع الوسم. يحدّث ذلك إصدارات حزم Plugin القابلة للنشر، وبيانات توافق OpenClaw للنظير/API، وبيانات البناء الوصفية، ومسودات سجلات تغييرات Plugin لتطابق إصدار النواة. `pnpm plugins:sync:check` هو حارس الإصدار غير المعدّل؛ يفشل سير عمل النشر قبل أي تعديل في السجل إذا نُسيت هذه الخطوة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل اعتماد الإصدار لتشغيل كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا أو وسمًا أو SHA كاملًا لالتزام، ويطلق `CI` يدويًا، ويطلق `OpenClaw Release Checks` لفحص التثبيت، وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وتكافؤ QA Lab، ومسارات Matrix وTelegram. تُبقي التشغيلات المستقرة/الافتراضية فحوصات live/E2E الشاملة ونقع مسار إصدار Docker خلف `run_release_soak=true`؛ ويفرض `release_profile=full` تشغيل النقع. ومع `release_profile=full` و`rerun_group=all`، يشغّل أيضًا Telegram E2E للحزمة على عنصر `release-package-under-test` الناتج من فحوصات الإصدار. مرّر `npm_telegram_package_spec` بعد النشر عندما يجب أن يثبت Telegram E2E نفسه حزمة npm المنشورة أيضًا. مرّر `package_acceptance_package_spec` بعد النشر عندما يجب أن يشغّل Package Acceptance مصفوفة الحزمة/التحديث على حزمة npm المشحونة بدل العنصر المبني من SHA. مرّر `evidence_package_spec` عندما يجب أن يثبت تقرير الأدلة الخاص أن التحقق يطابق حزمة npm منشورة من دون فرض Telegram E2E. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد دليلًا من قناة جانبية لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` لـ `openclaw@beta` أو `openclaw@latest` أو إصدار دقيق؛ و`source=ref` لحزم فرع/وسم/SHA موثوق في `package_ref` باستخدام حزام `workflow_ref` الحالي؛ و`source=url` لملف tarball عبر HTTPS مع SHA-256 مطلوب؛ أو `source=artifact` لملف tarball رُفع بواسطة تشغيل GitHub Actions آخر. يحل سير العمل المرشح إلى `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E ضد ملف tarball ذلك، ويمكنه تشغيل QA الخاص بـ Telegram ضد ملف tarball نفسه باستخدام `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تشمل مسارات Docker المحددة `published-upgrade-survivor`، يكون عنصر الحزمة هو المرشح ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات التعريفية الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/Plugin الأصلية للعنصر من دون OpenWebUI أو ClawHub مباشر
  - `product`: ملف الحزمة التعريفي مع قنوات MCP، وتنظيف cron/subagent، وبحث ويب OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` دقيق لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI العادية الكاملة لمرشح الإصدار. تتجاوز عمليات إرسال CI اليدوية تحديد النطاق حسب التغييرات وتفرض شظايا Linux Node، وشظايا Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء، وفحوصات المستندات، وSkills الخاصة بـ Python، وWindows، وmacOS، وAndroid، ومسارات i18n في Control UI.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. يمرّن QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء مقاطع التتبع المصدّرة، والسمات المحدودة، وتنقيح المحتوى/المعرّفات من دون الحاجة إلى Opik أو Langfuse أو جامع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المعدّل بعد وجود الوسم. أرسله من `release/YYYY.M.D` (أو `main` عند نشر وسم يمكن الوصول إليه من main)، ومرّر وسم الإصدار و`preflight_run_id` ناجحًا لـ OpenClaw npm، وأبقِ نطاق نشر Plugin الافتراضي `all-publishable` إلا إذا كنت تشغّل إصلاحًا مركزًا عمدًا. يجعل سير العمل نشر Plugin إلى npm، ونشر Plugin إلى ClawHub، ونشر OpenClaw إلى npm متسلسلة حتى لا تُنشر حزمة النواة قبل Plugins الخارجية التابعة لها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ QA Lab الوهمي مع ملف Matrix المباشر السريع ومسار Telegram QA قبل اعتماد الإصدار. تستخدم المسارات المباشرة بيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا عقود استعارة اعتماد Convex CI. شغّل سير العمل اليدوي `QA-Lab - All Lanes` باستخدام `matrix_profile=all` و`matrix_shards=true` عندما تريد مخزون نقل Matrix والوسائط وE2EE الكامل بالتوازي.
- التحقق من وقت تشغيل التثبيت والترقية عبر أنظمة التشغيل جزء من `OpenClaw Release Checks` العامة و`Full Release Validation`، اللذين يستدعيان سير العمل القابل لإعادة الاستخدام `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا وحتميًا ومركزًا على العناصر، بينما تبقى الفحوصات المباشرة الأبطأ في مسارها الخاص حتى لا تؤخر النشر أو تمنعه
- يجب إرسال فحوصات الإصدار التي تحمل أسرارًا عبر `Full Release Validation` أو من مرجع سير عمل `main`/الإصدار حتى تبقى منطق سير العمل والأسرار مضبوطة
- يقبل `OpenClaw Release Checks` فرعًا أو وسمًا أو SHA كاملًا لالتزام ما دام الالتزام المحلول يمكن الوصول إليه من فرع OpenClaw أو وسم إصدار
- يقبل الفحص التمهيدي للتحقق فقط في `OpenClaw NPM Release` أيضًا SHA الكامل الحالي لالتزام فرع سير العمل المكوّن من 40 حرفًا من دون الحاجة إلى وسم مدفوع
- مسار SHA هذا للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط لفحص بيانات الحزمة الوصفية؛ ولا يزال النشر الحقيقي يتطلب وسم إصدار حقيقيًا
- يُبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات GitHub المستضافة، بينما يمكن لمسار التحقق غير المعدّل استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل سير العمل ذلك
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد الفحص التمهيدي لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور في بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تهيئة الحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي ضد حزمة npm المنشورة باستخدام مجموعة اعتماد Telegram المشتركة المستعارة. يمكن لتجارب الصيانة المحلية المنفردة حذف متغيرات Convex وتمرير اعتمادات البيئة الثلاثة `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- لتشغيل فحص beta الكامل بعد النشر من جهاز أحد المشرفين، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق تحديث npm في Parallels/الهدف الجديد، ويرسل `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل الدقيق، وينزّل العنصر، ويطبع تقرير Telegram.
- يمكن للمشرفين تشغيل الفحص نفسه بعد النشر من GitHub Actions عبر سير العمل اليدوي `NPM Telegram Beta E2E`. هو يدوي فقط عمدًا ولا يعمل عند كل دمج.
- تستخدم أتمتة إصدار المشرفين الآن أسلوب الفحص التمهيدي ثم الترقية:
  - يجب أن يمر نشر npm الحقيقي بـ `preflight_run_id` ناجح لـ npm
  - يجب إرسال نشر npm الحقيقي من فرع `main` أو `release/YYYY.M.D` نفسه الذي شُغّل منه الفحص التمهيدي الناجح
  - إصدارات npm المستقرة تستخدم `beta` افتراضيًا
  - يمكن أن يستهدف نشر npm المستقر `latest` صراحة عبر مُدخل سير العمل
  - أصبح تعديل `dist-tag` الخاص بـ npm المستند إلى الرموز في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما يُبقي المستودع العام النشر عبر OIDC فقط
  - `macOS Release` العام للتحقق فقط؛ عندما يكون الوسم موجودًا على فرع إصدار فقط لكن سير العمل يُرسل من `main`، عيّن `public_release_branch=release/YYYY.M.D`
  - يجب أن يمر نشر mac الخاص الحقيقي بـ `preflight_run_id` و`validate_run_id` ناجحين للـ mac الخاص
  - تروّج مسارات النشر الحقيقي العناصر المحضّرة بدل إعادة بنائها مرة أخرى
- بالنسبة لإصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يفحص مدقق ما بعد النشر أيضًا مسار الترقية نفسه في بادئة مؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N` حتى لا تترك تصحيحات الإصدار عمليات التثبيت العامة الأقدم صامتة على حمولة المستقر الأساسية
- يفشل الفحص التمهيدي لإصدار npm بوضع مغلق إلا إذا احتوى ملف tarball على `dist/control-ui/index.html` وحمولة `dist/control-ui/assets/` غير فارغة حتى لا نشحن لوحة متصفح فارغة مرة أخرى
- يتحقق ما بعد النشر أيضًا من وجود نقاط دخول Plugin المنشورة وبيانات الحزمة الوصفية في تخطيط السجل المثبت. الإصدار الذي يشحن حمولات وقت تشغيل Plugin مفقودة يفشل مدقق ما بعد النشر ولا يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` الخاصة بـ npm pack على ملف tarball المرشح للتحديث، حتى يلتقط installer e2e تضخم الحزمة العرضي قبل مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت الامتداد، أو مصفوفات اختبار الامتداد، فأعد توليد ومراجعة مخرجات مصفوفة `plugin-prerelease-extension-shard` المملوكة للمخطط من `.github/workflows/plugin-prerelease.yml` قبل الاعتماد حتى لا تصف ملاحظات الإصدار تخطيط CI قديمًا
- تشمل جاهزية إصدار macOS المستقر أيضًا أسطح المحدّث:
  - يجب أن ينتهي إصدار GitHub بملفات `.zip` و`.dmg` و`.dSYM.zip` المعبأة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحافظ التطبيق المعبأ على معرّف حزمة غير تصحيحي، وURL تغذية Sparkle غير فارغ، و`CFBundleVersion` عند حد أرضية بناء Sparkle القانونية لذلك الإصدار أو أعلى منه

## صناديق اختبار الإصدار

`Full Release Validation` هي الطريقة التي يشغّل بها المشغلون كل اختبارات ما قبل الإصدار من نقطة دخول واحدة. لإثبات التزام مثبت على فرع سريع الحركة، استخدم المساعد حتى يعمل كل سير عمل فرعي من فرع مؤقت مثبت على SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويرسل `Full Release Validation` من ذلك الفرع باستخدام `ref=<sha>`، ويتحقق من أن كل `headSha` في سير عمل فرعي يطابق الهدف، ثم يحذف الفرع المؤقت. هذا يتجنب إثبات تشغيل فرعي أحدث على `main` عن طريق الخطأ.

للتحقق من فرع إصدار أو وسم، شغّله من مرجع سير العمل الموثوق `main` ومرّر فرع الإصدار أو الوسم كـ `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

يحل سير العمل مرجع الهدف، ويشغّل `CI` يدويًا باستخدام
`target_ref=<release-ref>`، ويشغّل `OpenClaw Release Checks`، ويحضّر أداة
أصلية `release-package-under-test` للفحوصات المواجهة للحزمة، ويشغّل Telegram
E2E للحزمة بشكل مستقل عندما تكون `release_profile=full` مع
`rerun_group=all` أو عندما تكون `npm_telegram_package_spec` مضبوطة. بعد ذلك
تتفرع `OpenClaw Release Checks` إلى فحص التثبيت، وفحوصات الإصدار عبر أنظمة
التشغيل، وتغطية مسار إصدار Docker المباشرة/E2E عند تفعيل التشغيل المطوّل،
وقبول الحزمة مع QA لحزمة Telegram، وتكافؤ QA Lab، وMatrix المباشر، وTelegram
المباشر. لا يكون التشغيل الكامل مقبولًا إلا عندما يُظهر ملخص
`Full Release Validation`
أن `normal_ci` و`release_checks` ناجحان. في وضع full/all، يجب أيضًا أن يكون
الابن `npm_telegram` ناجحًا؛ وخارج full/all يتم تخطيه ما لم تُقدَّم
`npm_telegram_package_spec` منشورة. يتضمن ملخص التحقق النهائي جداول لأبطأ
المهام في كل تشغيل فرعي، بحيث يمكن لمدير الإصدار رؤية المسار الحرج الحالي من
دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع
على مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، والفروق بين ملفي
التعريف stable وfull، والأدوات، ومقابض إعادة التشغيل المركزة.
تُشغَّل مسارات العمل الفرعية من المرجع الموثوق الذي يشغّل `Full Release
Validation`، وعادةً `--ref main`، حتى عندما يشير `ref` الهدف إلى فرع إصدار
أقدم أو وسم أقدم. لا يوجد مدخل workflow-ref منفصل لسير عمل التحقق الكامل من
الإصدار؛ اختر حاضنة الاختبار الموثوقة باختيار مرجع تشغيل سير العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات الالتزام الدقيق على `main`
المتحرك؛ فلا يمكن أن تكون قيم SHA الخام للالتزامات مراجع لتشغيل سير العمل،
لذلك استخدم `pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبت.

استخدم `release_profile` لاختيار اتساع التغطية المباشرة/المزوّد:

- `minimum`: أسرع مسار حي وDocker حرج للإصدار خاص بـ OpenAI/النواة
- `stable`: الحد الأدنى إضافةً إلى تغطية المزوّد/الخلفية المستقرة لاعتماد الإصدار
- `full`: المستقر إضافةً إلى تغطية واسعة للمزوّدين الاستشاريين/الوسائط

استخدم `run_release_soak=true` مع `stable` عندما تكون المسارات الحاجبة للإصدار
خضراء وتريد تشغيل مسح شامل للمباشر/E2E، ومسار إصدار Docker، وناجي الترقية من
كل ما بعد 2026.4.23 قبل الترقية. يتضمن `full` ضمنيًا
`run_release_soak=true`.

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل مرجع الهدف مرة
واحدة باسم `release-package-under-test` وتعيد استخدام تلك الأداة في فحوصات
أنظمة التشغيل المتعددة، وقبول الحزمة، وفحوصات Docker لمسار الإصدار عند تشغيل
التشغيل المطوّل. هذا يُبقي كل الصناديق المواجهة للحزمة على البايتات نفسها
ويتجنب بناء الحزمة مرارًا. يستخدم فحص تثبيت OpenAI عبر أنظمة التشغيل
`OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون متغير المستودع/المؤسسة مضبوطًا،
وإلا يستخدم `openai/gpt-5.4`، لأن هذا المسار يثبت تثبيت الحزمة، والتهيئة
الأولية، وبدء تشغيل Gateway، ودورة واحدة مباشرة للوكيل بدلًا من قياس أداء
أبطأ نموذج افتراضي. تبقى مصفوفة المزوّدين المباشرة الأوسع هي موضع التغطية
الخاصة بالنماذج.

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
واحد، فاستخدم سير العمل الفرعي الفاشل، أو المهمة، أو مسار Docker، أو ملف
تعريف الحزمة، أو مزوّد النموذج، أو مسار QA للإثبات التالي. شغّل المظلة
الكاملة مرة أخرى فقط عندما يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل دليل
كل الصناديق السابق قديمًا. يعيد المتحقق النهائي للمظلة فحص معرفات تشغيل
مسار العمل الفرعي المسجلة، لذلك بعد إعادة تشغيل مسار عمل فرعي بنجاح، أعد
تشغيل مهمة الأصل `Verify full validation` الفاشلة فقط.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل مرشح
الإصدار الحقيقي، و`ci` يشغّل ابن CI العادي فقط، و`plugin-prerelease` يشغّل
ابن Plugin الخاص بالإصدار فقط، و`release-checks` يشغّل كل صناديق الإصدار،
ومجموعات الإصدار الأضيق هي `install-smoke` و`cross-os` و`live-e2e` و`package`
و`qa` و`qa-parity` و`qa-live` و`npm-telegram`. تتطلب عمليات إعادة التشغيل
المركزة لـ `npm-telegram` وجود `npm_telegram_package_spec`؛ أما عمليات
full/all مع `release_profile=full` فتستخدم أداة حزمة فحوصات الإصدار. يمكن
لعمليات إعادة التشغيل المركزة عبر أنظمة التشغيل إضافة
`cross_os_suite_filter=windows/packaged-upgrade` أو مرشح نظام تشغيل/مجموعة
آخر. إخفاقات QA في فحوصات الإصدار استشارية؛ ولا يؤدي إخفاق QA فقط إلى حجب
التحقق من الإصدار.

### Vitest

صندوق Vitest هو سير العمل الفرعي اليدوي `CI`. يتجاوز CI اليدوي عمدًا تحديد
النطاق حسب التغييرات ويفرض مخطط الاختبار العادي لمرشح الإصدار: أجزاء Linux
Node، وأجزاء Plugin المجمّعة، وعقود القنوات، وتوافق Node 22، و`check`،
و`check-additional`، وفحص البناء، وفحوصات المستندات، وSkills الخاصة بـ
Python، وWindows، وmacOS، وAndroid، وControl UI i18n.

استخدم هذا الصندوق للإجابة عن: "هل اجتازت شجرة المصدر مجموعة الاختبارات
العادية الكاملة؟" إنه ليس مثل التحقق من المنتج عبر مسار الإصدار. الأدلة التي
يجب الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض عنوان URL لتشغيل `CI` الذي تم تشغيله
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الأجزاء الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- أدوات توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما يحتاج التشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي ولكن لا يحتاج
إلى صناديق Docker أو QA Lab أو المباشر أو أنظمة التشغيل المتعددة أو الحزمة:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker داخل `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، إضافةً إلى سير عمل
`install-smoke` بوضع الإصدار. يتحقق من مرشح الإصدار عبر بيئات Docker
المعبأة بدلًا من الاختبارات على مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- فحص تثبيت كامل مع تمكين فحص تثبيت Bun العام البطيء
- إعداد/إعادة استخدام صورة فحص Dockerfile الجذري حسب SHA الهدف، مع تشغيل مهام QR، والجذر/Gateway، وفحص المثبّت/Bun كأجزاء install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، و`plugins-runtime-install-a`، و`plugins-runtime-install-b`، و`plugins-runtime-install-c`، و`plugins-runtime-install-d`، و`plugins-runtime-install-e`، و`plugins-runtime-install-f`، و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إلغاء تثبيت Plugin المجمّعة المقسمة من `bundled-plugin-install-uninstall-0` إلى `bundled-plugin-install-uninstall-23`
- مجموعات المزوّد المباشر/E2E وتغطية نموذج Docker المباشر عندما تتضمن فحوصات الإصدار مجموعات مباشرة

استخدم أدوات Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وملف JSON لخطة المجدول، وأوامر إعادة التشغيل. للاسترداد
المركز، استخدم `docker_lanes=<lane[,lane]>` على سير العمل القابل لإعادة
الاستخدام المباشر/E2E بدلًا من إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر
إعادة التشغيل المولدة `package_artifact_run_id` السابق ومدخلات صور Docker
المحضّرة عند توفرها، بحيث يمكن للمسار الفاشل إعادة استخدام ملف tarball نفسه
وصور GHCR نفسها.

### QA Lab

صندوق QA Lab هو أيضًا جزء من `OpenClaw Release Checks`. إنه بوابة الإصدار
الخاصة بسلوك الوكيل ومستوى القناة، منفصلًا عن Vitest وآليات حزمة Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ وهمي يقارن مسار مرشح OpenAI بخط أساس Opus 4.6 باستخدام حزمة التكافؤ الوكيلية
- ملف تعريف QA سريع ومباشر لـ Matrix باستخدام بيئة `qa-live-shared`
- مسار QA مباشر لـ Telegram باستخدام إيجارات بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج قياس الإصدار عن بعد إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن: "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات المباشرة؟" احتفظ بعناوين URL للأدوات الخاصة بمسارات التكافؤ
وMatrix وTelegram عند اعتماد الإصدار. تبقى تغطية Matrix الكاملة متاحة كتشغيل
QA-Lab مجزأ يدوي بدلًا من المسار الحرج الافتراضي للإصدار.

### الحزمة

صندوق الحزمة هو بوابة المنتج القابل للتثبيت. تدعمه `Package Acceptance`
والمحلّل `scripts/resolve-openclaw-package-candidate.mjs`. يطبّع المحلّل
المرشح إلى ملف tarball باسم `package-under-test` الذي تستهلكه Docker E2E،
ويتحقق من مخزون الحزمة، ويسجل إصدار الحزمة وSHA-256، ويحافظ على مرجع حاضنة
سير العمل منفصلًا عن مرجع مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيق
- `source=ref`: تعبئة فرع `package_ref` أو وسم أو SHA التزام كامل موثوق مع حاضنة `workflow_ref` المحددة
- `source=url`: تنزيل `.tgz` عبر HTTPS مع `package_sha256` مطلوب
- `source=artifact`: إعادة استخدام `.tgz` مرفوع بواسطة تشغيل GitHub Actions آخر

تشغّل `OpenClaw Release Checks` قبول الحزمة باستخدام `source=artifact`، وأداة
حزمة الإصدار المحضّرة، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`،
و`telegram_mode=mock-openai`. يحافظ قبول الحزمة على الهجرة، والتحديث، وتنظيف
اعتماد Plugin القديم، وتجهيزات Plugin غير المتصلة، وتحديث Plugin، وQA لحزمة
Telegram ضد ملف tarball المحلول نفسه. تستخدم فحوصات الإصدار الحاجبة خط الأساس
الافتراضي لأحدث حزمة منشورة؛ ويوسّع `run_release_soak=true` أو
`release_profile=full` ذلك إلى كل خط أساس مستقر منشور على npm من `2026.4.23`
حتى `latest` إضافةً إلى تجهيزات المشكلات المبلغ عنها. استخدم قبول الحزمة مع
`source=npm` لمرشح تم شحنه بالفعل، أو `source=ref`/`source=artifact` لملف npm
tarball محلي مدعوم بـ SHA قبل النشر. إنه البديل الأصلي في GitHub لمعظم تغطية
الحزمة/التحديث التي كانت تتطلب Parallels سابقًا. لا تزال فحوصات الإصدار عبر
أنظمة التشغيل مهمة للتهيئة الأولية، والمثبّت، وسلوك المنصة الخاص بنظام
التشغيل، لكن يجب أن يفضّل التحقق من منتج الحزمة/التحديث قبول الحزمة.

قائمة التحقق المعيارية للتحديث والتحقق من Plugin هي
[اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins). استخدمها عند
تحديد أي مسار محلي أو Docker أو قبول الحزمة أو فحوصات الإصدار يثبت تغيير
تثبيت/تحديث Plugin، أو تنظيف doctor، أو هجرة حزمة منشورة. هجرة التحديث
الشاملة المنشورة من كل حزمة مستقرة `2026.4.23+` هي سير عمل يدوي منفصل
`Update Migration`، وليست جزءًا من Full Release CI.

تساهل package-acceptance القديم محدد زمنيًا عن قصد. قد تستخدم الحزم حتى
`2026.4.25` مسار التوافق للفجوات في البيانات الوصفية المنشورة بالفعل إلى
npm: إدخالات مخزون QA خاصة مفقودة من ملف tarball، و`gateway install --wrapper`
مفقود، وملفات ترقيع مفقودة في تجهيز git المشتق من ملف tarball، و`update.channel`
المستمر مفقود، ومواقع سجلات تثبيت Plugin القديمة، واستمرار سجل تثبيت السوق
مفقود، وهجرة بيانات الإعداد الوصفية أثناء `plugins update`. قد تحذّر الحزمة
المنشورة `2026.4.26` بشأن ملفات ختم بيانات البناء المحلية الوصفية التي شُحنت
بالفعل. يجب أن تستوفي الحزم اللاحقة عقود الحزمة الحديثة؛ وتفشل تلك الفجوات
نفسها في التحقق من الإصدار.

استخدم ملفات تعريف قبول الحزمة الأوسع عندما يكون سؤال الإصدار متعلقًا بحزمة
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

ملفات تعريف الحزم الشائعة:

- `smoke`: مسارات تثبيت الحزمة/القناة/الوكيل السريعة، وشبكة Gateway، وإعادة
  تحميل الإعدادات
- `package`: عقود حزمة التثبيت/التحديث/Plugin بدون ClawHub مباشر؛ هذا هو الافتراضي
  لفحص الإصدار
- `product`: `package` بالإضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي، وبحث OpenAI على الويب،
  وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لإعادات التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في قبول الحزمة. يمرر سير العمل ملف tarball
المحلول `package-under-test` إلى مسار Telegram؛ لا يزال سير عمل Telegram المستقل
يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة الدخول العادية للنشر المُعدِّل. وهو
ينسق سير عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. يسحب وسم الإصدار ويحل SHA الالتزام الخاص به.
2. يتحقق من أن الوسم قابل للوصول من `main` أو `release/*`.
3. يشغل `pnpm plugins:sync:check`.
4. يرسل `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. يرسل `Plugin ClawHub Release` بالنطاق نفسه وSHA نفسه.
6. يرسل `OpenClaw NPM Release` مع وسم الإصدار، ووسم توزيع npm، و
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
فقط لأعمال الإصلاح المركزة أو إعادة النشر. لإصلاح Plugin محدد، مرر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أرسل سير العمل الفرعي مباشرة عندما يجب عدم نشر
حزمة OpenClaw.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ عندما تكون `preflight_only=true`، يمكن أن يكون أيضًا SHA
  الالتزام الكامل الحالي المكون من 40 حرفًا لفرع سير العمل من أجل فحص تمهيدي
  للتحقق فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى يعيد سير العمل استخدام
  ملف tarball المحضّر من تشغيل الفحص التمهيدي الناجح
- `npm_dist_tag`: وسم npm الهدف لمسار النشر؛ الافتراضي هو `beta`

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب؛ يجب أن يكون موجودًا مسبقًا
- `preflight_run_id`: معرف تشغيل الفحص التمهيدي الناجح لـ`OpenClaw NPM Release`؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm الهدف لحزمة OpenClaw
- `plugin_publish_scope`: الافتراضي هو `all-publishable`؛ استخدم `selected` فقط
  لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: الافتراضي هو `true`؛ اضبطه على `false` فقط عند استخدام
  سير العمل كمنسق إصلاح لـPlugin فقط

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق منه. تتطلب الفحوصات التي تحمل
  أسرارًا أن يكون الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم
  إصدار.
- `run_release_soak`: الاشتراك في اختبار نقع شامل مباشر/E2E، ومسار إصدار Docker،
  ونقع ناجي الترقية منذ الكل في فحوصات الإصدار المستقر/الافتراضي. يتم فرضه
  بواسطة `release_profile=full`.

القواعد:

- يمكن نشر وسوم الإصدار المستقر والتصحيح إما إلى `beta` أو `latest`
- يمكن نشر وسوم ما قبل الإصدار beta إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، لا يُسمح بإدخال SHA التزام كامل إلا عندما
  تكون `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` للتحقق فقط دائمًا
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء الفحص
  التمهيدي؛ يتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر

## تسلسل إصدار npm مستقر

عند إنشاء إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الكامل الحالي لفرع سير العمل
     لتشغيل تجريبي للتحقق فقط من سير عمل الفحص التمهيدي
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ بـbeta، أو `latest` فقط
   عندما تريد عمدًا نشرًا مستقرًا مباشرًا
3. شغّل `Full Release Validation` على فرع الإصدار، أو وسم الإصدار، أو SHA التزام
   كامل عندما تريد CI عاديًا بالإضافة إلى تغطية مباشرة لذاكرة التخزين المؤقت
   للمطالبات، وDocker، وQA Lab، وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدًا إلى مخطط الاختبارات العادي الحتمي فقط، شغّل سير عمل
   `CI` اليدوي على مرجع الإصدار بدلًا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` باستخدام `tag` نفسه، و`npm_dist_tag` نفسه،
   و`preflight_run_id` المحفوظ؛ ينشر Plugins الخارجية إلى npm وClawHub قبل ترقية
   حزمة npm الخاصة بـOpenClaw
7. إذا نزل الإصدار على `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
8. إذا نُشر الإصدار عمدًا مباشرة إلى `latest` وكان ينبغي أن تتبع `beta` البناء
   المستقر نفسه فورًا، فاستخدم سير العمل الخاص نفسه لتوجيه وسمي التوزيع إلى
   الإصدار المستقر، أو اترك مزامنة الإصلاح الذاتي المجدولة تنقل `beta` لاحقًا

توجد عملية تعديل وسم التوزيع في المستودع الخاص لأسباب أمنية لأنها لا تزال
تتطلب `NPM_TOKEN`، بينما يحتفظ المستودع العام بالنشر المعتمد على OIDC فقط.

يبقي ذلك مسار النشر المباشر ومسار الترقية الذي يبدأ بـbeta موثقين ومرئيين
للمشغل.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر
1Password CLI (`op`) داخل جلسة tmux مخصصة فقط. لا تستدعِ `op` مباشرة من صدفة
الوكيل الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات والتنبيهات ومعالجة OTP قابلة
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

يستخدم المشرفون وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
لدليل التشغيل الفعلي.

## ذات صلة

- [قنوات الإصدار](/ar/install/development-channels)
