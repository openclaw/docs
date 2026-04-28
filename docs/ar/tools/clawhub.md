---
read_when:
    - البحث عن Skills أو Plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - إعداد CLI الخاص بـ clawhub أو تجاوزات البيئة الخاصة به
sidebarTitle: ClawHub
summary: 'ClawHub: سجل عام لمهارات Skills وPlugins الخاصة بـ OpenClaw، وتدفقات التثبيت الأصلية، وCLI الخاص بـ clawhub'
title: ClawHub
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:41:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub هو السجل العام لـ **Skills وPlugins الخاصة بـ OpenClaw**.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، وكذلك لتثبيت Plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` من أجل مصادقة السجل، والنشر، والحذف/إلغاء الحذف، وتدفقات المزامنة.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

<Steps>
  <Step title="البحث">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="التثبيت">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="الاستخدام">
    ابدأ جلسة OpenClaw جديدة — وستلتقط Skill الجديدة.
  </Step>
  <Step title="النشر (اختياري)">
    بالنسبة إلى التدفقات التي تتطلب مصادقة السجل (النشر، والمزامنة، والإدارة)، ثبّت
    CLI المنفصل `clawhub`:

    ```bash
    npm i -g clawhub
    # أو
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## تدفقات OpenClaw الأصلية

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تثبّت أوامر `openclaw` الأصلية داخل مساحة العمل النشطة لديك
    وتحفظ بيانات وصفية للمصدر حتى تتمكن استدعاءات `update` اللاحقة من
    البقاء على ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    كما تُجرَّب مواصفات Plugins الآمنة الخاصة بـ npm من دون بادئة أيضًا على ClawHub قبل npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    تتحقق عمليات تثبيت Plugins من توافق
    `pluginApi` و`minGatewayVersion` المُعلَنَين قبل تشغيل تثبيت الأرشيف، حتى
    تفشل المضيفات غير المتوافقة بشكل مغلق مبكرًا بدلًا من تثبيت
    الحزمة جزئيًا.

  </Tab>
</Tabs>

<Note>
لا يقبل `openclaw plugins install clawhub:...` إلا عائلات Plugins
القابلة للتثبيت. وإذا كانت حزمة ClawHub في الحقيقة Skill، فإن OpenClaw
يتوقف ويوجهك إلى `openclaw skills install <slug>` بدلًا من ذلك.

كما أن عمليات تثبيت Plugins من ClawHub بشكل مجهول تفشل بشكل مغلق للحزم الخاصة.
ويمكن للقنوات المجتمعية أو غير الرسمية الأخرى أن تثبّت رغم ذلك، لكن OpenClaw
يحذّر حتى يتمكن المشغّلون من مراجعة المصدر والتحقق قبل
تفعيلها.
</Note>

## ما هو ClawHub

- سجل عام لـ Skills وPlugins الخاصة بـ OpenClaw.
- مخزن ذو إصدارات لحِزم Skills وبياناتها الوصفية.
- واجهة اكتشاف للبحث، والوسوم، وإشارات الاستخدام.

تكون Skill النموذجية حزمة ذات إصدار من الملفات تتضمن:

- ملف `SKILL.md` يحتوي على الوصف الأساسي وطريقة الاستخدام.
- إعدادات أو سكريبتات أو ملفات داعمة اختيارية تستخدمها Skill.
- بيانات وصفية مثل الوسوم، والملخص، ومتطلبات التثبيت.

يستخدم ClawHub البيانات الوصفية لتفعيل الاكتشاف وتعريض قدرات Skill
بشكل آمن. ويتتبع السجل إشارات الاستخدام (النجوم، والتنزيلات) من أجل
تحسين الترتيب والظهور. وينشئ كل نشر إصدار semver
جديدًا، ويحتفظ السجل بسجل الإصدارات حتى يتمكن المستخدمون من تدقيق
التغييرات.

## تحميل مساحة العمل وSkills

يثبّت CLI المنفصل `clawhub` أيضًا Skills داخل `./skills` ضمن
دليل العمل الحالي لديك. وإذا كانت مساحة عمل OpenClaw مضبوطة،
فإن `clawhub` يعود إلى مساحة العمل تلك ما لم تتجاوز ذلك عبر `--workdir`
(أو `CLAWHUB_WORKDIR`). ويحمّل OpenClaw Skills مساحة العمل من
`<workspace>/skills` ويلتقطها في الجلسة **التالية**.

إذا كنت تستخدم بالفعل `~/.openclaw/skills` أو Skills المضمّنة،
فإن Skills مساحة العمل لها الأولوية. ولمزيد من التفاصيل حول كيفية تحميل Skills
ومشاركتها وتقييدها، راجع [Skills](/ar/tools/skills).

## ميزات الخدمة

| الميزة            | الملاحظات                                                  |
| ----------------- | ---------------------------------------------------------- |
| التصفح العام      | تكون Skills ومحتوى `SKILL.md` الخاص بها مرئية علنًا.       |
| البحث             | مدعوم بالتضمين (بحث متجهي)، وليس بالكلمات المفتاحية فقط.   |
| الإصدارات         | Semver، وسجلات التغييرات، والوسوم (بما في ذلك `latest`).   |
| التنزيلات         | ملف Zip لكل إصدار.                                         |
| النجوم والتعليقات | ملاحظات المجتمع.                                           |
| الإشراف           | الموافقات وعمليات التدقيق.                                 |
| API مناسب لـ CLI  | مناسب للأتمتة والسكريبتات.                                  |

## الأمان والإشراف

ClawHub مفتوح افتراضيًا — يمكن لأي شخص رفع Skills، لكن يجب أن يكون
عمر حساب GitHub **أسبوعًا واحدًا على الأقل** للنشر. وهذا يبطئ
إساءة الاستخدام من دون حظر المساهمين الحقيقيين.

<AccordionGroup>
  <Accordion title="الإبلاغ">
    - يمكن لأي مستخدم مسجّل الدخول الإبلاغ عن Skill.
    - أسباب الإبلاغ مطلوبة وتُسجّل.
    - يمكن لكل مستخدم أن يكون لديه حتى 20 بلاغًا نشطًا في الوقت نفسه.
    - تُخفى Skills التي تتلقى أكثر من 3 بلاغات فريدة تلقائيًا افتراضيًا.
  </Accordion>
  <Accordion title="الإشراف">
    - يمكن للمشرفين عرض Skills المخفية، وإلغاء إخفائها، وحذفها، أو حظر المستخدمين.
    - قد يؤدي إساءة استخدام ميزة الإبلاغ إلى حظر الحسابات.
    - هل تهتم بأن تصبح مشرفًا؟ اسأل في Discord الخاص بـ OpenClaw وتواصل مع أحد المشرفين أو القائمين على الصيانة.
  </Accordion>
</AccordionGroup>

## CLI الخاص بـ ClawHub

لا تحتاج إلى هذا إلا للتدفقات التي تتطلب مصادقة السجل مثل
النشر/المزامنة.

### الخيارات العامة

<ParamField path="--workdir <dir>" type="string">
  دليل العمل. الافتراضي: الدليل الحالي؛ ويعود إلى مساحة عمل OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  دليل Skills، نسبةً إلى workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  عنوان URL الأساسي للموقع (تسجيل الدخول عبر المتصفح).
</ParamField>
<ParamField path="--registry <url>" type="string">
  عنوان URL الأساسي لـ API السجل.
</ParamField>
<ParamField path="--no-input" type="boolean">
  تعطيل المطالبات (غير تفاعلي).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  طباعة إصدار CLI.
</ParamField>

### الأوامر

<AccordionGroup>
  <Accordion title="المصادقة (login / logout / whoami)">
    ```bash
    clawhub login              # تدفق المتصفح
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    خيارات تسجيل الدخول:

    - `--token <token>` — ألصق رمز API.
    - `--label <label>` — التسمية المخزنة لرموز تسجيل الدخول عبر المتصفح (الافتراضي: `CLI token`).
    - `--no-browser` — لا تفتح متصفحًا (يتطلب `--token`).

  </Accordion>
  <Accordion title="البحث">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — الحد الأقصى للنتائج.

  </Accordion>
  <Accordion title="التثبيت / التحديث / العرض">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    الخيارات:

    - `--version <version>` — التثبيت أو التحديث إلى إصدار محدد (slug واحد فقط في `update`).
    - `--force` — الكتابة فوقه إذا كان المجلد موجودًا بالفعل، أو عندما لا تطابق الملفات المحلية أي إصدار منشور.
    - يقرأ `clawhub list` الملف `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="نشر Skills">
    ```bash
    clawhub skill publish <path>
    ```

    الخيارات:

    - `--slug <slug>` — slug الخاص بالـ Skill.
    - `--name <name>` — اسم العرض.
    - `--version <version>` — إصدار semver.
    - `--changelog <text>` — نص سجل التغييرات (يمكن أن يكون فارغًا).
    - `--tags <tags>` — وسوم مفصولة بفواصل (الافتراضي: `latest`).

  </Accordion>
  <Accordion title="نشر Plugins">
    ```bash
    clawhub package publish <source>
    ```

    يمكن أن يكون `<source>` مجلدًا محليًا، أو `owner/repo`، أو `owner/repo@ref`، أو
    عنوان URL لـ GitHub.

    الخيارات:

    - `--dry-run` — ابنِ خطة النشر الدقيقة من دون رفع أي شيء.
    - `--json` — أخرج ناتجًا مقروءًا آليًا من أجل CI.
    - `--source-repo` و`--source-commit` و`--source-ref` — تجاوزات اختيارية عندما لا يكون الاكتشاف التلقائي كافيًا.

  </Accordion>
  <Accordion title="الحذف / إلغاء الحذف (المالك أو المشرف)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="المزامنة (فحص المحلي + نشر الجديد أو المحدّث)">
    ```bash
    clawhub sync
    ```

    الخيارات:

    - `--root <dir...>` — جذور فحص إضافية.
    - `--all` — ارفع كل شيء من دون مطالبات.
    - `--dry-run` — اعرض ما الذي سيُرفع.
    - `--bump <type>` — `patch|minor|major` للتحديثات (الافتراضي: `patch`).
    - `--changelog <text>` — سجل تغييرات للتحديثات غير التفاعلية.
    - `--tags <tags>` — وسوم مفصولة بفواصل (الافتراضي: `latest`).
    - `--concurrency <n>` — فحوصات السجل (الافتراضي: `4`).

  </Accordion>
</AccordionGroup>

## تدفقات العمل الشائعة

<Tabs>
  <Tab title="البحث">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="التثبيت">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="تحديث الكل">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="نشر Skill واحدة">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="مزامنة العديد من Skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="نشر Plugin من GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### البيانات الوصفية لحزمة Plugin

يجب أن تتضمن Plugins البرمجية البيانات الوصفية المطلوبة الخاصة بـ OpenClaw في
`package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

يجب أن تشحن الحزم المنشورة **JavaScript مبنيًا** وأن تشير
`runtimeExtensions` إلى ذلك الناتج. ولا تزال عمليات التثبيت من Git checkout قادرة على
الرجوع إلى مصدر TypeScript عندما لا توجد ملفات مبنية، لكن
إدخالات بيئة التشغيل المبنية تتجنب تجميع TypeScript أثناء التشغيل في مسارات بدء التشغيل وdoctor
وتحميل Plugin.

## الإصدارات وlockfile والقياس عن بُعد

<AccordionGroup>
  <Accordion title="الإصدارات والوسوم">
    - ينشئ كل نشر `SkillVersion` جديدًا وفق **semver**.
    - تشير الوسوم (مثل `latest`) إلى إصدار؛ ويسمح نقل الوسوم بالتراجع.
    - تُرفق سجلات التغييرات بكل إصدار ويمكن أن تكون فارغة عند المزامنة أو نشر التحديثات.
  </Accordion>
  <Accordion title="التغييرات المحلية مقابل إصدارات السجل">
    تقارن التحديثات محتويات Skill المحلية بإصدارات السجل باستخدام
    hash للمحتوى. وإذا لم تطابق الملفات المحلية أي إصدار منشور، فإن
    CLI يسأل قبل الكتابة فوقها (أو يتطلب `--force` في
    التشغيلات غير التفاعلية).
  </Accordion>
  <Accordion title="فحص المزامنة والجذور الاحتياطية">
    يفحص `clawhub sync` workdir الحالي أولًا. وإذا لم يعثر على Skills،
    فإنه يعود إلى مواقع قديمة معروفة (مثل
    `~/openclaw/skills` و`~/.openclaw/skills`). وقد صُمم هذا من أجل
    العثور على تثبيتات Skills الأقدم من دون أعلام إضافية.
  </Accordion>
  <Accordion title="التخزين وlockfile">
    - تُسجَّل Skills المثبتة في `.clawhub/lock.json` ضمن workdir لديك.
    - تُخزَّن رموز المصادقة في ملف إعداد CLI الخاص بـ ClawHub (يمكن التجاوز عبر `CLAWHUB_CONFIG_PATH`).
  </Accordion>
  <Accordion title="القياس عن بُعد (عدادات التثبيت)">
    عندما تشغّل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI
    لقطة دنيا لحساب أعداد التثبيت. ويمكنك تعطيل ذلك بالكامل:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## متغيرات البيئة

| المتغير                      | التأثير                                         |
| ---------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`               | تجاوز عنوان URL الخاص بالموقع.                  |
| `CLAWHUB_REGISTRY`           | تجاوز عنوان URL الخاص بـ API السجل.             |
| `CLAWHUB_CONFIG_PATH`        | تجاوز مكان تخزين CLI للرمز/الإعداد.             |
| `CLAWHUB_WORKDIR`            | تجاوز workdir الافتراضي.                        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياس عن بُعد في `sync`.                 |

## ذو صلة

- [Plugins المجتمع](/ar/plugins/community)
- [Plugins](/ar/tools/plugin)
- [Skills](/ar/tools/skills)
