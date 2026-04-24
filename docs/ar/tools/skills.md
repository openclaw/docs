---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير قواعد ضبط Skills أو تحميلها
summary: 'Skills: المُدارة مقابل مساحة العمل، وقواعد الضبط، وربط config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-24T08:10:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

يستخدم OpenClaw مجلدات Skills المتوافقة مع **[AgentSkills](https://agentskills.io)** لتعليم الوكيل كيفية استخدام الأدوات. وكل Skill هي دليل يحتوي على `SKILL.md` مع YAML frontmatter وتعليمات. ويحمّل OpenClaw **Skills المضمنة** بالإضافة إلى التجاوزات المحلية الاختيارية، ويقوم بتصفيتها وقت التحميل استنادًا إلى البيئة، والإعدادات، ووجود الملفات التنفيذية.

## المواقع والأولوية

يحمّل OpenClaw Skills من هذه المصادر:

1. **مجلدات Skills الإضافية**: يتم إعدادها عبر `skills.load.extraDirs`
2. **Skills المضمنة**: تأتي مع التثبيت (حزمة npm أو OpenClaw.app)
3. **Skills المُدارة/المحلية**: ‏`~/.openclaw/skills`
4. **Skills الوكيل الشخصية**: ‏`~/.agents/skills`
5. **Skills وكيل المشروع**: ‏`<workspace>/.agents/skills`
6. **Skills مساحة العمل**: ‏`<workspace>/skills`

إذا حدث تعارض في اسم Skill، فالأولوية تكون:

`<workspace>/skills` ‏(الأعلى) ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← Skills المضمنة ← `skills.load.extraDirs` ‏(الأدنى)

## Skills لكل وكيل مقابل Skills المشتركة

في إعدادات **الوكلاء المتعددين**، يمتلك كل وكيل مساحة عمله الخاصة. وهذا يعني:

- تعيش **Skills الخاصة بكل وكيل** في `<workspace>/skills` لذلك الوكيل فقط.
- تعيش **Skills وكيل المشروع** في `<workspace>/.agents/skills` وتنطبق على
  مساحة العمل تلك قبل مجلد `skills/` المعتاد في مساحة العمل.
- تعيش **Skills الوكيل الشخصية** في `~/.agents/skills` وتنطبق عبر
  مساحات العمل على ذلك الجهاز.
- تعيش **Skills المشتركة** في `~/.openclaw/skills` ‏(المُدارة/المحلية) وتكون مرئية
  **لجميع الوكلاء** على الجهاز نفسه.
- يمكن أيضًا إضافة **مجلدات مشتركة** عبر `skills.load.extraDirs` ‏(أدنى
  أولوية) إذا كنت تريد حزمة Skills مشتركة يستخدمها عدة وكلاء.

إذا وُجد اسم Skill نفسه في أكثر من مكان، فتنطبق أولوية التحميل المعتادة:
تفوز مساحة العمل، ثم Skills وكيل المشروع، ثم Skills الوكيل الشخصية،
ثم المُدارة/المحلية، ثم المضمنة، ثم الأدلة الإضافية.

## قوائم السماح الخاصة بـ Skills لكل وكيل

إن **موقع** Skill و**مرئية** Skill عنصران منفصلان للتحكم.

- يحدد الموقع/الأولوية أي نسخة من Skill تحمل الاسم نفسه هي التي تفوز.
- تحدد قوائم السماح الخاصة بالوكيل أي Skills مرئية يمكن للوكيل استخدامها فعليًا.

استخدم `agents.defaults.skills` كخط أساس مشترك، ثم تجاوز لكل وكيل عبر
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // يرث github, weather
      { id: "docs", skills: ["docs-search"] }, // يستبدل القيم الافتراضية
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

القواعد:

- احذف `agents.defaults.skills` إذا كنت تريد Skills غير مقيدة افتراضيًا.
- احذف `agents.list[].skills` للوراثة من `agents.defaults.skills`.
- اضبط `agents.list[].skills: []` لعدم وجود Skills.
- تمثل قائمة `agents.list[].skills` غير الفارغة المجموعة النهائية لذلك الوكيل؛
  فهي لا تُدمج مع القيم الافتراضية.

يطبق OpenClaw مجموعة Skills الفعالة للوكيل عبر بناء المطالبة،
واكتشاف أوامر slash الخاصة بـ Skill، ومزامنة sandbox، ولقطات Skills.

## Plugins + Skills

يمكن لـ Plugins شحن Skills الخاصة بها عبر إدراج أدلة `skills` في
`openclaw.plugin.json` ‏(مسارات نسبةً إلى جذر Plugin). وتُحمّل Skills الخاصة بـ Plugin
عندما تكون Plugin مفعلة. وحاليًا تُدمج هذه الأدلة في المسار نفسه
منخفض الأولوية الخاص بـ `skills.load.extraDirs`، بحيث تتجاوزها أي Skill مضمنة أو
مُدارة أو تابعة لوكيل أو لمساحة عمل تحمل الاسم نفسه.
ويمكنك ضبطها عبر `metadata.openclaw.requires.config` في إدخال إعداد
Plugin. راجع [Plugins](/ar/tools/plugin) للاكتشاف/الإعداد و[Tools](/ar/tools) لمعرفة
سطح الأدوات الذي تعلّمه تلك Skills.

## Skill Workshop

يمكن لـ Plugin الاختيارية والتجريبية Skill Workshop إنشاء Skills مساحة العمل
أو تحديثها من إجراءات قابلة لإعادة الاستخدام تتم ملاحظتها أثناء عمل الوكيل. وهي معطلة افتراضيًا ويجب تفعيلها صراحةً عبر
`plugins.entries.skill-workshop`.

لا تكتب Skill Workshop إلا إلى `<workspace>/skills`، وتفحص المحتوى المُنشأ،
وتدعم الموافقة المعلّقة أو الكتابات الآمنة التلقائية، وتعزل
الاقتراحات غير الآمنة، وتُحدّث لقطة Skill بعد عمليات الكتابة الناجحة حتى
تصبح Skills الجديدة متاحة من دون إعادة تشغيل Gateway.

استخدمها عندما تريد أن تتحول التصحيحات مثل "في المرة القادمة، تحقق من إسناد GIF"
أو مسارات العمل المكتسبة بشق الأنفس مثل قوائم فحص QA الخاصة بالوسائط إلى تعليمات إجرائية دائمة. ابدأ بالموافقة المعلّقة؛ واستخدم الكتابات التلقائية فقط في مساحات العمل الموثوقة بعد مراجعة اقتراحاتها. الدليل الكامل:
[Plugin Skill Workshop](/ar/plugins/skill-workshop).

## ClawHub ‏(التثبيت + المزامنة)

ClawHub هو السجل العام لـ Skills الخاصة بـ OpenClaw. تصفحه على
[https://clawhub.ai](https://clawhub.ai). استخدم أوامر `openclaw skills`
الأصلية لاكتشاف Skills وتثبيتها وتحديثها، أو استخدم CLI المنفصل `clawhub` عندما
تحتاج إلى تدفقات النشر/المزامنة.
الدليل الكامل: [ClawHub](/ar/tools/clawhub).

التدفقات الشائعة:

- تثبيت Skill داخل مساحة عملك:
  - `openclaw skills install <skill-slug>`
- تحديث جميع Skills المثبتة:
  - `openclaw skills update --all`
- المزامنة (فحص + نشر التحديثات):
  - `clawhub sync --all`

يقوم `openclaw skills install` الأصلي بالتثبيت داخل دليل `skills/`
النشط في مساحة العمل. كما يقوم CLI المنفصل `clawhub` أيضًا بالتثبيت داخل `./skills` تحت
دليل العمل الحالي لديك (أو يعود إلى مساحة عمل OpenClaw المضبوطة).
ويلتقط OpenClaw ذلك على أنه `<workspace>/skills` في الجلسة التالية.

## ملاحظات الأمان

- تعامل مع Skills التابعة لجهات خارجية على أنها **تعليمات برمجية غير موثوقة**. اقرأها قبل التفعيل.
- فضّل التشغيلات المعزولة Sandbox مع المدخلات غير الموثوقة والأدوات الخطرة. راجع [Sandboxing](/ar/gateway/sandboxing).
- لا يقبل اكتشاف Skills في مساحة العمل والأدلة الإضافية إلا جذور Skills وملفات `SKILL.md` التي يبقى realpath المحلول لها داخل الجذر المضبوط.
- تقوم تثبيتات تبعيات Skills المدعومة من Gateway ‏(`skills.install`، وonboarding، وواجهة إعدادات Skills) بتشغيل ماسح التعليمات البرمجية الخطرة المضمن قبل تنفيذ بيانات التثبيت الوصفية. وتحجب النتائج `critical` افتراضيًا ما لم يضبط المستدعي صراحةً تجاوز الخطورة؛ أما النتائج المشبوهة فما تزال تحذر فقط.
- يختلف `openclaw skills install <slug>` عن ذلك: فهو ينزّل مجلد Skill من ClawHub إلى مساحة العمل ولا يستخدم مسار بيانات التثبيت الوصفية أعلاه.
- يقوم `skills.entries.*.env` و`skills.entries.*.apiKey` بحقن الأسرار في عملية **المضيف** لذلك الدور من الوكيل
  (وليس في sandbox). أبقِ الأسرار خارج المطالبات والسجلات.
- للحصول على نموذج تهديد أوسع وقوائم تحقق، راجع [الأمان](/ar/gateway/security).

## التنسيق (متوافق مع AgentSkills وPi)

يجب أن يتضمن `SKILL.md` على الأقل:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

ملاحظات:

- نتبع مواصفة AgentSkills من حيث التخطيط والهدف.
- يدعم المحلل المستخدم بواسطة الوكيل المضمن مفاتيح frontmatter **أحادية السطر** فقط.
- يجب أن تكون `metadata` **كائن JSON أحادي السطر**.
- استخدم `{baseDir}` في التعليمات للإشارة إلى مسار مجلد Skill.
- مفاتيح frontmatter الاختيارية:
  - `homepage` — عنوان URL يظهر على أنه “Website” في واجهة Skills على macOS (ومدعوم أيضًا عبر `metadata.openclaw.homepage`).
  - `user-invocable` — ‏`true|false` ‏(الافتراضي: `true`). عندما تكون `true`، تُكشف Skill كأمر slash للمستخدم.
  - `disable-model-invocation` — ‏`true|false` ‏(الافتراضي: `false`). عندما تكون `true`، تُستبعد Skill من مطالبة النموذج (لكنها تبقى متاحة عبر استدعاء المستخدم).
  - `command-dispatch` — ‏`tool` ‏(اختياري). عند ضبطه على `tool`، يتجاوز أمر slash النموذج ويرسل مباشرةً إلى أداة.
  - `command-tool` — اسم الأداة التي سيتم استدعاؤها عند ضبط `command-dispatch: tool`.
  - `command-arg-mode` — ‏`raw` ‏(الافتراضي). في إرسال الأداة، يمرر سلسلة args الخام إلى الأداة (من دون تحليل أساسي).

    يتم استدعاء الأداة بالمعلمات:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## الضبط (مرشحات وقت التحميل)

يقوم OpenClaw **بتصفية Skills وقت التحميل** باستخدام `metadata` ‏(JSON أحادي السطر):

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

الحقول تحت `metadata.openclaw`:

- `always: true` — تضمين Skill دائمًا (تخطي بقية الضوابط).
- `emoji` — emoji اختيارية تستخدمها واجهة Skills على macOS.
- `homepage` — عنوان URL اختياري يظهر كـ “Website” في واجهة Skills على macOS.
- `os` — قائمة اختيارية للمنصات (`darwin`, `linux`, `win32`). عند ضبطها، لا تكون Skill مؤهلة إلا على أنظمة التشغيل تلك.
- `requires.bins` — قائمة؛ يجب أن يوجد كل عنصر منها على `PATH`.
- `requires.anyBins` — قائمة؛ يجب أن يوجد عنصر واحد منها على الأقل على `PATH`.
- `requires.env` — قائمة؛ يجب أن يوجد متغير البيئة **أو** يتم توفيره في الإعدادات.
- `requires.config` — قائمة بمسارات `openclaw.json` التي يجب أن تكون truthy.
- `primaryEnv` — اسم متغير البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
- `install` — مصفوفة اختيارية من مواصفات المُثبّت التي تستخدمها واجهة Skills على macOS ‏(brew/node/go/uv/download).

ملاحظة حول sandboxing:

- يتم التحقق من `requires.bins` على **المضيف** وقت تحميل Skill.
- إذا كان الوكيل داخل sandbox، فيجب أن يوجد الملف التنفيذي أيضًا **داخل الحاوية**.
  ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` ‏(أو صورة مخصصة).
  ويتم تشغيل `setupCommand` مرة واحدة بعد إنشاء الحاوية.
  كما تتطلب تثبيتات الحزم أيضًا خروجًا شبكيًا، ونظام ملفات جذريًا قابلًا للكتابة، ومستخدم root داخل sandbox.
  مثال: تحتاج Skill ‏`summarize` ‏(`skills/summarize/SKILL.md`) إلى CLI
  `summarize` داخل حاوية sandbox لكي تعمل هناك.

مثال على المُثبّت:

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

- إذا أُدرجت عدة مُثبّتات، تختار gateway خيارًا مفضلًا **واحدًا** (brew عند توفره، وإلا node).
- إذا كانت جميع المُثبّتات من نوع `download`، يسرد OpenClaw كل إدخال حتى تتمكن من رؤية العناصر المتاحة.
- يمكن أن تتضمن مواصفات المُثبّت `os: ["darwin"|"linux"|"win32"]` لتصفية الخيارات حسب المنصة.
- تلتزم تثبيتات Node بـ `skills.install.nodeManager` في `openclaw.json` ‏(الافتراضي: npm؛ الخيارات: npm/pnpm/yarn/bun).
  وهذا يؤثر فقط في **تثبيتات Skills**؛ أما بيئة تشغيل Gateway فيجب أن تبقى Node
  (ولا يُوصى بـ Bun مع WhatsApp/Telegram).
- يعتمد اختيار المُثبّت المدعوم من Gateway على التفضيل، وليس على node فقط:
  فعندما تمزج مواصفات التثبيت بين الأنواع، يفضّل OpenClaw Homebrew عندما
  يكون `skills.install.preferBrew` مفعّلًا ويكون `brew` موجودًا، ثم `uv`, ثم
  مدير node المضبوط، ثم البدائل الأخرى مثل `go` أو `download`.
- إذا كانت كل مواصفات التثبيت من نوع `download`، يعرض OpenClaw جميع خيارات التنزيل
  بدلًا من طيّها إلى مُثبّت مفضل واحد.
- تثبيتات Go: إذا كان `go` مفقودًا وكان `brew` متوفرًا، تقوم gateway أولًا بتثبيت Go عبر Homebrew وتضبط `GOBIN` على `bin` الخاص بـ Homebrew عند الإمكان.
- تثبيتات التنزيل: `url` ‏(مطلوب)، و`archive` ‏(`tar.gz` | `tar.bz2` | `zip`)، و`extract` ‏(الافتراضي: تلقائي عند اكتشاف archive)، و`stripComponents`، و`targetDir` ‏(الافتراضي: `~/.openclaw/tools/<skillKey>`).

إذا لم تكن `metadata.openclaw` موجودة، فإن Skill تكون مؤهلة دائمًا (ما لم
تكن معطلة في الإعدادات أو محجوبة بواسطة `skills.allowBundled` بالنسبة إلى Skills المضمنة).

## تجاوزات الإعدادات (`~/.openclaw/openclaw.json`)

يمكن تبديل Skills المضمنة/المُدارة وتزويدها بقيم env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو سلسلة plaintext
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

ملاحظة: إذا كان اسم Skill يحتوي على شرطات، فضع المفتاح بين علامتي اقتباس (يدعم JSON5 المفاتيح المقتبسة).

إذا كنت تريد توليد/تحرير الصور القياسي داخل OpenClaw نفسه، فاستخدم أداة
`image_generate` الأساسية مع `agents.defaults.imageGenerationModel` بدلًا من
Skill مضمنة. أمثلة Skills هنا مخصصة لمسارات العمل المخصصة أو التابعة لجهات خارجية.

لتحليل الصور الأصلي، استخدم أداة `image` مع `agents.defaults.imageModel`.
وللتوليد/التحرير الأصلي للصور، استخدم `image_generate` مع
`agents.defaults.imageGenerationModel`. وإذا اخترت `openai/*` أو `google/*`,
أو `fal/*` أو نموذج صور خاصًا بمزوّد آخر، فأضف أيضًا مصادقة/API key
لذلك المزوّد.

تطابق مفاتيح الإعدادات **اسم Skill** افتراضيًا. وإذا كانت Skill تعرّف
`metadata.openclaw.skillKey`, فاستخدم ذلك المفتاح تحت `skills.entries`.

القواعد:

- يؤدي `enabled: false` إلى تعطيل Skill حتى لو كانت مضمنة/مثبتة.
- يتم حقن `env` **فقط إذا** لم يكن المتغير مضبوطًا بالفعل في العملية.
- `apiKey`: وسيلة مريحة لـ Skills التي تعلن `metadata.openclaw.primaryEnv`.
  وهو يدعم سلسلة plaintext أو كائن SecretRef ‏(`{ source, provider, id }`).
- `config`: حاوية اختيارية لحقول مخصصة لكل Skill؛ يجب أن تعيش المفاتيح المخصصة هنا.
- `allowBundled`: قائمة سماح اختيارية لـ Skills **المضمنة** فقط. إذا تم ضبطها، فلن تكون
  مؤهلة إلا Skills المضمنة الموجودة في القائمة (ولا تتأثر Skills المُدارة/مساحة العمل).

## حقن البيئة (لكل تشغيل وكيل)

عندما يبدأ تشغيل وكيل، يقوم OpenClaw بما يلي:

1. يقرأ بيانات Skill الوصفية.
2. يطبق أي `skills.entries.<key>.env` أو `skills.entries.<key>.apiKey` على
   `process.env`.
3. يبني system prompt باستخدام Skills **المؤهلة**.
4. يعيد البيئة الأصلية بعد انتهاء التشغيل.

وهذا **محدود بنطاق تشغيل الوكيل**، وليس بيئة shell عامة.

بالنسبة إلى الواجهة الخلفية المضمنة `claude-cli`, يقوم OpenClaw أيضًا بتحويل اللقطة المؤهلة نفسها إلى
Plugin مؤقتة لـ Claude Code ويمررها باستخدام
`--plugin-dir`. ويمكن لـ Claude Code عندها استخدام محلل Skills الأصلي الخاص به بينما يبقى OpenClaw هو المسؤول عن الأولوية، وقوائم السماح لكل وكيل، والضبط، وحقن env/API key الخاص بـ
`skills.entries.*`. أما الواجهات الخلفية الأخرى لـ CLI فتستخدم
كتالوج المطالبة فقط.

## لقطة الجلسة (الأداء)

يلتقط OpenClaw لقطة لـ Skills المؤهلة **عند بدء الجلسة** ويعيد استخدام تلك القائمة في الأدوار اللاحقة ضمن الجلسة نفسها. وتدخل التغييرات على Skills أو الإعدادات حيز التنفيذ في الجلسة الجديدة التالية.

يمكن أيضًا تحديث Skills أثناء الجلسة عندما يكون مراقب Skills مفعّلًا أو عندما تظهر Node بعيدة جديدة مؤهلة (انظر أدناه). فكّر في هذا باعتباره **إعادة تحميل ساخنة**: حيث يتم التقاط القائمة المحدَّثة في دور الوكيل التالي.

إذا تغيرت قائمة السماح الفعالة لـ Skills الخاصة بالوكيل في تلك الجلسة، فإن OpenClaw
يُحدّث اللقطة بحيث تبقى Skills المرئية متوافقة مع الوكيل الحالي.

## Nodes macOS البعيدة (Gateway على Linux)

إذا كانت Gateway تعمل على Linux لكن **Node macOS** متصلة **مع السماح بـ `system.run`** (ولم يتم ضبط أمان موافقات Exec على `deny`)، يمكن لـ OpenClaw معاملة Skills الخاصة بـ macOS فقط على أنها مؤهلة عندما تكون الملفات التنفيذية المطلوبة موجودة على تلك Node. ويجب على الوكيل تنفيذ تلك Skills عبر أداة `exec` باستخدام `host=node`.

ويعتمد هذا على أن تبلغ Node عن دعمها للأوامر وعلى فحص ملفات تنفيذية عبر `system.run`. وإذا انقطعت Node macOS لاحقًا، فستبقى Skills مرئية؛ لكن قد تفشل عمليات الاستدعاء إلى أن تعاود Node الاتصال.

## مراقب Skills ‏(التحديث التلقائي)

افتراضيًا، يراقب OpenClaw مجلدات Skills ويزيد لقطة Skills عندما تتغير ملفات `SKILL.md`. اضبط هذا تحت `skills.load`:

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

## أثر الرموز (قائمة Skills)

عندما تكون Skills مؤهلة، يحقن OpenClaw قائمة XML مضغوطة بالـ Skills المتاحة في system prompt ‏(عبر `formatSkillsForPrompt` في `pi-coding-agent`). وتكون التكلفة حتمية:

- **عبء أساسي (فقط عند وجود ≥1 Skill):** ‏195 حرفًا.
- **لكل Skill:** ‏97 حرفًا + طول القيم بعد XML-escaped لكل من `<name>` و`<description>` و`<location>`.

الصيغة (بالأحرف):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

ملاحظات:

- يؤدي XML escaping إلى توسيع `& < > " '` إلى كيانات (`&amp;`, و`&lt;`، إلخ)، مما يزيد الطول.
- تختلف أعداد الرموز حسب tokenizer الخاص بالنموذج. والتقدير التقريبي على نمط OpenAI هو ~4 أحرف/رمز، لذا فإن **97 حرفًا ≈ 24 رمزًا** لكل Skill بالإضافة إلى أطوال حقولك الفعلية.

## دورة حياة Skills المُدارة

يشحن OpenClaw مجموعة أساسية من Skills باعتبارها **Skills مضمنة** كجزء من
التثبيت (حزمة npm أو OpenClaw.app). ويوجد `~/.openclaw/skills` من أجل التجاوزات المحلية
(على سبيل المثال، تثبيت/ترقيع Skill من دون تغيير النسخة المضمنة).
أما Skills مساحة العمل فهي مملوكة للمستخدم وتتجاوز الاثنين معًا عند تعارض الأسماء.

## مرجع الإعدادات

راجع [إعدادات Skills](/ar/tools/skills-config) للحصول على مخطط الإعدادات الكامل.

## هل تبحث عن مزيد من Skills؟

تصفح [https://clawhub.ai](https://clawhub.ai).

---

## ذو صلة

- [إنشاء Skills](/ar/tools/creating-skills) — بناء Skills مخصصة
- [إعدادات Skills](/ar/tools/skills-config) — مرجع إعدادات Skills
- [أوامر Slash](/ar/tools/slash-commands) — جميع أوامر slash المتاحة
- [Plugins](/ar/tools/plugin) — نظرة عامة على نظام Plugin
