---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو Plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins في السجل
    - الاختيار بين مسارات CLI في OpenClaw وClawHub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وواجهة CLI الخاصة بـ clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T05:41:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لـ Skills وPlugins الخاصة بـ OpenClaw.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت Plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لمصادقة السجل والنشر وسير عمل الحذف/التراجع عن الحذف.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن Skills وثبّتها باستخدام OpenClaw:

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

ثبّت CLI الخاص بـ ClawHub عندما تريد تنفيذ مهام تتطلب المصادقة مع السجل، مثل
النشر أو الحذف/التراجع عن الحذف:

```bash
npm i -g clawhub
# أو
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح          | ما يخزّنه                                                    | الأمر المعتاد                                |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | حزم نصية ذات إصدارات تحتوي على `SKILL.md` وملفات داعمة       | `openclaw skills install @openclaw/demo`     |
| Plugins برمجية | حزم Plugins خاصة بـ OpenClaw مع بيانات وصفية للتوافق         | `openclaw plugins install clawhub:<package>` |
| Plugins مجمّعة | حزم Plugins معبّأة لتوزيع OpenClaw                           | `clawhub package publish <source>`           |

يتتبّع ClawHub إصدارات semver والوسوم مثل `latest` وسجلات التغييرات والملفات
والتنزيلات والنجوم وملخصات الفحص الأمني. تعرض الصفحات العامة الحالة الحالية للسجل
حتى يتمكن المستخدمون من فحص Skill أو Plugin قبل تثبيته.

## مسارات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية العناصر في مساحة عمل OpenClaw النشطة، وتحفظ
البيانات الوصفية للمصدر لكي تظل أوامر التحديث اللاحقة مرتبطة بـ ClawHub.

استخدم `clawhub:<package>` عندما ينبغي حل تثبيت Plugin عبر ClawHub.
قد تُحل مواصفات Plugins المجرّدة والصالحة لـ npm عبر npm أثناء عمليات الانتقال عند الإطلاق،
بينما يظل `npm:<package>` مقتصرًا على npm عندما يجب تحديد المصدر صراحةً.

تتحقق عمليات تثبيت Plugins من توافق `pluginApi` و`minGatewayVersion`
المُعلن عنه قبل بدء تثبيت الأرشيف. عندما ينشر إصدار حزمة عنصرًا من نوع
ClawPack، يفضّل OpenClaw ملف npm-pack المرفوع المطابق تمامًا بصيغة `.tgz`، ويتحقق
من ترويسة ملخص ClawHub والبايتات المنزّلة، ويسجّل البيانات الوصفية للعنصر
لاستخدامها في التحديثات اللاحقة.

## CLI الخاص بـ ClawHub

CLI الخاص بـ ClawHub مخصّص للعمل الذي يتطلب المصادقة مع السجل:

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

يتضمن CLI أيضًا أوامر تثبيت Skills وتحديثها لسير العمل المباشر مع السجل:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
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

- `--slug <slug>`: اسم عنوان URL للـ Skill المنشورة.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغييرات.
- `--tags <tags>`: وسوم مفصولة بفواصل، والقيمة الافتراضية هي `latest`.

انشر Plugins من مجلد محلي أو `owner/repo` أو `owner/repo@ref` أو عنوان URL على GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لإنشاء خطة النشر الدقيقة دون رفع أي شيء، واستخدم `--json`
لإخراج ملائم لأنظمة CI.

يجب أن تتضمن Plugins البرمجية البيانات الوصفية المطلوبة للتوافق مع OpenClaw في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) للاطلاع على مرجع الأوامر
الكامل، و[تنسيق Skill](/clawhub/skill-format) للاطلاع على بيانات Skill الوصفية.

## الأمان والإشراف

يكون ClawHub مفتوحًا افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حسابًا على GitHub
مضى على إنشائه وقت كافٍ لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة
حالة أحدث فحص قبل التثبيت أو التنزيل.

يجري ClawHub عمليات تحقق آلية على Skills المنشورة وإصدارات Plugins. قد تختفي
الإصدارات المحتجزة للفحص أو المحظورة من الكتالوج العام وواجهات التثبيت، مع
بقائها مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجّلين الإبلاغ عن Skills والحزم. ويمكن للمشرفين مراجعة البلاغات
وإخفاء المحتوى أو استعادته وحظر الحسابات المسيئة. راجع
[الأمان](/clawhub/security)،
[عمليات التدقيق الأمني](/ar/clawhub/security-audits)،
[الإشراف وسلامة الحساب](/clawhub/moderation)، و
[الاستخدام المقبول](/clawhub/acceptable-usage) للاطلاع على تفاصيل السياسات والتنفيذ.

## القياس عن بُعد والبيئة

عند تشغيل `clawhub install` أثناء تسجيل الدخول، قد يرسل CLI حدث تثبيت على أساس
بذل أفضل جهد حتى يتمكن ClawHub من حساب إجمالي أعداد عمليات التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL لواجهة API الخاصة بالسجل.                 |
| `CLAWHUB_CONFIG_PATH`         | تجاوز الموقع الذي يخزّن فيه CLI حالة الرمز المميز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                              |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياس عن بُعد لعمليات التثبيت.                     |

راجع [القياس عن بُعد](/ar/clawhub/telemetry)، و[واجهة HTTP API](/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/clawhub/troubleshooting) للاطلاع على مواد مرجعية أكثر تفصيلًا.
