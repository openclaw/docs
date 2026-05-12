---
read_when:
    - شرح ما هو ClawHub
    - البحث عن Skills أو Plugins، أو تثبيتها، أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - الاختيار بين مسارات CLI لـ openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة موجهة للعامة على ClawHub تغطي الاكتشاف والتثبيت والنشر والأمان وCLI الخاص بـ clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T15:42:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لـ Skills وplugins في OpenClaw.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لمهام مصادقة السجل، والنشر، والحذف/إلغاء الحذف، ومهام المزامنة.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن Skills وثبّتها باستخدام OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

ابحث عن plugins وثبّتها باستخدام OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ثبّت ClawHub CLI عندما تريد مهام عمل موثّقة في السجل مثل
النشر أو المزامنة أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح         | ما يخزّنه                                                   | الأمر المعتاد                                |
| ------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills        | حزم نصية ذات إصدارات تتضمن `SKILL.md` مع ملفات داعمة        | `openclaw skills install <slug>`             |
| Code plugins  | حزم Plugin لـ OpenClaw مع بيانات تعريف التوافق              | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | حزم Plugin مجمّعة لتوزيع OpenClaw                           | `clawhub package publish <source>`           |
| Souls         | حزم `SOUL.md` المعروضة على onlycrabs.ai                      | مسارات النشر عبر الويب وAPI                  |

يتتبع ClawHub إصدارات semver والوسوم مثل `latest` وسجلات التغيير والملفات
والتنزيلات والنجوم وملخصات الفحص الأمني. تعرض الصفحات العامة حالة السجل الحالية
كي يتمكن المستخدمون من فحص Skill أو Plugin قبل تثبيته.

## مسارات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية داخل مساحة عمل OpenClaw النشطة وتحفظ بيانات تعريف
المصدر بحيث تبقى أوامر التحديث اللاحقة على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يتم حل تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Plugin المجردة والآمنة لـ npm عبر npm أثناء مراحل الانتقال عند الإطلاق، ويبقى
`npm:<package>` خاصًا بـ npm فقط عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و`minGatewayVersion`
المعلن عنهما قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة عنصر
ClawPack، يفضّل OpenClaw ملف `.tgz` المحدد المرفوع عبر npm-pack، ويتحقق
من ترويسة ملخص ClawHub والبايتات المنزلة، ويسجل بيانات تعريف العنصر
للتحديثات اللاحقة.

## ClawHub CLI

ClawHub CLI مخصص للعمل الموثّق في السجل:

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

يتضمن CLI أيضًا أوامر تثبيت/تحديث Skills لمسارات عمل السجل المباشرة:

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

- `--slug <slug>`: slug الخاص بـ Skill.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغيير.
- `--tags <tags>`: وسوم مفصولة بفواصل، والقيمة الافتراضية هي `latest`.

انشر plugins من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان
URL على GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة دون رفع، و`--json`
لإخراج ملائم لـ CI.

يجب أن تتضمن Code plugins بيانات تعريف توافق OpenClaw المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) للاطلاع على مرجع الأوامر
الكامل و[تنسيق Skill](/ar/clawhub/skill-format) لبيانات تعريف Skill.

## الأمن والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة
أحدث حالة فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصات آلية على Skills وإصدارات Plugin المنشورة. قد تختفي
الإصدارات المحتجزة بالفحص أو المحظورة من الكتالوج العام وأسطح التثبيت، مع
بقائها مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجلين الإبلاغ عن Skills والحزم. يستطيع المشرفون مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) و
[الأمن + الإشراف](/ar/clawhub/security) لتفاصيل السياسة والإنفاذ.

## القياسات والبيئة

عند تشغيل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI لقطة محدودة حتى يتمكن
ClawHub من حساب أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                          |
| ----------------------------- | ------------------------------------------------ |
| `CLAWHUB_SITE`                | يتجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | يتجاوز عنوان URL الخاص بواجهة API للسجل.         |
| `CLAWHUB_CONFIG_PATH`         | يتجاوز مكان تخزين CLI لحالة الرمز المميز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | يتجاوز دليل العمل الافتراضي.                    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | يعطّل القياسات في `sync`.                       |

راجع [القياسات](/ar/clawhub/telemetry)، و[HTTP API](/ar/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) لمواد مرجعية أكثر تفصيلًا.
