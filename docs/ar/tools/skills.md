---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير قواعد تقييد Skills أو تحميلها
summary: 'Skills: مُدارة مقابل مساحة العمل، وقواعد التقييد، وربط الإعدادات/متغيرات البيئة'
title: Skills
x-i18n:
    generated_at: "2026-04-11T02:48:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1eaf130966950b6eb24f859d9a77ecbf81c6cb80deaaa6a3a79d2c16d83115d
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

يستخدم OpenClaw مجلدات Skills متوافقة مع **[AgentSkills](https://agentskills.io)** لتعليم الوكيل كيفية استخدام الأدوات. وكل Skill هو دليل يحتوي على `SKILL.md` مع YAML frontmatter وتعليمات. ويحمّل OpenClaw **Skills المضمّنة** بالإضافة إلى تجاوزات محلية اختيارية، ويقوم بتصفيتها وقت التحميل استنادًا إلى البيئة، والإعدادات، ووجود الملف التنفيذي.

## المواقع والأولوية

يحمّل OpenClaw Skills من هذه المصادر:

1. **مجلدات Skills إضافية**: مكوّنة عبر `skills.load.extraDirs`
2. **Skills المضمّنة**: تُشحَن مع التثبيت (حزمة npm أو OpenClaw.app)
3. **Skills مُدارة/محلية**: `~/.openclaw/skills`
4. **Skills الوكيل الشخصية**: `~/.agents/skills`
5. **Skills وكيل المشروع**: `<workspace>/.agents/skills`
6. **Skills مساحة العمل**: `<workspace>/skills`

إذا حدث تعارض في اسم Skill، تكون الأولوية كما يلي:

`<workspace>/skills` (الأعلى) ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← Skills المضمّنة ← `skills.load.extraDirs` (الأدنى)

## Skills لكل وكيل مقابل Skills المشتركة

في إعدادات **الوكلاء المتعددين**، يملك كل وكيل مساحة عمل خاصة به. وهذا يعني:

- توجد **Skills الخاصة بكل وكيل** في `<workspace>/skills` لذلك الوكيل فقط.
- توجد **Skills وكيل المشروع** في `<workspace>/.agents/skills` وتُطبَّق على
  مساحة العمل تلك قبل مجلد `skills/` العادي لمساحة العمل.
- توجد **Skills الوكيل الشخصية** في `~/.agents/skills` وتُطبَّق عبر
  مساحات العمل على ذلك الجهاز.
- توجد **Skills المشتركة** في `~/.openclaw/skills` (مُدارة/محلية) وتكون مرئية
  **لجميع الوكلاء** على الجهاز نفسه.
- يمكن أيضًا إضافة **مجلدات مشتركة** عبر `skills.load.extraDirs` (بأدنى
  أولوية) إذا كنت تريد حزمة Skills مشتركة يستخدمها عدة وكلاء.

إذا وُجد اسم Skill نفسه في أكثر من مكان، فتُطبَّق الأولوية المعتادة:
تفوز مساحة العمل، ثم Skills وكيل المشروع، ثم Skills الوكيل الشخصية،
ثم المُدارة/المحلية، ثم المضمّنة، ثم الأدلة الإضافية.

## قوائم السماح الخاصة بـ Skills لكل وكيل

**موقع** Skill و**إمكانية رؤية** Skill عنصران تحكمان منفصلان.

- يحدد الموقع/الأولوية أي نسخة من Skill يحمل الاسم نفسه هي التي تفوز.
- وتحدد قوائم السماح الخاصة بالوكيل أي Skills مرئية يمكن للوكيل استخدامها فعلًا.

استخدم `agents.defaults.skills` كأساس مشترك، ثم تجاوز ذلك لكل وكيل عبر
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

القواعد:

- احذف `agents.defaults.skills` إذا أردت Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` للوراثة من `agents.defaults.skills`.
- عيّن `agents.list[].skills: []` لعدم وجود أي Skills.
- القائمة غير الفارغة في `agents.list[].skills` هي المجموعة النهائية لذلك الوكيل؛
  فهي لا تندمج مع القيم الافتراضية.

يطبّق OpenClaw مجموعة Skills الفعالة الخاصة بالوكيل عبر بناء الموجّه،
واكتشاف أوامر slash الخاصة بـ Skills، ومزامنة sandbox، ولقطات Skills.

## Plugins + Skills

يمكن لـ Plugins شحن Skills خاصة بها عن طريق إدراج أدلة `skills` في
`openclaw.plugin.json` (مسارات نسبية إلى جذر plugin). وتُحمَّل Skills الخاصة بـ Plugin
عندما يكون plugin مفعّلًا. واليوم تُدمج هذه الأدلة في المسار نفسه ذي
الأولوية المنخفضة مثل `skills.load.extraDirs`، لذلك فإن Skill مضمّنة أو مُدارة
أو خاصة بالوكيل أو بمساحة العمل تحمل الاسم نفسه ستتجاوزها.
يمكنك تقييدها عبر `metadata.openclaw.requires.config` على إدخال إعدادات plugin.
راجع [Plugins](/ar/tools/plugin) للاكتشاف/الإعدادات و[Tools](/ar/tools) لسطح
الأدوات الذي تشرحه تلك Skills.

## ClawHub (التثبيت + المزامنة)

ClawHub هو سجل Skills العام لـ OpenClaw. تصفحه على
[https://clawhub.ai](https://clawhub.ai). استخدم أوامر `openclaw skills`
الأصلية لاكتشاف Skills أو تثبيتها أو تحديثها، أو استخدم CLI المنفصل `clawhub`
عندما تحتاج إلى تدفقات النشر/المزامنة.
الدليل الكامل: [ClawHub](/ar/tools/clawhub).

التدفقات الشائعة:

- تثبيت Skill في مساحة عملك:
  - `openclaw skills install <skill-slug>`
- تحديث جميع Skills المثبتة:
  - `openclaw skills update --all`
- المزامنة (الفحص + نشر التحديثات):
  - `clawhub sync --all`

يثبّت `openclaw skills install` الأصلي ضمن دليل `skills/`
في مساحة العمل النشطة. كما يثبّت CLI المنفصل `clawhub` أيضًا ضمن `./skills` في
دليل العمل الحالي (أو يعود إلى مساحة عمل OpenClaw المكوّنة).
ويلتقط OpenClaw ذلك باعتباره `<workspace>/skills` في الجلسة التالية.

## ملاحظات الأمان

- تعامل مع Skills التابعة لجهات خارجية على أنها **شيفرة غير موثوقة**. اقرأها قبل التمكين.
- فضّل التشغيل ضمن sandbox للمدخلات غير الموثوقة والأدوات الخطرة. راجع [Sandboxing](/ar/gateway/sandboxing).
- لا يقبل اكتشاف Skills في مساحة العمل والأدلة الإضافية إلا جذور Skills وملفات `SKILL.md` التي يبقى realpath المحلول لها داخل الجذر المكوّن.
- تقوم عمليات تثبيت تبعيات Skills المعتمدة على Gateway (`skills.install`، والإعداد الأولي، وواجهة إعدادات Skills) بتشغيل ماسح الشيفرة الخطرة المدمج قبل تنفيذ بيانات تعريف المُثبِّت. وتحجب نتائج `critical` افتراضيًا ما لم يعيّن المستدعي صراحةً تجاوز الخطر؛ أما النتائج المريبة فلا تزال تحذيرات فقط.
- يختلف `openclaw skills install <slug>` عن ذلك: فهو ينزّل مجلد Skill من ClawHub إلى مساحة العمل ولا يستخدم مسار بيانات تعريف المُثبِّت المذكور أعلاه.
- يقوم `skills.entries.*.env` و`skills.entries.*.apiKey` بحقن الأسرار في عملية **المضيف**
  لذلك الدور من الوكيل (وليس sandbox). أبقِ الأسرار خارج الموجّهات والسجلات.
- للحصول على نموذج تهديد أوسع وقوائم تحقق، راجع [Security](/ar/gateway/security).

## التنسيق (AgentSkills + متوافق مع Pi)

يجب أن يتضمن `SKILL.md` على الأقل:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

ملاحظات:

- نتبع مواصفات AgentSkills من حيث التخطيط والهدف.
- يدعم المحلل المستخدم من قبل الوكيل المضمّن مفاتيح frontmatter **أحادية السطر** فقط.
- يجب أن تكون `metadata` **كائن JSON أحادي السطر**.
- استخدم `{baseDir}` في التعليمات للإشارة إلى مسار مجلد Skill.
- مفاتيح frontmatter الاختيارية:
  - `homepage` — عنوان URL يُعرَض بوصفه “Website” في واجهة Skills على macOS (وهو مدعوم أيضًا عبر `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (الافتراضي: `true`). عندما تكون `true`، تُعرَض Skill كأمر slash للمستخدم.
  - `disable-model-invocation` — `true|false` (الافتراضي: `false`). عندما تكون `true`، تُستبعَد Skill من موجّه النموذج (مع بقائها متاحة عبر استدعاء المستخدم).
  - `command-dispatch` — `tool` (اختياري). عند تعيينها إلى `tool`، يتجاوز أمر slash النموذج ويُرسَل مباشرة إلى أداة.
  - `command-tool` — اسم الأداة المطلوب استدعاؤها عند تعيين `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (الافتراضي). بالنسبة إلى الإرسال عبر الأداة، يُمرَّر نص الوسائط الخام إلى الأداة (من دون تحليل من core).

    تُستدعَى الأداة بالمعلمات:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## التقييد (مرشحات وقت التحميل)

يقوم OpenClaw **بتصفية Skills وقت التحميل** باستخدام `metadata` (JSON أحادي السطر):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

الحقول ضمن `metadata.openclaw`:

- `always: true` — تضمين Skill دائمًا (وتخطي بقية القيود).
- `emoji` — emoji اختياري تستخدمه واجهة Skills على macOS.
- `homepage` — عنوان URL اختياري يظهر بوصفه “Website” في واجهة Skills على macOS.
- `os` — قائمة اختيارية بالمنصات (`darwin` و`linux` و`win32`). إذا تم تعيينها، فلن تكون Skill مؤهلة إلا على هذه الأنظمة.
- `requires.bins` — قائمة؛ يجب أن يوجد كل عنصر منها على `PATH`.
- `requires.anyBins` — قائمة؛ يجب أن يوجد عنصر واحد منها على الأقل على `PATH`.
- `requires.env` — قائمة؛ يجب أن يوجد متغير البيئة **أو** يتم توفيره في الإعدادات.
- `requires.config` — قائمة بمسارات `openclaw.json` التي يجب أن تكون truthy.
- `primaryEnv` — اسم متغير البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
- `install` — مصفوفة اختيارية من مواصفات المُثبِّت تستخدمها واجهة Skills على macOS (brew/node/go/uv/download).

ملاحظة حول sandboxing:

- يتم التحقق من `requires.bins` على **المضيف** وقت تحميل Skill.
- إذا كان الوكيل يعمل داخل sandbox، فيجب أن يوجد الملف التنفيذي أيضًا **داخل الحاوية**.
  ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` (أو صورة مخصصة).
  يتم تشغيل `setupCommand` مرة واحدة بعد إنشاء الحاوية.
  كما تتطلب عمليات تثبيت الحزم اتصال شبكة خارجيًا، ونظام ملفات جذر قابلًا للكتابة، ومستخدم root داخل sandbox.
  مثال: تحتاج Skill `summarize` (`skills/summarize/SKILL.md`) إلى CLI
  `summarize` داخل حاوية sandbox لكي تعمل هناك.

مثال على المُثبِّت:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

ملاحظات:

- إذا تم إدراج عدة مُثبِّتات، يختار gateway **خيارًا مفضلًا واحدًا** (brew عند توفره، وإلا node).
- إذا كانت جميع المُثبِّتات من النوع `download`، فإن OpenClaw يدرج كل إدخال حتى تتمكن من رؤية العناصر المتاحة.
- يمكن أن تتضمن مواصفات المُثبِّت `os: ["darwin"|"linux"|"win32"]` لتصفية الخيارات حسب المنصة.
- تحترم عمليات تثبيت Node القيمة `skills.install.nodeManager` في `openclaw.json` (الافتراضي: npm؛ والخيارات: npm/pnpm/yarn/bun).
  يؤثر هذا فقط في **عمليات تثبيت Skills**؛ أما وقت تشغيل Gateway فيجب أن يظل Node
  (ولا يُوصى باستخدام Bun مع WhatsApp/Telegram).
- يعتمد اختيار المُثبِّت المدعوم من Gateway على التفضيل، وليس على node فقط:
  فعندما تجمع مواصفات التثبيت بين أنواع متعددة، يفضّل OpenClaw Homebrew عندما
  يكون `skills.install.preferBrew` مفعّلًا ويكون `brew` موجودًا، ثم `uv`، ثم
  مدير node المكوَّن، ثم الحلول الاحتياطية الأخرى مثل `go` أو `download`.
- إذا كانت كل مواصفات التثبيت من النوع `download`، فإن OpenClaw يعرض جميع خيارات التنزيل
  بدلًا من دمجها في مُثبِّت مفضّل واحد.
- عمليات تثبيت Go: إذا كان `go` غير موجود وكان `brew` متاحًا، يقوم gateway أولًا بتثبيت Go عبر Homebrew ويضبط `GOBIN` على `bin` الخاصة بـ Homebrew متى أمكن.
- عمليات التثبيت بالتنزيل: `url` (مطلوب)، و`archive` (`tar.gz` | `tar.bz2` | `zip`)، و`extract` (الافتراضي: تلقائي عند اكتشاف archive)، و`stripComponents`، و`targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).

إذا لم توجد `metadata.openclaw`، فإن Skill تكون مؤهلة دائمًا (إلا
إذا كانت معطلة في الإعدادات أو محجوبة بواسطة `skills.allowBundled` بالنسبة إلى Skills المضمّنة).

## تجاوزات الإعدادات (`~/.openclaw/openclaw.json`)

يمكن تشغيل/إيقاف Skills المضمّنة/المُدارة وتزويدها بقيم env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

ملاحظة: إذا كان اسم Skill يحتوي على واصلات، فضع المفتاح بين علامتي اقتباس (يسمح JSON5 بالمفاتيح المقتبسة).

إذا كنت تريد إنشاء/تحرير صور جاهزًا داخل OpenClaw نفسه، فاستخدم الأداة الأساسية
`image_generate` مع `agents.defaults.imageGenerationModel` بدلًا من
Skill مضمّنة. والأمثلة هنا على Skills مخصصة أو خاصة بجهات خارجية.

أما لتحليل الصور الأصلي، فاستخدم أداة `image` مع `agents.defaults.imageModel`.
ولإنشاء/تحرير الصور الأصلي، استخدم `image_generate` مع
`agents.defaults.imageGenerationModel`. وإذا اخترت نموذج صور خاصًا بمزوّد مثل `openai/*` أو `google/*`
أو `fal/*` أو غيره، فأضف أيضًا مصادقة/مفتاح API الخاص بذلك المزوّد.

تتطابق مفاتيح الإعدادات مع **اسم Skill** افتراضيًا. وإذا حدّدت Skill
`metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح ضمن `skills.entries`.

القواعد:

- يؤدي `enabled: false` إلى تعطيل Skill حتى لو كانت مضمّنة/مثبتة.
- يتم حقن `env` **فقط إذا** لم يكن المتغير مضبوطًا بالفعل في العملية.
- `apiKey`: وسيلة تسهيل لـ Skills التي تعلن `metadata.openclaw.primaryEnv`.
  ويدعم سلسلة نصية صريحة أو كائن SecretRef (`{ source, provider, id }`).
- `config`: حاوية اختيارية لحقول مخصصة لكل Skill؛ ويجب أن توضع المفاتيح المخصصة هنا.
- `allowBundled`: قائمة سماح اختيارية لـ **Skills المضمّنة** فقط. وإذا تم تعيينها، فلن تكون مؤهلة إلا
  Skills المضمّنة الموجودة في القائمة (أما Skills المُدارة/الخاصة بمساحة العمل فلا تتأثر).

## حقن البيئة (لكل تشغيل وكيل)

عند بدء تشغيل وكيل، يقوم OpenClaw بما يلي:

1. يقرأ بيانات تعريف Skill.
2. يطبّق أي `skills.entries.<key>.env` أو `skills.entries.<key>.apiKey` على
   `process.env`.
3. يبني موجّه النظام باستخدام Skills **المؤهلة**.
4. يعيد البيئة الأصلية بعد انتهاء التشغيل.

هذا **ضمن نطاق تشغيل الوكيل**، وليس بيئة shell عامة.

وبالنسبة إلى الواجهة الخلفية المضمّنة `claude-cli`، يقوم OpenClaw أيضًا بتجسيد
اللقطة المؤهلة نفسها كـ plugin مؤقت لـ Claude Code ويمررها مع
`--plugin-dir`. ويمكن لـ Claude Code عندها استخدام محلل Skills الأصلي الخاص به بينما
يظل OpenClaw هو المالك للأولوية، وقوائم السماح لكل وكيل، والتقييد، وحقن
env/API key في `skills.entries.*`. أما الواجهات الخلفية الأخرى المعتمدة على CLI فتستخدم
فهرس الموجّهات فقط.

## لقطة الجلسة (الأداء)

يلتقط OpenClaw لقطة لـ Skills المؤهلة **عند بدء الجلسة** ويعيد استخدام هذه القائمة في الأدوار اللاحقة ضمن الجلسة نفسها. وتسري التغييرات على Skills أو الإعدادات في الجلسة الجديدة التالية.

يمكن أيضًا لـ Skills أن تتحدّث أثناء الجلسة عندما يكون مراقب Skills مفعّلًا أو عندما تظهر node بعيدة جديدة مؤهلة (انظر أدناه). فكّر في هذا على أنه **إعادة تحميل مباشرة**: تُلتقط القائمة المحدَّثة في دور الوكيل التالي.

إذا تغيّرت قائمة السماح الفعالة الخاصة بـ Skills لذلك الوكيل في تلك الجلسة، فإن OpenClaw
يحدّث اللقطة بحيث تبقى Skills المرئية متوافقة مع الوكيل الحالي.

## عقد macOS البعيدة (Linux gateway)

إذا كان Gateway يعمل على Linux لكن **node بنظام macOS** متصلة **ومسموحًا لها بـ `system.run`** (ولم يتم تعيين أمان موافقات Exec إلى `deny`)، فيمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما تكون الملفات التنفيذية المطلوبة موجودة على تلك node. ويجب على الوكيل تنفيذ تلك Skills عبر أداة `exec` مع `host=node`.

يعتمد هذا على أن تبلّغ node عن دعمها للأوامر وعلى فحص الملف التنفيذي عبر `system.run`. وإذا أصبحت node الخاصة بـ macOS غير متصلة لاحقًا، فستظل Skills مرئية؛ وقد تفشل الاستدعاءات حتى تعود node إلى الاتصال.

## مراقب Skills (تحديث تلقائي)

بشكل افتراضي، يراقب OpenClaw مجلدات Skills ويزيد لقطة Skills عند تغيّر ملفات `SKILL.md`. ويمكنك تكوين ذلك ضمن `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## تأثير الرموز (قائمة Skills)

عندما تكون Skills مؤهلة، يحقن OpenClaw قائمة XML مضغوطة بالـ Skills المتاحة في موجّه النظام (عبر `formatSkillsForPrompt` في `pi-coding-agent`). وتكون التكلفة حتمية:

- **تكلفة أساسية (فقط عند وجود Skill واحدة أو أكثر):** 195 حرفًا.
- **لكل Skill:** 97 حرفًا + طول قيم `<name>` و`<description>` و`<location>` بعد هروب XML.

الصيغة (بالحروف):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

ملاحظات:

- يؤدي هروب XML إلى توسيع `& < > " '` إلى كيانات (`&amp;` و`&lt;` وغير ذلك)، مما يزيد الطول.
- تختلف أعداد الرموز حسب محلل الرموز الخاص بالنموذج. وتقدير تقريبي على نمط OpenAI هو ~4 أحرف/رمز، لذا فإن **97 حرفًا ≈ 24 رمزًا** لكل Skill بالإضافة إلى أطوال حقولك الفعلية.

## دورة حياة Skills المُدارة

يشحن OpenClaw مجموعة أساسية من Skills بوصفها **Skills مضمّنة** كجزء من
التثبيت (حزمة npm أو OpenClaw.app). ويوجد `~/.openclaw/skills` من أجل
التجاوزات المحلية (مثل تثبيت/تصحيح Skill من دون تغيير النسخة المضمّنة).
أما Skills مساحة العمل فهي مملوكة للمستخدم وتتجاوز كليهما عند تعارض الأسماء.

## مرجع الإعدادات

راجع [إعدادات Skills](/ar/tools/skills-config) للحصول على مخطط الإعدادات الكامل.

## هل تبحث عن المزيد من Skills؟

تصفح [https://clawhub.ai](https://clawhub.ai).

---

## ذو صلة

- [إنشاء Skills](/ar/tools/creating-skills) — بناء Skills مخصصة
- [إعدادات Skills](/ar/tools/skills-config) — مرجع إعدادات Skills
- [Slash Commands](/ar/tools/slash-commands) — جميع أوامر slash المتاحة
- [Plugins](/ar/tools/plugin) — نظرة عامة على نظام plugins
