---
read_when:
    - تريد بديلاً احتياطيًا موثوقًا عندما يفشل مزودو API
    - أنت تشغّل Codex CLI أو واجهات CLI محلية أخرى للذكاء الاصطناعي وترغب في إعادة استخدامها
    - تريد فهم جسر الاسترجاع الحلقي الخاص بـ MCP للوصول إلى أدوات الواجهة الخلفية في CLI
summary: 'واجهات CLI الخلفية: بديل CLI ذكاء اصطناعي محلي مع جسر اختياري لأدوات MCP'
title: الواجهات الخلفية لـ CLI
x-i18n:
    generated_at: "2026-05-06T07:52:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffba26a7471dd1f1c0b542187126ad45ff09a507c4eb737682d88b0085f4c5d5
    source_path: gateway/cli-backends.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **واجهات CLI محلية للذكاء الاصطناعي** كـ **خيار احتياطي نصي فقط** عندما تكون مزودات API متوقفة،
أو مقيدة بالمعدل، أو تتصرف بشكل غير صحيح مؤقتا. هذا محافظ عن قصد:

- **لا تُحقن أدوات OpenClaw مباشرة**، لكن الخلفيات التي تحتوي على `bundleMcp: true`
  يمكنها تلقي أدوات Gateway عبر جسر MCP باستخدام local loopback.
- **بث JSONL** لواجهات CLI التي تدعمه.
- **الجلسات مدعومة** (بحيث تبقى الأدوار اللاحقة متماسكة).
- **يمكن تمرير الصور** إذا كانت CLI تقبل مسارات الصور.

صُمم هذا كـ **شبكة أمان** لا كمسار أساسي. استخدمه عندما تريد
استجابات نصية "تعمل دائما" من دون الاعتماد على واجهات API خارجية.

إذا كنت تريد وقت تشغيل كامل للحزام مع عناصر تحكم جلسات ACP، ومهام خلفية،
وربط السلاسل/المحادثات، وجلسات ترميز خارجية مستمرة، فاستخدم
[وكلاء ACP](/ar/tools/acp-agents) بدلا من ذلك. خلفيات CLI ليست ACP.

## بداية سريعة مناسبة للمبتدئين

يمكنك استخدام Codex CLI **من دون أي إعدادات** (يسجل Plugin OpenAI المضمن
خلفية افتراضية):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

إذا كان Gateway يعمل تحت launchd/systemd وكان PATH محدودا، فأضف فقط
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

هذا كل شيء. لا مفاتيح، ولا إعدادات مصادقة إضافية مطلوبة بخلاف CLI نفسها.

إذا كنت تستخدم خلفية CLI مضمنة بوصفها **مزود الرسائل الأساسي** على
مضيف Gateway، فإن OpenClaw يحمّل الآن تلقائيا Plugin المضمن المالك عندما تشير إعداداتك
صراحة إلى تلك الخلفية في مرجع نموذج أو ضمن
`agents.defaults.cliBackends`.

## استخدامه كخيار احتياطي

أضف خلفية CLI إلى قائمة الخيارات الاحتياطية لديك بحيث تعمل فقط عند فشل النماذج الأساسية:

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

- إذا كنت تستخدم `agents.defaults.models` (قائمة سماح)، فيجب عليك تضمين نماذج خلفية CLI هناك أيضا.
- إذا فشل المزود الأساسي (المصادقة، حدود المعدل، المهلات)، فسيحاول OpenClaw
  استخدام خلفية CLI بعده.

## نظرة عامة على الإعدادات

توجد كل خلفيات CLI ضمن:

```
agents.defaults.cliBackends
```

يُفهرس كل إدخال بواسطة **معرف مزود** (مثل `codex-cli`، و`my-cli`).
يصبح معرف المزود الجانب الأيسر من مرجع النموذج لديك:

```
<provider>/<model>
```

### مثال إعدادات

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

1. **يحدد خلفية** بناء على بادئة المزود (`codex-cli/...`).
2. **يبني مطالبة نظام** باستخدام مطالبة OpenClaw نفسها + سياق مساحة العمل.
3. **ينفذ CLI** مع معرف جلسة (إذا كان مدعوما) حتى يبقى السجل متسقا.
   تحافظ خلفية `claude-cli` المضمنة على عملية Claude stdio حية لكل
   جلسة OpenClaw وترسل الأدوار اللاحقة عبر stream-json stdin.
4. **يحلل الإخراج** (JSON أو نص عادي) ويعيد النص النهائي.
5. **يستمر في تخزين معرفات الجلسات** لكل خلفية، بحيث تعيد المتابعات استخدام جلسة CLI نفسها.

<Note>
خلفية Anthropic `claude-cli` المضمنة مدعومة مرة أخرى. أخبرنا موظفو Anthropic
أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw
مع استخدام `claude -p` على أنه معتمد لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تمرر خلفية OpenAI `codex-cli` المضمنة مطالبة نظام OpenClaw عبر
تجاوز إعدادات Codex `model_instructions_file` (`-c
model_instructions_file="..."`). لا يتيح Codex علما بأسلوب Claude
`--append-system-prompt`، لذلك يكتب OpenClaw المطالبة المجمعة إلى
ملف مؤقت لكل جلسة Codex CLI جديدة.

تتلقى خلفية Anthropic `claude-cli` المضمنة لقطة Skills الخاصة بـ OpenClaw
بطريقتين: كتالوج Skills المضغوط الخاص بـ OpenClaw في مطالبة النظام الملحقة، و
Plugin مؤقت لـ Claude Code يُمرر باستخدام `--plugin-dir`. يحتوي Plugin
على Skills المؤهلة لذلك الوكيل/الجلسة فقط، لذلك يرى محلل Skills الأصلي في Claude Code
المجموعة المفلترة نفسها التي كان OpenClaw سيعلن عنها بخلاف ذلك في
المطالبة. ما زال OpenClaw يطبق تجاوزات بيئة Skills/مفتاح API على
بيئة العملية الفرعية للتشغيل.

لدى Claude CLI أيضا وضع أذونات غير تفاعلي خاص بها. يربط OpenClaw ذلك
بسياسة التنفيذ الحالية بدلا من إضافة إعدادات خاصة بـ Claude: عندما تكون
سياسة التنفيذ المطلوبة الفعلية هي YOLO (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، يضيف OpenClaw `--permission-mode bypassPermissions`.
تتجاوز إعدادات `agents.list[].tools.exec` لكل وكيل إعدادات `tools.exec` العامة لذلك
الوكيل. لفرض وضع Claude مختلف، عيّن وسائط خلفية خاما صريحة
مثل `--permission-mode default` أو `--permission-mode acceptEdits` ضمن
`agents.defaults.cliBackends.claude-cli.args` و`resumeArgs` المطابقة.

تربط خلفية Anthropic `claude-cli` المضمنة أيضا مستويات OpenClaw `/think`
بعلم Claude Code الأصلي `--effort` للمستويات غير المتوقفة. يتم ربط `minimal` و
`low` بـ `low`، و`adaptive` و`medium` بـ `medium`، و`high`،
و`xhigh`، و`max` مباشرة. تحتاج خلفيات CLI الأخرى إلى أن يعلن Plugin المالك لها
محوّل argv مكافئا قبل أن يتمكن `/think` من التأثير في CLI المنشأة.

قبل أن يتمكن OpenClaw من استخدام خلفية `claude-cli` المضمنة، يجب أن يكون Claude Code نفسه
مسجل الدخول مسبقا على المضيف نفسه:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

استخدم `agents.defaults.cliBackends.claude-cli.command` فقط عندما لا يكون ملف `claude`
الثنائي موجودا بالفعل على `PATH`.

## الجلسات

- إذا كانت CLI تدعم الجلسات، فعيّن `sessionArg` (مثل `--session-id`) أو
  `sessionArgs` (العنصر النائب `{sessionId}`) عندما يلزم إدراج المعرف
  في عدة أعلام.
- إذا كانت CLI تستخدم **أمرا فرعيا للاستئناف** مع أعلام مختلفة، فعيّن
  `resumeArgs` (تستبدل `args` عند الاستئناف) واختياريا `resumeOutput`
  (للاستئناف غير JSON).
- `sessionMode`:
  - `always`: أرسل معرف جلسة دائما (UUID جديد إذا لم يكن هناك معرف مخزن).
  - `existing`: أرسل معرف جلسة فقط إذا كان قد تم تخزين واحد من قبل.
  - `none`: لا ترسل معرف جلسة أبدا.
- تكون القيم الافتراضية لـ `claude-cli` هي `liveSession: "claude-stdio"`، و`output: "jsonl"`،
  و`input: "stdin"` بحيث تعيد الأدوار اللاحقة استخدام عملية Claude الحية أثناء
  نشاطها. أصبح stdio الدافئ هو الافتراضي الآن، بما في ذلك للإعدادات المخصصة
  التي تحذف حقول النقل. إذا أُعيد تشغيل Gateway أو خرجت العملية الخاملة،
  يستأنف OpenClaw من معرف جلسة Claude المخزن. يتم التحقق من معرفات الجلسات
  المخزنة مقابل نص مشروع قائم قابل للقراءة قبل
  الاستئناف، لذلك تُمسح الارتباطات الوهمية مع `reason=transcript-missing`
  بدلا من بدء جلسة Claude CLI جديدة بصمت تحت `--resume`.
- تحافظ جلسات Claude الحية على حراس إخراج JSONL محدودة. تسمح القيم الافتراضية بما يصل إلى
  8 MiB و20,000 سطر JSONL خام لكل دور. يمكن لأدوار Claude كثيفة الأدوات رفعها
  لكل خلفية باستخدام
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و`maxTurnLines`؛ يحد OpenClaw تلك الإعدادات إلى 64 MiB و100,000
  سطر.
- جلسات CLI المخزنة هي استمرارية يملكها المزود. لا يقطعها إعادة تعيين الجلسة
  اليومية الضمنية؛ ما زالت سياسات `/reset` و`session.reset` الصريحة
  تفعل ذلك.

ملاحظات التسلسل:

- يحافظ `serialize: true` على ترتيب عمليات التشغيل في المسار نفسه.
- تقوم معظم واجهات CLI بالتسلسل على مسار مزود واحد.
- يتخلى OpenClaw عن إعادة استخدام جلسة CLI المخزنة عندما تتغير هوية المصادقة المحددة،
  بما في ذلك معرف ملف مصادقة متغير، أو مفتاح API ثابت، أو رمز ثابت، أو هوية
  حساب OAuth عندما تتيحها CLI. لا يقطع تدوير رموز وصول وتحديث OAuth
  جلسة CLI المخزنة. إذا لم تعرض CLI معرف حساب OAuth مستقرا،
  يترك OpenClaw لتلك CLI فرض أذونات الاستئناف.

## تمهيد احتياطي من جلسات claude-cli

عندما تفشل محاولة `claude-cli` وتنتقل إلى مرشح غير CLI في
[`agents.defaults.model.fallbacks`](/ar/concepts/model-failover)، يزرع OpenClaw
المحاولة التالية بتمهيد سياق مستخلص من نص JSONL المحلي لـ Claude Code
في `~/.claude/projects/`. من دون هذه البذرة، سيبدأ المزود الاحتياطي
باردا لأن نص جلسة OpenClaw نفسه فارغ
لتشغيلات `claude-cli`.

- يفضل التمهيد أحدث ملخص `/compact` أو علامة `compact_boundary`،
  ثم يلحق أحدث الأدوار بعد الحد حتى ميزانية أحرف
  محددة. تُسقط الأدوار السابقة للحد لأن الملخص يمثلها بالفعل.
- تُدمج كتل الأدوات في تلميحات مضغوطة `(tool call: name)` و
  `(tool result: …)` للحفاظ على ميزانية المطالبة بصدق. يُوسم الملخص
  بـ `(truncated)` إذا تجاوز الحد.
- تعتمد الخيارات الاحتياطية من `claude-cli` إلى `claude-cli` لدى المزود نفسه على
  `--resume` الخاص بـ Claude وتتجاوز التمهيد.
- تعيد البذرة استخدام تحقق مسار ملف جلسة Claude الحالي، لذلك
  لا يمكن قراءة مسارات عشوائية.

## الصور (تمرير مباشر)

إذا كانت CLI تقبل مسارات الصور، فعيّن `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيكتب OpenClaw صور base64 إلى ملفات مؤقتة. إذا تم تعيين `imageArg`، فستُمرر تلك
المسارات كوسائط CLI. إذا كان `imageArg` مفقودا، يلحق OpenClaw
مسارات الملفات بالمطالبة (حقن المسار)، وهو كاف لواجهات CLI التي تحمّل
الملفات المحلية تلقائيا من المسارات العادية.

## المدخلات / المخرجات

- يحاول `output: "json"` (الافتراضي) تحليل JSON واستخراج النص + معرف الجلسة.
- بالنسبة إلى إخراج Gemini CLI بصيغة JSON، يقرأ OpenClaw نص الرد من `response` و
  الاستخدام من `stats` عندما يكون `usage` مفقودا أو فارغا.
- يحلل `output: "jsonl"` تدفقات JSONL (على سبيل المثال Codex CLI `--json`) ويستخرج رسالة الوكيل النهائية بالإضافة إلى معرفات
  الجلسة عند وجودها.
- يعامل `output: "text"` stdout على أنه الاستجابة النهائية.

أوضاع الإدخال:

- يمرر `input: "arg"` (الافتراضي) المطالبة كآخر وسيطة CLI.
- يرسل `input: "stdin"` المطالبة عبر stdin.
- إذا كانت المطالبة طويلة جدا وكان `maxPromptArgChars` مضبوطا، فسيتم استخدام stdin.

## الافتراضيات (مملوكة للـ Plugin)

يسجل Plugin OpenAI المضمن أيضا افتراضيا لـ `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

يسجل Plugin Google المضمن أيضا افتراضيا لـ `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

المتطلب السابق: يجب أن تكون Gemini CLI المحلية مثبتة ومتاحة باسم
`gemini` على `PATH` (`brew install gemini-cli` أو
`npm install -g @google/gemini-cli`).

ملاحظات JSON الخاصة بـ Gemini CLI:

- يُقرأ نص الرد من حقل `response` في JSON.
- يعود الاستخدام إلى `stats` عندما يكون `usage` غائبًا أو فارغًا.
- يتم تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.
- إذا كان `stats.input` مفقودًا، يشتق OpenClaw رموز الإدخال من
  `stats.input_tokens - stats.cached`.

تجاوز ذلك فقط عند الحاجة (الشائع: مسار `command` مطلق).

## الإعدادات الافتراضية المملوكة لـ Plugin

أصبحت إعدادات واجهة CLI الخلفية الافتراضية الآن جزءًا من سطح Plugin:

- تسجلها Plugins باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالواجهة الخلفية بادئة المزود في مراجع النماذج.
- لا يزال تكوين المستخدم في `agents.defaults.cliBackends.<id>` يتجاوز الإعداد الافتراضي لـ Plugin.
- يظل تنظيف التكوين الخاص بالواجهة الخلفية مملوكًا لـ Plugin عبر خطاف
  `normalizeConfig` الاختياري.

يمكن لـ Plugins التي تحتاج إلى حشوات توافق صغيرة للمطالبات/الرسائل أن تعلن
تحويلات نصية ثنائية الاتجاه من دون استبدال مزود أو واجهة CLI خلفية:

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

يعيد `input` كتابة مطالبة النظام ومطالبة المستخدم الممررتين إلى CLI. ويعيد `output`
كتابة دلتا المساعد المتدفقة والنص النهائي المحلل قبل أن يتعامل OpenClaw مع
علامات التحكم الخاصة به وتسليم القناة.

بالنسبة إلى واجهات CLI التي تصدر JSONL متوافقًا مع Claude Code stream-json، عيّن
`jsonlDialect: "claude-stream-json"` في تكوين تلك الواجهة الخلفية.

## تراكبات Bundle MCP

لا تتلقى واجهات CLI الخلفية استدعاءات أدوات OpenClaw مباشرة، لكن يمكن للواجهة الخلفية
الاشتراك في تراكب تكوين MCP مولّد باستخدام `bundleMcp: true`.

السلوك المضمّن الحالي:

- `claude-cli`: ملف تكوين MCP صارم مولّد
- `codex-cli`: تجاوزات تكوين مضمنة لـ `mcp_servers`؛ يُعلَّم خادم
  OpenClaw loopback المولّد بوضع موافقة الأدوات لكل خادم في Codex
  حتى لا تتوقف استدعاءات MCP بسبب مطالبات الموافقة المحلية
- `google-gemini-cli`: ملف إعدادات نظام Gemini مولّد

عند تمكين Bundle MCP، يقوم OpenClaw بما يلي:

- يشغّل خادم HTTP MCP loopback يعرّض أدوات Gateway لعملية CLI
- يصادق الجسر باستخدام رمز مميز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يقيّد وصول الأدوات بنطاق الجلسة الحالية والحساب وسياق القناة
- يحمّل خوادم bundle-MCP الممكّنة لمساحة العمل الحالية
- يدمجها مع أي شكل تكوين/إعدادات MCP موجود للواجهة الخلفية
- يعيد كتابة تكوين التشغيل باستخدام وضع التكامل المملوك للواجهة الخلفية من الامتداد المالك

إذا لم تكن أي خوادم MCP ممكّنة، يظل OpenClaw يحقن تكوينًا صارمًا عندما تشترك
واجهة خلفية في bundle MCP حتى تبقى عمليات التشغيل الخلفية معزولة.

تُخزّن أوقات تشغيل MCP المضمّنة والمقيّدة بنطاق الجلسة مؤقتًا لإعادة استخدامها ضمن جلسة، ثم
تُزال بعد `mcp.sessionIdleTtlMs` مللي ثانية من وقت الخمول (الافتراضي 10
دقائق؛ عيّن `0` للتعطيل). تطلب عمليات التشغيل المضمّنة ذات اللقطة الواحدة مثل مجسات المصادقة،
وتوليد slug، واستدعاء active-memory التنظيف عند نهاية التشغيل حتى لا تبقى عمليات stdio
الفرعية وتدفقات HTTP/SSE القابلة للبث بعد انتهاء التشغيل.

## القيود

- **لا توجد استدعاءات مباشرة لأدوات OpenClaw.** لا يحقن OpenClaw استدعاءات أدوات في
  بروتوكول واجهة CLI الخلفية. لا ترى الواجهات الخلفية أدوات Gateway إلا عندما تشترك في
  `bundleMcp: true`.
- **البث خاص بالواجهة الخلفية.** تبث بعض الواجهات الخلفية JSONL؛ بينما تخزّن أخرى مؤقتًا
  حتى الخروج.
- **المخرجات المنظمة** تعتمد على تنسيق JSON الخاص بـ CLI.
- **جلسات Codex CLI** تُستأنف عبر إخراج نصي (دون JSONL)، وهو أقل
  تنظيمًا من تشغيل `--json` الأولي. لا تزال جلسات OpenClaw تعمل
  بصورة طبيعية.

## استكشاف الأخطاء وإصلاحها

- **لم يتم العثور على CLI**: عيّن `command` إلى مسار كامل.
- **اسم نموذج خاطئ**: استخدم `modelAliases` لربط `provider/model` → نموذج CLI.
- **لا توجد استمرارية للجلسة**: تأكد من تعيين `sessionArg` وأن `sessionMode` ليس
  `none` (لا يمكن لـ Codex CLI حاليًا الاستئناف بإخراج JSON).
- **يتم تجاهل الصور**: عيّن `imageArg` (وتحقق من أن CLI يدعم مسارات الملفات).

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [النماذج المحلية](/ar/gateway/local-models)
