---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرة إصدارها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، وصناديق التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدارات
x-i18n:
    generated_at: "2026-05-05T06:19:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- المستقر: إصدارات موسومة تُنشر إلى npm `beta` افتراضياً، أو إلى npm `latest` عند الطلب صراحةً
- بيتا: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- التطوير: رأس `main` المتحرك

## تسمية الإصدارات

- إصدار مستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار تصحيح مستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار بيتا تمهيدي: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفاراً بادئة للشهر أو اليوم
- يعني `latest` إصدار npm المستقر المروّج الحالي
- يعني `beta` هدف تثبيت بيتا الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضياً؛ يمكن لمشغلي الإصدار استهداف `latest` صراحةً، أو ترقية بناء بيتا تم التحقق منه لاحقاً
- يشحن كل إصدار مستقر من OpenClaw حزمة npm وتطبيق macOS معاً؛
  تتحقق إصدارات بيتا عادةً من مسار npm/الحزمة وتنشره أولاً، مع
  حجز بناء/توقيع/توثيق تطبيق macOS للإصدار المستقر ما لم يُطلب ذلك صراحةً

## وتيرة الإصدارات

- تنتقل الإصدارات بأسلوب بيتا أولاً
- لا يأتي الإصدار المستقر إلا بعد التحقق من أحدث بيتا
- ينشئ المشرفون الإصدارات عادةً من فرع `release/YYYY.M.D` مُنشأ
  من `main` الحالي، بحيث لا تمنع عمليات التحقق من الإصدار وإصلاحاته
  التطوير الجديد على `main`
- إذا دُفع وسم بيتا أو نُشر وكان يحتاج إلى إصلاح، ينشئ المشرفون
  وسم `-beta.N` التالي بدلاً من حذف وسم بيتا القديم أو إعادة إنشائه
- تظل إجراءات الإصدار التفصيلية والموافقات وبيانات الاعتماد وملاحظات الاسترداد
  خاصة بالمشرفين فقط

## قائمة تحقق مشغل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة
والتوقيع والتوثيق واسترداد dist-tag وتفاصيل التراجع الطارئ في
دليل التشغيل الخاص بالإصدار للمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وتأكد من أن الالتزام المستهدف مدفوع،
   وتأكد من أن CI الحالي على `main` أخضر بما يكفي لإنشاء فرع منه.
2. أعد كتابة قسم `CHANGELOG.md` الأعلى من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، واجعل الإدخالات موجّهة للمستخدم، ثم اعتمده وادفعه، وأعد الأساس/اسحب
   مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب حمله
   عمداً.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. ارفع كل موقع إصدار مطلوب للوسم المقصود، وشغّل
   `pnpm plugins:sync` حتى تشارك حزم Plugin القابلة للنشر إصدار الإصدار
   وبيانات التوافق الوصفية، ثم شغّل فحص ما قبل الإطلاق المحلي الحتمي:
   `pnpm check:test-types` و`pnpm check:architecture` و
   `pnpm build && pnpm ui:build` و`pnpm plugins:sync:check` و
   `pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل بطول 40 محرفاً لفرع الإصدار للتحقق فقط
   قبل الإطلاق. احفظ `preflight_run_id` الناجح.
7. ابدأ جميع اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار أو الوسم أو SHA الالتزام الكامل. هذه هي نقطة الإدخال اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest وDocker وQA Lab وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر
   ملف أو مسار أو مهمة سير عمل أو ملف تعريف حزمة أو مزود أو قائمة سماح نماذج فاشلة
   تثبت الإصلاح. أعد تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير
   الأدلة السابقة قديمة.
9. بالنسبة إلى بيتا، أنشئ الوسم `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   وينشر أولاً كل حزم Plugin القابلة للنشر إلى npm، ثم ينشر المجموعة نفسها
   إلى ClawHub ثانياً كأرشيفات ClawPack npm-pack tarball، ثم يروّج
   أداة npm الخاصة بـ OpenClaw المحضّرة مسبقاً بالإطلاق مع dist-tag المطابق. بعد
   النشر، شغّل قبول الحزمة بعد النشر
   مقابل حزمة `openclaw@YYYY.M.D-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاج إصدار تمهيدي مدفوع أو منشور إلى إصلاح،
   فأنشئ رقم الإصدار التمهيدي المطابق التالي؛ لا تحذف الإصدار التمهيدي القديم
   أو تعيد كتابته.
10. بالنسبة إلى المستقر، تابع فقط بعد أن يمتلك بيتا أو مرشح الإصدار المعتمد
    أدلة التحقق المطلوبة. يمر نشر npm المستقر أيضاً عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أداة ما قبل الإطلاق الناجحة عبر
    `preflight_run_id`؛ كما تتطلب جاهزية إصدار macOS المستقر
    حزم `.zip` و`.dmg` و`.dSYM.zip` و`appcast.xml` المحدّث على `main`.
11. بعد النشر، شغّل متحقق npm بعد النشر، وTelegram E2E المستقل الاختياري
    المنشور على npm عندما تحتاج إلى إثبات قناة بعد النشر،
    وترقية dist-tag عند الحاجة، وملاحظات إصدار/ما قبل إصدار GitHub من
    قسم `CHANGELOG.md` المطابق الكامل، وخطوات إعلان الإصدار.

## فحص ما قبل الإصدار

- شغّل `pnpm check:test-types` قبل فحص ما قبل الإصدار حتى تبقى TypeScript الخاصة بالاختبارات
  مغطاة خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل فحص ما قبل الإصدار حتى تكون فحوصات دورات الاستيراد
  الأوسع وحدود المعمارية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون عناصر الإصدار
  المتوقعة `dist/*` وحزمة واجهة Control UI موجودة لخطوة تحقق الحزم
- شغّل `pnpm plugins:sync` بعد رفع إصدار الجذر وقبل الوسم. فهو يحدّث إصدارات حزم
  Plugin القابلة للنشر، وبيانات توافق OpenClaw النظيرة/API، وبيانات البناء، وقوالب
  سجلات تغييرات Plugin لتطابق إصدار النواة. `pnpm plugins:sync:check` هو حارس الإصدار
  غير المعدّل؛ ويفشل سير عمل النشر قبل أي تغيير في السجل إذا نُسيت هذه الخطوة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل اعتماد الإصدار لتشغيل كل صناديق
  اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا أو وسمًا أو SHA كاملًا للالتزام،
  ويرسل `CI` يدويًا، ويرسل `OpenClaw Release Checks` لفحص التثبيت، وقبول الحزمة، وفحوصات
  الحزم عبر أنظمة التشغيل، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. تُبقي التشغيلات
  المستقرة/الافتراضية فحوصات live/E2E الشاملة ونقع مسار إصدار Docker خلف
  `run_release_soak=true`؛ ويفرض `release_profile=full` تشغيل النقع. مع
  `release_profile=full` و`rerun_group=all`، يشغّل أيضًا E2E حزمة Telegram مقابل العنصر
  `release-package-under-test` من فحوصات الإصدار. وفّر `npm_telegram_package_spec` بعد
  النشر عندما يجب أن يثبت Telegram E2E نفسه حزمة npm المنشورة أيضًا. وفّر
  `package_acceptance_package_spec` بعد النشر عندما يجب أن يشغّل Package Acceptance
  مصفوفة الحزمة/التحديث الخاصة به مقابل حزمة npm المشحونة بدلًا من العنصر المبني من
  SHA. وفّر `evidence_package_spec` عندما يجب أن يثبت تقرير الأدلة الخاص أن التحقق
  يطابق حزمة npm منشورة من دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد إثباتًا جانبيًا لمرشح حزمة
  بينما يستمر عمل الإصدار. استخدم `source=npm` مع `openclaw@beta` أو `openclaw@latest`
  أو إصدار محدد بالضبط؛ و`source=ref` لحزم فرع/وسم/SHA موثوق في `package_ref` باستخدام
  عُدّة `workflow_ref` الحالية؛ و`source=url` لملف tarball عبر HTTPS مع SHA-256 مطلوب؛
  أو `source=artifact` لملف tarball رُفع بواسطة تشغيل GitHub Actions آخر. يحل سير العمل
  المرشح إلى `package-under-test`، ويعيد استخدام مجدول Docker E2E للإصدار مقابل ملف
  tarball ذلك، ويمكنه تشغيل QA في Telegram مقابل ملف tarball نفسه باستخدام
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن مسارات Docker
  المحددة `published-upgrade-survivor`، يكون عنصر الحزمة هو المرشح ويحدد
  `published_upgrade_survivor_baseline` خط الأساس المنشور. يستخدم `update-restart-auth`
  حزمة المرشح بوصفها كلًا من CLI المثبتة وpackage-under-test حتى يمرّن مسار إعادة التشغيل
  المُدارة في أمر تحديث المرشح.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/إعادة التشغيل/Plugin الأصلية للعنصر من دون OpenWebUI أو ClawHub حي
  - `product`: ملف الحزمة بالإضافة إلى قنوات MCP، وتنظيف cron/subagent،
    وبحث الويب في OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: تحديد دقيق لـ `docker_lanes` لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI عادية كاملة لمرشح
  الإصدار. تتجاوز إرسالات CI اليدوية نطاق التغييرات وتفرض مقاطع Linux Node، ومقاطع
  Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وفحص
  البناء، وفحوصات المستندات، وPython Skills، وWindows، وmacOS، وAndroid، ومسارات i18n
  في Control UI.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. يمرّن QA-lab عبر مستقبِل
  OTLP/HTTP محلي ويتحقق من أسماء امتدادات التتبع المصدّرة، والسمات المحدودة، وتنقيح
  المحتوى/المعرّفات من دون طلب Opik أو Langfuse أو مجمّع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المعدّل بعد وجود الوسم. أرسله من
  `release/YYYY.M.D` (أو `main` عند نشر وسم يمكن الوصول إليه من main)، ومرّر وسم الإصدار
  و`preflight_run_id` ناجحًا لـ npm في OpenClaw، وأبقِ نطاق نشر Plugin الافتراضي
  `all-publishable` ما لم تكن تشغّل إصلاحًا مركزًا عن قصد. يسلسل سير العمل نشر Plugin
  إلى npm، ونشر Plugin إلى ClawHub، ونشر OpenClaw إلى npm حتى لا تُنشر الحزمة الأساسية
  قبل Plugins الخارجية الخاصة بها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ QA Lab الوهمي بالإضافة إلى ملف Matrix
  الحي السريع ومسار QA في Telegram قبل اعتماد الإصدار. تستخدم المسارات الحية بيئة
  `qa-live-shared`؛ ويستخدم Telegram أيضًا عقود استئجار بيانات اعتماد Convex CI. شغّل
  سير العمل اليدوي `QA-Lab - All Lanes` مع `matrix_profile=all` و`matrix_shards=true`
  عندما تريد جرد نقل Matrix والوسائط وE2EE بالكامل بالتوازي.
- تحقق التشغيل للتثبيت والترقية عبر أنظمة التشغيل جزء من
  `OpenClaw Release Checks` العامة و`Full Release Validation`، اللذين يستدعيان سير العمل
  القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا، وحتميًا، ومركزًا على العناصر،
  بينما تبقى الفحوصات الحية الأبطأ في مسارها الخاص حتى لا تعطل النشر أو تمنعه
- يجب إرسال فحوصات الإصدار الحاملة للأسرار عبر `Full Release
Validation` أو من مرجع سير العمل `main`/release حتى تبقى منطق سير العمل
  والأسرار مضبوطة
- يقبل `OpenClaw Release Checks` فرعًا أو وسمًا أو SHA كاملًا للالتزام ما دام الالتزام
  المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار
- يقبل فحص ما قبل الإصدار للتحقق فقط في `OpenClaw NPM Release` أيضًا SHA الحالي الكامل
  ذي 40 محرفًا لفرع سير العمل من دون اشتراط وسم مدفوع
- مسار SHA هذا للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، يصطنع سير العمل `v<package.json version>` فقط لفحص بيانات الحزمة؛ أما
  النشر الحقيقي فما زال يتطلب وسم إصدار حقيقيًا
- يبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات GitHub المستضافة، بينما
  يمكن لمسار التحقق غير المعدّل استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل ذلك سير العمل
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد فحص ما قبل إصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/correction المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/correction المطابق) للتحقق من مسار تثبيت السجل المنشور في بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تهيئة الحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي مقابل حزمة npm
  المنشورة باستخدام تجمع بيانات اعتماد Telegram المؤجر والمشترك. يمكن لمشغلي الصيانة
  المحليين لمرة واحدة حذف متغيرات Convex وتمرير بيانات اعتماد البيئة الثلاث
  `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- لتشغيل فحص beta الكامل بعد النشر من جهاز مشرف، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق تحديث/fresh-target في Parallels عبر npm، ويرسل `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل المحدد، وينزّل العنصر، ويطبع تقرير Telegram.
- يمكن للمشرفين تشغيل الفحص نفسه بعد النشر من GitHub Actions عبر سير العمل اليدوي
  `NPM Telegram Beta E2E`. وهو يدوي فقط عن قصد ولا يعمل عند كل دمج.
- تستخدم أتمتة إصدارات المشرفين الآن فحصًا مسبقًا ثم ترقية:
  - يجب أن يجتاز نشر npm الحقيقي `preflight_run_id` ناجحًا لـ npm
  - يجب إرسال نشر npm الحقيقي من فرع `main` نفسه أو
    `release/YYYY.M.D` نفسه مثل تشغيل الفحص المسبق الناجح
  - إصدارات npm المستقرة تفترض `beta` افتراضيًا
  - يمكن لنشر npm المستقر استهداف `latest` صراحة عبر مُدخل سير العمل
  - نقل وسم توزيع npm المعتمد على الرمز يعيش الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` ما زال يحتاج إلى `NPM_TOKEN` بينما
    يحتفظ المستودع العام بنشر OIDC فقط
  - `macOS Release` العام للتحقق فقط؛ عندما يعيش وسم على فرع إصدار فقط لكن سير العمل
    مُرسل من `main`، عيّن `public_release_branch=release/YYYY.M.D`
  - يجب أن يجتاز نشر mac الخاص الحقيقي `preflight_run_id` و`validate_run_id` ناجحين
  - تروّج مسارات النشر الحقيقية العناصر المُحضّرة بدلًا من إعادة بنائها مجددًا
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد النشر أيضًا
  من مسار الترقية نفسه ببادئة مؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N` حتى لا تترك تصحيحات
  الإصدار التثبيتات العالمية الأقدم بصمت على حمولة الإصدار المستقر الأساسي
- يفشل فحص ما قبل إصدار npm بإغلاق افتراضي ما لم يتضمن ملف tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق ما بعد النشر أيضًا من وجود نقاط دخول Plugin المنشورة وبيانات الحزمة في تخطيط
  السجل المثبت. أي إصدار يشحن حمولات تشغيل Plugin مفقودة يفشل مدقق ما بعد النشر ولا
  يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` لحزم npm على ملف tarball
  لتحديث المرشح، حتى يلتقط e2e الخاص بالمثبت تضخم الحزمة العرضي قبل مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت الامتدادات، أو مصفوفات اختبارات
  الامتدادات، فأعد توليد ومراجعة مخرجات مصفوفة `plugin-prerelease-extension-shard`
  المملوكة للمخطط من `.github/workflows/plugin-prerelease.yml` قبل الاعتماد حتى لا تصف
  ملاحظات الإصدار تخطيط CI قديمًا
- تشمل جاهزية إصدار macOS المستقر أيضًا أسطح المحدث:
  - يجب أن ينتهي إصدار GitHub مع ملفات `.zip` و`.dmg` و`.dSYM.zip` المحزومة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحافظ التطبيق المحزوم على معرّف حزمة غير مخصص للتصحيح، ورابط تغذية Sparkle
    غير فارغ، و`CFBundleVersion` عند حد أدنى بناء Sparkle القانوني أو أعلى منه
    لذلك الإصدار

## صناديق اختبار الإصدار

`Full Release Validation` هو طريقة المشغلين لتشغيل كل اختبارات ما قبل الإصدار من
نقطة دخول واحدة. لإثبات التزام مثبت على فرع سريع الحركة، استخدم المساعد حتى يعمل كل
سير عمل فرعي من فرع مؤقت مثبت على SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويرسل `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن `headSha` لكل سير عمل فرعي
يطابق الهدف، ثم يحذف الفرع المؤقت. يمنع هذا إثبات تشغيل فرعي من `main`
أحدث عن طريق الخطأ.

للتحقق من فرع إصدار أو وسم، شغّله من مرجع سير العمل `main` الموثوق
ومرّر فرع الإصدار أو الوسم بوصفه `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

يقوم سير العمل بحل مرجع الهدف، ويرسل `CI` اليدوي مع
`target_ref=<release-ref>`، ويرسل `OpenClaw Release Checks`، ويحضّر
عنصرًا أبًا باسم `release-package-under-test` للفحوصات المواجهة للحزمة، ويرسل
اختبار Telegram E2E مستقلًا للحزمة عندما يكون `release_profile=full` مع
`rerun_group=all` أو عندما يكون `npm_telegram_package_spec` مضبوطًا. بعد ذلك تتوسع
`OpenClaw Release Checks` إلى فحص تثبيت أولي، وفحوصات إصدار عبر أنظمة تشغيل متعددة، وتغطية مسار إصدار Docker الحية/E2E
عند تفعيل الاختبار المطوّل، وPackage Acceptance مع ضمان جودة حزمة Telegram،
وتكافؤ QA Lab، وMatrix حي، وTelegram حي. لا يكون التشغيل الكامل مقبولًا إلا عندما يُظهر
ملخص `Full Release Validation`
أن `normal_ci` و`release_checks` ناجحان. في وضع full/all،
يجب أن ينجح التابع `npm_telegram` أيضًا؛ وخارج full/all يتم تخطيه
ما لم تُوفَّر `npm_telegram_package_spec` منشورة. يتضمن ملخص
التحقق النهائي جداول أبطأ المهام لكل تشغيل تابع، بحيث يستطيع مدير الإصدار
رؤية المسار الحرج الحالي دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، وفروق ملف التعريف stable مقابل full،
والعناصر، ومقابض إعادة التشغيل المركزة.
تُرسل سير العمل التابعة من المرجع الموثوق الذي يشغل `Full Release
Validation`، وعادةً `--ref main`، حتى عندما يشير `ref` الهدف إلى
فرع إصدار أو وسم أقدم. لا يوجد مُدخل workflow-ref منفصل لسير عمل Full Release Validation؛
اختر الحاضنة الموثوقة باختيار مرجع تشغيل سير العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات الالتزام الدقيق على `main` المتحرك؛
لا يمكن استخدام قيم SHA الخام للالتزامات كمراجع لإرسال سير العمل، لذا استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبت.

استخدم `release_profile` لاختيار نطاق التغطية الحية/المزوّد:

- `minimum`: أسرع مسار حي ومسار Docker حرجين للإصدار في OpenAI/النواة
- `stable`: الحد الأدنى إضافةً إلى تغطية المزوّد/الخلفية المستقرة لاعتماد الإصدار
- `full`: المستقر إضافةً إلى تغطية واسعة للمزوّدين/الوسائط الاستشارية

استخدم `run_release_soak=true` مع `stable` عندما تكون المسارات الحاجبة للإصدار
خضراء وتريد الفحص الحي/E2E الشامل، ومسار إصدار Docker، ومسح ترقية منشور محدود يتحقق من بقاء الترقيات قبل الترويج. يغطي ذلك المسح
أحدث أربع حزم مستقرة إضافةً إلى خطي الأساس المثبتين `2026.4.23` و`2026.5.2`
وتغطية `2026.4.15` الأقدم، مع إزالة خطوط الأساس المكررة
وتقسيم كل خط أساس إلى مهمة Docker runner مستقلة. يتضمن `full`
`run_release_soak=true`.

تستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل مرجع الهدف
مرة واحدة باسم `release-package-under-test` وتعيد استخدام ذلك العنصر في فحوصات cross-OS،
وPackage Acceptance، وفحوصات Docker لمسار الإصدار عند تشغيل الاختبار المطوّل. هذا يُبقي
كل الصناديق المواجهة للحزمة على البايتات نفسها ويتجنب بناء الحزمة بشكل متكرر.
يستخدم فحص تثبيت OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون
متغير المستودع/المؤسسة مضبوطًا، وإلا يستخدم `openai/gpt-5.4`، لأن هذا المسار
يثبت تثبيت الحزمة، والإعداد الأولي، وبدء Gateway، ودورة واحدة حية للوكيل
بدلًا من قياس أداء أبطأ نموذج افتراضي. تبقى مصفوفة المزوّدين الحية الأوسع
هي المكان المناسب للتغطية الخاصة بالنماذج.

استخدم هذه الصيغ حسب مرحلة الإصدار:

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
فاستخدم سير العمل التابع الفاشل، أو المهمة، أو مسار Docker، أو ملف تعريف الحزمة، أو
مزوّد النموذج، أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة أخرى فقط عندما
يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل دليل كل الصناديق السابق
قديمًا. يعيد متحقق المظلة النهائي فحص معرفات تشغيل سير العمل التابعة
المسجلة، لذلك بعد إعادة تشغيل سير عمل تابع بنجاح، أعد تشغيل مهمة الأصل الفاشلة
`Verify full validation` فقط.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل
مرشح الإصدار الحقيقي، و`ci` يشغّل تابع CI العادي فقط، و`plugin-prerelease`
يشغّل تابع Plugin الخاص بالإصدار فقط، و`release-checks` يشغّل كل صناديق الإصدار،
ومجموعات الإصدار الأضيق هي `install-smoke` و`cross-os`
و`live-e2e` و`package` و`qa` و`qa-parity` و`qa-live` و`npm-telegram`.
تتطلب عمليات إعادة تشغيل `npm-telegram` المركزة `npm_telegram_package_spec`؛ أما عمليات full/all
مع `release_profile=full` فتستخدم عنصر حزمة release-checks. يمكن لعمليات إعادة تشغيل
cross-OS المركزة إضافة `cross_os_suite_filter=windows/packaged-upgrade` أو
مرشح آخر لنظام التشغيل/الحزمة. إخفاقات QA في release-checks استشارية؛ ولا يحجب
فشل QA فقط التحقق من الإصدار.

### Vitest

صندوق Vitest هو سير عمل `CI` التابع اليدوي. يتجاوز CI اليدوي عمدًا
تحديد النطاق حسب التغييرات ويفرض رسم الاختبارات العادي لمرشح الإصدار:
أجزاء Linux Node، وأجزاء Plugin المضمنة، وعقود القنوات، وتوافق Node 22،
و`check` و`check-additional`، وفحص البناء الأولي، وفحوصات الوثائق، وSkills الخاصة بـ Python،
وWindows، وmacOS، وAndroid، وControl UI i18n.

استخدم هذا الصندوق للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية الكاملة؟"
إنه ليس مطابقًا للتحقق المنتج لمسار الإصدار. الدليل المطلوب الاحتفاظ به:

- ملخص `Full Release Validation` الذي يعرض URL تشغيل `CI` المُرسل
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الأجزاء الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- عناصر توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما
  يحتاج التشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي ولكن
ليس صناديق Docker أو QA Lab أو live أو cross-OS أو الحزم:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker في `OpenClaw Release Checks` من خلال
`openclaw-live-and-e2e-checks-reusable.yml`، إضافةً إلى سير عمل
`install-smoke` في وضع الإصدار. يتحقق من مرشح الإصدار عبر بيئات
Docker المعبأة بدلًا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- فحص تثبيت أولي كامل مع تفعيل فحص تثبيت Bun العالمي البطيء
- تحضير/إعادة استخدام صورة فحص Dockerfile الجذر حسب SHA الهدف، مع تشغيل مهام QR،
  والجذر/Gateway، وفحص المثبت/Bun كأجزاء install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core` و`package-update-openai`
  و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins`
  و`plugins-runtime-services`
  و`plugins-runtime-install-a` و`plugins-runtime-install-b`
  و`plugins-runtime-install-c` و`plugins-runtime-install-d`
  و`plugins-runtime-install-e` و`plugins-runtime-install-f`
  و`plugins-runtime-install-g` و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إلغاء تثبيت Plugin المضمنة المقسمة
  من `bundled-plugin-install-uninstall-0` إلى
  `bundled-plugin-install-uninstall-23`
- حزم المزوّدين الحية/E2E وتغطية نماذج Docker الحية عندما تتضمن فحوصات الإصدار
  حزمًا حية

استخدم عناصر Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للاسترداد المركز،
استخدم `docker_lanes=<lane[,lane]>` على سير عمل live/E2E القابل لإعادة الاستخدام بدلًا من
إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل المُولدة
`package_artifact_run_id` السابق ومدخلات صورة Docker المحضرة عند توفرها، بحيث يمكن
للمسار الفاشل إعادة استخدام tarball وصور GHCR نفسها.

### QA Lab

صندوق QA Lab هو أيضًا جزء من `OpenClaw Release Checks`. إنه بوابة إصدار
السلوك الوكيلي وعلى مستوى القناة، منفصلًا عن Vitest وآليات حزم Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ mock يقارن مسار OpenAI المرشح بخط أساس Opus 4.6
  باستخدام حزمة التكافؤ الوكيلي
- ملف تعريف Matrix QA حي سريع باستخدام بيئة `qa-live-shared`
- مسار Telegram QA حي باستخدام تأجيرات بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج قياس الإصدار عن بُعد إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات الحية؟" احتفظ بعناوين URL للعناصر الخاصة بمسارات التكافؤ وMatrix وTelegram
عند اعتماد الإصدار. تظل تغطية Matrix الكاملة متاحة كتشغيل QA-Lab يدوي مقسم
بدلًا من المسار الافتراضي الحرج للإصدار.

### الحزمة

صندوق الحزمة هو بوابة المنتج القابل للتثبيت. يدعمه
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبع المحلل
المرشح في tarball باسم `package-under-test` الذي يستهلكه Docker E2E، ويتحقق
من مخزون الحزمة، ويسجل إصدار الحزمة وSHA-256، ويُبقي
مرجع حاضنة سير العمل منفصلًا عن مرجع مصدر الحزمة.

مصادر المرشح المدعومة:

- `source=npm`: `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيق
- `source=ref`: حزم فرع `package_ref` موثوق أو وسم أو SHA التزام كامل
  باستخدام حاضنة `workflow_ref` المحددة
- `source=url`: تنزيل `.tgz` عبر HTTPS مع `package_sha256` مطلوب
- `source=artifact`: إعادة استخدام `.tgz` رُفع بواسطة تشغيل GitHub Actions آخر

تشغّل `OpenClaw Release Checks` Package Acceptance مع `source=artifact`،
وعنصر حزمة الإصدار المحضر، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
و`telegram_mode=mock-openai`. تحافظ Package Acceptance على الهجرة، والتحديث،
وإعادة تشغيل تحديث المصادقة المكوّنة، وتنظيف تبعيات Plugin القديمة، وتجهيزات Plugin غير المتصل،
وتحديث Plugin، وضمان جودة حزمة Telegram مقابل tarball المحلول نفسه. تستخدم
فحوصات الإصدار الحاجبة خط أساس الحزمة المنشورة الأحدث افتراضيًا؛ و`run_release_soak=true` أو
`release_profile=full` يوسّعان ذلك إلى كل خط أساس مستقر منشور على npm من
`2026.4.23` حتى `latest` إضافةً إلى تجهيزات المشكلات المُبلغ عنها. استخدم
Package Acceptance مع `source=npm` لمرشح تم شحنه بالفعل، أو
`source=ref`/`source=artifact` لـ tarball npm محلي مدعوم بـ SHA قبل
النشر. إنه البديل الأصلي في GitHub لمعظم تغطية الحزم/التحديثات التي كانت تتطلب
Parallels سابقًا. تظل فحوصات cross-OS مهمة للإعداد الأولي الخاص بأنظمة التشغيل،
والمثبت، وسلوك المنصة، لكن تحقق المنتج للحزم/التحديثات ينبغي أن يفضل
Package Acceptance.

القائمة المرجعية المعتمدة للتحقق من التحديثات وPlugin هي
[اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins). استخدمها عند
تحديد أي مسار محلي أو Docker أو Package Acceptance أو release-check يثبت
تثبيت/تحديث Plugin، أو تنظيف doctor، أو تغيير هجرة حزمة منشورة.
الهجرة الشاملة لتحديث منشور من كل حزمة مستقرة `2026.4.23+` هي
سير عمل يدوي منفصل `Update Migration`، وليست جزءًا من Full Release CI.

تسامح قبول الحزم القديم محدد زمنيا عمدا. يجوز للحزم حتى
`2026.4.25` استخدام مسار التوافق لفجوات البيانات الوصفية المنشورة مسبقا
إلى npm: إدخالات مخزون ضمان الجودة الخاصة المفقودة من ملف tarball، وغياب
`gateway install --wrapper`، وغياب ملفات التصحيح في fixture الخاص بـ git
المستمد من tarball، وغياب `update.channel` المحفوظ، ومواقع سجلات تثبيت
Plugin القديمة، وغياب حفظ سجلات تثبيت marketplace، وترحيل بيانات الإعدادات
الوصفية أثناء `plugins update`. قد تعرض الحزمة المنشورة `2026.4.26` تحذيرا
لملفات ختم بيانات وصفية للبناء المحلي كانت قد شحنت بالفعل. يجب أن تفي الحزم
اللاحقة بعقود الحزم الحديثة؛ وتفشل فجوات البيانات نفسها في تحقق الإصدار.

استخدم ملفات تعريف Package Acceptance الأوسع عندما يكون سؤال الإصدار متعلقا
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
- `package`: عقود حزمة التثبيت/التحديث/إعادة التشغيل/Plugin من دون ClawHub
  مباشر؛ هذا هو الإعداد الافتراضي لفحص الإصدار
- `product`: `package` إضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي، وبحث
  OpenAI على الويب، وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لإعادات التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في Package Acceptance. يمرر سير العمل ملف
tarball المحلول `package-under-test` إلى مسار Telegram؛ ولا يزال سير عمل
Telegram المستقل يقبل مواصفة npm منشورة لفحوص ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة دخول النشر المعدلة المعتادة. ينسق سير عمل
الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. استخرج وسم الإصدار وحل SHA الخاص بالالتزام.
2. تحقق من أن الوسم قابل للوصول من `main` أو `release/*`.
3. شغّل `pnpm plugins:sync:check`.
4. أرسل `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. أرسل `Plugin ClawHub Release` بالنطاق نفسه وSHA نفسه.
6. أرسل `OpenClaw NPM Release` مع وسم الإصدار، ووسم توزيع npm، و
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

استخدم سيري عمل `Plugin NPM Release` و`Plugin ClawHub Release` ذوي المستوى
الأدنى فقط لأعمال إصلاح أو إعادة نشر مركزة. لإصلاح Plugin محدد، مرر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أرسل سير العمل الفرعي مباشرة عندما يجب ألا
تنشر حزمة OpenClaw.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ وعندما يكون `preflight_only=true`، قد يكون أيضا SHA
  الالتزام الحالي الكامل المؤلف من 40 حرفا لفرع سير العمل من أجل فحص تمهيدي
  للتحقق فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى يعيد سير العمل استخدام
  ملف tarball المحضر من تشغيل الفحص التمهيدي الناجح
- `npm_dist_tag`: وسم npm الهدف لمسار النشر؛ القيمة الافتراضية `beta`

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب؛ يجب أن يكون موجودا مسبقا
- `preflight_run_id`: معرّف تشغيل فحص تمهيدي ناجح لـ `OpenClaw NPM Release`؛
  مطلوب عندما يكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm الهدف لحزمة OpenClaw
- `plugin_publish_scope`: القيمة الافتراضية `all-publishable`؛ استخدم
  `selected` فقط لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما يكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: القيمة الافتراضية `true`؛ اضبطه على `false` فقط
  عند استخدام سير العمل كمنسق إصلاح خاص بـ Plugin فقط

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق منه. تتطلب الفحوص التي تحمل
  أسرارا أن يكون الالتزام المحلول قابلا للوصول من فرع OpenClaw أو وسم إصدار.
- `run_release_soak`: الاشتراك في اختبار تحمل شامل مباشر/E2E، ومسار إصدار
  Docker، وترقية البقاء على قيد الحياة منذ كل الإصدارات في فحوص الإصدار
  المستقر/الافتراضي. يفرضه `release_profile=full`.

القواعد:

- يجوز للوسوم المستقرة ووسوم التصحيح النشر إلى `beta` أو `latest`
- يجوز لوسوم ما قبل إصدار بيتا النشر فقط إلى `beta`
- بالنسبة إلى `OpenClaw NPM Release`، لا يسمح بإدخال SHA التزام كامل إلا
  عندما يكون `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` للتحقق فقط دائما
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء الفحص
  التمهيدي؛ ويتحقق سير العمل من استمرار صحة تلك البيانات الوصفية قبل النشر

## تسلسل إصدار npm مستقر

عند إعداد إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الحالي الكامل لفرع سير العمل
     لتشغيل تجريبي للتحقق فقط من سير عمل الفحص التمهيدي
2. اختر `npm_dist_tag=beta` للتدفق المعتاد الذي يبدأ بالبيتا، أو `latest`
   فقط عندما تريد عمدا نشرا مستقرا مباشرا
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو SHA
   الالتزام الكامل عندما تريد CI المعتاد إضافة إلى تغطية ذاكرة التخزين
   المؤقت للموجهات المباشرة، وDocker، وQA Lab، وMatrix، وTelegram من سير عمل
   يدوي واحد
4. إذا كنت تحتاج عمدا إلى مخطط الاختبار الحتمي العادي فقط، فشغّل سير عمل
   `CI` اليدوي على مرجع الإصدار بدلا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` مع `tag` نفسه، و`npm_dist_tag` نفسه،
   و`preflight_run_id` المحفوظ؛ ينشر ذلك Plugins الخارجية إلى npm وClawHub
   قبل ترقية حزمة npm الخاصة بـ OpenClaw
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية تلك النسخة المستقرة من `beta` إلى `latest`
8. إذا نشر الإصدار عمدا مباشرة إلى `latest` ويجب أن يتبع `beta` البناء
   المستقر نفسه فورا، فاستخدم سير العمل الخاص نفسه لتوجيه وسمي التوزيع إلى
   النسخة المستقرة، أو دع مزامنة الإصلاح الذاتي المجدولة تنقل `beta` لاحقا

يقع تعديل وسم التوزيع في المستودع الخاص لأسباب أمنية لأنه لا يزال يتطلب
`NPM_TOKEN`، بينما يحتفظ المستودع العام بالنشر المعتمد على OIDC فقط.

يبقي ذلك مسار النشر المباشر ومسار الترقية الذي يبدأ بالبيتا موثقين ومرئيين
للمشغلين.

إذا اضطر أحد الصائنين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر
1Password CLI (`op`) داخل جلسة tmux مخصصة فقط. لا تستدع `op` مباشرة من صدفة
الوكيل الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات والتنبيهات والتعامل مع OTP
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

يستخدم الصائنون وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
لدليل التشغيل الفعلي.

## ذو صلة

- [قنوات الإصدار](/ar/install/development-channels)
