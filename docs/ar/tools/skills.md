---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير ضوابط تفعيل المهارات أو قوائم السماح أو قواعد التحميل
    - فهم أسبقية Skills وسلوك اللقطات
sidebarTitle: Skills
summary: 'Skills: المُدارة مقابل مساحة العمل، وقواعد البوابات، وقوائم السماح للوكلاء، وربط التكوين'
title: Skills
x-i18n:
    generated_at: "2026-05-02T21:05:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

يستخدم OpenClaw مجلدات Skills **متوافقة مع [AgentSkills](https://agentskills.io)** لتعليم الوكيل كيفية استخدام الأدوات. كل Skill هو دليل يحتوي على `SKILL.md` يتضمن frontmatter بصيغة YAML وتعليمات. يحمّل OpenClaw الـ Skills المضمّنة بالإضافة إلى تجاوزات محلية اختيارية، ويصفيها وقت التحميل بناءً على البيئة، والإعدادات، ووجود الثنائيات.

## المواقع والأسبقية

يحمّل OpenClaw الـ Skills من هذه المصادر، **بأعلى أسبقية أولاً**:

| #   | المصدر                | المسار                           |
| --- | --------------------- | -------------------------------- |
| 1   | Skills مساحة العمل    | `<workspace>/skills`             |
| 2   | Skills وكيل المشروع   | `<workspace>/.agents/skills`     |
| 3   | Skills الوكيل الشخصية | `~/.agents/skills`               |
| 4   | Skills مُدارة/محلية   | `~/.openclaw/skills`             |
| 5   | Skills مضمّنة         | مرفقة مع التثبيت                 |
| 6   | مجلدات Skills إضافية  | `skills.load.extraDirs` (إعداد)  |

إذا تعارض اسم Skill، يفوز المصدر الأعلى.

دليل `$CODEX_HOME/skills` الأصلي الخاص بـ Codex CLI ليس أحد جذور Skills في OpenClaw. في وضع Codex harness، تستخدم عمليات تشغيل خادم التطبيق المحلي منازل Codex معزولة لكل وكيل، لذلك لا تُحمّل Skills الشخصية الخاصة بـ Codex CLI ضمنيًا. استخدم `openclaw migrate codex --dry-run` لجردها، و`openclaw migrate codex` لاختيار أدلة Skills عبر مطالبة مربعات اختيار تفاعلية قبل نسخها إلى مساحة عمل وكيل OpenClaw الحالية. للتشغيل غير التفاعلي، كرر `--skill <name>` لكل Skill دقيقة تريد نسخها.

## Skills لكل وكيل مقابل Skills المشتركة

في إعدادات **الوكلاء المتعددين** يكون لكل وكيل مساحة عمل خاصة به:

| النطاق              | المسار                                      | مرئية لـ                         |
| ------------------- | ------------------------------------------- | -------------------------------- |
| لكل وكيل            | `<workspace>/skills`                        | ذلك الوكيل فقط                   |
| وكيل المشروع        | `<workspace>/.agents/skills`                | وكيل مساحة العمل تلك فقط         |
| الوكيل الشخصي       | `~/.agents/skills`                          | كل الوكلاء على ذلك الجهاز        |
| مشتركة مُدارة/محلية | `~/.openclaw/skills`                        | كل الوكلاء على ذلك الجهاز        |
| أدلة إضافية مشتركة  | `skills.load.extraDirs` (أدنى أسبقية)       | كل الوكلاء على ذلك الجهاز        |

الاسم نفسه في أماكن متعددة → يفوز المصدر الأعلى. مساحة العمل تتغلب على وكيل المشروع، وتتغلب على الوكيل الشخصي، وتتغلب على المُدارة/المحلية، وتتغلب على المضمّنة، وتتغلب على الأدلة الإضافية.

## قوائم السماح لـ Skills الوكيل

**موقع** Skill و**رؤية** Skill عنصران منفصلان للتحكم. يحدد الموقع/الأسبقية أي نسخة من Skill تحمل الاسم نفسه تفوز؛ وتحدد قوائم السماح الخاصة بالوكيل أي Skills يمكن للوكيل استخدامها فعليًا.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // يرث github, weather
      { id: "docs", skills: ["docs-search"] }, // يستبدل الإعدادات الافتراضية
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="قواعد قائمة السماح">
    - احذف `agents.defaults.skills` لإتاحة Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
    - عيّن `agents.list[].skills: []` لعدم إتاحة أي Skills.
    - قائمة `agents.list[].skills` غير الفارغة هي المجموعة **النهائية** لذلك الوكيل — ولا تُدمج مع الإعدادات الافتراضية.
    - تُطبق قائمة السماح الفعلية عبر بناء المطالبات، واكتشاف أوامر slash الخاصة بـ Skills، ومزامنة sandbox، ولقطات Skills.

  </Accordion>
</AccordionGroup>

## Plugins وSkills

يمكن لـ Plugins شحن Skills الخاصة بها من خلال إدراج أدلة `skills` في `openclaw.plugin.json` (مسارات نسبةً إلى جذر Plugin). تُحمّل Plugin Skills عندما يكون Plugin مفعّلًا. هذا هو المكان المناسب لأدلة التشغيل الخاصة بالأدوات التي تكون أطول من أن توضع في وصف الأداة، لكنها يجب أن تكون متاحة كلما كان Plugin مثبتًا — على سبيل المثال، يشحن Plugin المتصفح Skill باسم `browser-automation` للتحكم بالمتصفح على عدة خطوات.

تُدمج أدلة Plugin Skills في المسار نفسه منخفض الأسبقية مثل `skills.load.extraDirs`، لذلك فإن أي Skill مضمّنة أو مُدارة أو خاصة بوكيل أو بمساحة عمل تحمل الاسم نفسه تتجاوزها. يمكنك تقييدها عبر `metadata.openclaw.requires.config` في إدخال إعدادات Plugin.

راجع [Plugins](/ar/tools/plugin) للاكتشاف/الإعدادات و[الأدوات](/ar/tools) لسطح الأدوات الذي تعلّمه تلك Skills.

## Skill Workshop

يمكن لـ Plugin الاختياري والتجريبي **Skill Workshop** إنشاء أو تحديث Skills مساحة العمل من إجراءات قابلة لإعادة الاستخدام تمت ملاحظتها أثناء عمل الوكيل. يكون معطّلًا افتراضيًا ويجب تفعيله صراحةً عبر `plugins.entries.skill-workshop`.

يكتب Skill Workshop فقط إلى `<workspace>/skills`، ويفحص المحتوى المولّد، ويدعم الموافقة المعلّقة أو الكتابات الآمنة التلقائية، ويعزل المقترحات غير الآمنة، ويحدّث لقطة Skills بعد الكتابات الناجحة حتى تصبح Skills الجديدة متاحة دون إعادة تشغيل Gateway.

استخدمه للتصحيحات مثل _"في المرة القادمة، تحقق من نسبة GIF"_ أو لسير العمل المستخلص بصعوبة مثل قوائم فحص ضمان جودة الوسائط. ابدأ بالموافقة المعلّقة؛ واستخدم الكتابات التلقائية فقط في مساحات العمل الموثوقة بعد مراجعة مقترحاته. الدليل الكامل: [Plugin Skill Workshop](/ar/plugins/skill-workshop).

## ClawHub (التثبيت والمزامنة)

[ClawHub](https://clawhub.ai) هو سجل Skills العام لـ OpenClaw. استخدم أوامر `openclaw skills` الأصلية للاكتشاف/التثبيت/التحديث، أو CLI المنفصل `clawhub` لسير عمل النشر/المزامنة. الدليل الكامل: [ClawHub](/ar/tools/clawhub).

| الإجراء                            | الأمر                                  |
| ---------------------------------- | -------------------------------------- |
| تثبيت Skill في مساحة العمل         | `openclaw skills install <skill-slug>` |
| تحديث كل Skills المثبتة            | `openclaw skills update --all`         |
| المزامنة (فحص + نشر التحديثات)     | `clawhub sync --all`                   |

يثبّت `openclaw skills install` الأصلي في دليل `skills/` الخاص بمساحة العمل النشطة. كما يثبّت CLI المنفصل `clawhub` في `./skills` ضمن دليل العمل الحالي (أو يعود إلى مساحة عمل OpenClaw المضبوطة). يلتقط OpenClaw ذلك كـ `<workspace>/skills` في الجلسة التالية. تدعم جذور Skills المضبوطة أيضًا مستوى تجميع واحدًا، مثل `skills/<group>/<skill>/SKILL.md`، بحيث يمكن الاحتفاظ بـ Skills خارجية ذات صلة ضمن مجلد مشترك دون فحص تكراري واسع.

تعرض صفحات Skills في ClawHub أحدث حالة فحص أمان قبل التثبيت، مع صفحات تفاصيل للماسحات VirusTotal وClawScan والتحليل الثابت. يظل `openclaw skills install <slug>` مسار التثبيت فقط؛ ويستعيد الناشرون النتائج الإيجابية الكاذبة عبر لوحة تحكم ClawHub أو `clawhub skill rescan <slug>`.

## الأمان

<Warning>
عامل Skills الخارجية كـ **تعليمات برمجية غير موثوقة**. اقرأها قبل تفعيلها. فضّل التشغيل داخل sandbox للمدخلات غير الموثوقة والأدوات عالية المخاطر. راجع [Sandboxing](/ar/gateway/sandboxing) لعناصر التحكم من جهة الوكيل.
</Warning>

- يقبل اكتشاف Skills في مساحة العمل والأدلة الإضافية فقط جذور Skills وملفات `SKILL.md` التي يبقى realpath المحلول الخاص بها داخل الجذر المضبوط.
- عمليات تثبيت تبعيات Skills المدعومة عبر Gateway (`skills.install`، والإعداد الأولي، وواجهة إعدادات Skills) تشغّل ماسح التعليمات البرمجية الخطرة المدمج قبل تنفيذ بيانات تعريف المثبّت. تحظر نتائج `critical` افتراضيًا ما لم يعيّن المستدعي تجاوز الخطر صراحةً؛ أما النتائج المشبوهة فما زالت تعرض تحذيرًا فقط.
- `openclaw skills install <slug>` مختلف — فهو ينزّل مجلد Skill من ClawHub إلى مساحة العمل ولا يستخدم مسار بيانات تعريف المثبّت أعلاه.
- يحقن `skills.entries.*.env` و`skills.entries.*.apiKey` الأسرار في عملية **المضيف** لذلك الدور من الوكيل (وليس sandbox). أبقِ الأسرار خارج المطالبات والسجلات.

للحصول على نموذج تهديد وقوائم فحص أوسع، راجع [الأمان](/ar/gateway/security).

## صيغة SKILL.md

يجب أن يتضمن `SKILL.md` على الأقل:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

يتبع OpenClaw مواصفة AgentSkills للتخطيط/القصد. يدعم المحلل المستخدم بواسطة الوكيل المضمّن مفاتيح frontmatter **أحادية السطر** فقط؛ يجب أن تكون `metadata` **كائن JSON أحادي السطر**. استخدم `{baseDir}` في التعليمات للإشارة إلى مسار مجلد Skill.

### مفاتيح frontmatter الاختيارية

<ParamField path="homepage" type="string">
  عنوان URL يظهر باسم "الموقع الإلكتروني" في واجهة Skills على macOS. مدعوم أيضًا عبر `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  عندما تكون القيمة `true`، تظهر Skill كأمر slash للمستخدم.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  عندما تكون القيمة `true`، يبقي OpenClaw تعليمات Skill خارج المطالبة العادية للوكيل. تظل Skill مثبتة ويمكن تشغيلها صراحةً كأمر slash عندما تكون `user-invocable` أيضًا `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  عند تعيينها إلى `tool`، يتجاوز أمر slash النموذج ويرسله مباشرةً إلى أداة.
</ParamField>
<ParamField path="command-tool" type="string">
  اسم الأداة التي تُستدعى عند تعيين `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  لإرسال الأداة، يمرر سلسلة الوسائط الخام إلى الأداة (دون تحليل أساسي من النواة). تُستدعى الأداة مع `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## التقييد (مرشحات وقت التحميل)

يصفي OpenClaw الـ Skills وقت التحميل باستخدام `metadata` (JSON أحادي السطر):

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
  عندما تكون القيمة `true`، أدرج Skill دائمًا (وتجاوز القيود الأخرى).
</ParamField>
<ParamField path="emoji" type="string">
  رمز تعبيري اختياري تستخدمه واجهة Skills على macOS.
</ParamField>
<ParamField path="homepage" type="string">
  عنوان URL اختياري يظهر باسم "الموقع الإلكتروني" في واجهة Skills على macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  قائمة اختيارية بالمنصات. إذا ضُبطت، تكون Skill مؤهلة فقط على أنظمة التشغيل تلك.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  يجب أن يكون كل واحد منها موجودًا على `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  يجب أن يكون واحد منها على الأقل موجودًا على `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  يجب أن يكون متغير البيئة موجودًا أو مقدّمًا في الإعدادات.
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

إذا لم تكن `metadata.openclaw` موجودة، تكون Skill مؤهلة دائمًا (ما لم تكن معطّلة في الإعدادات أو محظورة بواسطة `skills.allowBundled` بالنسبة إلى Skills المضمّنة).

<Note>
ما زالت كتل `metadata.clawdbot` القديمة مقبولة عندما تكون `metadata.openclaw` غائبة، حتى تحتفظ Skills المثبتة الأقدم بقيود التبعيات وتلميحات المثبّت الخاصة بها. يجب أن تستخدم Skills الجديدة والمحدّثة `metadata.openclaw`.
</Note>

### ملاحظات Sandboxing

- يُفحص `requires.bins` على **المضيف** وقت تحميل Skill.
- إذا كان الوكيل داخل sandbox، فيجب أن يوجد الثنائي أيضًا **داخل الحاوية**. ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` (أو صورة مخصصة). يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية. تتطلب عمليات تثبيت الحزم أيضًا خروجًا إلى الشبكة، ونظام ملفات جذريًا قابلًا للكتابة، ومستخدم root في sandbox.
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
  <Accordion title="Installer selection rules">
    - إذا سُردت عدة مثبّتات، يختار Gateway خيارًا مفضّلًا واحدًا (`brew` عند توفره، وإلا `node`).
    - إذا كانت كل المثبّتات من نوع `download`، يعرض OpenClaw كل إدخال لتتمكن من رؤية الملفات المتاحة.
    - يمكن أن تتضمن مواصفات المثبّت `os: ["darwin"|"linux"|"win32"]` لتصفية الخيارات حسب المنصة.
    - تراعي تثبيتات Node الإعداد `skills.install.nodeManager` في `openclaw.json` (الافتراضي: npm؛ الخيارات: npm/pnpm/yarn/bun). يؤثر هذا فقط في تثبيت Skills؛ أما وقت تشغيل Gateway فينبغي أن يظل Node — لا يُنصح باستخدام Bun مع WhatsApp/Telegram.
    - اختيار المثبّت المدعوم من Gateway قائم على التفضيلات: عندما تمزج مواصفات التثبيت بين الأنواع، يفضّل OpenClaw Homebrew عند تمكين `skills.install.preferBrew` ووجود `brew`، ثم `uv`، ثم مدير Node المضبوط، ثم بدائل أخرى مثل `go` أو `download`.
    - إذا كانت كل مواصفة تثبيت من نوع `download`، يعرض OpenClaw كل خيارات التنزيل بدلًا من اختزالها إلى مثبّت مفضّل واحد.

  </Accordion>
  <Accordion title="Per-installer details">
    - **تثبيتات Go:** إذا كان `go` مفقودًا وكان `brew` متاحًا، يثبّت Gateway لغة Go عبر Homebrew أولًا ويضبط `GOBIN` على مجلد `bin` الخاص بـ Homebrew متى أمكن.
    - **تثبيتات التنزيل:** `url` (مطلوب)، و`archive` (`tar.gz` | `tar.bz2` | `zip`)، و`extract` (الافتراضي: تلقائي عند اكتشاف أرشيف)، و`stripComponents`، و`targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).

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
  يعطّل `false` الـ skill حتى لو كانت مضمّنة أو مثبّتة.
  skill المضمّنة `coding-agent` اختيارية التفعيل: اضبط
  `skills.entries.coding-agent.enabled: true` قبل إتاحتها للوكلاء،
  ثم تأكد من تثبيت أحد `claude` أو `codex` أو `opencode` أو `pi`
  ومصادقته لاستخدام CLI الخاص به.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  وسيلة مريحة للـ Skills التي تصرّح بـ `metadata.openclaw.primaryEnv`. تدعم النص الصريح أو SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  تُحقن فقط إذا لم يكن المتغير مضبوطًا مسبقًا في العملية.
</ParamField>
<ParamField path="config" type="object">
  حاوية اختيارية لحقول مخصصة لكل skill. يجب أن تكون المفاتيح المخصصة هنا.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  قائمة سماح اختيارية للـ Skills **المضمّنة** فقط. إذا ضُبطت، فلا تكون مؤهلة إلا Skills المضمّنة الموجودة في القائمة (لا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
</ParamField>

إذا كان اسم الـ skill يحتوي على شرطات، فضع المفتاح بين علامتَي اقتباس
(يسمح JSON5 بالمفاتيح المقتبسة). تطابق مفاتيح الإعدادات **اسم الـ skill**
افتراضيًا — إذا عرّفت skill قيمة `metadata.openclaw.skillKey`، فاستخدم ذلك
المفتاح ضمن `skills.entries`.

<Note>
لتوليد/تحرير الصور الجاهزة داخل OpenClaw، استخدم أداة
`image_generate` الأساسية مع `agents.defaults.imageGenerationModel` بدلًا
من skill مضمّنة. أمثلة Skills هنا مخصصة لسير العمل المخصص أو الخارجي.
لتحليل الصور الأصلي استخدم أداة `image` مع `agents.defaults.imageModel`.
إذا اخترت `openai/*` أو `google/*` أو `fal/*` أو نموذج صور آخر خاصًا بمزوّد،
فأضف أيضًا مفتاح المصادقة/API لذلك المزوّد.
</Note>

## حقن البيئة

عند بدء تشغيل وكيل، يقوم OpenClaw بما يلي:

1. يقرأ بيانات skill الوصفية.
2. يطبّق `skills.entries.<key>.env` و`skills.entries.<key>.apiKey` على `process.env`.
3. يبني موجه النظام باستخدام Skills **المؤهلة**.
4. يستعيد البيئة الأصلية بعد انتهاء التشغيل.

حقن البيئة **مقيّد بتشغيل الوكيل**، وليس بيئة shell عامة.

بالنسبة إلى خلفية `claude-cli` المضمّنة، يجسّد OpenClaw أيضًا اللقطة المؤهلة نفسها
على هيئة Plugin مؤقت لـ Claude Code ويمررها باستخدام `--plugin-dir`.
يمكن لـ Claude Code بعد ذلك استخدام محلّل Skills الأصلي لديه بينما يظل
OpenClaw مالكًا للأسبقية، وقوائم السماح لكل وكيل، والبوابات، وحقن مفاتيح
البيئة/API الخاصة بـ `skills.entries.*`. تستخدم خلفيات CLI الأخرى
كتالوج الموجه فقط.

## اللقطات والتحديث

يلتقط OpenClaw Skills المؤهلة **عند بدء الجلسة** ويعيد استخدام تلك القائمة
للمنعطفات اللاحقة في الجلسة نفسها. تسري تغييرات Skills أو الإعدادات عند
الجلسة الجديدة التالية.

يمكن تحديث Skills في منتصف الجلسة في حالتين:

- مراقب Skills مفعّل.
- تظهر عقدة بعيدة مؤهلة جديدة.

فكّر في ذلك على أنه **إعادة تحميل ساخنة**: تُلتقط القائمة المحدّثة في
منعطف الوكيل التالي. إذا تغيّرت قائمة سماح Skills الفعالة للوكيل في تلك
الجلسة، يحدّث OpenClaw اللقطة حتى تبقى Skills المرئية متوافقة مع الوكيل الحالي.

### مراقب Skills

افتراضيًا، يراقب OpenClaw مجلدات Skills ويرفع إصدار لقطة Skills
عند تغيّر ملفات `SKILL.md`. اضبط ذلك ضمن `skills.load`:

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
`system.run` (أي أن أمان موافقات Exec غير مضبوط على `deny`)،
فيمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عند وجود
الثنائيات المطلوبة على تلك العقدة. ينبغي للوكيل تنفيذ تلك Skills
عبر أداة `exec` مع `host=node`.

يعتمد هذا على إبلاغ العقدة عن دعمها للأوامر وعلى فحص ثنائي عبر
`system.which` أو `system.run`. العقد غير المتصلة **لا** تجعل
Skills البعيدة فقط مرئية. إذا توقفت عقدة متصلة عن الرد على فحوصات
الثنائيات، يمسح OpenClaw مطابقات الثنائيات المخبأة الخاصة بها حتى لا يرى
الوكلاء Skills التي لا يمكن تشغيلها هناك حاليًا.

## أثر الرموز

عندما تكون Skills مؤهلة، يحقن OpenClaw قائمة XML مضغوطة بالـ Skills المتاحة
في موجه النظام (عبر `formatSkillsForPrompt` في `pi-coding-agent`). التكلفة حتمية:

- **الحمل الأساسي** (فقط عند وجود skill واحدة أو أكثر): 195 حرفًا.
- **لكل skill:** 97 حرفًا + طول قيم `<name>` و`<description>` و`<location>` بعد تهريب XML.

الصيغة (بالأحرف):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

يوسّع تهريب XML الأحرف `& < > " '` إلى كيانات (`&amp;`، و`&lt;`، إلخ)،
ما يزيد الطول. تختلف أعداد الرموز حسب محلل الرموز الخاص بالنموذج. تقدير
تقريبي بأسلوب OpenAI هو نحو 4 أحرف/رمز، لذا فإن **97 حرفًا ≈ 24 رمزًا**
لكل skill إضافة إلى أطوال حقولك الفعلية.

## دورة حياة Skills المُدارة

يشحن OpenClaw مجموعة أساسية من Skills على هيئة **Skills مضمّنة** مع
التثبيت (حزمة npm أو OpenClaw.app). يوجد `~/.openclaw/skills`
للتجاوزات المحلية — على سبيل المثال، تثبيت إصدار skill أو ترقيعها دون
تغيير النسخة المضمّنة. Skills الخاصة بمساحة العمل مملوكة للمستخدم وتتجاوز
كليهما عند تعارض الأسماء.

## تبحث عن مزيد من Skills؟

تصفح [https://clawhub.ai](https://clawhub.ai). مخطط الإعدادات الكامل:
[إعدادات Skills](/ar/tools/skills-config).

## ذات صلة

- [ClawHub](/ar/tools/clawhub) — سجل Skills العام
- [إنشاء Skills](/ar/tools/creating-skills) — بناء Skills مخصصة
- [Plugins](/ar/tools/plugin) — نظرة عامة على نظام Plugin
- [Plugin ورشة Skills](/ar/plugins/skill-workshop) — توليد Skills من عمل الوكيل
- [إعدادات Skills](/ar/tools/skills-config) — مرجع إعدادات skill
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) — كل أوامر الشرطة المائلة المتاحة
