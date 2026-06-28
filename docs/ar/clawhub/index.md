---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو Plugins أو تثبيتها أو تحديثها
    - نشر Skills أو plugins في السجل
    - الاختيار بين تدفقات CLI في openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وواجهة clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T05:07:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لـ Skills والمكونات الإضافية الخاصة بـ OpenClaw.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت المكونات الإضافية من ClawHub.
- استخدم CLI المنفصل `clawhub` لمصادقة السجل والنشر وتدفقات عمل الحذف/إلغاء الحذف.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن Skills وثبّتها باستخدام OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

ابحث عن المكونات الإضافية وثبّتها باستخدام OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ثبّت CLI الخاص بـ ClawHub عندما تريد تدفقات عمل موثّقة في السجل مثل
النشر أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح         | ما يخزّنه                                                    | الأمر النموذجي                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | حِزم نصية ذات إصدارات مع `SKILL.md` وملفات داعمة             | `openclaw skills install @openclaw/demo`     |
| المكونات الإضافية البرمجية | حزم مكونات إضافية لـ OpenClaw مع بيانات تعريف التوافق | `openclaw plugins install clawhub:<package>` |
| مكونات الحِزم الإضافية | حِزم مكونات إضافية مُغلّفة لتوزيع OpenClaw              | `clawhub package publish <source>`           |

يتتبع ClawHub إصدارات semver، والوسوم مثل `latest`، وسجلات التغييرات، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص Skill أو مكوّن إضافي قبل تثبيته.

## تدفقات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية داخل مساحة عمل OpenClaw النشطة، وتحفظ
بيانات تعريف المصدر حتى تتمكن أوامر التحديث اللاحقة من البقاء على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يُحل تثبيت مكوّن إضافي عبر ClawHub.
قد تُحل مواصفات المكونات الإضافية العارية والصالحة لـ npm عبر npm أثناء انتقالات الإطلاق، ويبقى
`npm:<package>` محصورًا في npm فقط عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت المكونات الإضافية من توافق `pluginApi` و`minGatewayVersion`
المُعلن عنهما قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة قطعة ClawPack،
يفضّل OpenClaw ملف `.tgz` المطابق تمامًا والمرفوع بصيغة npm-pack، ويتحقق
من ترويسة ملخص ClawHub والبايتات المُنزّلة، ويسجل بيانات تعريف القطعة
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
```

يتضمن CLI أيضًا أوامر تثبيت/تحديث Skills لتدفقات عمل السجل المباشرة:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

تثبّت تلك الأوامر Skills في `./skills` ضمن دليل العمل الحالي
وتسجل الإصدارات المثبّتة في `.clawhub/lock.json`.

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
- `--tags <tags>`: وسوم مفصولة بفواصل، والقيمة الافتراضية هي `latest`.

انشر المكونات الإضافية من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان URL من GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة دون رفع، و`--json`
لإخراج مناسب لأنظمة CI.

يجب أن تتضمن المكونات الإضافية البرمجية بيانات تعريف توافق OpenClaw المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) للحصول على مرجع الأوامر
الكامل و[تنسيق Skill](/ar/clawhub/skill-format) لبيانات تعريف Skills.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة
أحدث حالة فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصات آلية على Skills وإصدارات المكونات الإضافية المنشورة. قد تختفي
الإصدارات المحتجزة بسبب الفحص أو المحظورة من الفهرس العام وأسطح التثبيت، مع
بقائها مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجلين الإبلاغ عن Skills والحزم. يستطيع المشرفون مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الأمان](/ar/clawhub/security)،
[تدقيقات الأمان](/ar/clawhub/security-audits)،
[الإشراف وسلامة الحساب](/ar/clawhub/moderation)، و
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) لتفاصيل السياسة والإنفاذ.

## القياسات عن بُعد والبيئة

عند تشغيل `clawhub install` وأنت مسجل الدخول، قد يرسل CLI حدث تثبيت بأفضل جهد
حتى يتمكن ClawHub من حساب إجمالي أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                      | التأثير                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL لواجهة API الخاصة بالسجل.         |
| `CLAWHUB_CONFIG_PATH`         | تجاوز المكان الذي يخزن فيه CLI حالة الرمز المميز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل قياسات التثبيت عن بُعد.                     |

راجع [القياسات عن بُعد](/ar/clawhub/telemetry)، و[واجهة HTTP API](/ar/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) للحصول على مواد مرجعية أعمق.
