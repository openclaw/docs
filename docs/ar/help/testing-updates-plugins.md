---
read_when:
    - تغيير سلوك تحديث OpenClaw أو doctor أو قبول الحزمة أو تثبيت Plugin
    - إعداد مرشح إصدار أو الموافقة عليه
    - استكشاف أخطاء تحديث الحزمة أو تنظيف تبعيات Plugin أو تراجعات تثبيت Plugin وإصلاحها
sidebarTitle: Update and plugin tests
summary: كيفية تحقق OpenClaw من مسارات التحديث، وترحيلات الحزم، وسلوك تثبيت/تحديث Plugin
title: 'الاختبار: التحديثات وPlugins'
x-i18n:
    generated_at: "2026-05-02T07:32:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

هذه هي قائمة التحقق المخصصة للتحقق من التحديثات وPlugin. الهدف
بسيط: إثبات أن الحزمة القابلة للتثبيت يمكنها تحديث حالة المستخدم الحقيقية، وإصلاح
الحالة القديمة المتقادمة عبر `doctor`، والاستمرار في تثبيت Plugin وتحميلها وتحديثها وإلغاء
تثبيتها من المصادر المدعومة.

لخريطة مشغل الاختبارات الأوسع، راجع [الاختبار](/ar/help/testing). لمفاتيح المزوّدين الحية
والحزم التي تلمس الشبكة، راجع [الاختبار الحي](/ar/help/testing-live).

## ما نحميه

تحمي اختبارات التحديث وPlugin هذه العقود:

- تكون حزمة tarball مكتملة، وتحتوي على `dist/postinstall-inventory.json` صالح،
  ولا تعتمد على ملفات مستودع غير مفكوكة.
- يمكن للمستخدم الانتقال من حزمة منشورة أقدم إلى الحزمة المرشحة
  دون فقدان الإعدادات، أو الوكلاء، أو الجلسات، أو مساحات العمل، أو قوائم السماح لـPlugin، أو
  إعدادات القنوات.
- يمتلك `openclaw doctor --fix --non-interactive` مسارات التنظيف والإصلاح
  القديمة. يجب ألا يضيف بدء التشغيل ترحيلات توافق مخفية لحالة
  Plugin المتقادمة.
- تعمل عمليات تثبيت Plugin من الأدلة المحلية، ومستودعات git، وحزم npm، ومسار
  سجل ClawHub.
- تُثبَّت تبعيات npm الخاصة بـPlugin في جذر npm المدار، وتُفحص قبل
  الثقة، وتُزال عبر npm أثناء إلغاء التثبيت حتى لا تبقى التبعيات المرفوعة.
- يكون تحديث Plugin مستقراً عندما لا يتغير شيء: تبقى سجلات التثبيت، والمصدر
  المحلول، وتخطيط التبعيات المثبتة، وحالة التمكين سليمة.

## إثبات محلي أثناء التطوير

ابدأ بنطاق ضيق:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

لتغييرات تثبيت Plugin أو إلغاء تثبيتها أو تبعياتها أو مخزون الحزم، شغّل أيضاً
الاختبارات المركزة التي تغطي نقطة الربط المعدلة:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

قبل أن يستهلك أي مسار Docker خاص بالحزم tarball، أثبت سلامة أثر الحزمة:

```bash
pnpm release:check
```

يشغّل `release:check` فحوصات انجراف الإعدادات/الوثائق/API، ويكتب مخزون توزيع
الحزمة، ويشغّل `npm pack --dry-run`، ويرفض الملفات المحزومة المحظورة، ويثبّت
tarball في بادئة مؤقتة، ويشغّل postinstall، وينفذ اختبارات smoke لنقاط دخول
القنوات المضمّنة.

## مسارات Docker

مسارات Docker هي الإثبات على مستوى المنتج. فهي تثبّت أو تحدّث حزمة حقيقية
داخل حاويات Linux وتتحقق من السلوك عبر أوامر CLI، وبدء تشغيل Gateway، وفحوصات HTTP،
وحالة RPC، وحالة نظام الملفات.

استخدم المسارات المركزة أثناء التكرار:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

المسارات المهمة:

- يتحقق `test:docker:plugins` من smoke لتثبيت Plugin، وتثبيت المجلدات المحلية،
  وسلوك تخطي تحديث المجلدات المحلية، والمجلدات المحلية ذات التبعيات
  المثبتة مسبقاً، وتثبيت حزم `file:`، وتثبيت git مع تنفيذ CLI، وتحديثات
  المراجع المتحركة في git، وتثبيت سجل npm مع التبعيات الانتقالية المرفوعة،
  وعمليات تحديث npm دون تغيير، وتثبيت تجهيزات ClawHub المحلية وعمليات التحديث
  دون تغيير، وسلوك تحديث marketplace، وتمكين/فحص حزمة Claude. اضبط
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لإبقاء كتلة ClawHub مغلقة ومعزولة دون اتصال.
- يتحقق `test:docker:plugin-update` من أن Plugin مثبتاً لم يتغير لا يُعاد
  تثبيته ولا يفقد بيانات التثبيت الوصفية أثناء `openclaw plugins update`.
- يثبّت `test:docker:upgrade-survivor` tarball المرشح فوق تجهيز مستخدم قديم
  متسخ، ويشغّل تحديث الحزمة بالإضافة إلى doctor غير تفاعلي، ثم يبدأ Gateway عبر
  local loopback ويتحقق من الحفاظ على الحالة.
- يثبّت `test:docker:published-upgrade-survivor` أولاً خط أساس منشوراً،
  ويضبطه عبر وصفة `openclaw config set` مخبوزة، ويحدّثه إلى tarball
  المرشح، ويشغّل doctor، ويفحص تنظيف الحالة القديمة، ويبدأ Gateway، ويفحص
  `/healthz` و`/readyz` وحالة RPC.
- `test:docker:update-migration` هو مسار التحديث المنشور كثيف التنظيف. يبدأ
  من حالة مستخدم مضبوطة بنمط Discord/Telegram، ويشغّل doctor لخط الأساس حتى
  تتاح لتبعيات Plugin المضبوطة فرصة الظهور، ويزرع مخلفات تبعيات Plugin
  قديمة لـPlugin محزوم مضبوط، ويحدّث إلى tarball المرشح، ويتطلب من doctor
  بعد التحديث إزالة جذور التبعيات القديمة.

متغيرات مفيدة لمسار published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

السيناريوهات المتاحة هي `base`، و`feishu-channel`، و`bootstrap-persona`،
و`plugin-deps-cleanup`، و`tilde-log-path`، و`versioned-runtime-deps`. في التشغيلات المجمعة،
يتوسع `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` إلى كل السيناريوهات
المشكلة على هيئة بلاغات.

ترحيل التحديث الكامل منفصل عمداً عن Full Release CI. استخدم سير العمل اليدوي
`Update Migration` عندما يكون سؤال الإصدار هو "هل يمكن لكل إصدار مستقر منشور
من 2026.4.23 فصاعداً التحديث إلى هذا المرشح وتنظيف مخلفات تبعيات Plugin؟":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## قبول الحزمة

Package Acceptance هي بوابة الحزمة الأصلية في GitHub. فهي تحل حزمة مرشحة واحدة
إلى tarball باسم `package-under-test`، وتسجل الإصدار وSHA-256، ثم
تشغّل مسارات Docker E2E قابلة لإعادة الاستخدام ضد ذلك tarball نفسه. يكون مرجع
حاضنة سير العمل منفصلاً عن مرجع مصدر الحزمة، حتى يستطيع منطق الاختبار الحالي التحقق من
الإصدارات الموثوقة الأقدم.

مصادر المرشحين:

- `source=npm`: تحقق من `openclaw@beta` أو `openclaw@latest` أو إصدار
  منشور محدد بدقة.
- `source=ref`: حزم فرع أو وسم أو التزام موثوق باستخدام الحاضنة الحالية
  المختارة.
- `source=url`: تحقق من tarball عبر HTTPS مع `package_sha256` مطلوب.
- `source=artifact`: أعد استخدام tarball رُفع بواسطة تشغيل Actions آخر.

تستدعي فحوصات الإصدار Package Acceptance مع مجموعة الحزمة/التحديث/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

وتمرر أيضاً:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

يبقي هذا ترحيل الحزمة، وتبديل قناة التحديث، وتنظيف تبعيات Plugin المتقادمة،
وتغطية Plugin دون اتصال، وسلوك تحديث Plugin، وQA لحزمة Telegram على الأثر
المحلول نفسه.

`release-history` هي عينة محدودة لفحص الإصدار: أحدث ستة إصدارات مستقرة،
و`2026.4.23`، ونقطة ارتساء أقدم قبل ذلك التاريخ. لتغطية ترحيل التحديث المنشور
بشكل شامل، استخدم `all-since-2026.4.23` في سير عمل Update Migration المنفصل
بدلاً من Full Release CI.

شغّل ملف تعريف حزمة يدوياً عند التحقق من مرشح قبل الإصدار:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

استخدم `suite_profile=product` عندما يشمل سؤال الإصدار قنوات MCP،
أو تنظيف cron/subagent، أو بحث الويب من OpenAI، أو OpenWebUI. استخدم `suite_profile=full`
فقط عندما تحتاج إلى تغطية كاملة لمسار إصدار Docker.

## الإعداد الافتراضي للإصدار

بالنسبة إلى مرشحي الإصدار، تكون مجموعة الإثبات الافتراضية هي:

1. `pnpm check:changed` و`pnpm test:changed` لانحدارات مستوى المصدر.
2. `pnpm release:check` لسلامة أثر الحزمة.
3. ملف تعريف Package Acceptance `package` أو مسارات الحزمة المخصصة في فحص الإصدار
   لعقود التثبيت/التحديث/Plugin.
4. فحوصات الإصدار عبر أنظمة التشغيل للسلوك الخاص بالمثبت، والتهيئة الأولية، والمنصة.
5. الحزم الحية فقط عندما يلمس السطح المتغير سلوك المزوّد أو الخدمة المستضافة.

على أجهزة المشرفين، يجب تشغيل البوابات العريضة وإثبات منتج Docker/الحزمة
في Testbox إلا عند إجراء إثبات محلي صراحة.

## التوافق القديم

التسامح في التوافق ضيق ومحدد زمنياً:

- قد تتسامح الحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، مع
  فجوات بيانات الحزمة الوصفية المنشورة بالفعل في Package Acceptance.
- قد تحذر حزمة `2026.4.26` المنشورة من ملفات ختم بيانات وصفية للبناء المحلي
  سبق شحنها.
- يجب أن تستوفي الحزم اللاحقة العقود الحديثة. تفشل الفجوات نفسها بدلاً من
  التحذير أو التخطي.

لا تضف ترحيلات بدء تشغيل جديدة لهذه الأشكال القديمة. أضف إصلاح doctor أو وسّعه،
ثم أثبته عبر `upgrade-survivor` أو `published-upgrade-survivor`.

## إضافة التغطية

عند تغيير سلوك التحديث أو Plugin، أضف التغطية في أدنى طبقة
يمكن أن تفشل للسبب الصحيح:

- منطق المسارات أو البيانات الوصفية البحت: اختبار وحدة بجانب المصدر.
- سلوك مخزون الحزمة أو الملفات المحزومة: اختبار `package-dist-inventory` أو مدقق tarball.
- سلوك تثبيت/تحديث CLI: تأكيد أو تجهيز في مسار Docker.
- سلوك ترحيل إصدار منشور: سيناريو `published-upgrade-survivor`.
- سلوك مصدر السجل/الحزمة: تجهيز `test:docker:plugins` أو خادم تجهيز ClawHub.
- سلوك تخطيط التبعيات أو تنظيفها: تحقق من تنفيذ وقت التشغيل وحدود
  نظام الملفات كليهما. قد تُرفع تبعيات npm تحت جذر npm المدار، لذا يجب أن تثبت
  الاختبارات أن الجذر يُفحص/يُنظف بدلاً من افتراض شجرة `node_modules` محلية للحزمة.

أبقِ تجهيزات Docker الجديدة معزولة افتراضياً. استخدم سجلات تجهيز محلية
وحزماً وهمية إلا إذا كان الهدف من الاختبار هو سلوك السجل الحي.

## فرز الأعطال

ابدأ بهوية الأثر:

- ملخص `resolve_package` في Package Acceptance: المصدر، والإصدار، وSHA-256، واسم
  الأثر.
- آثار Docker: `.artifacts/docker-tests/**/summary.json`،
  و`failures.json`، وسجلات المسارات، وأوامر إعادة التشغيل.
- ملخص Upgrade survivor: `.artifacts/upgrade-survivor/summary.json`،
  بما في ذلك إصدار خط الأساس، وإصدار المرشح، والسيناريو، وتوقيتات المراحل، وخطوات
  الوصفة.

فضّل إعادة تشغيل المسار الدقيق الفاشل مع أثر الحزمة نفسه على
إعادة تشغيل مظلة الإصدار بالكامل.
