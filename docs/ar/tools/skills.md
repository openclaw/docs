---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير شروط إتاحة Skills أو قوائم السماح أو قواعد التحميل
    - فهم أسبقية المهارات وسلوك اللقطات
sidebarTitle: Skills
summary: 'Skills: المُدارة مقابل مساحة العمل، وقواعد البوابات، وقوائم السماح للوكلاء، وربط التكوين'
title: Skills
x-i18n:
    generated_at: "2026-04-30T08:32:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

يستخدم OpenClaw مجلدات مهارات **متوافقة مع [AgentSkills](https://agentskills.io)**
لتعليم الوكيل كيفية استخدام الأدوات. كل مهارة هي دليل يحتوي على
`SKILL.md` مع مقدمة YAML وتعليمات. يحمّل OpenClaw المهارات المضمّنة
إضافة إلى التجاوزات المحلية الاختيارية، ويرشّحها وقت التحميل بناءً على
البيئة، والإعدادات، ووجود الملفات التنفيذية.

## المواقع والأسبقية

يحمّل OpenClaw المهارات من هذه المصادر، **الأعلى أسبقية أولاً**:

| #   | المصدر                | المسار                           |
| --- | --------------------- | -------------------------------- |
| 1   | مهارات مساحة العمل    | `<workspace>/skills`             |
| 2   | مهارات وكيل المشروع   | `<workspace>/.agents/skills`     |
| 3   | مهارات الوكيل الشخصية | `~/.agents/skills`               |
| 4   | مهارات مُدارة/محلية   | `~/.openclaw/skills`             |
| 5   | مهارات مضمّنة         | تُشحن مع التثبيت                 |
| 6   | مجلدات مهارات إضافية | `skills.load.extraDirs` (config) |

إذا تعارض اسم مهارة، يفوز المصدر الأعلى.

## المهارات الخاصة بكل وكيل مقابل المهارات المشتركة

في إعدادات **وكلاء متعددين**، يمتلك كل وكيل مساحة عمل خاصة به:

| النطاق               | المسار                                      | مرئي لـ                    |
| -------------------- | ------------------------------------------- | -------------------------- |
| خاص بكل وكيل         | `<workspace>/skills`                        | ذلك الوكيل فقط             |
| وكيل المشروع         | `<workspace>/.agents/skills`                | وكيل مساحة العمل تلك فقط   |
| الوكيل الشخصي        | `~/.agents/skills`                          | كل الوكلاء على ذلك الجهاز  |
| مشترك مُدار/محلي     | `~/.openclaw/skills`                        | كل الوكلاء على ذلك الجهاز  |
| أدلة إضافية مشتركة   | `skills.load.extraDirs` (الأدنى أسبقية)     | كل الوكلاء على ذلك الجهاز  |

الاسم نفسه في مواضع متعددة → يفوز المصدر الأعلى. مساحة العمل تتفوق على
وكيل المشروع، ويتفوق ذلك على الوكيل الشخصي، ثم المُدار/المحلي، ثم المضمّن،
ثم الأدلة الإضافية.

## قوائم السماح لمهارات الوكيل

**موقع** المهارة و**مرئية** المهارة عنصران تحكميان منفصلان.
يحدد الموقع/الأسبقية أي نسخة من مهارة لها الاسم نفسه تفوز؛ وتحدد قوائم
السماح للوكيل أي مهارات يستطيع الوكيل استخدامها فعلياً.

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
  <Accordion title="Allowlist rules">
    - احذف `agents.defaults.skills` للسماح بمهارات غير مقيدة افتراضياً.
    - احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
    - اضبط `agents.list[].skills: []` لعدم توفير أي مهارات.
    - قائمة `agents.list[].skills` غير الفارغة هي المجموعة **النهائية** لذلك
      الوكيل؛ ولا تُدمج مع الإعدادات الافتراضية.
    - تُطبّق قائمة السماح الفعالة عبر بناء الموجّه، واكتشاف أوامر المهارات
      ذات الشرطة المائلة، ومزامنة العزل، ولقطات المهارات.
  </Accordion>
</AccordionGroup>

## Plugins والمهارات

يمكن لـ Plugins شحن مهاراتها الخاصة عبر سرد أدلة `skills` في
`openclaw.plugin.json` (المسارات نسبية إلى جذر Plugin). تُحمّل مهارات Plugin
عند تمكين Plugin. هذا هو المكان الصحيح لأدلة التشغيل الخاصة بالأداة التي
تكون طويلة جداً لوصف الأداة لكنها يجب أن تكون متاحة كلما ثُبّت Plugin؛
على سبيل المثال، يشحن Plugin المتصفح مهارة `browser-automation` للتحكم
متعدد الخطوات في المتصفح.

تُدمج أدلة مهارات Plugin في مسار منخفض الأسبقية نفسه مثل
`skills.load.extraDirs`، لذلك تتجاوزها أي مهارة مضمّنة، أو مُدارة، أو خاصة
بوكيل، أو خاصة بمساحة العمل تحمل الاسم نفسه. يمكنك تقييدها عبر
`metadata.openclaw.requires.config` في إدخال إعدادات Plugin.

راجع [Plugins](/ar/tools/plugin) للاكتشاف/الإعدادات و[الأدوات](/ar/tools) لواجهة
الأدوات التي تعلّمها تلك المهارات.

## Skill Workshop

يمكن لـ Plugin **Skill Workshop** الاختياري والتجريبي إنشاء مهارات مساحة
العمل أو تحديثها من إجراءات قابلة لإعادة الاستخدام تمت ملاحظتها أثناء عمل
الوكيل. وهو معطّل افتراضياً ويجب تمكينه صراحة عبر
`plugins.entries.skill-workshop`.

يكتب Skill Workshop فقط إلى `<workspace>/skills`، ويفحص المحتوى المُنشأ،
ويدعم الموافقة المعلّقة أو عمليات الكتابة الآمنة التلقائية، ويعزل
المقترحات غير الآمنة، ويحدّث لقطة المهارات بعد عمليات الكتابة الناجحة بحيث
تصبح المهارات الجديدة متاحة دون إعادة تشغيل Gateway.

استخدمه لتصحيحات مثل _"في المرة القادمة، تحقق من إسناد GIF"_ أو لسير عمل
اكتُسب بصعوبة مثل قوائم تحقق ضمان جودة الوسائط. ابدأ بالموافقة المعلّقة؛
واستخدم الكتابات التلقائية فقط في مساحات العمل الموثوقة بعد مراجعة
مقترحاته. الدليل الكامل: [Plugin Skill Workshop](/ar/plugins/skill-workshop).

## ClawHub (التثبيت والمزامنة)

[ClawHub](https://clawhub.ai) هو سجل المهارات العام لـ OpenClaw.
استخدم أوامر `openclaw skills` الأصلية للاكتشاف/التثبيت/التحديث، أو
CLI المنفصل `clawhub` لسير عمل النشر/المزامنة. الدليل الكامل:
[ClawHub](/ar/tools/clawhub).

| الإجراء                           | الأمر                                  |
| --------------------------------- | -------------------------------------- |
| تثبيت مهارة في مساحة العمل        | `openclaw skills install <skill-slug>` |
| تحديث كل المهارات المثبتة         | `openclaw skills update --all`         |
| مزامنة (فحص + نشر تحديثات)        | `clawhub sync --all`                   |

يثبّت `openclaw skills install` الأصلي داخل دليل `skills/` في مساحة العمل
النشطة. كذلك يثبّت CLI المنفصل `clawhub` داخل `./skills` ضمن دليل العمل
الحالي لديك (أو يعود إلى مساحة عمل OpenClaw المكوّنة). يلتقط OpenClaw ذلك
بصفته `<workspace>/skills` في الجلسة التالية.
تدعم جذور المهارات المكوّنة أيضاً مستوى تجميع واحداً، مثل
`skills/<group>/<skill>/SKILL.md`، بحيث يمكن إبقاء المهارات الخارجية
ذات الصلة ضمن مجلد مشترك دون فحص تكراري واسع.

تعرض صفحات مهارات ClawHub أحدث حالة فحص أمني قبل التثبيت، مع صفحات تفاصيل
للمفحّصين VirusTotal وClawScan والتحليل الساكن. يظل
`openclaw skills install <slug>` مسار التثبيت فقط؛ ويستعيد الناشرون
الإيجابيات الكاذبة عبر لوحة تحكم ClawHub أو
`clawhub skill rescan <slug>`.

## الأمان

<Warning>
تعامل مع مهارات الجهات الخارجية باعتبارها **شفرة غير موثوقة**. اقرأها قبل
تمكينها. فضّل عمليات التشغيل المعزولة للمدخلات غير الموثوقة والأدوات
عالية المخاطر. راجع [العزل](/ar/gateway/sandboxing) لعناصر التحكم الخاصة
بجانب الوكيل.
</Warning>

- يقبل اكتشاف مهارات مساحة العمل والأدلة الإضافية فقط جذور المهارات وملفات `SKILL.md` التي يبقى مسارها الحقيقي المحلول داخل الجذر المكوّن.
- عمليات تثبيت اعتماديات المهارات المدعومة من Gateway (`skills.install`، والتجهيز، وواجهة إعدادات Skills) تشغّل مفحّص الشفرة الخطرة المدمج قبل تنفيذ بيانات تعريف المثبّت. تمنع نتائج `critical` افتراضياً ما لم يضبط المستدعي تجاوز الخطر صراحة؛ أما النتائج المريبة فلا تزال تعرض تحذيراً فقط.
- يختلف `openclaw skills install <slug>`؛ فهو ينزّل مجلد مهارة ClawHub إلى مساحة العمل ولا يستخدم مسار بيانات تعريف المثبّت أعلاه.
- يحقن `skills.entries.*.env` و`skills.entries.*.apiKey` الأسرار في عملية **المضيف** لدورة ذلك الوكيل (وليس في العزل). أبقِ الأسرار خارج الموجّهات والسجلات.

لنموذج تهديد أوسع وقوائم تحقق، راجع [الأمان](/ar/gateway/security).

## تنسيق SKILL.md

يجب أن يتضمن `SKILL.md` على الأقل:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

يتبع OpenClaw مواصفة AgentSkills للتخطيط/القصد. يدعم المحلّل المستخدم
بواسطة الوكيل المضمّن مفاتيح مقدمة **أحادية السطر** فقط؛ وينبغي أن تكون
`metadata` **كائن JSON أحادي السطر**. استخدم `{baseDir}` في التعليمات
للإشارة إلى مسار مجلد المهارة.

### مفاتيح المقدمة الاختيارية

<ParamField path="homepage" type="string">
  عنوان URL يُعرض باسم "موقع الويب" في واجهة Skills على macOS. مدعوم أيضاً عبر `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  عندما تكون `true`، تُعرض المهارة كأمر مستخدم يبدأ بشرطة مائلة.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  عندما تكون `true`، تُستبعد المهارة من موجّه النموذج (وتظل متاحة عبر استدعاء المستخدم).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  عند ضبطها إلى `tool`، يتجاوز الأمر ذو الشرطة المائلة النموذج ويُرسل مباشرة إلى أداة.
</ParamField>
<ParamField path="command-tool" type="string">
  اسم الأداة المراد استدعاؤها عند ضبط `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  لإرسال الأداة، يمرر سلسلة الوسيطات الخام إلى الأداة (دون تحليل من النواة). تُستدعى الأداة باستخدام `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## التقييد (مرشحات وقت التحميل)

يرشّح OpenClaw المهارات وقت التحميل باستخدام `metadata` (JSON أحادي السطر):

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
  عندما تكون `true`، أدرج المهارة دائماً (وتجاوز القيود الأخرى).
</ParamField>
<ParamField path="emoji" type="string">
  رمز تعبيري اختياري تستخدمه واجهة Skills على macOS.
</ParamField>
<ParamField path="homepage" type="string">
  عنوان URL اختياري يظهر باسم "موقع الويب" في واجهة Skills على macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  قائمة اختيارية بالمنصات. إذا ضُبطت، تكون المهارة مؤهلة فقط على أنظمة التشغيل تلك.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  يجب أن يوجد كل واحد منها على `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  يجب أن يوجد واحد منها على الأقل على `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  يجب أن يوجد متغير البيئة أو أن يُوفّر في الإعدادات.
</ParamField>
<ParamField path="requires.config" type="string[]">
  قائمة بمسارات `openclaw.json` التي يجب أن تكون صادقة.
</ParamField>
<ParamField path="primaryEnv" type="string">
  اسم متغير البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  مواصفات مثبّت اختيارية تستخدمها واجهة Skills على macOS (brew/node/go/uv/download).
</ParamField>

إذا لم تكن `metadata.openclaw` موجودة، تكون المهارة مؤهلة دائماً (ما لم
تُعطّل في الإعدادات أو تُحظر بواسطة `skills.allowBundled` للمهارات المضمّنة).

<Note>
لا تزال كتل `metadata.clawdbot` القديمة مقبولة عندما تكون
`metadata.openclaw` غائبة، بحيث تحتفظ المهارات المثبتة الأقدم بقيود
الاعتماديات وتلميحات المثبّت. ينبغي للمهارات الجديدة والمحدّثة استخدام
`metadata.openclaw`.
</Note>

### ملاحظات العزل

- يُفحص `requires.bins` على **المضيف** وقت تحميل المهارة.
- إذا كان الوكيل معزولاً، يجب أن يوجد الملف التنفيذي أيضاً **داخل الحاوية**. ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` (أو صورة مخصصة). يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية. تتطلب عمليات تثبيت الحزم أيضاً خروجاً للشبكة، ونظام ملفات جذر قابل للكتابة، ومستخدم root داخل العزل.
- مثال: تحتاج مهارة `summarize` (`skills/summarize/SKILL.md`) إلى CLI الخاص بـ `summarize` داخل حاوية العزل لكي تعمل هناك.

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
    - إذا كانت هناك عدة مثبّتات مدرجة، يختار Gateway خيارًا مفضّلًا واحدًا (brew عند توفره، وإلا node).
    - إذا كانت كل المثبّتات هي `download`، يعرض OpenClaw كل إدخال حتى تتمكن من رؤية المصنوعات المتاحة.
    - يمكن أن تتضمن مواصفات المثبّت `os: ["darwin"|"linux"|"win32"]` لتصفية الخيارات حسب المنصة.
    - تحترم تثبيتات Node الإعداد `skills.install.nodeManager` في `openclaw.json` (الافتراضي: npm؛ الخيارات: npm/pnpm/yarn/bun). يؤثر هذا فقط في تثبيتات Skills؛ يجب أن يظل وقت تشغيل Gateway هو Node — لا يُوصى باستخدام Bun مع WhatsApp/Telegram.
    - يعتمد اختيار المثبّت المدعوم من Gateway على التفضيلات: عندما تمزج مواصفات التثبيت بين الأنواع، يفضّل OpenClaw Homebrew عندما يكون `skills.install.preferBrew` مفعّلًا ويكون `brew` موجودًا، ثم `uv`، ثم مدير node المكوّن، ثم البدائل الأخرى مثل `go` أو `download`.
    - إذا كانت كل مواصفات التثبيت هي `download`، يعرض OpenClaw كل خيارات التنزيل بدلًا من اختزالها إلى مثبّت مفضّل واحد.

  </Accordion>
  <Accordion title="تفاصيل كل مثبّت">
    - **تثبيتات Go:** إذا كان `go` مفقودًا وكان `brew` متاحًا، يثبّت Gateway أداة Go عبر Homebrew أولًا ويضبط `GOBIN` على `bin` الخاص بـ Homebrew عندما يكون ذلك ممكنًا.
    - **تثبيتات التنزيل:** `url` (مطلوب)، `archive` (`tar.gz` | `tar.bz2` | `zip`)، `extract` (الافتراضي: تلقائي عند اكتشاف الأرشيف)، `stripComponents`، `targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## تجاوزات التكوين

يمكن تفعيل Skills المضمّنة والمُدارة أو تعطيلها وتزويدها بقيم البيئة
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
  يعطّل `false` الـ skill حتى إذا كانت مضمّنة أو مثبّتة.
  تكون skill المضمّنة `coding-agent` اختيارية التفعيل: اضبط
  `skills.entries.coding-agent.enabled: true` قبل إتاحتها للوكلاء،
  ثم تأكد من تثبيت أحد `claude` أو `codex` أو `opencode` أو `pi` ومصادقته
  لواجهة CLI الخاصة به.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  وسيلة ملائمة لـ Skills التي تعلن `metadata.openclaw.primaryEnv`. يدعم النص الصريح أو SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  يُحقن فقط إذا لم يكن المتغير مضبوطًا بالفعل في العملية.
</ParamField>
<ParamField path="config" type="object">
  حاوية اختيارية لحقول مخصصة لكل skill. يجب أن تعيش المفاتيح المخصصة هنا.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  قائمة سماح اختيارية لـ Skills **المضمّنة** فقط. إذا ضُبطت، فلن تكون إلا Skills المضمّنة في القائمة مؤهلة (لا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
</ParamField>

إذا كان اسم الـ skill يحتوي على واصلات، فضع المفتاح بين علامات اقتباس (يسمح JSON5
بالمفاتيح المقتبسة). تطابق مفاتيح التكوين **اسم الـ skill** افتراضيًا — إذا كانت skill
تعرّف `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح ضمن `skills.entries`.

<Note>
لتوليد/تحرير الصور الجاهزة داخل OpenClaw، استخدم أداة النواة
`image_generate` مع `agents.defaults.imageGenerationModel` بدلًا من
skill مضمّنة. أمثلة Skills هنا مخصصة لسير العمل المخصص أو الخاص بجهات خارجية.
لتحليل الصور الأصلي استخدم أداة `image` مع
`agents.defaults.imageModel`. إذا اخترت `openai/*` أو `google/*` أو
`fal/*` أو نموذج صور آخر خاصًا بموفّر، فأضف مفتاح المصادقة/API الخاص بذلك الموفّر أيضًا.
</Note>

## حقن البيئة

عند بدء تشغيل وكيل، يقوم OpenClaw بما يلي:

1. يقرأ بيانات skill الوصفية.
2. يطبّق `skills.entries.<key>.env` و`skills.entries.<key>.apiKey` على `process.env`.
3. يبني موجه النظام باستخدام Skills **المؤهلة**.
4. يستعيد البيئة الأصلية بعد انتهاء التشغيل.

حقن البيئة **محدود بنطاق تشغيل الوكيل**، وليس بيئة shell عامة.

بالنسبة إلى الواجهة الخلفية المضمّنة `claude-cli`، يجسّد OpenClaw أيضًا اللقطة المؤهلة نفسها
بصفتها Plugin مؤقتًا لـ Claude Code ويمررها باستخدام
`--plugin-dir`. يمكن لـ Claude Code بعد ذلك استخدام محلل Skills الأصلي الخاص به بينما
يظل OpenClaw مالكًا للأسبقية، وقوائم السماح لكل وكيل، والبوابات، وحقن مفاتيح البيئة/API عبر
`skills.entries.*`. تستخدم واجهات CLI الخلفية الأخرى
فهرس الموجه فقط.

## اللقطات والتحديث

يلتقط OpenClaw لقطة لـ Skills المؤهلة **عند بدء الجلسة**
ويعيد استخدام تلك القائمة في الأدوار اللاحقة ضمن الجلسة نفسها. تسري التغييرات على
Skills أو التكوين في الجلسة الجديدة التالية.

يمكن تحديث Skills في منتصف الجلسة في حالتين:

- يكون مراقب Skills مفعّلًا.
- تظهر عقدة بعيدة مؤهلة جديدة.

تعامل مع هذا كتحديث **ساخن**: تُستخدم القائمة المحدّثة في
دور الوكيل التالي. إذا تغيّرت قائمة سماح Skills الفعلية للوكيل في تلك
الجلسة، يحدّث OpenClaw اللقطة حتى تبقى Skills المرئية متوافقة
مع الوكيل الحالي.

### مراقب Skills

افتراضيًا، يراقب OpenClaw مجلدات Skills ويزيد لقطة Skills
عند تغيّر ملفات `SKILL.md`. كوّن ذلك ضمن `skills.load`:

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

إذا كان Gateway يعمل على Linux لكن **عقدة macOS** متصلة مع السماح بـ
`system.run` (عدم ضبط أمان موافقات Exec على `deny`)،
يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما تكون الثنائيات المطلوبة
موجودة على تلك العقدة. ينبغي للوكيل تنفيذ تلك Skills
عبر أداة `exec` مع `host=node`.

يعتمد هذا على إبلاغ العقدة عن دعم الأوامر لديها وعلى فحص bin
عبر `system.which` أو `system.run`. لا تجعل العقد غير المتصلة
Skills البعيدة فقط مرئية. إذا توقفت عقدة متصلة عن الرد على فحوصات bin،
يمسح OpenClaw مطابقات bin المخزنة مؤقتًا لديها حتى لا يرى الوكلاء بعد ذلك
Skills التي لا يمكن تشغيلها هناك حاليًا.

## أثر الرموز

عندما تكون Skills مؤهلة، يحقن OpenClaw قائمة XML مضغوطة من Skills المتاحة
في موجه النظام (عبر `formatSkillsForPrompt` في
`pi-coding-agent`). التكلفة حتمية:

- **الحمل الأساسي** (فقط عند وجود skill واحدة أو أكثر): 195 حرفًا.
- **لكل skill:** 97 حرفًا + طول قيم XML المهربة `<name>` و`<description>` و`<location>`.

الصيغة (بالأحرف):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

يوسّع تهريب XML الرموز `& < > " '` إلى كيانات (`&amp;` و`&lt;`، إلخ)،
مما يزيد الطول. تختلف أعداد الرموز حسب مقطّع النموذج. تقدير تقريبي
بأسلوب OpenAI هو نحو 4 أحرف/رمز، لذا فإن **97 حرفًا ≈ 24 رمزًا** لكل
skill إضافةً إلى أطوال الحقول الفعلية لديك.

## دورة حياة Skills المُدارة

يشحن OpenClaw مجموعة أساسية من Skills بصفتها **Skills مضمّنة** مع
التثبيت (حزمة npm أو OpenClaw.app). يوجد `~/.openclaw/skills` من أجل
التجاوزات المحلية — مثلًا، تثبيت إصدار skill أو ترقيعها دون
تغيير النسخة المضمّنة. Skills الخاصة بمساحة العمل مملوكة للمستخدم وتتجاوز
كليهما عند تعارض الأسماء.

## هل تبحث عن المزيد من Skills؟

تصفح [https://clawhub.ai](https://clawhub.ai). مخطط التكوين الكامل:
[تكوين Skills](/ar/tools/skills-config).

## ذات صلة

- [ClawHub](/ar/tools/clawhub) — سجل Skills العام
- [إنشاء Skills](/ar/tools/creating-skills) — بناء Skills مخصصة
- [Plugins](/ar/tools/plugin) — نظرة عامة على نظام Plugin
- [Plugin ورشة Skills](/ar/plugins/skill-workshop) — توليد Skills من عمل الوكيل
- [تكوين Skills](/ar/tools/skills-config) — مرجع تكوين skill
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) — كل أوامر الشرطة المائلة المتاحة
