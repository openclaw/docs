---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو الإضافات أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - الاختيار بين مسارات CLI في openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة علنية على ClawHub للاكتشاف والتثبيت والنشر والأمان وCLI ‏clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T06:01:27Z"
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
- استخدم CLI المنفصل `clawhub` لمهام مصادقة السجل والنشر وسير عمل الحذف/إلغاء الحذف.

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

ثبّت CLI الخاص بـ ClawHub عندما تريد سير عمل يتطلب مصادقة السجل مثل
النشر أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما الذي يستضيفه ClawHub

| السطح         | ما يخزّنه                                                   | الأمر النموذجي                               |
| ------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills        | حزم نصية ذات إصدارات تتضمن `SKILL.md` وملفات داعمة          | `openclaw skills install @openclaw/demo`     |
| إضافات برمجية | حزم إضافات OpenClaw مع بيانات تعريف التوافق                 | `openclaw plugins install clawhub:<package>` |
| إضافات حزمية  | حزم Plugin معبأة لتوزيع OpenClaw                             | `clawhub package publish <source>`           |

يتتبع ClawHub إصدارات semver، والوسوم مثل `latest`، وسجلات التغييرات، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص Skill أو إضافة قبل تثبيتها.

## تدفقات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية داخل مساحة عمل OpenClaw النشطة وتحفظ
بيانات تعريف المصدر حتى تتمكن أوامر التحديث اللاحقة من البقاء على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يتم حل تثبيت إضافة عبر ClawHub.
قد تُحل مواصفات الإضافات المتوافقة مع npm دون بادئة عبر npm أثناء انتقالات الإطلاق، ويبقى
`npm:<package>` مقصورًا على npm عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت الإضافات من توافق `pluginApi` و`minGatewayVersion`
المعلن عنهما قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة أداة ClawPack،
يفضّل OpenClaw ملف `.tgz` الدقيق المرفوع بحزمة npm، ويتحقق من
ترويسة ملخص ClawHub والبايتات المنزلة، ويسجل بيانات تعريف الأداة للتحديثات اللاحقة.

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

يتضمن CLI أيضًا أوامر تثبيت/تحديث Skills لسير عمل السجل المباشر:

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

- `--slug <slug>`: اسم عنوان URL الخاص بـ Skill المنشورة.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغييرات.
- `--tags <tags>`: وسوم مفصولة بفواصل، وتكون افتراضيًا `latest`.

انشر الإضافات من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان URL على GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة دون رفع، و`--json`
لإخراج مناسب لـ CI.

يجب أن تتضمن الإضافات البرمجية بيانات تعريف توافق OpenClaw المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) لمرجع الأوامر الكامل
و[تنسيق Skill](/ar/clawhub/skill-format) لبيانات تعريف Skill.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة
أحدث حالة فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصات آلية على Skills وإصدارات الإضافات المنشورة. قد تختفي
الإصدارات المعلقة بسبب الفحص أو المحظورة من الفهرس العام وأسطح التثبيت مع
بقائها مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجلين الإبلاغ عن Skills والحزم. يمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الأمان](/ar/clawhub/security)،
[تدقيقات الأمان](/ar/clawhub/security-audits)،
[الإشراف وسلامة الحساب](/ar/clawhub/moderation)، و
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) لتفاصيل السياسة والإنفاذ.

## القياس عن بُعد والبيئة

عند تشغيل `clawhub install` أثناء تسجيل الدخول، قد يرسل CLI حدث تثبيت
وفق أفضل جهد حتى يتمكن ClawHub من حساب إجمالي أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                          |
| ----------------------------- | ------------------------------------------------ |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL لواجهة API الخاصة بالسجل.       |
| `CLAWHUB_CONFIG_PATH`         | تجاوز مكان تخزين CLI لحالة الرمز/الإعدادات.     |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                     |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل قياس التثبيت عن بُعد.                     |

راجع [القياس عن بُعد](/ar/clawhub/telemetry)، و[واجهة HTTP API](/ar/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) لمواد مرجعية أعمق.
