---
read_when:
    - شرح ماهية ClawHub
    - البحث عن Skills أو Plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins في السجل
    - الاختيار بين مسارات CLI في openclaw وclawhub
sidebarTitle: ClawHub
summary: نظرة عامة عامة على ClawHub للاكتشاف والتثبيت والنشر والأمان وواجهة clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-07-16T13:32:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub هو السجل العام لـ Skills وplugins الخاصة بـ OpenClaw.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لمصادقة السجل والنشر وسير عمل الحذف/إلغاء الحذف.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

ابحث عن Skills وثبّتها باستخدام OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

ابحث عن plugins وثبّتها باستخدام OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ثبّت CLI الخاص بـ ClawHub عندما تريد سير عمل مصادقًا عليه عبر السجل، مثل
النشر أو الحذف/إلغاء الحذف:

```bash
npm i -g clawhub
# أو
pnpm add -g clawhub
```

## ما يستضيفه ClawHub

| السطح          | ما يخزّنه                                                     | الأمر المعتاد                                 |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | حِزم نصية ذات إصدارات تحتوي على `SKILL.md` إضافةً إلى ملفات داعمة | `openclaw skills install @openclaw/demo`     |
| plugins البرمجية | حِزم plugins خاصة بـ OpenClaw مع بيانات تعريف التوافق         | `openclaw plugins install clawhub:<package>` |
| plugins المجمّعة | حِزم plugins مُعدّة للتوزيع مع OpenClaw                      | `clawhub package publish <source>`           |

يتتبّع ClawHub إصدارات semver، ووسومًا مثل `latest`، وسجلات التغييرات، والملفات،
والتنزيلات، والنجوم، وملخصات الفحص الأمني. تعرض الصفحات العامة حالة السجل
الحالية كي يتمكن المستخدمون من فحص Skill أو plugin قبل تثبيته.

## مسارات OpenClaw الأصلية

تثبّت أوامر OpenClaw الأصلية العناصر في مساحة عمل OpenClaw النشطة وتحفظ
بيانات تعريف المصدر لكي تظل أوامر التحديث اللاحقة متصلة بـ ClawHub.

استخدم `clawhub:<package>` عندما ينبغي حلّ تثبيت plugin عبر ClawHub.
قد تُحل مواصفات plugins المجردة والآمنة لـ npm عبر npm أثناء عمليات الانتقال عند الإطلاق، ويظل
`npm:<package>` مخصصًا لـ npm فقط عندما يجب تحديد المصدر صراحةً.

تتحقق عمليات تثبيت plugins من توافق `pluginApi` و`minGatewayVersion`
المعلن عنه قبل تشغيل تثبيت الأرشيف. عندما ينشر إصدار حزمة أداة ClawPack، يفضّل OpenClaw ملف `.tgz` الدقيق المرفوع بواسطة npm-pack، ويتحقق
من ترويسة ملخص ClawHub والبايتات المنزّلة، ويسجل بيانات تعريف الأداة من أجل
التحديثات اللاحقة.

## CLI الخاص بـ ClawHub

CLI الخاص بـ ClawHub مخصص للعمل المصادق عليه عبر السجل:

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

يتضمن CLI أيضًا أوامر تثبيت Skills وتحديثها لمسارات العمل المباشرة مع السجل:

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

- `--slug <slug>`: اسم عنوان URL الخاص بـ Skill المنشورة.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغييرات.
- `--tags <tags>`: وسوم مفصولة بفواصل، وقيمتها الافتراضية `latest`.

انشر plugins من مجلد محلي، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان URL على GitHub:

```bash
clawhub package publish <source>
```

استخدم `--dry-run` لإنشاء خطة النشر الدقيقة من دون رفع، واستخدم `--json`
لإخراج ملائم لـ CI.

يجب أن تتضمن plugins البرمجية بيانات تعريف التوافق المطلوبة مع OpenClaw في
`package.json`، بما في ذلك `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. راجع [CLI](/ar/clawhub/cli) للاطلاع على مرجع الأوامر
الكامل، و[تنسيق Skill](/clawhub/skill-format) للاطلاع على بيانات تعريف Skill.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا: يمكن لأي شخص الرفع، لكن النشر يتطلب حسابًا على GitHub
قديمًا بما يكفي لاجتياز بوابة الرفع. تلخص صفحات التفاصيل العامة
أحدث حالة فحص قبل التثبيت أو التنزيل.

يجري ClawHub فحوصات آلية على Skills المنشورة وإصدارات plugins. قد تختفي
الإصدارات المحتجزة للفحص أو المحظورة من الكتالوج العام وواجهات التثبيت، بينما
تظل مرئية لمالكها في `/dashboard`.

يمكن للمستخدمين المسجلين الدخول الإبلاغ عن Skills والحِزم. ويمكن للمشرفين مراجعة البلاغات،
وإخفاء المحتوى أو استعادته، وحظر الحسابات المسيئة. راجع
[الأمان](/ar/clawhub/security)،
[عمليات التدقيق الأمني](/clawhub/security-audits)،
[الإشراف وسلامة الحساب](/clawhub/moderation)، و
[الاستخدام المقبول](/clawhub/acceptable-usage) للاطلاع على تفاصيل السياسات والإنفاذ.

## القياس عن بُعد والبيئة

عند تشغيل `clawhub install` أثناء تسجيل الدخول، قد يرسل CLI حدث تثبيت
على أساس أفضل جهد لكي يتمكن ClawHub من حساب إجمالي أعداد التثبيت. عطّل ذلك باستخدام:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

تجاوزات البيئة المفيدة:

| المتغير                       | التأثير                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع المستخدم لتسجيل الدخول عبر المتصفح. |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL لواجهة API الخاصة بالسجل.          |
| `CLAWHUB_CONFIG_PATH`         | تجاوز الموقع الذي يخزّن فيه CLI حالة الرمز المميز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياس عن بُعد لعمليات التثبيت.              |

راجع [القياس عن بُعد](/clawhub/telemetry)، و[واجهة HTTP API](/clawhub/http-api)، و
[استكشاف الأخطاء وإصلاحها](/ar/clawhub/troubleshooting) للاطلاع على مواد مرجعية أكثر تفصيلًا.
