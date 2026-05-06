---
read_when:
    - تغيير سلوك تحديث OpenClaw أو الفحص أو قبول الحزم أو تثبيت Plugin
    - إعداد مرشح إصدار أو الموافقة عليه
    - تصحيح أخطاء تحديث الحزمة، أو تنظيف تبعيات Plugin، أو تراجعات تثبيت Plugin
sidebarTitle: Update and plugin tests
summary: كيف يتحقق OpenClaw من مسارات التحديث وترحيلات الحزم وسلوك تثبيت/تحديث Plugin
title: 'الاختبار: التحديثات وPlugins'
x-i18n:
    generated_at: "2026-05-06T07:58:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

هذه هي قائمة التحقق المخصصة للتحقق من التحديثات وPlugin. الهدف
بسيط: إثبات أن الحزمة القابلة للتثبيت يمكنها تحديث حالة المستخدم الحقيقية، وإصلاح
الحالة القديمة المتقادمة عبر `doctor`، وما زالت تستطيع تثبيت وتحميل وتحديث وإلغاء تثبيت
plugins من المصادر المدعومة.

لخريطة مشغل الاختبارات الأوسع، راجع [الاختبار](/ar/help/testing). لمفاتيح المزوّد الحية
والحزم التي تلامس الشبكة، راجع [الاختبار الحي](/ar/help/testing-live).

## ما نحميه

تحمي اختبارات التحديث وPlugin هذه العقود:

- ملف tarball الخاص بالحزمة مكتمل، ويحتوي على `dist/postinstall-inventory.json` صالح،
  ولا يعتمد على ملفات مستودع غير مفكوكة.
- يمكن للمستخدم الانتقال من حزمة منشورة أقدم إلى الحزمة المرشحة
  من دون فقدان الإعدادات أو الوكلاء أو الجلسات أو مساحات العمل أو قوائم السماح الخاصة بـPlugin أو
  إعدادات القنوات.
- يملك `openclaw doctor --fix --non-interactive` مسارات التنظيف والإصلاح
  القديمة. يجب ألا يضيف بدء التشغيل ترحيلات توافق مخفية لحالة Plugin المتقادمة.
- تعمل عمليات تثبيت Plugin من الأدلة المحلية، ومستودعات git، وحزم npm، ومسار
  سجل ClawHub.
- تُثبّت اعتماديات npm الخاصة بـPlugin في جذر npm المُدار، وتُفحص قبل
  الثقة، وتُزال عبر npm أثناء إلغاء التثبيت حتى لا تبقى الاعتماديات المرفوعة.
- يكون تحديث Plugin مستقراً عندما لا يتغير شيء: تظل سجلات التثبيت، والمصدر
  المحلول، وتخطيط الاعتماديات المثبتة، وحالة التفعيل سليمة.

## الإثبات المحلي أثناء التطوير

ابدأ بنطاق ضيق:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

لتغييرات تثبيت Plugin أو إلغاء تثبيته أو اعتمادياته أو مخزون الحزمة، شغّل أيضاً
الاختبارات المركزة التي تغطي نقطة التماس المعدلة:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

قبل أن يستهلك أي مسار Docker خاص بالحزمة ملف tarball، أثبت أثر الحزمة:

```bash
pnpm release:check
```

يشغّل `release:check` فحوصات انجراف الإعدادات/الوثائق/API، ويكتب مخزون توزيع الحزمة،
ويشغّل `npm pack --dry-run`، ويرفض الملفات الممنوعة داخل الحزمة، ويثبّت
ملف tarball في بادئة مؤقتة، ويشغّل postinstall، ويفحص مداخل القنوات المضمّنة.

## مسارات Docker

مسارات Docker هي الإثبات على مستوى المنتج. فهي تثبّت أو تحدّث حزمة حقيقية
داخل حاويات Linux وتتحقق من السلوك عبر أوامر CLI،
وبدء تشغيل Gateway، وفحوصات HTTP، وحالة RPC، وحالة نظام الملفات.

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

المسارات المهمة:

- يتحقق `test:docker:plugins` من فحص تثبيت Plugin، وتثبيت المجلدات المحلية،
  وسلوك تخطي تحديث المجلد المحلي، والمجلدات المحلية ذات
  الاعتماديات المثبتة مسبقاً، وتثبيت حزم `file:`، وتثبيتات git مع تنفيذ CLI، وتحديثات
  المراجع المتحركة في git، وتثبيتات سجل npm مع اعتماديات انتقالية
  مرفوعة، وعمليات تحديث npm التي لا تغيّر شيئاً، وتثبيتات تجهيزات ClawHub المحلية وعمليات التحديث
  التي لا تغيّر شيئاً، وسلوك تحديث السوق، وتمكين/فحص حزمة Claude. اضبط
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` لإبقاء كتلة ClawHub محكمة/دون اتصال.
- يثبّت `test:docker:plugin-lifecycle-matrix` الحزمة المرشحة في حاوية
  فارغة، ويشغّل Plugin من npm عبر التثبيت، والفحص، والتعطيل، والتمكين،
  والترقية الصريحة، والرجوع الصريح، وإلغاء التثبيت بعد حذف كود Plugin.
  ويسجل مقاييس RSS وCPU لكل مرحلة.
- يتحقق `test:docker:plugin-update` من أن Plugin مثبتاً غير متغير
  لا يُعاد تثبيته ولا يفقد بيانات التثبيت الوصفية أثناء `openclaw plugins update`.
- يثبّت `test:docker:upgrade-survivor` ملف tarball المرشح فوق تجهيز مستخدم قديم
  متسخ، ويشغّل تحديث الحزمة بالإضافة إلى doctor غير تفاعلي، ثم يبدأ
  Gateway على local loopback ويفحص حفظ الحالة.
- يثبّت `test:docker:published-upgrade-survivor` أولاً خط أساس منشوراً،
  ويعدّه عبر وصفة `openclaw config set` مخبوزة، ويحدّثه إلى
  ملف tarball المرشح، ويشغّل doctor، ويفحص التنظيف القديم، ويبدأ Gateway، ويفحص
  `/healthz` و`/readyz` وحالة RPC.
- يثبّت `test:docker:update-restart-auth` الحزمة المرشحة، ويبدأ
  Gateway مداراً بمصادقة الرمز، ويلغي تعيين متغيرات بيئة مصادقة Gateway للمتصل من أجل
  `openclaw update --yes --json`، ويتطلب من أمر تحديث المرشح
  إعادة تشغيل Gateway قبل الفحوصات العادية.
- `test:docker:update-migration` هو مسار تحديث منشور كثيف التنظيف. يبدأ
  من حالة مستخدم معدة بنمط Discord/Telegram، ويشغّل doctor لخط الأساس حتى تتاح
  لاعتماديات Plugin المهيأة فرصة التحقق، ويزرع بقايا اعتماديات Plugin قديمة
  لـPlugin حزمة مهيأة، ويحدّث إلى
  ملف tarball المرشح، ويتطلب من doctor بعد التحديث إزالة جذور
  الاعتماديات القديمة.

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
و`stale-source-plugin-shadow` و`tilde-log-path` و`versioned-runtime-deps`. في التشغيلات التجميعية،
يتوسع `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` إلى كل السيناريوهات
ذات شكل المشكلات المبلغ عنها، بما في ذلك ترحيل تثبيت Plugin المهيأ.

يبقى ترحيل التحديث الكامل منفصلاً عمداً عن Full Release CI. استخدم سير العمل
اليدوي `Update Migration` عندما يكون سؤال الإصدار هو "هل يمكن لكل
إصدار مستقر منشور من 2026.4.23 فصاعداً التحديث إلى هذا المرشح
وتنظيف بقايا اعتماديات Plugin؟":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance هي بوابة الحزمة الأصلية في GitHub. فهي تحل حزمة مرشحة واحدة
إلى ملف tarball باسم `package-under-test`، وتسجل الإصدار وSHA-256، ثم
تشغّل مسارات Docker E2E القابلة لإعادة الاستخدام على ملف tarball ذلك بالضبط. يكون مرجع
حاضنة سير العمل منفصلاً عن مرجع مصدر الحزمة، بحيث يمكن لمنطق الاختبار الحالي التحقق من
الإصدارات الموثوقة الأقدم.

مصادر المرشحين:

- `source=npm`: التحقق من `openclaw@beta` أو `openclaw@latest` أو إصدار
  منشور محدد بدقة.
- `source=ref`: حزم فرع أو وسم أو commit موثوق باستخدام الحاضنة الحالية
  المختارة.
- `source=url`: التحقق من ملف tarball عبر HTTPS مع `package_sha256` المطلوب.
- `source=artifact`: إعادة استخدام ملف tarball مرفوع بواسطة تشغيل Actions آخر.

تستخدم Full Release Validation `source=artifact` افتراضياً، مبنياً من
SHA الإصدار المحلول. لإثبات ما بعد النشر، مرّر
`package_acceptance_package_spec=openclaw@YYYY.M.D` حتى تستهدف مصفوفة الترقية نفسها
حزمة npm المشحونة بدلاً من ذلك.

تستدعي فحوصات الإصدار Package Acceptance بمجموعة الحزمة/التحديث/إعادة التشغيل/Plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

عند تمكين نقع الإصدار، تمرر أيضاً:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

يبقي هذا ترحيل الحزمة، وتبديل قناة التحديث، وتحمل Plugin مُدار تالف،
وتنظيف اعتماديات Plugin المتقادمة، وتغطية Plugin دون اتصال، وسلوك تحديث
Plugin، وضمان جودة حزمة Telegram على الأثر المحلول نفسه من دون
جعل بوابة حزمة الإصدار الافتراضية تمر على كل إصدار منشور.

يُحل `last-stable-4` إلى أحدث أربعة إصدارات مستقرة من OpenClaw منشورة على npm.
تثبت Package Acceptance الخاصة بالإصدار `2026.4.23` كأول حد توافق لتحديث Plugin،
و`2026.5.2` كحد اضطراب في بنية Plugin، و`2026.4.15` كخط أساس تحديث منشور
أقدم من سلسلة 2026.4.1x؛ ويزيل المحلل تكرار التثبيتات الموجودة أصلاً ضمن أحدث أربعة. لتغطية
ترحيل التحديث المنشور بشكل شامل، استخدم `all-since-2026.4.23` في سير عمل Update
Migration المنفصل بدلاً من Full Release CI. يظل `release-history`
متاحاً لأخذ عينات يدوية أوسع عندما تريد أيضاً مرساة التاريخ القديم السابق.

عند اختيار عدة خطوط أساس لمسار published-upgrade survivor، يقسم سير عمل
Docker القابل لإعادة الاستخدام كل خط أساس إلى مهمة مشغّل مستهدفة خاصة به. لا يزال
كل جزء من خط الأساس يشغّل مجموعة السيناريوهات المختارة، لكن السجلات والآثار تبقى
لكل خط أساس ويكون زمن الجدار محدوداً بأبطأ جزء بدلاً من مهمة تسلسلية كبيرة واحدة.

شغّل ملف تعريف حزمة يدوياً عند التحقق من مرشح قبل الإصدار:

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
أو تنظيف cron/subagent، أو بحث الويب في OpenAI، أو OpenWebUI. استخدم `suite_profile=full`
فقط عندما تحتاج إلى تغطية كاملة لمسار إصدار Docker.

## الإعداد الافتراضي للإصدار

بالنسبة لمرشحي الإصدار، تكون مكدسة الإثبات الافتراضية:

1. `pnpm check:changed` و`pnpm test:changed` لاكتشاف تراجعات مستوى المصدر.
2. `pnpm release:check` للتحقق من سلامة أثر الحزمة.
3. ملف تعريف Package Acceptance `package` أو مسارات الحزمة المخصصة لفحص الإصدار
   لعقود التثبيت/التحديث/إعادة التشغيل/Plugin.
4. فحوصات الإصدار عبر أنظمة التشغيل لسلوك المثبت والإعداد والمنصة
   الخاص بكل نظام تشغيل.
5. الحزم الحية فقط عندما يلامس السطح المتغير سلوك المزوّد أو الخدمة
   المستضافة.

على أجهزة المشرفين، يجب تشغيل البوابات الواسعة وإثبات المنتج الخاص بـDocker/الحزمة
في Testbox ما لم يكن الإثبات المحلي مطلوباً صراحة.

## التوافق القديم

التساهل في التوافق ضيق ومحدد زمنياً:

- يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، تحمل
  فجوات بيانات وصفية للحزمة مشحونة بالفعل في Package Acceptance.
- قد تحذر حزمة `2026.4.26` المنشورة بشأن ملفات ختم بيانات وصفية للبناء المحلي
  شُحنت بالفعل.
- يجب أن تستوفي الحزم اللاحقة العقود الحديثة. تفشل الفجوات نفسها بدلاً من
  التحذير أو التخطي.

لا تضف ترحيلات بدء تشغيل جديدة لهذه الأشكال القديمة. أضف أو وسّع إصلاح doctor،
ثم أثبته باستخدام `upgrade-survivor` أو `published-upgrade-survivor` أو
`update-restart-auth` عندما يملك أمر التحديث إعادة التشغيل.

## إضافة التغطية

عند تغيير سلوك التحديث أو Plugin، أضف التغطية في أدنى طبقة
يمكن أن تفشل للسبب الصحيح:

- منطق المسار أو البيانات الوصفية البحت: اختبار وحدة بجانب المصدر.
- سلوك مخزون الحزمة أو الملفات المعبأة: اختبار `package-dist-inventory` أو أداة فحص tarball.
- سلوك تثبيت/تحديث CLI: تأكيد أو تجهيز في مسار Docker.
- سلوك ترحيل إصدار منشور: سيناريو `published-upgrade-survivor`.
- سلوك إعادة التشغيل المملوك للتحديث: `update-restart-auth`.
- سلوك مصدر السجل/الحزمة: تجهيز `test:docker:plugins` أو خادم تجهيز
  ClawHub.
- سلوك تخطيط الاعتماديات أو التنظيف: تحقق من تنفيذ وقت التشغيل وحدود
  نظام الملفات معاً. قد تُرفع اعتماديات npm تحت جذر npm
  المُدار، لذلك يجب أن تثبت الاختبارات أن الجذر يُفحص/يُنظف بدلاً من افتراض شجرة
  `node_modules` محلية للحزمة.

أبقِ تجهيزات Docker الجديدة محكمة افتراضياً. استخدم سجلات تجهيز محلية
وحزماً وهمية ما لم يكن الهدف من الاختبار هو سلوك السجل الحي.

## فرز الفشل

ابدأ بهوية الأثر:

- ملخص قبول الحزمة `resolve_package`: المصدر، والإصدار، وSHA-256، واسم
  المُخرج.
- مخرجات Docker: `.artifacts/docker-tests/**/summary.json`،
  و`failures.json`، وسجلات المسارات، وأوامر إعادة التشغيل.
- ملخص الناجي من الترقية: `.artifacts/upgrade-survivor/summary.json`،
  بما في ذلك إصدار خط الأساس، والإصدار المرشح، والسيناريو، وتوقيتات المراحل، و
  خطوات الوصفة.

فضّل إعادة تشغيل المسار المحدد الفاشل بالمُخرج نفسه للحزمة على
إعادة تشغيل مظلة الإصدار كاملة.
