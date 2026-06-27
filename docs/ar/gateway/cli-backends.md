---
read_when:
    - تريد خيارًا احتياطيًا موثوقًا عند فشل مزوّدي API
    - أنت تشغّل واجهات CLI محلية للذكاء الاصطناعي وتريد إعادة استخدامها
    - تريد فهم جسر الاسترجاع الحلقي الخاص بـ MCP للوصول إلى أدوات الواجهة الخلفية لـ CLI
summary: 'واجهات CLI الخلفية: بديل CLI للذكاء الاصطناعي المحلي مع جسر اختياري لأدوات MCP'
title: واجهات CLI الخلفية
x-i18n:
    generated_at: "2026-06-27T17:35:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **واجهات CLI محلية للذكاء الاصطناعي** كـ **مسار احتياطي نصي فقط** عندما تتعطل مزودات API،
أو تخضع لحدود المعدل، أو تتصرف بشكل غير صحيح مؤقتًا. هذا محافظ عمدًا:

- **لا تُحقن أدوات OpenClaw مباشرةً**، لكن الواجهات الخلفية التي تحتوي على `bundleMcp: true`
  يمكنها تلقي أدوات Gateway عبر جسر MCP بنمط loopback.
- **بث JSONL** لواجهات CLI التي تدعمه.
- **الجلسات مدعومة** (لذلك تبقى الأدوار اللاحقة مترابطة).
- **يمكن تمرير الصور عبره** إذا كانت CLI تقبل مسارات الصور.

صُمم هذا كـ **شبكة أمان** لا كمسار أساسي. استخدمه عندما تريد
استجابات نصية "تعمل دائمًا" من دون الاعتماد على واجهات API خارجية.

إذا أردت وقت تشغيل كاملًا للحزمة مع عناصر تحكم جلسات ACP، والمهام الخلفية،
وربط الخيط/المحادثة، وجلسات ترميز خارجية مستمرة، فاستخدم
[وكلاء ACP](/ar/tools/acp-agents) بدلًا من ذلك. الواجهات الخلفية لـ CLI ليست ACP.

<Tip>
  هل تبني Plugin واجهة خلفية جديدًا لـ CLI؟ استخدم
  [Plugins الواجهات الخلفية لـ CLI](/ar/plugins/cli-backend-plugins). هذه الصفحة مخصصة للمستخدمين
  الذين يكوّنون ويشغّلون واجهة خلفية مسجلة مسبقًا.
</Tip>

## بداية سريعة مناسبة للمبتدئين

يمكنك استخدام Claude Code CLI **من دون أي إعدادات** (يسجل Plugin Anthropic المضمن
واجهة خلفية افتراضية):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` هو معرّف الوكيل الافتراضي عندما لا تكون هناك قائمة وكلاء صريحة مكوّنة. إذا
كنت تستخدم عدة وكلاء، فاستبدله بمعرّف الوكيل الذي تريد تشغيله.

إذا كان Gateway يعمل تحت launchd/systemd وكان PATH محدودًا، فأضف مسار
الأمر فقط:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

هذا كل شيء. لا مفاتيح، ولا إعدادات مصادقة إضافية مطلوبة بخلاف CLI نفسها.

إذا كنت تستخدم واجهة خلفية CLI مضمنة باعتبارها **مزود الرسائل الأساسي** على
مضيف Gateway، فإن OpenClaw يحمّل الآن تلقائيًا Plugin المضمنة المالكة عندما يشير إعدادك
صراحةً إلى تلك الواجهة الخلفية في مرجع نموذج أو ضمن
`agents.defaults.cliBackends`.

## استخدامه كمسار احتياطي

أضف واجهة خلفية CLI إلى قائمة المسارات الاحتياطية بحيث لا تعمل إلا عند فشل النماذج الأساسية:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

ملاحظات:

- إذا كنت تستخدم `agents.defaults.models` (قائمة سماح)، فيجب عليك تضمين نماذج واجهة CLI الخلفية هناك أيضًا.
- إذا فشل المزود الأساسي (المصادقة، حدود المعدل، المهلات)، فسيحاول OpenClaw
  استخدام واجهة CLI الخلفية بعد ذلك.

## نظرة عامة على الإعداد

توجد كل الواجهات الخلفية لـ CLI ضمن:

```
agents.defaults.cliBackends
```

يُفهرس كل إدخال بواسطة **معرّف مزود** (مثل `claude-cli`، `my-cli`).
يصبح معرّف المزود الجانب الأيسر من مرجع النموذج لديك:

```
<provider>/<model>
```

### مثال إعداد

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## كيف يعمل

1. **يختار واجهة خلفية** بناءً على بادئة المزود (`claude-cli/...`).
2. **يبني موجه نظام** باستخدام موجه OpenClaw نفسه + سياق مساحة العمل.
3. **ينفّذ CLI** مع معرّف جلسة (إذا كان مدعومًا) لكي يبقى التاريخ متسقًا.
   تحافظ واجهة `claude-cli` الخلفية المضمنة على عملية Claude stdio حية لكل
   جلسة OpenClaw وترسل الأدوار اللاحقة عبر stream-json stdin.
4. **يحلل الإخراج** (JSON أو نص عادي) ويعيد النص النهائي.
5. **يحفظ معرّفات الجلسات** لكل واجهة خلفية، بحيث تعيد الأدوار اللاحقة استخدام جلسة CLI نفسها.

<Note>
واجهة Anthropic `claude-cli` الخلفية المضمنة مدعومة مجددًا. أخبرنا موظفو Anthropic
أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع
استخدام `claude -p` على أنه معتمد لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تفضّل واجهة Anthropic `claude-cli` الخلفية المضمنة محلل Skills الأصلي في Claude Code
لـ Skills الخاصة بـ OpenClaw. عندما تتضمن لقطة Skills الحالية Skill محددة واحدة على الأقل
بمسار مُجسّد، يمرر OpenClaw Plugin مؤقتة لـ Claude
Code باستخدام `--plugin-dir` ويحذف كتالوج Skills المكرر الخاص بـ OpenClaw
من موجه النظام الملحق. إذا لم تتضمن اللقطة Plugin
Skill مُجسّدة، يحتفظ OpenClaw بكتالوج الموجه كمسار احتياطي. لا تزال تجاوزات
بيئة/API مفاتيح Skill تُطبق بواسطة OpenClaw على بيئة العملية الفرعية أثناء
التشغيل.

يمتلك Claude CLI أيضًا وضع أذونات غير تفاعليًا خاصًا به. يربط OpenClaw ذلك
بسياسة التنفيذ الحالية بدلًا من إضافة إعداد سياسة خاص بـ Claude.
بالنسبة إلى جلسات Claude الحية التي يديرها OpenClaw، تكون سياسة تنفيذ OpenClaw الفعالة
هي المرجع الحاسم: YOLO (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`) يشغّل Claude باستخدام
`--permission-mode bypassPermissions`، بينما سياسة التنفيذ الفعالة المقيّدة
تشغّل Claude باستخدام `--permission-mode default`. إعدادات
`agents.list[].tools.exec` الخاصة بكل وكيل تتجاوز `tools.exec` العامة لذلك
الوكيل. قد تبقى وسائط واجهة Claude الخلفية الخام متضمنة `--permission-mode`، لكن عمليات تشغيل
Claude الحية تطبّع ذلك العلم لمطابقة سياسة تنفيذ OpenClaw الفعالة.

تربط واجهة Anthropic `claude-cli` الخلفية المضمنة أيضًا مستويات OpenClaw `/think`
بعلم Claude Code الأصلي `--effort` للمستويات غير المتوقفة. يتم ربط `minimal` و
`low` بـ `low`، و`adaptive` و`medium` بـ `medium`، و`high`،
و`xhigh`، و`max` تُربط مباشرةً. تحتاج واجهات CLI الخلفية الأخرى إلى أن
تعلن Plugin المالكة لها مخطط ربط argv مكافئًا قبل أن يتمكن `/think` من التأثير في CLI المُشغّلة.

قبل أن يتمكن OpenClaw من استخدام واجهة `claude-cli` الخلفية المضمنة، يجب أن يكون Claude Code نفسه
مسجل الدخول مسبقًا على المضيف نفسه:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

تحتاج تثبيتات Docker إلى تثبيت Claude Code وتسجيل الدخول إليه داخل
منزل الحاوية المستمر، وليس على المضيف فقط. راجع
[واجهة Claude CLI الخلفية في Docker](/ar/install/docker#claude-cli-backend-in-docker).

استخدم `agents.defaults.cliBackends.claude-cli.command` فقط عندما لا يكون ثنائي `claude`
موجودًا مسبقًا على `PATH`.

## الجلسات

- إذا كانت CLI تدعم الجلسات، فعيّن `sessionArg` (مثل `--session-id`) أو
  `sessionArgs` (العنصر النائب `{sessionId}`) عندما يلزم إدراج المعرّف
  في عدة أعلام.
- إذا كانت CLI تستخدم **أمرًا فرعيًا للاستئناف** مع أعلام مختلفة، فعيّن
  `resumeArgs` (تستبدل `args` عند الاستئناف) واختياريًا `resumeOutput`
  (للاستئنافات غير JSON).
- `sessionMode`:
  - `always`: أرسل دائمًا معرّف جلسة (UUID جديد إذا لم يكن مخزنًا).
  - `existing`: أرسل معرّف جلسة فقط إذا كان مخزنًا من قبل.
  - `none`: لا ترسل معرّف جلسة أبدًا.
- الإعدادات الافتراضية لـ `claude-cli` هي `liveSession: "claude-stdio"`، و`output: "jsonl"`،
  و`input: "stdin"` بحيث تعيد الأدوار اللاحقة استخدام عملية Claude الحية طالما
  أنها نشطة. أصبح stdio الدافئ هو الافتراضي الآن، بما في ذلك للإعدادات المخصصة
  التي تحذف حقول النقل. إذا أعيد تشغيل Gateway أو خرجت العملية الخاملة،
  يستأنف OpenClaw من معرّف جلسة Claude المخزن. تُتحقق معرّفات الجلسات
  المخزنة مقابل نص مشروع قائم وقابل للقراءة قبل
  الاستئناف، لذلك تُمسح الارتباطات الوهمية مع `reason=transcript-missing`
  بدلًا من بدء جلسة Claude CLI جديدة بصمت تحت `--resume`.
- تحتفظ جلسات Claude الحية بحراس إخراج JSONL محدودة. تسمح الإعدادات الافتراضية بما يصل إلى
  8 MiB و20,000 سطر JSONL خام لكل دور. يمكن للأدوار كثيفة الأدوات في Claude رفعها
  لكل واجهة خلفية باستخدام
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و`maxTurnLines`؛ ويقيد OpenClaw هذه الإعدادات إلى 64 MiB و100,000
  سطر.
- جلسات CLI المخزنة هي استمرارية يملكها المزود. لا يقطعها إعادة تعيين الجلسة
  اليومية الضمنية؛ أما `/reset` وسياسات `session.reset` الصريحة فلا تزال
  تفعل ذلك.
- عادةً لا تعيد جلسات CLI الجديدة البذر إلا من ملخص Compaction الخاص بـ OpenClaw
  إضافةً إلى الذيل التالي لـ Compaction. لاستعادة الجلسات القصيرة التي تُبطل
  قبل Compaction، يمكن للواجهة الخلفية الاشتراك باستخدام
  `reseedFromRawTranscriptWhenUncompacted: true`. لا يزال OpenClaw يبقي إعادة بذر
  النص الخام محدودة ويقصرها على الإبطالات الآمنة مثل غياب
  نصوص CLI، أو تغييرات موجه النظام/MCP، أو إعادة محاولة انتهاء الجلسة؛ أما تغييرات
  ملف تعريف المصادقة أو حقبة بيانات الاعتماد فلا تعيد أبدًا بذر تاريخ النص الخام.

ملاحظات التسلسل:

- `serialize: true` يبقي عمليات التشغيل في المسار نفسه مرتبة.
- معظم واجهات CLI تسلسل على مسار مزود واحد.
- يسقط OpenClaw إعادة استخدام جلسة CLI المخزنة عندما تتغير هوية المصادقة المحددة،
  بما في ذلك تغيير معرّف ملف تعريف المصادقة، أو مفتاح API ثابت، أو رمز ثابت، أو هوية
  حساب OAuth عندما تعرض CLI واحدة. لا يقطع تدوير رموز وصول OAuth وتحديثها
  جلسة CLI المخزنة. إذا لم تعرض CLI معرّف حساب OAuth ثابتًا،
  يترك OpenClaw لتلك CLI فرض أذونات الاستئناف.

## تمهيد احتياطي من جلسات claude-cli

عندما تفشل محاولة `claude-cli` وتنتقل إلى مرشح غير CLI في
[`agents.defaults.model.fallbacks`](/ar/concepts/model-failover)، يبذر OpenClaw
المحاولة التالية بتمهيد سياق مستخلص من نص JSONL المحلي الخاص بـ Claude Code
في `~/.claude/projects/`. من دون هذا البذر، سيبدأ المزود الاحتياطي
بلا سياق لأن نص جلسة OpenClaw نفسه فارغ
لتشغيلات `claude-cli`.

- يفضّل التمهيد أحدث ملخص `/compact` أو علامة `compact_boundary`،
  ثم يضيف أحدث الأدوار التالية للحد حتى ميزانية أحرف
  معينة. تُسقط الأدوار السابقة للحد لأن الملخص يمثلها بالفعل.
- تُدمج كتل الأدوات في تلميحات مضغوطة `(tool call: name)` و
  `(tool result: …)` للحفاظ على صدق ميزانية الموجه. يُوسم الملخص
  بـ `(truncated)` إذا تجاوز الحد.
- تعتمد المسارات الاحتياطية من `claude-cli` إلى `claude-cli` على المزود نفسه على
  `--resume` الخاص بـ Claude وتتخطى التمهيد.
- يعيد البذر استخدام تحقق مسار ملف جلسة Claude الحالي، لذلك
  لا يمكن قراءة مسارات عشوائية.

## الصور (تمرير عبره)

إذا كانت CLI لديك تقبل مسارات الصور، فعيّن `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيكتب OpenClaw الصور المرمزة بـ base64 إلى ملفات مؤقتة. إذا عُيّن `imageArg`، فستُمرر تلك
المسارات كوسائط CLI. إذا كان `imageArg` غائبًا، يلحق OpenClaw
مسارات الملفات بالموجه (حقن المسار)، وهذا كافٍ لواجهات CLI التي تحمّل تلقائيًا
الملفات المحلية من المسارات العادية.

## المدخلات / المخرجات

- `output: "json"` (الافتراضي) يحاول تحليل JSON واستخراج النص + معرّف الجلسة.
- بالنسبة إلى إخراج Gemini CLI بصيغة JSON، يقرأ OpenClaw نص الرد من `response` والاستخدام
  من `stats` عندما يكون `usage` غائبًا أو فارغًا. يستخدم الافتراضي المضمن لـ Gemini CLI
  `stream-json`، لكن تجاوزات `--output-format json` القديمة لا تزال تستخدم
  محلل JSON.
- `output: "jsonl"` يحلل تدفقات JSONL ويستخرج رسالة الوكيل النهائية ومعرّفات
  الجلسة عند وجودها.
- `output: "text"` يعامل stdout على أنه الاستجابة النهائية.

أوضاع الإدخال:

- يمرّر `input: "arg"` (الافتراضي) الموجّه كآخر وسيطة CLI.
- يرسل `input: "stdin"` الموجّه عبر stdin.
- إذا كان الموجّه طويلاً جداً وكان `maxPromptArgChars` مضبوطاً، يُستخدم stdin.

## القيم الافتراضية (مملوكة للـ Plugin)

توجد القيم الافتراضية لواجهات CLI الخلفية المضمّنة مع الـ Plugin المالكة لها. على سبيل المثال،
تملك Anthropic `claude-cli` وتملك Google `google-gemini-cli`. تستخدم تشغيلات وكيل OpenAI Codex
حزمة خادم تطبيق Codex عبر `openai/*`؛ لم يعد OpenClaw
يسجّل واجهة خلفية مضمّنة باسم `codex-cli`.

يسجّل Plugin Anthropic المضمّن قيمة افتراضية لـ `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

يسجّل Plugin Google المضمّن أيضاً قيمة افتراضية لـ `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

المتطلب المسبق: يجب تثبيت Gemini CLI المحلي وأن يكون متاحاً باسم
`gemini` على `PATH` (`brew install gemini-cli` أو
`npm install -g @google/gemini-cli`).

ملاحظات خرج Gemini CLI:

- يقرأ محلّل `stream-json` الافتراضي أحداث `message` الخاصة بالمساعد، وأحداث الأدوات،
  واستخدام `result` النهائي، وأحداث أخطاء Gemini الفادحة.
- إذا تجاوزت وسيطات Gemini إلى `--output-format json`، يطبّع OpenClaw تلك
  الواجهة الخلفية مرة أخرى إلى `output: "json"` ويقرأ نص الرد من حقل JSON `response`.
- يعود الاستخدام إلى `stats` عندما يكون `usage` غائباً أو فارغاً.
- يُطبّع `stats.cached` إلى `cacheRead` في OpenClaw.
- إذا كان `stats.input` مفقوداً، يستنتج OpenClaw رموز الإدخال من
  `stats.input_tokens - stats.cached`.

لا تتجاوزه إلا عند الحاجة (الشائع: مسار `command` مطلق).

## القيم الافتراضية المملوكة للـ Plugin

أصبحت القيم الافتراضية لواجهات CLI الخلفية الآن جزءاً من سطح الـ Plugin:

- تسجّلها Plugins باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالواجهة الخلفية بادئة المزوّد في مراجع النماذج.
- ما زال إعداد المستخدم في `agents.defaults.cliBackends.<id>` يتجاوز القيمة الافتراضية للـ Plugin.
- يبقى تنظيف الإعداد الخاص بالواجهة الخلفية مملوكاً للـ Plugin عبر خطاف
  `normalizeConfig` الاختياري.

يمكن لـ Plugins التي تحتاج إلى حشوات توافق صغيرة للموجّه/الرسالة أن تعلن
تحويلات نص ثنائية الاتجاه من دون استبدال مزوّد أو واجهة CLI خلفية:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

يعيد `input` كتابة موجّه النظام وموجّه المستخدم الممرّرين إلى CLI. يعيد `output`
كتابة فروق المساعد المتدفقة والنص النهائي المحلّل قبل أن يتعامل OpenClaw
مع علامات التحكم الخاصة به وتسليم القناة.

بالنسبة إلى واجهات CLI التي تصدر أحداث JSONL خاصة بالمزوّد، اضبط `jsonlDialect` في إعداد
تلك الواجهة الخلفية. اللهجات المدعومة هي `claude-stream-json` للتدفقات
المتوافقة مع Claude Code و`gemini-stream-json` لأحداث Gemini CLI `stream-json`.

## ملكية Compaction الأصلية

تشغّل بعض واجهات CLI الخلفية وكيلاً يضغط نصه **الخاص**، لذلك يجب على OpenClaw
ألا يشغّل ملخّص الحماية الخاص به عليها - ففعل ذلك يعارض Compaction الخاصة بالواجهة الخلفية
وقد يفشل الدور بالكامل.

لا يملك `claude-cli` نقطة نهاية حزمة - يضغط Claude Code داخلياً - لذلك يعلن
`ownsNativeCompaction: true`، ويعيد OpenClaw عملية بلا أثر من مسار Compaction.
أما جلسات الحزم الأصلية مثل Codex فتواصل التوجيه إلى نقطة نهاية Compaction الخاصة بحزمتها
بدلاً من ذلك.

بما أن الواجهة الخلفية تملك Compaction، فإن الحل المؤقت القديم القائم على ضبط
`contextTokens: 1_000_000` فقط لمنع حماية OpenClaw من التشغيل على جلسة
claude-cli **لم يعد مطلوباً** - إذ يحل خيار الانسحاب محله.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

لا تعلن `ownsNativeCompaction` إلا لواجهة خلفية تملك Compaction الخاصة بها فعلاً: يجب أن
تحد نصها بموثوقية عند اقترابه من نافذة السياق وأن تحفظ جلسة قابلة للاستئناف
(مثل `--resume` / `--session-id`)؛ وإلا فقد تبقى جلسة مؤجلة فوق الميزانية.
ما زالت جلسات `agentHarnessId` المطابقة تتجه إلى نقطة نهاية الحزمة.

## تراكبات MCP للحزمة

لا تتلقى واجهات CLI الخلفية استدعاءات أدوات OpenClaw مباشرة، لكن يمكن لواجهة خلفية
الاشتراك في تراكب إعداد MCP مولّد باستخدام `bundleMcp: true`.

السلوك المضمّن الحالي:

- `claude-cli`: ملف إعداد MCP صارم مولّد
- `google-gemini-cli`: ملف إعدادات نظام Gemini مولّد

عند تمكين MCP للحزمة، يقوم OpenClaw بما يلي:

- يشغّل خادم MCP عبر HTTP loopback يعرّض أدوات Gateway لعملية CLI
- يصادق على الجسر برمز مميز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يقيّد الوصول إلى الأدوات بسياق الجلسة والحساب والقناة الحالية
- يحمّل خوادم bundle-MCP الممكّنة لمساحة العمل الحالية
- يدمجها مع أي شكل إعداد/إعدادات MCP موجود للواجهة الخلفية
- يعيد كتابة إعداد التشغيل باستخدام وضع التكامل المملوك للواجهة الخلفية من الإضافة المالكة

إذا لم تكن أي خوادم MCP ممكّنة، يظل OpenClaw يحقن إعداداً صارماً عندما
تشترك واجهة خلفية في MCP للحزمة حتى تبقى التشغيلات الخلفية معزولة.

تُخزّن أوقات تشغيل MCP المضمّنة والمقيّدة بالجلسة مؤقتاً لإعادة استخدامها داخل جلسة، ثم
تُزال بعد `mcp.sessionIdleTtlMs` ميلي ثانية من وقت الخمول (الافتراضي 10
دقائق؛ اضبط `0` للتعطيل). تطلب التشغيلات المضمّنة لمرة واحدة مثل مجسات المصادقة،
وتوليد slug، واستدعاء active-memory التنظيف عند نهاية التشغيل حتى لا
تبقى عمليات stdio الفرعية وتدفقات Streamable HTTP/SSE أطول من التشغيل.

## حد إعادة تغذية السجل

عند تغذية جلسة CLI جديدة من نص OpenClaw سابق (على
سبيل المثال بعد إعادة محاولة `session_expired`)، يُحدّ حجم كتلة
`<conversation_history>` المعروضة لمنع موجّهات إعادة التغذية من
التضخم. الافتراضي هو `12288` حرفاً (نحو 3000 رمز).

تستخدم واجهات Claude CLI الخلفية تلقائياً حداً أكبر مشتقاً من طبقة سياق
Claude المحلولة. تحتفظ تشغيلات Claude القياسية ذات 200 ألف رمز بشريحة نص
أكبر، وتحتفظ تشغيلات Claude ذات مليون رمز بشريحة أكبر أيضاً، بينما تحتفظ واجهات CLI
الخلفية الأخرى بالافتراضي المحافظ.

- لا يتحكم الحد إلا في كتلة السجل السابق في موجّه إعادة التغذية. تُضبط حدود
  خرج الجلسات الحية بشكل منفصل ضمن `reliability.outputLimits`
  (راجع [الجلسات](#sessions)).

## القيود

- **لا توجد استدعاءات مباشرة لأدوات OpenClaw.** لا يحقن OpenClaw استدعاءات أدوات في
  بروتوكول واجهة CLI الخلفية. لا ترى الواجهات الخلفية أدوات Gateway إلا عند اشتراكها في
  `bundleMcp: true`.
- **البث خاص بالواجهة الخلفية.** تبث بعض الواجهات الخلفية JSONL؛ بينما تخزّن أخرى
  إلى حين الخروج.
- **المخرجات المنظمة** تعتمد على تنسيق JSON الخاص بـ CLI.

## استكشاف الأخطاء وإصلاحها

- **CLI غير موجود**: اضبط `command` على مسار كامل.
- **اسم النموذج خاطئ**: استخدم `modelAliases` لربط `provider/model` → نموذج CLI.
- **لا توجد استمرارية للجلسة**: تأكد من ضبط `sessionArg` وأن `sessionMode` ليس
  `none`.
- **يتم تجاهل الصور**: اضبط `imageArg` (وتحقق من أن CLI يدعم مسارات الملفات).

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [النماذج المحلية](/ar/gateway/local-models)
