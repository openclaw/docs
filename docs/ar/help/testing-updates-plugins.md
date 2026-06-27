---
read_when:
    - تغيير سلوك تحديث OpenClaw أو doctor أو قبول الحزم أو تثبيت Plugin
    - التحضير لمرشح إصدار أو الموافقة عليه
    - تصحيح أخطاء تحديث الحزمة أو تنظيف تبعيات Plugin أو تراجعات تثبيت Plugin
sidebarTitle: Update and plugin tests
summary: كيف يتحقق OpenClaw من مسارات التحديث وترحيلات الحزم وسلوك تثبيت/تحديث Plugin
title: 'الاختبار: التحديثات وPlugins'
x-i18n:
    generated_at: "2026-06-27T17:47:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

هذه قائمة التحقق المخصصة للتحقق من التحديث وPlugin. الهدف
بسيط: إثبات أن الحزمة القابلة للتثبيت تستطيع تحديث حالة المستخدم الحقيقية، وإصلاح الحالة
القديمة المتقادمة عبر `doctor`، ولا تزال قادرة على تثبيت وتحميل وتحديث وإلغاء تثبيت
Plugin من المصادر المدعومة.

لخريطة مشغل الاختبارات الأوسع، راجع [الاختبار](/ar/help/testing). ولمفاتيح المزوّدين الحية
والحزم التي تلامس الشبكة، راجع [الاختبار الحي](/ar/help/testing-live).

## ما نحميه

تحمي اختبارات التحديث وPlugin هذه العقود:

- ملف tarball للحزمة مكتمل، ويحتوي على `dist/postinstall-inventory.json` صالح،
  ولا يعتمد على ملفات مستودع غير مضمنة.
- يستطيع المستخدم الانتقال من حزمة منشورة أقدم إلى الحزمة المرشحة
  دون فقدان الإعدادات أو الوكلاء أو الجلسات أو مساحات العمل أو قوائم السماح لـPlugin أو
  إعدادات القنوات.
- يملك `openclaw doctor --fix --non-interactive` مسارات تنظيف وإصلاح
  الحالة القديمة. يجب ألا يضيف بدء التشغيل ترحيلات توافق مخفية لحالة
  Plugin متقادمة.
- تعمل عمليات تثبيت Plugin من الأدلة المحلية ومستودعات git وحزم npm ومسار
  سجل ClawHub.
- تُثبَّت تبعيات npm الخاصة بـPlugin في مشروع npm مُدار واحد لكل Plugin،
  وتُفحص قبل الثقة، وتُزال عبر npm أثناء إلغاء التثبيت حتى لا تبقى
  التبعيات المرفوعة.
- يكون تحديث Plugin مستقرا عندما لا يتغير شيء: تبقى سجلات التثبيت والمصدر
  المحلول وتخطيط التبعيات المثبتة وحالة التمكين كما هي.

## الإثبات المحلي أثناء التطوير

ابدأ بنطاق ضيق:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

لتغييرات تثبيت Plugin أو إلغاء تثبيته أو تبعياته أو مخزون الحزمة، شغّل أيضا
الاختبارات المركزة التي تغطي نقطة التماس المعدلة:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

قبل أن يستهلك أي مسار Docker للحزم ملف tarball، أثبت أثر الحزمة:

```bash
pnpm release:check
```

يشغّل `release:check` فحوص انجراف الإعدادات/الوثائق/API، ويكتب مخزون dist
للحزمة، ويشغّل `npm pack --dry-run`، ويرفض الملفات المحظورة داخل الحزمة، ويثبت
ملف tarball في بادئة مؤقتة، ويشغّل postinstall، ويدخّن نقاط دخول القنوات
المضمّنة.

## مسارات Docker

مسارات Docker هي إثبات مستوى المنتج. فهي تثبّت أو تحدّث حزمة حقيقية
داخل حاويات Linux وتتحقق من السلوك عبر أوامر CLI، وبدء تشغيل Gateway،
ومجسات HTTP، وحالة RPC، وحالة نظام الملفات.

استخدم المسارات المركزة أثناء التكرار:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

مسارات مهمة:

- يتحقق `test:docker:plugins` من تجربة تثبيت Plugin، وتثبيت المجلدات المحلية،
  وسلوك تخطي تحديث المجلد المحلي، والمجلدات المحلية ذات التبعيات
  المثبتة مسبقا، وتثبيت حزم `file:`، وتثبيت git مع تنفيذ CLI، وتحديثات مراجع git
  المتحركة، وتثبيت سجل npm مع التبعيات الانتقالية المرفوعة، وعمليات تحديث npm
  عديمة الأثر، ورفض بيانات تعريف حزم npm المشوهة، وتثبيتات مثبت ClawHub المحلي
  وعمليات التحديث عديمة الأثر، وسلوك تحديث السوق، وتمكين/فحص حزمة Claude. اضبط
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لإبقاء كتلة ClawHub محكمة/دون اتصال.
- يثبّت `test:docker:plugin-lifecycle-matrix` الحزمة المرشحة في حاوية عارية،
  ثم يشغّل Plugin من npm عبر التثبيت والفحص والتعطيل والتمكين
  والترقية الصريحة والرجوع الصريح وإلغاء التثبيت بعد حذف كود Plugin.
  ويسجل مقاييس RSS وCPU لكل مرحلة.
- يتحقق `test:docker:plugin-update` من أن Plugin المثبت وغير المتغير لا
  يُعاد تثبيته ولا يفقد بيانات تعريف التثبيت أثناء `openclaw plugins update`.
- يثبّت `test:docker:upgrade-survivor` ملف tarball المرشح فوق مثبت مستخدم قديم
  متسخ، ثم يشغّل تحديث الحزمة بالإضافة إلى doctor غير تفاعلي، ثم يبدأ
  Gateway عبر local loopback ويتحقق من حفظ الحالة.
- يثبّت `test:docker:published-upgrade-survivor` أولا خط أساس منشور،
  ويعدّه عبر وصفة `openclaw config set` مضمّنة، ويحدّثه إلى ملف tarball
  المرشح، ويشغّل doctor، ويتحقق من تنظيف القديم، ويبدأ Gateway، ويفحص
  `/healthz` و`/readyz` وحالة RPC.
- يثبّت `test:docker:update-restart-auth` الحزمة المرشحة، ويبدأ Gateway مُدارا
  بمصادقة الرموز، ويلغي ضبط متغيرات بيئة مصادقة Gateway الخاصة بالمتصل من أجل
  `openclaw update --yes --json`، ويتطلب من أمر تحديث المرشح إعادة تشغيل
  Gateway قبل المجسات العادية.
- `test:docker:update-migration` هو مسار التحديث المنشور كثيف التنظيف. يبدأ
  من حالة مستخدم مضبوطة بأسلوب Discord/Telegram، ويشغّل doctor لخط الأساس
  حتى تتاح لتبعيات Plugin المضبوطة فرصة الظهور، ويزرع بقايا تبعيات Plugin قديمة
  لـPlugin معبأ مضبوط، ويحدّث إلى ملف tarball المرشح، ويتطلب من doctor
  بعد التحديث إزالة جذور التبعيات القديمة.

متغيرات مفيدة لمسار نجاة التحديث المنشور:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

السيناريوهات المتاحة هي `base` و`feishu-channel` و`bootstrap-persona`
و`plugin-deps-cleanup` و`configured-plugin-installs`
و`stale-source-plugin-shadow` و`tilde-log-path` و`versioned-runtime-deps`. في التشغيلات المجمعة،
يتوسع `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` إلى جميع السيناريوهات
المشكلة على هيئة مسائل مبلّغ عنها، بما في ذلك ترحيل تثبيت Plugin المضبوط.

ترحيل التحديث الكامل منفصل عمدا عن تكامل الإصدار الكامل المستمر. استخدم
سير العمل اليدوي `Update Migration` عندما يكون سؤال الإصدار هو "هل يمكن لكل
إصدار مستقر منشور منذ 2026.4.23 فصاعدا التحديث إلى هذا المرشح وتنظيف
بقايا تبعيات Plugin؟":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## قبول الحزمة

قبول الحزمة هو بوابة الحزمة الأصلية في GitHub. يحل حزمة مرشحة واحدة
إلى ملف tarball باسم `package-under-test`، ويسجل الإصدار وSHA-256، ثم
يشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد ملف tarball نفسه. يكون مرجع
حزام سير العمل منفصلا عن مرجع مصدر الحزمة، لذلك يمكن لمنطق الاختبار الحالي
التحقق من الإصدارات الموثوقة الأقدم.

مصادر المرشحين:

- `source=npm`: تحقق من `openclaw@beta` أو `openclaw@latest` أو إصدار
  منشور محدد.
- `source=ref`: حزم فرعا أو وسمًا أو التزامًا موثوقا مع الحزام الحالي المحدد.
- `source=url`: تحقق من ملف tarball عام عبر HTTPS مع `package_sha256` مطلوب.
  يرفض هذا المسار بيانات اعتماد URL، ومنافذ HTTPS غير الافتراضية، وأسماء المضيفات
  أو نتائج DNS/IP الخاصة/الداخلية، ومساحة IP ذات الاستخدام الخاص، وعمليات إعادة
  التوجيه غير الآمنة.
- `source=trusted-url`: تحقق من ملف tarball عبر HTTPS مع
  `package_sha256` و`trusted_source_id` مطلوبين مقابل السياسة المملوكة للمشرف
  في `.github/package-trusted-sources.json`. استخدم هذا للمرايا المؤسسية/الخاصة
  بدلا من إضعاف `source=url` بمفتاح allow-private على مستوى الإدخال.
  تستخدم مصادقة Bearer، عند ضبطها بالسياسة، السر الثابت
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: أعد استخدام ملف tarball رُفع بواسطة تشغيل Actions آخر.

يستخدم تحقق الإصدار الكامل `source=artifact` افتراضيا، مبنيا من SHA الإصدار
المحلول. لإثبات ما بعد النشر، مرّر
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` حتى تستهدف مصفوفة الترقية نفسها
حزمة npm المشحونة بدلا من ذلك.

تستدعي فحوص الإصدار قبول الحزمة مع مجموعة الحزمة/التحديث/إعادة التشغيل/Plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

عند تمكين نقع الإصدار، تمرر أيضا:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

يبقي هذا ترحيل الحزمة، وتبديل قناة التحديث، وتحمل Plugin مُدار تالف،
وتنظيف تبعيات Plugin المتقادمة، وتغطية Plugin دون اتصال، وسلوك تحديث
Plugin، وضمان جودة حزمة Telegram على الأثر المحلول نفسه دون أن تجعل بوابة
حزمة الإصدار الافتراضية تمر على كل إصدار منشور.

يتحول `last-stable-4` إلى أحدث أربعة إصدارات مستقرة منشورة على npm من
OpenClaw. يثبّت قبول حزمة الإصدار `2026.4.23` بوصفه أول حد توافق لتحديث
Plugin، و`2026.5.2` بوصفه حد اضطراب معمارية Plugin، و`2026.4.15` بوصفه
خط أساس أقدم لتحديث منشور من 2026.4.1x؛ يزيل المحلل تكرار الدبابيس الموجودة
بالفعل ضمن أحدث أربعة. لتغطية ترحيل التحديث المنشور على نحو شامل، استخدم
`all-since-2026.4.23` في سير عمل Update Migration المنفصل بدلا من تكامل
الإصدار الكامل المستمر. يظل `release-history` متاحا لأخذ عينات يدوية أوسع
عندما تريد أيضا مرساة التاريخ السابق القديمة.

عند اختيار عدة خطوط أساس لمسار نجاة التحديث المنشور، يقسم سير عمل Docker
القابل لإعادة الاستخدام كل خط أساس إلى مهمة مشغّل مستهدفة خاصة به. لا يزال كل
جزء خط أساس يشغّل مجموعة السيناريوهات المختارة، لكن تبقى السجلات والآثار
لكل خط أساس، ويكون زمن الجدار محدودا بأبطأ جزء بدلا من مهمة تسلسلية كبيرة واحدة.

شغّل ملف تعريف حزمة يدويا عند التحقق من مرشح قبل الإصدار:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

استخدم `suite_profile=product` عندما يتضمن سؤال الإصدار قنوات MCP،
أو تنظيف cron/subagent، أو بحث الويب من OpenAI، أو OpenWebUI. استخدم
`suite_profile=full` فقط عندما تحتاج إلى تغطية كاملة لمسار إصدار Docker.

## افتراضي الإصدار

بالنسبة إلى مرشحي الإصدار، تكون حزمة الإثبات الافتراضية:

1. `pnpm check:changed` و`pnpm test:changed` لانحدارات مستوى المصدر.
2. `pnpm release:check` لسلامة أثر الحزمة.
3. ملف تعريف قبول الحزمة `package` أو مسارات الحزمة المخصصة لفحوص الإصدار
   لعقود التثبيت/التحديث/إعادة التشغيل/Plugin.
4. فحوص إصدار عبر أنظمة تشغيل متعددة لسلوك المثبّت والإعداد الأولي والمنصة
   الخاص بكل نظام تشغيل.
5. الحزم الحية فقط عندما تلامس السطح المعدل سلوك المزوّد أو الخدمة المستضافة.

على أجهزة المشرفين، يجب تشغيل البوابات الواسعة وإثبات منتج Docker/الحزمة
في Testbox ما لم يكن يتم تنفيذ إثبات محلي صراحة.

## التوافق القديم

تساهل التوافق ضيق ومحدد زمنيا:

- يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، تحمل
  فجوات بيانات تعريف الحزمة التي شُحنت بالفعل في قبول الحزمة.
- قد تصدر حزمة `2026.4.26` المنشورة تحذيرا لملفات ختم بيانات تعريف البناء
  المحلي التي شُحنت بالفعل.
- يجب أن تلبي الحزم اللاحقة العقود الحديثة. تفشل الفجوات نفسها بدلا من
  التحذير أو التخطي.

لا تضف ترحيلات بدء تشغيل جديدة لهذه الأشكال القديمة. أضف إصلاح doctor أو
وسّعه، ثم أثبته باستخدام `upgrade-survivor` أو `published-upgrade-survivor` أو
`update-restart-auth` عندما يملك أمر التحديث إعادة التشغيل.

## إضافة التغطية

عند تغيير سلوك التحديث أو Plugin، أضف التغطية عند أدنى طبقة
يمكن أن تفشل للسبب الصحيح:

- منطق المسارات أو البيانات الوصفية البحت: اختبار وحدة بجانب المصدر.
- سلوك مخزون الحزمة أو الملفات المضمّنة في الحزمة: اختبار `package-dist-inventory` أو فاحص tarball.
- سلوك تثبيت/تحديث CLI: تأكيد في مسار Docker أو fixture.
- سلوك ترحيل الإصدار المنشور: سيناريو `published-upgrade-survivor`.
- سلوك إعادة التشغيل المملوك للتحديث: `update-restart-auth`.
- سلوك مصدر السجل/الحزمة: fixture لـ `test:docker:plugins` أو خادم fixture لـ ClawHub.
- سلوك تخطيط الاعتماديات أو التنظيف: تحقّق من تنفيذ وقت التشغيل وحدود نظام الملفات معًا. قد تُرفع اعتماديات npm داخل مشروع npm المُدار الخاص بالـ plugin، لذلك يجب أن تثبت الاختبارات أن ذلك المشروع يُفحص ويُنظَّف بدل افتراض شجرة `node_modules` المحلية الخاصة بحزمة الـ plugin فقط.

اجعل fixtures الجديدة لـ Docker معزولة افتراضيًا. استخدم سجلات fixtures محلية
وحزمًا مزيفة إلا إذا كانت نقطة الاختبار هي سلوك السجل الحي.

## فرز الفشل

ابدأ بهوية الأثر:

- ملخص `resolve_package` لقبول الحزمة: المصدر، والإصدار، وSHA-256، واسم الأثر.
- آثار Docker: `.artifacts/docker-tests/**/summary.json`،
  و`failures.json`، وسجلات المسارات، وأوامر إعادة التشغيل.
- ملخص ناجي الترقية: `.artifacts/upgrade-survivor/summary.json`،
  بما في ذلك إصدار الأساس، وإصدار المرشح، والسيناريو، وتوقيتات المراحل، وخطوات الوصفة.

فضّل إعادة تشغيل المسار المحدد الفاشل باستخدام أثر الحزمة نفسه على
إعادة تشغيل مظلة الإصدار كاملة.
