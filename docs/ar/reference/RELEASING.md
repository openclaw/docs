---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرة إصدارها
summary: مسارات الإصدار، قائمة تحقق المشغل، مربعات التحقق، تسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-05-02T23:39:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- مستقر: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- بيتا: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- تطوير: الرأس المتحرك للفرع `main`

## تسمية الإصدارات

- إصدار الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار تصحيح مستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار بيتا ما قبل الإصدار: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفارًا بادئة إلى الشهر أو اليوم
- `latest` يعني إصدار npm المستقر الحالي الذي تمت ترقيته
- `beta` يعني هدف التثبيت التجريبي الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضيًا؛ يمكن لمشغلي الإصدار استهداف `latest` صراحةً، أو ترقية بناء بيتا مُدقّق لاحقًا
- كل إصدار OpenClaw مستقر يشحن حزمة npm وتطبيق macOS معًا؛
  عادةً ما تتحقق إصدارات بيتا من مسار npm/package وتنشره أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق mac لإصدارات الاستقرار ما لم يُطلب ذلك صراحةً

## وتيرة الإصدارات

- تتحرك الإصدارات وفق نهج بيتا أولًا
- لا يأتي الإصدار المستقر إلا بعد التحقق من أحدث إصدار بيتا
- عادةً ما يقتطع المشرفون الإصدارات من فرع `release/YYYY.M.D` يُنشأ
  من `main` الحالي، بحيث لا تمنع عملية التحقق من الإصدار وإصلاحاته
  التطوير الجديد على `main`
- إذا دُفع وسم بيتا أو نُشر ويحتاج إلى إصلاح، يقتطع المشرفون
  وسم `-beta.N` التالي بدلًا من حذف وسم بيتا القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد dist-tag، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار الخاص بالمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وأكد أن الالتزام الهدف قد دُفع،
   وأكد أن CI الحالي على `main` أخضر بما يكفي لإنشاء فرع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، واجعل الإدخالات موجهة للمستخدم، ثم التزم بها وادفعها، وأجرِ rebase/pull
   مرة أخرى قبل إنشاء الفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يظل مسار الترقية مغطى، أو سجّل سبب حمله عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. ارفع رقم الإصدار في كل موضع مطلوب للوسم المقصود، وشغّل
   `pnpm plugins:sync` حتى تشارك حزم Plugin القابلة للنشر إصدار الإصدار
   وبيانات التوافق، ثم شغّل الفحص المحلي الحتمي المسبق:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل بطول 40 حرفًا لفرع الإصدار للتحقق المسبق فقط.
   احفظ `preflight_run_id` الناجح.
7. ابدأ جميع اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار أو الوسم أو SHA الكامل للالتزام. هذا هو مدخل التشغيل اليدوي الوحيد
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest، وDocker، وQA Lab، وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر ملف أو مسار أو مهمة workflow
   أو ملف تعريف حزمة أو مزود أو allowlist نموذج فشل ويثبت الإصلاح. أعد تشغيل
   المظلة الكاملة فقط عندما يجعل السطح المتغير الأدلة السابقة قديمة.
9. بالنسبة إلى بيتا، وسّم `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   وينشر أولًا كل حزم Plugin القابلة للنشر إلى npm، وينشر المجموعة نفسها إلى
   ClawHub ثانيًا، ثم يرقّي أثر فحص OpenClaw npm المسبق المُحضّر باستخدام
   dist-tag المطابق. بعد النشر، شغّل قبول الحزمة بعد النشر مقابل حزمة
   `openclaw@YYYY.M.D-beta.N` أو `openclaw@beta` المنشورة. إذا احتاج ما قبل الإصدار
   الذي دُفع أو نُشر إلى إصلاح، فاقتطع رقم ما قبل الإصدار المطابق التالي؛
   لا تحذف ما قبل الإصدار القديم ولا تعيد كتابته.
10. بالنسبة إلى الإصدار المستقر، لا تتابع إلا بعد أن يمتلك إصدار بيتا المُدقّق
    أو مرشح الإصدار أدلة التحقق المطلوبة. نشر npm المستقر يمر أيضًا عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أثر الفحص المسبق الناجح عبر
    `preflight_run_id`؛ كما تتطلب جاهزية إصدار macOS المستقر وجود
    `.zip` و`.dmg` و`.dSYM.zip` المعبأة، و`appcast.xml` المحدّث على `main`.
11. بعد النشر، شغّل متحقق npm بعد النشر، واختبار Telegram E2E الاختياري المستقل
    من npm المنشور عندما تحتاج إلى دليل قناة بعد النشر، وترقية dist-tag عند الحاجة،
    وملاحظات إصدار/ما قبل إصدار GitHub من قسم `CHANGELOG.md` المطابق الكامل،
    وخطوات إعلان الإصدار.

## الفحص المسبق للإصدار

- شغّل `pnpm check:test-types` قبل فحص الإصدار التمهيدي حتى يبقى TypeScript الخاص بالاختبارات
  مشمولًا خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل فحص الإصدار التمهيدي حتى تكون فحوصات دورات الاستيراد
  الأوسع وحدود البنية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون عناصر الإصدار المتوقعة
  `dist/*` وحزمة واجهة Control UI موجودة لخطوة التحقق من الحزمة
- شغّل `pnpm plugins:sync` بعد رفع إصدار الجذر وقبل وضع الوسم. فهو
  يحدّث إصدارات حزم Plugin القابلة للنشر، وبيانات توافق OpenClaw النظير/API،
  وبيانات البناء، ومسودات سجل تغييرات Plugin لتطابق إصدار النواة.
  `pnpm plugins:sync:check` هو حارس الإصدار غير المعدِّل؛ ويفشل سير عمل النشر
  قبل أي تعديل في السجل إذا نُسيت هذه الخطوة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل اعتماد الإصدار
  لتشغيل كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا،
  أو وسمًا، أو SHA كاملًا للالتزام، ويطلق `CI` يدويًا، ويطلق
  `OpenClaw Release Checks` لمسارات فحص التثبيت، وقبول الحزمة، ومجموعات مسار
  إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix،
  ومسارات Telegram. مع `release_profile=full` و`rerun_group=all`، يشغّل أيضًا
  Telegram E2E للحزمة مقابل عنصر `release-package-under-test` الناتج من فحوصات
  الإصدار. قدّم `npm_telegram_package_spec` بعد النشر عندما يجب على Telegram E2E
  نفسها إثبات حزمة npm المنشورة أيضًا. قدّم `package_acceptance_package_spec`
  بعد النشر عندما ينبغي أن يشغّل Package Acceptance مصفوفة الحزمة/التحديث الخاصة به
  مقابل حزمة npm المشحونة بدلًا من العنصر المبني من SHA. قدّم
  `evidence_package_spec` عندما يجب أن يثبت تقرير الأدلة الخاص أن التحقق
  يطابق حزمة npm منشورة من دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد دليلًا من قناة جانبية
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` من أجل
  `openclaw@beta`، أو `openclaw@latest`، أو إصدار محدد بدقة؛ و`source=ref`
  لحزم فرع/وسم/SHA موثوق في `package_ref` باستخدام عدة `workflow_ref` الحالية؛
  و`source=url` لأرشيف tarball عبر HTTPS مع SHA-256 إلزامي؛ أو `source=artifact`
  لأرشيف tarball مرفوع من تشغيل GitHub Actions آخر. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E مقابل ذلك
  الأرشيف، ويمكنه تشغيل Telegram QA مقابل الأرشيف نفسه باستخدام
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن
  مسارات Docker المحددة `published-upgrade-survivor`، يكون عنصر الحزمة هو
  المرشح ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات الشخصية الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/Plugin الأصلية للعنصر من دون OpenWebUI أو ClawHub حي
  - `product`: ملف الحزمة الشخصي إضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي،
    وبحث الويب من OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: تحديد `docker_lanes` بدقة لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI العادية الكاملة
  لمرشح الإصدار. تتجاوز عمليات إطلاق CI اليدوية نطاق التغييرات
  وتفرض أجزاء Linux Node، وأجزاء Plugin المضمّنة، وعقود القنوات،
  وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء،
  وفحوصات الوثائق، وSkills الخاصة بـ Python، وWindows، وmacOS، وAndroid، ومسارات i18n
  الخاصة بواجهة Control UI.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياس الإصدار. فهو يمرّن
  QA-lab عبر مستقبِل OTLP/HTTP محلي ويتحقق من أسماء نطاقات التتبع المصدّرة،
  والسمات المحدودة، وتنقيح المحتوى/المعرّفات من دون الحاجة إلى Opik أو Langfuse
  أو جامع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المعدِّل بعد وجود الوسم.
  أطلقه من `release/YYYY.M.D` (أو `main` عند نشر وسم يمكن الوصول إليه من main)،
  ومرّر وسم الإصدار و`preflight_run_id` الناجح الخاص بـ npm لـ OpenClaw،
  وأبقِ نطاق نشر Plugin الافتراضي `all-publishable` إلا إذا كنت تشغّل إصلاحًا
  مركزًا عمدًا. ينسّق سير العمل نشر npm الخاص بـ Plugin، ونشر ClawHub الخاص بـ Plugin،
  ونشر npm الخاص بـ OpenClaw حتى لا تُنشر حزمة النواة قبل Plugins الخارجية.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ QA Lab الوهمي إضافة إلى ملف Matrix
  الحي السريع ومسار Telegram QA قبل اعتماد الإصدار. تستخدم المسارات الحية بيئة
  `qa-live-shared`؛ ويستخدم Telegram أيضًا عقود اعتماد Convex CI. شغّل سير العمل
  اليدوي `QA-Lab - All Lanes` مع `matrix_profile=all` و`matrix_shards=true`
  عندما تريد جرد نقل Matrix الكامل والوسائط وE2EE بالتوازي.
- تحقق وقت تشغيل التثبيت والترقية عبر أنظمة التشغيل جزء من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، اللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا
  وحتميًا ومركّزًا على العناصر، بينما تبقى الفحوصات الحية الأبطأ في مسارها الخاص
  حتى لا تؤخر النشر أو تمنعه
- ينبغي إطلاق فحوصات الإصدار التي تحمل أسرارًا عبر `Full Release
Validation` أو من مرجع سير العمل `main`/release حتى تبقى منطق سير العمل
  والأسرار تحت السيطرة
- يقبل `OpenClaw Release Checks` فرعًا، أو وسمًا، أو SHA كاملًا للالتزام ما دام
  الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار
- يقبل فحص `OpenClaw NPM Release` التمهيدي المخصص للتحقق فقط أيضًا SHA الالتزام
  الحالي الكامل المكوّن من 40 حرفًا لفرع سير العمل من دون اشتراط وسم مدفوع
- مسار SHA هذا مخصص للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA ينشئ سير العمل `v<package.json version>` فقط لفحص بيانات
  الحزمة؛ أما النشر الحقيقي فما زال يتطلب وسم إصدار حقيقيًا
- يحافظ كلا سيري العمل على مسار النشر والترقية الحقيقي على مشغلات GitHub المستضافة،
  بينما يمكن لمسار التحقق غير المعدِّل استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل ذلك سير العمل
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد فحص npm التمهيدي للإصدار ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور
  في بادئة مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تأهيل الحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي
  مقابل حزمة npm المنشورة باستخدام تجمع بيانات اعتماد Telegram المؤجرة المشتركة.
  يمكن للقطات المحلية الفردية للمشرفين حذف متغيرات Convex وتمرير بيانات اعتماد البيئة الثلاثة
  `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- يمكن للمشرفين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر سير العمل
  اليدوي `NPM Telegram Beta E2E`. وهو يدوي فقط عمدًا ولا يعمل عند كل دمج.
- تستخدم أتمتة إصدار المشرفين الآن نمط الفحص التمهيدي ثم الترقية:
  - يجب أن يجتاز نشر npm الحقيقي `preflight_run_id` ناجحًا لـ npm
  - يجب إطلاق نشر npm الحقيقي من فرع `main` أو
    `release/YYYY.M.D` نفسه مثل تشغيل الفحص التمهيدي الناجح
  - الإصدارات المستقرة من npm تستخدم `beta` افتراضيًا
  - يمكن لنشر npm المستقر استهداف `latest` صراحة عبر مدخل سير العمل
  - انتقل تعديل dist-tag في npm المستند إلى الرموز الآن إلى
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` ما زال يحتاج إلى `NPM_TOKEN` بينما
    يبقي المستودع العام النشر عبر OIDC فقط
  - `macOS Release` العام مخصص للتحقق فقط؛ عندما يكون الوسم موجودًا على فرع
    إصدار فقط لكن سير العمل يُطلق من `main`، اضبط
    `public_release_branch=release/YYYY.M.D`
  - يجب أن يجتاز نشر mac الخاص الحقيقي `preflight_run_id` و`validate_run_id`
    ناجحين للـ mac الخاص
  - ترقّي مسارات النشر الحقيقية العناصر المجهزة بدلًا من إعادة بنائها مرة أخرى
- بالنسبة لإصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد النشر
  أيضًا من مسار الترقية نفسه ببادئة مؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار التثبيتات العامة الأقدم بصمت على حمولة الإصدار
  المستقر الأساسي
- يفشل فحص npm التمهيدي للإصدار بإغلاق آمن ما لم يتضمن الأرشيف كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق فحص ما بعد النشر أيضًا من وجود نقاط دخول Plugin المنشورة
  وبيانات الحزمة في تخطيط السجل المثبت. الإصدار الذي يشحن حمولات تشغيل Plugin
  ناقصة يفشل في مدقق ما بعد النشر ولا يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` الخاصة بحزمة npm
  على أرشيف تحديث المرشح، حتى يلتقط installer e2e تضخم الحزمة العرضي
  قبل مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت الامتدادات، أو مصفوفات اختبار
  الامتدادات، فأعد توليد ومراجعة مخرجات مصفوفة
  `plugin-prerelease-extension-shard` المملوكة للمخطط من
  `.github/workflows/plugin-prerelease.yml` قبل الاعتماد حتى لا تصف ملاحظات الإصدار
  تخطيط CI قديمًا
- تشمل جاهزية إصدار macOS المستقر أيضًا أسطح التحديث:
  - يجب أن ينتهي إصدار GitHub ومعه ملفات `.zip` و`.dmg` و`.dSYM.zip` المعبأة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحافظ التطبيق المعبأ على معرّف حزمة غير مخصص للتصحيح، وعنوان URL غير فارغ
    لتغذية Sparkle، و`CFBundleVersion` عند أو فوق الحد الأدنى القانوني لبناء Sparkle
    لإصدار ذلك الإصدار

## صناديق اختبار الإصدار

`Full Release Validation` هي الطريقة التي يطلق بها المشغلون كل اختبارات ما قبل الإصدار من
نقطة دخول واحدة. للحصول على دليل التزام مثبت على فرع سريع الحركة، استخدم
المساعد حتى يعمل كل سير عمل فرعي من فرع مؤقت مثبت على SHA المستهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويطلق `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن `headSha` لكل سير عمل فرعي
يطابق الهدف، ثم يحذف الفرع المؤقت. يتجنب هذا إثبات تشغيل فرعي أحدث من
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

يحل سير العمل مرجع الهدف، ويشغّل `CI` يدويًا مع
`target_ref=<release-ref>`، ويشغّل `OpenClaw Release Checks`، ويشغّل
اختبار Telegram E2E المستقل للحزمة عندما يكون `release_profile=full` مع
`rerun_group=all` أو عندما يتم ضبط `npm_telegram_package_spec`. ثم يوسّع
`OpenClaw Release Checks` التنفيذ إلى install smoke، وفحوصات الإصدار عبر أنظمة التشغيل، وتغطية مسار إصدار Docker الحية/E2E، وPackage Acceptance مع ضمان جودة حزمة Telegram، وتكافؤ QA Lab، وMatrix الحي، وTelegram الحي. لا يُعد التشغيل الكامل مقبولًا إلا عندما يعرض ملخص
`Full Release Validation`
أن `normal_ci` و`release_checks` ناجحان. في وضع full/all،
يجب أن يكون الطفل `npm_telegram` ناجحًا أيضًا؛ وخارج full/all يتم تخطيه
ما لم يتم توفير `npm_telegram_package_spec` منشور. يتضمن ملخص
التحقق النهائي جداول أبطأ المهام لكل تشغيل طفل، حتى يتمكن مدير الإصدار من رؤية المسار الحرج الحالي من دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، والفروق بين ملف التعريف stable وfull، والآثار، ومقابض إعادة التشغيل المركّزة.
تُشغَّل مهام سير العمل الطفل من المرجع الموثوق الذي يشغّل `Full Release
Validation`، عادةً `--ref main`، حتى عندما يشير `ref` الهدف إلى
فرع إصدار أو وسم أقدم. لا يوجد إدخال منفصل لمرجع سير عمل Full Release Validation؛ اختر حاضنة التشغيل الموثوقة باختيار مرجع تشغيل سير العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات الالتزام الدقيق على `main` المتحرك؛
لا يمكن أن تكون قيم SHA الخام للالتزامات مراجع تشغيل لسير العمل، لذلك استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبّت.

استخدم `release_profile` لتحديد اتساع التغطية الحية/المزوّد:

- `minimum`: أسرع مسار OpenAI/core حي وDocker حرج للإصدار
- `stable`: الحد الأدنى بالإضافة إلى تغطية المزوّدات/الخلفيات المستقرة لاعتماد الإصدار
- `full`: stable بالإضافة إلى تغطية استشارية واسعة للمزوّدين/الوسائط

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع الهدف
مرة واحدة باسم `release-package-under-test` ويعيد استخدام ذلك الأثر في كل من
فحوصات Docker لمسار الإصدار وPackage Acceptance. وهذا يبقي كل صناديق
مواجهة الحزمة على البايتات نفسها ويتجنب تكرار بناء الحزمة.
يستخدم install smoke الخاص بـ OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون متغير المستودع/المؤسسة مضبوطًا، وإلا `openai/gpt-5.4`، لأن هذا المسار
يثبت تثبيت الحزمة، والإعداد الأولي، وبدء تشغيل Gateway، ودورة وكيل حية واحدة
بدلًا من قياس أداء أبطأ نموذج افتراضي. تظل مصفوفة المزوّدات الحية الأوسع
هي المكان المخصص للتغطية الخاصة بالنماذج.

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

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركّز. إذا فشل صندوق واحد،
فاستخدم سير العمل الطفل الفاشل، أو المهمة، أو مسار Docker، أو ملف تعريف الحزمة، أو مزوّد النموذج، أو مسار QA للإثبات التالي. أعد تشغيل المظلة الكاملة مرة أخرى فقط عندما
يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل أدلة كل الصناديق السابقة
قديمة. يعيد متحقق المظلة النهائي فحص معرّفات تشغيل مهام سير العمل الطفل المسجلة، لذلك بعد إعادة تشغيل سير عمل طفل بنجاح، أعد تشغيل مهمة الأب الفاشلة فقط
`Verify full validation`.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل
مرشح الإصدار الحقيقي، و`ci` يشغّل طفل CI العادي فقط، و`plugin-prerelease`
يشغّل طفل Plugin الخاص بالإصدار فقط، و`release-checks` يشغّل كل صندوق إصدار،
ومجموعات الإصدار الأضيق هي `install-smoke` و`cross-os` و
`live-e2e` و`package` و`qa` و`qa-parity` و`qa-live` و`npm-telegram`.
تتطلب إعادات تشغيل `npm-telegram` المركّزة `npm_telegram_package_spec`؛ أما عمليات full/all
مع `release_profile=full` فتستخدم أثر حزمة release-checks.

### Vitest

صندوق Vitest هو سير عمل `CI` الطفل اليدوي. يتجاوز CI اليدوي عمدًا
نطاق التغييرات ويفرض مخطط الاختبار العادي لمرشح الإصدار: شظايا Linux Node، وشظايا Plugin المضمنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وbuild smoke، وفحوصات المستندات، وPython skills، وWindows، وmacOS، وAndroid، وControl UI i18n.

استخدم هذا الصندوق للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية الكاملة؟"
إنه ليس مماثلًا للتحقق من المنتج عبر مسار الإصدار. الأدلة التي يجب الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض عنوان URL لتشغيل `CI` المشغّل
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الشظايا الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- آثار توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما
  يحتاج التشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرةً فقط عندما يحتاج الإصدار إلى CI عادي حتمي ولكن
لا يحتاج إلى صناديق Docker أو QA Lab أو الحية أو عبر أنظمة التشغيل أو الحزم:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يقع صندوق Docker في `OpenClaw Release Checks` من خلال
`openclaw-live-and-e2e-checks-reusable.yml`، بالإضافة إلى سير عمل
`install-smoke` بوضع الإصدار. يتحقق من مرشح الإصدار عبر بيئات Docker
المعبأة بدلًا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- install smoke كامل مع تمكين install smoke العام البطيء لـ Bun
- إعداد/إعادة استخدام صورة smoke من Dockerfile الجذري بحسب SHA الهدف، مع تشغيل مهام QR،
  والجذر/Gateway، وinstaller/Bun smoke كشظايا install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`،
  و`plugins-runtime-services`،
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إزالة تثبيت Plugin المضمنة المقسّمة
  من `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات المزوّدين الحية/E2E وتغطية نماذج Docker الحية عندما تتضمن فحوصات الإصدار
  مجموعات حية

استخدم آثار Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وملف JSON لخطة المجدول، وأوامر إعادة التشغيل. للاسترداد المركّز،
استخدم `docker_lanes=<lane[,lane]>` في سير العمل الحي/E2E القابل لإعادة الاستخدام بدلًا من
إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل المولدة
`package_artifact_run_id` السابق ومدخلات صورة Docker المحضّرة عند توفرها، حتى يمكن
لمسار فاشل إعادة استخدام tarball وصور GHCR نفسها.

### QA Lab

صندوق QA Lab هو أيضًا جزء من `OpenClaw Release Checks`. إنه بوابة الإصدار
لسلوك الوكيل وعلى مستوى القناة، منفصل عن Vitest وآليات حزم Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ mock يقارن مسار مرشح OpenAI بخط أساس Opus 4.6
  باستخدام حزمة التكافؤ الوكيلية
- ملف تعريف QA سريع وحَي لـ Matrix باستخدام بيئة `qa-live-shared`
- مسار QA حي لـ Telegram باستخدام عقود إيجار بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج قياس الإصدار عن بُعد إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA وتدفقات القنوات الحية؟"
احتفظ بعناوين URL للآثار الخاصة بمسارات التكافؤ وMatrix وTelegram عند اعتماد الإصدار. تظل تغطية Matrix الكاملة متاحة كتشغيل QA-Lab يدوي مقسّم إلى شظايا بدلًا من المسار الافتراضي الحرج للإصدار.

### الحزمة

صندوق الحزمة هو بوابة المنتج القابل للتثبيت. وهو مدعوم بـ
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبّع المحلل
المرشح إلى tarball `package-under-test` الذي تستهلكه Docker E2E، ويتحقق من
مخزون الحزمة، ويسجل إصدار الحزمة وSHA-256، ويبقي مرجع حاضنة سير العمل منفصلًا عن مرجع مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيق
- `source=ref`: حزم فرع `package_ref` موثوق أو وسم أو SHA التزام كامل
  مع حاضنة `workflow_ref` المحددة
- `source=url`: تنزيل `.tgz` عبر HTTPS مع `package_sha256` المطلوب
- `source=artifact`: إعادة استخدام `.tgz` مرفوع بواسطة تشغيل GitHub Actions آخر

يشغّل `OpenClaw Release Checks` Package Acceptance مع `source=artifact`، وأثر حزمة الإصدار
المحضّر، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
و`published_upgrade_survivor_baselines=all-since-2026.4.23`,
و`published_upgrade_survivor_scenarios=reported-issues`، و
`telegram_mode=mock-openai`. يحافظ Package Acceptance على الترحيل، والتحديث، وتنظيف اعتماديات Plugin القديمة، وتركيبات Plugin غير المتصلة، وتحديث Plugin، وضمان جودة حزمة Telegram
مقابل tarball المحلول نفسه. تغطي مصفوفة الترقية كل خط أساس مستقر منشور على npm من `2026.4.23` حتى `latest`؛ استخدم
Package Acceptance مع `source=npm` لمرشح تم شحنه بالفعل، أو
`source=ref`/`source=artifact` لـ tarball npm محلي مدعوم بـ SHA قبل
النشر. وهو البديل الأصلي في GitHub لمعظم تغطية الحزمة/التحديث التي كانت تتطلب
Parallels سابقًا. لا تزال فحوصات الإصدار عبر أنظمة التشغيل مهمة للإعداد الأولي الخاص بنظام التشغيل،
والمثبت، وسلوك المنصة، لكن يجب أن يفضّل التحقق من المنتج للحزمة/التحديث
Package Acceptance.

قائمة التحقق القياسية للتحقق من التحديث وPlugin هي
[اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins). استخدمها عند
تحديد أي مسار محلي أو Docker أو Package Acceptance أو release-check يثبت
تثبيت/تحديث Plugin، أو تنظيف doctor، أو تغيير ترحيل حزمة منشورة.
ترحيل التحديث المنشور الشامل من كل حزمة `2026.4.23+` مستقرة
هو سير عمل `Update Migration` يدوي منفصل، وليس جزءًا من Full Release CI.

تم تحديد مرونة package-acceptance القديمة زمنيًا عمدًا. قد تستخدم الحزم حتى
`2026.4.25` مسار التوافق لفجوات البيانات الوصفية المنشورة بالفعل
إلى npm: إدخالات مخزون QA الخاصة المفقودة من tarball، و
`gateway install --wrapper` المفقود، وملفات التصحيح المفقودة في تركيب git
المشتق من tarball، و`update.channel` المستمر المفقود، ومواقع سجل تثبيت Plugin
القديمة، واستمرارية سجل تثبيت marketplace المفقودة، وترحيل بيانات تعريف الإعدادات
أثناء `plugins update`. قد تحذر حزمة `2026.4.26` المنشورة
من ملفات ختم بيانات تعريف البناء المحلية التي تم شحنها بالفعل. يجب أن تفي الحزم اللاحقة
بعقود الحزم الحديثة؛ وتفشل الفجوات نفسها في التحقق من الإصدار.

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

- `smoke`: مسارات سريعة لتثبيت الحزمة/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
- `package`: عقود حزمة التثبيت/التحديث/Plugin من دون ClawHub حي؛ هذا هو الإعداد الافتراضي لـ release-check
- `product`: `package` بالإضافة إلى قنوات MCP، وتنظيف cron/subagent، وبحث الويب في OpenAI، وOpenWebUI
- `full`: أجزاء Docker لمسار الإصدار مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لإعادات التشغيل المركّزة

لإثبات مرشح حزمة Telegram، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في Package Acceptance. يمرر سير العمل حزمة
`package-under-test` tarball التي تم حلها إلى مسار Telegram؛ ولا يزال سير عمل
Telegram المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدارات

`OpenClaw Release Publish` هو نقطة الدخول العادية للنشر المعدِّل. وهو ينسق
سير عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. اسحب وسم الإصدار وحدد SHA الالتزام الخاص به.
2. تحقق من أن الوسم يمكن الوصول إليه من `main` أو `release/*`.
3. شغّل `pnpm plugins:sync:check`.
4. أرسل `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. أرسل `Plugin ClawHub Release` بالنطاق وSHA نفسيهما.
6. أرسل `OpenClaw NPM Release` مع وسم الإصدار، ووسم توزيع npm، و
   `preflight_run_id` المحفوظ.

مثال نشر Beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

نشر Stable إلى وسم توزيع beta الافتراضي:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

الترقية Stable مباشرة إلى `latest` صريحة:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

استخدم سيري العمل الأقل مستوى `Plugin NPM Release` و`Plugin ClawHub Release`
فقط لأعمال الإصلاح أو إعادة النشر المركزة. لإصلاح Plugin محدد، مرر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أرسل سير العمل الفرعي مباشرة عندما يجب عدم
نشر حزمة OpenClaw.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ وعندما تكون `preflight_only=true`، يمكن أن يكون أيضًا
  SHA الالتزام الكامل الحالي المكوّن من 40 حرفًا لفرع سير العمل، وذلك لفحص
  ما قبل النشر المخصص للتحقق فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي لكي يعيد سير العمل استخدام
  حزمة tarball المحضّرة من تشغيل ما قبل النشر الناجح
- `npm_dist_tag`: وسم npm الهدف لمسار النشر؛ افتراضيًا `beta`

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب؛ يجب أن يكون موجودًا مسبقًا
- `preflight_run_id`: معرّف تشغيل ما قبل النشر الناجح لـ`OpenClaw NPM Release`؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm الهدف لحزمة OpenClaw
- `plugin_publish_scope`: افتراضيًا `all-publishable`؛ استخدم `selected` فقط
  لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: افتراضيًا `true`؛ اضبطها على `false` فقط عند استخدام
  سير العمل كمنسق إصلاح خاص بالـPlugin فقط

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو وسم أو SHA الالتزام الكامل المراد التحقق منه. تتطلب الفحوصات
  التي تحمل أسرارًا أن يكون الالتزام المحلول قابلًا للوصول من فرع OpenClaw
  أو وسم إصدار.

القواعد:

- يمكن لوسوم Stable والتصحيح النشر إلى `beta` أو `latest`
- يمكن لوسوم ما قبل إصدار Beta النشر إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، يُسمح بإدخال SHA الالتزام الكامل فقط
  عندما تكون `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` مخصصان دائمًا للتحقق فقط
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء ما قبل
  النشر؛ ويتحقق سير العمل من هذه البيانات الوصفية قبل متابعة النشر

## تسلسل إصدار npm Stable

عند إصدار npm Stable:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الكامل الحالي لفرع سير العمل
     لتشغيل تجريبي بلا نشر لسير عمل ما قبل النشر مخصص للتحقق فقط
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ بـbeta، أو `latest` فقط
   عندما تريد عمدًا نشر Stable مباشرًا
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو SHA الالتزام
   الكامل عندما تريد CI العادي بالإضافة إلى تغطية ذاكرة التخزين المؤقت
   للمطالبات الحية، وDocker، وQA Lab، وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدًا إلى مخطط الاختبارات العادي الحتمي فقط، فشغّل سير عمل
   `CI` اليدوي على مرجع الإصدار بدلًا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` مع `tag` نفسه، و`npm_dist_tag` نفسه،
   و`preflight_run_id` المحفوظ؛ فهو ينشر Plugins الخارجية إلى npm وClawHub
   قبل ترقية حزمة OpenClaw npm
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية إصدار Stable هذا من `beta` إلى `latest`
8. إذا نُشر الإصدار عمدًا مباشرة إلى `latest` وكان يجب أن يتبع `beta` بنية
   Stable نفسها فورًا، فاستخدم سير العمل الخاص نفسه لتوجيه وسمي التوزيع إلى
   إصدار Stable، أو اترك مزامنة الإصلاح الذاتي المجدولة تنقل `beta` لاحقًا

توجد عملية تعديل وسم التوزيع في المستودع الخاص لأسباب أمنية لأنها لا تزال
تتطلب `NPM_TOKEN`، بينما يحتفظ المستودع العام بنشر يعتمد على OIDC فقط.

وهذا يُبقي مساري النشر المباشر والترقية التي تبدأ بـbeta موثقين ومرئيين
للمشغلين.

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

## ذو صلة

- [قنوات الإصدار](/ar/install/development-channels)
