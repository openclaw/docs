---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - الاختيار بين تدفقات CLI في openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وCLI الخاص بـ clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-02T08:17:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لمهارات OpenClaw وإضافاته.

- استخدم أوامر `openclaw` الأصلية للبحث عن المهارات وتثبيتها وتحديثها، ولتثبيت الإضافات من ClawHub.
- استخدم CLI المنفصل `clawhub` للمصادقة في السجل، والنشر، وسير عمل الحذف/إلغاء الحذف.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن المهارات وثبّتها باستخدام OpenClaw:

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

| السطح         | ما يخزّنه                                                     | الأمر المعتاد                                |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | حزم نصية ذات إصدارات تحتوي على `SKILL.md` وملفات داعمة       | `openclaw skills install @openclaw/demo`     |
| إضافات الشيفرة | حزم Plugin لـ OpenClaw مع بيانات وصفية للتوافق              | `openclaw plugins install clawhub:<package>` |
| إضافات الحزم   | حزم Plugin مغلّفة لتوزيع OpenClaw                            | `clawhub package publish <source>`           |

يتتبع ClawHub إصدارات semver، والوسوم مثل `latest`، وسجلات التغييرات، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص مهارة أو Plugin قبل تثبيته.

## تدفقات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية داخل مساحة عمل OpenClaw النشطة وتحفظ
بيانات تعريف المصدر حتى تتمكن أوامر التحديث اللاحقة من البقاء على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يحل تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Plugin العارية الآمنة لـ npm عبر npm أثناء انتقالات الإطلاق، ويظل
`npm:<package>` مقتصرًا على npm فقط عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و`minGatewayVersion`
المُعلن قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة أداة ClawPack، يفضّل
OpenClaw ملف `.tgz` الدقيق المرفوع بحزمة npm، ويتحقق من ترويسة ملخص ClawHub
والبايتات المنزّلة، ويسجل بيانات تعريف الأداة للتحديثات اللاحقة.

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

يحتوي CLI أيضًا على أوامر لتثبيت المهارات وتحديثها لسير العمل المباشر مع السجل:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

تثبّت هذه الأوامر المهارات في `./skills` ضمن دليل العمل الحالي
وتسجل الإصدارات المثبّتة في `.clawhub/lock.json`.

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

انشر الإضافات من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان URL
على GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة دون رفع، و`--json`
للحصول على مخرجات مناسبة لـ CI.

يجب أن تتضمن إضافات الشيفرة بيانات تعريف التوافق المطلوبة من OpenClaw في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) للحصول على مرجع الأوامر
الكامل و[تنسيق المهارة](/clawhub/skill-format) لبيانات تعريف المهارة.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخّص صفحات التفاصيل العامة أحدث حالة
فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصات آلية على المهارات المنشورة وإصدارات Plugin. قد تختفي
الإصدارات المحتجزة للفحص أو المحظورة من الفهرس العام وأسطح التثبيت أثناء
بقائها مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجّلين الإبلاغ عن المهارات والحزم. يمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الأمان](/ar/clawhub/security)،
[تدقيقات الأمان](/clawhub/security-audits)،
[الإشراف وسلامة الحساب](/clawhub/moderation)، و
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) لتفاصيل السياسات والإنفاذ.

## القياس عن بُعد والبيئة

عند تشغيل `clawhub install` أثناء تسجيل الدخول، قد يرسل CLI حدث تثبيت بأفضل جهد
حتى يتمكن ClawHub من حساب إجمالي أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL لواجهة API الخاصة بالسجل.         |
| `CLAWHUB_CONFIG_PATH`         | تجاوز مكان تخزين CLI لحالة الرمز/الإعدادات.       |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياس عن بُعد للتثبيت.                    |

راجع [القياس عن بُعد](/clawhub/telemetry)، و[HTTP API](/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) للحصول على مواد مرجعية أعمق.
