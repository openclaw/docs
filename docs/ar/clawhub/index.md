---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو Plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins في السجل
    - الاختيار بين مسارات عمل CLI الخاصة بـ openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وواجهة clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-05-13T04:18:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لـ Skills وPlugins الخاصة بـ OpenClaw.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت Plugins من ClawHub.
- استخدم CLI منفصلًا باسم `clawhub` لمهام مصادقة السجل والنشر والحذف/إلغاء الحذف ومهام المزامنة.

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

ثبّت CLI الخاص بـ ClawHub عندما تريد مهام عمل موثّقة في السجل مثل
النشر أو المزامنة أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما الذي يستضيفه ClawHub

| السطح         | ما يخزّنه                                                    | الأمر المعتاد                                |
| ------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills        | حزم نصية ذات إصدارات تحتوي على `SKILL.md` مع ملفات داعمة     | `openclaw skills install <slug>`             |
| Code plugins  | حزم Plugin لـ OpenClaw مع بيانات توافق وصفية                 | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | حزم Plugin معبأة لتوزيع OpenClaw                             | `clawhub package publish <source>`           |
| Souls         | حزم `SOUL.md` المعروضة على onlycrabs.ai                      | تدفقات نشر الويب وAPI                       |

يتتبع ClawHub إصدارات semver، والوسوم مثل `latest`، وسجلات التغييرات، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص Skill أو Plugin قبل تثبيته.

## تدفقات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية في مساحة عمل OpenClaw النشطة وتحتفظ
ببيانات المصدر الوصفية حتى تتمكن أوامر التحديث اللاحقة من البقاء على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يحل تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Plugin العارية الآمنة لـ npm عبر npm أثناء مراحل التحويل عند الإطلاق، ويظل
`npm:<package>` مقتصرًا على npm فقط عندما يجب أن يكون المصدر صريحًا.

تتحقق تثبيتات Plugin من توافق `pluginApi` و`minGatewayVersion`
المعلنين قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة أثر ClawPack،
يفضّل OpenClaw ملف `.tgz` المطابق تمامًا والمرفوع بصيغة npm-pack، ويتحقق
من ترويسة ملخص ClawHub والبايتات المنزلة، ويسجل بيانات الأثر الوصفية
للتحديثات اللاحقة.

## CLI الخاص بـ ClawHub

CLI الخاص بـ ClawHub مخصص للعمل الموثّق في السجل:

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

يتضمن CLI أيضًا أوامر تثبيت/تحديث Skills لتدفقات عمل السجل المباشرة:

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
- `--changelog <text>`: نص سجل التغييرات.
- `--tags <tags>`: وسوم مفصولة بفواصل، والقيمة الافتراضية هي `latest`.

انشر Plugins من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو URL على GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة دون رفع، واستخدم `--json`
لإخراج ملائم لـ CI.

يجب أن تتضمن Code plugins بيانات توافق OpenClaw الوصفية المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) للاطلاع على مرجع الأوامر الكامل
و[تنسيق Skill](/ar/clawhub/skill-format) لبيانات Skill الوصفية.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة
أحدث حالة فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصًا آلية على Skills وإصدارات Plugin المنشورة. قد تختفي
الإصدارات المحتجزة للفحص أو المحظورة من الكتالوج العام وأسطح التثبيت بينما
تبقى مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجلين الإبلاغ عن Skills والحزم. يمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) و
[الأمان + الإشراف](/ar/clawhub/security) للحصول على تفاصيل السياسة والإنفاذ.

## القياس عن بُعد والبيئة

عند تشغيل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI لقطة محدودة حتى
يتمكن ClawHub من حساب أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | الأثر                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز URL الموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | تجاوز URL واجهة API الخاصة بالسجل.                |
| `CLAWHUB_CONFIG_PATH`         | تجاوز موضع تخزين CLI لحالة الرمز/الإعدادات.      |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياس عن بُعد عند `sync`.                  |

راجع [القياس عن بُعد](/ar/clawhub/telemetry)، و[HTTP API](/ar/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) لمواد مرجعية أعمق.
