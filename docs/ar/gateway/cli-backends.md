---
read_when:
    - تريد آلية احتياطية موثوقة عند فشل مزوّدي واجهات برمجة التطبيقات
    - أنت تشغّل Codex CLI أو أدوات CLI محلية أخرى للذكاء الاصطناعي وتريد إعادة استخدامها
    - تريد فهم جسر الاسترجاع الحلقي لـ MCP للوصول إلى أدوات الواجهة الخلفية في CLI
summary: 'واجهات CLI الخلفية: رجوع احتياطي إلى CLI محلية للذكاء الاصطناعي مع جسر أدوات MCP اختياري'
title: خلفيات CLI
x-i18n:
    generated_at: "2026-05-02T20:45:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f343469d6a42dc6146196355dc2ba3feed045515c3d8446941b90971aadc9a16
    source_path: gateway/cli-backends.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **واجهات CLI محلية للذكاء الاصطناعي** بوصفها **خيارًا احتياطيًا نصيًا فقط** عندما تكون مزودات API متوقفة،
أو محدودة المعدل، أو تتصرف مؤقتًا بشكل غير سليم. هذا محافظ عن قصد:

- **لا تُحقن أدوات OpenClaw مباشرة**، لكن الخلفيات التي تحتوي على `bundleMcp: true`
  يمكنها تلقي أدوات Gateway عبر جسر MCP حلقي.
- **بث JSONL** لواجهات CLI التي تدعمه.
- **الجلسات مدعومة** (لذلك تبقى الجولات اللاحقة مترابطة).
- **يمكن تمرير الصور** إذا كانت واجهة CLI تقبل مسارات الصور.

صُمم هذا بوصفه **شبكة أمان** لا مسارًا أساسيًا. استخدمه عندما تريد
ردودًا نصية "تعمل دائمًا" دون الاعتماد على واجهات API خارجية.

إذا كنت تريد وقت تشغيل كاملًا للحاضنة مع عناصر تحكم جلسة ACP، ومهام خلفية،
وربط الخيط/المحادثة، وجلسات ترميز خارجية مستمرة، فاستخدم
[وكلاء ACP](/ar/tools/acp-agents) بدلًا من ذلك. خلفيات CLI ليست ACP.

## بداية سريعة مناسبة للمبتدئين

يمكنك استخدام Codex CLI **دون أي إعدادات** (يسجل Plugin OpenAI المضمن
خلفية افتراضية):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

إذا كان Gateway لديك يعمل ضمن launchd/systemd وكان PATH في حده الأدنى، فأضف
مسار الأمر فقط:

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

هذا كل شيء. لا حاجة إلى مفاتيح ولا إعدادات مصادقة إضافية تتجاوز واجهة CLI نفسها.

إذا كنت تستخدم خلفية CLI مضمنة بوصفها **مزود الرسائل الأساسي** على
مضيف Gateway، فإن OpenClaw يحمّل الآن تلقائيًا Plugin المضمن المالك عندما تشير إعداداتك
صراحةً إلى تلك الخلفية في مرجع نموذج أو ضمن
`agents.defaults.cliBackends`.

## استخدامها كخيار احتياطي

أضف خلفية CLI إلى قائمة الخيارات الاحتياطية بحيث لا تعمل إلا عند فشل النماذج الأساسية:

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
- إذا فشل المزود الأساسي (مصادقة، حدود معدل، مهل انتهاء)، فسيحاول OpenClaw
  استخدام خلفية CLI بعده.

## نظرة عامة على الإعدادات

توجد جميع خلفيات CLI ضمن:

```
agents.defaults.cliBackends
```

يكون كل إدخال مقيّدًا بواسطة **معرّف مزود** (مثل `codex-cli` أو `my-cli`).
يصبح معرّف المزود هو الجانب الأيسر من مرجع النموذج لديك:

```
<provider>/<model>
```

### مثال على الإعدادات

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
          serialize: true,
        },
      },
    },
  },
}
```

## كيف يعمل

1. **يحدد خلفية** بناءً على بادئة المزود (`codex-cli/...`).
2. **يبني مطالبة نظام** باستخدام مطالبة OpenClaw نفسها + سياق مساحة العمل.
3. **ينفّذ واجهة CLI** مع معرّف جلسة (إذا كان مدعومًا) كي يبقى السجل متسقًا.
   تحتفظ خلفية `claude-cli` المضمنة بعملية Claude stdio حية لكل
   جلسة OpenClaw وترسل الجولات اللاحقة عبر stream-json stdin.
4. **يفسر المخرجات** (JSON أو نص عادي) ويعيد النص النهائي.
5. **يحتفظ بمعرّفات الجلسات** لكل خلفية، بحيث تعيد الجولات اللاحقة استخدام جلسة CLI نفسها.

<Note>
خلفية Anthropic `claude-cli` المضمنة مدعومة مرة أخرى. أخبرنا موظفو Anthropic
أن استخدام Claude CLI على طريقة OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع
استخدام `claude -p` بوصفه معتمدًا لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تمرر خلفية OpenAI `codex-cli` المضمنة مطالبة نظام OpenClaw عبر
تجاوز إعداد `model_instructions_file` في Codex (`-c
model_instructions_file="..."`). لا يوفّر Codex علمًا على نمط Claude مثل
`--append-system-prompt`، لذلك يكتب OpenClaw المطالبة المجمعة إلى
ملف مؤقت لكل جلسة Codex CLI جديدة.

تتلقى خلفية Anthropic `claude-cli` المضمنة لقطة Skills الخاصة بـ OpenClaw
بطريقتين: كتالوج Skills المضغوط في OpenClaw ضمن مطالبة النظام الملحقة، و
Plugin مؤقت لـ Claude Code يمرر باستخدام `--plugin-dir`. يحتوي Plugin
فقط على Skills المؤهلة لذلك الوكيل/الجلسة، لذلك يرى محلل Skills الأصلي في Claude Code
المجموعة المصفاة نفسها التي كان OpenClaw سيعلن عنها في
المطالبة. لا تزال تجاوزات مفاتيح env/API الخاصة بالمهارة يطبقها OpenClaw على
بيئة العملية الابنة للتشغيل.

تملك Claude CLI أيضًا وضع أذونات غير تفاعلي خاصًا بها. يربط OpenClaw ذلك
بسياسة التنفيذ الموجودة بدلًا من إضافة إعدادات خاصة بـ Claude: عندما تكون
سياسة التنفيذ المطلوبة الفعالة هي YOLO (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، يضيف OpenClaw `--permission-mode bypassPermissions`.
تتجاوز إعدادات `agents.list[].tools.exec` لكل وكيل إعدادات `tools.exec` العامة لذلك
الوكيل. لفرض وضع Claude مختلف، عيّن وسائط خلفية خامًا صريحة
مثل `--permission-mode default` أو `--permission-mode acceptEdits` ضمن
`agents.defaults.cliBackends.claude-cli.args` و`resumeArgs` المطابقة.

قبل أن يتمكن OpenClaw من استخدام الواجهة الخلفية المضمّنة `claude-cli`، يجب أن يكون Claude Code نفسه
قد سجّل الدخول بالفعل على المضيف نفسه:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

استخدم `agents.defaults.cliBackends.claude-cli.command` فقط عندما لا يكون الملف الثنائي `claude`
موجودًا بالفعل على `PATH`.

## الجلسات

- إذا كان CLI يدعم الجلسات، فاضبط `sessionArg` (مثل `--session-id`) أو
  `sessionArgs` (العنصر النائب `{sessionId}`) عندما يجب إدراج المعرّف
  في عدة رايات.
- إذا كان CLI يستخدم **أمرًا فرعيًا للاستئناف** برايات مختلفة، فاضبط
  `resumeArgs` (يحل محل `args` عند الاستئناف) واختياريًا `resumeOutput`
  (للاستئنافات غير JSON).
- `sessionMode`:
  - `always`: أرسل معرّف جلسة دائمًا (UUID جديد إذا لم يكن هناك معرّف مخزّن).
  - `existing`: أرسل معرّف جلسة فقط إذا كان قد خُزّن سابقًا.
  - `none`: لا ترسل معرّف جلسة أبدًا.
- يستخدم `claude-cli` افتراضيًا `liveSession: "claude-stdio"` و`output: "jsonl"`،
  و`input: "stdin"` بحيث تعيد الأدوار اللاحقة استخدام عملية Claude الحية أثناء
  نشاطها. أصبح stdio الدافئ هو الوضع الافتراضي الآن، بما في ذلك للتكوينات المخصصة
  التي تحذف حقول النقل. إذا أُعيد تشغيل Gateway أو خرجت العملية الخاملة،
  يستأنف OpenClaw من معرّف جلسة Claude المخزّن. تُتحقق معرّفات الجلسات المخزّنة
  مقابل نص مشروع موجود وقابل للقراءة قبل الاستئناف، لذلك تُمسح الارتباطات الوهمية
  باستخدام `reason=transcript-missing` بدلًا من بدء جلسة Claude CLI جديدة بصمت
  تحت `--resume`.
- تحتفظ جلسات Claude الحية بحراس محدودة لمخرجات JSONL. تسمح القيم الافتراضية بما يصل إلى
  8 ميبيبايت و20,000 سطر JSONL خام لكل دور. يمكن لأدوار Claude كثيفة الأدوات رفعها
  لكل واجهة خلفية باستخدام
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و`maxTurnLines`؛ يقيّد OpenClaw هذه الإعدادات إلى 64 ميبيبايت و100,000
  سطر.
- جلسات CLI المخزّنة هي استمرارية مملوكة للمزوّد. لا يقطعها إعادة ضبط الجلسة
  اليومية الضمنية؛ لكن `/reset` وسياسات `session.reset` الصريحة تفعل ذلك.

ملاحظات التسلسل:

- يحافظ `serialize: true` على ترتيب عمليات التشغيل في المسار نفسه.
- تسلسل معظم أدوات CLI على مسار مزوّد واحد.
- يُسقط OpenClaw إعادة استخدام جلسة CLI المخزّنة عندما تتغير هوية المصادقة المحددة،
  بما في ذلك تغيّر معرّف ملف المصادقة، أو مفتاح API ثابت، أو رمز ثابت، أو هوية حساب
  OAuth عندما يكشفها CLI. لا تقطع تدويرات رموز وصول OAuth ورموز التحديث جلسة CLI
  المخزّنة. إذا لم يكشف CLI عن معرّف حساب OAuth مستقر، يترك OpenClaw لذلك CLI
  فرض أذونات الاستئناف.

## تمهيد احتياطي من جلسات claude-cli

عندما تفشل محاولة `claude-cli` وتنتقل إلى مرشح غير CLI في
[`agents.defaults.model.fallbacks`](/ar/concepts/model-failover)، يزرع OpenClaw
المحاولة التالية بتمهيد سياقي مستخرج من نص JSONL المحلي الخاص بـ Claude Code
في `~/.claude/projects/`. بدون هذه البذرة، سيبدأ المزوّد الاحتياطي باردًا لأن نص
جلسة OpenClaw نفسه فارغ لعمليات تشغيل `claude-cli`.

- يفضّل التمهيد أحدث ملخص `/compact` أو علامة `compact_boundary`،
  ثم يضيف أحدث الأدوار بعد الحد حتى ميزانية الأحرف. تُسقط الأدوار قبل الحد لأن
  الملخص يمثلها بالفعل.
- تُدمج كتل الأدوات في تلميحات مضغوطة من نوع `(tool call: name)` و
  `(tool result: …)` للحفاظ على صدق ميزانية الموجّه. يُوسم الملخص
  بـ `(truncated)` إذا تجاوز الحد.
- تعتمد التحويلات الاحتياطية من `claude-cli` إلى `claude-cli` لدى المزوّد نفسه على
  `--resume` الخاص بـ Claude وتتخطى التمهيد.
- تعيد البذرة استخدام تحقق مسار ملف جلسة Claude الموجود، لذلك لا يمكن قراءة
  مسارات عشوائية.

## الصور (تمرير مباشر)

إذا كان CLI يقبل مسارات الصور، فاضبط `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيكتب OpenClaw الصور المشفرة base64 إلى ملفات مؤقتة. إذا ضُبط `imageArg`،
تُمرر تلك المسارات كوسيطات CLI. إذا كان `imageArg` مفقودًا، يلحق OpenClaw
مسارات الملفات بالموجّه (حقن المسار)، وهذا كافٍ لأدوات CLI التي تحمّل تلقائيًا
الملفات المحلية من المسارات النصية العادية.

## المدخلات / المخرجات

- يحاول `output: "json"` (الافتراضي) تحليل JSON واستخراج النص + معرّف الجلسة.
- بالنسبة إلى مخرجات Gemini CLI بصيغة JSON، يقرأ OpenClaw نص الرد من `response` و
  الاستخدام من `stats` عندما تكون `usage` مفقودة أو فارغة.
- يحلل `output: "jsonl"` تدفقات JSONL (على سبيل المثال Codex CLI `--json`) ويستخرج رسالة الوكيل النهائية إضافة إلى معرّفات الجلسة
  عند وجودها.
- يعامل `output: "text"` stdout على أنه الاستجابة النهائية.

أوضاع الإدخال:

- يمرر `input: "arg"` (الافتراضي) الموجّه كآخر وسيطة CLI.
- يرسل `input: "stdin"` الموجّه عبر stdin.
- إذا كان الموجّه طويلًا جدًا وكان `maxPromptArgChars` مضبوطًا، يُستخدم stdin.

## القيم الافتراضية (مملوكة للـ Plugin)

يسجل Plugin OpenAI المضمّن أيضًا قيمة افتراضية لـ `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

يسجل Plugin Google المضمّن أيضًا قيمة افتراضية لـ `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

المتطلب السابق: يجب تثبيت Gemini CLI المحلي وإتاحته باسم
`gemini` على `PATH` (`brew install gemini-cli` أو
`npm install -g @google/gemini-cli`).

ملاحظات JSON الخاصة بـ Gemini CLI:

- يُقرأ نص الرد من حقل JSON المسمى `response`.
- يعود الاستخدام إلى `stats` عندما تكون `usage` غائبة أو فارغة.
- يجري تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.
- إذا كان `stats.input` مفقودًا، يستنتج OpenClaw رموز الإدخال من
  `stats.input_tokens - stats.cached`.

لا تتجاوز إلا عند الحاجة (الشائع: مسار `command` مطلق).

## القيم الافتراضية المملوكة للـ Plugin

أصبحت القيم الافتراضية لواجهات CLI الخلفية الآن جزءًا من سطح Plugin:

- تسجّل Plugins هذه الواجهات باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالواجهة الخلفية بادئة المزوّد في مراجع النماذج.
- تظل إعدادات المستخدم في `agents.defaults.cliBackends.<id>` تتجاوز القيمة الافتراضية للـ Plugin.
- يبقى تنظيف الإعدادات الخاصة بالواجهة الخلفية مملوكًا للـ Plugin عبر الخطاف الاختياري
  `normalizeConfig`.

يمكن للـ Plugins التي تحتاج إلى طبقات توافق صغيرة للمطالبات/الرسائل أن تعلن عن
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

يعيد `input` كتابة مطالبة النظام ومطالبة المستخدم الممرّرتين إلى CLI. يعيد `output`
كتابة دلتا المساعد المتدفقة والنص النهائي المحلّل قبل أن يتعامل OpenClaw مع
علامات التحكم الخاصة به وتسليم القناة.

بالنسبة إلى واجهات CLI التي تصدر JSONL متوافقًا مع Claude Code stream-json، اضبط
`jsonlDialect: "claude-stream-json"` في إعدادات تلك الواجهة الخلفية.

## طبقات MCP المضمّنة

لا تتلقى واجهات CLI الخلفية استدعاءات أدوات OpenClaw مباشرة، لكن يمكن للواجهة الخلفية
اختيار استخدام طبقة إعداد MCP مولّدة عبر `bundleMcp: true`.

السلوك المضمّن الحالي:

- `claude-cli`: ملف إعداد MCP صارم مولّد
- `codex-cli`: تجاوزات إعداد مضمنة لـ `mcp_servers`؛ يتم تعليم خادم
  OpenClaw loopback المولّد بوضع موافقة الأدوات لكل خادم في Codex
  حتى لا تتوقف استدعاءات MCP بسبب مطالبات الموافقة المحلية
- `google-gemini-cli`: ملف إعدادات نظام Gemini مولّد

عند تمكين MCP المضمّن، يقوم OpenClaw بما يلي:

- يشغّل خادم HTTP MCP loopback يعرّض أدوات Gateway لعملية CLI
- يصادق على الجسر باستخدام رمز مميز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يقيّد الوصول إلى الأدوات بسياق الجلسة والحساب والقناة الحالي
- يحمّل خوادم bundle-MCP المفعّلة لمساحة العمل الحالية
- يدمجها مع أي شكل قائم لإعدادات/تكوين MCP الخاص بالواجهة الخلفية
- يعيد كتابة إعداد التشغيل باستخدام وضع التكامل المملوك للواجهة الخلفية من الامتداد المالك

إذا لم تكن أي خوادم MCP مفعّلة، فسيظل OpenClaw يحقن إعدادًا صارمًا عندما تختار
واجهة خلفية استخدام MCP المضمّن حتى تبقى عمليات التشغيل في الخلفية معزولة.

تُخزَّن أوقات تشغيل MCP المضمّنة محددة الجلسة مؤقتًا لإعادة استخدامها داخل الجلسة، ثم
تُزال بعد `mcp.sessionIdleTtlMs` مللي ثانية من وقت الخمول (الافتراضي 10
دقائق؛ اضبط `0` للتعطيل). تطلب عمليات التشغيل المضمّنة أحادية الاستخدام مثل فحوصات المصادقة،
وتوليد المعرّفات، واستدعاء Active Memory التنظيف عند نهاية التشغيل حتى لا تبقى
عمليات stdio الفرعية وتدفّقات Streamable HTTP/SSE بعد انتهاء التشغيل.

## القيود

- **لا توجد استدعاءات مباشرة لأدوات OpenClaw.** لا يحقن OpenClaw استدعاءات الأدوات في
  بروتوكول واجهة CLI الخلفية. لا ترى الواجهات الخلفية أدوات Gateway إلا عندما تختار
  `bundleMcp: true`.
- **البث خاص بالواجهة الخلفية.** تبث بعض الواجهات الخلفية JSONL؛ بينما تقوم أخرى بالتخزين المؤقت
  حتى الخروج.
- **المخرجات المهيكلة** تعتمد على تنسيق JSON الخاص بـ CLI.
- **جلسات Codex CLI** تُستأنف عبر المخرجات النصية (لا JSONL)، وهو أقل
  هيكلة من التشغيل الأولي باستخدام `--json`. تظل جلسات OpenClaw تعمل
  بشكل طبيعي.

## استكشاف الأخطاء وإصلاحها

- **لم يتم العثور على CLI**: اضبط `command` على مسار كامل.
- **اسم النموذج غير صحيح**: استخدم `modelAliases` لربط `provider/model` → نموذج CLI.
- **لا توجد استمرارية للجلسة**: تأكد من ضبط `sessionArg` وأن `sessionMode` ليس
  `none` (لا يستطيع Codex CLI حاليًا الاستئناف مع مخرجات JSON).
- **تم تجاهل الصور**: اضبط `imageArg` (وتحقق من أن CLI يدعم مسارات الملفات).

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [النماذج المحلية](/ar/gateway/local-models)
