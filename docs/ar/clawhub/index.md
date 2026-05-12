---
read_when:
    - شرح ما هو ClawHub
    - البحث عن Skills أو plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - الاختيار بين تدفقات CLI في openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة علنية على ClawHub للاكتشاف والتثبيت والنشر والأمان وCLI الخاص بـ clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T12:49:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لـ OpenClaw Skills و Plugins.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت Plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لسير عمل مصادقة السجل والنشر والحذف/إلغاء الحذف والمزامنة.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن Skills وثبّتها باستخدام OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

ابحث عن Plugins وثبّتها باستخدام OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ثبّت ClawHub CLI عندما تريد سير عمل تتطلب مصادقة السجل، مثل
النشر أو المزامنة أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح        | ما يخزّنه                                               | الأمر المعتاد                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | حزم نصية ذات إصدارات تحتوي على `SKILL.md` مع ملفات داعمة | `openclaw skills install <slug>`             |
| Plugins برمجية   | حزم Plugin لـ OpenClaw مع بيانات توافق وصفية         | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | حزم Plugin مجمّعة لتوزيع OpenClaw            | `clawhub package publish <source>`           |
| Souls          | حزم `SOUL.md` المعروضة على onlycrabs.ai                      | مسارات نشر الويب و API                    |

يتتبع ClawHub إصدارات semver، والوسوم مثل `latest`، وسجلات التغيير، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص Skill أو Plugin قبل تثبيته.

## مسارات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية في مساحة عمل OpenClaw النشطة، وتحفظ
بيانات تعريف المصدر حتى تتمكن أوامر التحديث اللاحقة من البقاء على ClawHub.

استخدم `clawhub:<package>` عندما ينبغي أن يمر تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Plugin المجردة والآمنة لـ npm عبر npm أثناء مراحل الانتقال عند الإطلاق، ويظل
`npm:<package>` خاصًا بـ npm فقط عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و `minGatewayVersion`
المعلن عنهما قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة أداة ClawPack،
يفضّل OpenClaw ملف `.tgz` الدقيق المرفوع من npm-pack، ويتحقق من
ترويسة ملخص ClawHub والبايتات المنزّلة، ويسجل بيانات الأداة الوصفية
للتحديثات اللاحقة.

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
clawhub sync --all
```

يتضمن CLI أيضًا أوامر تثبيت/تحديث Skills لسير العمل المباشرة مع السجل:

```bash
clawhub install <slug>
clawhub update <slug>
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

- `--slug <slug>`: معرّف Skill.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغيير.
- `--tags <tags>`: وسوم مفصولة بفواصل، والقيمة الافتراضية هي `latest`.

انشر Plugins من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان GitHub
URL:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة دون رفع، و `--json`
لإخراج مناسب لـ CI.

يجب أن تتضمن Plugins البرمجية بيانات توافق OpenClaw الوصفية المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) لمرجع الأوامر
الكامل و[تنسيق Skill](/ar/clawhub/skill-format) لبيانات Skill الوصفية.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة
آخر حالة فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصًا آلية على Skills المنشورة وإصدارات Plugin. قد تختفي
الإصدارات المعلّقة بسبب الفحص أو المحظورة من الفهرس العام وأسطح التثبيت بينما
تظل مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين الذين سجّلوا الدخول الإبلاغ عن Skills والحزم. يمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) و
[الأمان + الإشراف](/ar/clawhub/security) لتفاصيل السياسة والتنفيذ.

## القياس عن بعد والبيئة

عند تشغيل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI لقطة موجزة حتى
يتمكن ClawHub من حساب أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                      | التأثير                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح.     |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL الخاص بـ registry API.                    |
| `CLAWHUB_CONFIG_PATH`         | تجاوز الموقع الذي يخزن فيه CLI حالة الرمز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياس عن بعد عند `sync`.                      |

راجع [القياس عن بعد](/ar/clawhub/telemetry)، و[HTTP API](/ar/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) لمواد مرجعية أكثر تفصيلًا.
