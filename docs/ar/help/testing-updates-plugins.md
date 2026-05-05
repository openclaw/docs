---
read_when:
    - تغيير سلوك تحديث OpenClaw أو الفحص التشخيصي أو قبول الحزمة أو تثبيت Plugin
    - إعداد مرشح إصدار أو الموافقة عليه
    - تصحيح أخطاء تحديث الحزمة أو تنظيف تبعيات Plugin أو تراجعات تثبيت Plugin
sidebarTitle: Update and plugin tests
summary: كيف يتحقق OpenClaw من صحة مسارات التحديث، وترحيلات الحزم، وسلوك تثبيت/تحديث Plugin
title: 'الاختبار: التحديثات والإضافات'
x-i18n:
    generated_at: "2026-05-05T01:48:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

هذه هي قائمة التحقق المخصصة للتحقق من التحديث وPlugin. الهدف
بسيط: إثبات أن الحزمة القابلة للتثبيت يمكنها تحديث حالة المستخدم الحقيقية، وإصلاح
الحالة القديمة المتقادمة عبر `doctor`، ولا تزال قادرة على تثبيت Plugins وتحميلها وتحديثها وإلغاء تثبيتها
من المصادر المدعومة.

لخريطة مشغل الاختبارات الأوسع، راجع [الاختبار](/ar/help/testing). لمفاتيح المزوّدين المباشرة
ومجموعات الاختبار التي تلامس الشبكة، راجع [الاختبار المباشر](/ar/help/testing-live).

## ما نحميه

تحمي اختبارات التحديث وPlugin هذه العقود:

- أرشيف tarball للحزمة مكتمل، ويحتوي على `dist/postinstall-inventory.json` صالح،
  ولا يعتمد على ملفات مستودع غير مفكوكة.
- يستطيع المستخدم الانتقال من حزمة منشورة أقدم إلى الحزمة المرشحة
  دون فقدان الإعدادات أو الوكلاء أو الجلسات أو مساحات العمل أو قوائم السماح لـPlugin أو
  إعدادات القنوات.
- يملك `openclaw doctor --fix --non-interactive` مسارات التنظيف والإصلاح
  القديمة. يجب ألا يضيف بدء التشغيل عمليات ترحيل توافق مخفية لحالة
  Plugin المتقادمة.
- تعمل عمليات تثبيت Plugin من الأدلة المحلية ومستودعات git وحزم npm ومسار
  سجل ClawHub.
- تُثبّت اعتماديات npm الخاصة بـPlugin في جذر npm المُدار، وتُفحص قبل
  الوثوق بها، وتُزال عبر npm أثناء إلغاء التثبيت حتى لا تبقى الاعتماديات المرفوعة.
- يكون تحديث Plugin مستقرًا عندما لا يتغير شيء: تبقى سجلات التثبيت والمصدر
  المحلول وتخطيط الاعتماديات المثبتة وحالة التمكين سليمة.

## إثبات محلي أثناء التطوير

ابدأ بنطاق ضيق:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

بالنسبة إلى تغييرات تثبيت Plugin أو إلغاء تثبيته أو الاعتماديات أو مخزون الحزمة، شغّل أيضًا
الاختبارات المركزة التي تغطي نقطة التماس المعدّلة:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

قبل أن يستهلك أي مسار Docker خاص بالحزمة أرشيف tarball، أثبت أثر الحزمة:

```bash
pnpm release:check
```

يشغّل `release:check` فحوص انحراف الإعدادات/المستندات/API، ويكتب مخزون توزيع الحزمة،
ويشغّل `npm pack --dry-run`، ويرفض الملفات المحزومة المحظورة، ويثبت
أرشيف tarball في بادئة مؤقتة، ويشغّل postinstall، وينفذ اختبار smoke لنقاط دخول
القنوات المضمّنة.

## مسارات Docker

مسارات Docker هي الإثبات على مستوى المنتج. فهي تثبت أو تحدّث حزمة حقيقية
داخل حاويات Linux وتتحقق من السلوك عبر أوامر CLI وبدء تشغيل Gateway
وفحوص HTTP وحالة RPC وحالة نظام الملفات.

استخدم المسارات المركزة أثناء التكرار:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

مسارات مهمة:

- يتحقق `test:docker:plugins` من smoke لتثبيت Plugin، وتثبيت المجلدات المحلية،
  وسلوك تخطي تحديث المجلدات المحلية، والمجلدات المحلية ذات الاعتماديات
  المثبتة مسبقًا، وتثبيت حزم `file:`، وتثبيت git مع تنفيذ CLI، وتحديثات المراجع المتحركة في git، وتثبيتات سجل npm مع الاعتماديات الانتقالية
  المرفوعة، وعمليات npm update التي لا تفعل شيئًا، وتثبيتات مثبتات ClawHub المحلية وعمليات التحديث
  التي لا تفعل شيئًا، وسلوك تحديث السوق، وتمكين/فحص Claude-bundle. اضبط
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لإبقاء كتلة ClawHub محكمة/بلا اتصال.
- يثبت `test:docker:plugin-lifecycle-matrix` الحزمة المرشحة في حاوية
  خالية، ويشغّل npm Plugin عبر التثبيت والفحص والتعطيل والتمكين
  والترقية الصريحة والرجوع الصريح إلى إصدار أقدم وإلغاء التثبيت بعد حذف كود Plugin.
  ويسجل مقاييس RSS وCPU لكل مرحلة.
- يتحقق `test:docker:plugin-update` من أن Plugin مثبتًا لم يتغير
  لا يُعاد تثبيته ولا يفقد بيانات تعريف التثبيت أثناء `openclaw plugins update`.
- يثبت `test:docker:upgrade-survivor` أرشيف tarball المرشح فوق مثبت
  مستخدم قديم متسخ، ويشغّل تحديث الحزمة بالإضافة إلى doctor غير تفاعلي، ثم يبدأ
  Gateway بحلقة رجوع ويفحص حفظ الحالة.
- يثبت `test:docker:published-upgrade-survivor` أولًا خط أساس منشورًا،
  ويهيئه عبر وصفة `openclaw config set` مخبوزة، ثم يحدثه إلى
  أرشيف tarball المرشح، ويشغّل doctor، ويتحقق من التنظيف القديم، ويبدأ Gateway، ويفحص
  `/healthz` و`/readyz` وحالة RPC.
- `test:docker:update-migration` هو مسار التحديث المنشور كثيف التنظيف. يبدأ
  من حالة مستخدم مهيأة على نمط Discord/Telegram، ويشغّل doctor على خط الأساس
  حتى تتاح لاعتماديات Plugin المهيأة فرصة الظهور، ويزرع
  بقايا اعتماديات Plugin قديمة لـPlugin حزمة مهيأ، ثم يحدث إلى
  أرشيف tarball المرشح، ويتطلب من doctor بعد التحديث إزالة جذور
  الاعتماديات القديمة.

متغيرات مفيدة لناجي الترقية المنشورة:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

السيناريوهات المتاحة هي `base` و`feishu-channel` و`bootstrap-persona` و
`plugin-deps-cleanup` و`configured-plugin-installs` و
`stale-source-plugin-shadow` و`tilde-log-path` و`versioned-runtime-deps`. في التشغيلات المجمعة،
يتوسع `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` إلى كل السيناريوهات
المشكلة على هيئة بلاغات، بما في ذلك ترحيل تثبيت Plugin المهيأ.

يكون ترحيل التحديث الكامل منفصلًا عمدًا عن CI للإصدار الكامل. استخدم
سير عمل `Update Migration` اليدوي عندما يكون سؤال الإصدار هو "هل يمكن لكل
إصدار مستقر منشور منذ 2026.4.23 وما بعده التحديث إلى هذا المرشح و
تنظيف بقايا اعتماديات Plugin؟":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## قبول الحزمة

قبول الحزمة هو بوابة الحزمة الأصلية في GitHub. وهي تحل حزمة مرشحة واحدة
إلى أرشيف tarball باسم `package-under-test`، وتسجل الإصدار وSHA-256، ثم
تشغّل مسارات Docker E2E القابلة لإعادة الاستخدام ضد أرشيف tarball نفسه. يكون مرجع حاضنة
سير العمل منفصلًا عن مرجع مصدر الحزمة، بحيث يمكن لمنطق الاختبار الحالي التحقق من
الإصدارات الموثوقة الأقدم.

مصادر المرشحين:

- `source=npm`: تحقق من `openclaw@beta` أو `openclaw@latest` أو إصدار
  منشور محدد بدقة.
- `source=ref`: احزم فرعًا أو وسمًا أو commit موثوقًا باستخدام الحاضنة الحالية
  المحددة.
- `source=url`: تحقق من أرشيف tarball عبر HTTPS مع `package_sha256` مطلوب.
- `source=artifact`: أعد استخدام أرشيف tarball رُفع بواسطة تشغيل Actions آخر.

يستخدم التحقق الكامل من الإصدار `source=artifact` افتراضيًا، مبنيًا من
SHA الإصدار المحلول. لإثبات ما بعد النشر، مرّر
`package_acceptance_package_spec=openclaw@YYYY.M.D` حتى تستهدف مصفوفة الترقية نفسها
حزمة npm المشحونة بدلًا من ذلك.

تستدعي فحوص الإصدار قبول الحزمة مع مجموعة الحزمة/التحديث/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

وتمرّر أيضًا:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

يبقي هذا ترحيل الحزمة وتبديل قناة التحديث وتنظيف اعتماديات Plugin المتقادمة
وتغطية Plugin بلا اتصال وسلوك تحديث Plugin وضمان جودة حزمة Telegram
على الأثر المحلول نفسه.

`all-since-2026.4.23` هي عينة ترقية CI للإصدار الكامل: كل إصدار مستقر منشور على npm من `2026.4.23` حتى `latest`. لتغطية ترحيل التحديث المنشور
بشكل شامل، استخدم `all-since-2026.4.23` في سير عمل Update
Migration المنفصل بدلًا من CI للإصدار الكامل. يبقى `release-history`
متاحًا لأخذ عينات يدوية أوسع عندما تريد أيضًا مرساة ما قبل التاريخ القديمة.

شغّل ملف تعريف حزمة يدويًا عند التحقق من مرشح قبل الإصدار:

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

استخدم `suite_profile=product` عندما يتضمن سؤال الإصدار قنوات MCP أو
تنظيف cron/subagent أو بحث OpenAI على الويب أو OpenWebUI. استخدم `suite_profile=full`
فقط عندما تحتاج إلى تغطية كاملة لمسار إصدار Docker.

## الافتراضي للإصدار

بالنسبة إلى مرشحي الإصدار، يكون مكدس الإثبات الافتراضي هو:

1. `pnpm check:changed` و`pnpm test:changed` لانحدارات مستوى المصدر.
2. `pnpm release:check` لسلامة أثر الحزمة.
3. ملف تعريف قبول الحزمة `package` أو مسارات الحزمة المخصصة لفحص الإصدار
   لعقود التثبيت/التحديث/Plugin.
4. فحوص الإصدار عبر أنظمة التشغيل لسلوك المثبت والإعداد الأولي والمنصة
   الخاص بنظام التشغيل.
5. مجموعات الاختبار المباشرة فقط عندما يلامس السطح المتغير سلوك مزوّد أو خدمة مستضافة.

على أجهزة المشرفين، يجب تشغيل البوابات الواسعة وإثبات منتج Docker/الحزمة
في Testbox ما لم يكن يجري إثبات محلي صراحةً.

## التوافق القديم

تساهل التوافق ضيق ومحدد زمنيًا:

- قد تتسامح الحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`،
  مع فجوات بيانات تعريف الحزمة التي شُحنت بالفعل في قبول الحزمة.
- قد تحذر حزمة `2026.4.26` المنشورة بشأن ملفات ختم بيانات تعريف البناء المحلي
  التي شُحنت بالفعل.
- يجب أن تفي الحزم اللاحقة بالعقود الحديثة. تفشل الفجوات نفسها بدلًا من
  التحذير أو التخطي.

لا تضف عمليات ترحيل بدء تشغيل جديدة لهذه الأشكال القديمة. أضف أو وسّع إصلاح doctor
ثم أثبته باستخدام `upgrade-survivor` أو `published-upgrade-survivor`.

## إضافة تغطية

عند تغيير سلوك التحديث أو Plugin، أضف تغطية في أدنى طبقة
يمكن أن تفشل للسبب الصحيح:

- منطق المسارات أو بيانات التعريف الصرف: اختبار وحدة بجانب المصدر.
- مخزون الحزمة أو سلوك الملفات المحزومة: `package-dist-inventory` أو اختبار
  فاحص tarball.
- سلوك تثبيت/تحديث CLI: تأكيد أو مثبت لمسار Docker.
- سلوك ترحيل الإصدارات المنشورة: سيناريو `published-upgrade-survivor`.
- سلوك مصدر السجل/الحزمة: مثبت `test:docker:plugins` أو خادم مثبتات ClawHub.
- سلوك تخطيط الاعتماديات أو التنظيف: أكد كلًا من تنفيذ وقت التشغيل وحدود
  نظام الملفات. قد تُرفع اعتماديات npm تحت جذر npm المُدار، لذلك يجب أن تثبت الاختبارات
  أن الجذر يُفحص/يُنظف بدلًا من افتراض شجرة `node_modules` محلية للحزمة.

أبق مثبتات Docker الجديدة محكمة افتراضيًا. استخدم سجلات مثبتات محلية
وحزمًا مزيفة ما لم يكن هدف الاختبار هو سلوك السجل المباشر.

## فرز الإخفاقات

ابدأ بهوية الأثر:

- ملخص `resolve_package` في قبول الحزمة: المصدر والإصدار وSHA-256 و
  اسم الأثر.
- آثار Docker: `.artifacts/docker-tests/**/summary.json` و
  `failures.json` وسجلات المسار وأوامر إعادة التشغيل.
- ملخص ناجي الترقية: `.artifacts/upgrade-survivor/summary.json`،
  بما في ذلك إصدار خط الأساس وإصدار المرشح والسيناريو وتوقيتات المراحل و
  خطوات الوصفة.

فضّل إعادة تشغيل المسار الدقيق الفاشل مع أثر الحزمة نفسه على
إعادة تشغيل مظلة الإصدار كلها.
