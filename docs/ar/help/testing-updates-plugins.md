---
read_when:
    - تغيير سلوك تحديث OpenClaw أو doctor أو قبول الحزمة أو تثبيت Plugin
    - إعداد مرشح إصدار أو الموافقة عليه
    - استكشاف تراجعات تحديث الحزمة أو تنظيف تبعيات Plugin أو تثبيت Plugin وإصلاحها
sidebarTitle: Update and plugin tests
summary: كيف يتحقق OpenClaw من صحة مسارات التحديث وترحيلات الحزم وسلوك تثبيت/تحديث Plugin
title: 'الاختبار: التحديثات وPlugins'
x-i18n:
    generated_at: "2026-05-02T20:48:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

هذه قائمة التحقق المخصصة للتحقق من التحديث وPlugin. الهدف
بسيط: إثبات أن الحزمة القابلة للتثبيت تستطيع تحديث حالة المستخدم الحقيقية، وإصلاح
الحالة القديمة المتقادمة عبر `doctor`، ولا تزال قادرة على تثبيت Plugin وتحميلها وتحديثها وإلغاء تثبيتها
من المصادر المدعومة.

للاطلاع على خريطة مشغل الاختبارات الأوسع، راجع [الاختبار](/ar/help/testing). ولمفاتيح الموفر
الحية ومجموعات الاختبار التي تلامس الشبكة، راجع [الاختبار الحي](/ar/help/testing-live).

## ما نحميه

تحمي اختبارات التحديث وPlugin هذه العقود:

- ملف tarball للحزمة مكتمل، ويحتوي على `dist/postinstall-inventory.json` صالح،
  ولا يعتمد على ملفات repo غير المفكوكة.
- يستطيع المستخدم الانتقال من حزمة منشورة أقدم إلى الحزمة المرشحة
  دون فقدان الإعدادات أو الوكلاء أو الجلسات أو مساحات العمل أو قوائم السماح لـPlugin أو
  إعدادات القنوات.
- يتولى `openclaw doctor --fix --non-interactive` مسارات التنظيف والإصلاح
  القديمة. يجب ألا يضيف بدء التشغيل عمليات ترحيل توافق مخفية لحالة
  Plugin المتقادمة.
- تعمل تثبيتات Plugin من الأدلة المحلية، ومستودعات git، وحزم npm، ومسار
  سجل ClawHub.
- تُثبّت تبعيات npm الخاصة بـPlugin في جذر npm المُدار، وتُفحص قبل
  الثقة، وتُزال عبر npm أثناء إلغاء التثبيت حتى لا تبقى التبعيات المرفوعة.
- يكون تحديث Plugin مستقراً عندما لا يتغير شيء: تبقى سجلات التثبيت، والمصدر
  المحلول، وتخطيط التبعيات المثبتة، وحالة التمكين كما هي.

## الإثبات المحلي أثناء التطوير

ابدأ بشكل ضيق:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

لتغييرات تثبيت Plugin أو إلغاء تثبيتها أو تبعياتها أو جرد الحزمة، شغّل أيضاً
الاختبارات المركزة التي تغطي الحد المعدل:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

قبل أن يستهلك أي مسار Docker خاص بالحزمة ملف tarball، أثبت صلاحية أثر الحزمة:

```bash
pnpm release:check
```

يشغّل `release:check` فحوصات انجراف الإعدادات/الوثائق/API، ويكتب جرد توزيع الحزمة،
ويشغّل `npm pack --dry-run`، ويرفض الملفات المحزمة المحظورة، ويثبت
ملف tarball في بادئة مؤقتة، ويشغّل postinstall، وينفذ فحص دخان لنقاط دخول
القنوات المضمّنة.

## مسارات Docker

مسارات Docker هي إثبات مستوى المنتج. إنها تثبت حزمة حقيقية أو تحدثها
داخل حاويات Linux وتتحقق من السلوك عبر أوامر CLI،
وبدء تشغيل Gateway، ومجسات HTTP، وحالة RPC، وحالة نظام الملفات.

استخدم المسارات المركزة أثناء التكرار:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

المسارات المهمة:

- يتحقق `test:docker:plugins` من فحص دخان تثبيت Plugin، وتثبيتات المجلدات المحلية،
  وسلوك تخطي تحديث المجلد المحلي، والمجلدات المحلية ذات التبعيات المثبتة مسبقاً،
  وتثبيتات حزم `file:`، وتثبيتات git مع تنفيذ CLI، وتحديثات مراجع git المتحركة،
  وتثبيتات سجل npm مع التبعيات العابرة المرفوعة، وعمليات تحديث npm التي لا تغيّر شيئاً،
  وتثبيتات تجهيز ClawHub المحلي وعمليات التحديث التي لا تغيّر شيئاً، وسلوك تحديث السوق،
  وتمكين/فحص حزمة Claude. اضبط
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لإبقاء كتلة ClawHub محكمة/دون اتصال.
- يتحقق `test:docker:plugin-update` من أن Plugin مثبتاً لم يتغير
  لا يُعاد تثبيته ولا يفقد بيانات تعريف التثبيت أثناء `openclaw plugins update`.
- يثبت `test:docker:upgrade-survivor` ملف tarball المرشح فوق تجهيز مستخدم قديم
  متسخ، ويشغّل تحديث الحزمة مع doctor غير تفاعلي، ثم يبدأ
  Gateway عبر local loopback ويفحص الحفاظ على الحالة.
- يثبت `test:docker:published-upgrade-survivor` أولاً أساساً منشوراً،
  ويعدّه عبر وصفة `openclaw config set` مخبوزة، ويحدّثه إلى
  ملف tarball المرشح، ويشغّل doctor، ويفحص تنظيف القديم، ويبدأ Gateway، ويفحص
  `/healthz` و`/readyz` وحالة RPC.
- `test:docker:update-migration` هو مسار التحديث المنشور كثيف التنظيف. يبدأ
  من حالة مستخدم معدة بنمط Discord/Telegram، ويشغّل doctor الأساسي حتى تتاح
  لتبعيات Plugin المعدة فرصة التحقق، ويزرع بقايا تبعيات Plugin قديمة
  لـPlugin محزم معد، ثم يحدّث إلى ملف tarball المرشح، ويتطلب من doctor
  بعد التحديث إزالة جذور التبعيات القديمة.

متغيرات مفيدة لناجي الترقية المنشورة:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

السيناريوهات المتاحة هي `base` و`feishu-channel` و`bootstrap-persona`،
و`plugin-deps-cleanup` و`configured-plugin-installs` و`tilde-log-path` و
`versioned-runtime-deps`. في التشغيلات التجميعية،
يوسع `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` إلى كل السيناريوهات
ذات شكل البلاغات المبلغ عنها، بما في ذلك ترحيل تثبيت Plugin المعد.

يُفصل ترحيل التحديث الكامل عمداً عن Full Release CI. استخدم سير العمل
اليدوي `Update Migration` عندما يكون سؤال الإصدار هو "هل تستطيع كل
إصدارات stable المنشورة من 2026.4.23 فصاعداً التحديث إلى هذا المرشح
وتنظيف بقايا تبعيات Plugin؟":

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
يشغّل مسارات Docker E2E القابلة لإعادة الاستخدام مقابل ملف tarball نفسه. مرجع حاضنة سير العمل
منفصل عن مرجع مصدر الحزمة، حتى يتمكن منطق الاختبار الحالي من التحقق من
الإصدارات الموثوقة الأقدم.

مصادر المرشح:

- `source=npm`: تحقق من `openclaw@beta` أو `openclaw@latest` أو إصدار
  منشور محدد.
- `source=ref`: حزّم فرعاً أو وسماً أو التزاماً موثوقاً باستخدام الحاضنة الحالية
  المحددة.
- `source=url`: تحقق من ملف tarball عبر HTTPS مع `package_sha256` مطلوب.
- `source=artifact`: أعد استخدام ملف tarball مرفوع من تشغيل Actions آخر.

يستخدم Full Release Validation `source=artifact` افتراضياً، مبنياً من
SHA الإصدار المحلول. لإثبات ما بعد النشر، مرر
`package_acceptance_package_spec=openclaw@YYYY.M.D` حتى تستهدف مصفوفة الترقية نفسها
حزمة npm المشحونة بدلاً من ذلك.

تستدعي فحوصات الإصدار Package Acceptance بمجموعة الحزمة/التحديث/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

وتمرر أيضاً:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

هذا يبقي ترحيل الحزمة، وتبديل قناة التحديث، وتنظيف تبعيات Plugin المتقادمة،
وتغطية Plugin دون اتصال، وسلوك تحديث Plugin، وضمان جودة حزمة Telegram
على الأثر المحلول نفسه.

`all-since-2026.4.23` هي عينة ترقية Full Release CI: كل إصدار stable منشور على npm من `2026.4.23` حتى `latest`. لتغطية شاملة لترحيل
التحديث المنشور، استخدم `all-since-2026.4.23` في سير عمل Update
Migration المنفصل بدلاً من Full Release CI. يظل `release-history`
متاحاً لأخذ عينات يدوية أوسع عندما تريد أيضاً مرساة التاريخ الأقدم القديمة.

شغّل ملف تعريف حزمة يدوياً عند التحقق من مرشح قبل الإصدار:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

استخدم `suite_profile=product` عندما يتضمن سؤال الإصدار قنوات MCP،
أو تنظيف cron/الوكلاء الفرعيين، أو بحث الويب من OpenAI، أو OpenWebUI. استخدم `suite_profile=full`
فقط عندما تحتاج إلى تغطية كاملة لمسار إصدار Docker.

## الافتراضي للإصدار

بالنسبة لمرشحي الإصدار، تكون حزمة الإثبات الافتراضية هي:

1. `pnpm check:changed` و`pnpm test:changed` لانحدارات مستوى المصدر.
2. `pnpm release:check` لسلامة أثر الحزمة.
3. ملف تعريف Package Acceptance `package` أو مسارات الحزمة المخصصة لفحوصات الإصدار
   لعقود التثبيت/التحديث/Plugin.
4. فحوصات الإصدار عبر أنظمة التشغيل للمثبت الخاص بكل نظام تشغيل، والإعداد الأولي، وسلوك
   المنصة.
5. المجموعات الحية فقط عندما يمس السطح المعدل سلوك الموفر أو الخدمة المستضافة.

على أجهزة المشرفين، يجب تشغيل البوابات الواسعة وإثبات منتج Docker/الحزمة
في Testbox ما لم يكن الإثبات المحلي مقصوداً صراحة.

## التوافق القديم

التسامح في التوافق ضيق ومحدد زمنياً:

- قد تتسامح الحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`،
  مع فجوات بيانات تعريف الحزمة المشحونة بالفعل في Package Acceptance.
- قد تحذر حزمة `2026.4.26` المنشورة من ملفات ختم بيانات تعريف البناء المحلي
  التي شُحنت بالفعل.
- يجب أن تفي الحزم اللاحقة بالعقود الحديثة. تفشل الفجوات نفسها بدلاً من
  التحذير أو التخطي.

لا تضف عمليات ترحيل بدء تشغيل جديدة لهذه الأشكال القديمة. أضف أو وسّع إصلاح doctor،
ثم أثبته عبر `upgrade-survivor` أو `published-upgrade-survivor`.

## إضافة التغطية

عند تغيير سلوك التحديث أو Plugin، أضف التغطية في أدنى طبقة
يمكن أن تفشل للسبب الصحيح:

- منطق المسار أو بيانات التعريف الصرف: اختبار وحدة بجانب المصدر.
- سلوك جرد الحزمة أو الملفات المحزمة: اختبار `package-dist-inventory` أو فاحص
  tarball.
- سلوك تثبيت/تحديث CLI: تأكيد أو تجهيز مسار Docker.
- سلوك ترحيل إصدار منشور: سيناريو `published-upgrade-survivor`.
- سلوك مصدر السجل/الحزمة: تجهيز `test:docker:plugins` أو خادم تجهيز
  ClawHub.
- سلوك تخطيط التبعيات أو تنظيفها: تحقق من تنفيذ وقت التشغيل وحدود
  نظام الملفات معاً. قد تُرفع تبعيات npm تحت جذر npm
  المُدار، لذلك يجب أن تثبت الاختبارات أن الجذر يُفحص/يُنظف بدلاً من افتراض
  شجرة `node_modules` محلية للحزمة.

أبقِ تجهيزات Docker الجديدة محكمة افتراضياً. استخدم سجلات تجهيز محلية
وحزماً مزيفة ما لم تكن نقطة الاختبار هي سلوك السجل الحي.

## فرز الفشل

ابدأ بهوية الأثر:

- ملخص Package Acceptance `resolve_package`: المصدر، والإصدار، وSHA-256، و
  اسم الأثر.
- آثار Docker: `.artifacts/docker-tests/**/summary.json`,
  و`failures.json`، وسجلات المسارات، وأوامر إعادة التشغيل.
- ملخص ناجي الترقية: `.artifacts/upgrade-survivor/summary.json`,
  بما في ذلك إصدار الأساس، وإصدار المرشح، والسيناريو، وتوقيتات المراحل، وخطوات
  الوصفة.

فضّل إعادة تشغيل المسار الدقيق الفاشل باستخدام أثر الحزمة نفسه على
إعادة تشغيل مظلة الإصدار كلها.
