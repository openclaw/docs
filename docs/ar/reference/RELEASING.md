---
read_when:
    - أبحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرتها
summary: مسارات الإصدار، وقائمة تحقق المشغّل، ومربعات التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-07-04T18:05:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw يوفّر حاليًا ثلاث قنوات تحديث موجّهة للمستخدمين:

- stable: قناة الإصدار المروّج الحالية، والتي ما زالت تُحل عبر
  npm `latest` إلى أن يكتمل إنجاز CLI/القناة المنفصل
- beta: وسوم ما قبل الإصدار التي تُنشر إلى npm `beta`
- dev: الطرف المتحرك من `main`

بشكل منفصل، يمكن لمشغّلي الإصدارات نشر حزمة النواة للشهر المكتمل السابق
إلى npm `extended-stable`، بدءًا من التصحيح `33`. يستمر خط الإصدار النهائي العادي
للشهر الحالي على npm `latest`؛ ولا يغيّر هذا الفصل في النشر من جهة المشغّل
بحد ذاته آلية حل قناة التحديث في CLI.

## تسمية الإصدارات

- إصدار npm الشهري extended-stable: `YYYY.M.PATCH`، مع `PATCH >= 33`
  - وسم Git: `vYYYY.M.PATCH`
- إصدار نهائي يومي/عادي: `YYYY.M.PATCH`، مع `PATCH < 33`
  - وسم Git: `vYYYY.M.PATCH`
- إصدار تصحيح رجوع عادي: `YYYY.M.PATCH-N`
  - وسم Git: `vYYYY.M.PATCH-N`
- إصدار beta ما قبل الإصدار: `YYYY.M.PATCH-beta.N`
  - وسم Git: `vYYYY.M.PATCH-beta.N`
- لا تضع أصفارًا بادئة للشهر أو التصحيح
- بدءًا من تحديث عملية إصدار يونيو 2026، أصبح المكوّن الثالث رقمًا
  تسلسليًا لمسار الإصدار الشهري، وليس يومًا تقويميًا. تحدد إصدارات stable وbeta
  المسار الحالي؛ ولا تستهلك وسوم alpha فقط رقم تصحيح beta/stable ولا
  تقدّمه. تحتفظ الوسوم وإصدارات npm السابقة للتحديث بأسمائها الحالية وتبقى
  صالحة؛ وتواصل أتمتة الإصدار مقارنتها حسب السنة والشهر والتصحيح والقناة ورقم
  ما قبل الإصدار أو التصحيح.
- تستخدم إصدارات alpha/الليلية مسار التصحيح التالي غير المُصدر، وتزيد فقط
  `alpha.N` عند تكرار البناء. بمجرد أن يحصل ذلك التصحيح على beta، تنتقل
  إصدارات alpha الجديدة إلى التصحيح التالي. تجاهل وسوم alpha القديمة فقط ذات
  أرقام التصحيح الأعلى عند اختيار مسار beta أو stable.
- إصدارات npm غير قابلة للتغيير. إذا نُشر وسم beta بالفعل، فلا تحذفه أو
  تعيد نشره أو تعيد استخدامه؛ اقطع رقم beta التالي أو التصحيح الشهري التالي
  بدلًا من ذلك. نظرًا لأن `2026.6.5-beta.1` نُشر بالفعل أثناء الانتقال، يجب
  أن تستخدم مسارات إصدار يونيو 2026 التصحيح `5` أو أعلى. لا تنشر مسارات
  stable أو beta جديدة ليونيو 2026 بصيغ `2026.6.2` أو `2026.6.3` أو
  `2026.6.4`.
- بعد الإصدار النهائي العادي `2026.6.5`، يكون مسار beta الجديد التالي هو
  `2026.6.6-beta.1`، حتى
  إذا كانت وسوم alpha المؤتمتة فقط ذات أرقام تصحيح أعلى موجودة بالفعل.
- يواصل `latest` اتباع خط npm العادي/اليومي الحالي
- تعني `beta` هدف تثبيت beta الحالي
- يعني `extended-stable` حزمة npm المدعومة للشهر السابق، بدءًا من التصحيح
  `33`؛ وتكون التصحيحات `34` وما بعدها إصدارات صيانة على ذلك الخط الشهري
- ينشر المسار الشهري المخصص extended-stable حزمة npm الأساسية فقط. ولا
  ينشر plugins أو عناصر macOS أو Windows، أو GitHub Release، أو وسوم dist-tags
  لمستودع خاص، أو صور Docker، أو عناصر محمولة، أو تنزيلات الموقع.

## وتيرة الإصدار

- تتحرك الإصدارات beta أولًا
- لا تتبع stable إلا بعد التحقق من أحدث beta
- يقطع المشرفون عادةً الإصدارات من فرع `release/YYYY.M.PATCH` منشأ
  من `main` الحالي، بحيث لا يعرقل التحقق من الإصدار وإصلاحاته التطوير الجديد
  على `main`
- إذا دُفع وسم beta أو نُشر واحتاج إلى إصلاح، يقطع المشرفون
  وسم `-beta.N` التالي بدلًا من حذف وسم beta القديم أو إعادة إنشائه
- تبقى إجراءات الإصدار التفصيلية والموافقات وبيانات الاعتماد وملاحظات
  الاسترداد حكرًا على المشرفين

## نشر extended-stable الشهري إلى npm فقط

هذا استثناء مخصص من إجراء الإصدار العادي أدناه. لشهر مكتمل `YYYY.M`،
أنشئ `extended-stable/YYYY.M.33`؛ وانشر `vYYYY.M.33` وتصحيحات الصيانة
اللاحقة من الفرع نفسه. يجب أن يحدد وسم الإصدار وطرف الفرع وبيئة checkout
وإصدار الحزمة وفحص npm المسبق وتشغيل Full Release Validation الالتزام نفسه
كلها. يجب أن يحتوي `main` المحمي مسبقًا على إصدار نهائي لشهر تقويمي لاحق
بشكل صارم دون التصحيح `33`؛ وتبقى تصحيحات الصيانة مؤهلة بعد أن يتقدم
`main` بأكثر من شهر واحد.

شغّل فحص npm المسبق وFull Release Validation من فرع extended-stable الدقيق،
ثم احفظ معرّفي التشغيل كليهما:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` هو ملف تعريف عمق التحقق الحالي؛ وهو منفصل
عن وسم dist-tag الخاص بـ npm `extended-stable` ومتعمد أن يبقى بلا تغيير.

بعد نجاح التشغيلين وجاهزية بيئة إصدار npm، رقّ الحزمة المضغوطة الدقيقة
من الفحص المسبق. يجب أن يكون التصحيح `P` هو `33` أو أكبر:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

بالنسبة إلى fork أو بروفة غير إنتاجية لا يمكنها عمدًا استيفاء سياسة
الشهر `.33` أو `main` المحمي، أضف
`-f bypass_extended_stable_guard=true` إلى استدعاءات فحص npm المسبق والنشر كليهما.
القيمة الافتراضية هي `false`. لا يُقبل التجاوز إلا مع `npm_dist_tag=extended-stable`
ويُسجل في ملخص workflow. ولا يتجاوز مرجع workflow الأساسي
`extended-stable/YYYY.M.33`، أو مساواة طرف الفرع/الوسم/checkout، أو صيغة الوسم النهائي،
أو مساواة إصدار الحزمة/الوسم، أو هوية التشغيل والبيان المشار إليهما،
أو مصدر الحزمة المضغوطة، أو موافقة البيئة، أو قراءة السجل رجوعًا، أو دليل
إصلاح المحدد.

يتحقق workflow النشر من هويات التشغيل المشار إليها، وبصمة الحزمة المضغوطة
المحضّرة، ومحددي سجل npm كليهما. أكد النتيجة بشكل مستقل بعد نجاح workflow:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

يجب أن يعيد الأمران `YYYY.M.P`. إذا نجح النشر لكن فشلت قراءة المحدد
رجوعًا، فلا تعِد نشر إصدار الحزمة غير القابل للتغيير. استخدم أمر الإصلاح الوحيد
`npm dist-tag add openclaw@YYYY.M.P extended-stable` المطبوع في ملخص workflow
دائم التشغيل عند الفشل، ثم كرر قراءتي الرجوع المستقلتين. الرجوع إلى المحدد
السابق قرار مشغّل منفصل، وليس مسار إصلاح قراءة الرجوع.

تواصل قائمة التحقق العادية أدناه امتلاك beta و`latest` وGitHub Release
وplugins وmacOS وWindows ومنشورات المنصات الأخرى. لا تشغّل تلك الخطوات
لهذا المسار extended-stable الخاص بـ npm فقط.

## قائمة تحقق مشغّل الإصدار العادي

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى تفاصيل بيانات الاعتماد الخاصة
والتوقيع والتوثيق واسترداد dist-tag والرجوع الطارئ في دليل تشغيل الإصدار
الخاص بالمشرفين.

1. ابدأ من `main` الحالي: اسحب الأحدث، وأكّد أن الالتزام الهدف دُفع،
   وأكّد أن CI الحالي لـ `main` أخضر بما يكفي للتفرّع منه.
2. أنشئ قسم `CHANGELOG.md` العلوي من PRs المدمجة وكل الالتزامات المباشرة
   منذ آخر وسم إصدار قابل للوصول. أبقِ الإدخالات موجهة للمستخدم،
   وأزل التكرار بين إدخالات PR/الالتزام المباشر المتداخلة، والتزم إعادة الكتابة، وادفعها،
   ثم أعد التأسيس/اسحب مرة أخرى قبل التفرّع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزِل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب حمله عمداً.
4. أنشئ `release/YYYY.M.PATCH` من `main` الحالي؛ لا تنفّذ عمل الإصدار المعتاد
   مباشرة على `main`.
5. ارفع كل موضع إصدار مطلوب للوسم المقصود، ثم شغّل
   `pnpm release:prep`. يحدّث ذلك إصدارات Plugin، ومخزون Plugin، ومخطط الإعدادات،
   وبيانات تعريف إعداد القنوات المضمّنة، وخط أساس وثائق الإعدادات، وتصديرات Plugin SDK،
   وخط أساس API لـ Plugin SDK بالترتيب الصحيح. التزم أي انحراف مولّد
   قبل الوسم. ثم شغّل الفحص التمهيدي المحلي الحتمي:
   `pnpm check:test-types`، و`pnpm check:architecture`،
   و`pnpm build && pnpm ui:build`، و`pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح باستخدام SHA كامل من 40 حرفاً لفرع الإصدار للتحقق التمهيدي فقط.
   يولّد الفحص التمهيدي دليل إصدار الاعتماديات لرسم اعتماديات
   السحب المحدد بالضبط ويخزّنه في أثر فحص npm التمهيدي.
   احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار، أو الوسم، أو SHA الالتزام الكامل. هذه هي نقطة الإدخال اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest، وDocker، وQA Lab، وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر
   ملف أو مسار أو مهمة سير عمل أو ملف تعريف حزمة أو مزوّد أو قائمة سماح نماذج فاشلة
   تثبت الإصلاح. أعد تشغيل المظلّة الكاملة فقط عندما يجعل السطح المتغير
   الدليل السابق قديماً.
9. لمرشح بيتا موسوم، شغّل
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` من فرع
   `release/YYYY.M.PATCH` المطابق. للإصدار المستقر، مرّر أيضاً إصدار مصدر Windows
   المطلوب:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   يشغّل المساعد فحوصات الإصدار المولّد المحلية، ويرسل أو يتحقق من
   دليل التحقق الكامل من الإصدار وفحص npm التمهيدي، ويشغّل إثبات Parallels
   الجديد/التحديث مقابل ملف tarball المُعد بالضبط بالإضافة إلى إثبات حزمة Telegram،
   ويسجّل خطط npm وClawHub الخاصة بـ Plugin، ويطبع أمر
   `OpenClaw Release Publish` الدقيق فقط بعد أن تصبح حزمة الأدلة خضراء.
   يرسل `OpenClaw Release Publish` حزم Plugin المحددة أو كل الحزم القابلة للنشر
   إلى npm ونفس المجموعة إلى ClawHub بالتوازي، ثم يرقّي
   أثر فحص OpenClaw npm التمهيدي المُعد باستخدام dist-tag المطابق بمجرد
   نجاح نشر Plugin على npm.
   بعد نجاح الابن الخاص بنشر OpenClaw على npm، ينشئ أو يحدّث
   صفحة إصدار/إصدار تمهيدي GitHub المطابقة من قسم
   `CHANGELOG.md` المطابق الكامل. تصبح الإصدارات المستقرة المنشورة إلى npm `latest`
   أحدث إصدار GitHub؛ أما إصدارات الصيانة المستقرة المحفوظة على npm `beta`
   فتُنشأ مع GitHub `latest=false`. يرفع سير العمل أيضاً دليل
   اعتماديات الفحص التمهيدي، وبيان التحقق الكامل، ودليل تحقق السجل
   بعد النشر إلى إصدار GitHub للاستجابة لحوادث ما بعد الإصدار.
   يطبع سير عمل النشر معرّفات تشغيل الأبناء فوراً، ويوافق تلقائياً
   على بوابات بيئة الإصدار التي يُسمح لرمز سير العمل بالموافقة عليها، ويلخص
   مهام الأبناء الفاشلة مع ذيول السجلات، ويغلق إصدار GitHub ودليل الاعتماديات
   بمجرد نجاح نشر OpenClaw على npm، وينتظر ClawHub كلما كان
   OpenClaw npm قيد النشر، ثم يشغّل `pnpm release:verify-beta` ويرفع
   دليل ما بعد النشر لإصدار GitHub، وحزمة npm، وحزم Plugin npm المحددة،
   وحزم ClawHub المحددة، ومعرّفات تشغيل سير العمل الأبناء، ومعرّف تشغيل
   NPM Telegram الاختياري. يعيد مسار ClawHub محاولة إخفاقات تثبيت اعتماديات
   CLI العابرة، وينشر Plugins التي تجتاز المعاينة حتى عندما يتقلب خلية معاينة واحدة،
   وينتهي بتحقق السجل لكل إصدار Plugin متوقع كي تبقى النشرات الجزئية
   مرئية وقابلة لإعادة المحاولة. ثم شغّل قبول الحزمة بعد النشر مقابل حزمة
   `openclaw@YYYY.M.PATCH-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاج إصدار تمهيدي مدفوع أو منشور إلى إصلاح،
   اقطع رقم الإصدار التمهيدي المطابق التالي؛ لا تحذف أو تعِد كتابة الإصدار التمهيدي القديم.
10. للإصدار المستقر، تابع فقط بعد أن يمتلك الإصدار التجريبي أو مرشح الإصدار المدقق
    دليل التحقق المطلوب. يمر نشر npm المستقر أيضاً عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أثر الفحص التمهيدي الناجح عبر
    `preflight_run_id`؛ وتتطلب جاهزية إصدار macOS المستقر أيضاً وجود
    `.zip` و`.dmg` و`.dSYM.zip` المعبأة و`appcast.xml` المحدّث على `main`.
    ينشر سير عمل نشر macOS ملف appcast الموقّع إلى `main` العام
    تلقائياً بعد التحقق من أصول الإصدار؛ إذا منعت حماية الفرع
    الدفع المباشر، فإنه يفتح أو يحدّث PR خاصاً بـ appcast. تتطلب جاهزية Windows Hub
    المستقرة أصول `OpenClawCompanion-Setup-x64.exe` الموقعة،
    و`OpenClawCompanion-Setup-arm64.exe`، و
    `OpenClawCompanion-SHA256SUMS.txt` على إصدار OpenClaw في GitHub.
    مرّر وسم إصدار `openclaw/openclaw-windows-node` الموقّع الدقيق كـ
    `windows_node_tag` وخريطة بصمات المثبت المعتمدة للمرشح الخاصة به كـ
    `windows_node_installer_digests`؛ يحافظ `OpenClaw Release Publish` على
    مسودة الإصدار، ويرسل `Windows Node Release`، ويتحقق من الأصول الثلاثة كلها
    قبل النشر.
11. بعد النشر، شغّل مدقق ما بعد نشر npm، وE2E مستقل اختياري لـ Telegram
    المنشور على npm عندما تحتاج إلى إثبات قناة بعد النشر،
    وترقية dist-tag عند الحاجة، وتحقق من صفحة إصدار GitHub المولّدة،
    وشغّل خطوات إعلان الإصدار، ثم أكمل [إغلاق main المستقر](#stable-main-closeout)
    قبل اعتبار الإصدار المستقر منتهياً.

## إغلاق main المستقر

لا يكتمل النشر المستقر حتى يحمل `main` حالة الإصدار المشحون الفعلية.

1. ابدأ من أحدث `main` جديد. دقّق `release/YYYY.M.PATCH` مقابله
   وانقل إلى الأمام الإصلاحات الحقيقية الغائبة عن `main`. لا تدمج عشوائياً
   محولات التوافق أو الاختبار أو التحقق الخاصة بالإصدار فقط في `main` الأحدث.
2. عيّن `main` إلى إصدار المستقر المشحون، لا إلى قطار تالٍ افتراضي. شغّل
   `pnpm release:prep` بعد تغيير إصدار الجذر، ثم
   `pnpm deps:shrinkwrap:generate`.
3. اجعل قسم `## YYYY.M.PATCH` في `CHANGELOG.md` على `main` مطابقاً تماماً
   لفرع الإصدار الموسوم. ضمّن تحديث `appcast.xml` المستقر عندما ينشر
   إصدار mac واحداً.
4. لا تضف `YYYY.M.PATCH+1`، أو إصدار بيتا، أو قسم سجل تغييرات مستقبلياً فارغاً
   إلى `main` حتى يبدأ المشغّل قطار الإصدار ذلك صراحة.
5. شغّل `pnpm release:generated:check`، و`pnpm deps:shrinkwrap:check`، و
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. ادفع، ثم تحقق من أن `origin/main`
   يحتوي على الإصدار المشحون وسجل التغييرات قبل اعتبار الإصدار المستقر منتهياً.
6. أبقِ متغيري المستودع `RELEASE_ROLLBACK_DRILL_ID` و
   `RELEASE_ROLLBACK_DRILL_DATE` محدثين بعد كل تدريب تراجع خاص.
   يبدأ `OpenClaw Stable Main Closeout` من دفع `main` الذي يحمل
   الإصدار المشحون، وسجل التغييرات، وappcast بعد النشر المستقر. يقرأ
   دليل ما بعد النشر غير القابل للتغيير لربط الوسم المشحون بتشغيلات
   Full Release Validation وPublish الخاصة به، ثم يتحقق من حالة main المستقرة،
   والإصدار، وفترة الاستقرار الإلزامية للمستقر، ودليل الأداء الحاجب. يرفق
   بيان إغلاق غير قابل للتغيير ومجموعه الاختباري بإصدار GitHub. يتجاوز
   مشغّل الدفع التلقائي الإصدارات القديمة التي تسبق دليل ما بعد النشر
   غير القابل للتغيير؛ ولا يتعامل أبداً مع ذلك التجاوز كإغلاق مكتمل. يتطلب
   الإغلاق الكامل كلا الأصلين ومجموعاً اختبارياً مطابقاً. يعيد البيان الجزئي
   تشغيل SHA `main` المسجل وتدريب التراجع لإعادة توليد بايتات مطابقة،
   ثم يرفق المجموع الاختباري المفقود؛ ويبقى الزوج غير الصالح، أو المجموع الاختباري
   دون بيان، حاجباً. يتجاوز تشغيل مُشغّل بالدفع دون متغيرات مستودع تدريب التراجع
   دون إكمال الإغلاق؛ ويظل سجل التدريب المفقود أو الأقدم من 90 يوماً حاجباً
   للإغلاق اليدوي المدعوم بالأدلة. تبقى أوامر الاسترداد الخاصة في دليل التشغيل
   الخاص بالمشرفين فقط. استخدم الإرسال اليدوي فقط لإصلاح أو إعادة تشغيل إغلاق
   مستقر مدعوم بالأدلة. يجوز لوسم تصحيح رجعي قديم أن يعيد استخدام دليل
   الحزمة الأساسية فقط عندما يحل وسم التصحيح إلى نفس الالتزام المصدر مثل وسم
   المستقر الأساسي. يجب على التصحيح ذي المصدر المختلف نشر دليل الحزمة الخاص به
   والتحقق منه.

## الفحص التمهيدي للإصدار

- شغّل `pnpm check:test-types` قبل الفحص التمهيدي للإصدار حتى يبقى TypeScript الخاص بالاختبارات
  مغطى خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل الفحص التمهيدي للإصدار حتى تكون فحوصات دورات الاستيراد
  وحدود البنية الأوسع خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون عناصر إصدار
  `dist/*` المتوقعة وحزمة واجهة التحكم موجودة لخطوة التحقق من الحزمة
- شغّل `pnpm release:prep` بعد رفع إصدار الجذر وقبل وضع الوسم. فهو
  يشغّل كل مولد إصدار حتمي غالبًا ما ينحرف بعد تغيير
  إصدار/إعداد/API: إصدارات Plugin، ومخزون Plugin، ومخطط الإعداد الأساسي،
  وبيانات تعريف إعداد القنوات المضمّنة، وخط أساس مستندات الإعداد، وصادرات plugin SDK،
  وخط أساس API الخاص بـ plugin SDK. يعيد `pnpm release:check` تشغيل تلك
  الحراس في وضع الفحص ويبلغ عن كل فشل انحراف مولّد يجده في مرور واحد
  قبل تشغيل فحوصات إصدار الحزمة.
- تحدّث مزامنة إصدار Plugin إصدارات حزم Plugin الرسمية وحدود
  `openclaw.compat.pluginApi` الحالية إلى إصدار OpenClaw
  افتراضيًا. تعامل مع هذا الحقل بصفته حد API الأدنى لـ plugin SDK/runtime، وليس مجرد نسخة
  من إصدار الحزمة: لإصدارات Plugin فقط التي تبقى عمدًا
  متوافقة مع مضيفات OpenClaw الأقدم، أبقِ الحد الأدنى على أقدم
  API مضيف مدعوم ووثّق هذا الاختيار في إثبات إصدار Plugin.
- شغّل سير العمل اليدوي `Full Release Validation` قبل اعتماد الإصدار
  لتشغيل كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعًا،
  أو وسمًا، أو SHA التزام كاملًا، ويرسل `CI` يدويًا، ويرسل
  `OpenClaw Release Checks` لاختبار التثبيت السريع، وقبول الحزمة، وفحوصات الحزمة
  عبر أنظمة التشغيل، وتكافؤ QA Lab، ومسارات Matrix، وTelegram. تتضمن تشغيلات Stable والكاملة
  دائمًا Live/E2E شاملًا واستمرارًا لمسار إصدار Docker؛
  يُحتفظ بـ `run_release_soak=true` لاستمرار beta صريح. يوفر
  Package Acceptance اختبار Telegram E2E الأساسي للحزمة أثناء تحقق المرشح،
  مما يتجنب مشغّل استطلاع live متزامنًا ثانيًا.
  قدّم `release_package_spec` بعد نشر beta لإعادة استخدام حزمة
  npm المنشورة عبر فحوصات الإصدار، وPackage Acceptance، وTelegram
  E2E للحزمة دون إعادة بناء tarball الإصدار. قدّم
  `npm_telegram_package_spec` فقط عندما ينبغي أن يستخدم Telegram حزمة
  منشورة مختلفة عن بقية تحقق الإصدار. قدّم
  `package_acceptance_package_spec` عندما ينبغي أن يستخدم Package Acceptance حزمة
  منشورة مختلفة عن مواصفة حزمة الإصدار. قدّم
  `evidence_package_spec` عندما ينبغي أن يثبت تقرير دليل الإصدار أن
  التحقق يطابق حزمة npm منشورة دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- شغّل سير العمل اليدوي `Package Acceptance` عندما تريد إثباتًا عبر قناة جانبية
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` لـ
  `openclaw@beta` أو `openclaw@latest` أو إصدار دقيق؛ و`source=ref`
  لحزم فرع/وسم/SHA موثوق في `package_ref` باستخدام عُدة
  `workflow_ref` الحالية؛ و`source=url` لملف tarball عام عبر HTTPS مع
  SHA-256 مطلوب وسياسة URL عامة صارمة؛ و`source=trusted-url` لسياسة
  مصدر موثوق مسماة باستخدام `trusted_source_id` وSHA-256 المطلوبين؛ أو
  `source=artifact` لملف tarball رُفع بواسطة تشغيل GitHub Actions آخر. يحل
  سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E مقابل ذلك
  الملف، ويمكنه تشغيل Telegram QA مقابل الملف نفسه مع
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن
  مسارات Docker المحددة `published-upgrade-survivor`، تكون أداة الحزمة
  هي المرشح ويحدد `published_upgrade_survivor_baseline`
  خط الأساس المنشور. يستخدم `update-restart-auth` حزمة المرشح بصفتها
  CLI المثبتة وpackage-under-test معًا حتى يختبر مسار إعادة التشغيل
  المدار الخاص بأمر تحديث المرشح.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  الملفات الشخصية الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعداد
  - `package`: مسارات الحزمة/التحديث/إعادة التشغيل/Plugin الأصلية للأداة دون OpenWebUI أو ClawHub live
  - `product`: ملف الحزمة الشخصي إضافة إلى قنوات MCP، وتنظيف cron/subagent،
    وبحث الويب OpenAI، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` الدقيق لإعادة تشغيل مركزة
- شغّل سير العمل اليدوي `CI` مباشرة عندما تحتاج فقط إلى تغطية CI عادية
  حتمية لمرشح الإصدار. تتجاوز إرسالات CI اليدوية تحديد النطاق حسب التغييرات
  وتفرض شظايا Linux Node، وشظايا Plugin المضمّنة، وشظايا عقود Plugin والقنوات،
  وتوافق Node 22، و`check-*`، و`check-additional-*`،
  وفحوصات smoke للأدوات المبنية، وفحوصات المستندات، وSkills Python، وWindows، وmacOS، ومسارات
  i18n الخاصة بواجهة التحكم. تشغّل تشغيلات CI اليدوية المستقلة Android فقط عند إرسالها
  مع `include_android=true`؛ يمرر `Full Release Validation` ذلك الإدخال
  إلى ابن CI الخاص به.
  مثال مع Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. فهو يختبر
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من تصدير التتبعات، والمقاييس، والسجلات
  إضافة إلى سمات تتبع محدودة وتنقيح المحتوى/المعرّفات دون
  الحاجة إلى Opik أو Langfuse أو جامع خارجي آخر.
- شغّل `pnpm qa:otel:collector-smoke` عند التحقق من توافق الجامع.
  فهو يوجّه تصدير OTLP نفسه الخاص بـ QA-lab عبر حاوية Docker حقيقية لـ OpenTelemetry Collector
  قبل تأكيدات المستقبل المحلي.
- شغّل `pnpm qa:prometheus:smoke` عند التحقق من جمع Prometheus المحمي.
  فهو يختبر QA-lab، ويرفض عمليات الجمع غير المصادق عليها، ويتحقق من أن
  عائلات المقاييس الحرجة للإصدار تبقى خالية من محتوى المطالبات، والمعرّفات الخام،
  ورموز المصادقة، والمسارات المحلية.
- شغّل `pnpm qa:observability:smoke` عندما تريد تشغيل مسارات smoke الخاصة بـ
  OpenTelemetry وPrometheus من checkout المصدر بالتتابع.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- ينشئ الفحص التمهيدي لـ `OpenClaw NPM Release` دليل إصدار التبعيات قبل
  أن يحزم tarball الخاص بـ npm. بوابة ثغرات تنبيهات npm
  مانعة للإصدار. أما تقارير مخاطر البيان الانتقالية، وسطح ملكية/تثبيت
  التبعيات، وتغييرات التبعيات فهي دليل إصدار فقط. يقارن
  تقرير تغييرات التبعيات مرشح الإصدار مع وسم الإصدار السابق
  القابل للوصول.
- يرفع الفحص التمهيدي دليل التبعيات باسم
  `openclaw-release-dependency-evidence-<tag>` ويدرجه أيضًا تحت
  `dependency-evidence/` داخل أداة الفحص التمهيدي المعدة لـ npm. يعيد مسار
  النشر الحقيقي استخدام أداة الفحص التمهيدي تلك، ثم يرفق الدليل نفسه
  بإصدار GitHub باسم `openclaw-<version>-dependency-evidence.zip`.
- شغّل `OpenClaw Release Publish` لتسلسل النشر المُغيّر بعد وجود
  الوسم. أرسله من `release/YYYY.M.PATCH` (أو `main` عند نشر وسم
  قابل للوصول من main)، ومرّر وسم الإصدار، و`preflight_run_id` ناجحًا لـ OpenClaw npm،
  و`full_release_validation_run_id` ناجحًا، واحتفظ
  بنطاق نشر Plugin الافتراضي `all-publishable` إلا إذا كنت تشغّل
  إصلاحًا مركزًا عمدًا. ينسّق سير العمل نشر Plugin إلى npm، ونشر Plugin إلى
  ClawHub، ونشر OpenClaw إلى npm حتى لا تُنشر الحزمة الأساسية
  قبل Plugins الخارجية الخاصة بها.
- يتطلب `OpenClaw Release Publish` المستقر `windows_node_tag` دقيقًا بعد
  وجود إصدار `openclaw/openclaw-windows-node` المطابق غير التمهيدي.
  كما يتطلب خريطة `windows_node_installer_digests` المعتمدة للمرشح.
  قبل إرسال أي ابن نشر، يتحقق من أن إصدار المصدر
  منشور، وغير تمهيدي، ويحتوي على مثبتات x64/ARM64 المطلوبة، وما زال
  يطابق تلك الخريطة المعتمدة. ثم يرسل `Windows Node Release`
  بينما لا يزال إصدار OpenClaw مسودة، حاملًا خريطة بصمات المثبت المثبتة
  دون تغيير. يحمّل سير العمل الابن مثبتات Windows Hub الموقعة من ذلك الوسم الدقيق،
  ويطابقها مع البصمات المثبتة، ويتحقق من أن توقيعات Authenticode الخاصة بها
  تستخدم الموقّع المتوقع OpenClaw Foundation على مشغّل Windows،
  ويكتب بيان SHA-256، ويرفع المثبتات والبيان إلى
  إصدار GitHub الأساسي لـ OpenClaw، ثم يعيد تنزيل الأصول المرقّاة و
  يتحقق من عضوية البيان والتجزئات. يتحقق الأصل من عقد أصول
  x64 وARM64 وchecksum الحالي قبل النشر. يرفض الاسترداد المباشر
  أسماء أصول `OpenClawCompanion-*` غير المتوقعة قبل استبدال
  أصول العقد المتوقعة ببايتات المصدر المثبتة. أرسل
  `Windows Node Release` يدويًا للاسترداد فقط، ومرّر دائمًا وسمًا دقيقًا، وليس
  `latest`، إضافة إلى خريطة JSON الصريحة `expected_installer_digests` من
  إصدار المصدر المعتمد. ينبغي أن تستهدف روابط تنزيل الموقع عناوين URL دقيقة لأصول إصدار OpenClaw
  للإصدار المستقر الحالي، أو
  `releases/latest/download/...` فقط بعد التحقق من أن إعادة توجيه latest في GitHub
  تشير إلى الإصدار نفسه؛ لا تربط فقط بصفحة إصدار repo المرافق.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضًا مسار تكافؤ QA Lab mock إضافة إلى ملف
  Matrix live السريع ومسار Telegram QA قبل اعتماد الإصدار. تستخدم المسارات live
  بيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا إيجارات بيانات اعتماد Convex CI.
  شغّل سير العمل اليدوي `QA-Lab - All Lanes` مع
  `matrix_profile=all` و`matrix_shards=true` عندما تريد مخزون Matrix كاملًا
  للنقل، والوسائط، وE2EE بالتوازي.
- يعد تحقق التثبيت والترقية عبر أنظمة التشغيل جزءًا من
  `OpenClaw Release Checks` و`Full Release Validation` العامة، التي تستدعي
  سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا،
  وحتميًا، ومركزًا على الأدوات، بينما تبقى الفحوصات live الأبطأ في مسارها
  الخاص حتى لا تعطل النشر أو تمنعه
- ينبغي إرسال فحوصات الإصدار التي تحمل أسرارًا عبر `Full Release
Validation` أو من مرجع سير عمل `main`/release حتى تبقى منطق سير العمل
  والأسرار مضبوطة
- يقبل `OpenClaw Release Checks` فرعًا، أو وسمًا، أو SHA التزام كاملًا ما دام
  الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو وسم إصدار
- يقبل الفحص التمهيدي الخاص بالتحقق فقط لـ `OpenClaw NPM Release` أيضًا SHA الالتزام
  الكامل بطول 40 حرفًا لفرع سير العمل الحالي دون اشتراط وسم مدفوع
- مسار SHA هذا مخصص للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، ينشئ سير العمل `v<package.json version>` فقط لفحص
  بيانات تعريف الحزمة؛ وما زال النشر الحقيقي يتطلب وسم إصدار حقيقيًا
- يُبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات GitHub المستضافة،
  بينما يمكن لمسار التحقق غير المُغيّر استخدام مشغلات
  Blacksmith Linux الأكبر
- يشغّل سير العمل هذا
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد الفحص التمهيدي لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- قبل وسم مرشح إصدار محليًا، شغّل
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. يشغّل المساعد
  حواجز الإصدار السريعة، وفحوصات إصدار Plugin إلى npm/ClawHub، والبناء،
  وبناء الواجهة، و`release:openclaw:npm:check` بالترتيب الذي يلتقط الأخطاء الشائعة
  المانعة للاعتماد قبل بدء سير عمل النشر في GitHub.
- شغّل `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/correction المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (أو إصدار البيتا/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور
  ضمن بادئة مؤقتة جديدة
- بعد نشر بيتا، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تهيئة الحزمة المثبتة، وإعداد Telegram، واختبار Telegram E2E حقيقي
  مقابل حزمة npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المؤجرة المشتركة.
  يمكن للمشرفين محليًا في الحالات الفردية حذف متغيرات Convex وتمرير بيانات اعتماد البيئة الثلاث
  `OPENCLAW_QA_TELEGRAM_*` مباشرة.
- لتشغيل اختبار بيتا الكامل بعد النشر من جهاز مشرف، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق Parallels لتحديث npm/هدف جديد، ويرسل `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل المحدد، وينزّل الأثر، ويطبع تقرير Telegram.
- يستطيع المشرفون تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر سير العمل اليدوي
  `NPM Telegram Beta E2E`. وهو يدوي فقط عن قصد
  ولا يعمل عند كل دمج.
- تستخدم أتمتة إصدار المشرفين الآن أسلوب الفحص المسبق ثم الترقية:
  - يجب أن يجتاز نشر npm الحقيقي `preflight_run_id` ناجحًا
  - يجب إرسال نشر npm الحقيقي من فرع `main` نفسه أو
    فرع `release/YYYY.M.PATCH` نفسه الذي شُغّل منه الفحص المسبق الناجح
  - إصدارات npm المستقرة تُعيَّن افتراضيًا إلى `beta`
  - يمكن أن يستهدف نشر npm المستقر `latest` صراحة عبر إدخال سير العمل
  - أصبح تعديل npm dist-tag القائم على الرمز المميز موجودًا الآن في
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` لأن
    `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما يحتفظ مستودع المصدر
    بالنشر عبر OIDC فقط
  - إصدار `macOS Release` العام مخصص للتحقق فقط؛ عندما توجد وسمية فقط على
    فرع إصدار لكن سير العمل يُرسل من `main`، عيّن
    `public_release_branch=release/YYYY.M.PATCH`
  - يجب أن يجتاز نشر macOS الحقيقي `preflight_run_id` و
    `validate_run_id` ناجحين
  - تروّج مسارات النشر الحقيقية الآثار المُعدّة بدلًا من إعادة بنائها
    مرة أخرى
- بالنسبة لإصدارات التصحيح المستقرة مثل `YYYY.M.PATCH-N`، يتحقق مدقق ما بعد النشر
  أيضًا من مسار الترقية نفسه ذي البادئة المؤقتة من `YYYY.M.PATCH` إلى `YYYY.M.PATCH-N`
  بحيث لا يمكن لتصحيحات الإصدار أن تترك التثبيتات العامة الأقدم بصمت على
  حمولة الإصدار المستقر الأساسية
- يفشل الفحص المسبق لإصدار npm بشكل مغلق ما لم يتضمن ملف tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- يتحقق فحص ما بعد النشر أيضًا من وجود نقاط دخول Plugin المنشورة
  وبيانات تعريف الحزمة في تخطيط السجل المثبت. يفشل الإصدار الذي
  يشحن حمولات تشغيل Plugin مفقودة في مدقق ما بعد النشر ولا يمكن
  ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية npm pack `unpackedSize` على
  ملف tarball المرشح للتحديث، بحيث يلتقط installer e2e تضخم الحزمة العرضي
  قبل مسار نشر الإصدار
- إذا مسّ عمل الإصدار تخطيط CI، أو بيانات توقيت الامتدادات، أو
  مصفوفات اختبارات الامتدادات، فأعد توليد وراجع مخرجات مصفوفة
  `plugin-prerelease-extension-shard` المملوكة للمخطط من
  `.github/workflows/plugin-prerelease.yml` قبل الموافقة حتى لا
  تصف ملاحظات الإصدار تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح المُحدِّث:
  - يجب أن ينتهي إصدار GitHub باحتواء ملفات `.zip` و`.dmg` و`.dSYM.zip` المحزمة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر؛
    يثبته سير عمل نشر macOS تلقائيًا، أو يفتح PR لـ appcast
    عندما يُحظر الدفع المباشر
  - يجب أن يحتفظ التطبيق المحزم بمعرّف حزمة غير تصحيحي، وعنوان URL غير فارغ لخلاصة Sparkle،
    و`CFBundleVersion` عند حد بناء Sparkle القانوني لذلك الإصدار أو أعلى منه

## مربعات اختبار الإصدار

`Full Release Validation` هي الطريقة التي يستخدمها المشغلون لتشغيل كل اختبارات ما قبل الإصدار من
نقطة دخول واحدة. لإثبات تثبيت commit محدد على فرع سريع التغير، استخدم
المساعد حتى يعمل كل workflow فرعي من فرع مؤقت مثبت عند
SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويشغّل `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن كل workflow فرعي لديه `headSha`
يطابق الهدف، ثم يحذف الفرع المؤقت. هذا يتجنب إثبات تشغيل فرعي
أحدث لـ `main` عن طريق الخطأ.

للتحقق من فرع إصدار أو وسم، شغّله من مرجع workflow الموثوق `main`
ومرّر فرع الإصدار أو الوسم بوصفه `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

يحلّ workflow مرجع الهدف، ويشغّل `CI` اليدوي مع
`target_ref=<release-ref>`، ثم يشغّل `OpenClaw Release Checks`.
يوسّع `OpenClaw Release Checks` النطاق إلى اختبارات install smoke، وفحوصات إصدار عبر أنظمة تشغيل متعددة،
وتغطية live/E2E لمسار إصدار Docker عند تمكين soak، وPackage Acceptance
مع Telegram package E2E القياسي، وتكافؤ QA Lab، وMatrix الحية، وTelegram الحية.
لا يكون تشغيل full/all مقبولًا إلا عندما يعرض ملخص `Full Release Validation`
أن `normal_ci` و`plugin_prerelease` و`release_checks` ناجحة،
ما لم يكن تشغيل مركز قد تخطى عمدًا الطفل المنفصل `Plugin
Prerelease`. استخدم الطفل المستقل `npm-telegram` فقط لتشغيل مركز
لحزمة منشورة مع `release_package_spec` أو
`npm_telegram_package_spec`. يتضمن ملخص
التحقق النهائي جداول أبطأ الوظائف لكل تشغيل فرعي، حتى يستطيع مدير الإصدار
رؤية المسار الحرج الحالي دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل الكاملة، وأسماء وظائف workflow الدقيقة، وفروق profile المستقر مقابل الكامل،
والأدلة، ومقابض إعادة التشغيل المركزة.
تُشغّل workflows الفرعية من المرجع الموثوق الذي يشغّل `Full Release
Validation`، عادة `--ref main`، حتى عندما يشير `ref` الهدف إلى
فرع إصدار أو وسم أقدم. لا يوجد إدخال منفصل لمرجع workflow خاص بـ Full Release Validation؛
اختر أداة الاختبار الموثوقة باختيار مرجع تشغيل workflow.
لا تستخدم `--ref main -f ref=<sha>` لإثبات commit دقيق على `main` متحرك؛
لا يمكن أن تكون raw commit SHAs مراجع workflow dispatch، لذا استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبت.

استخدم `release_profile` لاختيار اتساع live/provider:

- `minimum`: أسرع مسار live وDocker الحرج للإصدار في OpenAI/core
- `stable`: الحد الأدنى مع تغطية provider/backend المستقرة للموافقة على الإصدار
- `full`: المستقر مع تغطية استشارية واسعة للـ provider/media

يشغّل التحقق المستقر والكامل دائمًا المسح الشامل live/E2E، ومسار إصدار Docker،
ومسح published upgrade-survivor المحدود قبل الترقية.
استخدم `run_release_soak=true` لطلب المسح نفسه لنسخة beta. يغطي ذلك المسح
آخر أربع حزم مستقرة بالإضافة إلى خطوط الأساس المثبتة `2026.4.23` و`2026.5.2`
إلى جانب تغطية `2026.4.15` الأقدم، مع إزالة خطوط الأساس المكررة
وتقسيم كل خط أساس إلى وظيفة Docker runner خاصة به.

يستخدم `OpenClaw Release Checks` مرجع workflow الموثوق لحل مرجع الهدف
مرة واحدة بوصفه `release-package-under-test` ويعيد استخدام ذلك الأثر في فحوصات cross-OS،
وPackage Acceptance، وفحوصات release-path Docker عند تشغيل soak. هذا يحافظ
على أن كل مربعات الحزم تواجه نفس البايتات ويتجنب تكرار بناء الحزمة.
بعد نشر beta بالفعل على npm، اضبط `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
حتى تنزّل فحوصات الإصدار الحزمة المشحونة مرة واحدة، وتستخرج SHA مصدر البناء
من `dist/build-info.json`، وتعيد استخدام ذلك الأثر في مسارات cross-OS،
وPackage Acceptance، وrelease-path Docker، وpackage Telegram.
يستخدم اختبار cross-OS OpenAI install smoke `OPENCLAW_CROSS_OS_OPENAI_MODEL` عندما يكون
متغير repo/org مضبوطًا، وإلا يستخدم `openai/gpt-5.4`، لأن هذا المسار
يثبت تثبيت الحزمة، والإعداد الأولي، وبدء Gateway، ودورة agent حية واحدة
بدلًا من قياس أبطأ نموذج افتراضي. تبقى مصفوفة provider الحية الأوسع
هي موضع التغطية الخاصة بالنموذج.

استخدم هذه الصيغ بحسب مرحلة الإصدار:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
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
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

لا تستخدم المظلة الكاملة كأول إعادة تشغيل بعد إصلاح مركز. إذا فشل مربع واحد،
فاستخدم workflow الفرعي الفاشل، أو الوظيفة، أو مسار Docker، أو profile الحزمة، أو model
provider، أو مسار QA للإثبات التالي. شغّل المظلة الكاملة مرة أخرى فقط عندما
يغيّر الإصلاح تنسيق الإصدار المشترك أو يجعل أدلة كل المربعات السابقة
قديمة. يعيد المدقق النهائي للمظلة فحص معرفات تشغيل workflows الفرعية المسجلة،
لذا بعد إعادة تشغيل workflow فرعي بنجاح، أعد تشغيل وظيفة الوالد
`Verify full validation` الفاشلة فقط.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل
مرشح الإصدار الحقيقي، و`ci` يشغّل طفل CI العادي فقط، و`plugin-prerelease`
يشغّل طفل Plugin الخاص بالإصدار فقط، و`release-checks` يشغّل كل مربع إصدار،
ومجموعات الإصدار الأضيق هي `install-smoke` و`cross-os`
و`live-e2e` و`package` و`qa` و`qa-parity` و`qa-live` و`npm-telegram`.
تتطلب إعادات تشغيل `npm-telegram` المركزة `release_package_spec` أو
`npm_telegram_package_spec`؛ تستخدم تشغيلات full/all حزمة Telegram
E2E القياسية داخل Package Acceptance. يمكن لإعادات تشغيل
cross-OS المركزة إضافة `cross_os_suite_filter=windows/packaged-upgrade` أو
مرشح OS/suite آخر. تمنع إخفاقات QA release-check التحقق العادي من الإصدار،
بما في ذلك انحراف أدوات OpenClaw الديناميكية المطلوب في المستوى القياسي.
قد تظل تشغيلات Tideclaw alpha تعد مسارات release-check غير المتعلقة بسلامة الحزمة
استشارية. عندما يطلب `live_suite_filter` صراحة مسار QA حيًا محكومًا مثل
Discord أو WhatsApp أو Slack، يجب تمكين متغير repo المطابق
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`؛ وإلا يفشل التقاط الإدخال بدلًا من
تخطي المسار بصمت.

### Vitest

مربع Vitest هو workflow الفرعي `CI` اليدوي. يتجاوز CI اليدوي عمدًا
نطاق التغييرات ويفرض مخطط الاختبارات العادي لمرشح الإصدار:
شظايا Linux Node، وشظايا Plugin المجمعة، وشظايا عقود Plugin والقنوات،
وتوافق Node 22، و`check-*`، و`check-additional-*`،
وفحوصات smoke للأثر المبني، وفحوصات الوثائق، وPython skills، وWindows، وmacOS،
وControl UI i18n. يُضمّن Android عندما يشغّل `Full Release Validation`
المربع لأن المظلة تمرر `include_android=true`؛ ويتطلب CI اليدوي المستقل
`include_android=true` لتغطية Android.

استخدم هذا المربع للإجابة عن "هل نجحت شجرة المصدر في مجموعة الاختبارات العادية الكاملة؟"
إنه ليس مثل تحقق المنتج عبر مسار الإصدار. الأدلة التي يجب الاحتفاظ بها:

- ملخص `Full Release Validation` الذي يعرض عنوان URL لتشغيل `CI` المشغّل
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الشظايا الفاشلة أو البطيئة من وظائف CI عند التحقيق في التراجعات
- آثار توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما
  يحتاج التشغيل إلى تحليل الأداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي ولكن
لا يحتاج إلى مربعات Docker أو QA Lab أو live أو cross-OS أو package. استخدم الأمر الأول
لـ CI مباشر بلا Android. أضف `include_android=true` عندما يجب أن يغطي CI
المباشر لمرشح الإصدار Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

يقع مربع Docker في `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، بالإضافة إلى workflow
`install-smoke` في وضع الإصدار. إنه يتحقق من مرشح الإصدار عبر بيئات Docker
المعبأة بدلًا من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- install smoke كامل مع تمكين اختبار Bun global install smoke البطيء
- إعداد/إعادة استخدام صورة smoke لـ root Dockerfile حسب SHA الهدف، مع تشغيل وظائف QR،
  وroot/gateway، وinstaller/Bun smoke كشظايا install-smoke منفصلة
- مسارات repository E2E
- أجزاء release-path Docker: `core`، و`package-update-openai`،
  و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`،
  و`plugins-runtime-services`،
  و`plugins-runtime-install-a`، و`plugins-runtime-install-b`،
  و`plugins-runtime-install-c`، و`plugins-runtime-install-d`،
  و`plugins-runtime-install-e`، و`plugins-runtime-install-f`،
  و`plugins-runtime-install-g`، و`plugins-runtime-install-h`
- تغطية OpenWebUI داخل جزء `plugins-runtime-services` عند طلبها
- مسارات تثبيت/إلغاء تثبيت Plugin المجمعة المنقسمة
  `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات provider live/E2E وتغطية نموذج Docker live عندما تشمل فحوصات الإصدار
  مجموعات live

استخدم آثار Docker قبل إعادة التشغيل. يرفع مجدول release-path
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وJSON خطة المجدول، وأوامر إعادة التشغيل. للاسترداد المركز،
استخدم `docker_lanes=<lane[,lane]>` على workflow القابل لإعادة الاستخدام live/E2E بدلًا من
إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة التشغيل المولدة
`package_artifact_run_id` السابق ومدخلات صورة Docker المعدة عندما تكون متاحة، حتى
يستطيع المسار الفاشل إعادة استخدام نفس tarball وصور GHCR.

### QA Lab

مربع QA Lab هو أيضًا جزء من `OpenClaw Release Checks`. إنه بوابة الإصدار
لسلوك agent ومستوى القناة، منفصل عن Vitest وآليات حزمة Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ mock يقارن مسار OpenAI المرشح مع خط أساس Opus 4.6
  باستخدام حزمة التكافؤ agentic
- profile QA سريع لـ Matrix الحية باستخدام بيئة `qa-live-shared`
- مسار QA حي لـ Telegram باستخدام استئجارات بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke`، أو `pnpm qa:otel:collector-smoke`،
  أو `pnpm qa:prometheus:smoke`، أو
  `pnpm qa:observability:smoke` عندما تحتاج telemetry الإصدار إلى إثبات محلي صريح

استخدم هذا المربع للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات الحية؟" احتفظ بعناوين URL للآثار الخاصة بمسارات التكافؤ، وMatrix، وTelegram
عند الموافقة على الإصدار. تظل تغطية Matrix الكاملة متاحة كتشغيل QA-Lab
يدوي مقسم بدلًا من المسار الحرج الافتراضي للإصدار.

### الحزمة

مربع الحزمة هو بوابة المنتج القابل للتثبيت. يدعمه
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبّع المحلل
مرشحًا إلى tarball `package-under-test` الذي تستهلكه Docker E2E، ويتحقق
من مخزون الحزمة، ويسجل إصدار الحزمة وSHA-256، ويبقي
مرجع أداة workflow منفصلًا عن مرجع مصدر الحزمة.

مصادر المرشح المدعومة:

- `source=npm`: ‏`openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيق
- `source=ref`: حزم فرع `package_ref` موثوق أو وسمًا أو SHA كاملًا للالتزام
  مع Harness المحدد في `workflow_ref`
- `source=url`: نزّل ملف HTTPS عام بصيغة `.tgz` مع `package_sha256` المطلوب؛
  تُرفض بيانات اعتماد URL، ومنافذ HTTPS غير الافتراضية، وأسماء المضيفين أو العناوين المحلولة
  الخاصة/الداخلية/ذات الاستخدام الخاص، وعمليات إعادة التوجيه غير الآمنة
- `source=trusted-url`: نزّل ملف HTTPS بصيغة `.tgz` مع
  `package_sha256` و`trusted_source_id` المطلوبين من سياسة مسماة في
  `.github/package-trusted-sources.json`؛ استخدم هذا لمرايا المؤسسة أو مستودعات الحزم الخاصة
  التي يملكها المشرفون بدلًا من إضافة تجاوز شبكة خاصة على مستوى الإدخال إلى `source=url`
- `source=artifact`: أعد استخدام ملف `.tgz` رُفع بواسطة تشغيل GitHub Actions آخر

يشغّل `OpenClaw Release Checks`‏ Package Acceptance باستخدام `source=artifact`،
وأثر حزمة الإصدار المحضّرة، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`،
و`telegram_mode=mock-openai`. تُبقي Package Acceptance فحوص الترحيل، والتحديث،
وإعادة تشغيل تحديث المصادقة المكوّنة، وتثبيت مهارة ClawHub المباشر، وتنظيف اعتماديات Plugin القديمة، وتركيبات Plugin غير المتصلة،
وتحديث Plugin، وضمان جودة حزمة Telegram على ملف tarball المحلول نفسه. تستخدم فحوص الإصدار الحاجزة خط الأساس الافتراضي لأحدث حزمة منشورة؛
ويوسّع ملف beta الشخصي مع `run_release_soak=true` أو `release_profile=stable` أو
`release_profile=full` النطاق إلى كل خط أساس مستقر منشور على npm من
`2026.4.23` حتى `latest` بالإضافة إلى تركيبات المشكلات المبلغ عنها. استخدم
Package Acceptance مع `source=npm` لمرشح شُحن بالفعل،
و`source=ref` لملف tarball محلي من npm مدعوم بـ SHA قبل النشر،
و`source=trusted-url` لمرآة مؤسسة/خاصة يملكها المشرف، أو
`source=artifact` لملف tarball محضّر رُفع بواسطة تشغيل GitHub Actions آخر.
إنها البديل الأصلي في GitHub لمعظم تغطية الحزمة/التحديث التي كانت تتطلب سابقًا
Parallels. لا تزال فحوص الإصدار عبر أنظمة التشغيل مهمة لسلوكيات الإعداد الأولي الخاصة بنظام التشغيل
والمثبّت والمنصة، لكن يجب أن تفضّل عملية التحقق من منتج الحزمة/التحديث
Package Acceptance.

قائمة التحقق المعيارية للتحقق من التحديث وPlugin هي
[اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins). استخدمها عند
تحديد مسار Local أو Docker أو Package Acceptance أو فحص الإصدار الذي يثبت
تثبيت/تحديث Plugin، أو تنظيف doctor، أو تغيير ترحيل حزمة منشورة.
الترحيل الشامل لتحديث منشور من كل حزمة مستقرة `2026.4.23+` هو
Workflow يدوي منفصل باسم `Update Migration`، وليس جزءًا من Full Release CI.

تسامح package-acceptance القديم محدود زمنيًا عمدًا. قد تستخدم الحزم حتى
`2026.4.25` مسار التوافق لفجوات البيانات الوصفية المنشورة بالفعل
إلى npm: إدخالات مخزون QA الخاصة المفقودة من ملف tarball، وغياب
`gateway install --wrapper`، وغياب ملفات التصحيح في تركيب git المستمد من tarball،
وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة،
وغياب استمرار سجل تثبيت marketplace، وترحيل بيانات تعريف الإعدادات
أثناء `plugins update`. قد تحذّر حزمة `2026.4.26` المنشورة
من ملفات ختم بيانات تعريف البناء المحلي التي شُحنت بالفعل. يجب أن تفي الحزم اللاحقة
بعقود الحزم الحديثة؛ وتفشل الفجوات نفسها تحقق الإصدار.

استخدم ملفات Package Acceptance الشخصية الأوسع عندما يكون سؤال الإصدار متعلقًا
بحزمة قابلة للتثبيت فعليًا:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

ملفات الحزم الشخصية الشائعة:

- `smoke`: مسارات تثبيت الحزمة/القناة/الوكيل السريعة، وشبكة Gateway، وإعادة تحميل الإعدادات
- `package`: عقود حزمة التثبيت/التحديث/إعادة التشغيل/Plugin بالإضافة إلى إثبات تثبيت مهارة ClawHub المباشر؛ هذا هو الافتراضي لفحص الإصدار
- `product`: ‏`package` بالإضافة إلى قنوات MCP، وتنظيف cron/subagent، وبحث ويب OpenAI، وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لإعادات التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعّل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في Package Acceptance. يمرر Workflow ملف tarball
المحلول `package-under-test` إلى مسار Telegram؛ ولا يزال Workflow المستقل
لـ Telegram يقبل مواصفة npm منشورة لفحوص ما بعد النشر.

## أتمتة نشر الإصدار العادي

بالنسبة إلى beta و`latest` وPlugin وGitHub Release ونشر المنصة،
يكون `OpenClaw Release Publish` نقطة الدخول التغييرية العادية. لا يستخدم مسار
npm فقط الشهري extended-stable `.33+` هذا المنسّق. ينسّق Workflow العادي
Workflows الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. اسحب وسم الإصدار وحل SHA الخاص بالتزامه.
2. تحقق من أن الوسم قابل للوصول من `main` أو `release/*`.
3. شغّل `pnpm plugins:sync:check`.
4. أرسل `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. أرسل `Plugin ClawHub Release` بالنطاق وSHA نفسيهما.
6. أرسل `OpenClaw NPM Release` مع وسم الإصدار ووسم npm dist-tag و
   `preflight_run_id` المحفوظ بعد التحقق من
   `full_release_validation_run_id` المحفوظ.
7. للإصدارات المستقرة، أنشئ GitHub release أو حدّثه كمسودة، وأرسل
   `Windows Node Release` مع `windows_node_tag` الصريح و
   `windows_node_installer_digests` المعتمدة للمرشح، وتحقق من أصول
   المثبّت/المجموع الاختباري المعيارية قبل نشر المسودة.

مثال نشر beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

نشر مستقر إلى وسم dist-tag الافتراضي beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

الترقية المستقرة مباشرة إلى `latest` صريحة:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

استخدم Workflows ذات المستوى الأدنى `Plugin NPM Release` و`Plugin ClawHub Release`
فقط لأعمال الإصلاح أو إعادة النشر المركزة. يرفض `OpenClaw Release Publish`
القيمة `plugin_publish_scope=selected` عندما تكون `publish_openclaw_npm=true` حتى لا يمكن أن تُشحن الحزمة الأساسية
دون كل Plugin رسمي قابل للنشر، بما في ذلك
`@openclaw/diffs-language-pack`. لإصلاح Plugin محدد، اضبط
`publish_openclaw_npm=false` مع `plugin_publish_scope=selected` و
`plugins=@openclaw/name`، أو أرسل Workflow الفرعي مباشرة.

## مدخلات Workflow لـ NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغّل:

- `tag`: وسم الإصدار المطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ عندما تكون `preflight_only=true`، يمكن أن يكون أيضًا
  SHA الالتزام الكامل الحالي المكوّن من 40 حرفًا لفرع Workflow لتمهيد تحقق فقط
- `preflight_only`: ‏`true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى يعيد Workflow استخدام
  ملف tarball المحضّر من تشغيل التمهيد الناجح
- `full_release_validation_run_id`: مطلوب للنشر الحقيقي الشهري extended-stable والعادي
  غير beta حتى يصادق Workflow على تشغيل التحقق الدقيق
- `npm_dist_tag`: وسم npm الهدف لمسار النشر؛ يقبل `alpha` أو `beta` أو
  `latest` أو `extended-stable` ويكون افتراضيًا `beta`. يجب أن تستخدم الرقعة النهائية `33` وما بعدها
  `extended-stable`؛ افتراضيًا، يرفض `extended-stable` الرقع الأقدم، ويرفض دائمًا
  الوسوم غير النهائية.
- `bypass_extended_stable_guard`: قيمة منطقية للاختبار فقط، افتراضيها `false`؛ مع
  `npm_dist_tag=extended-stable`، تتجاوز أهلية extended-stable الشهرية مع الحفاظ على
  هوية الإصدار والأثر والموافقة وفحوص القراءة الراجعة.

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم بها المشغّل:

- `tag`: وسم الإصدار المطلوب؛ يجب أن يكون موجودًا بالفعل
- `preflight_run_id`: معرّف تشغيل تمهيد `OpenClaw NPM Release` الناجح؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `full_release_validation_run_id`: معرّف تشغيل `Full Release Validation` الناجح؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `windows_node_tag`: وسم إصدار `openclaw/openclaw-windows-node`
  الدقيق غير التمهيدي؛ مطلوب لنشر OpenClaw مستقر
- `windows_node_installer_digests`: خريطة JSON مضغوطة معتمدة للمرشح لأسماء
  مثبّت Windows الحالية إلى بصمات `sha256:` المثبتة؛ مطلوبة
  لنشر OpenClaw مستقر
- `npm_dist_tag`: وسم npm الهدف لحزمة OpenClaw
- `plugin_publish_scope`: افتراضيه `all-publishable`؛ استخدم `selected` فقط
  لأعمال إصلاح Plugin فقط مركزة مع `publish_openclaw_npm=false`
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: افتراضيه `true`؛ اضبطه إلى `false` فقط عند استخدام
  Workflow كمنسّق إصلاح Plugin فقط
- `wait_for_clawhub`: افتراضيه `false` حتى لا يُحظر توفر npm بواسطة
  ClawHub sidecar؛ اضبطه إلى `true` فقط عندما يجب أن يتضمن اكتمال Workflow
  اكتمال ClawHub

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغّل:

- `ref`: فرع أو وسم أو SHA التزام كامل للتحقق منه. تتطلب الفحوص الحاملة للأسرار
  أن يكون الالتزام المحلول قابلًا للوصول من فرع OpenClaw أو
  وسم إصدار.
- `run_release_soak`: فعّل soak شاملًا مباشرًا/E2E، ومسار إصدار Docker،
  وsoak لكل upgrade-survivor منذ البداية لفحوص إصدار beta. يُفرض تشغيله بواسطة
  `release_profile=stable` و`release_profile=full`.

القواعد:

- يمكن للإصدارات النهائية العادية وإصدارات التصحيح الأقل من الرقعة `33` النشر إلى
  `beta` أو `latest`. يجب أن تُنشر الإصدارات النهائية عند الرقعة `33` أو أعلى إلى
  `extended-stable`، وتُرفض إصدارات لاحقة التصحيح عند هذا الحد.
- يمكن لوسوم الإصدار التمهيدي beta النشر فقط إلى `beta`
- بالنسبة إلى `OpenClaw NPM Release`، يُسمح بإدخال SHA الالتزام الكامل فقط عندما
  تكون `preflight_only=true`
- يكون `OpenClaw Release Checks` و`Full Release Validation` دائمًا
  للتحقق فقط
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء التمهيد؛
  يتحقق Workflow من استمرار تلك البيانات الوصفية قبل النشر

## تسلسل إصدار beta/latest المستقر العادي

هذا التسلسل القديم مخصص للإصدار المنسّق العادي الذي يملك أيضًا
Plugins وGitHub Release وWindows وأعمال منصات أخرى. إنه ليس
مسار npm فقط الشهري extended-stable `.33+` الموثق في أعلى هذه الصفحة.

عند قطع إصدار مستقر منسّق عادي:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الحالي والكامل لالتزام فرع سير العمل
     لتشغيل تجريبي للتحقق فقط من سير عمل الفحص المسبق
2. اختر `npm_dist_tag=beta` للمسار العادي الذي يبدأ بإصدار beta، أو `latest` فقط
   عندما تريد عمدًا نشرًا مستقرًا مباشرًا
3. شغّل `Full Release Validation` على فرع الإصدار، أو وسم الإصدار، أو SHA الكامل
   للالتزام عندما تريد CI العادي مع تغطية ذاكرة التخزين المؤقت للمطالبات الحية، وDocker، وQA Lab،
   وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمدًا إلى مخطط الاختبار العادي الحتمي فقط، فشغّل
   سير عمل `CI` اليدوي على مرجع الإصدار بدلًا من ذلك
5. حدّد وسم الإصدار غير التمهيدي الدقيق `openclaw/openclaw-windows-node`
   الذي يجب شحن مثبتاته الموقعة لـ x64 وARM64. احفظه باسم
   `windows_node_tag`، واحفظ خريطة الملخصات المتحقق منها الخاصة بها باسم
   `windows_node_installer_digests`. يسجل مساعد مرشح الإصدار كليهما
   ويضمّنهما في أمر النشر الذي ينشئه.
6. احفظ `preflight_run_id` و`full_release_validation_run_id` الناجحين
7. شغّل `OpenClaw Release Publish` مع نفس `tag`، ونفس `npm_dist_tag`،
   و`windows_node_tag` المحدد، و`windows_node_installer_digests` المحفوظة له،
   و`preflight_run_id` المحفوظ، و`full_release_validation_run_id` المحفوظ؛
   ينشر ذلك الـ plugins الخارجية إلى npm وClawHub قبل ترقية
   حزمة OpenClaw على npm
8. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية تلك النسخة المستقرة من `beta` إلى `latest`
9. إذا نُشر الإصدار عمدًا مباشرة إلى `latest` وكان ينبغي أن يتبع `beta`
   نفس البناء المستقر فورًا، فاستخدم سير عمل الإصدار نفسه
   لتوجيه كلا وسمي التوزيع إلى النسخة المستقرة، أو دع مزامنة الإصلاح الذاتي المجدولة
   تنقل `beta` لاحقًا

يوجد تعديل وسم التوزيع في مستودع سجل الإصدار لأنه لا يزال يتطلب
`NPM_TOKEN`، بينما يحتفظ مستودع المصدر بالنشر المعتمد على OIDC فقط.

يبقي ذلك مسار النشر المباشر ومسار الترقية الذي يبدأ بإصدار beta
موثقين ومرئيين للمشغل.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر
CLI الخاصة بـ 1Password (`op`) داخل جلسة tmux مخصصة فقط. لا تستدعِ `op`
مباشرة من صدفة الوكيل الرئيسية؛ فإبقاؤه داخل tmux يجعل المطالبات،
والتنبيهات، ومعالجة OTP قابلة للملاحظة ويمنع تكرار تنبيهات المضيف.

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
