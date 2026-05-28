---
read_when:
    - البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرتها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، ومربعات التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدارات
x-i18n:
    generated_at: "2026-05-12T08:46:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- المستقر: إصدارات موسومة تُنشر إلى npm `beta` افتراضياً، أو إلى npm `latest` عند طلب ذلك صراحةً
- التجريبي: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- التطوير: الرأس المتحرك لـ `main`

## تسمية الإصدارات

- نسخة الإصدار المستقر: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- نسخة إصدار تصحيح مستقر: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- نسخة ما قبل الإصدار التجريبية: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفاراً بادئة إلى الشهر أو اليوم
- يعني `latest` إصدار npm المستقر الحالي الذي تمت ترقيته
- يعني `beta` هدف التثبيت التجريبي الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقر إلى npm `beta` افتراضياً؛ يمكن لمشغّلي الإصدار استهداف `latest` صراحةً، أو ترقية بنية تجريبية مُراجَعة لاحقاً
- كل إصدار OpenClaw مستقر يشحن حزمة npm وتطبيق macOS معاً؛
  الإصدارات التجريبية تتحقق عادةً من مسار npm/الحزمة وتنشره أولاً، مع
  حجز بناء/توقيع/توثيق تطبيق mac لمستقر ما لم يُطلب ذلك صراحةً

## وتيرة الإصدار

- تتحرك الإصدارات بمنهجية التجريبي أولاً
- لا يأتي المستقر إلا بعد التحقق من أحدث إصدار تجريبي
- عادةً ما يقتطع المشرفون الإصدارات من فرع `release/YYYY.M.D` مُنشأ
  من `main` الحالي، بحيث لا يمنع التحقق من الإصدار وإصلاحاته التطوير
  الجديد على `main`
- إذا دُفع وسم تجريبي أو نُشر واحتاج إلى إصلاح، يقتطع المشرفون
  وسم `-beta.N` التالي بدلاً من حذف الوسم التجريبي القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للمشرفين فقط

## قائمة تحقق مشغّل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة،
والتوقيع، والتوثيق، واسترداد dist-tag، وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار المخصص للمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وأكّد أن الالتزام المستهدف قد دُفع،
   وأكّد أن CI الحالي لـ `main` أخضر بما يكفي لإنشاء فرع منه.
2. أعد كتابة قسم `CHANGELOG.md` العلوي من سجل الالتزامات الحقيقي باستخدام
   `/changelog`، وأبقِ الإدخالات موجهة للمستخدم، ثم التزم به، وادفعه، وأعد rebase/pull
   مرة أخرى قبل التفريع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب حمله عمداً.
4. أنشئ `release/YYYY.M.D` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرةً على `main`.
5. ارفع كل موضع نسخة مطلوب للوسم المقصود، ثم شغّل
   `pnpm release:prep`. يحدّث نسخ Plugin، ومخزون Plugin، ومخطط الإعدادات،
   وبيانات تعريف إعدادات القنوات المضمنة، وخط أساس توثيق الإعدادات، وصادرات Plugin SDK،
   وخط أساس API الخاص بـ Plugin SDK بالترتيب الصحيح. التزم بأي
   انحراف مولّد قبل الوسم. ثم شغّل فحص ما قبل الإطلاق المحلي الحتمي:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل من 40 محرفاً لفرع الإصدار للتحقق فقط
   في فحص ما قبل الإطلاق. احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار، أو الوسم، أو SHA الالتزام الكامل. هذه هي نقطة الدخول اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest، وDocker، وQA Lab، وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر
   ملف أو مسار أو مهمة workflow أو ملف تعريف حزمة أو مزود أو قائمة سماح نماذج فاشلة
   تثبت الإصلاح. أعد تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير
   الأدلة السابقة قديمة.
9. بالنسبة إلى التجريبي، وسم `vYYYY.M.D-beta.N`، ثم شغّل `OpenClaw Release Publish` من
   فرع `release/YYYY.M.D` المطابق. يتحقق من `pnpm plugins:sync:check`،
   ويرسل كل حزم Plugin القابلة للنشر إلى npm والمجموعة نفسها إلى
   ClawHub بالتوازي، ثم يرقّي أثر فحص ما قبل الإطلاق المُحضّر لـ OpenClaw npm
   باستخدام dist-tag المطابق بمجرد نجاح نشر Plugin إلى npm.
   بعد نجاح العملية الفرعية لنشر OpenClaw npm، ينشئ أو يحدّث صفحة
   GitHub release/prerelease المطابقة من قسم `CHANGELOG.md` المطابق الكامل.
   الإصدارات المستقرة المنشورة إلى npm `latest` تصبح أحدث إصدار على GitHub؛ أما
   إصدارات الصيانة المستقرة المحتفظ بها على npm `beta` فتُنشأ مع GitHub `latest=false`.
   قد يبقى نشر ClawHub قيد التشغيل بينما يُنشر OpenClaw npm، لكن
   workflow نشر الإصدار يطبع معرّفات التشغيل الفرعية فوراً. افتراضياً
   لا ينتظر ClawHub بعد إرساله، لذلك لا تُحجب إتاحة OpenClaw npm
   بسبب موافقات ClawHub الأبطأ أو عمل السجل؛ اضبط
   `wait_for_clawhub=true` عندما يجب أن يمنع ClawHub اكتمال workflow. مسار
   ClawHub يعيد محاولة إخفاقات تثبيت تبعيات CLI العابرة، وينشر
   Plugins التي اجتازت المعاينة حتى عند تقشر خلية معاينة واحدة، وينتهي
   بتحقق السجل لكل نسخة Plugin متوقعة بحيث تبقى عمليات النشر الجزئية
   مرئية وقابلة لإعادة المحاولة. بعد النشر، شغّل
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   للتحقق من GitHub prerelease، وdist-tags الخاصة بـ npm `beta`، وسلامة npm،
   ومسار التثبيت المنشور، ونسخ ClawHub الدقيقة، وآثار ClawHub، ونتائج
   workflows الفرعية من أمر واحد. أضف `--rerun-failed-clawhub` عندما
   يفشل sidecar الخاص بـ ClawHub فقط في مهام قابلة لإعادة المحاولة وينبغي
   إعادة تشغيله في مكانه. ثم شغّل قبول الحزمة بعد النشر مقابل حزمة
   `openclaw@YYYY.M.D-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاجت نسخة ما قبل إصدار مدفوعة أو منشورة إلى إصلاح،
   فاقتطع رقم ما قبل الإصدار المطابق التالي؛ لا تحذف ما قبل الإصدار القديم
   ولا تعِد كتابته.
10. بالنسبة إلى المستقر، تابع فقط بعد أن تتوفر للإصدار التجريبي المُراجع أو مرشح الإصدار
    أدلة التحقق المطلوبة. يمر نشر npm المستقر أيضاً عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أثر فحص ما قبل الإطلاق الناجح عبر
    `preflight_run_id`؛ وتتطلب جاهزية إصدار macOS المستقر أيضاً
    وجود ملفات `.zip` و`.dmg` و`.dSYM.zip` المحزمة، و`appcast.xml` محدثاً على `main`.
    ينشر workflow نشر macOS الخاص appcast الموقّع إلى `main` العام
    تلقائياً بعد تحقق أصول الإصدار؛ وإذا منعت حماية الفرع الدفع المباشر،
    فإنه يفتح أو يحدّث PR خاصاً بـ appcast.
11. بعد النشر، شغّل متحقق ما بعد نشر npm، واختبار Telegram E2E المنشور من npm
    المستقل الاختياري عندما تحتاج إلى إثبات قناة بعد النشر،
    وترقية dist-tag عند الحاجة، وتحقق من صفحة GitHub release المولدة،
    وشغّل خطوات إعلان الإصدار.

## فحص ما قبل الإصدار

- شغّل `pnpm check:test-types` قبل فحص ما قبل الإصدار كي تبقى TypeScript الخاصة بالاختبارات
  مغطاة خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل فحص ما قبل الإصدار كي تكون فحوصات دورات الاستيراد
  الأوسع وحدود المعمارية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` كي توجد
  عناصر إصدار `dist/*` المتوقعة وحزمة واجهة التحكم لخطوة التحقق من الحزمة
- شغّل `pnpm release:prep` بعد رفع إصدار الجذر وقبل الوسم. فهو يشغّل
  كل مولّد إصدار حتمي ينجرف عادة بعد تغيير الإصدار/الإعدادات/API:
  إصدارات plugin، ومخزون plugin، ومخطط الإعداد الأساسي، وبيانات إعداد القنوات
  المضمّنة، وخط أساس وثائق الإعداد، وتصديرات SDK الخاصة بـ plugin، وخط أساس API
  الخاص بـ SDK للـ plugin. يعيد `pnpm release:check` تشغيل تلك الحراسات
  في وضع الفحص ويبلّغ عن كل فشل انجراف مولّد يعثر عليه في مرور واحد قبل تشغيل
  فحوصات إصدار الحزمة.
- شغّل سير عمل `Full Release Validation` اليدوي قبل الموافقة على الإصدار
  لتشغيل كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا،
  أو وسمًا، أو SHA كاملًا للالتزام، ويطلق `CI` يدويًا، ويطلق
  `OpenClaw Release Checks` لفحص التثبيت السريع، وقبول الحزمة، وفحوصات الحزمة
  عبر أنظمة التشغيل، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. تحتفظ عمليات
  التشغيل المستقرة/الافتراضية بفحوصات live/E2E الشاملة وتشغيل Docker المطوّل
  لمسار الإصدار خلف `run_release_soak=true`؛ ويفرض `release_profile=full`
  التشغيل المطوّل. ومع `release_profile=full` و`rerun_group=all`، يشغّل أيضًا
  E2E لحزمة Telegram ضد عنصر `release-package-under-test` الناتج من فحوصات
  الإصدار. قدّم `release_package_spec` بعد نشر إصدار beta لإعادة استخدام حزمة
  npm المشحونة عبر فحوصات الإصدار، وPackage Acceptance، وE2E لحزمة Telegram
  دون إعادة بناء tarball الإصدار. قدّم `npm_telegram_package_spec` فقط عندما
  يجب أن يستخدم Telegram حزمة منشورة مختلفة عن بقية تحقق الإصدار. قدّم
  `package_acceptance_package_spec` عندما يجب أن يستخدم Package Acceptance
  حزمة منشورة مختلفة عن مواصفة حزمة الإصدار. قدّم `evidence_package_spec`
  عندما يجب أن يثبت تقرير الأدلة الخاص أن التحقق يطابق حزمة npm منشورة دون فرض
  E2E لـ Telegram.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- شغّل سير عمل `Package Acceptance` اليدوي عندما تريد إثباتًا من قناة جانبية
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` لـ
  `openclaw@beta` أو `openclaw@latest` أو إصدار محدد بدقة؛ و`source=ref`
  لحزم فرع/وسم/SHA موثوق في `package_ref` باستخدام harness الحالي
  في `workflow_ref`؛ و`source=url` لـ tarball عبر HTTPS مع SHA-256 مطلوب؛ أو
  `source=artifact` لـ tarball رُفع بواسطة تشغيل GitHub Actions آخر. يحل سير
  العمل المرشح إلى `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E
  ضد ذلك tarball، ويمكنه تشغيل QA لـ Telegram ضد tarball نفسه باستخدام
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن
  مسارات Docker المختارة `published-upgrade-survivor`، يكون عنصر الحزمة هو
  المرشح ويحدد `published_upgrade_survivor_baseline` خط الأساس المنشور.
  يستخدم `update-restart-auth` حزمة المرشح بوصفها CLI المثبتة وpackage-under-test
  معًا كي يمرّن مسار إعادة التشغيل المُدار لأمر التحديث الخاص بالمرشح.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  ملفات التعريف الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
  - `package`: مسارات الحزمة/التحديث/إعادة التشغيل/plugin الأصلية للعنصر دون OpenWebUI أو ClawHub مباشر
  - `product`: ملف تعريف الحزمة إضافة إلى قنوات MCP، وتنظيف cron/subagent،
    وبحث الويب من OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` بدقة لإعادة تشغيل مركزة
- شغّل سير عمل `CI` اليدوي مباشرة عندما تحتاج فقط إلى تغطية CI عادية كاملة
  لمرشح الإصدار. تتجاوز عمليات إطلاق CI اليدوية نطاق التغييرات وتفرض شظايا
  Linux Node، وشظايا plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`،
  و`check-additional`، وفحص البناء السريع، وفحوصات الوثائق، وSkills الخاصة بـ Python،
  وWindows، وmacOS، وAndroid، ومسارات i18n لواجهة التحكم.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. فهو يمرّن
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من أسماء spans الأثر المصدّرة،
  والسمات المحدودة، وتنقيح المحتوى/المعرّفات دون طلب Opik أو Langfuse أو
  جامع خارجي آخر.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- شغّل `OpenClaw Release Publish` لتسلسل النشر المُعدِّل بعد وجود الوسم.
  أطلقه من `release/YYYY.M.D` (أو `main` عند نشر وسم قابل للوصول من main)،
  ومرّر وسم الإصدار و`preflight_run_id` ناجحًا لـ OpenClaw npm، وأبقِ نطاق
  نشر plugin الافتراضي `all-publishable` ما لم تكن تشغّل إصلاحًا مركّزًا عمدًا.
  ينسّق سير العمل نشر plugin إلى npm، ونشر plugin إلى ClawHub، ونشر OpenClaw
  إلى npm بحيث لا تُنشر الحزمة الأساسية قبل plugins الخارجية الخاصة بها.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ QA Lab الوهمي إضافة إلى
  ملف تعريف Matrix المباشر السريع ومسار QA لـ Telegram قبل الموافقة على الإصدار.
  تستخدم المسارات المباشرة بيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا
  تأجيرات بيانات اعتماد Convex CI. شغّل سير عمل `QA-Lab - All Lanes` اليدوي
  مع `matrix_profile=all` و`matrix_shards=true` عندما تريد مخزون نقل Matrix
  والوسائط وE2EE كاملًا بالتوازي.
- يُعد تحقق وقت التشغيل للتثبيت والترقية عبر أنظمة التشغيل جزءًا من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، اللذين يستدعيان
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا، وحتميًا، ومركّزًا على
  العناصر، بينما تبقى الفحوصات المباشرة الأبطأ في مسارها الخاص حتى لا تؤخر
  النشر أو تمنعه
- يجب إطلاق فحوصات الإصدار الحاملة للأسرار عبر `Full Release Validation` أو
من مرجع سير عمل `main`/release كي تبقى منطق سير العمل والأسرار مضبوطة
- يقبل `OpenClaw Release Checks` فرعًا، أو وسمًا، أو SHA كاملًا للالتزام ما دام
  الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار
- يقبل فحص ما قبل الإصدار التحققي فقط في `OpenClaw NPM Release` أيضًا SHA
  الحالي الكامل ذي 40 حرفًا لالتزام فرع سير العمل دون طلب وسم مدفوع
- مسار SHA هذا للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، يصطنع سير العمل `v<package.json version>` فقط لفحص بيانات الحزمة
  الوصفية؛ لا يزال النشر الحقيقي يتطلب وسم إصدار حقيقيًا
- يحافظ كلا سيري العمل على مسار النشر والترقية الحقيقي على مشغلات GitHub-hosted،
  بينما يمكن لمسار التحقق غير المُعدِّل استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل سير العمل هذا
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سرّي سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد فحص ما قبل إصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- قبل وسم مرشح إصدار محليًا، شغّل
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check`. يشغّل المساعد
  حواجز الإصدار السريعة، وفحوصات إصدار plugin إلى npm/ClawHub، والبناء،
  وبناء الواجهة، و`release:openclaw:npm:check` بالترتيب الذي يلتقط الأخطاء
  الشائعة الحاجبة للموافقة قبل بدء سير عمل النشر في GitHub.
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الموافقة
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور في بادئة
  مؤقتة جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تمهيد الحزمة المثبتة، وإعداد Telegram، وE2E حقيقي لـ Telegram
  ضد حزمة npm المنشورة باستخدام مخزون بيانات اعتماد Telegram المؤجرة المشتركة.
  يمكن لعمليات الصيانة المحلية لمرة واحدة حذف متغيرات Convex وتمرير بيانات
  اعتماد البيئة الثلاث `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- لتشغيل فحص beta السريع الكامل بعد النشر من جهاز مشرف صيانة، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق Parallels لتحديث npm/هدف جديد، ويطلق `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل الدقيق، وينزّل العنصر، ويطبع تقرير Telegram.
- يمكن لمشرفي الصيانة تشغيل الفحص نفسه بعد النشر من GitHub Actions عبر سير عمل
  `NPM Telegram Beta E2E` اليدوي. وهو يدوي فقط عن قصد ولا يعمل مع كل دمج.
- تستخدم أتمتة إصدار مشرفي الصيانة الآن نمط فحص ما قبل الإصدار ثم الترقية:
  - يجب أن يمر نشر npm الحقيقي عبر `preflight_run_id` ناجح لـ npm
  - يجب إطلاق نشر npm الحقيقي من فرع `main` أو `release/YYYY.M.D` نفسه الذي
    شُغّل منه فحص ما قبل الإصدار الناجح
  - تستهدف إصدارات npm المستقرة `beta` افتراضيًا
  - يمكن لنشر npm المستقر استهداف `latest` صراحة عبر مُدخل سير العمل
  - بات تعديل dist-tag الخاص بـ npm المستند إلى الرمز المميز موجودًا الآن في
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
    للأمان، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما يحافظ
    المستودع العام على النشر عبر OIDC فقط
  - إصدار `macOS Release` العام للتحقق فقط؛ عندما يوجد وسم فقط على فرع إصدار
    لكن سير العمل يُطلق من `main`، اضبط
    `public_release_branch=release/YYYY.M.D`
  - يجب أن يمر نشر mac الخاص الحقيقي عبر `preflight_run_id` و`validate_run_id`
    ناجحين خاصين بـ mac
  - تروّج مسارات النشر الحقيقي العناصر المُحضّرة بدلًا من إعادة بنائها مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق مُثبت ما بعد
  النشر أيضًا من مسار الترقية نفسه ببادئة مؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار التثبيتات العمومية الأقدم صامتة على حمولة الإصدار
  المستقر الأساسي
- يفشل فحص ما قبل إصدار npm على نحو مغلق ما لم يتضمن tarball كلا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة متصفح فارغة مرة أخرى
- يتحقق تحقق ما بعد النشر أيضًا من وجود نقاط دخول plugin المنشورة وبيانات الحزمة
  الوصفية في تخطيط السجل المثبت. يفشل أي إصدار يشحن حمولات وقت تشغيل plugin
  مفقودة في مُثبت ما بعد النشر ولا يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` الخاصة بحزمة npm
  على tarball تحديث المرشح، بحيث يلتقط installer e2e تضخم الحزمة العرضي قبل
  مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت plugin، أو مصفوفات اختبار
  plugin، فأعد توليد ومراجعة مخرجات مصفوفة `plugin-prerelease-extension-shard`
  المملوكة للمخطط من `.github/workflows/plugin-prerelease.yml` قبل الموافقة حتى
  لا تصف ملاحظات الإصدار تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح المحدّث:
  - يجب أن ينتهي إصدار GitHub باحتواء `.zip` و`.dmg` و`.dSYM.zip` المعبأة
  - يجب أن يشير `appcast.xml` على `main` إلى zip المستقر الجديد بعد النشر؛
    يثبته سير عمل نشر macOS الخاص تلقائيًا، أو يفتح PR لـ appcast عندما يكون
    الدفع المباشر محظورًا
  - يجب أن يحافظ التطبيق المعبأ على bundle id غير تصحيحي، وURL تغذية Sparkle
    غير فارغ، و`CFBundleVersion` عند حد البناء الأساسي القانوني لـ Sparkle لذلك
    الإصدار أو أعلى منه

## صناديق اختبار الإصدار

`Full Release Validation` هي الطريقة التي يستخدمها المشغلون لبدء جميع اختبارات ما قبل الإصدار من
نقطة دخول واحدة. لإثبات تثبيت commit على فرع سريع الحركة، استخدم
المساعد بحيث يعمل كل سير عمل فرعي من فرع مؤقت مثبت عند SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويشغّل `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن كل سير عمل فرعي `headSha`
يطابق الهدف، ثم يحذف الفرع المؤقت. هذا يتجنب إثبات تشغيل فرعي
أحدث لـ `main` بالخطأ.

للتحقق من فرع إصدار أو وسم إصدار، شغّله من مرجع سير العمل الموثوق `main`
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
`target_ref=<release-ref>`، ويشغّل `OpenClaw Release Checks`، ويحضّر
أثرًا أبويًا `release-package-under-test` للفحوصات الموجهة للحزم، ويشغّل
Telegram E2E المستقل للحزمة عندما تكون `release_profile=full` مع
`rerun_group=all` أو عندما تكون `release_package_spec` أو
`npm_telegram_package_spec` مضبوطة. بعد ذلك يوسّع `OpenClaw Release
Checks` التشغيل إلى smoke تثبيت، وفحوصات إصدار عبر أنظمة تشغيل متعددة، وتغطية live/E2E Docker
لمسار الإصدار عندما يكون soak مفعّلًا، وPackage Acceptance مع QA حزمة Telegram،
وتكافؤ QA Lab، وMatrix الحي، وTelegram الحي. لا يكون التشغيل الكامل مقبولًا إلا عندما
يعرض ملخص `Full Release Validation`
أن `normal_ci` و`release_checks` ناجحان. في وضع full/all،
يجب أن يكون الفرع `npm_telegram` ناجحًا أيضًا؛ وخارج full/all يتم تخطيه
ما لم تُقدَّم `release_package_spec` أو `npm_telegram_package_spec` منشورة.
يتضمن ملخص
المتحقق النهائي جداول أبطأ المهام لكل تشغيل فرعي، حتى يتمكن مدير الإصدار
من رؤية المسار الحرج الحالي دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل الكاملة، وأسماء مهام سير العمل الدقيقة، وفروق ملف stable مقابل full،
والآثار، ومقابض إعادة التشغيل المركزة.
تُشغّل مسارات العمل الفرعية من المرجع الموثوق الذي يشغّل `Full Release
Validation`، عادةً `--ref main`، حتى عندما يشير `ref` الهدف إلى
فرع إصدار أو وسم أقدم. لا يوجد إدخال منفصل لمرجع سير عمل Full Release Validation؛
اختر حزمة الاختبار الموثوقة باختيار مرجع تشغيل سير العمل.
لا تستخدم `--ref main -f ref=<sha>` لإثبات commit دقيق على `main` متحرك؛
لا يمكن أن تكون قيم SHA الخام للـ commit مراجع تشغيل لسير العمل، لذا استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبت.

استخدم `release_profile` لاختيار اتساع live/provider:

- `minimum`: أسرع مسار OpenAI/core live وDocker حرج للإصدار
- `stable`: الحد الأدنى مع تغطية stable provider/backend لاعتماد الإصدار
- `full`: stable مع تغطية advisory provider/media واسعة

استخدم `run_release_soak=true` مع `stable` عندما تكون المسارات الحاجبة للإصدار
خضراء وتريد الفحص الشامل لـ live/E2E، ومسار إصدار Docker، و
فحص upgrade-survivor منشور ومحدود قبل الترويج. يغطي ذلك الفحص
آخر أربع حزم stable بالإضافة إلى أساسيّات `2026.4.23` و`2026.5.2`
المثبتة، مع تغطية أقدم لـ `2026.4.15`، وإزالة الأساسيّات المكررة و
تقسيم كل أساس إلى مهمة Docker runner خاصة به. يتضمن `full`
`run_release_soak=true`.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل مرجع الهدف
مرة واحدة كـ `release-package-under-test` ويعيد استخدام ذلك الأثر في فحوصات cross-OS،
وPackage Acceptance، وفحوصات Docker لمسار الإصدار عندما يعمل soak. هذا يحافظ
على كل الصناديق الموجهة للحزم على نفس البايتات ويتجنب بناء الحزمة مرارًا.
بعد أن تصبح beta موجودة بالفعل على npm، اضبط `release_package_spec=openclaw@YYYY.M.D-beta.N`
حتى تنزّل فحوصات الإصدار الحزمة المشحونة مرة واحدة، وتستخرج SHA مصدر البناء
من `dist/build-info.json`، وتعيد استخدام ذلك الأثر لمسارات cross-OS،
وPackage Acceptance، وDocker لمسار الإصدار، وTelegram للحزمة.
يستخدم smoke تثبيت OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون
متغير repo/org مضبوطًا، وإلا يستخدم `openai/gpt-5.4`، لأن هذا المسار
يثبت تثبيت الحزمة، والإعداد الأولي، وبدء Gateway، ودورة agent حية واحدة
بدلًا من قياس أبطأ نموذج افتراضي. تظل مصفوفة live provider الأوسع
هي مكان التغطية الخاصة بالنماذج.

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركّز. إذا فشل صندوق واحد،
فاستخدم سير العمل الفرعي الفاشل، أو المهمة، أو مسار Docker، أو ملف الحزمة،
أو موفر النموذج، أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة أخرى فقط عندما
يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل دليل كل الصناديق السابق
قديمًا. يعيد المتحقق النهائي للمظلة فحص معرّفات تشغيل سير العمل الفرعية المسجلة،
لذا بعد إعادة تشغيل سير عمل فرعي بنجاح، أعد تشغيل مهمة الأب الفاشلة فقط
`Verify full validation`.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل
مرشح الإصدار الحقيقي، و`ci` يشغّل فقط فرع CI العادي، و`plugin-prerelease`
يشغّل فقط فرع Plugin الخاص بالإصدار، و`release-checks` يشغّل كل صندوق إصدار،
ومجموعات الإصدار الأضيق هي `install-smoke`، و`cross-os`،
و`live-e2e`، و`package`، و`qa`، و`qa-parity`، و`qa-live`، و`npm-telegram`.
تتطلب عمليات إعادة تشغيل `npm-telegram` المركزة `release_package_spec` أو
`npm_telegram_package_spec`؛ وتستخدم عمليات full/all مع `release_profile=full`
أثر حزمة release-checks. يمكن لعمليات إعادة تشغيل
cross-OS المركزة إضافة `cross_os_suite_filter=windows/packaged-upgrade` أو
مرشح نظام تشغيل/مجموعة آخر. إخفاقات QA في release-checks استشارية؛ لا يحجب
إخفاق QA فقط التحقق من الإصدار.

### Vitest

صندوق Vitest هو سير العمل الفرعي `CI` اليدوي. يتجاوز CI اليدوي عمدًا
تحديد النطاق حسب التغييرات ويفرض رسم الاختبار العادي لمرشح الإصدار:
تقسيمات Linux Node، وتقسيمات bundled-plugin، وعقود القنوات، وتوافق Node 22،
و`check`، و`check-additional`، وsmoke البناء، وفحوصات الوثائق، وPython
skills، وWindows، وmacOS، وAndroid، وControl UI i18n.

استخدم هذا الصندوق للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبار العادية الكاملة؟"
إنه ليس مثل التحقق من المنتج لمسار الإصدار. الأدلة المطلوب الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض رابط تشغيل `CI` المشغّل
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء التقسيمات الفاشلة أو البطيئة من مهام CI عند التحقيق في التراجعات
- آثار توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما
  يحتاج التشغيل إلى تحليل الأداء

شغّل CI اليدوي مباشرةً فقط عندما يحتاج الإصدار إلى CI عادي حتمي ولكن
لا يحتاج صناديق Docker أو QA Lab أو live أو cross-OS أو package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

يوجد صندوق Docker في `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، بالإضافة إلى سير عمل وضع الإصدار
`install-smoke`. يتحقق من مرشح الإصدار عبر بيئات Docker محزّمة
بدلًا من اختبارات مستوى المصدر فقط.

تتضمن تغطية Docker للإصدار:

- smoke تثبيت كامل مع تمكين smoke التثبيت العالمي البطيء لـ Bun
- إعداد/إعادة استخدام صورة smoke لـ Dockerfile الجذري بحسب SHA الهدف، مع تشغيل مهام QR،
  وroot/gateway، وinstaller/Bun smoke كتقسيمات install-smoke منفصلة
- مسارات E2E للمستودع
- أجزاء Docker لمسار الإصدار: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`،
  و`plugins-runtime-services`،
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند الطلب
- مسارات تثبيت/إلغاء تثبيت Plugin المضمّنة المقسّمة
  `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات live/E2E provider وتغطية Docker live model عندما تتضمن فحوصات الإصدار
  مجموعات live

استخدم آثار Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للاسترداد المركّز،
استخدم `docker_lanes=<lane[,lane]>` على سير عمل live/E2E القابل لإعادة الاستخدام بدلًا من
إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل المولّدة
`package_artifact_run_id` السابق ومدخلات صور Docker المحضّرة عند توفرها، حتى يمكن
لمسار فاشل إعادة استخدام tarball وصور GHCR نفسها.

### QA Lab

صندوق QA Lab هو أيضًا جزء من `OpenClaw Release Checks`. إنه بوابة الإصدار
لسلوك agent ومستوى القناة، منفصل عن Vitest وآليات حزمة Docker.

تتضمن تغطية QA Lab للإصدار:

- مسار تكافؤ mock يقارن مسار OpenAI المرشح مع أساس Opus 4.6
  باستخدام حزمة التكافؤ agentic
- ملف QA live Matrix سريع باستخدام بيئة `qa-live-shared`
- مسار QA حي لـ Telegram باستخدام إيجارات بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` عندما يحتاج telemetry الإصدار إلى إثبات محلي صريح

استخدم هذا الصندوق للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA و
تدفقات القنوات الحية؟" احتفظ بروابط الآثار لمسارات parity وMatrix وTelegram
عند اعتماد الإصدار. تظل تغطية Matrix الكاملة متاحة كتغيل QA-Lab يدوي مقسّم
بدلًا من المسار الافتراضي الحرج للإصدار.

### Package

صندوق Package هو بوابة المنتج القابل للتثبيت. يدعمه
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبّع المحلل
المرشح إلى tarball `package-under-test` الذي يستهلكه Docker E2E، ويتحقق من
مخزون الحزمة، ويسجل إصدار الحزمة وSHA-256، ويحافظ على مرجع حزمة سير العمل
منفصلًا عن مرجع مصدر الحزمة.

مصادر المرشحين المدعومة:

- `source=npm`: `openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيق
  من الإصدار
- `source=ref`: حزم فرع `package_ref` أو وسم أو SHA commit كامل موثوق
  مع حزمة `workflow_ref` المحددة
- `source=url`: تنزيل `.tgz` عبر HTTPS مع `package_sha256` مطلوب
- `source=artifact`: إعادة استخدام `.tgz` مرفوع بواسطة تشغيل GitHub Actions آخر

`OpenClaw Release Checks` يشغّل Package Acceptance باستخدام `source=artifact`، ونتاج حزمة الإصدار المُحضّر، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`،
و`telegram_mode=mock-openai`. يحافظ Package Acceptance على فحص QA للهجرة، والتحديث، وإعادة تشغيل التحديث مع المصادقة المكوّنة، وتثبيت Skills المباشر من ClawHub، وتنظيف تبعيات Plugin المتقادمة، وتركيبات Plugin دون اتصال، وتحديث Plugin، وحزمة Telegram، مقابل ملف tarball نفسه الذي تم حله. تستخدم فحوصات الإصدار الحاجبة خط أساس الحزمة المنشورة الأحدث الافتراضي؛ يوسّع `run_release_soak=true` أو
`release_profile=full` النطاق إلى كل خط أساس مستقر منشور على npm من
`2026.4.23` حتى `latest` إضافة إلى تركيبات المشكلات المُبلّغ عنها. استخدم Package Acceptance مع `source=npm` لمرشح تم شحنه بالفعل، أو
`source=ref`/`source=artifact` لملف tarball محلي من npm مستند إلى SHA قبل
النشر. إنه البديل الأصلي ضمن GitHub لمعظم تغطية الحزم/التحديثات التي كانت تتطلب سابقا Parallels. لا تزال فحوصات الإصدار عبر أنظمة التشغيل مهمة لسلوكيات الإعداد الأولي الخاصة بنظام التشغيل، والمثبّت، والمنصة، لكن تحقق منتج الحزم/التحديثات يجب أن يفضّل Package Acceptance.

قائمة التحقق القانونية للتحقق من التحديثات وPlugin هي
[اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins). استخدمها عند
تحديد أي مسار محلي أو Docker أو Package Acceptance أو فحص إصدار يثبت تغييرا في تثبيت/تحديث Plugin أو تنظيف doctor أو هجرة حزمة منشورة.
الهجرة الشاملة للتحديث المنشور من كل حزمة مستقرة `2026.4.23+` هي سير عمل يدوي منفصل باسم `Update Migration`، وليست جزءا من Full Release CI.

التساهل القديم في قبول الحزم محدود زمنيا عن قصد. قد تستخدم الحزم حتى
`2026.4.25` مسار التوافق لفجوات البيانات الوصفية المنشورة مسبقا إلى npm: إدخالات مخزون QA الخاصة المفقودة من ملف tarball، وغياب
`gateway install --wrapper`، وغياب ملفات التصحيح في تركيبة git المشتقة من tarball، وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة، وغياب استمرار سجلات تثبيت المتجر، وهجرة بيانات تعريف الإعدادات أثناء `plugins update`. قد تصدر الحزمة المنشورة `2026.4.26` تحذيرا بشأن ملفات ختم بيانات تعريف البناء المحلي التي تم شحنها مسبقا. يجب أن تفي الحزم اللاحقة بعقود الحزم الحديثة؛ وتؤدي تلك الفجوات نفسها إلى فشل تحقق الإصدار.

استخدم ملفات تعريف Package Acceptance الأوسع عندما يكون سؤال الإصدار متعلقا بحزمة فعلية قابلة للتثبيت:

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

- `smoke`: مسارات سريعة لتثبيت الحزمة/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعدادات
- `package`: عقود تثبيت/تحديث/إعادة تشغيل/حزمة Plugin إضافة إلى دليل تثبيت Skills مباشر من ClawHub؛ هذا هو الإعداد الافتراضي لفحص الإصدار
- `product`: `package` إضافة إلى قنوات MCP، وتنظيف cron/subagent، وبحث الويب من OpenAI، وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لإعادات تشغيل مركزة

لدليل Telegram الخاص بمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` على Package Acceptance. يمرر سير العمل ملف tarball المحلول `package-under-test` إلى مسار Telegram؛ وما يزال سير عمل Telegram المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة دخول النشر المُغيّرة المعتادة. ينسّق سير عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. سحب وسم الإصدار وحل SHA الخاص بالتزامه.
2. التحقق من إمكانية الوصول إلى الوسم من `main` أو `release/*`.
3. تشغيل `pnpm plugins:sync:check`.
4. إطلاق `Plugin NPM Release` باستخدام `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. إطلاق `Plugin ClawHub Release` بالنطاق نفسه وSHA نفسه.
6. إطلاق `OpenClaw NPM Release` بوسم الإصدار، ووسم توزيع npm، و
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

استخدم سيرَي العمل الأدنى مستوى `Plugin NPM Release` و`Plugin ClawHub Release`
فقط لأعمال الإصلاح أو إعادة النشر المركزة. لإصلاح Plugin محدد، مرّر
`plugin_publish_scope=selected` و`plugins=@openclaw/name` إلى
`OpenClaw Release Publish`، أو أطلق سير العمل الفرعي مباشرة عندما يجب عدم نشر حزمة OpenClaw.

## مُدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المُدخلات التي يتحكم بها المشغّل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2`، أو `v2026.4.2-1`، أو
  `v2026.4.2-beta.1`؛ عندما تكون `preflight_only=true`، قد يكون أيضا SHA الالتزام الكامل الحالي بطول 40 حرفا لفرع سير العمل من أجل الفحص التمهيدي المخصص للتحقق فقط
- `preflight_only`: القيمة `true` للتحقق/البناء/الحزم فقط، و`false` لمسار النشر الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى يعيد سير العمل استخدام ملف tarball المُحضّر من تشغيل الفحص التمهيدي الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ القيمة الافتراضية `beta`

يقبل `OpenClaw Release Publish` هذه المُدخلات التي يتحكم بها المشغّل:

- `tag`: وسم إصدار مطلوب؛ يجب أن يكون موجودا مسبقا
- `preflight_run_id`: معرّف تشغيل فحص تمهيدي ناجح لـ`OpenClaw NPM Release`؛ مطلوب عندما تكون `publish_openclaw_npm=true`
- `npm_dist_tag`: وسم npm المستهدف لحزمة OpenClaw
- `plugin_publish_scope`: القيمة الافتراضية `all-publishable`؛ استخدم `selected` فقط لأعمال الإصلاح المركزة
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: القيمة الافتراضية `true`؛ اضبطها إلى `false` فقط عند استخدام سير العمل كمنسق إصلاح خاص بـPlugin فقط
- `wait_for_clawhub`: القيمة الافتراضية `false` بحيث لا يحجب توفر npm المسار الجانبي ClawHub؛ اضبطها إلى `true` فقط عندما يجب أن يتضمن اكتمال سير العمل اكتمال ClawHub

يقبل `OpenClaw Release Checks` هذه المُدخلات التي يتحكم بها المشغّل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق منه. تتطلب الفحوصات الحاملة للأسرار أن يكون الالتزام الذي تم حله قابلا للوصول من فرع OpenClaw أو وسم إصدار.
- `run_release_soak`: الاشتراك في فحوصات soak الشاملة للحية/E2E، ومسار إصدار Docker، وكل upgrade-survivor منذ البداية على فحوصات الإصدار المستقرة/الافتراضية. يتم فرضه بواسطة `release_profile=full`.

القواعد:

- يمكن نشر وسوم الإصدارات المستقرة والتصحيحية إلى `beta` أو `latest`
- يمكن نشر وسوم إصدارات beta التمهيدية إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، يُسمح بإدخال SHA الالتزام الكامل فقط عندما تكون `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` مخصصان دائما للتحقق فقط
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء الفحص التمهيدي؛ ويتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر

## تسلسل إصدار npm مستقر

عند تجهيز إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الالتزام الكامل الحالي لفرع سير العمل كتجربة جافة مخصصة للتحقق فقط من سير عمل الفحص التمهيدي
2. اختر `npm_dist_tag=beta` للتدفق المعتاد الذي يبدأ بـbeta، أو `latest` فقط عندما تريد عمدا نشرا مستقرا مباشرا
3. شغّل `Full Release Validation` على فرع الإصدار أو وسم الإصدار أو SHA الالتزام الكامل عندما تريد CI المعتاد إضافة إلى تغطية live prompt cache وDocker وQA Lab وMatrix وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدا إلى رسم الاختبار الطبيعي الحتمي فقط، فشغّل سير عمل `CI` اليدوي على مرجع الإصدار بدلا من ذلك
5. احفظ `preflight_run_id` الناجح
6. شغّل `OpenClaw Release Publish` باستخدام `tag` نفسه و`npm_dist_tag` نفسه و`preflight_run_id` المحفوظ؛ ينشر Plugins الخارجية إلى npm وClawHub قبل ترقية حزمة OpenClaw على npm
7. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
8. إذا نُشر الإصدار عمدا مباشرة إلى `latest` ويجب أن يتبع `beta` البناء المستقر نفسه فورا، فاستخدم سير العمل الخاص نفسه لتوجيه وسمي التوزيع إلى الإصدار المستقر، أو اترك مزامنة الإصلاح الذاتي المجدولة تنقل `beta` لاحقا

تغيير وسم التوزيع موجود في المستودع الخاص لأسباب أمنية لأنه ما يزال يتطلب
`NPM_TOKEN`، بينما يحافظ المستودع العام على النشر باستخدام OIDC فقط.

هذا يُبقي مسار النشر المباشر ومسار الترقية الذي يبدأ بـbeta موثقين ومرئيين للمشغّل.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر 1Password CLI (`op`) فقط داخل جلسة tmux مخصصة. لا تستدعِ `op` مباشرة من صدفة الوكيل الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات والتنبيهات ومعالجة OTP قابلة للملاحظة ويمنع تنبيهات المضيف المتكررة.

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
