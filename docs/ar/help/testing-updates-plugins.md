---
read_when:
    - تغيير سلوك تحديث OpenClaw أو الفحص التشخيصي أو قبول الحزمة أو تثبيت Plugin
    - إعداد مرشح إصدار أو الموافقة عليه
    - استكشاف أخطاء تحديث الحزمة، أو تنظيف تبعيات Plugin، أو انحدارات تثبيت Plugin وإصلاحها
sidebarTitle: Update and plugin tests
summary: كيف يتحقق OpenClaw من صحة مسارات التحديث وترحيلات الحزم وسلوك تثبيت/تحديث Plugin
title: 'الاختبار: التحديثات وPlugins'
x-i18n:
    generated_at: "2026-05-05T06:18:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

هذه قائمة التحقق المخصصة للتحقق من التحديث وPlugin. الهدف
بسيط: إثبات أن الحزمة القابلة للتثبيت تستطيع تحديث حالة المستخدم الحقيقية، وإصلاح
حالة legacy القديمة عبر `doctor`، وما زالت قادرة على تثبيت Plugins وتحميلها وتحديثها وإلغاء تثبيتها
من المصادر المدعومة.

لخريطة مشغل الاختبارات الأوسع، راجع [الاختبار](/ar/help/testing). ولمفاتيح مزودي الخدمة الحية
وحزم الاختبارات التي تلامس الشبكة، راجع [الاختبار المباشر](/ar/help/testing-live).

## ما نحميه

تحمي اختبارات التحديث وPlugin هذه العقود:

- ملف tarball للحزمة مكتمل، ويحتوي على `dist/postinstall-inventory.json` صالح،
  ولا يعتمد على ملفات مستودع غير مفكوكة.
- يمكن للمستخدم الانتقال من حزمة منشورة أقدم إلى الحزمة المرشحة
  دون فقدان الإعدادات أو الوكلاء أو الجلسات أو مساحات العمل أو قوائم سماح Plugin أو
  إعدادات القناة.
- يمتلك `openclaw doctor --fix --non-interactive` مسارات تنظيف وإصلاح legacy.
  يجب ألا ينمو بدء التشغيل ليضيف ترحيلات توافق مخفية لحالة Plugin قديمة.
- تعمل عمليات تثبيت Plugin من الأدلة المحلية، ومستودعات git، وحزم npm، ومسار
  سجل ClawHub.
- تُثبَّت تبعيات npm الخاصة بـPlugin في جذر npm المُدار، وتُفحص قبل
  الثقة، وتُزال عبر npm أثناء إلغاء التثبيت حتى لا تبقى التبعيات المرفوعة.
- يكون تحديث Plugin مستقرا عندما لا يتغير شيء: سجلات التثبيت، والمصدر المحلول،
  وتخطيط التبعيات المثبتة، وحالة التمكين تبقى سليمة.

## إثبات محلي أثناء التطوير

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

قبل أن يستهلك أي مسار Docker للحزمة ملف tarball، أثبت أثر الحزمة:

```bash
pnpm release:check
```

يشغّل `release:check` فحوص انجراف الإعدادات/الوثائق/API، ويكتب مخزون توزيع الحزمة،
ويشغّل `npm pack --dry-run`، ويرفض الملفات المحزومة المحظورة، ويثبت
ملف tarball في بادئة مؤقتة، ويشغّل postinstall، وينفذ اختبار smoke لنقاط دخول
القنوات المضمنة.

## مسارات Docker

مسارات Docker هي إثبات على مستوى المنتج. فهي تثبت أو تحدث حزمة حقيقية
داخل حاويات Linux وتتحقق من السلوك عبر أوامر CLI،
وبدء تشغيل Gateway، وفحوص HTTP، وحالة RPC، وحالة نظام الملفات.

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

- يتحقق `test:docker:plugins` من smoke لتثبيت Plugin، وتثبيت المجلد المحلي،
  وسلوك تخطي تحديث المجلد المحلي، والمجلدات المحلية ذات التبعيات
  المثبتة مسبقا، وتثبيت حزم `file:`، وتثبيت git مع تنفيذ CLI، وتحديثات
  المراجع المتحركة في git، وتثبيتات سجل npm ذات التبعيات الانتقالية
  المرفوعة، وعمليات npm update بلا تغيير، وتثبيتات fixture محلية لـClawHub وسلوك
  التحديث بلا تغيير، وسلوك تحديث السوق، وتمكين/فحص حزمة Claude. اضبط
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لإبقاء كتلة ClawHub محكمة/دون اتصال.
- يثبت `test:docker:plugin-lifecycle-matrix` الحزمة المرشحة في حاوية
  مجردة، ويشغّل Plugin من npm عبر التثبيت، والفحص، والتعطيل، والتمكين،
  والترقية الصريحة، والرجوع الصريح، وإلغاء التثبيت بعد حذف كود Plugin.
  ويسجل مقاييس RSS وCPU لكل مرحلة.
- يتحقق `test:docker:plugin-update` من أن Plugin المثبت غير المتغير
  لا يعاد تثبيته ولا يفقد بيانات التثبيت الوصفية أثناء `openclaw plugins update`.
- يثبت `test:docker:upgrade-survivor` ملف tarball المرشح فوق fixture
  مستخدم قديم متسخ، ويشغّل تحديث الحزمة بالإضافة إلى doctor غير تفاعلي، ثم يبدأ
  Gateway عبر loopback ويتحقق من حفظ الحالة.
- يثبت `test:docker:published-upgrade-survivor` أولا أساسا منشورا،
  ويكوّنه عبر وصفة `openclaw config set` مدمجة، ويحدثه إلى ملف
  tarball المرشح، ويشغّل doctor، ويتحقق من تنظيف legacy، ويبدأ Gateway، ويفحص
  `/healthz` و`/readyz` وحالة RPC.
- يثبت `test:docker:update-restart-auth` الحزمة المرشحة، ويبدأ Gateway
  مدار بمصادقة رمز، ويلغي ضبط متغيرات بيئة مصادقة gateway للمتصل من أجل
  `openclaw update --yes --json`، ويتطلب من أمر التحديث المرشح
  إعادة تشغيل Gateway قبل الفحوص العادية.
- `test:docker:update-migration` هو مسار التحديث المنشور كثيف التنظيف. يبدأ
  من حالة مستخدم مكونة بأسلوب Discord/Telegram، ويشغّل doctor الأساسي حتى
  تتاح فرصة لتبعيات Plugin المكونة أن تتجسد، ويزرع مخلفات تبعيات Plugin
  legacy لPlugin معبأ ومكوّن، ويحدث إلى ملف tarball المرشح،
  ويتطلب من doctor بعد التحديث إزالة جذور التبعيات legacy.

متغيرات مفيدة لمسار published-upgrade survivor:

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
يوسع `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` إلى كل السيناريوهات
المشكلة على هيئة بلاغات، بما في ذلك ترحيل تثبيت Plugin المكون.

ترحيل التحديث الكامل منفصل عمدا عن Full Release CI. استخدم سير العمل اليدوي
`Update Migration` عندما يكون سؤال الإصدار هو "هل تستطيع كل إصدارة مستقرة
منشورة منذ 2026.4.23 فصاعدا التحديث إلى هذا المرشح وتنظيف
مخلفات تبعيات Plugin؟":

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
إلى tarball باسم `package-under-test`، ويسجل الإصدار وSHA-256، ثم
يشغّل مسارات Docker E2E قابلة لإعادة الاستخدام ضد ذلك tarball بالضبط. مرجع حزام سير العمل
منفصل عن مرجع مصدر الحزمة، حتى يستطيع منطق الاختبار الحالي التحقق من
الإصدارات الموثوقة الأقدم.

مصادر المرشحين:

- `source=npm`: تحقق من `openclaw@beta` أو `openclaw@latest` أو إصدار
  منشور محدد.
- `source=ref`: حزّم فرعا أو وسمًا أو commit موثوقا مع الحزام الحالي
  المحدد.
- `source=url`: تحقق من tarball عبر HTTPS مع `package_sha256` المطلوب.
- `source=artifact`: أعد استخدام tarball مرفوع من تشغيل Actions آخر.

يستخدم Full Release Validation `source=artifact` افتراضيا، مبنيا من
SHA الإصدار المحلول. ولإثبات ما بعد النشر، مرر
`package_acceptance_package_spec=openclaw@YYYY.M.D` حتى تستهدف مصفوفة الترقية نفسها
حزمة npm المشحونة بدلا من ذلك.

تستدعي فحوص الإصدار قبول الحزمة مع مجموعة الحزمة/التحديث/إعادة التشغيل/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

عند تمكين نقع الإصدار، تمرر أيضا:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

يبقي هذا ترحيل الحزمة، وتبديل قناة التحديث، وتنظيف تبعيات Plugin القديمة،
وتغطية Plugin دون اتصال، وسلوك تحديث Plugin، وQA لحزمة Telegram
على الأثر المحلول نفسه دون جعل بوابة حزمة الإصدار الافتراضية
تمر على كل إصدار منشور.

يتحول `last-stable-4` إلى أحدث أربع إصدارات OpenClaw مستقرة منشورة على npm.
يثبت قبول حزمة الإصدار `2026.4.23` كأول حد توافق لتحديث Plugin،
و`2026.5.2` كحد اضطراب في معمارية Plugin، و
`2026.4.15` كأساس تحديث منشور أقدم من سلسلة 2026.4.1x؛ ويزيل المحلل
تكرار التثبيتات الموجودة بالفعل ضمن أحدث أربع. لتغطية شاملة لترحيل
التحديثات المنشورة، استخدم `all-since-2026.4.23` في سير عمل Update
Migration المنفصل بدلا من Full Release CI. يبقى `release-history`
متاحا لأخذ عينات يدوية أوسع عندما تريد أيضا مرساة legacy السابقة للتاريخ.

عند تحديد عدة أسس لمسار published-upgrade survivor، يقسم سير عمل Docker
القابل لإعادة الاستخدام كل أساس إلى مهمة runner مستهدفة خاصة به. ما زال كل
جزء أساس يشغّل مجموعة السيناريوهات المحددة، لكن السجلات والآثار تبقى
لكل أساس ويكون الوقت الجداري محدودا بأبطأ جزء بدلا من مهمة تسلسلية
كبيرة واحدة.

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

استخدم `suite_profile=product` عندما يشمل سؤال الإصدار قنوات MCP،
أو تنظيف cron/subagent، أو بحث الويب من OpenAI، أو OpenWebUI. استخدم `suite_profile=full`
فقط عندما تحتاج إلى تغطية كاملة لمسار إصدار Docker.

## الافتراضي للإصدار

بالنسبة إلى مرشحي الإصدار، حزمة الإثبات الافتراضية هي:

1. `pnpm check:changed` و`pnpm test:changed` لانحدارات مستوى المصدر.
2. `pnpm release:check` لسلامة أثر الحزمة.
3. ملف تعريف `package` في قبول الحزمة أو مسارات الحزمة المخصصة في فحص الإصدار
   لعقود التثبيت/التحديث/إعادة التشغيل/Plugin.
4. فحوص إصدار عبر أنظمة التشغيل لسلوك المثبت والتأهيل والمنصة
   الخاص بكل نظام تشغيل.
5. الحزم المباشرة فقط عندما يلامس السطح المتغير سلوك مزود الخدمة أو
   الخدمة المستضافة.

على أجهزة المشرفين، يجب تشغيل البوابات الواسعة وإثبات منتج Docker/الحزمة
في Testbox ما لم يكن الهدف صراحة إثباتا محليا.

## توافق legacy

تساهل التوافق ضيق ومحدد زمنيا:

- يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، تحمل
  فجوات بيانات وصفية للحزمة سبق شحنها في قبول الحزمة.
- قد تحذر حزمة `2026.4.26` المنشورة من ملفات ختم بيانات وصفية للبناء المحلي
  سبق شحنها.
- يجب أن تستوفي الحزم اللاحقة العقود الحديثة. تفشل الفجوات نفسها بدلا من
  التحذير أو التخطي.

لا تضف ترحيلات بدء تشغيل جديدة لهذه الأشكال القديمة. أضف أو وسع إصلاح doctor،
ثم أثبته عبر `upgrade-survivor` أو `published-upgrade-survivor` أو
`update-restart-auth` عندما يكون أمر التحديث مالكا لإعادة التشغيل.

## إضافة تغطية

عند تغيير سلوك التحديث أو Plugin، أضف تغطية في أدنى طبقة
يمكن أن تفشل للسبب الصحيح:

- منطق مسار أو بيانات وصفية خالص: اختبار وحدة بجانب المصدر.
- سلوك مخزون الحزمة أو الملفات المحزومة: اختبار `package-dist-inventory` أو
  فاحص tarball.
- سلوك تثبيت/تحديث CLI: تأكيد أو fixture لمسار Docker.
- سلوك ترحيل إصدار منشور: سيناريو `published-upgrade-survivor`.
- سلوك إعادة التشغيل المملوك للتحديث: `update-restart-auth`.
- سلوك مصدر السجل/الحزمة: fixture في `test:docker:plugins` أو خادم fixture
  لـClawHub.
- سلوك تخطيط التبعيات أو تنظيفها: تحقق من تنفيذ وقت التشغيل ومن حد
  نظام الملفات معا. قد تُرفع تبعيات npm تحت جذر npm المُدار،
  لذلك يجب أن تثبت الاختبارات أن الجذر يُفحص/ينظف بدلا من افتراض شجرة
  `node_modules` محلية للحزمة.

اجعل fixtures الجديدة لـDocker محكمة افتراضيا. استخدم سجلات fixtures محلية
وحزما زائفة ما لم يكن الهدف من الاختبار هو سلوك السجل المباشر.

## فرز الفشل

ابدأ بهوية الأثر:

- ملخص قبول الحزمة `resolve_package`: المصدر، والإصدار، وSHA-256، واسم
  المخرج.
- مخرجات Docker: `.artifacts/docker-tests/**/summary.json`،
  `failures.json`، وسجلات المسارات، وأوامر إعادة التشغيل.
- ملخص الصمود بعد الترقية: `.artifacts/upgrade-survivor/summary.json`،
  بما في ذلك إصدار خط الأساس، والإصدار المرشح، والسيناريو، وتوقيتات المراحل،
  وخطوات الوصفة.

فضّل إعادة تشغيل المسار الدقيق الفاشل باستخدام مخرج الحزمة نفسه على
إعادة تشغيل مظلة الإصدار بالكامل.
