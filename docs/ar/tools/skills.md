---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير ضوابط Skills أو قوائم السماح أو قواعد التحميل
    - فهم أسبقية Skills وسلوك اللقطات
sidebarTitle: Skills
summary: 'Skills: المُدارة مقابل مساحة العمل، قواعد البوابات، قوائم السماح للوكلاء، وربط الإعدادات'
title: Skills
x-i18n:
    generated_at: "2026-05-06T08:18:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

يستخدم OpenClaw مجلدات Skills **متوافقة مع [AgentSkills](https://agentskills.io)** لتعليم الوكيل كيفية استخدام الأدوات. كل Skill هو دليل يحتوي على `SKILL.md` مع YAML frontmatter وتعليمات. يحمّل OpenClaw المهارات المضمّنة بالإضافة إلى تجاوزات محلية اختيارية، ويرشحها وقت التحميل استنادًا إلى البيئة، والإعدادات، ووجود الملفات الثنائية.

## المواقع والأسبقية

يحمّل OpenClaw المهارات من هذه المصادر، **الأعلى أسبقية أولًا**:

| #   | المصدر                | المسار                           |
| --- | --------------------- | -------------------------------- |
| 1   | مهارات مساحة العمل    | `<workspace>/skills`             |
| 2   | مهارات وكيل المشروع   | `<workspace>/.agents/skills`     |
| 3   | مهارات الوكيل الشخصية | `~/.agents/skills`               |
| 4   | المهارات المُدارة/المحلية | `~/.openclaw/skills`             |
| 5   | المهارات المضمّنة     | تُشحن مع التثبيت                 |
| 6   | مجلدات مهارات إضافية | `skills.load.extraDirs` (إعداد) |

إذا تعارض اسم مهارة، يفوز المصدر الأعلى.

دليل Codex CLI الأصلي `$CODEX_HOME/skills` ليس واحدًا من جذور مهارات OpenClaw هذه. في وضع حاضنة Codex، تستخدم عمليات تشغيل خادم التطبيق المحلية أدلة Codex رئيسية معزولة لكل وكيل، لذلك لا تُحمّل مهارات Codex CLI الشخصية ضمنيًا. استخدم `openclaw migrate codex --dry-run` لجردها و`openclaw migrate codex` لاختيار أدلة المهارات عبر مطالبة مربعات اختيار تفاعلية قبل نسخها إلى مساحة عمل وكيل OpenClaw الحالية. للتشغيل غير التفاعلي، كرر `--skill <name>` للمهارات الدقيقة المراد نسخها.

## مهارات كل وكيل والمهارات المشتركة

في إعدادات **متعددة الوكلاء**، لكل وكيل مساحة عمل خاصة به:

| النطاق               | المسار                                      | مرئي لـ                       |
| -------------------- | ------------------------------------------- | ----------------------------- |
| لكل وكيل             | `<workspace>/skills`                        | ذلك الوكيل فقط                |
| وكيل المشروع         | `<workspace>/.agents/skills`                | وكيل مساحة العمل تلك فقط      |
| الوكيل الشخصي        | `~/.agents/skills`                          | كل الوكلاء على ذلك الجهاز     |
| مشتركة مُدارة/محلية  | `~/.openclaw/skills`                        | كل الوكلاء على ذلك الجهاز     |
| أدلة إضافية مشتركة   | `skills.load.extraDirs` (الأدنى أسبقية)     | كل الوكلاء على ذلك الجهاز     |

نفس الاسم في أماكن متعددة → يفوز المصدر الأعلى. تتفوق مساحة العمل على وكيل المشروع، ثم الوكيل الشخصي، ثم المُدار/المحلي، ثم المضمّن، ثم الأدلة الإضافية.

## قوائم السماح لمهارات الوكلاء

**موقع** المهارة و**رؤية** المهارة عنصران تحكميان منفصلان. يقرر الموقع/الأسبقية أي نسخة من مهارة تحمل الاسم نفسه تفوز؛ وتقرر قوائم السماح للوكلاء أي مهارات يمكن للوكيل استخدامها فعليًا.

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
    - احذف `agents.defaults.skills` لجعل المهارات غير مقيدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
    - اضبط `agents.list[].skills: []` لعدم إتاحة أي مهارات.
    - قائمة `agents.list[].skills` غير الفارغة هي المجموعة **النهائية** لذلك
      الوكيل - ولا تُدمج مع الافتراضيات.
    - تنطبق قائمة السماح الفعالة عبر بناء المطالبات، واكتشاف أوامر الشرطة
      المائلة للمهارات، ومزامنة sandbox، ولقطات المهارات.
  </Accordion>
</AccordionGroup>

## Plugins والمهارات

يمكن أن تشحن Plugins مهاراتها الخاصة عبر إدراج أدلة `skills` في `openclaw.plugin.json` (المسارات نسبية إلى جذر Plugin). تُحمّل مهارات Plugin عندما يكون Plugin مفعّلًا. هذا هو المكان المناسب لأدلة التشغيل الخاصة بالأدوات التي تكون أطول من وصف الأداة ولكن ينبغي أن تكون متاحة عندما يكون Plugin مثبتًا - على سبيل المثال، يشحن Plugin المتصفح مهارة `browser-automation` للتحكم متعدد الخطوات في المتصفح.

تُدمج أدلة مهارات Plugin في نفس المسار منخفض الأسبقية مثل `skills.load.extraDirs`، لذلك تتجاوزها أي مهارة مضمّنة، أو مُدارة، أو خاصة بوكيل، أو خاصة بمساحة العمل تحمل الاسم نفسه. يمكنك تقييدها عبر `metadata.openclaw.requires.config` في إدخال إعدادات Plugin.

راجع [Plugins](/ar/tools/plugin) للاكتشاف/الإعدادات و[الأدوات](/ar/tools) لسطح الأدوات الذي تعلّمه تلك المهارات.

## Skill Workshop

يمكن لـ Plugin **Skill Workshop** الاختياري والتجريبي إنشاء مهارات مساحة العمل أو تحديثها من إجراءات قابلة لإعادة الاستخدام تمت ملاحظتها أثناء عمل الوكيل. يكون معطلًا افتراضيًا ويجب تفعيله صراحةً عبر `plugins.entries.skill-workshop`.

يكتب Skill Workshop فقط إلى `<workspace>/skills`، ويفحص المحتوى المُنشأ، ويدعم الموافقة المعلقة أو الكتابات الآمنة التلقائية، ويعزل المقترحات غير الآمنة، ويحدّث لقطة المهارات بعد الكتابات الناجحة حتى تصبح المهارات الجديدة متاحة دون إعادة تشغيل Gateway.

استخدمه لتصحيحات مثل _"في المرة القادمة، تحقق من إسناد GIF"_ أو لسير العمل المكتسب بصعوبة مثل قوائم تحقق ضمان جودة الوسائط. ابدأ بالموافقة المعلقة؛ واستخدم الكتابات التلقائية فقط في مساحات العمل الموثوقة بعد مراجعة مقترحاته. الدليل الكامل: [Plugin Skill Workshop](/ar/plugins/skill-workshop).

## ClawHub (التثبيت والمزامنة)

[ClawHub](https://clawhub.ai) هو سجل المهارات العام لـ OpenClaw. استخدم أوامر `openclaw skills` الأصلية للاكتشاف/التثبيت/التحديث، أو CLI المنفصل `clawhub` لسير عمل النشر/المزامنة. الدليل الكامل: [ClawHub](/ar/tools/clawhub).

| الإجراء                            | الأمر                                  |
| ---------------------------------- | -------------------------------------- |
| تثبيت مهارة في مساحة العمل         | `openclaw skills install <skill-slug>` |
| تحديث كل المهارات المثبتة          | `openclaw skills update --all`         |
| المزامنة (فحص + نشر التحديثات)     | `clawhub sync --all`                   |

يثبّت `openclaw skills install` الأصلي في دليل `skills/` لمساحة العمل النشطة. يثبّت CLI المنفصل `clawhub` أيضًا في `./skills` ضمن دليل العمل الحالي (أو يعود إلى مساحة عمل OpenClaw المهيأة). يلتقط OpenClaw ذلك كـ `<workspace>/skills` في الجلسة التالية.
تدعم جذور المهارات المهيأة أيضًا مستوى تجميع واحدًا، مثل `skills/<group>/<skill>/SKILL.md`، بحيث يمكن الاحتفاظ بالمهارات الخارجية ذات الصلة تحت مجلد مشترك دون فحص تكراري واسع.

تعرض صفحات مهارات ClawHub أحدث حالة فحص أمني قبل التثبيت، مع صفحات تفاصيل للماسحات VirusTotal، وClawScan، والتحليل الساكن. يظل `openclaw skills install <slug>` مسار التثبيت فقط؛ ويستعيد الناشرون الإيجابيات الكاذبة من خلال لوحة معلومات ClawHub أو `clawhub skill rescan <slug>`.

## الأمان

<Warning>
تعامل مع مهارات الجهات الخارجية كـ **تعليمات برمجية غير موثوقة**. اقرأها قبل التفعيل.
فضّل التشغيل داخل sandbox للمدخلات غير الموثوقة والأدوات الخطرة. راجع
[Sandboxing](/ar/gateway/sandboxing) لعناصر التحكم من جانب الوكيل.
</Warning>

- لا يقبل اكتشاف مهارات مساحة العمل والأدلة الإضافية إلا جذور المهارات وملفات `SKILL.md` التي يبقى realpath المحلول لها داخل الجذر المهيأ.
- عمليات تثبيت تبعيات المهارات المدعومة من Gateway (`skills.install`، وonboarding، وواجهة إعدادات Skills) تشغّل ماسح التعليمات البرمجية الخطرة المضمّن قبل تنفيذ بيانات التثبيت الوصفية. نتائج `critical` تمنع افتراضيًا ما لم يضبط المستدعي صراحةً تجاوز الخطورة؛ أما النتائج المشبوهة فتظل تحذر فقط.
- يختلف `openclaw skills install <slug>` - فهو يحمّل مجلد مهارة من ClawHub إلى مساحة العمل ولا يستخدم مسار بيانات التثبيت الوصفية أعلاه.
- يحقن `skills.entries.*.env` و`skills.entries.*.apiKey` الأسرار في عملية **المضيف** لتلك دورة الوكيل (وليس sandbox). أبقِ الأسرار خارج المطالبات والسجلات.

لنموذج تهديد أوسع وقوائم تحقق، راجع [الأمان](/ar/gateway/security).

## تنسيق SKILL.md

يجب أن يتضمن `SKILL.md` على الأقل:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

يتبع OpenClaw مواصفة AgentSkills للتخطيط/القصد. يدعم المحلل المستخدم بواسطة الوكيل المضمّن مفاتيح frontmatter **ذات السطر الواحد** فقط؛ ويجب أن تكون `metadata` **كائن JSON في سطر واحد**. استخدم `{baseDir}` في التعليمات للإشارة إلى مسار مجلد المهارة.

### مفاتيح frontmatter اختيارية

<ParamField path="homepage" type="string">
  عنوان URL يظهر كـ "موقع ويب" في واجهة Skills على macOS. مدعوم أيضًا عبر `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  عندما تكون `true`، تُعرض المهارة كأمر شرطة مائلة للمستخدم.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  عندما تكون `true`، يُبقي OpenClaw تعليمات المهارة خارج مطالبة الوكيل العادية.
  تظل المهارة مثبتة ويمكن تشغيلها صراحةً كأمر شرطة مائلة عندما تكون
  `user-invocable` أيضًا `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  عند ضبطها على `tool`، يتجاوز أمر الشرطة المائلة النموذج ويرسله مباشرة إلى أداة.
</ParamField>
<ParamField path="command-tool" type="string">
  اسم الأداة المراد استدعاؤها عند ضبط `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  لإرسال الأداة، يمرر سلسلة الوسيطات الخام إلى الأداة (دون تحليل من core). تُستدعى الأداة باستخدام `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## التقييد (مرشحات وقت التحميل)

يرشح OpenClaw المهارات وقت التحميل باستخدام `metadata` (JSON في سطر واحد):

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
  عندما تكون `true`، أدرج المهارة دائمًا (تخطَّ البوابات الأخرى).
</ParamField>
<ParamField path="emoji" type="string">
  رمز emoji اختياري تستخدمه واجهة Skills على macOS.
</ParamField>
<ParamField path="homepage" type="string">
  عنوان URL اختياري يظهر كـ "موقع ويب" في واجهة Skills على macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  قائمة اختيارية بالمنصات. إذا ضُبطت، تصبح المهارة مؤهلة فقط على أنظمة التشغيل تلك.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  يجب أن يكون كل واحد منها موجودًا في `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  يجب أن يكون واحد على الأقل موجودًا في `PATH`.
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
  مواصفات تثبيت اختيارية تستخدمها واجهة Skills على macOS (brew/node/go/uv/download).
</ParamField>

إذا لم تكن `metadata.openclaw` موجودة، تكون المهارة مؤهلة دائمًا (ما لم تكن معطلة في الإعدادات أو محجوبة بواسطة `skills.allowBundled` للمهارات المضمّنة).

<Note>
لا تزال كتل `metadata.clawdbot` القديمة مقبولة عندما تكون
`metadata.openclaw` غائبة، لذلك تحتفظ المهارات المثبتة الأقدم ببوابات
التبعيات وتلميحات المثبت الخاصة بها. يجب أن تستخدم المهارات الجديدة والمحدثة
`metadata.openclaw`.
</Note>

### ملاحظات Sandboxing

- يتم التحقق من `requires.bins` على **المضيف** وقت تحميل المهارة.
- إذا كان الوكيل داخل sandbox، فيجب أن يكون الملف الثنائي موجودًا أيضًا **داخل الحاوية**. ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` (أو صورة مخصصة). يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية. تتطلب عمليات تثبيت الحزم أيضًا خروجًا شبكيًا، ونظام ملفات جذريًا قابلًا للكتابة، ومستخدم root في sandbox.
- مثال: تحتاج مهارة `summarize` (`skills/summarize/SKILL.md`) إلى CLI باسم `summarize` داخل حاوية sandbox لكي تعمل هناك.

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
    - إذا أُدرجت عدة مثبّتات، يختار Gateway خيارًا مفضّلًا واحدًا (brew عند توفره، وإلا node).
    - إذا كانت كل المثبّتات `download`، يعرض OpenClaw كل إدخال حتى تتمكن من رؤية الحزم المتاحة.
    - يمكن أن تتضمن مواصفات المثبّت `os: ["darwin"|"linux"|"win32"]` لتصفية الخيارات حسب المنصة.
    - تحترم عمليات تثبيت Node الخيار `skills.install.nodeManager` في `openclaw.json` (الافتراضي: npm؛ الخيارات: npm/pnpm/yarn/bun). يؤثر هذا فقط في تثبيت Skills؛ يجب أن يظل وقت تشغيل Gateway على Node - لا يُوصى باستخدام Bun مع WhatsApp/Telegram.
    - اختيار المثبّت المدعوم من Gateway قائم على التفضيلات: عندما تمزج مواصفات التثبيت بين الأنواع، يفضّل OpenClaw Homebrew عندما يكون `skills.install.preferBrew` مفعّلًا ويكون `brew` موجودًا، ثم `uv`، ثم مدير node المكوّن، ثم البدائل الأخرى مثل `go` أو `download`.
    - إذا كانت كل مواصفة تثبيت هي `download`، يعرض OpenClaw كل خيارات التنزيل بدلًا من اختزالها إلى مثبّت مفضّل واحد.

  </Accordion>
  <Accordion title="تفاصيل لكل مثبّت">
    - **عمليات تثبيت Go:** إذا كان `go` مفقودًا وكان `brew` متاحًا، يثبّت Gateway لغة Go عبر Homebrew أولًا ويضبط `GOBIN` إلى مجلد `bin` الخاص بـ Homebrew عندما يكون ذلك ممكنًا.
    - **عمليات تثبيت التنزيل:** `url` (مطلوب)، `archive` (`tar.gz` | `tar.bz2` | `zip`)، `extract` (الافتراضي: تلقائي عند اكتشاف أرشيف)، `stripComponents`، `targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## تجاوزات التهيئة

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
  يعطّل `false` Skill حتى إذا كانت مضمّنة أو مثبّتة.
  تكون Skill المضمّنة `coding-agent` اختيارية التفعيل: اضبط
  `skills.entries.coding-agent.enabled: true` قبل إظهارها للوكلاء،
  ثم تأكد من تثبيت واحد من `claude` أو `codex` أو `opencode` أو `pi`
  ومصادقته في CLI الخاص به.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  وسيلة ملائمة لـ Skills التي تعلن `metadata.openclaw.primaryEnv`. تدعم النص الصريح أو SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  تُحقن فقط إذا لم يكن المتغير مضبوطًا مسبقًا في العملية.
</ParamField>
<ParamField path="config" type="object">
  حاوية اختيارية للحقول المخصصة لكل Skill. يجب أن توجد المفاتيح المخصصة هنا.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  قائمة سماح اختيارية لـ Skills **المضمّنة** فقط. إذا ضُبطت، فلن تكون سوى Skills المضمّنة في القائمة مؤهلة (لا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
</ParamField>

إذا كان اسم Skill يحتوي على واصلات، فضع المفتاح بين علامتي اقتباس (يسمح JSON5
بالمفاتيح المقتبسة). تطابق مفاتيح التهيئة **اسم Skill** افتراضيًا - إذا عرّفت Skill
القيمة `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح ضمن `skills.entries`.

<Note>
لإنشاء/تحرير الصور الجاهزة داخل OpenClaw، استخدم أداة النواة
`image_generate` مع `agents.defaults.imageGenerationModel` بدلًا
من Skill مضمّنة. أمثلة Skills هنا مخصصة لسير عمل مخصص أو تابع لجهة خارجية.
لتحليل الصور الأصلي، استخدم أداة `image` مع
`agents.defaults.imageModel`. إذا اخترت `openai/*` أو `google/*`
أو `fal/*` أو نموذج صور آخر خاصًا بموفّر، فأضف مفتاح المصادقة/API الخاص بذلك الموفّر أيضًا.
</Note>

## حقن البيئة

عند بدء تشغيل وكيل، يقوم OpenClaw بما يلي:

1. يقرأ بيانات Skill الوصفية.
2. يطبق `skills.entries.<key>.env` و`skills.entries.<key>.apiKey` على `process.env`.
3. يبني موجّه النظام باستخدام Skills **المؤهلة**.
4. يستعيد البيئة الأصلية بعد انتهاء التشغيل.

حقن البيئة **مقصور على تشغيل الوكيل**، وليس بيئة صدفة عامة.

بالنسبة إلى الواجهة الخلفية المضمّنة `claude-cli`، يُنشئ OpenClaw أيضًا
اللقطة المؤهلة نفسها كـ Plugin مؤقت لـ Claude Code ويمررها باستخدام
`--plugin-dir`. يمكن لـ Claude Code عندئذ استخدام محلل Skills الأصلي لديه بينما
يظل OpenClaw مالكًا للأسبقية، وقوائم السماح لكل وكيل، والبوابات، وحقن
مفاتيح البيئة/API عبر `skills.entries.*`. تستخدم واجهات CLI الخلفية الأخرى
كتالوج الموجّهات فقط.

## اللقطات والتحديث

يلتقط OpenClaw لقطة لـ Skills المؤهلة **عند بدء جلسة** ويعيد استخدام
تلك القائمة في الجولات اللاحقة ضمن الجلسة نفسها. تسري التغييرات على
Skills أو التهيئة في الجلسة الجديدة التالية.

يمكن تحديث Skills في منتصف الجلسة في حالتين:

- مراقب Skills مفعّل.
- ظهور عقدة بعيدة مؤهلة جديدة.

تعامل مع ذلك بوصفه **إعادة تحميل ساخنة**: تُستخدم القائمة المحدّثة في
جولة الوكيل التالية. إذا تغيّرت قائمة السماح الفعلية لـ Skills الخاصة بالوكيل
لتلك الجلسة، يحدّث OpenClaw اللقطة حتى تبقى Skills المرئية متوافقة
مع الوكيل الحالي.

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
`system.run` (أمان موافقات Exec غير مضبوط على `deny`)،
يمكن لـ OpenClaw التعامل مع Skills الخاصة بـ macOS فقط على أنها مؤهلة عندما تكون
الثنائيات المطلوبة موجودة على تلك العقدة. يجب أن ينفّذ الوكيل تلك Skills
عبر أداة `exec` مع `host=node`.

يعتمد ذلك على إبلاغ العقدة عن دعمها للأوامر وعلى فحص الثنائيات
عبر `system.which` أو `system.run`. لا تجعل العقد غير المتصلة
Skills البعيدة فقط مرئية. إذا توقفت عقدة متصلة عن الرد على فحوصات
الثنائيات، يمسح OpenClaw مطابقات الثنائيات المخزّنة مؤقتًا لديها حتى لا يرى
الوكلاء Skills التي لا يمكن تشغيلها هناك حاليًا.

## أثر الرموز

عندما تكون Skills مؤهلة، يحقن OpenClaw قائمة XML مضغوطة بـ Skills المتاحة
في موجّه النظام (عبر `formatSkillsForPrompt` في
`pi-coding-agent`). التكلفة حتمية:

- **الكلفة الأساسية** (فقط عند وجود Skill واحدة على الأقل): 195 حرفًا.
- **لكل Skill:** 97 حرفًا + طول قيم `<name>` و`<description>` و`<location>` بعد تهريب XML.

الصيغة (بالأحرف):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

يوسّع تهريب XML الرموز `& < > " '` إلى كيانات (`&amp;`، و`&lt;`، وما إلى ذلك)،
مما يزيد الطول. تختلف أعداد الرموز حسب مقسّم الرموز الخاص بالنموذج. تقدير
تقريبي بأسلوب OpenAI هو نحو 4 أحرف/رمز، لذا فإن **97 حرفًا ≈ 24 رمزًا** لكل
Skill إضافة إلى أطوال حقولك الفعلية.

## دورة حياة Skills المُدارة

يشحن OpenClaw مجموعة أساسية من Skills بوصفها **Skills مضمّنة** مع
التثبيت (حزمة npm أو OpenClaw.app). يوجد `~/.openclaw/skills`
للتجاوزات المحلية - على سبيل المثال، تثبيت إصدار Skill أو تصحيحها دون
تغيير النسخة المضمّنة. Skills الخاصة بمساحة العمل مملوكة للمستخدم وتتجاوز
كليهما عند تعارض الأسماء.

## هل تبحث عن مزيد من Skills؟

تصفح [https://clawhub.ai](https://clawhub.ai). مخطط التهيئة الكامل:
[تهيئة Skills](/ar/tools/skills-config).

## ذات صلة

- [ClawHub](/ar/tools/clawhub) - سجل Skills العام
- [إنشاء Skills](/ar/tools/creating-skills) - بناء Skills مخصصة
- [Plugins](/ar/tools/plugin) - نظرة عامة على نظام Plugin
- [Plugin ورشة Skills](/ar/plugins/skill-workshop) - إنشاء Skills من عمل الوكيل
- [تهيئة Skills](/ar/tools/skills-config) - مرجع تهيئة Skill
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) - جميع أوامر الشرطة المائلة المتاحة
