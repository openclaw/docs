---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins في السجل
    - الاختيار بين تدفقات CLI الخاصة بـ openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وCLI الخاص بـ clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T15:24:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لمهارات OpenClaw وPluginاته.

- استخدم أوامر `openclaw` الأصلية للبحث عن المهارات وتثبيتها وتحديثها، ولتثبيت الـPlugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لمصادقة السجل، والنشر، وسير عمل الحذف/إلغاء الحذف.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن المهارات وثبّتها باستخدام OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

ابحث عن الـPlugins وثبّتها باستخدام OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ثبّت CLI الخاص بـClawHub عندما تريد سير عمل مصادقًا عليه من السجل، مثل
النشر أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح          | ما يخزّنه                                                   | الأمر المعتاد                                |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | حزم نصية ذات إصدارات تتضمن `SKILL.md` وملفات داعمة           | `openclaw skills install @openclaw/demo`     |
| Plugins برمجية | حزم Plugin لـOpenClaw مع بيانات تعريف للتوافق                | `openclaw plugins install clawhub:<package>` |
| Plugins حزمية  | حزم Plugin معبأة لتوزيع OpenClaw                             | `clawhub package publish <source>`           |

يتتبع ClawHub إصدارات semver، والوسوم مثل `latest`، وسجلات التغييرات، والملفات،
والتنزيلات، والنجوم، وملخصات فحص الأمان. تعرض الصفحات العامة حالة السجل الحالية
حتى يتمكن المستخدمون من فحص مهارة أو Plugin قبل تثبيته.

## مسارات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية في مساحة عمل OpenClaw النشطة وتحتفظ ببيانات تعريف
المصدر حتى تتمكن أوامر التحديث اللاحقة من البقاء على ClawHub.

استخدم `clawhub:<package>` عندما يجب أن يتم حل تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Plugin العارية الآمنة لـnpm عبر npm أثناء انتقالات الإطلاق، بينما
يبقى `npm:<package>` خاصًا بـnpm فقط عندما يجب أن يكون المصدر صريحًا.

تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و`minGatewayVersion`
المعلنين قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة أثرًا من ClawPack،
يفضّل OpenClaw ملف `.tgz` المطابق الذي رُفع من npm-pack، ويتحقق من
ترويسة ملخص ClawHub والبايتات المنزلة، ويسجل بيانات تعريف الأثر للتحديثات اللاحقة.

## CLI الخاص بـClawHub

CLI الخاص بـClawHub مخصص للعمل المصادق عليه من السجل:

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

يحتوي CLI أيضًا على أوامر تثبيت/تحديث المهارات لمسارات السجل المباشرة:

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
- `--tags <tags>`: وسوم مفصولة بفواصل، والافتراضي هو `latest`.

انشر الـPlugins من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان URL
على GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لبناء خطة النشر الدقيقة دون رفع، و`--json`
لإخراج ملائم لـCI.

يجب أن تتضمن Plugins البرمجية بيانات تعريف توافق OpenClaw المطلوبة في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) لمرجع الأوامر الكامل
و[تنسيق المهارة](/clawhub/skill-format) لبيانات تعريف المهارات.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حساب GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة
أحدث حالة فحص قبل التثبيت أو التنزيل.

يشغّل ClawHub فحوصات آلية على المهارات المنشورة وإصدارات الـPlugin. قد تختفي
الإصدارات المحتجزة للفحص أو المحظورة من الفهرس العام وأسطح التثبيت بينما
تبقى مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجلين الإبلاغ عن المهارات والحزم. يمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الأمان](/ar/clawhub/security)،
[تدقيقات الأمان](/clawhub/security-audits)،
[الإشراف وسلامة الحساب](/clawhub/moderation)، و
[الاستخدام المقبول](/ar/clawhub/acceptable-usage) للحصول على تفاصيل السياسة والإنفاذ.

## القياسات والبيئة

عند تشغيل `clawhub install` أثناء تسجيل الدخول، قد يرسل CLI حدث تثبيت بأفضل جهد
حتى يتمكن ClawHub من حساب إجمالي أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                      | التأثير                                      |
| ----------------------------- | ------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL لواجهة API الخاصة بالسجل.   |
| `CLAWHUB_CONFIG_PATH`         | تجاوز مكان تخزين CLI لحالة الرمز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                 |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل قياسات التثبيت.                       |

راجع [القياسات](/clawhub/telemetry)، و[HTTP API](/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) للحصول على مواد مرجعية أعمق.
