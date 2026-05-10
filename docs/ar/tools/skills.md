---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير قيود المهارات، أو قوائم السماح، أو قواعد التحميل
    - فهم أسبقية Skills وسلوك اللقطات
sidebarTitle: Skills
summary: 'Skills: المُدارة مقابل مساحة العمل، قواعد التقييد، قوائم السماح للوكلاء، وربط الإعدادات'
title: Skills
x-i18n:
    generated_at: "2026-05-10T20:05:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw يستخدم مجلدات مهارات **متوافقة مع [AgentSkills](https://agentskills.io)** لتعليم الوكيل كيفية استخدام الأدوات. كل مهارة هي دليل يحتوي على `SKILL.md` مع مقدمة YAML وتعليمات. يحمّل OpenClaw المهارات المضمّنة إضافةً إلى التجاوزات المحلية الاختيارية، ويرشّحها وقت التحميل بناءً على البيئة، والإعدادات، ووجود الملفات الثنائية.

## المواقع والأولوية

يحمّل OpenClaw المهارات من هذه المصادر، **بأعلى أولوية أولًا**:

| #   | المصدر                | المسار                           |
| --- | --------------------- | -------------------------------- |
| 1   | مهارات مساحة العمل    | `<workspace>/skills`             |
| 2   | مهارات وكيل المشروع   | `<workspace>/.agents/skills`     |
| 3   | مهارات الوكيل الشخصية | `~/.agents/skills`               |
| 4   | مهارات مُدارة/محلية   | `~/.openclaw/skills`             |
| 5   | المهارات المضمّنة     | مرفقة مع التثبيت                 |
| 6   | مجلدات مهارات إضافية  | `skills.load.extraDirs` (الإعدادات) |

إذا تعارض اسم مهارة، يفوز المصدر الأعلى.

دليل Codex CLI الأصلي `$CODEX_HOME/skills` ليس واحدًا من جذور مهارات OpenClaw هذه. في وضع مشغّل Codex، تستخدم عمليات تشغيل خادم التطبيق المحلية أدلة Codex رئيسية معزولة لكل وكيل، لذلك لا تُحمّل مهارات Codex CLI الشخصية ضمنيًا. استخدم `openclaw migrate codex --dry-run` لجردها و`openclaw migrate codex` لاختيار أدلة المهارات عبر مطالبة مربعات اختيار تفاعلية قبل نسخها إلى مساحة عمل وكيل OpenClaw الحالية. للتشغيل غير التفاعلي، كرّر `--skill <name>` لكل مهارة محددة تريد نسخها.

## مهارات لكل وكيل مقابل المهارات المشتركة

في إعدادات **تعدد الوكلاء** تكون لكل وكيل مساحة عمل خاصة به:

| النطاق              | المسار                                      | مرئي لـ                         |
| ------------------- | ------------------------------------------- | ------------------------------- |
| لكل وكيل            | `<workspace>/skills`                        | ذلك الوكيل فقط                  |
| وكيل المشروع        | `<workspace>/.agents/skills`                | وكيل مساحة العمل تلك فقط        |
| الوكيل الشخصي       | `~/.agents/skills`                          | كل الوكلاء على ذلك الجهاز       |
| مشتركة مُدارة/محلية | `~/.openclaw/skills`                        | كل الوكلاء على ذلك الجهاز       |
| أدلة إضافية مشتركة  | `skills.load.extraDirs` (الأولوية الأدنى)   | كل الوكلاء على ذلك الجهاز       |

نفس الاسم في أماكن متعددة → يفوز المصدر الأعلى. مساحة العمل تتغلب على وكيل المشروع، ويتغلب على الوكيل الشخصي، ويتغلب على المُدار/المحلي، ويتغلب على المضمّن، ويتغلب على الأدلة الإضافية.

## قوائم السماح لمهارات الوكيل

**موقع** المهارة و**رؤية** المهارة عنصران منفصلان للتحكم. يقرر الموقع/الأولوية أي نسخة من مهارة لها الاسم نفسه تفوز؛ وتقرر قوائم سماح الوكيل أي مهارات يمكن للوكيل استخدامها فعليًا.

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
    - احذف `agents.defaults.skills` لجعل المهارات غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
    - اضبط `agents.list[].skills: []` لعدم إتاحة أي مهارات.
    - قائمة `agents.list[].skills` غير الفارغة هي المجموعة **النهائية** لذلك الوكيل - ولا تُدمج مع الافتراضيات.
    - تنطبق قائمة السماح الفعالة عبر بناء المطالبات، واكتشاف أوامر الشرطة المائلة للمهارات، ومزامنة صندوق العزل، ولقطات المهارات.

  </Accordion>
</AccordionGroup>

## Plugins والمهارات

يمكن أن تشحن Plugins مهاراتها الخاصة عبر إدراج أدلة `skills` في `openclaw.plugin.json` (المسارات نسبية إلى جذر Plugin). تُحمّل مهارات Plugin عند تمكين Plugin. هذا هو المكان المناسب لأدلة التشغيل الخاصة بالأدوات التي تكون أطول من وصف الأداة ولكن ينبغي أن تكون متاحة كلما كان Plugin مثبتًا - مثلًا، يشحن Plugin المتصفح مهارة `browser-automation` للتحكم متعدد الخطوات في المتصفح.

تُدمج أدلة مهارات Plugin في المسار نفسه منخفض الأولوية مثل `skills.load.extraDirs`، لذلك تتجاوزها مهارة مضمّنة أو مُدارة أو تابعة لوكيل أو لمساحة عمل تحمل الاسم نفسه. يمكنك حجبها عبر `metadata.openclaw.requires.config` في إدخال إعدادات Plugin.

راجع [Plugins](/ar/tools/plugin) للاكتشاف/الإعدادات و[الأدوات](/ar/tools) لسطح الأدوات الذي تعلّمه تلك المهارات.

## Skill Workshop

يمكن لـ Plugin الاختياري والتجريبي **Skill Workshop** إنشاء مهارات مساحة العمل أو تحديثها من إجراءات قابلة لإعادة الاستخدام لوحظت أثناء عمل الوكيل. يكون معطلًا افتراضيًا ويجب تمكينه صراحةً عبر `plugins.entries.skill-workshop`.

يكتب Skill Workshop فقط إلى `<workspace>/skills`، ويفحص المحتوى المُنشأ، ويدعم الموافقة المعلقة أو الكتابات الآمنة التلقائية، ويعزل المقترحات غير الآمنة، ويحدّث لقطة المهارات بعد الكتابات الناجحة حتى تصبح المهارات الجديدة متاحة دون إعادة تشغيل Gateway.

استخدمه للتصحيحات مثل _"في المرة القادمة، تحقق من نسب GIF"_ أو لسير العمل المكتسب بصعوبة مثل قوائم تحقق ضمان جودة الوسائط. ابدأ بالموافقة المعلقة؛ واستخدم الكتابات التلقائية فقط في مساحات العمل الموثوقة بعد مراجعة مقترحاته. الدليل الكامل: [Plugin Skill Workshop](/ar/plugins/skill-workshop).

## ClawHub (التثبيت والمزامنة)

[ClawHub](https://clawhub.ai) هو سجل المهارات العام لـ OpenClaw. استخدم أوامر `openclaw skills` الأصلية للاكتشاف/التثبيت/التحديث، أو CLI المنفصل `clawhub` لسير عمل النشر/المزامنة. الدليل الكامل: [ClawHub](/ar/clawhub).

| الإجراء                          | الأمر                                  |
| -------------------------------- | -------------------------------------- |
| تثبيت مهارة في مساحة العمل       | `openclaw skills install <skill-slug>` |
| تحديث كل المهارات المثبتة        | `openclaw skills update --all`         |
| المزامنة (الفحص + نشر التحديثات) | `clawhub sync --all`                   |

يثبّت `openclaw skills install` الأصلي في دليل `skills/` داخل مساحة العمل النشطة. كما يثبّت CLI المنفصل `clawhub` في `./skills` ضمن دليل العمل الحالي لديك (أو يعود إلى مساحة عمل OpenClaw المُعدة). يلتقط OpenClaw ذلك كـ `<workspace>/skills` في الجلسة التالية.
تدعم جذور المهارات المُعدة أيضًا مستوى تجميع واحدًا، مثل `skills/<group>/<skill>/SKILL.md`، حتى يمكن إبقاء المهارات الخارجية ذات الصلة تحت مجلد مشترك دون فحص تكراري واسع.

يمكن لعملاء Gateway الذين يحتاجون إلى تسليم خاص وغير تابع لـ ClawHub تجهيز أرشيف مهارة بصيغة zip عبر `skills.upload.begin` و`skills.upload.chunk` و`skills.upload.commit`، ثم تثبيت الرفع الملتزم به عبر `skills.install({ source: "upload", uploadId, slug, force?, sha256? })`. هذا مسار رفع إداري صريح للعملاء الموثوقين، وليس مسار `openclaw skills install <slug>` المعتاد أو تدفق تثبيت ClawHub. يكون معطلًا افتراضيًا ولا يعمل إلا عند ضبط `skills.install.allowUploadedArchives: true` في `openclaw.json`. يظل وضع الرفع يثبّت في دليل مساحة عمل الوكيل الافتراضية `skills/<slug>`؛ ويُتجاهل اسم المجلد الداخلي للأرشيف عند تحديد هدف التثبيت النهائي.

تعرض صفحات مهارات ClawHub أحدث حالة فحص أمني قبل التثبيت، مع صفحات تفاصيل للماسحات VirusTotal وClawScan والتحليل الثابت. يبقى `openclaw skills install <slug>` مسار التثبيت فقط؛ ويسترد الناشرون الإيجابيات الكاذبة عبر لوحة ClawHub أو `clawhub skill rescan <slug>`.

## الأمان

<Warning>
تعامل مع المهارات الخارجية كـ **تعليمات برمجية غير موثوقة**. اقرأها قبل تمكينها. فضّل التشغيل داخل صندوق عزل للمدخلات غير الموثوقة والأدوات عالية المخاطر. راجع [العزل](/ar/gateway/sandboxing) لعناصر التحكم من جانب الوكيل.
</Warning>

- لا يقبل اكتشاف مهارات مساحة العمل والأدلة الإضافية إلا جذور المهارات وملفات `SKILL.md` التي يبقى مسارها الحقيقي المحلول داخل الجذر المُعد.
- تكون تثبيتات الأرشيف الخاص عبر Gateway معطلة افتراضيًا. عند تمكينها صراحةً، تتطلب رفع zip ملتزمًا به يحتوي على `SKILL.md` وتعيد استخدام وسائل الحماية نفسها لاستخراج الأرشيف، واجتياز المسارات، والروابط الرمزية، والفرض، والتراجع مثل تثبيتات مهارات ClawHub. وهي محكومة بـ `skills.install.allowUploadedArchives`؛ أما تثبيتات ClawHub العادية فلا تتطلب ذلك الإعداد.
- تشغّل تثبيتات تبعيات المهارات المدعومة من Gateway (`skills.install`، والإعداد الأولي، وواجهة إعدادات Skills) ماسح التعليمات البرمجية الخطرة المضمّن قبل تنفيذ بيانات تعريف المثبّت. تحظر نتائج `critical` افتراضيًا ما لم يضبط المستدعي صراحةً تجاوز الخطر؛ أما النتائج المريبة فتظل تحذيرية فقط.
- يختلف `openclaw skills install <slug>` - فهو ينزّل مجلد مهارة ClawHub إلى مساحة العمل ولا يستخدم مسار بيانات تعريف المثبّت أعلاه.
- يحقن `skills.entries.*.env` و`skills.entries.*.apiKey` الأسرار في عملية **المضيف** لدورة ذلك الوكيل (وليس في صندوق العزل). أبقِ الأسرار خارج المطالبات والسجلات.

لنموذج تهديد وقوائم تحقق أوسع، راجع [الأمان](/ar/gateway/security).

## تنسيق SKILL.md

يجب أن يتضمن `SKILL.md` على الأقل:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

يتبع OpenClaw مواصفة AgentSkills للتخطيط/القصد. يدعم المحلل المستخدم بواسطة الوكيل المضمّن مفاتيح مقدمة **ذات سطر واحد** فقط؛ وينبغي أن تكون `metadata` **كائن JSON في سطر واحد**. استخدم `{baseDir}` في التعليمات للإشارة إلى مسار مجلد المهارة.

### مفاتيح المقدمة الاختيارية

<ParamField path="homepage" type="string">
  عنوان URL يظهر باسم "موقع الويب" في واجهة Skills على macOS. مدعوم أيضًا عبر `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  عندما تكون `true`، تُعرض المهارة كأمر شرطة مائلة للمستخدم.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  عندما تكون `true`، يُبقي OpenClaw تعليمات المهارة خارج المطالبة العادية للوكيل. تظل المهارة مثبتة ويمكن تشغيلها صراحةً كأمر شرطة مائلة عندما تكون `user-invocable` أيضًا `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  عند ضبطه على `tool`، يتجاوز أمر الشرطة المائلة النموذج ويرسل مباشرةً إلى أداة.
</ParamField>
<ParamField path="command-tool" type="string">
  اسم الأداة المطلوب استدعاؤها عند ضبط `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  لإرسال الأداة، يمرر سلسلة الوسائط الخام إلى الأداة (دون تحليل من النواة). تُستدعى الأداة باستخدام `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## التقييد (مرشحات وقت التحميل)

يرشّح OpenClaw المهارات وقت التحميل باستخدام `metadata` (JSON في سطر واحد):

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
  عند `true`، أدرج Skills دائمًا (وتجاوز البوابات الأخرى).
</ParamField>
<ParamField path="emoji" type="string">
  رمز تعبيري اختياري تستخدمه واجهة Skills في macOS.
</ParamField>
<ParamField path="homepage" type="string">
  عنوان URL اختياري يظهر باسم "موقع الويب" في واجهة Skills في macOS.
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
  يجب أن يوجد متغير البيئة أو أن يُقدَّم في التكوين.
</ParamField>
<ParamField path="requires.config" type="string[]">
  قائمة بمسارات `openclaw.json` التي يجب أن تكون truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  اسم متغير البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  مواصفات تثبيت اختيارية تستخدمها واجهة Skills في macOS (brew/node/go/uv/download).
</ParamField>

إذا لم تكن `metadata.openclaw` موجودة، تكون Skill مؤهلة دائمًا (ما لم
تُعطَّل في التكوين أو تمنعها `skills.allowBundled` بالنسبة إلى Skills المضمّنة).

<Note>
ما زالت كتل `metadata.clawdbot` القديمة مقبولة عندما تكون
`metadata.openclaw` غير موجودة، لكي تحتفظ Skills الأقدم المثبتة
ببوابات الاعتمادية وتلميحات التثبيت. يجب أن تستخدم Skills الجديدة والمحدّثة
`metadata.openclaw`.
</Note>

### ملاحظات العزل

- يُتحقّق من `requires.bins` على **المضيف** وقت تحميل Skill.
- إذا كان الوكيل معزولًا، فيجب أن يوجد الملف الثنائي أيضًا **داخل الحاوية**. ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` (أو صورة مخصّصة). يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية. تتطلب عمليات تثبيت الحزم أيضًا خروجًا إلى الشبكة، ونظام ملفات جذر قابلًا للكتابة، ومستخدم جذر في العزل.
- مثال: تحتاج Skill `summarize` (`skills/summarize/SKILL.md`) إلى CLI `summarize` داخل حاوية العزل لكي تعمل هناك.

### مواصفات التثبيت

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
    - إذا أُدرجت مثبّتات متعددة، يختار Gateway خيارًا مفضّلًا واحدًا (brew عند توفره، وإلا node).
    - إذا كانت كل المثبّتات `download`، يسرد OpenClaw كل إدخال لكي ترى التحف المتاحة.
    - يمكن أن تتضمن مواصفات التثبيت `os: ["darwin"|"linux"|"win32"]` لتصفية الخيارات حسب المنصة.
    - تحترم عمليات تثبيت Node قيمة `skills.install.nodeManager` في `openclaw.json` (الافتراضي: npm؛ الخيارات: npm/pnpm/yarn/bun). يؤثر هذا فقط في عمليات تثبيت Skills؛ يجب أن يظل وقت تشغيل Gateway على Node - لا يُنصح باستخدام Bun مع WhatsApp/Telegram.
    - اختيار المثبّت المدعوم من Gateway قائم على التفضيلات: عندما تمزج مواصفات التثبيت أنواعًا مختلفة، يفضّل OpenClaw Homebrew عندما تكون `skills.install.preferBrew` مفعّلة ويكون `brew` موجودًا، ثم `uv`، ثم مدير node المكوَّن، ثم البدائل الأخرى مثل `go` أو `download`.
    - إذا كانت كل مواصفات التثبيت `download`، يعرض OpenClaw كل خيارات التنزيل بدل اختزالها إلى مثبّت مفضّل واحد.

  </Accordion>
  <Accordion title="تفاصيل كل مثبّت">
    - **عمليات تثبيت Go:** إذا كان `go` مفقودًا وكان `brew` متاحًا، يثبّت Gateway ‏Go عبر Homebrew أولًا ويضبط `GOBIN` إلى `bin` الخاص بـ Homebrew عندما يكون ذلك ممكنًا.
    - **عمليات تثبيت التنزيل:** `url` (مطلوب)، `archive` (`tar.gz` | `tar.bz2` | `zip`)، `extract` (الافتراضي: تلقائي عند اكتشاف أرشيف)، `stripComponents`، `targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## تجاوزات التكوين

يمكن تفعيل Skills المضمّنة والمُدارة أو تعطيلها وتزويدها بقيم بيئة
تحت `skills.entries` في `~/.openclaw/openclaw.json`:

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
  يعطّل `false` الـ Skill حتى لو كانت مضمّنة أو مثبتة.
  Skill المضمّنة `coding-agent` اختيارية التفعيل: اضبط
  `skills.entries.coding-agent.enabled: true` قبل إتاحتها للوكلاء،
  ثم تأكد من تثبيت أحد `claude` أو `codex` أو `opencode` أو `pi`
  ومصادقته من أجل CLI الخاص به.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  تسهيل لـ Skills التي تعلن `metadata.openclaw.primaryEnv`. يدعم النص الصريح أو SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  يُحقن فقط إذا لم يكن المتغير مضبوطًا مسبقًا في العملية.
</ParamField>
<ParamField path="config" type="object">
  حافظة اختيارية للحقول المخصّصة لكل Skill. يجب أن تكون المفاتيح المخصّصة هنا.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  قائمة سماح اختيارية لـ Skills **المضمّنة** فقط. إذا ضُبطت، تكون Skills المضمّنة الموجودة في القائمة وحدها مؤهلة (لا تتأثر Skills المُدارة أو الخاصة بمساحة العمل).
</ParamField>

إذا كان اسم Skill يحتوي على واصلات، فضع المفتاح بين علامات اقتباس (يسمح JSON5
بالمفاتيح المقتبسة). تطابق مفاتيح التكوين **اسم Skill** افتراضيًا - إذا كانت Skill
تعرّف `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح تحت `skills.entries`.

<Note>
لتوليد/تحرير صور المخزون داخل OpenClaw، استخدم أداة
`image_generate` الأساسية مع `agents.defaults.imageGenerationModel` بدلًا
من Skill مضمّنة. أمثلة Skills هنا مخصّصة لسير عمل مخصّص أو تابع لجهة خارجية.
لتحليل الصور الأصلي استخدم أداة `image` مع
`agents.defaults.imageModel`. إذا اخترت `openai/*` أو `google/*`
أو `fal/*` أو نموذج صور آخر خاصًا بمزوّد، فأضف أيضًا مفتاح المصادقة/API
الخاص بذلك المزوّد.
</Note>

## حقن البيئة

عند بدء تشغيل وكيل، يقوم OpenClaw بما يلي:

1. يقرأ بيانات Skill الوصفية.
2. يطبّق `skills.entries.<key>.env` و`skills.entries.<key>.apiKey` على `process.env`.
3. يبني موجّه النظام باستخدام Skills **المؤهلة**.
4. يستعيد البيئة الأصلية بعد انتهاء التشغيل.

حقن البيئة **محدّد بنطاق تشغيل الوكيل**، وليس بيئة shell عامة.

بالنسبة إلى الواجهة الخلفية المضمّنة `claude-cli`، يجسّد OpenClaw أيضًا
نفس اللقطة المؤهلة كـ Plugin مؤقت لـ Claude Code ويمررها باستخدام
`--plugin-dir`. يمكن لـ Claude Code بعد ذلك استخدام محلّل Skills الأصلي الخاص به بينما
يظل OpenClaw مالكًا للأسبقية، وقوائم السماح لكل وكيل، والبوابات،
وحقن مفاتيح البيئة/API عبر `skills.entries.*`. تستخدم الواجهات الخلفية الأخرى لـ CLI
كتالوج الموجّهات فقط.

## اللقطات والتحديث

يلتقط OpenClaw لقطة لـ Skills المؤهلة **عند بدء الجلسة** ويعيد
استخدام تلك القائمة في الأدوار اللاحقة داخل الجلسة نفسها. تسري التغييرات على
Skills أو التكوين في الجلسة الجديدة التالية.

يمكن تحديث Skills في منتصف الجلسة في حالتين:

- مراقب Skills مفعّل.
- تظهر عقدة بعيدة مؤهلة جديدة.

تعامل مع هذا على أنه **إعادة تحميل ساخنة**: تُلتقط القائمة المحدّثة في
دور الوكيل التالي. إذا تغيّرت قائمة السماح الفعلية لـ Skills الخاصة بالوكيل
في تلك الجلسة، يحدّث OpenClaw اللقطة لكي تبقى Skills المرئية متوافقة
مع الوكيل الحالي.

### مراقب Skills

افتراضيًا، يراقب OpenClaw مجلدات Skills ويرفع إصدار لقطة Skills
عندما تتغير ملفات `SKILL.md`. اضبط ذلك تحت `skills.load`:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

استخدم `allowSymlinkTargets` لتخطيطات المستودعات الشقيقة المقصودة حيث يحتوي جذر
Skill مضمّنة على رابط رمزي، مثل
`~/.agents/skills/manager -> ~/Projects/manager/skills`. تتم مطابقة قائمة الأهداف
بعد حل realpath ويجب أن تبقى ضيقة.

### عقد macOS البعيدة (Gateway على Linux)

إذا كان Gateway يعمل على Linux لكن **عقدة macOS** متصلة مع السماح بـ
`system.run` (أمان موافقات Exec غير مضبوط على `deny`)،
يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما تكون
الملفات الثنائية المطلوبة موجودة على تلك العقدة. يجب أن ينفّذ الوكيل Skills تلك
عبر أداة `exec` مع `host=node`.

يعتمد ذلك على إبلاغ العقدة عن دعمها للأوامر وعلى فحص ملف ثنائي
عبر `system.which` أو `system.run`. لا تجعل العقد غير المتصلة
Skills البعيدة فقط مرئية. إذا توقفت عقدة متصلة عن الاستجابة لفحوص الملفات
الثنائية، يمسح OpenClaw مطابقات الملفات الثنائية المخزنة مؤقتًا الخاصة بها لكي لا يرى الوكلاء
Skills لا يمكن تشغيلها حاليًا هناك.

## أثر الرموز

عندما تكون Skills مؤهلة، يحقن OpenClaw قائمة XML مضغوطة بـ Skills المتاحة
في موجّه النظام (عبر `formatSkillsForPrompt` في
`pi-coding-agent`). التكلفة حتمية:

- **الحمل الأساسي** (فقط عند وجود Skill واحدة أو أكثر): 195 حرفًا.
- **لكل Skill:** 97 حرفًا + طول قيم `<name>` و`<description>` و`<location>` بعد تهريب XML.

الصيغة (بالأحرف):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

يوسّع تهريب XML الأحرف `& < > " '` إلى كيانات (`&amp;`، `&lt;`، إلخ)،
ما يزيد الطول. تختلف أعداد الرموز حسب tokenizer النموذج. تقدير تقريبي
بأسلوب OpenAI هو نحو 4 أحرف/رمز، لذلك **97 حرفًا ≈ 24 رمزًا** لكل
Skill إضافةً إلى أطوال الحقول الفعلية لديك.

## دورة حياة Skills المُدارة

يشحن OpenClaw مجموعة أساسية من Skills كـ **Skills مضمّنة** مع
التثبيت (حزمة npm أو OpenClaw.app). يوجد `~/.openclaw/skills`
للتجاوزات المحلية - مثل تثبيت إصدار Skill أو ترقيعها دون
تغيير النسخة المضمّنة. Skills الخاصة بمساحة العمل مملوكة للمستخدم وتتجاوز
كلتيهما عند تعارض الأسماء.

## هل تبحث عن المزيد من Skills؟

تصفّح [https://clawhub.ai](https://clawhub.ai). مخطط التكوين الكامل:
[تكوين Skills](/ar/tools/skills-config).

## ذات صلة

- [ClawHub](/ar/clawhub) - سجل Skills العام
- [إنشاء Skills](/ar/tools/creating-skills) - بناء Skills مخصّصة
- [Plugins](/ar/tools/plugin) - نظرة عامة على نظام Plugin
- [Plugin ورشة Skills](/ar/plugins/skill-workshop) - توليد Skills من عمل الوكيل
- [تكوين Skills](/ar/tools/skills-config) - مرجع تكوين Skill
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) - كل أوامر الشرطة المائلة المتاحة
