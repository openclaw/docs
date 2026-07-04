---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو Plugin أو تثبيتها أو تحديثها
    - نشر Skills أو plugins في السجل
    - الاختيار بين تدفقات CLI في openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وواجهة clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T10:42:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لـ Skills والإضافات في OpenClaw.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت الإضافات من ClawHub.
- استخدم CLI المنفصل `clawhub` لمصادقة السجل والنشر وسير عمل الحذف/إلغاء الحذف.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن Skills وثبّتها باستخدام OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

ابحث عن الإضافات وثبّتها باستخدام OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ثبّت CLI الخاص بـ ClawHub عندما تريد سير عمل موثّقة في السجل مثل
النشر أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح         | ما يخزّنه                                                    | الأمر المعتاد                                |
| ------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills        | حزم نصية ذات إصدارات تحتوي على `SKILL.md` وملفات داعمة       | `openclaw skills install @openclaw/demo`     |
| إضافات الكود  | حزم إضافات OpenClaw مع بيانات توافق وصفية                   | `openclaw plugins install clawhub:<package>` |
| إضافات الحزم  | حزم إضافات مغلّفة لتوزيع OpenClaw                            | `clawhub package publish <source>`           |

يتتبع ClawHub إصدارات semver، والوسوم مثل `latest`، وسجلات التغييرات، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص Skill أو إضافة قبل تثبيتها.

## تدفقات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية في مساحة عمل OpenClaw النشطة وتحتفظ
ببيانات المصدر الوصفية حتى تتمكن أوامر التحديث اللاحقة من البقاء على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يحل تثبيت الإضافة عبر ClawHub.
قد تُحل مواصفات الإضافات المجردة الآمنة لـ npm عبر npm أثناء انتقالات الإطلاق، ويبقى
`npm:<package>` مقتصرًا على npm عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت الإضافات من توافق `pluginApi` و`minGatewayVersion`
المعلنين قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة أداة ClawPack، يفضّل
OpenClaw ملف npm-pack `.tgz` المرفوع بالضبط، ويتحقق من ترويسة الملخص في
ClawHub والبايتات المنزّلة، ويسجل بيانات الأداة الوصفية للتحديثات اللاحقة.

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

- `--slug <slug>`: اسم URL المنشور لـ Skill.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغييرات.
- `--tags <tags>`: وسوم مفصولة بفواصل، والقيمة الافتراضية هي `latest`.

انشر الإضافات من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان URL
على GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لإنشاء خطة النشر الدقيقة دون رفع، و`--json`
لإخراج مناسب لـ CI.

يجب أن تتضمن إضافات الكود بيانات توافق OpenClaw الوصفية المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) لمرجع الأوامر
الكامل و[تنسيق Skill](/clawhub/skill-format) لبيانات Skill الوصفية.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة
أحدث حالة فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصات آلية على Skills المنشورة وإصدارات الإضافات. قد تختفي
الإصدارات المحتجزة للفحص أو المحظورة من الفهرس العام وأسطح التثبيت بينما
تبقى مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجلين الإبلاغ عن Skills والحزم. يمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الأمان](/ar/clawhub/security)،
[تدقيقات الأمان](/clawhub/security-audits)،
[الإشراف وسلامة الحساب](/clawhub/moderation)، و
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) لتفاصيل السياسة والإنفاذ.

## القياسات عن بُعد والبيئة

عند تشغيل `clawhub install` أثناء تسجيل الدخول، قد يرسل CLI حدث تثبيت
وفق أفضل جهد حتى يتمكن ClawHub من حساب إجمالي أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                          |
| ----------------------------- | ------------------------------------------------ |
| `CLAWHUB_SITE`                | يتجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | يتجاوز عنوان URL الخاص بواجهة API للسجل.         |
| `CLAWHUB_CONFIG_PATH`         | يتجاوز المكان الذي يخزن فيه CLI حالة الرمز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | يتجاوز دليل العمل الافتراضي.                    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | يعطّل قياسات التثبيت عن بُعد.                   |

راجع [القياسات عن بُعد](/clawhub/telemetry)، و[HTTP API](/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) لمواد مرجعية أعمق.
