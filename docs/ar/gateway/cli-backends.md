---
read_when:
    - تريد خيارًا احتياطيًا موثوقًا عندما يفشل مزوّدو واجهات API
    - أنت تشغّل CLI للذكاء الاصطناعي محليًا وتريد إعادة استخدامها
    - تريد فهم جسر MCP ‏local loopback للوصول إلى أدوات واجهة CLI الخلفية
summary: 'واجهات CLI الخلفية: احتياطي CLI للذكاء الاصطناعي المحلي مع جسر أدوات MCP اختياري'
title: واجهات CLI الخلفية
x-i18n:
    generated_at: "2026-07-01T08:06:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **واجهات AI CLI محلية** بوصفها **خطة احتياطية نصية فقط** عندما تتعطل مزودات API،
أو تخضع لحدود المعدل، أو تتصرف بشكل غير سليم مؤقتا. هذا محافظ عمدا:

- **لا يتم حقن أدوات OpenClaw مباشرة**، لكن الخلفيات التي تحتوي على `bundleMcp: true`
  يمكنها تلقي أدوات Gateway عبر جسر MCP من خلال local loopback.
- **بث JSONL** لواجهات CLI التي تدعمه.
- **الجلسات مدعومة** (بحيث تبقى المتابعات مترابطة).
- **يمكن تمرير الصور** إذا كانت CLI تقبل مسارات الصور.

صمم هذا بوصفه **شبكة أمان** لا مسارا أساسيا. استخدمه عندما تريد
استجابات نصية "تعمل دائما" من دون الاعتماد على واجهات API خارجية.

إذا كنت تريد وقت تشغيل كامل للحاضنة مع عناصر تحكم جلسات ACP، ومهام خلفية،
وربط الخيط/المحادثة، وجلسات ترميز خارجية مستمرة، فاستخدم
[وكلاء ACP](/ar/tools/acp-agents) بدلا من ذلك. خلفيات CLI ليست ACP.

<Tip>
  هل تبني Plugin خلفية جديدا؟ استخدم
  [Plugins خلفيات CLI](/ar/plugins/cli-backend-plugins). هذه الصفحة مخصصة للمستخدمين
  الذين يهيئون ويشغلون خلفية مسجلة مسبقا.
</Tip>

## بداية سريعة مناسبة للمبتدئين

يمكنك استخدام Claude Code CLI **من دون أي إعدادات** (يسجل Plugin Anthropic المضمن
خلفية افتراضية):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` هو معرف الوكيل الافتراضي عندما لا تكون هناك قائمة وكلاء صريحة مهيأة. إذا
كنت تستخدم عدة وكلاء، فاستبدله بمعرف الوكيل الذي تريد تشغيله.

إذا كان Gateway يعمل عبر launchd/systemd وكان PATH محدودا، فأضف مسار
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

هذا كل شيء. لا مفاتيح، ولا إعدادات مصادقة إضافية مطلوبة خارج CLI نفسها.

إذا كنت تستخدم خلفية CLI مضمنة بوصفها **مزود الرسائل الأساسي** على مضيف
Gateway، فإن OpenClaw يحمل الآن تلقائيا Plugin المضمن المالك عندما تشير إعداداتك
صراحة إلى تلك الخلفية في مرجع نموذج أو ضمن
`agents.defaults.cliBackends`.

## استخدامها كخطة احتياطية

أضف خلفية CLI إلى قائمة الاحتياط لديك بحيث لا تعمل إلا عند فشل النماذج الأساسية:

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

- إذا كنت تستخدم `agents.defaults.models` (قائمة سماح)، فيجب أن تدرج نماذج خلفية CLI لديك هناك أيضا.
- إذا فشل المزود الأساسي (المصادقة، حدود المعدل، انتهاء المهلة)، فسيحاول OpenClaw
  استخدام خلفية CLI بعدها.

## نظرة عامة على الإعدادات

توجد كل خلفيات CLI ضمن:

```
agents.defaults.cliBackends
```

كل إدخال مفهرس بواسطة **معرف مزود** (مثلا `claude-cli`، `my-cli`).
يصبح معرف المزود الجانب الأيسر من مرجع النموذج لديك:

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

## كيف تعمل

1. **تحدد خلفية** بناء على بادئة المزود (`claude-cli/...`).
2. **تبني مطالبة نظام** باستخدام مطالبة OpenClaw نفسها + سياق مساحة العمل.
3. **تنفذ CLI** مع معرف جلسة (إذا كان مدعوما) بحيث يبقى السجل متسقا.
   تحافظ خلفية `claude-cli` المضمنة على عملية Claude stdio حية لكل
   جلسة OpenClaw وترسل المتابعات عبر stdin بتنسيق stream-json.
4. **تحلل الخرج** (JSON أو نص عادي) وتعيد النص النهائي.
5. **تستمر في حفظ معرفات الجلسات** لكل خلفية، بحيث تعيد المتابعات استخدام جلسة CLI نفسها.

<Note>
خلفية Anthropic `claude-cli` المضمنة مدعومة مجددا. أخبرنا موظفو Anthropic
أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددا، لذلك يتعامل OpenClaw مع
استخدام `claude -p` على أنه مصرح به لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تفضل خلفية Anthropic `claude-cli` المضمنة محلل Skills الأصلي في Claude Code
لمهارات OpenClaw. عندما تتضمن لقطة Skills الحالية مهارة محددة واحدة على الأقل
ذات مسار مجسد، يمرر OpenClaw Plugin مؤقتا لـ Claude
Code مع `--plugin-dir` ويحذف كتالوج Skills المكرر الخاص بـ OpenClaw
من مطالبة النظام الملحقة. إذا لم تحتو اللقطة على مهارة Plugin مجسدة،
يبقي OpenClaw كتالوج المطالبة كاحتياطي. لا تزال تجاوزات بيئة المهارات/مفاتيح API
تطبق بواسطة OpenClaw على بيئة العملية الفرعية للتشغيل.

لدى Claude CLI أيضا وضع أذونات غير تفاعلي خاص بها. يربط OpenClaw ذلك
بسياسة التنفيذ الحالية بدلا من إضافة إعداد سياسة خاص بـ Claude.
بالنسبة إلى جلسات Claude الحية التي يديرها OpenClaw، تكون سياسة تنفيذ OpenClaw الفعلية
هي المرجع: YOLO (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`) يشغل Claude مع
`--permission-mode bypassPermissions`، بينما سياسة التنفيذ الفعلية المقيدة
تشغل Claude مع `--permission-mode default`. تتجاوز إعدادات
`agents.list[].tools.exec` لكل وكيل إعدادات `tools.exec` العامة لذلك
الوكيل. قد لا تزال وسائط خلفية Claude الخام تتضمن `--permission-mode`، لكن تشغيلات
Claude الحية تطبع ذلك العلم ليطابق سياسة تنفيذ OpenClaw الفعلية.

تربط خلفية Anthropic `claude-cli` المضمنة أيضا مستويات OpenClaw `/think`
بعلم Claude Code الأصلي `--effort` للمستويات غير المعطلة. يتم ربط `minimal` و
`low` إلى `low`، و`adaptive` و`medium` إلى `medium`، و`high`،
و`xhigh`، و`max` مباشرة. تحتاج خلفيات CLI الأخرى إلى أن يعلن Plugin المالك لها
عن مخطط argv مكافئ قبل أن يستطيع `/think` التأثير في CLI التي يتم تشغيلها.

قبل أن يتمكن OpenClaw من استخدام خلفية `claude-cli` المضمنة، يجب أن يكون Claude Code نفسه
مسجلا دخوله مسبقا على المضيف نفسه:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

تحتاج تثبيتات Docker إلى تثبيت Claude Code وتسجيل الدخول إليه داخل
موطن الحاوية المستمر، لا على المضيف فقط. راجع
[خلفية Claude CLI في Docker](/ar/install/docker#claude-cli-backend-in-docker).

استخدم `agents.defaults.cliBackends.claude-cli.command` فقط عندما لا يكون ملف `claude`
الثنائي موجودا بالفعل في `PATH`.

## الجلسات

- إذا كانت CLI تدعم الجلسات، فاضبط `sessionArg` (مثلا `--session-id`) أو
  `sessionArgs` (العنصر النائب `{sessionId}`) عندما يلزم إدراج المعرف
  في عدة أعلام.
- إذا كانت CLI تستخدم **أمرا فرعيا للاستئناف** مع أعلام مختلفة، فاضبط
  `resumeArgs` (يستبدل `args` عند الاستئناف) واختياريا `resumeOutput`
  (للاستئنافات غير JSON).
- `sessionMode`:
  - `always`: أرسل دائما معرف جلسة (UUID جديد إذا لم يكن هناك معرف مخزن).
  - `existing`: أرسل معرف جلسة فقط إذا كان قد خزن سابقا.
  - `none`: لا ترسل معرف جلسة أبدا.
- يعتمد `claude-cli` افتراضيا على `liveSession: "claude-stdio"`، و`output: "jsonl"`،
  و`input: "stdin"` بحيث تعيد المتابعات استخدام عملية Claude الحية أثناء
  نشاطها. أصبح stdio الدافئ هو الافتراضي الآن، بما في ذلك للإعدادات المخصصة
  التي تحذف حقول النقل. إذا أعيد تشغيل Gateway أو خرجت العملية الخاملة،
  يستأنف OpenClaw من معرف جلسة Claude المخزن. يتم التحقق من معرفات الجلسات
  المخزنة مقابل نص مشروع موجود وقابل للقراءة قبل الاستئناف، بحيث تمحى
  الارتباطات الوهمية مع `reason=transcript-missing`
  بدلا من بدء جلسة Claude CLI جديدة بصمت ضمن `--resume`.
- تحتفظ جلسات Claude الحية بحراس خرج JSONL محدودين. تسمح الافتراضات بما يصل إلى
  8 MiB و20,000 سطر JSONL خام لكل دورة. يمكن لدورات Claude كثيفة الأدوات رفعها
  لكل خلفية باستخدام
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و`maxTurnLines`؛ يقيد OpenClaw هذه الإعدادات عند 64 MiB و100,000
  سطر.
- جلسات CLI المخزنة هي استمرارية مملوكة للمزود. لا يقطعها إعادة تعيين الجلسة
  اليومية الضمنية؛ لكن `/reset` وسياسات `session.reset` الصريحة ما زالت
  تفعل ذلك.
- تعيد جلسات CLI الجديدة عادة البذر فقط من ملخص Compaction الخاص بـ OpenClaw
  إضافة إلى الذيل اللاحق لـ Compaction. لاستعادة الجلسات القصيرة التي تبطل
  قبل Compaction، يمكن للخلفية الاشتراك باستخدام
  `reseedFromRawTranscriptWhenUncompacted: true`. يظل OpenClaw يحد إعادة بذر
  النص الخام ويقصرها على الإبطالات الآمنة مثل نصوص CLI المفقودة،
  أو تغييرات مطالبة النظام/MCP، أو إعادة المحاولة بعد انتهاء الجلسة؛ ولا تؤدي
  تغييرات ملف تعريف المصادقة أو حقبة بيانات الاعتماد أبدا إلى إعادة بذر سجل النص الخام.

ملاحظات التسلسل:

- يحافظ `serialize: true` على ترتيب التشغيلات في المسار نفسه.
- تسلسل معظم واجهات CLI على مسار مزود واحد.
- يتخلى OpenClaw عن إعادة استخدام جلسة CLI المخزنة عندما تتغير هوية المصادقة المحددة،
  بما في ذلك تغير معرف ملف تعريف المصادقة، أو مفتاح API ثابت، أو رمز ثابت، أو هوية
  حساب OAuth عندما تكشف CLI عن واحدة. لا يقطع تدوير رموز وصول وتجديد OAuth
  جلسة CLI المخزنة. إذا لم تكشف CLI عن معرف حساب OAuth ثابت،
  يترك OpenClaw لتلك CLI فرض أذونات الاستئناف.

## تمهيد الاحتياط من جلسات claude-cli

عندما تفشل محاولة `claude-cli` وتنتقل إلى مرشح غير CLI في
[`agents.defaults.model.fallbacks`](/ar/concepts/model-failover)، يزود OpenClaw
المحاولة التالية بتمهيد سياق مستخرج من نص JSONL المحلي الخاص بـ Claude Code
في `~/.claude/projects/`. من دون هذه البذرة، سيبدأ المزود الاحتياطي
باردا لأن نص جلسة OpenClaw نفسه فارغ لتشغيلات `claude-cli`.

- يفضل التمهيد أحدث ملخص `/compact` أو علامة `compact_boundary`،
  ثم يلحق أحدث الدورات اللاحقة للحد حتى ميزانية أحرف محددة. تسقط الدورات
  السابقة للحد لأن الملخص يمثلها بالفعل.
- تدمج كتل الأدوات إلى تلميحات مختصرة `(tool call: name)` و
  `(tool result: …)` لإبقاء ميزانية المطالبة دقيقة. يوسم الملخص
  بـ `(truncated)` إذا تجاوز الحد.
- تعتمد انتقالات الاحتياط من `claude-cli` إلى `claude-cli` للمزود نفسه على
  `--resume` الخاصة بـ Claude وتتجاوز التمهيد.
- تعيد البذرة استخدام التحقق الحالي من مسار ملف جلسة Claude، لذلك
  لا يمكن قراءة مسارات عشوائية.

## الصور (تمرير مباشر)

إذا كانت CLI لديك تقبل مسارات الصور، فاضبط `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيكتب OpenClaw صور base64 إلى ملفات مؤقتة. إذا تم ضبط `imageArg`، فتمرر تلك
المسارات كوسائط CLI. إذا كان `imageArg` مفقودا، يلحق OpenClaw
مسارات الملفات بالمطالبة (حقن المسار)، وهذا كاف لواجهات CLI التي تحمل تلقائيا
الملفات المحلية من المسارات العادية.

## المدخلات / المخرجات

- يحاول `output: "json"` (الافتراضي) تحليل JSON واستخراج النص + معرف الجلسة.
- بالنسبة إلى خرج Gemini CLI بتنسيق JSON، يقرأ OpenClaw نص الرد من `response` والاستخدام
  من `stats` عندما يكون `usage` مفقودا أو فارغا. يستخدم الافتراضي المضمن لـ Gemini CLI
  `stream-json`، لكن تجاوزات `--output-format json` القديمة لا تزال تستخدم
  محلل JSON.
- يحلل `output: "jsonl"` تدفقات JSONL ويستخرج رسالة الوكيل النهائية إضافة إلى معرفات
  الجلسة عند وجودها.
- يعامل `output: "text"` stdout بوصفه الاستجابة النهائية.

أوضاع الإدخال:

- يمرّر `input: "arg"` (الافتراضي) المطالبة كآخر وسيطة CLI.
- يرسل `input: "stdin"` المطالبة عبر stdin.
- إذا كانت المطالبة طويلة جدًا وكان `maxPromptArgChars` مضبوطًا، فسيُستخدم stdin.

## الافتراضيات (مملوكة للـ Plugin)

توجد افتراضيات خلفية CLI المضمّنة مع الـ Plugin المالكة لها. على سبيل المثال،
تملك Anthropic ‏`claude-cli` وتملك Google ‏`google-gemini-cli`. تستخدم تشغيلات وكيل OpenAI Codex
حزام تطبيق الخادم الخاص بـ Codex عبر `openai/*`؛ ولم يعد OpenClaw
يسجّل خلفية `codex-cli` مضمّنة.

يسجّل Plugin ‏Anthropic المضمّن افتراضيًا لـ `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

يسجّل Plugin ‏Google المضمّن أيضًا افتراضيًا لـ `google-gemini-cli`:

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

المتطلب السابق: يجب تثبيت Gemini CLI المحلي وإتاحته باسم
`gemini` على `PATH` (`brew install gemini-cli` أو
`npm install -g @google/gemini-cli`).

ملاحظات مخرجات Gemini CLI:

- يقرأ محلّل `stream-json` الافتراضي أحداث `message` الخاصة بالمساعد، وأحداث الأدوات،
  واستخدام `result` النهائي، وأحداث أخطاء Gemini القاتلة.
- إذا تجاوزت وسيطات Gemini إلى `--output-format json`، فإن OpenClaw يطبّع تلك
  الخلفية مرة أخرى إلى `output: "json"` ويقرأ نص الرد من حقل `response`
  في JSON.
- يعود الاستخدام إلى `stats` عندما تكون `usage` غائبة أو فارغة.
- يتم تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.
- إذا كان `stats.input` مفقودًا، يستنتج OpenClaw رموز الإدخال من
  `stats.input_tokens - stats.cached`.

لا تتجاوز إلا عند الحاجة (الشائع: مسار `command` مطلق).

## الافتراضيات المملوكة للـ Plugin

أصبحت افتراضيات خلفية CLI الآن جزءًا من سطح الـ Plugin:

- تسجّلها Plugins باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالخلفية بادئة المزوّد في مراجع النماذج.
- لا يزال إعداد المستخدم في `agents.defaults.cliBackends.<id>` يتجاوز افتراضي الـ Plugin.
- يبقى تنظيف الإعدادات الخاصة بالخلفية مملوكًا للـ Plugin عبر خطاف
  `normalizeConfig` الاختياري.

يمكن للـ Plugins التي تحتاج إلى طبقات توافق صغيرة للمطالبة/الرسالة أن تعلن
تحويلات نصية ثنائية الاتجاه من دون استبدال مزوّد أو خلفية CLI:

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

يعيد `input` كتابة مطالبة النظام ومطالبة المستخدم الممرّرتين إلى CLI. ويعيد `output`
كتابة نص المساعد المتدفّق والنص النهائي المحلّل قبل أن يتعامل OpenClaw مع
علامات التحكم الخاصة به وتسليم القناة. بالنسبة إلى استدعاءات النماذج المدعومة بالمزوّد،
يعيد `output` أيضًا القيم النصية داخل وسيطات استدعاء الأدوات المنظّمة بعد
إصلاح التدفق وقبل تنفيذ الأداة. تبقى أجزاء JSON الخام الخاصة بالمزوّد
بلا تغيير؛ يجب أن يستخدم المستهلكون حمولة الجزء الجزئي المنظّم أو النهاية أو النتيجة.

بالنسبة إلى أدوات CLI التي تصدر أحداث JSONL خاصة بالمزوّد، اضبط `jsonlDialect` في
إعداد تلك الخلفية. اللهجات المدعومة هي `claude-stream-json` للتدفقات المتوافقة مع Claude
Code و`gemini-stream-json` لأحداث `stream-json` الخاصة بـ Gemini CLI.

## ملكية Compaction الأصلية

تشغّل بعض خلفيات CLI وكيلًا يضغط نصه **الخاص**، لذلك يجب ألا يشغّل OpenClaw
ملخّص الحماية الخاص به عليها - فذلك يعارض Compaction الخاص بالخلفية نفسها
وقد يؤدي إلى فشل صارم في الدور.

لا يملك `claude-cli` نقطة نهاية للحزام - يضغط Claude Code داخليًا - لذلك يعلن
`ownsNativeCompaction: true`، ويعيد OpenClaw عملية بلا أثر من مسار Compaction.
أما جلسات الحزام الأصلية مثل Codex فتستمر في التوجيه إلى نقطة نهاية Compaction الخاصة بحزامها.

لأن الخلفية تملك Compaction، فإن الحل المؤقت القديم بضبط
`contextTokens: 1_000_000` لمجرد منع حماية OpenClaw من العمل على جلسة
claude-cli **لم يعد مطلوبًا** - إذ يحلّ الاستثناء محله.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

لا تعلن `ownsNativeCompaction` إلا لخلفية تملك Compaction الخاص بها فعليًا: يجب أن
تحدّ بثبات نصها الخاص عند اقترابه من نافذة السياق وأن تحفظ جلسة قابلة للاستئناف
(مثل `--resume` / `--session-id`)؛ وإلا قد تبقى الجلسة المؤجلة فوق الميزانية.
لا تزال جلسات `agentHarnessId` المطابقة تُوجّه إلى نقطة نهاية الحزام.

## تراكبات MCP للحزمة

لا تتلقى خلفيات CLI استدعاءات أدوات OpenClaw مباشرة، لكن يمكن للخلفية
اختيار تراكب إعداد MCP مولّد باستخدام `bundleMcp: true`.

السلوك المضمّن الحالي:

- `claude-cli`: ملف إعداد MCP صارم مولّد
- `google-gemini-cli`: ملف إعدادات نظام Gemini مولّد

عند تمكين حزمة MCP، يقوم OpenClaw بما يلي:

- يشغّل خادم MCP عبر HTTP loopback يكشف أدوات Gateway لعملية CLI
- يصادق الجسر برمز مميز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يقيّد الوصول إلى الأدوات بسياق الجلسة والحساب والقناة الحالي
- يحمّل خوادم bundle-MCP الممكّنة لمساحة العمل الحالية
- يدمجها مع أي شكل إعدادات/تكوين MCP موجود للخلفية
- يعيد كتابة إعداد الإطلاق باستخدام وضع التكامل المملوك للخلفية من الامتداد المالك

إذا لم تكن أي خوادم MCP ممكّنة، يظل OpenClaw يحقن إعدادًا صارمًا عندما تختار
خلفية حزمة MCP بحيث تبقى التشغيلات الخلفية معزولة.

تُخزّن أوقات تشغيل MCP المضمّنة والمحددة بالجلسة مؤقتًا لإعادة استخدامها داخل الجلسة، ثم
تُزال بعد `mcp.sessionIdleTtlMs` ميلي ثانية من الخمول (الافتراضي 10
دقائق؛ اضبط `0` للتعطيل). تطلب التشغيلات المضمّنة أحادية الاستخدام مثل اختبارات المصادقة،
وتوليد slug، واسترجاع active-memory التنظيف عند نهاية التشغيل بحيث لا تعيش
عمليات stdio الفرعية وتدفقات Streamable HTTP/SSE أطول من التشغيل.

## حد إعادة زرع السجل

عندما تُزرع جلسة CLI جديدة من نص OpenClaw سابق (على سبيل المثال بعد إعادة محاولة
`session_expired`)، يتم تقييد كتلة
`<conversation_history>` المعروضة لمنع مطالبات إعادة الزرع من
التضخم. الافتراضي هو `12288` حرفًا (حوالي 3000 رمز).

تستخدم خلفيات Claude CLI تلقائيًا حدًا أكبر مشتقًا من طبقة سياق Claude المحلولة.
تحتفظ تشغيلات Claude القياسية ذات 200K رمز بشريحة نص أكبر،
وتحتفظ تشغيلات Claude ذات 1M رمز بشريحة أكبر مرة أخرى، بينما تحافظ خلفيات CLI
الأخرى على الافتراضي المحافظ.

- يحكم الحد فقط كتلة السجل السابق في مطالبة إعادة الزرع. يتم ضبط حدود
  مخرجات الجلسة الحية بشكل منفصل ضمن `reliability.outputLimits`
  (انظر [الجلسات](#sessions)).

## القيود

- **لا توجد استدعاءات أدوات OpenClaw مباشرة.** لا يحقن OpenClaw استدعاءات أدوات في
  بروتوكول خلفية CLI. لا ترى الخلفيات أدوات Gateway إلا عندما تختار
  `bundleMcp: true`.
- **البث خاص بالخلفية.** تبث بعض الخلفيات JSONL؛ بينما تخزّن أخرى مؤقتًا
  حتى الخروج.
- **المخرجات المنظّمة** تعتمد على تنسيق JSON الخاص بـ CLI.

## استكشاف الأخطاء وإصلاحها

- **CLI غير موجود**: اضبط `command` على مسار كامل.
- **اسم النموذج غير صحيح**: استخدم `modelAliases` لربط `provider/model` → نموذج CLI.
- **لا توجد استمرارية للجلسة**: تأكد من ضبط `sessionArg` وأن `sessionMode` ليس
  `none`.
- **تم تجاهل الصور**: اضبط `imageArg` (وتحقق من أن CLI يدعم مسارات الملفات).

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [النماذج المحلية](/ar/gateway/local-models)
