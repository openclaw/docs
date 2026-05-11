---
read_when:
    - جارٍ البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرتها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، ومربعات التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-05-11T20:40:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- المستقر: الإصدارات الموسومة التي تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- بيتا: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- التطوير: الرأس المتحرك لـ `main`

## تسمية الإصدارات

- إصدار الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار تصحيح مستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار بيتا ما قبل الإصدار: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تُضف أصفارًا بادئة للشهر أو اليوم
- يعني `latest` إصدار npm المستقر والمروَّج حاليًا
- يعني `beta` هدف التثبيت التجريبي الحالي
- تُنشر إصدارات المستقر وتصحيحات المستقر إلى npm `beta` افتراضيًا؛ يمكن لمشغلي الإصدار استهداف `latest` صراحةً، أو ترقية بناء بيتا مُدقَّق لاحقًا
- يشحن كل إصدار OpenClaw مستقر حزمة npm وتطبيق macOS معًا؛
  تتحقق إصدارات بيتا عادةً من مسار npm/الحزمة وتنشره أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق Mac للمستقر ما لم يُطلب ذلك صراحةً

## وتيرة الإصدار

- تتحرك الإصدارات بنهج بيتا أولًا
- لا يأتي المستقر إلا بعد التحقق من أحدث إصدار بيتا
- ينشئ المشرفون عادةً الإصدارات من فرع `release/YYYY.M.D` مُنشأ
  من `main` الحالي، حتى لا تمنع عملية التحقق من الإصدار وإصلاحاته
  التطوير الجديد على `main`
- إذا دُفع وسم بيتا أو نُشر واحتاج إلى إصلاح، ينشئ المشرفون
  وسم `-beta.N` التالي بدلًا من حذف وسم بيتا القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد dist-tag، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار الخاص بالمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وأكد أن الالتزام الهدف مدفوع،
   وأكد أن CI الحالي لـ `main` أخضر بما يكفي للتفرع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، وأبقِ الإدخالات موجهة للمستخدم، ثم التزم به، وادفعه، وأعد الأساس/اسحب
   مرة أخرى قبل التفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يظل مسار الترقية مغطى، أو سجّل سبب حمله عمدًا.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. ارفع كل موضع إصدار مطلوب للوسم المقصود، ثم شغّل
   `pnpm release:prep`. يحدّث ذلك إصدارات Plugin، ومخزون Plugin، ومخطط
   الإعدادات، وبيانات تعريف إعدادات القنوات المضمّنة، وخط أساس توثيق
   الإعدادات، وصادرات SDK الخاصة بـ Plugin، وخط أساس واجهة API الخاصة بـ SDK لـ Plugin
   بالترتيب الصحيح. التزم بأي انحراف مُولَّد قبل الوسم. ثم شغّل فحص ما قبل الإطلاق المحلي الحتمي:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل من 40 محرفًا لفرع الإصدار للتحقق فقط
   في فحص ما قبل الإطلاق. احفظ `preflight_run_id` الناجح.
7. ابدأ جميع اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار أو الوسم أو SHA الالتزام الكامل. هذه هي نقطة الدخول اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest، وDocker، وQA Lab، وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر
   ملف أو مسار أو مهمة سير عمل أو ملف تعريف حزمة أو مزود أو قائمة سماح نموذج
   يثبت الإصلاح. أعد تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير
   الأدلة السابقة قديمة.
9. بالنسبة إلى بيتا، ضع وسم `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   ويرسل كل حزم Plugin القابلة للنشر إلى npm والمجموعة نفسها إلى
   ClawHub بالتوازي، ثم يروّج قطعة OpenClaw npm المُحضّرة من فحص ما قبل الإطلاق
   مع dist-tag المطابق بمجرد نجاح نشر Plugin إلى npm.
   بعد نجاح ابن نشر OpenClaw إلى npm، ينشئ أو يحدّث صفحة GitHub release/prerelease
   المطابقة من قسم `CHANGELOG.md` المطابق الكامل. تصبح الإصدارات المستقرة المنشورة إلى npm `latest`
   أحدث إصدار GitHub؛ أما إصدارات الصيانة المستقرة المحفوظة على npm `beta`
   فتُنشأ مع GitHub `latest=false`.
   قد يظل نشر ClawHub قيد التشغيل بينما يُنشر OpenClaw إلى npm، لكن سير عمل نشر الإصدار
   يطبع معرّفات تشغيل الأبناء فورًا. افتراضيًا لا ينتظر ClawHub بعد إرساله،
   لذلك لا يُحجب توفر OpenClaw على npm بسبب موافقات ClawHub الأبطأ أو عمل السجل؛ اضبط
   `wait_for_clawhub=true` عندما يجب أن يحجب ClawHub اكتمال سير العمل. يعيد مسار
   ClawHub محاولة إخفاقات تثبيت اعتماد CLI العابرة، وينشر
   Plugins التي تجتاز المعاينة حتى عندما تتعثر خلية معاينة واحدة، وينتهي
   بتحقق السجل لكل إصدار Plugin متوقع حتى تبقى النشرات الجزئية
   مرئية وقابلة لإعادة المحاولة. بعد النشر، شغّل
   قبول الحزمة بعد النشر
   ضد حزمة `openclaw@YYYY.M.D-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاج إصدار ما قبل الإصدار المدفوع أو المنشور إلى إصلاح،
   فأنشئ رقم ما قبل الإصدار المطابق التالي؛ لا تحذف إصدار ما قبل الإصدار القديم
   أو تعيد كتابته.
10. بالنسبة إلى المستقر، لا تتابع إلا بعد أن يمتلك إصدار بيتا أو مرشح الإصدار المُدقَّق
    أدلة التحقق المطلوبة. يمر نشر npm المستقر أيضًا عبر
    `OpenClaw Release Publish`، مع إعادة استخدام قطعة فحص ما قبل الإطلاق الناجحة عبر
    `preflight_run_id`؛ وتتطلب جاهزية إصدار macOS المستقر أيضًا وجود
    `.zip` و`.dmg` و`.dSYM.zip` و`appcast.xml` المحدث على `main`.
    ينشر سير عمل نشر macOS الخاص appcast الموقّع إلى `main` العام
    تلقائيًا بعد التحقق من أصول الإصدار؛ إذا منعت حماية الفرع
    الدفع المباشر، فإنه يفتح أو يحدّث PR لـ appcast.
11. بعد النشر، شغّل مدقق npm لما بعد النشر، واختبار Telegram E2E الاختياري المستقل
    على npm المنشور عندما تحتاج إلى إثبات قناة بعد النشر،
    وترقية dist-tag عند الحاجة، وتحقق من صفحة GitHub release المولدة،
    وشغّل خطوات إعلان الإصدار.

## فحص ما قبل الإصدار

- شغّل `pnpm check:test-types` قبل الفحص التمهيدي للإصدار حتى يظل TypeScript الخاص بالاختبارات
  مشمولًا خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل الفحص التمهيدي للإصدار حتى تكون فحوصات دورات الاستيراد
  الأوسع وحدود البنية ناجحة خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون آثار الإصدار
  المتوقعة `dist/*` وحزمة Control UI موجودة لخطوة التحقق من الحزمة
- شغّل `pnpm release:prep` بعد رفع إصدار الجذر وقبل وضع الوسم. فهو يشغّل كل
  مولد إصدار حتمي ينحرف عادة بعد تغيير في الإصدار/الإعداد/API: إصدارات Plugins،
  وجرد Plugins، ومخطط الإعداد الأساسي، وبيانات تعريف إعدادات القنوات المضمّنة،
  وخط أساس مستندات الإعداد، وتصديرات Plugin SDK، وخط أساس API الخاص بـ Plugin SDK.
  يعيد `pnpm release:check` تشغيل تلك الحراس في وضع الفحص ويبلغ عن كل فشل انحراف
  مولّد يجده في مرور واحد قبل تشغيل فحوصات إصدار الحزمة.
- شغّل سير العمل اليدوي `Full Release Validation` قبل اعتماد الإصدار لبدء جميع
  صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا أو وسمًا أو SHA كاملًا
  للالتزام، ويطلق `CI` يدويًا، ويطلق `OpenClaw Release Checks` لفحص التثبيت السريع،
  وقبول الحزمة، وفحوصات الحزمة عبر أنظمة التشغيل، وتكافؤ QA Lab، ومسارات Matrix
  وTelegram. تبقي التشغيلات المستقرة/الافتراضية اختبارات live/E2E الشاملة ونقع
  مسار إصدار Docker خلف `run_release_soak=true`؛ ويفرض `release_profile=full`
  تشغيل النقع. ومع `release_profile=full` و`rerun_group=all`، يشغّل أيضًا E2E
  الخاص بـ Telegram للحزمة مقابل أثر `release-package-under-test` من فحوصات الإصدار.
  وفّر `release_package_spec` بعد نشر إصدار تجريبي لإعادة استخدام حزمة npm المنشورة
  عبر فحوصات الإصدار، وقبول الحزمة، وE2E الخاص بـ Telegram للحزمة من دون إعادة بناء
  أرشيف tarball للإصدار. وفّر `npm_telegram_package_spec` فقط عندما ينبغي أن يستخدم
  Telegram حزمة منشورة مختلفة عن بقية تحقق الإصدار. وفّر
  `package_acceptance_package_spec` عندما ينبغي أن يستخدم قبول الحزمة حزمة منشورة
  مختلفة عن مواصفة حزمة الإصدار. وفّر `evidence_package_spec` عندما ينبغي أن يثبت
  تقرير الأدلة الخاص أن التحقق يطابق حزمة npm منشورة من دون فرض E2E الخاص بـ Telegram.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد دليلًا من قناة جانبية
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` لـ `openclaw@beta`،
  أو `openclaw@latest`، أو إصدار دقيق؛ و`source=ref` لحزم فرع/وسم/SHA موثوق
  في `package_ref` باستخدام حزمة `workflow_ref` الحالية؛ و`source=url` لأرشيف
  tarball عبر HTTPS مع SHA-256 مطلوب؛ أو `source=artifact` لأرشيف tarball مرفوع
  بواسطة تشغيل GitHub Actions آخر. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E مقابل ذلك الأرشيف،
  ويمكنه تشغيل Telegram QA مقابل الأرشيف نفسه باستخدام `telegram_mode=mock-openai`
  أو `telegram_mode=live-frontier`. عندما تتضمن مسارات Docker المحددة
  `published-upgrade-survivor`، يكون أثر الحزمة هو المرشح ويحدد
  `published_upgrade_survivor_baseline` خط الأساس المنشور. يستخدم `update-restart-auth`
  حزمة المرشح بصفتها CLI المثبتة والحزمة قيد الاختبار، بحيث يختبر مسار إعادة التشغيل
  المدارة لأمر تحديث المرشح.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/إعادة التشغيل/Plugin الأصلية للأثر من دون OpenWebUI أو ClawHub مباشر
  - `product`: ملف الحزمة إضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي،
    وبحث الويب من OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` الدقيق لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI العادية الكاملة
  لمرشح الإصدار. تتجاوز إطلاقات CI اليدوية النطاق المستند إلى التغييرات وتفرض
  أجزاء Linux Node، وأجزاء Plugin المضمّنة، وعقود القنوات، وتوافق Node 22،
  و`check`، و`check-additional`، وفحص البناء السريع، وفحوصات المستندات،
  وPython skills، وWindows، وmacOS، وAndroid، ومسارات i18n الخاصة بـ Control UI.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. فهو يختبر
  QA-lab عبر مستقبل OTLP/HTTP محلي، ويتحقق من أسماء امتدادات التتبع المصدّرة،
  والسمات المحدودة، وتنقيح المحتوى/المعرّفات من دون طلب Opik أو Langfuse أو جامع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المغيّر بعد وجود الوسم. أطلقه من
  `release/YYYY.M.D` (أو `main` عند نشر وسم قابل للوصول من main)، ومرر وسم الإصدار
  و`preflight_run_id` ناجحًا لـ npm الخاص بـ OpenClaw، وأبق نطاق نشر Plugin الافتراضي
  `all-publishable` ما لم تكن تشغّل إصلاحًا مركزًا عمدًا. يسلسل سير العمل نشر Plugin
  إلى npm، ونشر Plugin إلى ClawHub، ونشر OpenClaw إلى npm حتى لا تُنشر الحزمة الأساسية
  قبل Plugins الخارجية الخاصة بها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ QA Lab الوهمي إضافة إلى ملف Matrix
  المباشر السريع ومسار Telegram QA قبل اعتماد الإصدار. تستخدم المسارات المباشرة بيئة
  `qa-live-shared`؛ ويستخدم Telegram أيضًا إيجارات بيانات اعتماد Convex CI. شغّل سير
  العمل اليدوي `QA-Lab - All Lanes` مع `matrix_profile=all` و`matrix_shards=true`
  عندما تريد جرد نقل Matrix الكامل والوسائط وE2EE بالتوازي.
- تحقق تشغيل التثبيت والترقية عبر أنظمة التشغيل جزء من `OpenClaw Release Checks`
  و`Full Release Validation` العامين، اللذين يستدعيان سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: أبق مسار إصدار npm الحقيقي قصيرًا وحتميًا ومركزًا على الآثار،
  بينما تبقى الفحوصات المباشرة الأبطأ في مسارها الخاص حتى لا تؤخر النشر أو تحظره
- ينبغي إطلاق فحوصات الإصدار التي تحمل أسرارًا عبر `Full Release
Validation` أو من مرجع سير العمل `main`/release حتى يبقى منطق سير العمل
  والأسرار تحت السيطرة
- يقبل `OpenClaw Release Checks` فرعًا أو وسمًا أو SHA كاملًا للالتزام ما دام
  الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار
- يقبل الفحص التمهيدي للتحقق فقط `OpenClaw NPM Release` أيضًا SHA الكامل الحالي
  المكوّن من 40 محرفًا لالتزام فرع سير العمل من دون طلب وسم مدفوع
- مسار SHA هذا للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط لفحص بيانات تعريف الحزمة؛
  ما يزال النشر الحقيقي يتطلب وسم إصدار حقيقيًا
- يبقي كلا سيري العمل مسار النشر والترقية الحقيقيين على مشغلات مستضافة في GitHub،
  بينما يمكن لمسار التحقق غير المغيّر استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل ذلك سير العمل
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد الفحص التمهيدي لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم الإصدار التجريبي/التصحيح المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار الإصدار التجريبي/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور
  في بادئة مؤقتة جديدة
- بعد نشر إصدار تجريبي، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تمهيد الحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي مقابل حزمة
  npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المؤجرة المشتركة. يمكن لعمليات
  المشرف المحلية لمرة واحدة حذف متغيرات Convex وتمرير بيانات اعتماد البيئة الثلاث
  `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- لتشغيل فحص الإصدار التجريبي الكامل بعد النشر من جهاز مشرف، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق تحديث npm في Parallels/هدف جديد، ويطلق `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل الدقيق، وينزّل الأثر، ويطبع تقرير Telegram.
- يمكن للمشرفين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر سير العمل اليدوي
  `NPM Telegram Beta E2E`. وهو يدوي فقط عمدًا ولا يعمل عند كل دمج.
- تستخدم أتمتة إصدارات المشرفين الآن الفحص التمهيدي ثم الترقية:
  - يجب أن يجتاز نشر npm الحقيقي `preflight_run_id` ناجحًا لـ npm
  - يجب إطلاق نشر npm الحقيقي من فرع `main` نفسه أو فرع
    `release/YYYY.M.D` نفسه مثل تشغيل الفحص التمهيدي الناجح
  - تستهدف إصدارات npm المستقرة `beta` افتراضيًا
  - يمكن لنشر npm المستقر استهداف `latest` صراحة عبر إدخال سير العمل
  - أصبح تعديل وسم توزيع npm المستند إلى الرمز المميز موجودًا الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` ما يزال يحتاج إلى `NPM_TOKEN` بينما
    يبقي المستودع العام النشر عبر OIDC فقط
  - `macOS Release` العام مخصص للتحقق فقط؛ عندما يوجد وسم على فرع إصدار فقط
    لكن سير العمل يُطلق من `main`، عيّن `public_release_branch=release/YYYY.M.D`
  - يجب أن يجتاز نشر mac الخاص الحقيقي `preflight_run_id` و`validate_run_id`
    ناجحين للـ mac الخاص
  - تروّج مسارات النشر الحقيقية الآثار المحضّرة بدل إعادة بنائها مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مدقق ما بعد النشر
  أيضًا من مسار الترقية نفسه ببادئة مؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N` حتى لا
  تترك تصحيحات الإصدار التثبيتات العالمية الأقدم على حمولة الإصدار المستقر الأساسي
  بصمت
- يفشل الفحص التمهيدي لإصدار npm مغلقًا ما لم يتضمن أرشيف tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق تحقق ما بعد النشر أيضًا من أن نقاط دخول Plugins المنشورة وبيانات تعريف
  الحزمة موجودة في تخطيط السجل المثبت. يفشل الإصدار الذي يشحن حمولات تشغيل Plugin
  مفقودة في مدقق ما بعد النشر ولا يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` الخاصة بحزمة npm
  على أرشيف tarball المرشح للتحديث، بحيث يلتقط installer e2e تضخم الحزمة العرضي
  قبل مسار نشر الإصدار
- إذا مس عمل الإصدار تخطيط CI، أو بيانات توقيت الإضافات، أو مصفوفات اختبار الإضافات،
  فأعد توليد ومراجعة مخرجات مصفوفة `plugin-prerelease-extension-shard` المملوكة للمخطط
  من `.github/workflows/plugin-prerelease.yml` قبل الاعتماد حتى لا تصف ملاحظات الإصدار
  تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح المحدّث:
  - يجب أن ينتهي إصدار GitHub بملفات `.zip` و`.dmg` و`.dSYM.zip` المحزومة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر؛
    يثبته سير عمل نشر macOS الخاص تلقائيًا، أو يفتح PR لـ appcast عندما يكون الدفع
    المباشر محظورًا
  - يجب أن يحتفظ التطبيق المحزوم بمعرّف حزمة غير خاص بالتصحيح، وعنوان URL غير فارغ
    لتغذية Sparkle، و`CFBundleVersion` يساوي أو يتجاوز الحد الأدنى القانوني لبناء
    Sparkle لذلك إصدار الإصدار

## صناديق اختبار الإصدار

`Full Release Validation` هو الطريقة التي يبدأ بها المشغلون كل اختبارات ما قبل الإصدار
من نقطة دخول واحدة. للحصول على دليل التزام مثبت على فرع سريع الحركة، استخدم
المساعد حتى يعمل كل سير عمل فرعي من فرع مؤقت مثبت عند SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويشغّل `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن كل `headSha` لسير عمل فرعي
يطابق الهدف، ثم يحذف الفرع المؤقت. يتجنب هذا إثبات تشغيل فرعي
أحدث من `main` عن طريق الخطأ.

للتحقق من فرع إصدار أو وسم إصدار، شغّله من مرجع سير عمل `main` الموثوق
ومرّر فرع الإصدار أو الوسم باعتباره `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

يحل سير العمل المرجع الهدف، ويشغّل `CI` يدويًا مع
`target_ref=<release-ref>`، ويشغّل `OpenClaw Release Checks`، ويحضّر
أثرًا أصليًا باسم `release-package-under-test` للفحوصات الموجّهة للحزمة،
ويشغّل Telegram E2E مستقلًا للحزمة عندما تكون `release_profile=full` مع
`rerun_group=all` أو عندما تكون `release_package_spec` أو
`npm_telegram_package_spec` مضبوطة. ثم يوسّع `OpenClaw Release
Checks` التنفيذ إلى فحص تثبيت سريع، وفحوصات إصدار عبر أنظمة تشغيل متعددة،
وتغطية live/E2E Docker لمسار الإصدار عند تفعيل اختبار التحمل، وPackage Acceptance مع
Telegram package QA، وتكافؤ QA Lab، وMatrix مباشر، وTelegram مباشر. لا يكون التشغيل الكامل مقبولًا إلا عندما يعرض ملخص
`Full Release Validation`
كلًا من `normal_ci` و`release_checks` كناجحين. في وضع full/all،
يجب أن يكون الفرع `npm_telegram` ناجحًا أيضًا؛ وخارج full/all يتم تخطيه
ما لم يتم توفير `release_package_spec` أو `npm_telegram_package_spec`
منشور. يتضمن ملخص
المدقق النهائي جداول للمهام الأبطأ لكل تشغيل فرعي، لكي يتمكن مدير الإصدار
من رؤية المسار الحرج الحالي دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، والفروق بين ملفي
stable وfull، والآثار، ومقابض إعادة التشغيل المركزة.
تُشغّل مسارات العمل الفرعية من المرجع الموثوق الذي يشغّل `Full Release
Validation`، وغالبًا `--ref main`، حتى عندما يشير `ref` الهدف إلى
فرع إصدار أو وسم أقدم. لا يوجد مُدخل منفصل لمرجع سير عمل Full Release Validation؛
اختر حاضنة الاختبار الموثوقة باختيار مرجع تشغيل سير العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات التزام دقيق على `main` متحرك؛
لا يمكن أن تكون قيم SHA الخام للالتزامات مراجع تشغيل لسير العمل، لذا استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبّت.

استخدم `release_profile` لاختيار اتساع التنفيذ المباشر/المزوّد:

- `minimum`: أسرع مسار مباشر وإلزامي للإصدار لـ OpenAI/النواة وDocker
- `stable`: الحد الأدنى إضافة إلى تغطية المزوّد/الخلفية المستقرة لاعتماد الإصدار
- `full`: المستقر إضافة إلى تغطية واسعة لمزوّدي/وسائط الاستشارات

استخدم `run_release_soak=true` مع `stable` عندما تكون المسارات الحاجبة للإصدار
خضراء وتريد التنفيذ الشامل لـ live/E2E، ومسار إصدار Docker، ومسح
البقاء بعد الترقية المنشورة المحدود قبل الترويج. يغطي ذلك المسح
آخر أربع حزم مستقرة إضافة إلى خطي الأساس المثبّتين `2026.4.23` و`2026.5.2`
إضافة إلى تغطية `2026.4.15` الأقدم، مع إزالة خطوط الأساس المكررة
وتقسيم كل خط أساس إلى مهمة Docker runner خاصة به. يتضمن `full`
`run_release_soak=true`.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع الهدف
مرة واحدة باسم `release-package-under-test` ويعيد استخدام ذلك الأثر في فحوصات
cross-OS، وPackage Acceptance، وفحوصات Docker لمسار الإصدار عند تشغيل اختبار التحمل. يبقي هذا
كل البيئات الموجهة للحزمة على البايتات نفسها ويتجنب عمليات بناء الحزمة المتكررة.
بعد أن تكون نسخة beta منشورة بالفعل على npm، اضبط `release_package_spec=openclaw@YYYY.M.D-beta.N`
لكي تنزّل فحوصات الإصدار الحزمة المشحونة مرة واحدة، وتستخرج SHA لمصدر بنائها
من `dist/build-info.json`، وتعيد استخدام ذلك الأثر في مسارات cross-OS،
وPackage Acceptance، وDocker لمسار الإصدار، وTelegram للحزمة.
يستخدم فحص تثبيت OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون
متغير المستودع/المؤسسة مضبوطًا، وإلا فيستخدم `openai/gpt-5.4`، لأن هذا المسار
يثبت تثبيت الحزمة، والإعداد الأولي، وبدء Gateway، ودورة واحدة مباشرة للوكيل
بدلًا من قياس أبطأ نموذج افتراضي. تظل مصفوفة المزوّدين المباشرة الأوسع
هي موضع التغطية الخاصة بالنماذج.

استخدم هذه الأنواع بحسب مرحلة الإصدار:

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركز. إذا فشلت بيئة واحدة
فاستخدم سير العمل الفرعي الفاشل، أو المهمة، أو مسار Docker، أو ملف الحزمة،
أو مزوّد النموذج، أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة أخرى فقط عندما
يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل دليل كل البيئات السابق
قديمًا. يعيد المدقق النهائي للمظلة فحص معرّفات تشغيل مسارات العمل الفرعية المسجلة،
لذا بعد إعادة تشغيل سير عمل فرعي بنجاح، أعد تشغيل مهمة الأصل الفاشلة
`Verify full validation` فقط.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل
مرشح الإصدار الحقيقي، و`ci` يشغّل فرع CI العادي فقط، و`plugin-prerelease`
يشغّل فرع Plugin الخاص بالإصدار فقط، و`release-checks` يشغّل كل بيئات الإصدار،
ومجموعات الإصدار الأضيق هي `install-smoke`، و`cross-os`،
و`live-e2e`، و`package`، و`qa`، و`qa-parity`، و`qa-live`، و`npm-telegram`.
تتطلب إعادة تشغيل `npm-telegram` المركزة `release_package_spec` أو
`npm_telegram_package_spec`؛ أما تشغيلات full/all مع `release_profile=full` فتستخدم
أثر حزمة release-checks. يمكن لإعادات تشغيل
cross-OS المركزة إضافة `cross_os_suite_filter=windows/packaged-upgrade` أو
مرشح آخر لنظام تشغيل/مجموعة اختبارات. إخفاقات QA في release-checks استشارية؛ فشل QA فقط
لا يحجب التحقق من الإصدار.

### Vitest

بيئة Vitest هي سير العمل الفرعي `CI` اليدوي. يتجاوز CI اليدوي عمدًا
النطاق حسب التغييرات ويفرض مخطط الاختبار العادي لمرشح الإصدار:
أجزاء Linux Node، وأجزاء Plugins المضمنة، وعقود القنوات، وتوافق Node 22،
و`check`، و`check-additional`، وفحص البناء السريع، وفحوصات الوثائق، وPython
skills، وWindows، وmacOS، وAndroid، وتدويل Control UI.

استخدم هذه البيئة للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية الكاملة؟"
إنها ليست مثل التحقق من المنتج في مسار الإصدار. الدليل الذي يجب الاحتفاظ به:

- ملخص `Full Release Validation` الذي يعرض رابط تشغيل `CI` المشغّل
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الأجزاء الفاشلة أو البطيئة من مهام CI عند التحقيق في الانحدارات
- آثار توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما
  يحتاج تشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي ولكن
لا يحتاج إلى بيئات Docker، أو QA Lab، أو التشغيل المباشر، أو cross-OS، أو الحزمة:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

توجد بيئة Docker في `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، إضافة إلى سير عمل
`install-smoke` في وضع الإصدار. تتحقق من مرشح الإصدار عبر بيئات Docker
معبأة بدلًا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- فحص تثبيت سريع كامل مع تمكين فحص تثبيت Bun العام البطيء
- تحضير/إعادة استخدام صورة فحص Dockerfile الجذرية حسب SHA الهدف، مع تشغيل مهام QR،
  والجذر/Gateway، والمثبت/Bun كأجزاء install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`،
  و`plugins-runtime-services`،
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إزالة تثبيت Plugin المضمنة المقسمة
  من `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات اختبارات المزوّدين live/E2E وتغطية نماذج Docker المباشرة عندما تتضمن فحوصات الإصدار
  مجموعات مباشرة

استخدم آثار Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للاسترداد المركز،
استخدم `docker_lanes=<lane[,lane]>` على سير عمل live/E2E القابل لإعادة الاستخدام بدلًا من
إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل المولدة
`package_artifact_run_id` السابق ومدخلات صور Docker المحضّرة عند توفرها، لكي يستطيع
مسار فاشل إعادة استخدام ملف tarball نفسه وصور GHCR نفسها.

### QA Lab

بيئة QA Lab هي أيضًا جزء من `OpenClaw Release Checks`. إنها بوابة
سلوك الوكيل ومستوى القناة للإصدار، منفصلة عن Vitest وآليات حزمة Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ وهمي يقارن مسار مرشح OpenAI بخط أساس Opus 4.6
  باستخدام حزمة التكافؤ الوكيلية
- ملف QA سريع مباشر لـ Matrix باستخدام بيئة `qa-live-shared`
- مسار QA مباشر لـ Telegram باستخدام إيجارات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج قياس الإصدار عن بُعد إلى إثبات محلي صريح

استخدم هذه البيئة للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات المباشرة؟" احتفظ بعناوين URL للآثار الخاصة بمسارات التكافؤ وMatrix وTelegram
عند اعتماد الإصدار. تظل تغطية Matrix الكاملة متاحة باعتبارها
تشغيل QA-Lab يدويًا مقسمًا بدلًا من المسار الافتراضي الحرج للإصدار.

### الحزمة

بيئة الحزمة هي بوابة المنتج القابل للتثبيت. تدعمها
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبّع المحلل
مرشحًا إلى ملف tarball باسم `package-under-test` الذي يستهلكه Docker E2E، ويتحقق
من مخزون الحزمة، ويسجل إصدار الحزمة وSHA-256، ويبقي
مرجع حاضنة سير العمل منفصلًا عن مرجع مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: ‏`openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيق
  للإصدار
- `source=ref`: حزم فرع `package_ref` موثوق، أو وسم، أو SHA التزام كامل
  مع حاضنة `workflow_ref` المحددة
- `source=url`: تنزيل ملف `.tgz` عبر HTTPS مع `package_sha256` المطلوب
- `source=artifact`: إعادة استخدام ملف `.tgz` مرفوع بواسطة تشغيل GitHub Actions آخر

يشغّل `OpenClaw Release Checks` ‏Package Acceptance مع `source=artifact`، وأثر
حزمة الإصدار المحضّرة، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`،
و`telegram_mode=mock-openai`. تبقي Package Acceptance الترحيل، والتحديث،
وإعادة تشغيل تحديث المصادقة المهيأة، وتثبيت Skills المباشر من ClawHub، وتنظيف اعتماد Plugin القديم، وتركيبات Plugin غير المتصل،
وتحديث Plugin، وTelegram package QA على ملف tarball المحلول نفسه. تستخدم فحوصات الإصدار الحاجبة
خط أساس أحدث حزمة منشورة افتراضيًا؛ و`run_release_soak=true` أو
`release_profile=full` يوسّعها إلى كل خط أساس مستقر منشور على npm من
`2026.4.23` حتى `latest` إضافة إلى تركيبات المشكلات المبلغ عنها. استخدم
Package Acceptance مع `source=npm` لمرشح مشحون بالفعل، أو
`source=ref`/`source=artifact` لملف tarball محلي مدعوم بـ SHA قبل
النشر. إنها البديل الأصلي في GitHub
لمعظم تغطية الحزمة/التحديث التي كانت تتطلب Parallels سابقًا. لا تزال فحوصات الإصدار عبر أنظمة التشغيل مهمة للسلوك الخاص بنظام التشغيل في الإعداد الأولي
والمثبت والمنصة، لكن التحقق من منتج الحزمة/التحديث يجب أن يفضل
Package Acceptance.

القائمة المرجعية المعتمدة للتحقق من التحديثات وPlugin هي
[اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins). استخدمها عند
تحديد أي مسار محلي أو Docker أو قبول الحزمة أو فحص الإصدار يثبت تغيير تثبيت/تحديث
Plugin أو تنظيف doctor أو ترحيل حزمة منشورة.
الترحيل الشامل للتحديث المنشور من كل حزمة مستقرة `2026.4.23+` هو
سير عمل يدوي منفصل باسم `Update Migration`، وليس جزءا من Full Release CI.

تم تحديد مهلة زمنية مقصودة للتساهل القديم في قبول الحزم. قد تستخدم الحزم حتى
`2026.4.25` مسار التوافق لفجوات البيانات الوصفية المنشورة مسبقا
إلى npm: إدخالات مخزون QA الخاصة المفقودة من tarball، وغياب
`gateway install --wrapper`، وغياب ملفات patch في fixture git المشتق من tarball،
وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة،
وغياب استمرار سجلات تثبيت marketplace، وترحيل بيانات تعريف الإعداد أثناء
`plugins update`. قد تحذر حزمة `2026.4.26` المنشورة
بخصوص ملفات ختم بيانات تعريف البناء المحلي التي تم شحنها بالفعل. يجب أن تفي الحزم اللاحقة
بعقود الحزم الحديثة؛ وتفشل الفجوات نفسها في تحقق الإصدار.

استخدم ملفات تعريف قبول الحزمة الأوسع عندما يكون سؤال الإصدار متعلقا بحزمة
قابلة للتثبيت فعليا:

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
  الإعداد
- `package`: عقود تثبيت/تحديث/إعادة تشغيل الحزمة وحزمة Plugin بالإضافة إلى إثبات
  تثبيت skill مباشر من ClawHub؛ هذا هو الافتراضي لفحص الإصدار
- `product`: `package` بالإضافة إلى قنوات MCP، وتنظيف cron/subagent، وبحث OpenAI على الويب،
  وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لإعادة التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في قبول الحزمة. يمرر سير العمل tarball
`package-under-test` المحلول إلى مسار Telegram؛ ولا يزال سير عمل
Telegram المستقل يقبل مواصفة npm منشورة لفحوص ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو مدخل النشر التغييري المعتاد. إنه
ينسق سير عمل trusted-publisher بالترتيب الذي يحتاجه الإصدار:

1. سحب علامة الإصدار وحل SHA الخاص بالالتزام.
2. التحقق من أن العلامة قابلة للوصول من `main` أو `release/*`.
3. تشغيل `pnpm plugins:sync:check`.
4. إطلاق `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. إطلاق `Plugin ClawHub Release` بالنطاق وSHA نفسيهما.
6. إطلاق `OpenClaw NPM Release` بعلامة الإصدار، وdist-tag الخاصة بـ npm، و
   `preflight_run_id` المحفوظ.

مثال نشر beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

نشر stable إلى dist-tag الافتراضية beta:

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

استخدم سير عمل `Plugin NPM Release` و`Plugin ClawHub Release` الأدنى مستوى
فقط لأعمال الإصلاح أو إعادة النشر المركزة. لإصلاح Plugin محدد، مرر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أطلق سير العمل الفرعي مباشرة عندما يجب
عدم نشر حزمة OpenClaw.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: علامة إصدار مطلوبة مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ عندما يكون `preflight_only=true`، قد تكون أيضا SHA الالتزام
  الكامل الحالي المكون من 40 حرفا لفرع سير العمل من أجل preflight للتحقق فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي كي يعيد سير العمل استخدام
  tarball المحضرة من تشغيل preflight الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ الافتراضي هو `beta`

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: علامة إصدار مطلوبة؛ يجب أن تكون موجودة مسبقا
- `preflight_run_id`: معرف تشغيل preflight ناجح لـ `OpenClaw NPM Release`؛
  مطلوب عندما يكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm المستهدف لحزمة OpenClaw
- `plugin_publish_scope`: الافتراضي هو `all-publishable`؛ استخدم `selected` فقط
  لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما يكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: الافتراضي هو `true`؛ عيّنه إلى `false` فقط عند استخدام
  سير العمل كمنسق إصلاح خاص بـ Plugin فقط

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغل:

- `ref`: فرع أو علامة أو SHA التزام كامل للتحقق منه. تتطلب الفحوص الحاملة للأسرار
  أن يكون الالتزام المحلول قابلا للوصول من فرع OpenClaw أو علامة إصدار.
- `run_release_soak`: الاشتراك في نقع live/E2E الشامل، ومسار إصدار Docker،
  وupgrade-survivor لكل ما منذ البداية على فحوص الإصدار المستقرة/الافتراضية. يتم فرضه
  بواسطة `release_profile=full`.

القواعد:

- يمكن أن تنشر علامات stable والتصحيح إلى `beta` أو `latest`
- يمكن أن تنشر علامات prerelease beta إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، يسمح بإدخال SHA الالتزام الكامل فقط عندما يكون
  `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` هما دائما للتحقق فقط
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء preflight؛
  يتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر

## تسلسل إصدار npm مستقر

عند إنشاء إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود علامة، يمكنك استخدام SHA الالتزام الكامل الحالي لفرع سير العمل
     لتشغيل تجريبي بلا نشر للتحقق فقط من سير عمل preflight
2. اختر `npm_dist_tag=beta` للتدفق العادي الذي يبدأ بـ beta، أو `latest` فقط
   عندما تريد عمدا نشرا مستقرا مباشرا
3. شغّل `Full Release Validation` على فرع الإصدار أو علامة الإصدار أو SHA الالتزام الكامل
   عندما تريد CI عاديا بالإضافة إلى تغطية live prompt cache وDocker وQA Lab
   وMatrix وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدا إلى رسم الاختبارات العادي الحتمي فقط، فشغّل سير عمل
   `CI` اليدوي على مرجع الإصدار بدلا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` باستخدام `tag` نفسه، و`npm_dist_tag` نفسه،
   و`preflight_run_id` المحفوظ؛ ينشر Plugins الخارجية إلى npm
   وClawHub قبل ترقية حزمة OpenClaw في npm
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية تلك النسخة المستقرة من `beta` إلى `latest`
8. إذا نُشر الإصدار عمدا مباشرة إلى `latest` وكان ينبغي أن تتبع `beta`
   البناء المستقر نفسه فورا، فاستخدم سير العمل الخاص نفسه
   لتوجيه كلتا dist-tags إلى النسخة المستقرة، أو دع مزامنة التعافي الذاتي المجدولة
   تنقل `beta` لاحقا

توجد عملية تغيير dist-tag في المستودع الخاص للأمان لأنها لا تزال
تتطلب `NPM_TOKEN`، بينما يحتفظ المستودع العام بالنشر المعتمد على OIDC فقط.

هذا يبقي مسار النشر المباشر ومسار الترقية الذي يبدأ بـ beta موثقين
ومرئيين للمشغل.

إذا اضطر مشرف إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر 1Password
CLI (`op`) فقط داخل جلسة tmux مخصصة. لا تستدع `op`
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

## ذات صلة

- [قنوات الإصدار](/ar/install/development-channels)
