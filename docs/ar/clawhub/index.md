---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو Plugin أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins في السجل
    - الاختيار بين مسارات CLI لـ openclaw و ClawHub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وCLI الخاص بـ clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T20:25:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لـ Skills وPlugins الخاصة بـ OpenClaw.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت Plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لمهام مصادقة السجل، والنشر، والحذف/إلغاء الحذف، وإعادة الفحص، ومهام المزامنة.

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

ثبّت CLI الخاص بـ ClawHub عندما تريد مهام سير عمل موثّقة في السجل، مثل
النشر أو المزامنة أو الحذف/إلغاء الحذف أو عمليات إعادة الفحص التي يطلبها المالك:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح         | ما يخزّنه                                                    | الأمر النموذجي                               |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | حزم نصية ذات إصدارات تحتوي على `SKILL.md` مع ملفات داعمة     | `openclaw skills install <slug>`             |
| Code plugins   | حزم Plugin لـ OpenClaw مع بيانات توافق وصفية                 | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | حزم Plugin مجمّعة لتوزيع OpenClaw                            | `clawhub package publish <source>`           |
| Souls          | حزم `SOUL.md` المعروضة على onlycrabs.ai                      | تدفقات النشر عبر الويب وAPI                 |

يتتبّع ClawHub إصدارات semver، والوسوم مثل `latest`، وسجلات التغييرات، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص Skill أو Plugin قبل تثبيته.

## تدفقات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية في مساحة عمل OpenClaw النشطة، وتحفظ
بيانات تعريف المصدر حتى تتمكن أوامر التحديث اللاحقة من البقاء على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يتم حل تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Plugin العارية والآمنة لـ npm عبر npm أثناء مراحل الانتقال عند الإطلاق، بينما
يبقى `npm:<package>` مقتصرًا على npm فقط عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و`minGatewayVersion`
المعلنين قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة أداة ClawPack،
يفضّل OpenClaw ملف `.tgz` الدقيق المرفوع بتنسيق npm-pack، ويتحقق من
رأس الملخص في ClawHub والبايتات المنزّلة، ويسجّل بيانات تعريف الأداة
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
وتسجّل الإصدارات المثبّتة في `.clawhub/lock.json`.

## النشر

انشر Skills من مجلد محلي يحتوي على `SKILL.md`:

```bash
clawhub skill publish <path>
```

خيارات النشر الشائعة:

- `--slug <slug>`: معرّف Skill المختصر.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغييرات.
- `--tags <tags>`: وسوم مفصولة بفواصل، والقيمة الافتراضية هي `latest`.

انشر Plugins من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان URL من GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة دون رفع، و`--json`
لإخراج مناسب لـ CI.

يجب أن تتضمن Code plugins بيانات توافق OpenClaw الوصفية المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) لمرجع الأوامر الكامل
و[تنسيق Skill](/ar/clawhub/skill-format) لبيانات Skill الوصفية.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخّص صفحات التفاصيل العامة
أحدث حالة فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصات آلية على Skills المنشورة وإصدارات Plugin. قد تختفي
الإصدارات المحتجزة للفحص أو المحظورة من الفهرس العام وأسطح التثبيت، مع
بقائها مرئية لمالكها في `/dashboard`.

يمكن للمالكين طلب عمليات إعادة فحص محدودة للتعافي من النتائج الإيجابية الكاذبة. يمكن لمشرفي
المنصة والمسؤولين طلب عمليات إعادة فحص لأي Skill أو حزمة عند التعامل مع
بلاغات الدعم:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

يمكن للمستخدمين المسجّلين الإبلاغ عن Skills والحزم. يمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحل الاستئنافات، وحظر الحسابات المسيئة. راجع
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) و
[الأمان + الإشراف](/ar/clawhub/security) لتفاصيل السياسة والإنفاذ.

## القياسات والبيئة

عند تشغيل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI لقطة محدودة حتى
يتمكن ClawHub من حساب أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL الخاص بـ API السجل.              |
| `CLAWHUB_CONFIG_PATH`         | تجاوز مكان تخزين CLI لحالة الرمز/الإعدادات.      |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياسات عند `sync`.                       |

راجع [القياسات](/ar/clawhub/telemetry)، و[HTTP API](/ar/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) لمواد مرجعية أعمق.
