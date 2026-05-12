---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - الاختيار بين مسارات CLI الخاصة بـ openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وCLI الخاص بـ clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T23:29:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لـ Skills وPlugin الخاصة بـ OpenClaw.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت Plugin من ClawHub.
- استخدم CLI المنفصل `clawhub` لمهام مصادقة السجل، والنشر، والحذف/إلغاء الحذف، وسير عمل المزامنة.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن Skills وثبّتها باستخدام OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

ابحث عن Plugin وثبّتها باستخدام OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ثبّت CLI الخاص بـ ClawHub عندما تريد سير عمل موثّقة لدى السجل، مثل
النشر أو المزامنة أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح         | ما يخزّنه                                                     | الأمر المعتاد                                |
| ------------- | ------------------------------------------------------------- | -------------------------------------------- |
| Skills        | حزم نصية ذات إصدارات تحتوي على `SKILL.md` مع ملفات داعمة      | `openclaw skills install <slug>`             |
| Plugin برمجية | حزم Plugin لـ OpenClaw مع بيانات توافق وصفية                 | `openclaw plugins install clawhub:<package>` |
| Plugin حزمية  | حزم Plugin معبأة لتوزيع OpenClaw                              | `clawhub package publish <source>`           |
| Souls         | حزم `SOUL.md` المعروضة على onlycrabs.ai                       | مسارات نشر عبر الويب وAPI                    |

يتتبع ClawHub إصدارات semver، والوسوم مثل `latest`، وسجلات التغييرات، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
ليتمكن المستخدمون من فحص Skill أو Plugin قبل تثبيتها.

## مسارات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية داخل مساحة عمل OpenClaw النشطة وتحفظ
بيانات مصدر وصفية حتى تبقى أوامر التحديث اللاحقة على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يُحل تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Plugin العارية والآمنة لـ npm عبر npm أثناء انتقالات الإطلاق،
ويبقى `npm:<package>` مقتصرًا على npm عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و`minGatewayVersion`
المعلن عنهما قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة قطعة ClawPack،
يفضل OpenClaw حزمة npm-pack `.tgz` المطابقة المرفوعة، ويتحقق من
ترويسة ملخص ClawHub والبايتات المنزّلة، ويسجل بيانات وصفية للقطعة للتحديثات
اللاحقة.

## CLI الخاص بـ ClawHub

CLI الخاص بـ ClawHub مخصص للعمل الموثّق لدى السجل:

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

يحتوي CLI أيضًا على أوامر تثبيت/تحديث Skills لسير العمل المباشر مع السجل:

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

انشر Plugin من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان GitHub
URL:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر المطابقة دون رفع، و`--json`
لإخراج مناسب لـ CI.

يجب أن تتضمن Plugin البرمجية بيانات توافق OpenClaw الوصفية المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) لمرجع الأوامر
الكامل و[تنسيق Skill](/ar/clawhub/skill-format) لبيانات Skill الوصفية.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة أحدث حالة فحص
قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصات آلية على Skills المنشورة وإصدارات Plugin. قد تختفي
الإصدارات المحتجزة للفحص أو المحظورة من الكتالوج العام وأسطح التثبيت بينما
تبقى مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجّلين الإبلاغ عن Skills والحزم. يستطيع المشرفون مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) و
[الأمان + الإشراف](/ar/clawhub/security) لتفاصيل السياسة والإنفاذ.

## القياسات والبيئة

عند تشغيل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI لقطة محدودة حتى
يتمكن ClawHub من حساب أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                          |
| ----------------------------- | ------------------------------------------------ |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL الخاص بـ API السجل.              |
| `CLAWHUB_CONFIG_PATH`         | تجاوز المكان الذي يخزن فيه CLI حالة الرمز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                     |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياسات عند `sync`.                      |

راجع [القياسات](/ar/clawhub/telemetry)، و[HTTP API](/ar/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) للحصول على مواد مرجعية أعمق.
