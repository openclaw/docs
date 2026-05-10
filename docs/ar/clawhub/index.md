---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو Plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - الاختيار بين مسارات CLI الخاصة بـ openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وCLI الخاص بـ clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-10T19:27:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لمهارات OpenClaw وplugins.

- استخدم أوامر `openclaw` الأصلية للبحث عن المهارات وتثبيتها وتحديثها، ولتثبيت plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لمهام مصادقة السجل، والنشر، والحذف/إلغاء الحذف، وإعادة الفحص، وسير عمل المزامنة.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن المهارات وثبّتها باستخدام OpenClaw:

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

ثبّت CLI الخاص بـ ClawHub عندما تريد سير عمل مصادقًا عليه في السجل، مثل
النشر، أو المزامنة، أو الحذف/إلغاء الحذف، أو عمليات إعادة الفحص التي يطلبها المالك:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح         | ما يخزّنه                                                    | الأمر المعتاد                                |
| ------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills        | حزم نصية بإصدارات تحتوي على `SKILL.md` مع ملفات داعمة        | `openclaw skills install <slug>`             |
| Code plugins  | حزم Plugin لـ OpenClaw مع بيانات توافق وصفية                 | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | حزم Plugin مجمّعة لتوزيع OpenClaw                           | `clawhub package publish <source>`           |
| Souls         | حزم `SOUL.md` المعروضة على onlycrabs.ai                      | تدفقات النشر عبر الويب وAPI                  |

يتتبع ClawHub إصدارات semver، والوسوم مثل `latest`، وسجلات التغيير، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص مهارة أو Plugin قبل تثبيته.

## تدفقات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية داخل مساحة عمل OpenClaw النشطة، وتحتفظ
ببيانات المصدر الوصفية حتى تتمكن أوامر التحديث اللاحقة من البقاء على ClawHub.

استخدم `clawhub:<package>` عندما ينبغي أن يجري تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات plugin العارية والآمنة لـ npm عبر npm أثناء مراحل الانتقال عند الإطلاق، بينما
يبقى `npm:<package>` خاصًا بـ npm فقط عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و`minGatewayVersion`
المعلنين قبل تشغيل تثبيت الأرشيف. عندما تنشر نسخة حزمة أثر ClawPack،
يفضّل OpenClaw ملف `.tgz` المحمّل بالضبط من npm-pack، ويتحقق من
ترويسة ملخص ClawHub والبايتات التي تم تنزيلها، ويسجل بيانات الأثر الوصفية
للتحديثات اللاحقة.

## CLI الخاص بـ ClawHub

CLI الخاص بـ ClawHub مخصص للعمل المصادق عليه في السجل:

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

يتضمن CLI أيضًا أوامر تثبيت/تحديث المهارات لسير العمل المباشر مع السجل:

```bash
clawhub install <slug>
clawhub update <slug>
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

- `--slug <slug>`: مُعرّف المهارة.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغيير.
- `--tags <tags>`: وسوم مفصولة بفواصل، وتكون افتراضيًا `latest`.

انشر plugins من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان GitHub
URL:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة دون رفع، و`--json`
لإخراج مناسب لـ CI.

يجب أن تتضمن Code plugins بيانات توافق OpenClaw الوصفية المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) للاطلاع على مرجع الأوامر
الكامل و[تنسيق المهارة](/ar/clawhub/skill-format) لبيانات المهارة الوصفية.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة
حالة الفحص الأحدث قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصات مؤتمتة على المهارات وإصدارات Plugin المنشورة. قد تختفي
الإصدارات المحتجزة للفحص أو المحظورة من الفهرس العام وأسطح التثبيت، مع
بقائها مرئية لمالكها في `/dashboard`.

يمكن للمالكين طلب عمليات إعادة فحص محدودة للتعافي من النتائج الإيجابية الكاذبة. يمكن لمشرفي
المنصة والمسؤولين طلب إعادة الفحص لأي مهارة أو حزمة عند التعامل مع
بلاغات الدعم:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

يمكن للمستخدمين المسجلين الإبلاغ عن المهارات والحزم. يمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحل الاستئنافات، وحظر الحسابات المسيئة. راجع
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) و
[الأمان + الإشراف](/ar/clawhub/security) لمعرفة تفاصيل السياسة والإنفاذ.

## القياسات والبيئة

عند تشغيل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI لقطة محدودة حتى يتمكن
ClawHub من حساب أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | يتجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | يتجاوز عنوان URL الخاص بـ API للسجل.              |
| `CLAWHUB_CONFIG_PATH`         | يتجاوز المكان الذي يخزن فيه CLI حالة الرمز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | يتجاوز دليل العمل الافتراضي.                      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | يعطّل القياسات عند `sync`.                        |

راجع [القياسات](/ar/clawhub/telemetry)، و[HTTP API](/ar/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) للحصول على مواد مرجعية أعمق.
