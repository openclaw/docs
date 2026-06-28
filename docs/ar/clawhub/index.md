---
read_when:
    - شرح ما هو ClawHub
    - البحث عن Skills أو Plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - الاختيار بين تدفقات CLI في openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وواجهة CLI الخاصة بـ clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T07:41:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لمهارات OpenClaw وPluginاته.

- استخدم أوامر `openclaw` الأصلية للبحث عن المهارات وتثبيتها وتحديثها، ولتثبيت Pluginات من ClawHub.
- استخدم CLI المنفصل `clawhub` للمصادقة مع السجل والنشر وسير عمل الحذف/إلغاء الحذف.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن المهارات وثبّتها باستخدام OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

ابحث عن Pluginات وثبّتها باستخدام OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ثبّت CLI الخاص بـ ClawHub عندما تريد سير عمل موثقة في السجل مثل
النشر أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح          | ما يخزّنه                                                    | الأمر المعتاد                                |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | حزم نصية ذات إصدارات تتضمن `SKILL.md` مع ملفات داعمة          | `openclaw skills install @openclaw/demo`     |
| Pluginات الكود | حزم Pluginات OpenClaw مع بيانات وصفية للتوافق                | `openclaw plugins install clawhub:<package>` |
| Pluginات الحزم | حزم Pluginات مغلّفة لتوزيع OpenClaw                          | `clawhub package publish <source>`           |

يتتبع ClawHub إصدارات semver والوسوم مثل `latest` وسجلات التغييرات والملفات
والتنزيلات والنجوم وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص مهارة أو Plugin قبل تثبيته.

## تدفقات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية داخل مساحة عمل OpenClaw النشطة وتحفظ
بيانات وصفية للمصدر حتى تتمكن أوامر التحديث اللاحقة من البقاء على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يُحل تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Pluginات npm الآمنة والمجردة عبر npm أثناء مراحل الانتقال عند الإطلاق، ويبقى
`npm:<package>` مقتصرًا على npm فقط عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت Pluginات من توافق `pluginApi` و`minGatewayVersion`
المعلن عنهما قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة أثرًا من
ClawPack، يفضّل OpenClaw ملف `.tgz` الدقيق المرفوع بصيغة npm-pack، ويتحقق من
ترويسة ملخص ClawHub والبايتات المنزّلة، ويسجل بيانات وصفية للأثر من أجل
التحديثات اللاحقة.

## CLI الخاص بـ ClawHub

CLI الخاص بـ ClawHub مخصص للعمل الموثق في السجل:

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

يتضمن CLI أيضًا أوامر تثبيت/تحديث المهارات لتدفقات السجل المباشرة:

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

- `--slug <slug>`: اسم عنوان URL للمهارة المنشورة.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغييرات.
- `--tags <tags>`: وسوم مفصولة بفواصل، والقيمة الافتراضية هي `latest`.

انشر Pluginات من مجلد محلي أو `owner/repo` أو `owner/repo@ref` أو عنوان URL على GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة من دون رفع، و`--json`
لإخراج مناسب لـ CI.

يجب أن تتضمن Pluginات الكود بيانات التوافق الوصفية المطلوبة لـ OpenClaw في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) لمرجع الأوامر الكامل
و[تنسيق المهارات](/ar/clawhub/skill-format) لبيانات المهارات الوصفية.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة
أحدث حالة فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصات آلية على المهارات المنشورة وإصدارات Pluginات. قد تختفي
الإصدارات المحتجزة للفحص أو المحظورة من الكتالوج العام وأسطح التثبيت بينما
تبقى مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجّلين الإبلاغ عن المهارات والحزم. يمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الأمان](/ar/clawhub/security)،
[تدقيقات الأمان](/ar/clawhub/security-audits)،
[الإشراف وسلامة الحساب](/ar/clawhub/moderation)، و
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) لمعرفة تفاصيل السياسات والإنفاذ.

## القياس عن بُعد والبيئة

عند تشغيل `clawhub install` أثناء تسجيل الدخول، قد يرسل CLI حدث تثبيت بأفضل جهد
حتى يتمكن ClawHub من حساب إجمالي أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | يتجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | يتجاوز عنوان URL الخاص بواجهة API للسجل.          |
| `CLAWHUB_CONFIG_PATH`         | يتجاوز المكان الذي يخزن فيه CLI حالة الرمز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | يتجاوز دليل العمل الافتراضي.                     |
| `CLAWHUB_DISABLE_TELEMETRY=1` | يعطّل قياس التثبيت عن بُعد.                       |

راجع [القياس عن بُعد](/ar/clawhub/telemetry)، و[HTTP API](/ar/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) لمواد مرجعية أكثر تفصيلًا.
