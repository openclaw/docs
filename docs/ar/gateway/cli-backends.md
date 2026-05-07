---
read_when:
    - تريد بديلاً احتياطياً موثوقاً عند فشل مزودي API
    - أنت تشغّل Codex CLI أو أدوات CLI محلية أخرى للذكاء الاصطناعي وتريد إعادة استخدامها
    - تريد فهم جسر الحلقة الراجعة لـ MCP للوصول إلى أدوات الواجهة الخلفية لـ CLI
summary: 'الواجهات الخلفية لـ CLI: بديل احتياطي محلي لـ CLI للذكاء الاصطناعي مع جسر أدوات MCP اختياري'
title: واجهات CLI الخلفية
x-i18n:
    generated_at: "2026-05-07T13:17:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **واجهات CLI محلية للذكاء الاصطناعي** كـ **بديل نصي فقط** عند تعطل مزودي API،
أو عند تقييد المعدلات، أو عند حدوث سلوك مؤقت غير صحيح. هذا محافظ عن قصد:

- **لا تُحقن أدوات OpenClaw مباشرة**، لكن الخلفيات التي تحتوي على `bundleMcp: true`
  يمكنها تلقي أدوات Gateway عبر جسر MCP من خلال local loopback.
- **بث JSONL** لواجهات CLI التي تدعمه.
- **الجلسات مدعومة** (بحيث تبقى الجولات اللاحقة متماسكة).
- **يمكن تمرير الصور** إذا كانت CLI تقبل مسارات الصور.

صُمم هذا ليكون **شبكة أمان** وليس مسارا أساسيا. استخدمه عندما تريد
استجابات نصية "تعمل دائما" بدون الاعتماد على واجهات API خارجية.

إذا كنت تريد بيئة تشغيل كاملة مع أدوات تحكم جلسات ACP، ومهام خلفية،
وربط الخيط/المحادثة، وجلسات ترميز خارجية مستمرة، فاستخدم
[ACP Agents](/ar/tools/acp-agents) بدلا من ذلك. خلفيات CLI ليست ACP.

<Tip>
  هل تبني Plugin خلفية جديدا؟ استخدم
  [Plugins خلفية CLI](/ar/plugins/cli-backend-plugins). هذه الصفحة مخصصة للمستخدمين
  الذين يهيئون خلفية مسجلة مسبقا ويشغلونها.
</Tip>

## بداية سريعة مناسبة للمبتدئين

يمكنك استخدام Codex CLI **بدون أي إعداد** (يسجل OpenAI Plugin المضمن
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

هذا كل شيء. لا مفاتيح، ولا إعداد مصادقة إضافي مطلوب سوى CLI نفسها.

إذا كنت تستخدم خلفية CLI مضمنة بوصفها **مزود الرسائل الأساسي** على
مضيف Gateway، فإن OpenClaw يحمّل الآن تلقائيا Plugin المضمن المالك عندما يشير إعدادك
صراحة إلى تلك الخلفية في مرجع نموذج أو ضمن
`agents.defaults.cliBackends`.

## استخدامها كبديل احتياطي

أضف خلفية CLI إلى قائمة البدائل الاحتياطية لديك بحيث لا تعمل إلا عند فشل النماذج الأساسية:

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

- إذا كنت تستخدم `agents.defaults.models` (قائمة السماح)، فيجب عليك تضمين نماذج خلفية CLI هناك أيضا.
- إذا فشل المزود الأساسي (المصادقة، حدود المعدل، انتهاء المهلة)، فسيحاول OpenClaw
  استخدام خلفية CLI بعد ذلك.

## نظرة عامة على الإعداد

توجد جميع خلفيات CLI ضمن:

```
agents.defaults.cliBackends
```

يُفهرس كل إدخال بواسطة **معرف مزود** (مثل `codex-cli`، `my-cli`).
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

## آلية العمل

1. **تختار خلفية** بناء على بادئة المزود (`codex-cli/...`).
2. **تبني مطالبة نظام** باستخدام مطالبة OpenClaw نفسها + سياق مساحة العمل.
3. **تنفذ CLI** مع معرف جلسة (إذا كان مدعوما) حتى يبقى السجل متسقا.
   تحافظ خلفية `claude-cli` المضمنة على عملية Claude stdio حية لكل
   جلسة OpenClaw وترسل الجولات اللاحقة عبر stream-json stdin.
4. **تحلل الإخراج** (JSON أو نص عادي) وتعيد النص النهائي.
5. **تستمر في تخزين معرفات الجلسات** لكل خلفية، بحيث تعيد الجولات اللاحقة استخدام جلسة CLI نفسها.

<Note>
خلفية Anthropic `claude-cli` المضمنة مدعومة مرة أخرى. أخبرنا موظفو Anthropic
أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع
استخدام `claude -p` على أنه مصرح به لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تمرر خلفية OpenAI `codex-cli` المضمنة مطالبة نظام OpenClaw عبر
تجاوز إعداد Codex `model_instructions_file` (`-c
model_instructions_file="..."`). لا يوفّر Codex علما بأسلوب Claude مثل
`--append-system-prompt`، لذلك يكتب OpenClaw المطالبة المجمعة إلى
ملف مؤقت لكل جلسة Codex CLI جديدة.

تتلقى خلفية Anthropic `claude-cli` المضمنة لقطة Skills الخاصة بـ OpenClaw
بطريقتين: كتالوج Skills المضغوط الخاص بـ OpenClaw في مطالبة النظام الملحقة، و
Claude Code Plugin مؤقت يُمرر باستخدام `--plugin-dir`. يحتوي Plugin على
Skills المؤهلة فقط لذلك الوكيل/الجلسة، بحيث يرى محلل المهارات الأصلي في Claude Code
المجموعة المرشحة نفسها التي كان OpenClaw سيعلن عنها بخلاف ذلك في
المطالبة. ما تزال تجاوزات مفاتيح env/API الخاصة بالمهارة تُطبق بواسطة OpenClaw على
بيئة العملية الفرعية للتشغيل.

لدى Claude CLI أيضا وضع أذونات غير تفاعلي خاص به. يربط OpenClaw ذلك
بسياسة التنفيذ الحالية بدلا من إضافة إعداد خاص بـ Claude: عندما تكون
سياسة التنفيذ الفعلية المطلوبة هي YOLO (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، يضيف OpenClaw `--permission-mode bypassPermissions`.
تتجاوز إعدادات `agents.list[].tools.exec` لكل وكيل إعدادات `tools.exec` العامة لذلك
الوكيل. لفرض وضع Claude مختلف، عيّن وسائط خلفية خام صريحة
مثل `--permission-mode default` أو `--permission-mode acceptEdits` ضمن
`agents.defaults.cliBackends.claude-cli.args` و `resumeArgs` المطابقة.

تربط خلفية Anthropic `claude-cli` المضمنة أيضا مستويات OpenClaw `/think`
بعلم Claude Code الأصلي `--effort` للمستويات غير المعطلة. يطابق `minimal` و
`low` مع `low`، ويطابق `adaptive` و `medium` مع `medium`، أما `high`،
و `xhigh`، و `max` فتطابق مباشرة. تحتاج خلفيات CLI الأخرى إلى أن يعلن Plugin المالك لها
مخطط argv مكافئا قبل أن يتمكن `/think` من التأثير في CLI المُشغلة.

قبل أن يتمكن OpenClaw من استخدام خلفية `claude-cli` المضمنة، يجب أن يكون Claude Code نفسه
مسجل الدخول مسبقا على المضيف نفسه:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

استخدم `agents.defaults.cliBackends.claude-cli.command` فقط عندما لا يكون ملف `claude`
الثنائي موجودا بالفعل في `PATH`.

## الجلسات

- إذا كانت CLI تدعم الجلسات، فعيّن `sessionArg` (مثل `--session-id`) أو
  `sessionArgs` (العنصر النائب `{sessionId}`) عندما يلزم إدراج المعرف
  في عدة أعلام.
- إذا كانت CLI تستخدم **أمرا فرعيا للاستئناف** مع أعلام مختلفة، فعيّن
  `resumeArgs` (يستبدل `args` عند الاستئناف) واختياريا `resumeOutput`
  (للاستئنافات غير JSON).
- `sessionMode`:
  - `always`: أرسل دائما معرف جلسة (UUID جديد إذا لم يكن هناك معرف مخزن).
  - `existing`: أرسل معرف جلسة فقط إذا كان قد خُزن من قبل.
  - `none`: لا ترسل معرف جلسة أبدا.
- تضبط `claude-cli` افتراضيا `liveSession: "claude-stdio"`، و `output: "jsonl"`،
  و `input: "stdin"` بحيث تعيد الجولات اللاحقة استخدام عملية Claude الحية أثناء
  نشاطها. stdio الدافئة هي الافتراضي الآن، بما في ذلك الإعدادات المخصصة
  التي تحذف حقول النقل. إذا أُعيد تشغيل Gateway أو خرجت العملية الخاملة،
  يستأنف OpenClaw من معرف جلسة Claude المخزن. تُتحقق معرفات الجلسات
  المخزنة مقابل نص مشروع موجود وقابل للقراءة قبل
  الاستئناف، لذلك تُزال الارتباطات الوهمية مع `reason=transcript-missing`
  بدلا من بدء جلسة Claude CLI جديدة بصمت ضمن `--resume`.
- تحافظ جلسات Claude الحية على حراس إخراج JSONL محدودين. تسمح الافتراضات بما يصل إلى
  8 MiB و 20,000 سطر JSONL خام لكل جولة. يمكن لجولات Claude كثيفة الأدوات رفع
  هذه الحدود لكل خلفية باستخدام
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و `maxTurnLines`؛ يحد OpenClaw هذه الإعدادات إلى 64 MiB و 100,000
  سطر.
- جلسات CLI المخزنة هي استمرارية مملوكة للمزود. لا يقطعها
  إعادة ضبط الجلسة اليومية الضمنية؛ أما `/reset` وسياسات `session.reset` الصريحة فما تزال
  تفعل ذلك.

ملاحظات التسلسل:

- `serialize: true` يحافظ على ترتيب عمليات التشغيل في المسار نفسه.
- معظم واجهات CLI تُسلسل على مسار مزود واحد.
- يتخلى OpenClaw عن إعادة استخدام جلسة CLI المخزنة عندما تتغير هوية المصادقة المحددة،
  بما في ذلك تغير معرف ملف تعريف المصادقة، أو مفتاح API ثابت، أو رمز ثابت، أو هوية حساب
  OAuth عندما تكشفها CLI. لا يقطع تدوير رموز وصول وتحديث OAuth
  جلسة CLI المخزنة. إذا لم تكشف CLI معرف حساب OAuth
  مستقرا، يترك OpenClaw لتلك CLI فرض أذونات الاستئناف.

## تمهيد البديل الاحتياطي من جلسات claude-cli

عندما تفشل محاولة `claude-cli` وتنتقل إلى مرشح غير CLI ضمن
[`agents.defaults.model.fallbacks`](/ar/concepts/model-failover)، يبذر OpenClaw
المحاولة التالية بتمهيد سياق مستخرج من نص JSONL المحلي الخاص بـ Claude Code
عند `~/.claude/projects/`. بدون هذه البذرة، سيبدأ مزود البديل الاحتياطي
باردا لأن نص جلسة OpenClaw نفسه فارغ
لتشغيلات `claude-cli`.

- يفضل التمهيد أحدث ملخص `/compact` أو علامة `compact_boundary`،
  ثم يلحق أحدث الجولات بعد الحد حتى ميزانية أحرف
  محددة. تُحذف الجولات السابقة للحد لأن الملخص يمثلها بالفعل.
- تُدمج كتل الأدوات في تلميحات مضغوطة `(tool call: name)` و
  `(tool result: …)` للحفاظ على صدق ميزانية المطالبة. يُوسم الملخص بـ
  `(truncated)` إذا تجاوز الحد.
- تعتمد بدائل `claude-cli` إلى `claude-cli` من المزود نفسه على `--resume`
  الخاص بـ Claude وتتجاوز التمهيد.
- تعيد البذرة استخدام التحقق الحالي من مسار ملف جلسة Claude، لذلك
  لا يمكن قراءة مسارات عشوائية.

## الصور (تمرير مباشر)

إذا كانت CLI لديك تقبل مسارات الصور، فعيّن `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيكتب OpenClaw صور base64 إلى ملفات مؤقتة. إذا كان `imageArg` معينا، فستُمرر تلك
المسارات كوسائط CLI. إذا كان `imageArg` غير موجود، يلحق OpenClaw
مسارات الملفات بالمطالبة (حقن المسار)، وهو كاف لواجهات CLI التي تحمل
الملفات المحلية تلقائيا من المسارات العادية.

## المدخلات / المخرجات

- يحاول `output: "json"` (الافتراضي) تحليل JSON واستخراج النص + معرف الجلسة.
- بالنسبة لإخراج Gemini CLI بصيغة JSON، يقرأ OpenClaw نص الرد من `response` و
  الاستخدام من `stats` عندما تكون `usage` مفقودة أو فارغة.
- يحلل `output: "jsonl"` تدفقات JSONL (على سبيل المثال Codex CLI `--json`) ويستخرج رسالة الوكيل النهائية بالإضافة إلى معرفات الجلسة
  عند وجودها.
- يتعامل `output: "text"` مع stdout بوصفه الاستجابة النهائية.

أوضاع الإدخال:

- يمرر `input: "arg"` (الافتراضي) المطالبة كآخر وسيطة CLI.
- يرسل `input: "stdin"` المطالبة عبر stdin.
- إذا كانت المطالبة طويلة جدا وكان `maxPromptArgChars` معينا، فسيُستخدم stdin.

## الافتراضيات (مملوكة للـ Plugin)

يسجل OpenAI Plugin المضمن أيضا افتراضيا لـ `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

يسجل Google Plugin المضمن أيضا افتراضيا لـ `google-gemini-cli`:

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

ملاحظات JSON في Gemini CLI:

- يُقرأ نص الرد من حقل JSON `response`.
- يعود الاستخدام إلى `stats` عندما تكون `usage` غائبة أو فارغة.
- تُطبَّع `stats.cached` إلى `cacheRead` في OpenClaw.
- إذا كانت `stats.input` مفقودة، يستنتج OpenClaw رموز الإدخال من
  `stats.input_tokens - stats.cached`.

لا تتجاوز إلا عند الحاجة (الشائع: مسار `command` مطلق).

## الإعدادات الافتراضية المملوكة لـ Plugin

أصبحت الإعدادات الافتراضية لخلفية CLI الآن جزءًا من سطح Plugin:

- تسجلها Plugins باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالخلفية بادئة المزوّد في مراجع النماذج.
- لا يزال تكوين المستخدم في `agents.defaults.cliBackends.<id>` يتجاوز الإعداد الافتراضي لـ Plugin.
- يبقى تنظيف التكوين الخاص بالخلفية مملوكًا لـ Plugin عبر الخطاف الاختياري
  `normalizeConfig`.

يمكن لـ Plugins التي تحتاج إلى طبقات توافق صغيرة للمطالبة/الرسالة أن تعلن
تحويلات نصية ثنائية الاتجاه دون استبدال مزوّد أو خلفية CLI:

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

بالنسبة إلى أدوات CLI التي تصدر JSONL متوافقًا مع Claude Code stream-json، اضبط
`jsonlDialect: "claude-stream-json"` على تكوين تلك الخلفية.

## تراكبات MCP المجمعة

لا تتلقى خلفيات CLI استدعاءات أدوات OpenClaw مباشرةً، لكن يمكن للخلفية
الاشتراك في تراكب تكوين MCP مولَّد باستخدام `bundleMcp: true`.

السلوك المجمّع الحالي:

- `claude-cli`: ملف تكوين MCP صارم مولَّد
- `codex-cli`: تجاوزات تكوين مضمنة لـ `mcp_servers`؛ يُعلَّم خادم
  OpenClaw loopback المولَّد بوضع موافقة أدوات Codex لكل خادم
  حتى لا تتوقف استدعاءات MCP عند مطالبات الموافقة المحلية
- `google-gemini-cli`: ملف إعدادات نظام Gemini مولَّد

عند تمكين MCP المجمّع، يقوم OpenClaw بما يلي:

- ينشئ خادم HTTP MCP loopback يعرّض أدوات Gateway لعملية CLI
- يصادق الجسر باستخدام رمز مميز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يقيّد الوصول إلى الأدوات بسياق الجلسة والحساب والقناة الحالي
- يحمّل خوادم bundle-MCP الممكّنة لمساحة العمل الحالية
- يدمجها مع أي شكل تكوين/إعدادات MCP موجود للخلفية
- يعيد كتابة تكوين التشغيل باستخدام وضع التكامل المملوك للخلفية من الامتداد المالك

إذا لم تكن أي خوادم MCP ممكّنة، يظل OpenClaw يحقن تكوينًا صارمًا عندما
تشترك خلفية في MCP المجمّع حتى تبقى عمليات التشغيل في الخلفية معزولة.

تُخزَّن أوقات تشغيل MCP المجمّعة ذات نطاق الجلسة مؤقتًا لإعادة استخدامها داخل الجلسة، ثم
تُزال بعد `mcp.sessionIdleTtlMs` مللي ثانية من وقت الخمول (الافتراضي 10
دقائق؛ اضبط `0` للتعطيل). تطلب عمليات التشغيل المضمّنة لمرة واحدة مثل تحقيقات المصادقة،
وتوليد المعرفات المختصرة، واستدعاء Active Memory التنظيف عند نهاية التشغيل حتى لا تتجاوز
عمليات stdio الفرعية وتدفقات Streamable HTTP/SSE مدة التشغيل.

## القيود

- **لا توجد استدعاءات مباشرة لأدوات OpenClaw.** لا يحقن OpenClaw استدعاءات الأدوات في
  بروتوكول خلفية CLI. لا ترى الخلفيات أدوات Gateway إلا عند اشتراكها في
  `bundleMcp: true`.
- **البث خاص بالخلفية.** تبث بعض الخلفيات JSONL؛ بينما تخزن أخرى مؤقتًا
  حتى الخروج.
- **المخرجات المهيكلة** تعتمد على تنسيق JSON الخاص بـ CLI.
- **جلسات Codex CLI** تُستأنف عبر إخراج نصي (بدون JSONL)، وهو أقل
  هيكلة من تشغيل `--json` الأولي. لا تزال جلسات OpenClaw تعمل
  بشكل طبيعي.

## استكشاف الأخطاء وإصلاحها

- **تعذر العثور على CLI**: اضبط `command` إلى مسار كامل.
- **اسم نموذج خاطئ**: استخدم `modelAliases` لتعيين `provider/model` → نموذج CLI.
- **لا يوجد استمرارية للجلسة**: تأكد من ضبط `sessionArg` وأن `sessionMode` ليس
  `none` (لا يمكن لـ Codex CLI حاليًا الاستئناف بإخراج JSON).
- **الصور مُتجاهلة**: اضبط `imageArg` (وتحقق من أن CLI يدعم مسارات الملفات).

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [النماذج المحلية](/ar/gateway/local-models)
