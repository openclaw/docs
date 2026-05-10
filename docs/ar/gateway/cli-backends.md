---
read_when:
    - تريد بديلاً احتياطياً موثوقاً عندما يفشل مزوّدو API
    - أنت تشغّل Codex CLI أو واجهات CLI محلية أخرى للذكاء الاصطناعي وتريد إعادة استخدامها
    - تريد فهم جسر الاسترجاع الحلقي الخاص بـ MCP للوصول إلى أدوات الواجهة الخلفية الخاصة بـ CLI
summary: 'واجهات CLI الخلفية: بديل احتياطي محلي لـ CLI للذكاء الاصطناعي مع جسر أدوات MCP اختياري'
title: الواجهات الخلفية لـ CLI
x-i18n:
    generated_at: "2026-05-10T19:37:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **واجهات CLI محلية للذكاء الاصطناعي** بوصفها **خطة احتياطية نصية فقط** عندما تكون موفّرات API متوقفة،
أو محدودة المعدّل، أو تتصرف على نحو غير سليم مؤقتًا. هذا محافظ عمدًا:

- **لا تُحقن أدوات OpenClaw مباشرةً**، لكن الخلفيات التي تستخدم `bundleMcp: true`
  يمكنها تلقي أدوات Gateway عبر جسر MCP بنمط local loopback.
- **تدفق JSONL** لواجهات CLI التي تدعمه.
- **الجلسات مدعومة** (لذلك تظل أدوار المتابعة مترابطة).
- **يمكن تمرير الصور عبرها** إذا كانت واجهة CLI تقبل مسارات الصور.

صُمم هذا ليكون **شبكة أمان** بدلًا من كونه المسار الأساسي. استخدمه عندما تريد
استجابات نصية "تعمل دائمًا" دون الاعتماد على واجهات API الخارجية.

إذا كنت تريد وقت تشغيل harness كاملًا مع عناصر تحكم جلسات ACP، ومهام خلفية،
وربط thread/conversation، وجلسات ترميز خارجية مستمرة، فاستخدم
[وكلاء ACP](/ar/tools/acp-agents) بدلًا من ذلك. خلفيات CLI ليست ACP.

<Tip>
  هل تبني Plugin خلفية جديدًا؟ استخدم
  [Plugins خلفية CLI](/ar/plugins/cli-backend-plugins). هذه الصفحة مخصصة للمستخدمين
  الذين يكوّنون ويشغلون خلفية مسجلة مسبقًا.
</Tip>

## بدء سريع مناسب للمبتدئين

يمكنك استخدام Codex CLI **دون أي إعدادات** (يسجل Plugin OpenAI المضمن
خلفية افتراضية):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

إذا كان Gateway يعمل عبر launchd/systemd وكان PATH محدودًا، فأضف فقط
مسار الأمر:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

هذا كل شيء. لا مفاتيح، ولا إعدادات مصادقة إضافية مطلوبة بخلاف واجهة CLI نفسها.

إذا كنت تستخدم خلفية CLI مضمنة بوصفها **موفّر الرسائل الأساسي** على مضيف
Gateway، فإن OpenClaw يحمّل الآن تلقائيًا Plugin المضمن المالك عندما يشير إعدادك
صراحةً إلى تلك الخلفية في مرجع نموذج أو ضمن
`agents.defaults.cliBackends`.

## استخدامها كخطة احتياطية

أضف خلفية CLI إلى قائمة الاحتياط لديك حتى تعمل فقط عندما تفشل النماذج الأساسية:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

ملاحظات:

- إذا كنت تستخدم `agents.defaults.models` (قائمة سماح)، فيجب أن تضمّن نماذج خلفية CLI لديك هناك أيضًا.
- إذا فشل الموفّر الأساسي (مصادقة، حدود معدّل، مُهل)، فسيجرّب OpenClaw
  خلفية CLI بعد ذلك.

## نظرة عامة على الإعداد

توجد جميع خلفيات CLI ضمن:

```
agents.defaults.cliBackends
```

يُفهرس كل إدخال بواسطة **معرّف موفّر** (مثل `codex-cli`، `my-cli`).
ويصبح معرّف الموفّر الجانب الأيسر من مرجع النموذج لديك:

```
<provider>/<model>
```

### مثال إعداد

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
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

1. **يختار خلفية** بناءً على بادئة الموفّر (`codex-cli/...`).
2. **يبني موجه نظام** باستخدام موجه OpenClaw نفسه + سياق مساحة العمل.
3. **ينفّذ واجهة CLI** مع معرّف جلسة (إذا كان مدعومًا) حتى يبقى السجل متسقًا.
   تحافظ خلفية `claude-cli` المضمنة على عملية Claude stdio نشطة لكل
   جلسة OpenClaw وترسل أدوار المتابعة عبر stream-json stdin.
4. **يحلل المخرجات** (JSON أو نص عادي) ويعيد النص النهائي.
5. **يحتفظ بمعرّفات الجلسات** لكل خلفية، حتى تعيد أدوار المتابعة استخدام جلسة CLI نفسها.

<Note>
خلفية Anthropic `claude-cli` المضمنة مدعومة مجددًا. أخبرنا موظفو Anthropic
أن استخدام Claude CLI بأسلوب OpenClaw مسموح مجددًا، لذلك يتعامل OpenClaw مع
استخدام `claude -p` على أنه مصرّح به لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تمرر خلفية OpenAI `codex-cli` المضمنة موجه نظام OpenClaw عبر
تجاوز إعداد `model_instructions_file` في Codex (`-c
model_instructions_file="..."`). لا يوفّر Codex علمًا بأسلوب Claude مثل
`--append-system-prompt`، لذلك يكتب OpenClaw الموجه المجمّع إلى
ملف مؤقت لكل جلسة Codex CLI جديدة.

تتلقى خلفية Anthropic `claude-cli` المضمنة لقطة Skills الخاصة بـ OpenClaw
بطريقتين: كتالوج Skills المختصر الخاص بـ OpenClaw في موجه النظام الملحق، و
Plugin مؤقت لـ Claude Code يُمرر باستخدام `--plugin-dir`. يحتوي Plugin على
Skills المؤهلة لذلك الوكيل/الجلسة فقط، لذلك يرى محلل Skills الأصلي في Claude Code
نفس المجموعة المصفاة التي كان OpenClaw سيعلن عنها بخلاف ذلك في
الموجه. لا تزال تجاوزات Skill env/API key تُطبّق بواسطة OpenClaw على
بيئة العملية الفرعية للتشغيل.

يحتوي Claude CLI أيضًا على وضع أذونات غير تفاعلي خاص به. يربط OpenClaw ذلك
بسياسة exec الحالية بدلًا من إضافة إعدادات خاصة بـ Claude: عندما تكون
سياسة exec المطلوبة الفعالة هي YOLO (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، يضيف OpenClaw `--permission-mode bypassPermissions`.
تتجاوز إعدادات `agents.list[].tools.exec` لكل وكيل إعدادات `tools.exec` العامة لذلك
الوكيل. لفرض وضع Claude مختلف، عيّن وسائط خلفية خام صريحة
مثل `--permission-mode default` أو `--permission-mode acceptEdits` ضمن
`agents.defaults.cliBackends.claude-cli.args` و`resumeArgs` المطابقة.

تربط خلفية Anthropic `claude-cli` المضمنة أيضًا مستويات OpenClaw `/think`
بعلم Claude Code الأصلي `--effort` للمستويات غير المتوقفة. يُربط `minimal` و
`low` بـ `low`، ويُربط `adaptive` و`medium` بـ `medium`، و`high`،
و`xhigh`، و`max` تُربط مباشرةً. تحتاج خلفيات CLI الأخرى إلى أن
يعلن Plugin المالك لها مخطط argv مكافئًا قبل أن يتمكن `/think` من التأثير في واجهة CLI المُنشأة.

قبل أن يتمكن OpenClaw من استخدام خلفية `claude-cli` المضمنة، يجب أن يكون Claude Code نفسه
قد سجّل الدخول مسبقًا على المضيف نفسه:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

استخدم `agents.defaults.cliBackends.claude-cli.command` فقط عندما لا يكون الملف التنفيذي `claude`
موجودًا مسبقًا على `PATH`.

## الجلسات

- إذا كانت واجهة CLI تدعم الجلسات، فعيّن `sessionArg` (مثل `--session-id`) أو
  `sessionArgs` (العنصر النائب `{sessionId}`) عندما يلزم إدراج المعرّف
  في أعلام متعددة.
- إذا كانت واجهة CLI تستخدم **أمرًا فرعيًا للاستئناف** مع أعلام مختلفة، فعيّن
  `resumeArgs` (يستبدل `args` عند الاستئناف) واختياريًا `resumeOutput`
  (للاستئنافات غير JSON).
- `sessionMode`:
  - `always`: أرسل دائمًا معرّف جلسة (UUID جديد إذا لم يكن هناك معرّف مخزن).
  - `existing`: أرسل معرّف جلسة فقط إذا كان واحد قد خُزن من قبل.
  - `none`: لا ترسل معرّف جلسة أبدًا.
- يضبط `claude-cli` افتراضيًا `liveSession: "claude-stdio"`، و`output: "jsonl"`،
  و`input: "stdin"` حتى تعيد أدوار المتابعة استخدام عملية Claude الحية أثناء
  نشاطها. أصبح stdio الدافئ هو الافتراضي الآن، بما في ذلك للإعدادات المخصصة
  التي تحذف حقول النقل. إذا أُعيد تشغيل Gateway أو خرجت العملية الخاملة،
  يستأنف OpenClaw من معرّف جلسة Claude المخزن. تُتحقق معرّفات الجلسات
  المخزنة مقابل نص مشروع قائم قابل للقراءة قبل
  الاستئناف، لذلك تُمسح الارتباطات الوهمية باستخدام `reason=transcript-missing`
  بدلًا من بدء جلسة Claude CLI جديدة بصمت تحت `--resume`.
- تحتفظ جلسات Claude الحية بحراس محدودين لمخرجات JSONL. تسمح الإعدادات الافتراضية بما يصل إلى
  8 MiB و20,000 سطر JSONL خام لكل دور. يمكن لأدوار Claude كثيفة الأدوات رفعها
  لكل خلفية باستخدام
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و`maxTurnLines`؛ يقيّد OpenClaw هذه الإعدادات إلى 64 MiB و100,000
  سطر.
- جلسات CLI المخزنة هي استمرارية يملكها الموفّر. لا يقطعها إعادة تعيين الجلسة
  اليومية الضمنية؛ أما `/reset` وسياسات `session.reset` الصريحة فما زالت
  تقطعها.
- عادةً ما تعيد جلسات CLI الجديدة البذر فقط من ملخص Compaction في OpenClaw
  إضافة إلى ذيل ما بعد Compaction. لاستعادة الجلسات القصيرة التي تُبطل
  قبل Compaction، يمكن لخلفية الاشتراك باستخدام
  `reseedFromRawTranscriptWhenUncompacted: true`. لا يزال OpenClaw يبقي إعادة بذر
  النص الخام محدودة ويقصرها على الإبطالات الآمنة مثل فقدان
  نصوص CLI، أو تغييرات موجه النظام/MCP، أو إعادة المحاولة بسبب session-expired؛ ولا تعيد
  تغييرات ملف تعريف المصادقة أو credential-epoch بذر سجل النص الخام أبدًا.

ملاحظات التسلسل:

- يحافظ `serialize: true` على ترتيب التشغيلات في المسار نفسه.
- معظم واجهات CLI تُسلسل على مسار موفّر واحد.
- يسقط OpenClaw إعادة استخدام جلسة CLI المخزنة عندما تتغير هوية المصادقة المحددة،
  بما في ذلك تغيّر معرّف ملف تعريف المصادقة، أو مفتاح API ثابت، أو رمز ثابت، أو هوية
  حساب OAuth عندما تعرضها واجهة CLI. لا تقطع دورة رموز وصول OAuth وتحديثها
  جلسة CLI المخزنة. إذا لم تعرض واجهة CLI معرّف حساب OAuth
  مستقرًا، يترك OpenClaw لتلك الواجهة فرض أذونات الاستئناف.

## تمهيد احتياطي من جلسات claude-cli

عندما تفشل محاولة `claude-cli` وتنتقل إلى مرشح غير CLI في
[`agents.defaults.model.fallbacks`](/ar/concepts/model-failover)، يبذر OpenClaw
المحاولة التالية بتمهيد سياق مستخرج من نص JSONL المحلي الخاص بـ Claude Code
في `~/.claude/projects/`. دون هذا البذر، سيبدأ الموفّر الاحتياطي باردًا لأن
نص جلسة OpenClaw نفسه يكون فارغًا لتشغيلات `claude-cli`.

- يفضل التمهيد أحدث ملخص `/compact` أو علامة `compact_boundary`،
  ثم يضيف أحدث أدوار ما بعد الحد حتى ميزانية أحرف
  محددة. تُسقط أدوار ما قبل الحد لأن الملخص يمثلها بالفعل.
- تُدمج كتل الأدوات في تلميحات مختصرة مثل `(tool call: name)` و
  `(tool result: …)` للحفاظ على ميزانية الموجه منضبطة. يُوسم الملخص
  بـ `(truncated)` إذا تجاوز الحد.
- تعتمد انتقالات الاحتياط من `claude-cli` إلى `claude-cli` للموفّر نفسه على
  `--resume` الخاص بـ Claude وتتخطى التمهيد.
- يعيد البذر استخدام التحقق الحالي من مسار ملف جلسة Claude، لذلك
  لا يمكن قراءة مسارات عشوائية.

## الصور (تمرير عبر)

إذا كانت واجهة CLI لديك تقبل مسارات الصور، فعيّن `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيكتب OpenClaw الصور المرمزة base64 إلى ملفات مؤقتة. إذا كان `imageArg` مضبوطًا، فستُمرر تلك
المسارات كوسائط CLI. إذا كان `imageArg` مفقودًا، يلحق OpenClaw
مسارات الملفات بالموجه (حقن المسار)، وهذا يكفي لواجهات CLI التي تحمّل
الملفات المحلية تلقائيًا من مسارات عادية.

## المدخلات / المخرجات

- يحاول `output: "json"` (الافتراضي) تحليل JSON واستخراج النص + معرّف الجلسة.
- لمخرجات Gemini CLI بصيغة JSON، يقرأ OpenClaw نص الرد من `response` و
  الاستخدام من `stats` عندما يكون `usage` مفقودًا أو فارغًا.
- يحلل `output: "jsonl"` تدفقات JSONL (مثل Codex CLI `--json`) ويستخرج رسالة الوكيل النهائية بالإضافة إلى معرّفات الجلسة
  عند وجودها.
- يتعامل `output: "text"` مع stdout بوصفه الاستجابة النهائية.

أوضاع الإدخال:

- يمرر `input: "arg"` (الافتراضي) الموجه بوصفه آخر وسيطة CLI.
- يرسل `input: "stdin"` الموجه عبر stdin.
- إذا كان الموجه طويلًا جدًا وكان `maxPromptArgChars` مضبوطًا، فسيُستخدم stdin.

## الإعدادات الافتراضية (مملوكة لـ Plugin)

يسجل Plugin OpenAI المضمن أيضًا إعدادًا افتراضيًا لـ `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

يسجل Plugin Google المضمّن أيضًا إعدادًا افتراضيًا لـ `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

المتطلب السابق: يجب أن تكون Gemini CLI المحلية مثبتة ومتاحة باسم
`gemini` ضمن `PATH` (`brew install gemini-cli` أو
`npm install -g @google/gemini-cli`).

ملاحظات JSON الخاصة بـ Gemini CLI:

- تتم قراءة نص الرد من حقل JSON `response`.
- يعود استخدام الموارد إلى `stats` عندما يكون `usage` غائبًا أو فارغًا.
- يتم تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.
- إذا كان `stats.input` مفقودًا، يستنتج OpenClaw رموز الإدخال من
  `stats.input_tokens - stats.cached`.

لا تتجاوز إلا عند الحاجة (الشائع: مسار `command` مطلق).

## الإعدادات الافتراضية المملوكة لـ Plugin

أصبحت إعدادات واجهة CLI الخلفية الافتراضية الآن جزءًا من سطح Plugin:

- تسجلها Plugins باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالواجهة الخلفية بادئة المزوّد في مراجع النماذج.
- لا يزال إعداد المستخدم في `agents.defaults.cliBackends.<id>` يتجاوز الإعداد الافتراضي الخاص بـ Plugin.
- يظل تنظيف الإعدادات الخاصة بالواجهة الخلفية مملوكًا لـ Plugin عبر خطاف
  `normalizeConfig` الاختياري.

يمكن لـ Plugins التي تحتاج إلى حشوات توافق صغيرة للمطالبات/الرسائل أن تعلن
تحويلات نصية ثنائية الاتجاه من دون استبدال مزوّد أو واجهة CLI خلفية:

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

يعيد `input` كتابة مطالبة النظام ومطالبة المستخدم الممررتين إلى CLI. يعيد `output`
كتابة فروقات المساعد المتدفقة والنص النهائي المحلل قبل أن يعالج OpenClaw
علامات التحكم الخاصة به وتسليم القناة.

بالنسبة إلى واجهات CLI التي تصدر JSONL متوافقًا مع Claude Code stream-json، عيّن
`jsonlDialect: "claude-stream-json"` في إعدادات تلك الواجهة الخلفية.

## تراكبات MCP المجمّعة

لا تتلقى واجهات CLI الخلفية استدعاءات أدوات OpenClaw مباشرة، لكن يمكن لواجهة خلفية
أن تختار استخدام تراكب إعداد MCP مولّد عبر `bundleMcp: true`.

السلوك المضمّن الحالي:

- `claude-cli`: ملف إعداد MCP صارم مولّد
- `codex-cli`: تجاوزات إعداد مضمنة لـ `mcp_servers`؛ يتم تمييز خادم
  OpenClaw loopback المولّد بوضع موافقة أدوات خاص بكل خادم في Codex
  حتى لا تتوقف استدعاءات MCP بسبب مطالبات الموافقة المحلية
- `google-gemini-cli`: ملف إعدادات نظام Gemini مولّد

عند تمكين MCP المجمّع، يقوم OpenClaw بما يلي:

- ينشئ خادم MCP عبر HTTP بنمط loopback يعرّض أدوات Gateway لعملية CLI
- يصادق الجسر باستخدام رمز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يقيّد الوصول إلى الأدوات بسياق الجلسة والحساب والقناة الحالية
- يحمّل خوادم bundle-MCP الممكّنة لمساحة العمل الحالية
- يدمجها مع أي شكل موجود لإعدادات/ضبط MCP للواجهة الخلفية
- يعيد كتابة إعداد التشغيل باستخدام وضع التكامل المملوك للواجهة الخلفية من الامتداد المالك

إذا لم تكن أي خوادم MCP ممكّنة، يظل OpenClaw يحقن إعدادًا صارمًا عندما تختار
واجهة خلفية استخدام MCP المجمّع حتى تبقى عمليات التشغيل في الخلفية معزولة.

تُخزّن بيئات تشغيل MCP المضمّنة والمقيّدة بالجلسة مؤقتًا لإعادة استخدامها داخل جلسة، ثم
تُحصد بعد `mcp.sessionIdleTtlMs` مللي ثانية من وقت الخمول (الافتراضي 10
دقائق؛ عيّن `0` للتعطيل). تطلب عمليات التشغيل المضمنة لمرة واحدة مثل فحوصات المصادقة،
وتوليد slug، واستدعاء Active Memory التنظيف عند نهاية التشغيل حتى لا تبقى
عمليات stdio الفرعية وتدفقات Streamable HTTP/SSE بعد انتهاء التشغيل.

## القيود

- **لا توجد استدعاءات مباشرة لأدوات OpenClaw.** لا يحقن OpenClaw استدعاءات أدوات في
  بروتوكول واجهة CLI الخلفية. لا ترى الواجهات الخلفية أدوات Gateway إلا عندما تختار
  `bundleMcp: true`.
- **البث خاص بكل واجهة خلفية.** تبث بعض الواجهات الخلفية JSONL؛ وتنتظر أخرى
  حتى الخروج.
- **المخرجات المنظمة** تعتمد على تنسيق JSON الخاص بـ CLI.
- **جلسات Codex CLI** تستأنف عبر إخراج نصي (بدون JSONL)، وهو أقل
  تنظيمًا من تشغيل `--json` الأولي. لا تزال جلسات OpenClaw تعمل
  بشكل طبيعي.

## استكشاف الأخطاء وإصلاحها

- **CLI غير موجودة**: عيّن `command` إلى مسار كامل.
- **اسم نموذج خاطئ**: استخدم `modelAliases` لتعيين `provider/model` → نموذج CLI.
- **لا توجد استمرارية للجلسة**: تأكد من ضبط `sessionArg` وأن `sessionMode` ليس
  `none` (لا يمكن لـ Codex CLI حاليًا الاستئناف مع إخراج JSON).
- **يتم تجاهل الصور**: عيّن `imageArg` (وتحقق من أن CLI تدعم مسارات الملفات).

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [النماذج المحلية](/ar/gateway/local-models)
