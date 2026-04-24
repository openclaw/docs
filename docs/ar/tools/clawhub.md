---
read_when:
    - تقديم ClawHub للمستخدمين الجدد
    - تثبيت Skills أو Plugins أو البحث عنها أو نشرها
    - شرح أعلام CLI الخاصة بـ ClawHub وسلوك المزامنة
summary: 'دليل ClawHub: السجل العام، وتدفقات تثبيت OpenClaw الأصلية، ومسارات عمل CLI الخاصة بـ ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T08:07:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub هو السجل العام لـ **Skills وPlugins الخاصة بـ OpenClaw**.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، وتثبيت
  Plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` عندما تحتاج إلى مصادقة السجل، أو النشر، أو الحذف،
  أو إلغاء الحذف، أو تدفقات المزامنة.

الموقع: [clawhub.ai](https://clawhub.ai)

## تدفقات OpenClaw الأصلية

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

تُجرَّب مواصفات Plugin المجردة الآمنة لـ npm أيضًا مقابل ClawHub قبل npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

تقوم أوامر `openclaw` الأصلية بالتثبيت داخل مساحة العمل النشطة لديك وتحتفظ ببيانات
المصدر الوصفية بحيث تستطيع استدعاءات `update` اللاحقة البقاء على ClawHub.

تتحقق تثبيتات Plugin من توافق `pluginApi` و`minGatewayVersion`
المعلنين قبل تشغيل تثبيت الأرشيف، بحيث تفشل المضيفات غير المتوافقة في
وضع الإغلاق الآمن مبكرًا بدلًا من تثبيت الحزمة جزئيًا.

لا يقبل `openclaw plugins install clawhub:...` إلا عائلات Plugins القابلة للتثبيت.
وإذا كانت حزمة ClawHub في الحقيقة Skill, فإن OpenClaw يتوقف ويوجهك إلى
`openclaw skills install <slug>` بدلًا من ذلك.

## ما هو ClawHub

- سجل عام لـ Skills وPlugins الخاصة بـ OpenClaw.
- مخزن مُدار بالإصدارات لحزم Skills وبياناتها الوصفية.
- سطح اكتشاف للبحث والوسوم وإشارات الاستخدام.

## كيف يعمل

1. ينشر المستخدم حزمة Skill ‏(ملفات + بيانات وصفية).
2. يخزن ClawHub الحزمة، ويحلل البيانات الوصفية، ويعيّن إصدارًا لها.
3. يفهرس السجل Skill من أجل البحث والاكتشاف.
4. يتصفح المستخدمون Skills ويحمّلونها ويثبتونها في OpenClaw.

## ما الذي يمكنك فعله

- نشر Skills جديدة وإصدارات جديدة من Skills موجودة.
- اكتشاف Skills حسب الاسم أو الوسوم أو البحث.
- تنزيل حزم Skills وفحص ملفاتها.
- الإبلاغ عن Skills المسيئة أو غير الآمنة.
- وإذا كنت مشرفًا، يمكنك الإخفاء أو إلغاء الإخفاء أو الحذف أو الحظر.

## لمن هذا؟ (بأسلوب مناسب للمبتدئين)

إذا كنت تريد إضافة قدرات جديدة إلى وكيل OpenClaw الخاص بك، فإن ClawHub هو أسهل طريقة للعثور على Skills وتثبيتها. ولا تحتاج إلى معرفة كيفية عمل الواجهة الخلفية. يمكنك:

- البحث عن Skills باللغة الطبيعية.
- تثبيت Skill داخل مساحة عملك.
- تحديث Skills لاحقًا بأمر واحد.
- نسخ Skills الخاصة بك احتياطيًا عبر نشرها.

## البدء السريع (غير تقني)

1. ابحث عن شيء تحتاجه:
   - `openclaw skills search "calendar"`
2. ثبّت Skill:
   - `openclaw skills install <skill-slug>`
3. ابدأ جلسة OpenClaw جديدة حتى يلتقط Skill الجديدة.
4. إذا كنت تريد النشر أو إدارة مصادقة السجل، فثبّت CLI المنفصل
   `clawhub` أيضًا.

## ثبّت ClawHub CLI

تحتاج إليه فقط لتدفقات العمل التي تتطلب مصادقة السجل مثل النشر/المزامنة:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## كيف ينسجم مع OpenClaw

يثبّت `openclaw skills install` الأصلي Skills داخل دليل `skills/`
النشط في مساحة العمل. أما `openclaw plugins install clawhub:...` فيسجل
تثبيت Plugin مُدارًا عاديًا بالإضافة إلى بيانات مصدر ClawHub الوصفية للتحديثات.

كما أن تثبيتات Plugins المجهولة من ClawHub تفشل أيضًا في وضع الإغلاق الآمن بالنسبة إلى الحزم الخاصة.
وما تزال القنوات المجتمعية أو غير الرسمية الأخرى قابلة للتثبيت، لكن OpenClaw يحذر
بحيث يتمكن المشغلون من مراجعة المصدر والتحقق قبل التفعيل.

كما يثبت CLI المنفصل `clawhub` أيضًا Skills داخل `./skills` تحت دليل العمل الحالي لديك. وإذا كانت مساحة عمل OpenClaw مضبوطة، فإن `clawhub`
يعود إلى تلك المساحة ما لم تتجاوز ذلك باستخدام `--workdir` ‏(أو
`CLAWHUB_WORKDIR`). يحمّل OpenClaw Skills مساحة العمل من `<workspace>/skills`
وسيلتقطها في الجلسة **التالية**. وإذا كنت تستخدم بالفعل
`~/.openclaw/skills` أو Skills المضمنة، فإن Skills مساحة العمل تحظى بالأولوية.

للحصول على مزيد من التفاصيل حول كيفية تحميل Skills ومشاركتها وضبطها، راجع
[Skills](/ar/tools/skills).

## نظرة عامة على نظام Skills

إن Skill هي حزمة مُدارة بالإصدارات من الملفات تعلّم OpenClaw كيفية تنفيذ
مهمة محددة. وينشئ كل نشر إصدارًا جديدًا، ويحتفظ السجل
بسجل الإصدارات بحيث يمكن للمستخدمين تدقيق التغييرات.

تتضمن Skill النموذجية:

- ملف `SKILL.md` يضم الوصف والاستخدام الأساسيين.
- إعدادات، أو نصوص برمجية، أو ملفات داعمة اختيارية تستخدمها Skill.
- بيانات وصفية مثل الوسوم والملخص ومتطلبات التثبيت.

يستخدم ClawHub البيانات الوصفية لتشغيل الاكتشاف وكشف إمكانات Skills بأمان.
كما يتتبع السجل أيضًا إشارات الاستخدام (مثل النجوم والتنزيلات) لتحسين
الترتيب والرؤية.

## ما الذي توفره الخدمة (الميزات)

- **تصفح عام** لـ Skills ولمحتوى `SKILL.md` الخاص بها.
- **بحث** مدعوم بـ embeddings ‏(بحث متجهي)، وليس بالكلمات المفتاحية فقط.
- **إدارة بالإصدارات** مع semver، وسجلات التغيير، والوسوم (بما في ذلك `latest`).
- **تنزيلات** كملف zip لكل إصدار.
- **نجوم وتعليقات** للحصول على تغذية راجعة من المجتمع.
- خطافات **إشراف** للموافقات والتدقيق.
- **API صديقة لـ CLI** من أجل الأتمتة والبرمجة النصية.

## الأمان والإشراف

يكون ClawHub مفتوحًا افتراضيًا. يمكن لأي شخص رفع Skills، لكن يجب أن يكون عمر حساب GitHub
أسبوعًا واحدًا على الأقل حتى يتمكن من النشر. ويساعد هذا على إبطاء إساءة الاستخدام من دون حظر
المساهمين الشرعيين.

الإبلاغ والإشراف:

- يمكن لأي مستخدم مسجل الدخول الإبلاغ عن Skill.
- أسباب الإبلاغ مطلوبة ويتم تسجيلها.
- يمكن أن يكون لكل مستخدم حتى 20 بلاغًا نشطًا في الوقت نفسه.
- يتم إخفاء Skills التي تحتوي على أكثر من 3 بلاغات فريدة تلقائيًا افتراضيًا.
- يمكن للمشرفين عرض Skills المخفية، أو إلغاء إخفائها، أو حذفها، أو حظر المستخدمين.
- قد تؤدي إساءة استخدام ميزة الإبلاغ إلى حظر الحساب.

هل أنت مهتم بأن تصبح مشرفًا؟ اسأل في Discord الخاص بـ OpenClaw وتواصل مع
مشرف أو مسؤول صيانة.

## أوامر CLI والمعلمات

الخيارات العامة (تنطبق على جميع الأوامر):

- `--workdir <dir>`: دليل العمل (الافتراضي: الدليل الحالي؛ مع الرجوع إلى مساحة عمل OpenClaw).
- `--dir <dir>`: دليل Skills، نسبةً إلى workdir ‏(الافتراضي: `skills`).
- `--site <url>`: عنوان URL الأساسي للموقع (تسجيل الدخول عبر المتصفح).
- `--registry <url>`: عنوان URL الأساسي لـ Registry API.
- `--no-input`: تعطيل المطالبات (غير تفاعلي).
- `-V, --cli-version`: طباعة إصدار CLI.

المصادقة:

- `clawhub login` ‏(تدفق المتصفح) أو `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

الخيارات:

- `--token <token>`: ألصق رمز API.
- `--label <label>`: تسمية يتم تخزينها لرموز تسجيل الدخول عبر المتصفح (الافتراضي: `CLI token`).
- `--no-browser`: لا تفتح متصفحًا (يتطلب `--token`).

البحث:

- `clawhub search "query"`
- `--limit <n>`: الحد الأقصى للنتائج.

التثبيت:

- `clawhub install <slug>`
- `--version <version>`: تثبيت إصدار محدد.
- `--force`: الكتابة فوقه إذا كان المجلد موجودًا بالفعل.

التحديث:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: التحديث إلى إصدار محدد (لسبيكة واحدة فقط).
- `--force`: الكتابة فوقه عندما لا تطابق الملفات المحلية أي إصدار منشور.

السرد:

- `clawhub list` ‏(يقرأ `.clawhub/lock.json`)

نشر Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: slug الخاص بـ Skill.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار semver.
- `--changelog <text>`: نص سجل التغيير (يمكن أن يكون فارغًا).
- `--tags <tags>`: وسوم مفصولة بفواصل (الافتراضي: `latest`).

نشر Plugins:

- `clawhub package publish <source>`
- يمكن أن يكون `<source>` مجلدًا محليًا، أو `owner/repo`, أو `owner/repo@ref`, أو عنوان URL لـ GitHub.
- `--dry-run`: ابنِ خطة النشر الدقيقة من دون رفع أي شيء.
- `--json`: إخراج قابل للقراءة الآلية من أجل CI.
- `--source-repo`, `--source-commit`, `--source-ref`: تجاوزات اختيارية عندما لا يكفي الاكتشاف التلقائي.

الحذف/إلغاء الحذف (للمالك/المشرف فقط):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

المزامنة (فحص Skills المحلية + نشر الجديد/المحدّث):

- `clawhub sync`
- `--root <dir...>`: جذور فحص إضافية.
- `--all`: رفع كل شيء من دون مطالبات.
- `--dry-run`: إظهار ما الذي سيتم رفعه.
- `--bump <type>`: ‏`patch|minor|major` للتحديثات (الافتراضي: `patch`).
- `--changelog <text>`: سجل تغيير للتحديثات غير التفاعلية.
- `--tags <tags>`: وسوم مفصولة بفواصل (الافتراضي: `latest`).
- `--concurrency <n>`: فحوصات السجل (الافتراضي: 4).

## مسارات العمل الشائعة للوكلاء

### البحث عن Skills

```bash
clawhub search "postgres backups"
```

### تنزيل Skills جديدة

```bash
clawhub install my-skill-pack
```

### تحديث Skills المثبتة

```bash
clawhub update --all
```

### نسخ Skills الخاصة بك احتياطيًا (نشر أو مزامنة)

لمجلد Skill واحد:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

لفحص عدد من Skills ونسخها احتياطيًا دفعة واحدة:

```bash
clawhub sync --all
```

### نشر Plugin من GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

يجب أن تتضمن Plugins البرمجية بيانات OpenClaw الوصفية المطلوبة في `package.json`:

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

يجب أن تشحن الحزم المنشورة JavaScript مبنية وأن توجّه `runtimeExtensions`
إلى ذلك الخرج. وما تزال تثبيتات git checkout قادرة على الرجوع إلى مصدر TypeScript
عندما لا توجد ملفات مبنية، لكن إدخالات وقت التشغيل المبنية تتجنب
ترجمة TypeScript وقت التشغيل في مسارات البدء، وdoctor، وتحميل Plugin.

## التفاصيل المتقدمة (تقنية)

### الإصدارات والوسوم

- ينشئ كل نشر `SkillVersion` جديدًا وفق **semver**.
- تشير الوسوم (مثل `latest`) إلى إصدار؛ كما أن تحريك الوسوم يتيح لك التراجع.
- تُرفق سجلات التغيير بكل إصدار ويمكن أن تكون فارغة عند المزامنة أو نشر التحديثات.

### التغييرات المحلية مقابل إصدارات السجل

تقارن التحديثات محتويات Skill المحلية بإصدارات السجل باستخدام تجزئة للمحتوى. وإذا لم تطابق الملفات المحلية أي إصدار منشور، فإن CLI يطلب قبل الكتابة فوقه (أو يتطلب `--force` في التشغيلات غير التفاعلية).

### فحص المزامنة والجذور الاحتياطية

يفحص `clawhub sync` workdir الحالي أولًا. وإذا لم يعثر على أي Skills، فإنه يعود إلى المواقع القديمة المعروفة (على سبيل المثال `~/openclaw/skills` و`~/.openclaw/skills`). وقد صُمم هذا للعثور على تثبيتات Skills الأقدم من دون أعلام إضافية.

### التخزين وملف القفل

- تُسجَّل Skills المثبتة في `.clawhub/lock.json` تحت workdir لديك.
- تُخزَّن رموز المصادقة في ملف إعداد CLI الخاص بـ ClawHub ‏(مع إمكانية التجاوز عبر `CLAWHUB_CONFIG_PATH`).

### القياس عن بُعد (عدد التثبيتات)

عندما تشغّل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI لقطة دنيا لحساب أعداد التثبيتات. ويمكنك تعطيل هذا بالكامل:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## متغيرات البيئة

- `CLAWHUB_SITE`: تجاوز عنوان URL الخاص بالموقع.
- `CLAWHUB_REGISTRY`: تجاوز عنوان URL الخاص بـ Registry API.
- `CLAWHUB_CONFIG_PATH`: تجاوز مكان تخزين الرمز/الإعدادات من قِبل CLI.
- `CLAWHUB_WORKDIR`: تجاوز workdir الافتراضي.
- `CLAWHUB_DISABLE_TELEMETRY=1`: تعطيل القياس عن بُعد في `sync`.

## ذو صلة

- [Plugin](/ar/tools/plugin)
- [Skills](/ar/tools/skills)
- [Plugins المجتمع](/ar/plugins/community)
