---
read_when:
    - شرح ما هو ClawHub
    - البحث عن Skills أو Plugins وتثبيتها أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - الاختيار بين تدفقات CLI في openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وCLI الخاص بـ clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T18:13:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لمهارات OpenClaw وPlugins.

- استخدم أوامر `openclaw` الأصلية للبحث عن المهارات وتثبيتها وتحديثها، ولتثبيت Plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لمصادقة السجل والنشر وسير عمل الحذف/إلغاء الحذف.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن المهارات وثبّتها باستخدام OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

ابحث عن Plugins وثبّتها باستخدام OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ثبّت CLI الخاص بـ ClawHub عندما تريد سير عمل يتطلب مصادقة السجل، مثل
النشر أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح          | ما يخزنه                                                     | الأمر المعتاد                                |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | حزم نصية ذات إصدارات تحتوي على `SKILL.md` بالإضافة إلى ملفات داعمة | `openclaw skills install @openclaw/demo`     |
| Plugins برمجية | حزم Plugin لـ OpenClaw مع بيانات وصفية للتوافق              | `openclaw plugins install clawhub:<package>` |
| Plugins حزمية  | حزم Plugin معبأة لتوزيع OpenClaw                            | `clawhub package publish <source>`           |

يتتبع ClawHub إصدارات semver، ووسومًا مثل `latest`، وسجلات التغيير، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
كي يتمكن المستخدمون من فحص مهارة أو Plugin قبل تثبيتها.

## تدفقات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية في مساحة عمل OpenClaw النشطة وتحتفظ
بالبيانات الوصفية للمصدر بحيث يمكن لأوامر التحديث اللاحقة البقاء على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يتم حل تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Plugin العارية الآمنة لـ npm عبر npm أثناء انتقالات الإطلاق، ويبقى
`npm:<package>` خاصًا بـ npm فقط عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و`minGatewayVersion`
المعلن قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة قطعة ClawPack، يفضّل
OpenClaw ملف `.tgz` المرفوع بالضبط بصيغة npm-pack، ويتحقق من
رأس ملخص ClawHub والبايتات المنزلة، ويسجل بيانات القطعة الوصفية للتحديثات اللاحقة.

## CLI الخاص بـ ClawHub

CLI الخاص بـ ClawHub مخصص للعمل الذي يتطلب مصادقة السجل:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

يحتوي CLI أيضًا على أوامر تثبيت/تحديث المهارات لسير العمل المباشر مع السجل:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

تثبّت هذه الأوامر المهارات في `./skills` ضمن دليل العمل الحالي
وتسجل الإصدارات المثبتة في `.clawhub/lock.json`.

## النشر

انشر المهارات من مجلد محلي يحتوي على `SKILL.md`:

```bash
clawhub skill publish <path>
```

خيارات النشر الشائعة:

- `--slug <slug>`: اسم عنوان URL للمهارة المنشورة.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغيير.
- `--tags <tags>`: وسوم مفصولة بفواصل، وتكون افتراضيًا `latest`.

انشر Plugins من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان URL من GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة دون رفع، و`--json`
لإخراج مناسب لـ CI.

يجب أن تتضمن Plugins البرمجية بيانات OpenClaw الوصفية المطلوبة للتوافق في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) لمرجع الأوامر الكامل
و[تنسيق المهارة](/clawhub/skill-format) لبيانات المهارات الوصفية.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة أحدث حالة فحص
قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصًا آلية على المهارات المنشورة وإصدارات Plugin. قد تختفي
الإصدارات المحتجزة بالفحص أو المحظورة من الفهرس العام وأسطح التثبيت مع بقائها
مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجلين الإبلاغ عن المهارات والحزم. يمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الأمان](/ar/clawhub/security)،
[تدقيقات الأمان](/clawhub/security-audits)،
[الإشراف وسلامة الحساب](/clawhub/moderation)، و
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) للحصول على تفاصيل السياسات والإنفاذ.

## القياسات والبيئة

عند تشغيل `clawhub install` أثناء تسجيل الدخول، قد يرسل CLI حدث تثبيت بأفضل جهد
كي يتمكن ClawHub من حساب أعداد التثبيت الإجمالية. عطّل هذا باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | يتجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | يتجاوز عنوان URL لواجهة API الخاصة بالسجل.        |
| `CLAWHUB_CONFIG_PATH`         | يتجاوز مكان تخزين CLI لحالة الرمز/الإعدادات.      |
| `CLAWHUB_WORKDIR`             | يتجاوز دليل العمل الافتراضي.                     |
| `CLAWHUB_DISABLE_TELEMETRY=1` | يعطّل قياسات التثبيت.                            |

راجع [القياسات](/clawhub/telemetry)، و[HTTP API](/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) للحصول على مواد مرجعية أعمق.
