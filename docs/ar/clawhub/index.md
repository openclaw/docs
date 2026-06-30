---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو Plugin أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - الاختيار بين مسارات CLI الخاصة بـ openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وواجهة clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-06-30T14:01:40Z"
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
- استخدم CLI المنفصل `clawhub` لمهام مصادقة السجل والنشر وسير عمل الحذف/إلغاء الحذف.

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

ثبّت CLI الخاص بـ ClawHub عندما تريد سير عمل موثّقة في السجل، مثل
النشر أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح         | ما يخزّنه                                                     | الأمر المعتاد                                |
| ------------- | ------------------------------------------------------------- | -------------------------------------------- |
| Skills        | حزم نصية ذات إصدارات تحتوي على `SKILL.md` وملفات داعمة        | `openclaw skills install @openclaw/demo`     |
| Code plugins  | حزم Plugin لـ OpenClaw مع بيانات وصفية للتوافق                | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | حزم Plugin مجمّعة لتوزيع OpenClaw                            | `clawhub package publish <source>`           |

يتتبّع ClawHub إصدارات semver والوسوم مثل `latest` وسجلات التغييرات والملفات
والتنزيلات والنجوم وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص مهارة أو Plugin قبل تثبيته.

## تدفقات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية داخل مساحة عمل OpenClaw النشطة وتحفظ البيانات
الوصفية للمصدر بحيث تبقى أوامر التحديث اللاحقة على ClawHub.

استخدم `clawhub:<package>` عندما ينبغي أن يتم حل تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Plugin العارية الآمنة لـ npm عبر npm أثناء مراحل الانتقال عند
الإطلاق، ويبقى `npm:<package>` مخصصا لـ npm فقط عندما يجب أن يكون المصدر صريحا.

تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و`minGatewayVersion` المعلن عنهما
قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة أثرا من ClawPack، يفضّل OpenClaw
ملف `.tgz` الدقيق المرفوع بحزمة npm، ويتحقق من ترويسة ملخص ClawHub والبايتات
المنزّلة، ويسجل البيانات الوصفية للأثر من أجل التحديثات اللاحقة.

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

يحتوي CLI أيضا على أوامر تثبيت/تحديث المهارات لسير العمل المباشر مع السجل:

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

- `--slug <slug>`: اسم URL للمهارة المنشورة.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغييرات.
- `--tags <tags>`: وسوم مفصولة بفواصل، وتكون افتراضيا `latest`.

انشر Plugins من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو URL من GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة دون رفع، و`--json`
لمخرجات مناسبة لـ CI.

يجب أن تتضمن Code plugins بيانات توافق OpenClaw الوصفية المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) للحصول على مرجع
الأوامر الكامل و[تنسيق المهارة](/clawhub/skill-format) لبيانات المهارة الوصفية.

## الأمان والإشراف

ClawHub مفتوح افتراضيا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديما بما يكفي لاجتياز بوابة الرفع. تلخّص صفحات التفاصيل العامة أحدث حالة
فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصات آلية على المهارات المنشورة وإصدارات Plugin. قد تختفي
الإصدارات الموقوفة بسبب الفحص أو المحظورة من الكتالوج العام وأسطح التثبيت
مع بقائها مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجلين الإبلاغ عن المهارات والحزم. يستطيع المشرفون مراجعة
البلاغات، وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الأمان](/ar/clawhub/security)،
[تدقيقات الأمان](/clawhub/security-audits)،
[الإشراف وسلامة الحساب](/clawhub/moderation)، و
[الاستخدام المقبول](/clawhub/acceptable-usage) للحصول على تفاصيل السياسات والإنفاذ.

## القياسات والبيئة

عند تشغيل `clawhub install` أثناء تسجيل الدخول، قد يرسل CLI حدث تثبيت بأفضل
محاولة حتى يتمكن ClawHub من حساب إجمالي أعداد التثبيت. عطّل هذا باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                      | التأثير                                           |
| ---------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`               | تجاوز URL الموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`           | تجاوز URL واجهة API للسجل.                       |
| `CLAWHUB_CONFIG_PATH`        | تجاوز الموضع الذي يخزّن فيه CLI حالة الرمز/الإعداد. |
| `CLAWHUB_WORKDIR`            | تجاوز دليل العمل الافتراضي.                      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل قياسات التثبيت.                            |

راجع [القياسات](/clawhub/telemetry)، و[واجهة HTTP API](/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) للحصول على مادة مرجعية أعمق.
