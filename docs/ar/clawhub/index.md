---
read_when:
    - شرح ما هو ClawHub
    - البحث عن Skills أو plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins في السجل
    - الاختيار بين تدفقات CLI الخاصة بـ openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف، والتثبيت، والنشر، والأمان، وواجهة clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T20:32:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لـ Skills وPlugins الخاصة بـ OpenClaw.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت Plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لمصادقة السجل، والنشر، وسير عمل الحذف/إلغاء الحذف.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن Skills وثبّتها باستخدام OpenClaw:

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

ثبّت ClawHub CLI عندما تريد سير عمل يتطلب مصادقة السجل مثل
النشر أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح         | ما يخزّنه                                                    | الأمر المعتاد                                |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | حزم نصية ذات إصدارات تحتوي على `SKILL.md` مع ملفات داعمة     | `openclaw skills install @openclaw/demo`     |
| Plugins برمجية | حزم Plugin الخاصة بـ OpenClaw مع بيانات توافق وصفية          | `openclaw plugins install clawhub:<package>` |
| Plugins حزم   | حزم Plugin معبأة لتوزيع OpenClaw                             | `clawhub package publish <source>`           |

يتتبع ClawHub إصدارات semver، والوسوم مثل `latest`، وسجلات التغييرات، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص Skill أو Plugin قبل تثبيته.

## تدفقات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية داخل مساحة عمل OpenClaw النشطة وتحتفظ
ببيانات المصدر الوصفية حتى تتمكن أوامر التحديث اللاحقة من البقاء على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يُحل تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Plugin العارية الآمنة لـ npm عبر npm أثناء انتقالات الإطلاق، ويبقى
`npm:<package>` مقتصرًا على npm عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و`minGatewayVersion`
المعلنَين قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة أداة ClawPack، يفضل
OpenClaw ملف `.tgz` الدقيق المرفوع بصيغة npm-pack، ويتحقق من ترويسة ملخص
ClawHub والبايتات المنزّلة، ويسجل بيانات الأداة الوصفية للتحديثات اللاحقة.

## ClawHub CLI

ClawHub CLI مخصص للعمل الذي يتطلب مصادقة السجل:

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

يتضمن CLI أيضًا أوامر تثبيت/تحديث Skills لسير العمل المباشر مع السجل:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

تثبّت هذه الأوامر Skills في `./skills` ضمن دليل العمل الحالي
وتسجل الإصدارات المثبتة في `.clawhub/lock.json`.

## النشر

انشر Skills من مجلد محلي يحتوي على `SKILL.md`:

```bash
clawhub skill publish <path>
```

خيارات النشر الشائعة:

- `--slug <slug>`: اسم عنوان URL المنشور للـ Skill.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغييرات.
- `--tags <tags>`: وسوم مفصولة بفواصل، وتكون افتراضيًا `latest`.

انشر Plugins من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان URL
على GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة من دون رفع، و`--json`
لإخراج مناسب لـ CI.

يجب أن تتضمن Plugins البرمجية بيانات توافق OpenClaw الوصفية المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) لمرجع الأوامر
الكامل و[تنسيق Skill](/clawhub/skill-format) لبيانات Skill الوصفية.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة أحدث حالة
فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصًا آلية على Skills وإصدارات Plugin المنشورة. قد تختفي
الإصدارات المحجوزة بسبب الفحص أو المحظورة من الفهرس العام وأسطح التثبيت، مع
بقائها مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجلين الإبلاغ عن Skills والحزم. يمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الأمان](/ar/clawhub/security)،
[تدقيقات الأمان](/clawhub/security-audits)،
[الإشراف وسلامة الحساب](/clawhub/moderation)، و
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) لتفاصيل السياسة والتنفيذ.

## القياسات عن بُعد والبيئة

عند تشغيل `clawhub install` أثناء تسجيل الدخول، قد يرسل CLI حدث تثبيت بأفضل
جهد حتى يتمكن ClawHub من حساب إجمالي أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | يتجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | يتجاوز عنوان URL لواجهة API الخاصة بالسجل.        |
| `CLAWHUB_CONFIG_PATH`         | يتجاوز مكان تخزين CLI لحالة الرمز/الإعداد.        |
| `CLAWHUB_WORKDIR`             | يتجاوز دليل العمل الافتراضي.                     |
| `CLAWHUB_DISABLE_TELEMETRY=1` | يعطّل قياسات التثبيت عن بُعد.                    |

راجع [القياسات عن بُعد](/clawhub/telemetry)، و[HTTP API](/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) للحصول على مواد مرجعية أعمق.
