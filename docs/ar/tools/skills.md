---
read_when:
    - إضافة أو تعديل Skills
    - تغيير ضوابط إتاحة Skills أو قوائم السماح أو قواعد التحميل
    - فهم أسبقية Skills وسلوك اللقطات
sidebarTitle: Skills
summary: 'Skills: المُدارة مقابل مساحة العمل، وقواعد التقييد، وقوائم السماح للوكلاء، وربط الإعدادات'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

يستخدم OpenClaw مجلدات Skills **متوافقة مع [AgentSkills](https://agentskills.io)** لتعليم الوكيل كيفية استخدام الأدوات. كل Skill هو دليل يحتوي على `SKILL.md` مع frontmatter بصيغة YAML وتعليمات. يحمّل OpenClaw الـ Skills المضمّنة بالإضافة إلى التجاوزات المحلية الاختيارية، ويرشحها وقت التحميل بناءً على البيئة، والإعداد، ووجود الملفات التنفيذية.

## المواقع والأسبقية

يحمّل OpenClaw الـ Skills من هذه المصادر، **بالترتيب من أعلى أسبقية إلى أدناها**:

| #   | المصدر                | المسار                             |
| --- | --------------------- | -------------------------------- |
| 1   | Skills مساحة العمل      | `<workspace>/skills`             |
| 2   | Skills وكيل المشروع  | `<workspace>/.agents/skills`     |
| 3   | Skills الوكيل الشخصية | `~/.agents/skills`               |
| 4   | Skills مُدارة/محلية  | `~/.openclaw/skills`             |
| 5   | Skills مضمّنة        | مرفقة مع التثبيت         |
| 6   | مجلدات Skills إضافية   | `skills.load.extraDirs` (الإعداد) |

إذا تعارض اسم Skill، يفوز المصدر الأعلى.

دليل `$CODEX_HOME/skills` الأصلي في Codex CLI ليس أحد جذور Skills في OpenClaw. في وضع Codex harness، تستخدم عمليات تشغيل خادم التطبيق المحلي منازل Codex معزولة لكل وكيل، لذلك لا تُحمّل Skills الشخصية في Codex CLI ضمنيًا. استخدم `openclaw migrate codex --dry-run` لجردها، و`openclaw migrate codex` لاختيار أدلة Skills عبر مطالبة مربعات اختيار تفاعلية قبل نسخها إلى مساحة عمل وكيل OpenClaw الحالية. للتشغيل غير التفاعلي، كرر `--skill <name>` لكل Skill تريد نسخها بالضبط.

## Skills لكل وكيل مقابل Skills المشتركة

في إعدادات **الوكلاء المتعددين** يكون لكل وكيل مساحة العمل الخاصة به:

| النطاق                | المسار                                        | مرئي إلى                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| لكل وكيل            | `<workspace>/skills`                        | ذلك الوكيل فقط             |
| وكيل المشروع        | `<workspace>/.agents/skills`                | وكيل مساحة العمل تلك فقط |
| الوكيل الشخصي       | `~/.agents/skills`                          | كل الوكلاء على ذلك الجهاز  |
| مُدارة/محلية مشتركة | `~/.openclaw/skills`                        | كل الوكلاء على ذلك الجهاز  |
| أدلة إضافية مشتركة    | `skills.load.extraDirs` (الأدنى أسبقية) | كل الوكلاء على ذلك الجهاز  |

الاسم نفسه في عدة أماكن ← يفوز المصدر الأعلى. مساحة العمل تتفوق على وكيل المشروع، ثم الوكيل الشخصي، ثم المُدارة/المحلية، ثم المضمّنة، ثم الأدلة الإضافية.

## قوائم السماح بـ Skills للوكيل

**موقع** Skill و**رؤية** Skill عنصران منفصلان للتحكم. يحدد الموقع/الأسبقية أي نسخة من Skill تحمل الاسم نفسه تفوز؛ وتحدد قوائم السماح للوكيل أي Skills يمكن للوكيل استخدامها فعليًا.

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

<AccordionGroup>
  <Accordion title="قواعد قائمة السماح">
    - احذف `agents.defaults.skills` لجعل Skills غير مقيدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
    - اضبط `agents.list[].skills: []` لعدم إتاحة أي Skills.
    - قائمة `agents.list[].skills` غير الفارغة هي المجموعة **النهائية** لذلك
      الوكيل — ولا تُدمج مع الافتراضيات.
    - تنطبق قائمة السماح الفعلية عبر بناء الموجه، واكتشاف أوامر
      الشرطة المائلة لـ Skill، ومزامنة sandbox، ولقطات Skill.
  </Accordion>
</AccordionGroup>

## Plugins و Skills

يمكن لـ Plugins إرفاق Skills الخاصة بها عبر إدراج أدلة `skills` في `openclaw.plugin.json` (بمسارات نسبية إلى جذر Plugin). تُحمّل Skills الخاصة بـ Plugin عندما يكون Plugin مفعّلًا. هذا هو المكان المناسب لأدلة التشغيل الخاصة بالأدوات التي تكون أطول من أن توضع في وصف الأداة لكنها يجب أن تكون متاحة كلما كان Plugin مثبتًا — مثلًا، يرفق Plugin المتصفح Skill باسم `browser-automation` للتحكم متعدد الخطوات في المتصفح.

تُدمج أدلة Skills الخاصة بـ Plugin في مسار منخفض الأسبقية نفسه مثل `skills.load.extraDirs`، لذلك تتجاوزها أي Skill مضمّنة أو مُدارة أو خاصة بوكيل أو بمساحة عمل تحمل الاسم نفسه. يمكنك تقييدها عبر `metadata.openclaw.requires.config` في مدخلة إعداد Plugin.

راجع [Plugins](/ar/tools/plugin) للاكتشاف/الإعداد و[الأدوات](/ar/tools) لسطح الأدوات الذي تعلّمه تلك Skills.

## Skill Workshop

يمكن لـ Plugin **Skill Workshop** الاختياري والتجريبي إنشاء Skills لمساحة العمل أو تحديثها من إجراءات قابلة لإعادة الاستخدام لوحظت أثناء عمل الوكيل. يكون معطلًا افتراضيًا ويجب تفعيله صراحةً عبر `plugins.entries.skill-workshop`.

يكتب Skill Workshop فقط إلى `<workspace>/skills`، ويفحص المحتوى المُنشأ، ويدعم انتظار الموافقة أو عمليات الكتابة الآمنة التلقائية، ويعزل المقترحات غير الآمنة، ويحدّث لقطة Skill بعد عمليات الكتابة الناجحة حتى تصبح Skills الجديدة متاحة دون إعادة تشغيل Gateway.

استخدمه للتصحيحات مثل _"في المرة القادمة، تحقق من إسناد GIF"_ أو لسير العمل المكتسب بصعوبة مثل قوائم تحقق ضمان جودة الوسائط. ابدأ بالموافقة المعلقة؛ واستخدم عمليات الكتابة التلقائية فقط في مساحات العمل الموثوقة بعد مراجعة مقترحاته. الدليل الكامل: [Plugin Skill Workshop](/ar/plugins/skill-workshop).

## ClawHub (التثبيت والمزامنة)

[ClawHub](https://clawhub.ai) هو سجل Skills العام لـ OpenClaw. استخدم أوامر `openclaw skills` الأصلية للاكتشاف/التثبيت/التحديث، أو CLI المنفصل `clawhub` لسير عمل النشر/المزامنة. الدليل الكامل: [ClawHub](/ar/tools/clawhub).

| الإجراء                             | الأمر                                |
| ---------------------------------- | -------------------------------------- |
| تثبيت Skill في مساحة العمل | `openclaw skills install <skill-slug>` |
| تحديث كل Skills المثبتة        | `openclaw skills update --all`         |
| المزامنة (فحص + نشر التحديثات)      | `clawhub sync --all`                   |

يثبّت `openclaw skills install` الأصلي في دليل `skills/` الخاص بمساحة العمل النشطة. كما يثبّت CLI المنفصل `clawhub` في `./skills` ضمن دليل العمل الحالي لديك (أو يعود إلى مساحة عمل OpenClaw المهيأة). يلتقط OpenClaw ذلك كـ `<workspace>/skills` في الجلسة التالية.
تدعم جذور Skills المهيأة أيضًا مستوى تجميع واحدًا، مثل `skills/<group>/<skill>/SKILL.md`، بحيث يمكن الاحتفاظ بـ Skills الخارجية ذات الصلة ضمن مجلد مشترك دون فحص عودي واسع.

تعرض صفحات Skills في ClawHub أحدث حالة فحص أمني قبل التثبيت، مع صفحات تفاصيل للفاحصين VirusTotal وClawScan والتحليل الثابت. يبقى `openclaw skills install <slug>` مسار التثبيت فقط؛ ويستعيد الناشرون الإيجابيات الكاذبة عبر لوحة تحكم ClawHub أو `clawhub skill rescan <slug>`.

## الأمان

<Warning>
تعامل مع Skills الخارجية كـ **تعليمات برمجية غير موثوقة**. اقرأها قبل التفعيل.
فضّل التشغيل ضمن sandbox للمدخلات غير الموثوقة والأدوات الخطرة. راجع
[Sandboxing](/ar/gateway/sandboxing) لعناصر التحكم من جهة الوكيل.
</Warning>

- لا يقبل اكتشاف Skills في مساحة العمل والأدلة الإضافية إلا جذور Skills وملفات `SKILL.md` التي يبقى `realpath` المحلول لها داخل الجذر المهيأ.
- عمليات تثبيت اعتماديات Skills المدعومة من Gateway (`skills.install`، والإعداد الأولي، وواجهة إعدادات Skills) تشغل فاحص التعليمات البرمجية الخطرة المدمج قبل تنفيذ بيانات تعريف المثبّت. تحظر نتائج `critical` افتراضيًا ما لم يضبط المستدعي التجاوز الخطر صراحةً؛ أما النتائج المريبة فلا تزال تحذر فقط.
- يختلف `openclaw skills install <slug>` — فهو ينزّل مجلد Skill من ClawHub إلى مساحة العمل ولا يستخدم مسار بيانات تعريف المثبّت أعلاه.
- يحقن `skills.entries.*.env` و`skills.entries.*.apiKey` الأسرار في عملية **المضيف** لتلك دورة الوكيل (وليس sandbox). أبقِ الأسرار خارج الموجهات والسجلات.

لنموذج تهديد أوسع وقوائم تحقق، راجع [الأمان](/ar/gateway/security).

## تنسيق SKILL.md

يجب أن يتضمن `SKILL.md` على الأقل:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

يتبع OpenClaw مواصفة AgentSkills للتخطيط/النية. يدعم المحلل المستخدم بواسطة الوكيل المضمّن مفاتيح frontmatter **أحادية السطر** فقط؛ ويجب أن تكون `metadata` **كائن JSON أحادي السطر**. استخدم `{baseDir}` في التعليمات للإشارة إلى مسار مجلد Skill.

### مفاتيح frontmatter الاختيارية

<ParamField path="homepage" type="string">
  عنوان URL يظهر باسم "موقع الويب" في واجهة Skills على macOS. مدعوم أيضًا عبر `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  عندما تكون `true`، تظهر Skill كأمر شرطة مائلة للمستخدم.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  عندما تكون `true`، تُستبعد Skill من موجه النموذج (وتظل متاحة عبر استدعاء المستخدم).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  عند ضبطها على `tool`، يتجاوز أمر الشرطة المائلة النموذج ويرسل مباشرةً إلى أداة.
</ParamField>
<ParamField path="command-tool" type="string">
  اسم الأداة المراد استدعاؤها عند ضبط `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  لإرسال الأداة، يمرر سلسلة الوسائط الخام إلى الأداة (دون تحليل من النواة). تُستدعى الأداة مع `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## التقييد (مرشحات وقت التحميل)

يرشح OpenClaw الـ Skills وقت التحميل باستخدام `metadata` (JSON أحادي السطر):

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

<ParamField path="always" type="boolean">
  عندما تكون `true`، أدرج Skill دائمًا (وتجاوز القيود الأخرى).
</ParamField>
<ParamField path="emoji" type="string">
  رمز تعبيري اختياري تستخدمه واجهة Skills على macOS.
</ParamField>
<ParamField path="homepage" type="string">
  عنوان URL اختياري يُعرض باسم "موقع الويب" في واجهة Skills على macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  قائمة اختيارية بالمنصات. إذا ضُبطت، تكون Skill مؤهلة فقط على أنظمة التشغيل تلك.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  يجب أن يوجد كل عنصر على `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  يجب أن يوجد عنصر واحد على الأقل على `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  يجب أن يوجد متغير البيئة أو أن يُوفَّر في الإعداد.
</ParamField>
<ParamField path="requires.config" type="string[]">
  قائمة بمسارات `openclaw.json` التي يجب أن تكون truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  اسم متغير البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  مواصفات مثبّت اختيارية تستخدمها واجهة Skills على macOS (brew/node/go/uv/download).
</ParamField>

إذا لم تكن `metadata.openclaw` موجودة، تكون Skill مؤهلة دائمًا (ما لم تكن معطلة في الإعداد أو محظورة بواسطة `skills.allowBundled` بالنسبة إلى Skills المضمّنة).

<Note>
لا تزال كتل `metadata.clawdbot` القديمة مقبولة عندما تكون
`metadata.openclaw` غائبة، بحيث تحتفظ Skills المثبتة القديمة بقيود
اعتمادياتها وتلميحات المثبّت. يجب أن تستخدم Skills الجديدة والمحدّثة
`metadata.openclaw`.
</Note>

### ملاحظات Sandboxing

- يُفحص `requires.bins` على **المضيف** وقت تحميل Skill.
- إذا كان الوكيل يعمل ضمن sandbox، يجب أن يوجد الملف التنفيذي أيضًا **داخل الحاوية**. ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` (أو صورة مخصصة). يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية. تتطلب عمليات تثبيت الحزم أيضًا خروجًا إلى الشبكة، ونظام ملفات جذريًا قابلًا للكتابة، ومستخدم root في sandbox.
- مثال: تحتاج Skill `summarize` (`skills/summarize/SKILL.md`) إلى CLI باسم `summarize` داخل حاوية sandbox لتعمل هناك.

### مواصفات المثبّت

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

<AccordionGroup>
  <Accordion title="قواعد اختيار المثبّت">
    - إذا أُدرجت عدة مثبّتات، يختار Gateway خيارًا مفضلًا واحدًا (brew عند توفره، وإلا node).
    - إذا كانت كل المثبّتات `download`، يعرض OpenClaw كل إدخال حتى تتمكن من رؤية الملفات المتاحة.
    - يمكن أن تتضمن مواصفات المثبّت `os: ["darwin"|"linux"|"win32"]` لتصفية الخيارات حسب المنصة.
    - تراعي عمليات تثبيت Node القيمة `skills.install.nodeManager` في `openclaw.json` (الافتراضي: npm؛ الخيارات: npm/pnpm/yarn/bun). يؤثر هذا فقط في تثبيت Skills؛ أما وقت تشغيل Gateway فيجب أن يظل Node — لا يُوصى باستخدام Bun مع WhatsApp/Telegram.
    - اختيار المثبّت المدعوم من Gateway موجّه بالتفضيلات: عندما تخلط مواصفات التثبيت بين الأنواع، يفضّل OpenClaw Homebrew عندما يكون `skills.install.preferBrew` مفعّلًا ويكون `brew` موجودًا، ثم `uv`، ثم مدير node المضبوط، ثم البدائل الأخرى مثل `go` أو `download`.
    - إذا كانت كل مواصفات التثبيت `download`، يعرض OpenClaw كل خيارات التنزيل بدلًا من اختزالها في مثبّت مفضل واحد.

  </Accordion>
  <Accordion title="تفاصيل كل مثبّت">
    - **تثبيت Go:** إذا كان `go` مفقودًا وكان `brew` متاحًا، يثبّت Gateway لغة Go عبر Homebrew أولًا ويضبط `GOBIN` على مجلد `bin` الخاص بـ Homebrew عندما يكون ذلك ممكنًا.
    - **تثبيت التنزيلات:** `url` (مطلوب)، `archive` (`tar.gz` | `tar.bz2` | `zip`)، `extract` (الافتراضي: تلقائي عند اكتشاف أرشيف)، `stripComponents`، `targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## تجاوزات الإعدادات

يمكن تبديل Skills المضمّنة والمُدارة وتزويدها بقيم البيئة
ضمن `skills.entries` في `~/.openclaw/openclaw.json`:

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

<ParamField path="enabled" type="boolean">
  يعطّل `false` الـ skill حتى إذا كانت مضمّنة أو مثبتة.
  مهارة `coding-agent` المضمّنة اختيارية: اضبط
  `skills.entries.coding-agent.enabled: true` قبل إتاحتها للوكلاء،
  ثم تأكد من تثبيت أحد `claude` أو `codex` أو `opencode` أو `pi` ومن أنه
  مصادق عليه لواجهة CLI الخاصة به.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  اختصار للمهارات التي تعلن `metadata.openclaw.primaryEnv`. يدعم النص الصريح أو SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  تُحقن فقط إذا لم يكن المتغير مضبوطًا مسبقًا في العملية.
</ParamField>
<ParamField path="config" type="object">
  حاوية اختيارية لحقول مخصصة لكل skill. يجب أن تكون المفاتيح المخصصة هنا.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  قائمة سماح اختيارية للـ Skills **المضمّنة** فقط. إذا ضُبطت، فلن تكون مؤهلة إلا Skills المضمّنة الموجودة في القائمة (لا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
</ParamField>

إذا كان اسم الـ skill يحتوي على واصلات، فضع المفتاح بين علامتي اقتباس (يسمح JSON5
بالمفاتيح المقتبسة). تطابق مفاتيح الإعدادات **اسم الـ skill** افتراضيًا — إذا كانت skill
تعرّف `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح ضمن `skills.entries`.

<Note>
لإنشاء/تحرير الصور الجاهزة داخل OpenClaw، استخدم أداة
`image_generate` الأساسية مع `agents.defaults.imageGenerationModel` بدلًا
من skill مضمّنة. أمثلة Skills هنا مخصصة لسير العمل المخصص أو التابع لجهات خارجية.
لتحليل الصور الأصلي استخدم أداة `image` مع
`agents.defaults.imageModel`. إذا اخترت `openai/*` أو `google/*`
أو `fal/*` أو نموذج صور آخر خاص بمزوّد، فأضف أيضًا مفتاح
المصادقة/API الخاص بذلك المزوّد.
</Note>

## حقن البيئة

عند بدء تشغيل وكيل، يقوم OpenClaw بما يلي:

1. يقرأ بيانات skill الوصفية.
2. يطبّق `skills.entries.<key>.env` و`skills.entries.<key>.apiKey` على `process.env`.
3. يبني موجّه النظام باستخدام Skills **المؤهلة**.
4. يستعيد البيئة الأصلية بعد انتهاء التشغيل.

حقن البيئة **محدّد بنطاق تشغيل الوكيل**، وليس بيئة shell عامة.

بالنسبة إلى واجهة `claude-cli` الخلفية المضمّنة، ينشئ OpenClaw أيضًا نفس
اللقطة المؤهلة كـ Plugin مؤقت لـ Claude Code ويمررها باستخدام
`--plugin-dir`. عندها يمكن لـ Claude Code استخدام محلّل Skills الأصلي لديه، بينما
يظل OpenClaw يملك أسبقية الترتيب، وقوائم السماح لكل وكيل، والبوابات، وحقن
مفاتيح البيئة/API عبر `skills.entries.*`. تستخدم واجهات CLI الخلفية الأخرى
فهرس الموجّه فقط.

## اللقطات والتحديث

يلتقط OpenClaw لقطة من Skills المؤهلة **عند بدء جلسة** ويعيد
استخدام تلك القائمة في الأدوار اللاحقة ضمن الجلسة نفسها. تسري تغييرات
Skills أو الإعدادات عند الجلسة الجديدة التالية.

يمكن تحديث Skills في منتصف الجلسة في حالتين:

- مفعّل مراقب Skills.
- تظهر عقدة بعيدة مؤهلة جديدة.

اعتبر هذا **إعادة تحميل ساخنة**: تُلتقط القائمة المحدّثة في
دور الوكيل التالي. إذا تغيّرت قائمة سماح Skills الفعلية للوكيل في تلك
الجلسة، يحدّث OpenClaw اللقطة حتى تبقى Skills المرئية متوافقة
مع الوكيل الحالي.

### مراقب Skills

افتراضيًا، يراقب OpenClaw مجلدات Skills ويرفع إصدار لقطة Skills
عند تغير ملفات `SKILL.md`. اضبط ذلك ضمن `skills.load`:

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

### عقد macOS البعيدة (Gateway على Linux)

إذا كان Gateway يعمل على Linux لكن توجد **عقدة macOS** متصلة مع
السماح بـ `system.run` (أي أن أمان موافقات Exec غير مضبوط على `deny`)،
يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما تكون
الثنائيات المطلوبة موجودة على تلك العقدة. يجب أن ينفذ الوكيل تلك Skills
عبر أداة `exec` مع `host=node`.

يعتمد هذا على إبلاغ العقدة عن دعمها للأوامر وعلى فحص ثنائي
عبر `system.which` أو `system.run`. لا تجعل العقد غير المتصلة
Skills البعيدة فقط مرئية. إذا توقفت عقدة متصلة عن الرد على فحوصات
الثنائيات، يمسح OpenClaw مطابقات الثنائيات المخزنة مؤقتًا لديها حتى لا يرى الوكلاء
Skills التي لا يمكن تشغيلها هناك حاليًا.

## تأثير الرموز

عندما تكون Skills مؤهلة، يحقن OpenClaw قائمة XML مضغوطة بالـ Skills المتاحة
في موجّه النظام (عبر `formatSkillsForPrompt` في
`pi-coding-agent`). التكلفة حتمية:

- **الكلفة الأساسية** (فقط عند وجود skill واحدة أو أكثر): 195 حرفًا.
- **لكل skill:** 97 حرفًا + طول قيم `<name>` و`<description>` و`<location>` بعد تهريب XML.

الصيغة (بالأحرف):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

يوسّع تهريب XML الأحرف `& < > " '` إلى كيانات (`&amp;`، `&lt;`، إلخ)،
ما يزيد الطول. تختلف أعداد الرموز حسب مقطّع الرموز في النموذج. تقدير تقريبي
على نمط OpenAI هو نحو 4 أحرف/رمز، لذا فإن **97 حرفًا ≈ 24 رمزًا** لكل
skill بالإضافة إلى أطوال الحقول الفعلية لديك.

## دورة حياة Skills المُدارة

يشحن OpenClaw مجموعة أساسية من Skills كـ **Skills مضمّنة** مع
التثبيت (حزمة npm أو OpenClaw.app). يوجد `~/.openclaw/skills` من أجل
التجاوزات المحلية — مثل تثبيت إصدار محدد أو ترقيع skill دون
تغيير النسخة المضمّنة. Skills الخاصة بمساحة العمل مملوكة للمستخدم وتتجاوز
كليهما عند تعارض الأسماء.

## هل تبحث عن مزيد من Skills؟

تصفح [https://clawhub.ai](https://clawhub.ai). مخطط الإعداد الكامل:
[إعدادات Skills](/ar/tools/skills-config).

## ذات صلة

- [ClawHub](/ar/tools/clawhub) — سجل Skills العام
- [إنشاء Skills](/ar/tools/creating-skills) — بناء Skills مخصصة
- [Plugins](/ar/tools/plugin) — نظرة عامة على نظام Plugin
- [Plugin ورشة Skills](/ar/plugins/skill-workshop) — إنشاء Skills من عمل الوكيل
- [إعدادات Skills](/ar/tools/skills-config) — مرجع إعدادات skill
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) — كل أوامر الشرطة المائلة المتاحة
