---
read_when:
    - البحث عن تعريفات قنوات الإصدار العامة
    - تشغيل التحقق من الإصدار أو قبول الحزمة
    - البحث عن تسمية الإصدارات ووتيرة الإصدار
summary: مسارات الإصدار، وقائمة تحقق المشغّل، ومربعات التحقق، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-06-27T18:29:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- المستقر: إصدارات موسومة تنشر إلى npm `beta` افتراضياً، أو إلى npm `latest` عند طلب ذلك صراحة
- بيتا: وسوم إصدارات تمهيدية تنشر إلى npm `beta`
- التطوير: رأس `main` المتحرك

## تسمية الإصدارات

- إصدار الإطلاق المستقر: `YYYY.M.PATCH`
  - وسم Git: `vYYYY.M.PATCH`
- إصدار التصحيح المستقر: `YYYY.M.PATCH-N`
  - وسم Git: `vYYYY.M.PATCH-N`
- إصدار بيتا التمهيدي: `YYYY.M.PATCH-beta.N`
  - وسم Git: `vYYYY.M.PATCH-beta.N`
- لا تضف أصفاراً بادئة إلى الشهر أو التصحيح
- بدءاً من تحديث عملية إصدار يونيو 2026، يكون المكون الثالث رقم
  قطار إصدار شهرياً تسلسلياً، وليس يوماً تقويمياً. تحدد الإصدارات المستقرة وبيتا
  القطار الحالي؛ ولا تستهلك وسوم ألفا فقط رقم تصحيح بيتا/المستقر ولا
  تقدمه. تحتفظ الوسوم وإصدارات npm السابقة للتحديث بأسمائها الحالية وتبقى
  صالحة؛ وتواصل أتمتة الإصدار مقارنتها حسب السنة والشهر والتصحيح والقناة ورقم
  الإصدار التمهيدي أو التصحيح.
- تستخدم إصدارات ألفا/الليلية قطار التصحيح التالي غير المُصدر وتزيد فقط
  `alpha.N` للإصدارات المتكررة. بمجرد أن يحصل ذلك التصحيح على بيتا، تنتقل
  إصدارات ألفا الجديدة إلى التصحيح التالي. تجاهل وسوم ألفا فقط القديمة ذات
  أرقام التصحيح الأعلى عند اختيار قطار بيتا أو مستقر.
- إصدارات npm غير قابلة للتغيير. إذا نُشر وسم بيتا بالفعل، فلا
  تحذفه أو تعيد نشره أو تعيد استخدامه؛ اقطع رقم بيتا التالي أو التصحيح الشهري
  التالي بدلاً من ذلك. لأن `2026.6.5-beta.1` نُشر بالفعل أثناء
  الانتقال، يجب أن تستخدم قطارات إصدار يونيو 2026 التصحيح `5` أو أعلى. لا
  تنشر قطارات مستقرة أو بيتا جديدة ليونيو 2026 باسم `2026.6.2` أو `2026.6.3` أو
  `2026.6.4`.
- بعد المستقر `2026.6.5`، يكون قطار بيتا الجديد التالي هو `2026.6.6-beta.1`، حتى
  إذا كانت وسوم ألفا فقط الآلية ذات أرقام تصحيح أعلى موجودة بالفعل.
- يعني `latest` إصدار npm المستقر المرقّى الحالي
- يعني `beta` هدف تثبيت بيتا الحالي
- تنشر الإصدارات المستقرة وإصدارات التصحيح المستقر إلى npm `beta` افتراضياً؛ يمكن لمشغلي الإصدار استهداف `latest` صراحة، أو ترقية إصدار بيتا مُدقق لاحقاً
- يشحن كل إصدار OpenClaw مستقر حزمة npm وتطبيق macOS ومثبتات Windows Hub
  الموقعة معاً؛ تتحقق إصدارات بيتا عادةً من مسار npm/الحزمة وتنشره أولاً، مع
  حجز بناء/توقيع/توثيق/ترقية التطبيق الأصلي للإصدارات المستقرة ما لم يُطلب ذلك صراحة

## وتيرة الإصدار

- تتحرك الإصدارات ببيتا أولاً
- لا يتبع المستقر إلا بعد التحقق من أحدث بيتا
- يقطع المشرفون عادةً الإصدارات من فرع `release/YYYY.M.PATCH` مُنشأ
  من `main` الحالي، حتى لا تمنع عملية التحقق من الإصدار وإصلاحاته التطوير الجديد
  على `main`
- إذا دُفع وسم بيتا أو نُشر وكان يحتاج إلى إصلاح، يقطع المشرفون
  وسم `-beta.N` التالي بدلاً من حذف وسم بيتا القديم أو إعادة إنشائه
- إجراءات الإصدار التفصيلية والموافقات وبيانات الاعتماد وملاحظات الاسترداد
  خاصة بالمشرفين فقط

## قائمة تحقق مشغل الإصدار

هذه القائمة هي الشكل العام لتدفق الإصدار. تبقى بيانات الاعتماد الخاصة
والتوقيع والتوثيق واسترداد dist-tag وتفاصيل التراجع الطارئ في
دليل تشغيل الإصدار الخاص بالمشرفين فقط.

1. ابدأ من `main` الحالي: اسحب الأحدث، وتأكد من أن الالتزام الهدف مدفوع،
   وتأكد من أن CI الحالي على `main` أخضر بما يكفي للتفرع منه.
2. أنشئ قسم `CHANGELOG.md` الأعلى من PRs المدمجة وكل الالتزامات المباشرة
   منذ آخر وسم إصدار قابل للوصول. اجعل الإدخالات موجهة للمستخدم،
   وأزل تكرار إدخالات PR/الالتزام المباشر المتداخلة، والتزم إعادة الكتابة، وادفعها،
   ثم أعد rebase/السحب مرة أخرى قبل التفرع.
3. راجع سجلات توافق الإصدار في
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts`. أزل التوافق المنتهي
   فقط عندما يبقى مسار الترقية مغطى، أو سجّل سبب حمله
   عمداً.
4. أنشئ `release/YYYY.M.PATCH` من `main` الحالي؛ لا تنفذ عمل الإصدار العادي
   مباشرة على `main`.
5. ارفع كل موقع إصدار مطلوب للوسم المقصود، ثم شغّل
   `pnpm release:prep`. يحدّث ذلك إصدارات Plugin وجرد Plugin ومخطط
   الإعدادات وبيانات تعريف إعدادات القناة المضمنة وخط أساس وثائق الإعدادات وصادرات Plugin SDK
   وخط أساس API الخاص بـ Plugin SDK بالترتيب الصحيح. التزم أي انحراف
   مولّد قبل الوسم. ثم شغّل الفحص المحلي الحتمي:
   `pnpm check:test-types` و`pnpm check:architecture` و
   `pnpm build && pnpm ui:build` و`pnpm release:check`.
6. شغّل `OpenClaw NPM Release` مع `preflight_only=true`. قبل وجود وسم،
   يُسمح بـ SHA كامل من 40 محرفاً لفرع الإصدار للتحقق فقط
   في الفحص التمهيدي. ينشئ الفحص التمهيدي دليل إصدار التبعيات للرسم البياني
   للتبعيات المسحوب بالضبط ويخزنه في أثر فحص npm التمهيدي.
   احفظ `preflight_run_id` الناجح.
7. ابدأ كل اختبارات ما قبل الإصدار باستخدام `Full Release Validation` لفرع
   الإصدار أو الوسم أو SHA الالتزام الكامل. هذه هي نقطة الإدخال اليدوية الوحيدة
   لصناديق اختبار الإصدار الأربعة الكبيرة: Vitest وDocker وQA Lab وPackage.
8. إذا فشل التحقق، أصلح على فرع الإصدار وأعد تشغيل أصغر
   ملف أو مسار أو مهمة workflow أو ملف تعريف حزمة أو مزود أو قائمة سماح نموذج
   فاشلة تثبت الإصلاح. أعد تشغيل المظلة الكاملة فقط عندما يجعل السطح المتغير
   الدليل السابق قديماً.
9. لمرشح بيتا موسوم، شغّل
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` من فرع
   `release/YYYY.M.PATCH` المطابق. للمستقر، مرر إصدار مصدر Windows المطلوب
   أيضاً:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   يشغّل المساعد فحوصات الإصدار المحلي المولّد، ويرسل أو يتحقق
   من دليل التحقق الكامل من الإصدار وفحص npm التمهيدي، ويشغّل إثبات Parallels
   الجديد/التحديث مقابل الأرشيف المحضر بالضبط بالإضافة إلى إثبات حزمة Telegram،
   ويسجل خطط npm الخاصة بـ Plugin وClawHub، ويطبع أمر
   `OpenClaw Release Publish` الدقيق فقط بعد أن تصبح حزمة الأدلة خضراء.
   يرسل `OpenClaw Release Publish` حزم Plugin المحددة أو القابلة للنشر كلها
   إلى npm والمجموعة نفسها إلى ClawHub بالتوازي، ثم يرقّي
   أثر فحص OpenClaw npm التمهيدي المحضر مع dist-tag المطابق بمجرد
   نجاح نشر Plugin على npm.
   بعد نجاح ابن نشر OpenClaw على npm، ينشئ أو يحدّث صفحة
   إصدار/إصدار تمهيدي GitHub المطابقة من قسم `CHANGELOG.md` المطابق الكامل.
   تصبح الإصدارات المستقرة المنشورة إلى npm `latest` أحدث إصدار GitHub؛ أما
   إصدارات الصيانة المستقرة التي تُبقى على npm `beta` فتُنشأ مع
   GitHub `latest=false`. يرفع workflow أيضاً دليل التبعيات للفحص التمهيدي
   وبيان التحقق الكامل ودليل التحقق من السجل بعد النشر إلى إصدار GitHub
   للاستجابة لحوادث ما بعد الإصدار. يطبع workflow النشر معرفات التشغيل
   التابعة فوراً، ويوافق تلقائياً على بوابات بيئة الإصدار التي يُسمح لرمز workflow
   بالموافقة عليها، ويلخص المهام التابعة الفاشلة مع أواخر السجلات، وينهي
   إصدار GitHub ودليل التبعيات بمجرد نجاح نشر OpenClaw على npm،
   وينتظر ClawHub كلما كان OpenClaw npm يُنشر، ثم يشغّل
   `pnpm release:verify-beta` ويرفع دليل ما بعد النشر لإصدار GitHub وحزمة npm
   وحزم Plugin npm المحددة وحزم ClawHub المحددة ومعرفات تشغيل workflow التابعة
   ومعرف تشغيل NPM Telegram الاختياري. يعيد مسار ClawHub محاولة إخفاقات تثبيت
   تبعيات CLI العابرة، وينشر Plugins التي نجح معاينتها حتى عندما تتعثر خلية
   معاينة واحدة، وينتهي بالتحقق من السجل لكل إصدار Plugin متوقع بحيث تبقى
   عمليات النشر الجزئية مرئية وقابلة لإعادة المحاولة. ثم شغّل قبول الحزمة بعد النشر
   مقابل حزمة
   `openclaw@YYYY.M.PATCH-beta.N` أو
   `openclaw@beta` المنشورة. إذا احتاج إصدار تمهيدي مدفوع أو منشور إلى إصلاح،
   فاقطع رقم الإصدار التمهيدي المطابق التالي؛ لا تحذف الإصدار التمهيدي القديم
   أو تعيد كتابته.
10. للمستقر، تابع فقط بعد أن تمتلك بيتا أو مرشح الإصدار المُدقق
    دليل التحقق المطلوب. يمر نشر npm المستقر أيضاً عبر
    `OpenClaw Release Publish`، مع إعادة استخدام أثر الفحص التمهيدي الناجح عبر
    `preflight_run_id`؛ وتتطلب جاهزية إصدار macOS المستقر أيضاً وجود
    `.zip` و`.dmg` و`.dSYM.zip` المعبأة و`appcast.xml` المحدّث على `main`.
    ينشر workflow نشر macOS appcast الموقّع إلى `main` العام
    تلقائياً بعد التحقق من أصول الإصدار؛ إذا منعت حماية الفرع
    الدفع المباشر، فإنه يفتح أو يحدّث PR لـ appcast. تتطلب جاهزية Windows Hub
    المستقرة أصول `OpenClawCompanion-Setup-x64.exe` و
    `OpenClawCompanion-Setup-arm64.exe` و
    `OpenClawCompanion-SHA256SUMS.txt` الموقعة على إصدار OpenClaw في GitHub.
    مرر وسم إصدار `openclaw/openclaw-windows-node` الموقّع الدقيق كـ
    `windows_node_tag` وخريطة بصمات المثبتات المعتمدة للمرشح الخاصة به كـ
    `windows_node_installer_digests`؛ يحافظ `OpenClaw Release Publish` على
    مسودة الإصدار، ويرسل `Windows Node Release`، ويتحقق من الأصول الثلاثة كلها
    قبل النشر.
11. بعد النشر، شغّل متحقق npm بعد النشر، وE2E Telegram الاختياري
    لحزمة npm المنشورة المستقلة عندما تحتاج إلى إثبات قناة بعد النشر،
    وترقية dist-tag عند الحاجة، وتحقق من صفحة إصدار GitHub المولدة،
    وشغّل خطوات إعلان الإصدار، ثم أكمل [إغلاق main المستقر](#stable-main-closeout)
    قبل اعتبار الإصدار المستقر منتهياً.

## إغلاق main المستقر

لا يكتمل النشر المستقر حتى يحمل `main` حالة الإصدار المشحون
الفعلية.

1. ابدأ من أحدث `main` جديد. دقّق `release/YYYY.M.PATCH` مقابله، وانقل إلى الأمام الإصلاحات الحقيقية الغائبة عن `main`. لا تدمج عشوائيًا محولات التوافق أو الاختبار أو التحقق الخاصة بالإصدار فقط في `main` الأحدث.
2. اضبط `main` على النسخة المستقرة المشحونة، وليس مسارًا تاليًا افتراضيًا. شغّل `pnpm release:prep` بعد تغيير نسخة الجذر، ثم
   `pnpm deps:shrinkwrap:generate`.
3. اجعل قسم `## YYYY.M.PATCH` في `CHANGELOG.md` على `main` مطابقًا تمامًا لفرع الإصدار ذي الوسم. ضمّن تحديث `appcast.xml` المستقر عندما يكون إصدار mac قد نشر واحدًا.
4. لا تضف `YYYY.M.PATCH+1`، أو نسخة بيتا، أو قسم سجل تغييرات مستقبليًا فارغًا إلى `main` حتى يبدأ المشغّل مسار الإصدار هذا صراحةً.
5. شغّل `pnpm release:generated:check`، و`pnpm deps:shrinkwrap:check`، و
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. ادفع التغييرات، ثم تحقق من أن `origin/main` يحتوي على النسخة المشحونة وسجل التغييرات قبل اعتبار الإصدار المستقر منجزًا.
6. أبقِ متغيرَي المستودع `RELEASE_ROLLBACK_DRILL_ID` و
   `RELEASE_ROLLBACK_DRILL_DATE` محدّثين بعد كل تمرين تراجع خاص.
   يبدأ `OpenClaw Stable Main Closeout` من دفعة `main` التي تحمل النسخة المشحونة وسجل التغييرات وappcast بعد النشر المستقر. يقرأ أدلة ما بعد النشر غير القابلة للتغيير لربط الوسم المشحون بتشغيلَي التحقق الكامل من الإصدار والنشر، ثم يتحقق من حالة `main` المستقرة، والإصدار، وفترة الاستقرار المستقرة الإلزامية، وأدلة الأداء الحاجبة. يرفق بيان إغلاق غير قابل للتغيير ومجموع تحقق بإصدار GitHub. يتخطى مشغّل الدفع التلقائي الإصدارات القديمة التي تسبق أدلة ما بعد النشر غير القابلة للتغيير؛ ولا يعتبر ذلك التخطي أبدًا إغلاقًا مكتملًا. يتطلب الإغلاق الكامل كلًا من الأصول ومجموع تحقق مطابق. يعيد البيان الجزئي تشغيل SHA المسجل لـ`main` وتمرين التراجع لإعادة توليد بايتات مطابقة، ثم يرفق مجموع التحقق المفقود؛ وتبقى أي زوجية غير صالحة، أو مجموع تحقق بلا بيان، حاجبة. يتخطى التشغيل الناتج عن الدفع من دون متغيرات مستودع تمرين التراجع من دون إكمال الإغلاق؛ كما أن سجل التمرين المفقود أو الأقدم من 90 يومًا يظل يحجب الإغلاق اليدوي المدعوم بالأدلة. تبقى أوامر الاسترداد الخاصة في دليل التشغيل المخصص للمشرفين فقط.
   استخدم التشغيل اليدوي فقط لإصلاح أو إعادة تشغيل إغلاق مستقر مدعوم بالأدلة.
   يجوز لوسم تصحيح احتياطي قديم إعادة استخدام أدلة الحزمة الأساسية فقط عندما يحل وسم التصحيح إلى التزام المصدر نفسه مثل وسم المستقر الأساسي.
   أما التصحيح ذو المصدر المختلف فيجب أن ينشر ويتحقق من أدلة الحزمة الخاصة به.

## الفحص المسبق للإصدار

- شغّل `pnpm check:test-types` قبل فحص ما قبل الإصدار حتى يظل TypeScript الخاص بالاختبارات
  مشمولاً خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل فحص ما قبل الإصدار حتى تكون فحوصات دورات
  الاستيراد الأوسع وحدود البنية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى توجد عناصر
  إصدار `dist/*` المتوقعة وحزمة Control UI لخطوة التحقق من الحزمة
- شغّل `pnpm release:prep` بعد رفع إصدار الجذر وقبل وضع الوسم. يشغّل
  كل مولد إصدار حتمي ينجرف عادة بعد تغيير إصدار/إعداد/API: إصدارات plugin،
  ومخزون plugin، ومخطط الإعداد الأساسي، وبيانات تعريف إعداد القنوات المضمنة،
  وخط أساس وثائق الإعداد، وتصديرات plugin SDK، وخط أساس API الخاص بـ plugin SDK.
  يعيد `pnpm release:check` تشغيل تلك الحراس في وضع الفحص ويبلغ عن كل إخفاق
  انجراف مولد يجده في مرور واحد قبل تشغيل فحوصات إصدار الحزمة.
- يحدّث تزامن إصدار Plugin إصدارات حزم plugin الرسمية وحدود
  `openclaw.compat.pluginApi` الموجودة إلى إصدار OpenClaw افتراضياً.
  تعامل مع هذا الحقل على أنه حد API الأدنى لـ plugin SDK/runtime API، وليس مجرد نسخة
  من إصدار الحزمة: بالنسبة إلى إصدارات plugin فقط التي تبقى عمداً متوافقة
  مع مضيفي OpenClaw الأقدم، أبقِ الحد عند أقدم API مضيف مدعوم
  ووثق هذا الاختيار في إثبات إصدار plugin.
- شغّل سير عمل `Full Release Validation` اليدوي قبل اعتماد الإصدار لبدء
  كل صناديق اختبار ما قبل الإصدار من نقطة دخول واحدة. يقبل فرعاً أو وسماً
  أو SHA التزام كاملاً، ويرسل `CI` اليدوي، ويرسل
  `OpenClaw Release Checks` لفحص التثبيت السريع، وقبول الحزمة، وفحوصات الحزمة
  عبر أنظمة التشغيل، وتكافؤ QA Lab، ومسارات Matrix وTelegram. تتضمن عمليات
  stable والكاملة دائماً live/E2E شاملة واختبار تحمل مسار إصدار Docker؛
  يُحتفظ بـ `run_release_soak=true` لاختبار تحمل beta صريح. يوفر Package
  Acceptance اختبار Telegram E2E للحزمة المرجعي أثناء التحقق من المرشح،
  متجنباً مشغّل استطلاع live ثانياً متزامناً.
  قدّم `release_package_spec` بعد نشر beta لإعادة استخدام حزمة npm المشحونة
  عبر فحوصات الإصدار، وPackage Acceptance، وTelegram E2E للحزمة دون إعادة بناء
  أرشيف الإصدار. قدّم `npm_telegram_package_spec` فقط عندما يجب أن يستخدم
  Telegram حزمة منشورة مختلفة عن بقية تحقق الإصدار. قدّم
  `package_acceptance_package_spec` عندما يجب أن يستخدم Package Acceptance
  حزمة منشورة مختلفة عن مواصفة حزمة الإصدار. قدّم
  `evidence_package_spec` عندما يجب أن يثبت تقرير أدلة الإصدار أن التحقق
  يطابق حزمة npm منشورة دون فرض Telegram E2E.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- شغّل سير عمل `Package Acceptance` اليدوي عندما تريد إثباتاً جانبياً
  لمرشح حزمة بينما يستمر عمل الإصدار. استخدم `source=npm` لـ
  `openclaw@beta` أو `openclaw@latest` أو إصدار محدد تماماً؛ و`source=ref`
  لحزم فرع/وسم/SHA موثوق في `package_ref` باستخدام حاضنة `workflow_ref`
  الحالية؛ و`source=url` لأرشيف HTTPS عام مع SHA-256 مطلوب وسياسة URL عامة
  صارمة؛ و`source=trusted-url` لسياسة مصدر موثوق مسماة تستخدم
  `trusted_source_id` وSHA-256 المطلوبين؛ أو `source=artifact` لأرشيف رفعته
  عملية GitHub Actions أخرى. يحل سير العمل المرشح إلى
  `package-under-test`، ويعيد استخدام مجدول إصدار Docker E2E ضد ذلك الأرشيف،
  ويمكنه تشغيل QA الخاص بـ Telegram ضد الأرشيف نفسه مع
  `telegram_mode=mock-openai` أو `telegram_mode=live-frontier`. عندما تتضمن
  مسارات Docker المختارة `published-upgrade-survivor`، يكون أثر الحزمة هو
  المرشح ويختار `published_upgrade_survivor_baseline` خط الأساس المنشور.
  يستخدم `update-restart-auth` حزمة المرشح بوصفها CLI المثبتة والحزمة قيد
  الاختبار معاً حتى يمرّن مسار إعادة التشغيل المدار لأمر تحديث المرشح.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  ملفات التعريف الشائعة:
  - `smoke`: مسارات التثبيت/القناة/الوكيل، وشبكة Gateway، وإعادة تحميل الإعداد
  - `package`: مسارات الحزمة/التحديث/إعادة التشغيل/plugin الأصلية للأثر دون OpenWebUI أو ClawHub live
  - `product`: ملف تعريف الحزمة إضافة إلى قنوات MCP، وتنظيف cron/subagent،
    وبحث OpenAI على الويب، وOpenWebUI
  - `full`: أجزاء مسار إصدار Docker مع OpenWebUI
  - `custom`: اختيار `docker_lanes` دقيق لإعادة تشغيل مركزة
- شغّل سير عمل `CI` اليدوي مباشرة عندما تحتاج فقط إلى تغطية CI عادية
  حتمية لمرشح الإصدار. تتجاوز إرسالات CI اليدوية النطاق المتغير وتفرض
  أجزاء Linux Node، وأجزاء plugin المضمنة، وأجزاء عقود plugin والقنوات،
  وتوافق Node 22، و`check-*`، و`check-additional-*`، وفحوصات smoke للأثر
  المبني، وفحوصات الوثائق، وPython skills، وWindows، وmacOS، ومسارات i18n
  الخاصة بـ Control UI. تشغّل عمليات CI اليدوية المستقلة Android فقط عند
  إرسالها مع `include_android=true`؛ يمرر `Full Release Validation` ذلك الإدخال
  إلى ابن CI الخاص به.
  مثال مع Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- شغّل `pnpm qa:otel:smoke` عند التحقق من قياسات الإصدار. يمرّن
  QA-lab عبر مستقبل OTLP/HTTP محلي ويتحقق من تصدير الآثار والمقاييس والسجلات
  إضافة إلى سمات أثر محدودة وتنقيح المحتوى/المعرفات دون الحاجة إلى Opik أو
  Langfuse أو جامع خارجي آخر.
- شغّل `pnpm qa:otel:collector-smoke` عند التحقق من توافق الجامع.
  يوجّه تصدير OTLP نفسه من QA-lab عبر حاوية Docker حقيقية لـ OpenTelemetry
  Collector قبل تأكيدات المستقبل المحلي.
- شغّل `pnpm qa:prometheus:smoke` عند التحقق من scraping المحمي لـ Prometheus.
  يمرّن QA-lab، ويرفض scrapes غير المصادق عليها، ويتحقق من بقاء عائلات
  المقاييس الحرجة للإصدار خالية من محتوى المطالبات والمعرفات الخام ورموز
  المصادقة والمسارات المحلية.
- شغّل `pnpm qa:observability:smoke` عندما تريد مسارات smoke الخاصة بـ
  OpenTelemetry وPrometheus في checkout المصدر بالتتابع.
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- ينشئ فحص `OpenClaw NPM Release` المسبق أدلة إصدار التبعيات قبل
  أن يحزم أرشيف npm. بوابة ثغرات إرشادات npm مانعة للإصدار. أما مخاطر
  البيان الانتقالية، وسطح ملكية/تثبيت التبعيات، وتقارير تغيّر التبعيات
  فهي أدلة إصدار فقط. يقارن تقرير تغيّر التبعيات مرشح الإصدار بوسم الإصدار
  السابق القابل للوصول.
- يرفع الفحص المسبق أدلة التبعيات باسم
  `openclaw-release-dependency-evidence-<tag>` ويدمجها أيضاً تحت
  `dependency-evidence/` داخل أثر فحص npm المسبق المُعد. يعيد مسار النشر
  الحقيقي استخدام أثر الفحص المسبق ذاك، ثم يرفق الأدلة نفسها بإصدار GitHub
  باسم `openclaw-<version>-dependency-evidence.zip`.
- شغّل `OpenClaw Release Publish` لتسلسل النشر المتغير بعد وجود الوسم.
  أرسله من `release/YYYY.M.PATCH` (أو `main` عند نشر وسم قابل للوصول من main)،
  ومرر وسم الإصدار، و`preflight_run_id` ناجحاً لـ OpenClaw npm،
  و`full_release_validation_run_id` ناجحاً، وأبقِ نطاق نشر plugin الافتراضي
  `all-publishable` ما لم تكن تشغّل إصلاحاً مركزاً عمداً. يسلسل سير العمل
  نشر plugin إلى npm، ونشر plugin إلى ClawHub، ونشر OpenClaw إلى npm حتى لا
  تُنشر الحزمة الأساسية قبل plugin الخارجية الخاصة بها.
- يتطلب `OpenClaw Release Publish` المستقر `windows_node_tag` دقيقاً بعد
  وجود إصدار `openclaw/openclaw-windows-node` غير تمهيدي مطابق. ويتطلب أيضاً
  خريطة `windows_node_installer_digests` المعتمدة للمرشح. قبل إرسال أي ابن
  نشر، يتحقق من أن إصدار المصدر منشور، وغير تمهيدي، ويحتوي مثبتات x64/ARM64
  المطلوبة، ولا يزال يطابق تلك الخريطة المعتمدة. ثم يرسل `Windows Node Release`
  بينما لا يزال إصدار OpenClaw مسودة، حاملاً خريطة ملخصات المثبت المثبتة دون
  تغيير. ينزّل سير العمل الابن مثبتات Windows Hub الموقعة من ذلك الوسم الدقيق،
  ويطابقها مع الملخصات المثبتة، ويتحقق من أن توقيعات Authenticode الخاصة بها
  تستخدم موقّع OpenClaw Foundation المتوقع على مشغل Windows، ويكتب بيان
  SHA-256، ويرفع المثبتات والبيان إلى إصدار OpenClaw GitHub المرجعي، ثم يعيد
  تنزيل الأصول التي تمت ترقيتها ويتحقق من عضوية البيان والهاشات. يتحقق الأصل
  من عقد أصول x64 وARM64 والمجموع الاختباري الحالي قبل النشر. يرفض الاسترداد
  المباشر أسماء أصول `OpenClawCompanion-*` غير المتوقعة قبل استبدال أصول
  العقد المتوقعة ببايتات المصدر المثبتة. أرسل `Windows Node Release` يدوياً
  للاسترداد فقط، ومرر دائماً وسماً دقيقاً، وليس `latest` أبداً، إضافة إلى
  خريطة JSON الصريحة `expected_installer_digests` من إصدار المصدر المعتمد.
  يجب أن تستهدف روابط تنزيل الموقع URLs أصول إصدار OpenClaw الدقيقة للإصدار
  المستقر الحالي، أو `releases/latest/download/...` فقط بعد التحقق من أن
  إعادة توجيه GitHub الأحدث تشير إلى الإصدار نفسه؛ لا تربط فقط بصفحة إصدار
  مستودع companion.
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يشغّل `OpenClaw Release Checks` أيضاً مسار تكافؤ mock الخاص بـ QA Lab إضافة
  إلى ملف تعريف Matrix live السريع ومسار QA الخاص بـ Telegram قبل اعتماد
  الإصدار. تستخدم مسارات live بيئة `qa-live-shared`؛ ويستخدم Telegram أيضاً
  عقود اعتماد Convex CI. شغّل سير عمل `QA-Lab - All Lanes` اليدوي مع
  `matrix_profile=all` و`matrix_shards=true` عندما تريد مخزون نقل Matrix
  والوسائط وE2EE الكامل بالتوازي.
- التحقق من تثبيت وترقية runtime عبر أنظمة التشغيل جزء من
  `OpenClaw Release Checks` و`Full Release Validation` العامين، واللذين
  يستدعيان سير العمل القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` مباشرة
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيراً وحتمياً ومركزاً على
  الآثار، بينما تبقى فحوصات live الأبطأ في مسارها الخاص حتى لا تعطل النشر أو
  تحظره
- يجب إرسال فحوصات الإصدار الحاملة للأسرار عبر `Full Release
Validation` أو من مرجع سير عمل `main`/release حتى يبقى منطق سير العمل
  والأسرار مضبوطين
- يقبل `OpenClaw Release Checks` فرعاً أو وسماً أو SHA التزام كاملاً ما دام
  الالتزام المحلول قابلاً للوصول من فرع OpenClaw أو وسم إصدار
- يقبل الفحص المسبق للتحقق فقط في `OpenClaw NPM Release` أيضاً SHA التزام
  فرع سير العمل الحالي الكامل المكوّن من 40 محرفاً دون طلب وسم مدفوع
- مسار SHA هذا للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، يصطنع سير العمل `v<package.json version>` فقط لفحص بيانات
  تعريف الحزمة؛ لا يزال النشر الحقيقي يتطلب وسم إصدار حقيقياً
- يبقي كلا سيري العمل مسار النشر والترقية الحقيقي على مشغلات GitHub-hosted،
  بينما يمكن لمسار التحقق غير المتغير استخدام مشغلات Blacksmith Linux الأكبر
- يشغّل سير العمل ذاك
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد فحص إصدار npm المسبق ينتظر مسار فحوصات الإصدار المنفصل
- قبل وسم مرشح إصدار محلياً، شغّل
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. يشغّل
  المساعد حواجز الإصدار السريعة، وفحوصات إصدار plugin إلى npm/ClawHub،
  والبناء، وبناء UI، و`release:openclaw:npm:check` بالترتيب الذي يلتقط
  الأخطاء الشائعة الحاجبة للاعتماد قبل بدء سير عمل النشر في GitHub.
- شغّل `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الاعتماد
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (أو إصدار بيتا/التصحيح المطابق) للتحقق من مسار تثبيت السجل المنشور
  في بادئة مؤقتة جديدة
- بعد نشر بيتا، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من تهيئة الحزمة المثبتة، وإعداد Telegram، واختبار Telegram E2E حقيقي
  مقابل حزمة npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المؤجرة المشتركة.
  يمكن للمشرفين المحليين في الحالات المنفردة حذف متغيرات Convex وتمرير بيانات اعتماد البيئة
  `OPENCLAW_QA_TELEGRAM_*` الثلاثة مباشرة.
- لتشغيل اختبار الدخان الكامل بعد نشر بيتا من جهاز مشرف، استخدم `pnpm release:beta-smoke -- --beta betaN`. يشغّل المساعد تحقق Parallels من تحديث npm/هدف جديد، ويرسل سير عمل `NPM Telegram Beta E2E`، ويستطلع تشغيل سير العمل المحدد، وينزّل الأثر، ويطبع تقرير Telegram.
- يمكن للمشرفين تشغيل فحص ما بعد النشر نفسه من GitHub Actions عبر سير العمل
  اليدوي `NPM Telegram Beta E2E`. وهو يدوي فقط عن قصد
  ولا يعمل عند كل دمج.
- تستخدم أتمتة إصدار المشرفين الآن أسلوب الفحص التمهيدي ثم الترقية:
  - يجب أن يجتاز نشر npm الحقيقي `preflight_run_id` ناجحًا لـ npm
  - يجب إرسال نشر npm الحقيقي من فرع `main` نفسه أو
    فرع `release/YYYY.M.PATCH` نفسه الذي شُغّل منه الفحص التمهيدي الناجح
  - الإصدارات المستقرة من npm تستخدم `beta` افتراضيًا
  - يمكن لنشر npm المستقر استهداف `latest` صراحة عبر مدخل سير العمل
  - أصبح تعديل وسم توزيع npm المستند إلى الرمز المميز موجودًا الآن في
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` لأن
    `npm dist-tag add` ما زال يحتاج إلى `NPM_TOKEN` بينما يبقي مستودع المصدر
    النشر معتمدًا على OIDC فقط
  - `macOS Release` العام مخصص للتحقق فقط؛ عندما يوجد وسم على
    فرع إصدار فقط بينما يُرسل سير العمل من `main`، عيّن
    `public_release_branch=release/YYYY.M.PATCH`
  - يجب أن يجتاز نشر macOS الحقيقي `preflight_run_id` و
    `validate_run_id` ناجحين لـ macOS
  - مسارات النشر الحقيقية ترقّي الآثار المحضّرة بدلًا من إعادة بنائها
    مرة أخرى
- بالنسبة لإصدارات التصحيح المستقرة مثل `YYYY.M.PATCH-N`، يتحقق مدقق ما بعد النشر
  أيضًا من مسار الترقية نفسه ذي البادئة المؤقتة من `YYYY.M.PATCH` إلى `YYYY.M.PATCH-N`
  حتى لا تترك تصحيحات الإصدار التثبيتات العمومية الأقدم بصمت على
  حمولة الإصدار المستقر الأساسي
- يفشل الفحص التمهيدي لإصدار npm بإغلاق صارم ما لم يتضمن ملف tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن لوحة معلومات متصفح فارغة مرة أخرى
- يتحقق فحص ما بعد النشر أيضًا من أن نقاط دخول Plugin المنشورة و
  بيانات تعريف الحزمة موجودة في تخطيط السجل المثبت. أي إصدار
  يشحن حمولات تشغيل Plugin مفقودة يفشل في مدقق ما بعد النشر ولا
  يمكن ترقيته إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` لحزمة npm pack على
  ملف tarball المرشح للتحديث، بحيث يلتقط اختبار e2e للمثبّت تضخم الحزمة العرضي
  قبل مسار نشر الإصدار
- إذا مسّ عمل الإصدار تخطيط CI، أو بيانات توقيت الامتدادات، أو
  مصفوفات اختبار الامتدادات، فأعد توليد ومراجعة مخرجات مصفوفة
  `plugin-prerelease-extension-shard` المملوكة للمخطط من
  `.github/workflows/plugin-prerelease.yml` قبل الموافقة حتى لا
  تصف ملاحظات الإصدار تخطيط CI قديمًا
- تشمل جاهزية إصدار macOS المستقر أيضًا أسطح المحدث:
  - يجب أن ينتهي إصدار GitHub متضمنًا ملفات `.zip` و `.dmg` و `.dSYM.zip` المعبأة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر؛
    يثبته سير عمل نشر macOS تلقائيًا، أو يفتح PR لـ appcast
    عندما يكون الدفع المباشر محظورًا
  - يجب أن يحتفظ التطبيق المعبأ بمعرّف حزمة غير تصحيحي، وعنوان URL غير فارغ لخلاصة Sparkle،
    و `CFBundleVersion` عند حد أرضية بناء Sparkle القانونية لذلك
    إصدار الإصدار أو أعلى منه

## مربعات اختبار الإصدار

`Full Release Validation` هي طريقة تشغيل المشغّلين لكل اختبارات ما قبل الإصدار من
نقطة دخول واحدة. لإثبات تثبيت commit على فرع سريع الحركة، استخدم
المساعد حتى يعمل كل workflow فرعي من فرع مؤقت مثبت عند SHA الهدف:

```bash
pnpm ci:full-release --sha <full-sha>
```

يدفع المساعد `release-ci/<sha>-...`، ويشغّل `Full Release Validation`
من ذلك الفرع مع `ref=<sha>`، ويتحقق من أن كل workflow فرعي له `headSha`
يطابق الهدف، ثم يحذف الفرع المؤقت. يتجنب هذا إثبات تشغيل فرعي أحدث من
`main` عن طريق الخطأ.

للتحقق من فرع إصدار أو وسم، شغّله من workflow ref الموثوق `main`
ومرّر فرع الإصدار أو الوسم كـ `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

يحلّ الـ workflow مرجع الهدف، ويشغّل `CI` اليدوي مع
`target_ref=<release-ref>`، ثم يشغّل `OpenClaw Release Checks`.
توسّع `OpenClaw Release Checks` العمل إلى فحص تثبيت سريع، وفحوصات إصدار
عبر أنظمة تشغيل متعددة، وتغطية live/E2E لمسار إصدار Docker عند تفعيل soak،
وPackage Acceptance مع E2E حزمة Telegram القياسية، وتكافؤ QA Lab، وMatrix
الحية، وTelegram الحية. لا يكون تشغيل full/all مقبولاً إلا عندما يعرض ملخص
`Full Release Validation` أن `normal_ci` و`plugin_prerelease` و`release_checks`
ناجحة، ما لم تكن إعادة تشغيل مركزة قد تخطت عمداً الطفل المنفصل `Plugin
Prerelease`. استخدم الطفل المستقل `npm-telegram` فقط لإعادة تشغيل مركزة لحزمة
منشورة مع `release_package_spec` أو
`npm_telegram_package_spec`. يتضمن ملخص
المتحقق النهائي جداول أبطأ الوظائف لكل تشغيل فرعي، حتى يتمكن مدير الإصدار من
رؤية المسار الحرج الحالي من دون تنزيل السجلات.
راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للحصول على
مصفوفة المراحل الكاملة، وأسماء وظائف الـ workflow الدقيقة، وفروق ملف التعريف
stable مقابل full، والتحف، ومقابض إعادة التشغيل المركزة.
تُشغّل workflows الفرعية من المرجع الموثوق الذي يشغّل `Full Release
Validation`، وهو عادة `--ref main`، حتى عندما يشير `ref` الهدف إلى فرع إصدار
أقدم أو وسم أقدم. لا يوجد إدخال workflow-ref منفصل لـ Full Release Validation؛
اختر حاضنة الاختبار الموثوقة باختيار مرجع تشغيل الـ workflow.
لا تستخدم `--ref main -f ref=<sha>` لإثبات commit دقيق على `main` المتحرك؛
لا يمكن أن تكون SHAs الخام للـ commit مراجع workflow dispatch، لذلك استخدم
`pnpm ci:full-release --sha <sha>` لإنشاء الفرع المؤقت المثبت.

استخدم `release_profile` لاختيار اتساع live/provider:

- `minimum`: أسرع مسار إصدار حرج لـ OpenAI/core live وDocker
- `stable`: الحد الأدنى إضافة إلى تغطية provider/backend مستقرة لاعتماد الإصدار
- `full`: stable إضافة إلى تغطية واسعة استشارية للـ provider/media

تشغّل عمليات التحقق stable وfull دائماً الفحص الشامل live/E2E، ومسار إصدار
Docker، وفحص ترقية الحزم المنشورة المحدود الذي ينجو من الترقية قبل الترويج.
استخدم `run_release_soak=true` لطلب الفحص نفسه لإصدار beta. يغطي ذلك الفحص
أحدث أربع حزم stable إضافة إلى خطوط أساس مثبتة `2026.4.23` و`2026.5.2`
إضافة إلى تغطية أقدم `2026.4.15`، مع إزالة خطوط الأساس المكررة وتقسيم كل خط
أساس إلى وظيفة Docker runner خاصة به.

تستخدم `OpenClaw Release Checks` مرجع الـ workflow الموثوق لحل مرجع الهدف
مرة واحدة كـ `release-package-under-test` وتعيد استخدام ذلك الأثر في فحوصات
cross-OS وPackage Acceptance ومسار إصدار Docker عند تشغيل soak. يحافظ هذا على
كل مربعات الحزمة على البايتات نفسها ويتجنب بناء الحزمة بشكل متكرر.
بعد نشر beta على npm، عيّن `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
حتى تنزّل فحوصات الإصدار الحزمة المشحونة مرة واحدة، وتستخرج SHA مصدر البناء
من `dist/build-info.json`، وتعيد استخدام ذلك الأثر لمسارات cross-OS وPackage
Acceptance ومسار إصدار Docker وحزمة Telegram.
يستخدم فحص تثبيت OpenAI عبر أنظمة التشغيل `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند
تعيين متغير repo/org، وإلا يستخدم `openai/gpt-5.4`، لأن هذا المسار يثبت تثبيت
الحزمة، والإعداد الأولي، وبدء Gateway، ودورة وكيل حية واحدة بدلاً من قياس أداء
أبطأ نموذج افتراضي. تبقى مصفوفة providers الحية الأوسع هي مكان تغطية النماذج
المحددة.

استخدم هذه المتغيرات بحسب مرحلة الإصدار:

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
فاستخدم الـ workflow الفرعي الفاشل، أو الوظيفة، أو مسار Docker، أو ملف تعريف
الحزمة، أو provider النموذج، أو مسار QA للإثبات التالي. شغّل المظلة الكاملة
مرة أخرى فقط عندما يغير الإصلاح تنسيق الإصدار المشترك أو يجعل دليل كل المربعات
السابق قديماً. يعيد المتحقق النهائي للمظلة فحص معرّفات تشغيل workflows الفرعية
المسجلة، لذلك بعد إعادة تشغيل workflow فرعي بنجاح، أعد تشغيل وظيفة الأصل
الفاشلة `Verify full validation` فقط.

للاسترداد المحدود، مرّر `rerun_group` إلى المظلة. `all` هو تشغيل مرشح الإصدار
الحقيقي، و`ci` يشغّل طفل CI العادي فقط، و`plugin-prerelease` يشغّل طفل
Plugin الخاص بالإصدار فقط، و`release-checks` يشغّل كل مربعات الإصدار، ومجموعات
الإصدار الأضيق هي `install-smoke` و`cross-os` و`live-e2e` و`package` و`qa`
و`qa-parity` و`qa-live` و`npm-telegram`.
تتطلب إعادة تشغيل `npm-telegram` المركزة `release_package_spec` أو
`npm_telegram_package_spec`؛ تستخدم تشغيلات full/all حزمة Telegram القياسية
E2E داخل Package Acceptance. يمكن لإعادات تشغيل
cross-OS المركزة إضافة `cross_os_suite_filter=windows/packaged-upgrade` أو
عامل تصفية آخر لنظام تشغيل/مجموعة. تمنع إخفاقات QA release-check التحقق
العادي من الإصدار، بما في ذلك انحراف أداة OpenClaw الديناميكية المطلوب في
المستوى القياسي. قد تستمر تشغيلات Tideclaw alpha في التعامل مع مسارات
release-check غير المتعلقة بسلامة الحزمة كاستشارية. عندما يطلب
`live_suite_filter` صراحة مسار QA حي محكوماً مثل Discord أو WhatsApp أو Slack،
يجب تمكين متغير المستودع المطابق `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`؛
وإلا يفشل التقاط الإدخال بدلاً من تخطي المسار بصمت.

### Vitest

مربع Vitest هو workflow فرعي يدوي `CI`. يتجاوز CI اليدوي عمداً التحديد بحسب
التغييرات ويفرض رسم الاختبار البياني العادي لمرشح الإصدار: أجزاء Linux Node،
وأجزاء Plugin المضمنة، وأجزاء عقود Plugin والقنوات، وتوافق Node 22،
و`check-*`، و`check-additional-*`، وفحوصات دخان الأثر المبني، وفحوصات الوثائق،
وPython skills، وWindows، وmacOS،
وControl UI i18n. يُدرج Android عندما يشغّل `Full Release Validation` المربع
لأن المظلة تمرر `include_android=true`؛ يتطلب CI اليدوي المستقل
`include_android=true` لتغطية Android.

استخدم هذا المربع للإجابة عن "هل اجتازت شجرة المصدر مجموعة الاختبارات العادية
الكاملة؟" إنه ليس مثل تحقق المنتج عبر مسار الإصدار. احتفظ بالأدلة التالية:

- ملخص `Full Release Validation` الذي يعرض رابط تشغيل `CI` المشغّل
- تشغيل `CI` أخضر على SHA الهدف الدقيق
- أسماء الأجزاء الفاشلة أو البطيئة من وظائف CI عند التحقيق في الانحدارات
- تحف توقيت Vitest مثل `.artifacts/vitest-shard-timings.json` عندما
  يحتاج تشغيل إلى تحليل أداء

شغّل CI اليدوي مباشرة فقط عندما يحتاج الإصدار إلى CI عادي حتمي ولكن لا يحتاج
إلى مربعات Docker أو QA Lab أو live أو cross-OS أو الحزم. استخدم الأمر الأول
لـ CI مباشر غير Android. أضف `include_android=true` عندما يجب أن يغطي CI
المباشر لمرشح الإصدار Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

يوجد مربع Docker داخل `OpenClaw Release Checks` عبر
`openclaw-live-and-e2e-checks-reusable.yml`، إضافة إلى workflow
`install-smoke` في وضع الإصدار. يتحقق من مرشح الإصدار عبر بيئات Docker
المعبأة بدلاً من اختبارات مستوى المصدر فقط.

تشمل تغطية Docker للإصدار:

- فحص تثبيت كامل مع تفعيل فحص دخان تثبيت Bun العالمي البطيء
- إعداد/إعادة استخدام صورة دخان Dockerfile الجذري بحسب SHA الهدف، مع وظائف QR
  وroot/gateway وinstaller/Bun smoke تعمل كأجزاء install-smoke منفصلة
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
  `bundled-plugin-install-uninstall-0` حتى
  `bundled-plugin-install-uninstall-23`
- مجموعات providers live/E2E وتغطية نماذج Docker الحية عندما تشمل فحوصات
  الإصدار مجموعات live

استخدم تحف Docker قبل إعادة التشغيل. يرفع مجدول مسار الإصدار
`.artifacts/docker-tests/` مع سجلات المسارات، و`summary.json`، و`failures.json`،
وتوقيتات المراحل، وخطة المجدول بصيغة JSON، وأوامر إعادة التشغيل. للاسترداد
المركز، استخدم `docker_lanes=<lane[,lane]>` على workflow live/E2E القابل
لإعادة الاستخدام بدلاً من إعادة تشغيل كل أجزاء الإصدار. تتضمن أوامر إعادة
التشغيل المولدة `package_artifact_run_id` السابق ومدخلات صورة Docker المعدة
عند توفرها، حتى يتمكن مسار فاشل من إعادة استخدام ملف tarball وصور GHCR نفسها.

### QA Lab

مربع QA Lab جزء أيضاً من `OpenClaw Release Checks`. إنه بوابة الإصدار للسلوك
الوكيل ومستوى القناة، منفصل عن Vitest وآليات حزمة Docker.

تشمل تغطية QA Lab للإصدار:

- مسار تكافؤ mock يقارن مسار OpenAI المرشح بخط أساس Opus 4.6 باستخدام حزمة
  التكافؤ الوكيل
- ملف تعريف QA حي سريع لـ Matrix باستخدام بيئة `qa-live-shared`
- مسار QA حي لـ Telegram باستخدام تأجيرات بيانات اعتماد Convex CI
- `pnpm qa:otel:smoke` أو `pnpm qa:otel:collector-smoke`
  أو `pnpm qa:prometheus:smoke` أو
  `pnpm qa:observability:smoke` عندما تحتاج قياسات الإصدار إلى إثبات محلي صريح

استخدم هذا المربع للإجابة عن "هل يتصرف الإصدار بشكل صحيح في سيناريوهات QA
وتدفقات القنوات الحية؟" احتفظ بعناوين URL للتحف لمسارات التكافؤ وMatrix
وTelegram عند اعتماد الإصدار. تبقى تغطية Matrix الكاملة متاحة كتشغيل QA-Lab
يدوي مقسم بدلاً من المسار الافتراضي الحرج للإصدار.

### الحزمة

مربع الحزمة هو بوابة المنتج القابل للتثبيت. يستند إلى
`Package Acceptance` والمحلل
`scripts/resolve-openclaw-package-candidate.mjs`. يطبّع المحلل المرشح إلى
tarball `package-under-test` الذي تستهلكه Docker E2E، ويتحقق من مخزون الحزمة،
ويسجل إصدار الحزمة وSHA-256، ويحافظ على مرجع حاضنة الـ workflow منفصلاً عن
مرجع مصدر الحزمة.

مصادر المرشح المدعومة:

- `source=npm`: `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيق
- `source=ref`: حزم فرع `package_ref` موثوقا، أو وسما، أو SHA كاملا للالتزام
  مع أداة الاختبار `workflow_ref` المحددة
- `source=url`: نزل `.tgz` عاما عبر HTTPS مع `package_sha256` المطلوب؛
  يتم رفض بيانات اعتماد URL، ومنافذ HTTPS غير الافتراضية، وأسماء المضيفين أو
  العناوين المحلولة الخاصة/الداخلية/ذات الاستخدام الخاص، وعمليات إعادة التوجيه غير الآمنة
- `source=trusted-url`: نزل `.tgz` عبر HTTPS مع
  `package_sha256` و`trusted_source_id` مطلوبين من سياسة مسماة في
  `.github/package-trusted-sources.json`؛ استخدم هذا للمرايا المؤسسية أو
  مستودعات الحزم الخاصة المملوكة للمشرفين بدلا من إضافة تجاوز شبكة خاصة
  على مستوى الإدخال إلى `source=url`
- `source=artifact`: أعد استخدام `.tgz` تم رفعه بواسطة تشغيل GitHub Actions آخر

يشغل `OpenClaw Release Checks` قبول الحزمة باستخدام `source=artifact`، وأثرية
حزمة الإصدار المحضرة، و`suite_profile=custom`،
و`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
و`telegram_mode=mock-openai`. يحافظ قبول الحزمة على ترحيل الحزمة، والتحديث،
وإعادة تشغيل تحديث المصادقة المكونة، وتثبيت Skills مباشرة من ClawHub، وتنظيف تبعيات Plugin القديمة، وتجهيزات Plugin دون اتصال،
وتحديث Plugin، وضمان جودة حزمة Telegram مقابل ملف tarball المحلول نفسه.
تستخدم فحوصات الإصدار الحاجزة خط أساس الحزمة المنشورة الأحدث افتراضيا؛ ويوسع
ملف beta الشخصي مع `run_release_soak=true` أو `release_profile=stable` أو
`release_profile=full` النطاق إلى كل خط أساس مستقر منشور على npm من
`2026.4.23` حتى `latest` بالإضافة إلى تجهيزات المشكلات المبلغ عنها. استخدم
قبول الحزمة مع `source=npm` لمرشح تم شحنه بالفعل، أو
`source=ref` لملف npm tarball محلي مدعوم بـ SHA قبل النشر،
أو `source=trusted-url` لمرآة مؤسسية/خاصة مملوكة لمشرف، أو
`source=artifact` لملف tarball محضر تم رفعه بواسطة تشغيل GitHub Actions آخر.
إنه البديل الأصلي في GitHub لمعظم تغطية الحزمة/التحديث التي كانت تتطلب
Parallels سابقا. لا تزال فحوصات الإصدار متعددة أنظمة التشغيل مهمة للإعداد
الأولي الخاص بنظام التشغيل، والمثبت، وسلوك المنصة، لكن ينبغي أن يفضل تحقق
منتج الحزمة/التحديث قبول الحزمة.

قائمة التحقق الأساسية للتحقق من التحديث وPlugin هي
[اختبار التحديثات وPlugins](/ar/help/testing-updates-plugins). استخدمها عند
تحديد أي مسار محلي أو Docker أو قبول الحزمة أو فحص إصدار يثبت تغييرا في
تثبيت/تحديث Plugin، أو تنظيف doctor، أو ترحيل حزمة منشورة.
ترحيل التحديث المنشور الشامل من كل حزمة مستقرة `2026.4.23+` هو
سير عمل يدوي منفصل باسم `Update Migration`، وليس جزءا من CI الإصدار الكامل.

تساهل قبول الحزمة القديم مقيد زمنيا عمدا. قد تستخدم الحزم حتى
`2026.4.25` مسار التوافق لفجوات البيانات الوصفية المنشورة بالفعل
إلى npm: إدخالات جرد ضمان الجودة الخاصة المفقودة من ملف tarball، وغياب
`gateway install --wrapper`، وغياب ملفات التصحيح في تجهيز git المشتق من tarball،
وغياب `update.channel` المستمر، ومواقع سجلات تثبيت Plugin القديمة،
وغياب استمرارية سجل تثبيت السوق، وترحيل بيانات التكوين الوصفية أثناء
`plugins update`. قد تحذر حزمة `2026.4.26` المنشورة بشأن ملفات ختم بيانات
البناء المحلية التي تم شحنها بالفعل. يجب أن تستوفي الحزم اللاحقة عقود الحزم
الحديثة؛ وتفشل تلك الفجوات نفسها تحقق الإصدار.

استخدم ملفات قبول الحزمة الشخصية الأوسع عندما يكون سؤال الإصدار متعلقا
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

ملفات الحزم الشخصية الشائعة:

- `smoke`: مسارات سريعة لتثبيت الحزمة/القناة/الوكيل، وشبكة Gateway، وإعادة
  تحميل التكوين
- `package`: عقود تثبيت/تحديث/إعادة تشغيل/حزمة Plugin بالإضافة إلى إثبات
  تثبيت Skills مباشر من ClawHub؛ هذا هو الافتراضي لفحص الإصدار
- `product`: `package` بالإضافة إلى قنوات MCP، وتنظيف cron/الوكيل الفرعي،
  وبحث OpenAI عبر الويب، وOpenWebUI
- `full`: أجزاء مسار إصدار Docker مع OpenWebUI
- `custom`: قائمة `docker_lanes` دقيقة لإعادات التشغيل المركزة

لإثبات Telegram لمرشح الحزمة، فعل `telegram_mode=mock-openai` أو
`telegram_mode=live-frontier` في قبول الحزمة. يمرر سير العمل ملف tarball
المحلول `package-under-test` إلى مسار Telegram؛ ولا يزال سير عمل
Telegram المستقل يقبل مواصفة npm منشورة لفحوصات ما بعد النشر.

## أتمتة نشر الإصدار

`OpenClaw Release Publish` هو نقطة الدخول المعتادة للنشر المغيّر. إنه
ينسق سير عمل الناشر الموثوق بالترتيب الذي يحتاجه الإصدار:

1. اسحب وسم الإصدار وحل SHA الالتزام الخاص به.
2. تحقق من أن الوسم قابل للوصول من `main` أو `release/*`.
3. شغل `pnpm plugins:sync:check`.
4. أرسل `Plugin NPM Release` مع `publish_scope=all-publishable` و
   `ref=<release-sha>`.
5. أرسل `Plugin ClawHub Release` بالنطاق وSHA نفسيهما.
6. أرسل `OpenClaw NPM Release` مع وسم الإصدار، ووسم توزيع npm، و
   `preflight_run_id` المحفوظ بعد التحقق من
   `full_release_validation_run_id` المحفوظ.
7. بالنسبة للإصدارات المستقرة، أنشئ إصدار GitHub أو حدثه كمسودة، وأرسل
   `Windows Node Release` مع `windows_node_tag` الصريح و
   `windows_node_installer_digests` المعتمدة للمرشح، وتحقق من أصول
   المثبت/المجاميع الاختبارية الأساسية قبل نشر المسودة.

مثال نشر beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

نشر مستقر إلى وسم توزيع beta الافتراضي:

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

استخدم سيرَي العمل ذوي المستوى الأدنى `Plugin NPM Release` و`Plugin ClawHub Release`
فقط لأعمال الإصلاح أو إعادة النشر المركزة. يرفض `OpenClaw Release Publish`
القيمة `plugin_publish_scope=selected` عندما تكون `publish_openclaw_npm=true`
كي لا يمكن شحن الحزمة الأساسية دون كل Plugin رسمي قابل للنشر، بما في ذلك
`@openclaw/diffs-language-pack`. لإصلاح Plugin محدد، عيّن
`publish_openclaw_npm=false` مع `plugin_publish_scope=selected` و
`plugins=@openclaw/name`، أو أرسل سير العمل الابن مباشرة.

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ عندما تكون `preflight_only=true`، قد يكون أيضا SHA
  الالتزام الكامل الحالي ذا 40 حرفا لفرع سير العمل لتمهيد تحقق فقط
- `preflight_only`: `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار النشر
  الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي كي يعيد سير العمل استخدام
  ملف tarball المحضر من تشغيل التمهيد الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ الافتراضي هو `beta`

يقبل `OpenClaw Release Publish` هذه المدخلات التي يتحكم بها المشغل:

- `tag`: وسم إصدار مطلوب؛ يجب أن يكون موجودا بالفعل
- `preflight_run_id`: معرف تشغيل تمهيد `OpenClaw NPM Release` ناجح؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `full_release_validation_run_id`: معرف تشغيل `Full Release Validation` ناجح؛
  مطلوب عندما تكون `publish_openclaw_npm=true`
- `windows_node_tag`: وسم إصدار `openclaw/openclaw-windows-node` دقيق وغير
  تمهيدي؛ مطلوب لنشر OpenClaw مستقر
- `windows_node_installer_digests`: خريطة JSON مضغوطة معتمدة للمرشح من أسماء
  مثبتات Windows الحالية إلى بصمات `sha256:` المثبتة الخاصة بها؛ مطلوبة
  لنشر OpenClaw مستقر
- `npm_dist_tag`: وسم npm المستهدف لحزمة OpenClaw
- `plugin_publish_scope`: الافتراضي هو `all-publishable`؛ استخدم `selected`
  فقط لأعمال إصلاح Plugin فقط مركزة مع `publish_openclaw_npm=false`
- `plugins`: أسماء حزم `@openclaw/*` مفصولة بفواصل عندما تكون
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: الافتراضي هو `true`؛ عيّن `false` فقط عند استخدام
  سير العمل كمنسق إصلاح خاص بـ Plugin فقط
- `wait_for_clawhub`: الافتراضي هو `false` حتى لا يتم حظر توفر npm بواسطة
  مرافق ClawHub؛ عيّن `true` فقط عندما يجب أن يتضمن اكتمال سير العمل اكتمال
  ClawHub

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم بها المشغل:

- `ref`: فرع، أو وسم، أو SHA التزام كامل للتحقق منه. تتطلب الفحوصات الحاملة
  للأسرار أن يكون الالتزام المحلول قابلا للوصول من فرع OpenClaw أو وسم إصدار.
- `run_release_soak`: الاشتراك في فحوصات مباشرة/E2E شاملة، ومسار إصدار Docker،
  ونقع upgrade-survivor منذ البداية لفحوصات إصدار beta. يتم فرضه بواسطة
  `release_profile=stable` و`release_profile=full`.

القواعد:

- قد تنشر الوسوم المستقرة والتصحيحية إلى `beta` أو `latest`
- قد تنشر وسوم beta التمهيدية إلى `beta` فقط
- بالنسبة إلى `OpenClaw NPM Release`، يسمح بإدخال SHA الالتزام الكامل فقط عندما
  تكون `preflight_only=true`
- `OpenClaw Release Checks` و`Full Release Validation` هما دائما للتحقق فقط
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء التمهيد؛
  يتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر

## تسلسل إصدار npm مستقر

عند إعداد إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الحالي الكامل لالتزام فرع سير العمل
     لتشغيل تجريبي جاف للتحقق فقط من سير عمل الفحص المسبق
2. اختر `npm_dist_tag=beta` للتدفق المعتاد الذي يبدأ بإصدار beta، أو `latest` فقط
   عندما تريد عمداً نشراً مستقراً مباشراً
3. شغّل `Full Release Validation` على فرع الإصدار، أو وسم الإصدار، أو SHA الكامل
   للالتزام عندما تريد CI المعتاد مع تغطية ذاكرة التخزين المؤقت للمطالبات الحية، وDocker، وQA Lab،
   وMatrix، وTelegram من سير عمل يدوي واحد
4. إذا كنت تحتاج عمداً إلى مخطط الاختبارات العادي الحتمي فقط، فشغّل
   سير عمل `CI` اليدوي على مرجع الإصدار بدلاً من ذلك
5. حدّد وسم إصدار `openclaw/openclaw-windows-node` الدقيق غير التمهيدي
   الذي يجب شحن مثبتاته الموقّعة لمعمارية x64 وARM64. احفظه باسم
   `windows_node_tag`، واحفظ خريطة الملخصات المتحقق منها الخاصة بها باسم
   `windows_node_installer_digests`. يسجل مساعد مرشح الإصدار كليهما
   ويضمّنهما في أمر النشر الذي يولده.
6. احفظ `preflight_run_id` و`full_release_validation_run_id` الناجحين
7. شغّل `OpenClaw Release Publish` مع نفس `tag`، ونفس `npm_dist_tag`،
   و`windows_node_tag` المحدد، و`windows_node_installer_digests` المحفوظة الخاصة به،
   و`preflight_run_id` المحفوظ، و`full_release_validation_run_id` المحفوظ؛
   فهو ينشر Plugins الخارجية إلى npm وClawHub قبل ترقية
   حزمة OpenClaw على npm
8. إذا وصل الإصدار إلى `beta`، فاستخدم
   سير العمل `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
9. إذا نُشر الإصدار عمداً مباشرة إلى `latest` ويجب أن يتبع `beta`
   نفس البناء المستقر فوراً، فاستخدم سير عمل الإصدار نفسه
   لتوجيه كلا وسمي التوزيع إلى الإصدار المستقر، أو اترك مزامنة الإصلاح الذاتي المجدولة
   تنقل `beta` لاحقاً

توجد عملية تغيير وسم التوزيع في مستودع سجل الإصدارات لأنها لا تزال تتطلب
`NPM_TOKEN`، بينما يحتفظ مستودع المصدر بالنشر عبر OIDC فقط.

يبقي ذلك كلاً من مسار النشر المباشر ومسار الترقية الذي يبدأ بإصدار beta
موثقين ومرئيين للمشغّل.

إذا اضطر أحد المشرفين إلى الرجوع إلى مصادقة npm المحلية، فشغّل أي أوامر
CLI لـ 1Password (`op`) داخل جلسة tmux مخصصة فقط. لا تستدعِ `op`
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

يستخدم المشرفون وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
لدليل التشغيل الفعلي.

## ذات صلة

- [قنوات الإصدار](/ar/install/development-channels)
