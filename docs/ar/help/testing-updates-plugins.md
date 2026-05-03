---
read_when:
    - تغيير سلوك تحديث OpenClaw أو doctor أو قبول الحزمة أو تثبيت Plugin
    - إعداد مرشّح إصدار أو اعتماده
    - تصحيح أخطاء تحديث الحزمة أو تنظيف تبعيات Plugin أو تراجعات تثبيت Plugin
sidebarTitle: Update and plugin tests
summary: كيفية تحقّق OpenClaw من مسارات التحديث وترحيلات الحزم وسلوك تثبيت/تحديث Plugin
title: 'الاختبار: التحديثات وPlugins'
x-i18n:
    generated_at: "2026-05-03T21:36:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

هذه هي قائمة التحقق المخصصة للتحقق من التحديث وPlugin. الهدف
بسيط: إثبات أن الحزمة القابلة للتثبيت يمكنها تحديث حالة مستخدم حقيقية، وإصلاح
الحالة القديمة المتقادمة عبر `doctor`، وأنها ما زالت قادرة على تثبيت
Plugins وتحميلها وتحديثها وإلغاء تثبيتها من المصادر المدعومة.

للاطلاع على خريطة مشغّل الاختبارات الأوسع، راجع [الاختبار](/ar/help/testing). ولمفاتيح
المزوّدين الحية ومجموعات الاختبار التي تلامس الشبكة، راجع [الاختبار الحي](/ar/help/testing-live).

## ما نحميه

تحمي اختبارات التحديث وPlugin هذه العقود:

- حزمة tarball مكتملة، ولديها `dist/postinstall-inventory.json` صالح،
  ولا تعتمد على ملفات مستودع غير مفكوكة.
- يستطيع المستخدم الانتقال من حزمة منشورة أقدم إلى الحزمة المرشحة
  من دون فقدان الإعدادات أو الوكلاء أو الجلسات أو مساحات العمل أو قوائم السماح للـPlugin أو
  إعدادات القنوات.
- يمتلك `openclaw doctor --fix --non-interactive` مسارات التنظيف والإصلاح
  القديمة. ينبغي ألا يوسّع بدء التشغيل ترحيلات توافق مخفية لحالة
  Plugin متقادمة.
- تعمل تثبيتات Plugin من الأدلة المحلية، ومستودعات git، وحزم npm، ومسار
  سجل ClawHub.
- تُثبّت تبعيات npm الخاصة بالـPlugin في جذر npm المُدار، وتُفحص قبل
  الثقة، وتُزال عبر npm أثناء إلغاء التثبيت حتى لا تبقى التبعيات المرفوعة.
- تحديث Plugin مستقر عندما لا يتغير شيء: تبقى سجلات التثبيت، والمصدر
  المحلول، وتخطيط التبعيات المثبتة، وحالة التمكين سليمة.

## إثبات محلي أثناء التطوير

ابدأ بنطاق ضيق:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

لتغييرات تثبيت Plugin أو إلغاء تثبيته أو تبعياته أو مخزون الحزمة، شغّل أيضًا
الاختبارات المركّزة التي تغطي موضع التعديل:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

قبل أن يستهلك أي مسار Docker خاص بالحزمة tarball، أثبت أثر الحزمة:

```bash
pnpm release:check
```

يشغّل `release:check` فحوصات انجراف الإعدادات/الوثائق/API، ويكتب مخزون
توزيع الحزمة، ويشغّل `npm pack --dry-run`، ويرفض الملفات المحزومة المحظورة، ويثبت
tarball في بادئة مؤقتة، ويشغّل postinstall، ويجري اختبار smoke لنقاط دخول
القنوات المضمنة.

## مسارات Docker

مسارات Docker هي الإثبات على مستوى المنتج. فهي تثبّت أو تحدّث حزمة حقيقية
داخل حاويات Linux وتؤكد السلوك عبر أوامر CLI،
وبدء تشغيل Gateway، وفحوصات HTTP، وحالة RPC، وحالة نظام الملفات.

استخدم المسارات المركّزة أثناء التكرار:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

المسارات المهمة:

- يتحقق `test:docker:plugins` من smoke تثبيت Plugin، وتثبيتات المجلدات المحلية،
  وسلوك تخطي تحديث المجلد المحلي، والمجلدات المحلية ذات
  التبعيات المثبتة مسبقًا، وتثبيتات حزم `file:`، وتثبيتات git مع تنفيذ CLI، وتحديثات
  المراجع المتحركة في git، وتثبيتات سجل npm مع تبعيات انتقالية مرفوعة،
  وعمليات تحديث npm التي لا تفعل شيئًا، وتثبيتات fixture المحلية لـClawHub وعمليات التحديث
  التي لا تفعل شيئًا، وسلوك تحديث marketplace، وتمكين/فحص حزمة Claude. اضبط
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لإبقاء كتلة ClawHub معزولة/دون اتصال.
- يثبّت `test:docker:plugin-lifecycle-matrix` الحزمة المرشحة في حاوية
  مجردة، ويشغّل Plugin من npm عبر التثبيت والفحص والتعطيل والتمكين
  والترقية الصريحة والرجوع الصريح وإلغاء التثبيت بعد حذف كود Plugin.
  ويسجّل مقاييس RSS وCPU لكل مرحلة.
- يتحقق `test:docker:plugin-update` من أن Plugin المثبت غير المتغير لا
  يعاد تثبيته ولا يفقد بيانات تعريف التثبيت أثناء `openclaw plugins update`.
- يثبّت `test:docker:upgrade-survivor` tarball المرشح فوق fixture مستخدم قديم
  متسخ، ويشغّل تحديث الحزمة مع doctor غير تفاعلي، ثم يبدأ
  Gateway عبر local loopback ويفحص حفظ الحالة.
- يثبّت `test:docker:published-upgrade-survivor` أولًا خط أساس منشورًا،
  ويضبطه عبر وصفة `openclaw config set` مضمّنة، ثم يحدّثه إلى
  tarball المرشح، ويشغّل doctor، ويفحص التنظيف القديم، ويبدأ Gateway، ويفحص
  `/healthz` و`/readyz` وحالة RPC.
- `test:docker:update-migration` هو مسار التحديث المنشور الثقيل في التنظيف. يبدأ
  من حالة مستخدم مهيأة بأسلوب Discord/Telegram، ويشغّل doctor لخط الأساس حتى
  تتاح لتبعيات Plugin المضبوطة فرصة الظهور، ويبذر بقايا تبعيات Plugin قديمة
  لـPlugin محزّم مهيأ، ويحدّث إلى tarball المرشح، ويتطلب من doctor بعد التحديث
  إزالة جذور التبعيات القديمة.

متغيرات مفيدة لمسار survivor للترقية المنشورة:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

السيناريوهات المتاحة هي `base` و`feishu-channel` و`bootstrap-persona` و
`plugin-deps-cleanup` و`configured-plugin-installs` و`tilde-log-path` و
`versioned-runtime-deps`. في التشغيلات التجميعية،
يتوسع `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` إلى كل السيناريوهات
المشكّلة كبلاغات مشكلات، بما في ذلك ترحيل تثبيت Plugin المهيأ.

تُفصل ترحيلات التحديث الكاملة عمدًا عن Full Release CI. استخدم سير العمل
اليدوي `Update Migration` عندما يكون سؤال الإصدار هو "هل يمكن لكل
إصدار مستقر منشور من 2026.4.23 فصاعدًا التحديث إلى هذا المرشح وتنظيف
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

قبول الحزمة هو بوابة الحزمة الأصلية في GitHub. فهو يحل حزمة مرشحة واحدة
إلى tarball باسم `package-under-test`، ويسجّل الإصدار وSHA-256، ثم
يشغّل مسارات Docker E2E قابلة لإعادة الاستخدام ضد تلك الـtarball نفسها. مرجع عدة
سير العمل منفصل عن مرجع مصدر الحزمة، لذلك يمكن لمنطق الاختبار الحالي التحقق من
إصدارات موثوقة أقدم.

مصادر المرشحين:

- `source=npm`: تحقق من `openclaw@beta` أو `openclaw@latest` أو إصدار
  منشور محدد.
- `source=ref`: احزم فرعًا أو وسمًا أو commit موثوقًا باستخدام عدة الاختبار
  الحالية المحددة.
- `source=url`: تحقق من tarball عبر HTTPS مع `package_sha256` المطلوب.
- `source=artifact`: أعد استخدام tarball رُفعت بواسطة تشغيل Actions آخر.

يستخدم Full Release Validation `source=artifact` افتراضيًا، مبنيًا من
SHA الإصدار المحلول. ولإثبات ما بعد النشر، مرّر
`package_acceptance_package_spec=openclaw@YYYY.M.D` حتى تستهدف مصفوفة الترقية نفسها
حزمة npm المشحونة بدلًا من ذلك.

تستدعي فحوصات الإصدار قبول الحزمة مع مجموعة الحزمة/التحديث/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

وتمرر أيضًا:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

يبقي هذا ترحيل الحزمة، وتبديل قناة التحديث، وتنظيف تبعيات Plugin المتقادمة،
وتغطية Plugin دون اتصال، وسلوك تحديث Plugin، وQA لحزمة Telegram على الأثر
المحلول نفسه.

`all-since-2026.4.23` هي عينة ترقية Full Release CI: كل إصدار npm مستقر منشور من `2026.4.23` حتى `latest`. لتغطية شاملة لترحيل التحديث المنشور، استخدم `all-since-2026.4.23` في سير عمل Update Migration المنفصل بدلًا من Full Release CI. يظل `release-history`
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

استخدم `suite_profile=product` عندما يتضمن سؤال الإصدار قنوات MCP،
أو تنظيف cron/subagent، أو بحث الويب من OpenAI، أو OpenWebUI. استخدم `suite_profile=full`
فقط عندما تحتاج إلى تغطية كاملة لمسار إصدار Docker.

## الافتراضي للإصدار

بالنسبة إلى مرشحي الإصدار، تكون حزمة الإثبات الافتراضية:

1. `pnpm check:changed` و`pnpm test:changed` للانحدارات على مستوى المصدر.
2. `pnpm release:check` لسلامة أثر الحزمة.
3. ملف تعريف قبول الحزمة `package` أو مسارات الحزمة المخصصة في فحص الإصدار
   لعقود التثبيت/التحديث/Plugin.
4. فحوصات الإصدار عبر أنظمة التشغيل لسلوك المثبّت والإعداد الأولي والمنصة
   الخاص بكل نظام تشغيل.
5. مجموعات الاختبار الحية فقط عندما يلامس السطح المتغير سلوك المزوّد أو
   الخدمة المستضافة.

على أجهزة المشرفين، ينبغي تشغيل البوابات الواسعة وإثبات المنتج الخاص بـDocker/الحزمة
في Testbox ما لم يكن المقصود صراحةً إثباتًا محليًا.

## التوافق القديم

تسامح التوافق ضيق ومحدد زمنيًا:

- قد تتسامح الحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`،
  مع فجوات بيانات تعريف الحزمة المشحونة بالفعل في قبول الحزمة.
- قد تحذّر حزمة `2026.4.26` المنشورة من ملفات ختم بيانات تعريف البناء المحلية
  المشحونة بالفعل.
- يجب أن تستوفي الحزم اللاحقة العقود الحديثة. تفشل الفجوات نفسها بدلًا من
  التحذير أو التخطي.

لا تضف ترحيلات بدء تشغيل جديدة لهذه الأشكال القديمة. أضف إصلاح doctor
أو وسّعه، ثم أثبته باستخدام `upgrade-survivor` أو `published-upgrade-survivor`.

## إضافة تغطية

عند تغيير سلوك التحديث أو Plugin، أضف تغطية في أدنى طبقة يمكن أن
تفشل للسبب الصحيح:

- منطق المسارات أو بيانات التعريف الصرفة: اختبار وحدة بجانب المصدر.
- سلوك مخزون الحزمة أو الملفات المحزومة: اختبار `package-dist-inventory` أو مدقق
  tarball.
- سلوك التثبيت/التحديث عبر CLI: تأكيد أو fixture في مسار Docker.
- سلوك ترحيل الإصدار المنشور: سيناريو `published-upgrade-survivor`.
- سلوك مصدر السجل/الحزمة: fixture في `test:docker:plugins` أو خادم fixture
  لـClawHub.
- سلوك تخطيط التبعيات أو التنظيف: أكد كلًا من تنفيذ وقت التشغيل وحدود
  نظام الملفات. قد تُرفع تبعيات npm تحت جذر npm المُدار، لذلك ينبغي أن تثبت
  الاختبارات أن الجذر يُفحص/يُنظف بدلًا من افتراض شجرة `node_modules` محلية للحزمة.

أبقِ fixtures الجديدة لـDocker معزولة افتراضيًا. استخدم سجلات fixtures محلية
وحزمًا مزيفة ما لم تكن نقطة الاختبار هي سلوك السجل الحي.

## فرز الفشل

ابدأ بهوية الأثر:

- ملخص `resolve_package` في قبول الحزمة: المصدر، والإصدار، وSHA-256، و
  اسم الأثر.
- آثار Docker: `.artifacts/docker-tests/**/summary.json` و
  `failures.json` وسجلات المسارات وأوامر إعادة التشغيل.
- ملخص survivor للترقية: `.artifacts/upgrade-survivor/summary.json`،
  بما في ذلك إصدار خط الأساس، وإصدار المرشح، والسيناريو، وتوقيتات المراحل، و
  خطوات الوصفة.

فضّل إعادة تشغيل المسار المحدد الفاشل باستخدام أثر الحزمة نفسه على
إعادة تشغيل مظلة الإصدار كاملة.
