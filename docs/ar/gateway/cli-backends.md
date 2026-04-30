---
read_when:
    - تريد خيارًا احتياطيًا موثوقًا عند فشل مزوّدي API
    - أنت تشغّل Codex CLI أو أدوات CLI محلية أخرى للذكاء الاصطناعي وتريد إعادة استخدامها
    - تريد فهم جسر الاسترجاع الحلقي لـ MCP للوصول إلى أدوات الواجهة الخلفية عبر CLI
summary: 'واجهات CLI الخلفية: بديل احتياطي محلي لـ CLI الذكاء الاصطناعي مع جسر أدوات MCP اختياري'
title: الواجهات الخلفية لـ CLI
x-i18n:
    generated_at: "2026-04-30T07:56:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 438862ed127a823dcdedc4aacb77b2facb13caa08f7986ef8402833777b6574e
    source_path: gateway/cli-backends.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **واجهات CLI للذكاء الاصطناعي المحلية** كـ **حل احتياطي نصي فقط** عندما تكون موفّرات API متوقفة،
أو محدودة المعدل، أو تتصرف بشكل غير صحيح مؤقتًا. هذا محافظ عمدًا:

- **لا تُحقن أدوات OpenClaw مباشرةً**، لكن الخلفيات التي تحتوي على `bundleMcp: true`
  يمكنها تلقي أدوات Gateway عبر جسر MCP باستخدام local loopback.
- **بث JSONL** لواجهات CLI التي تدعمه.
- **الجلسات مدعومة** (لذلك تبقى المتابعات مترابطة).
- **يمكن تمرير الصور** إذا كانت واجهة CLI تقبل مسارات الصور.

صُمم هذا كـ **شبكة أمان** وليس كمسار أساسي. استخدمه عندما تريد
استجابات نصية "تعمل دائمًا" دون الاعتماد على واجهات API خارجية.

إذا كنت تريد بيئة تشغيل كاملة مع عناصر تحكم جلسات ACP، ومهام خلفية،
وربط السلاسل/المحادثات، وجلسات ترميز خارجية مستمرة، فاستخدم
[وكلاء ACP](/ar/tools/acp-agents) بدلًا من ذلك. خلفيات CLI ليست ACP.

## بداية سريعة مناسبة للمبتدئين

يمكنك استخدام Codex CLI **دون أي إعدادات** (يسجل Plugin OpenAI المضمّن
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

هذا كل شيء. لا توجد مفاتيح، ولا حاجة إلى إعدادات مصادقة إضافية غير واجهة CLI نفسها.

إذا استخدمت خلفية CLI مضمّنة كـ **موفّر الرسائل الأساسي** على مضيف
Gateway، فإن OpenClaw يحمّل الآن تلقائيًا Plugin المضمّن المالك عندما تشير إعداداتك
صراحةً إلى تلك الخلفية في مرجع نموذج أو ضمن
`agents.defaults.cliBackends`.

## استخدامها كحل احتياطي

أضف خلفية CLI إلى قائمة الاحتياطيات لديك بحيث تعمل فقط عندما تفشل النماذج الأساسية:

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

- إذا كنت تستخدم `agents.defaults.models` (قائمة سماح)، فيجب أن تدرج نماذج خلفية CLI لديك هناك أيضًا.
- إذا فشل الموفّر الأساسي (المصادقة، حدود المعدل، انتهاء المهلة)، فسيحاول OpenClaw
  استخدام خلفية CLI بعد ذلك.

## نظرة عامة على الإعدادات

توجد كل خلفيات CLI ضمن:

```
agents.defaults.cliBackends
```

كل إدخال يُفهرس بواسطة **معرّف موفّر** (مثل `codex-cli`، `my-cli`).
يصبح معرّف الموفّر الجانب الأيسر من مرجع النموذج لديك:

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

## كيف تعمل

1. **تحدد خلفية** بناءً على بادئة الموفّر (`codex-cli/...`).
2. **تبني موجّه نظام** باستخدام موجّه OpenClaw نفسه + سياق مساحة العمل.
3. **تنفذ واجهة CLI** مع معرّف جلسة (إذا كان مدعومًا) بحيث يبقى السجل متسقًا.
   تحافظ خلفية `claude-cli` المضمّنة على عملية Claude stdio نشطة لكل
   جلسة OpenClaw وترسل المتابعات عبر stream-json stdin.
4. **تحلل المخرجات** (JSON أو نص عادي) وتعيد النص النهائي.
5. **تستمر في تخزين معرّفات الجلسات** لكل خلفية، بحيث تعيد المتابعات استخدام جلسة CLI نفسها.

<Note>
أصبحت خلفية Anthropic `claude-cli` المضمّنة مدعومة مجددًا. أخبرنا موظفو Anthropic
أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع
استخدام `claude -p` على أنه معتمد لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تمرر خلفية OpenAI `codex-cli` المضمّنة موجّه نظام OpenClaw عبر
تجاوز إعدادات `model_instructions_file` في Codex (`-c
model_instructions_file="..."`). لا يوفّر Codex علمًا بأسلوب Claude مثل
`--append-system-prompt`، لذلك يكتب OpenClaw الموجّه المجمّع إلى
ملف مؤقت لكل جلسة Codex CLI جديدة.

تتلقى خلفية Anthropic `claude-cli` المضمّنة لقطة Skills الخاصة بـ OpenClaw
بطريقتين: كتالوج OpenClaw Skills المضغوط في موجّه النظام الملحق، و
Plugin مؤقت لـ Claude Code يُمرر باستخدام `--plugin-dir`. يحتوي Plugin
فقط على Skills المؤهلة لذلك الوكيل/الجلسة، بحيث يرى محلل Skills الأصلي في Claude Code
المجموعة المفلترة نفسها التي كان OpenClaw سيعلن عنها في
الموجّه. لا تزال تجاوزات مفاتيح env/API الخاصة بـ Skills تُطبق بواسطة OpenClaw على
بيئة العملية الفرعية للتشغيل.

يمتلك Claude CLI أيضًا وضع أذونات غير تفاعلي خاصًا به. يطابق OpenClaw ذلك
مع سياسة التنفيذ الحالية بدلًا من إضافة إعدادات خاصة بـ Claude: عندما تكون
سياسة التنفيذ المطلوبة الفعالة هي YOLO (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، يضيف OpenClaw `--permission-mode bypassPermissions`.
تتجاوز إعدادات `agents.list[].tools.exec` لكل وكيل إعدادات `tools.exec` العامة لذلك
الوكيل. لفرض وضع Claude مختلف، عيّن وسائط خلفية خام صريحة
مثل `--permission-mode default` أو `--permission-mode acceptEdits` ضمن
`agents.defaults.cliBackends.claude-cli.args` و`resumeArgs` المطابقة.

قبل أن يتمكن OpenClaw من استخدام خلفية `claude-cli` المضمّنة، يجب أن يكون Claude Code نفسه
مسجّل الدخول مسبقًا على المضيف نفسه:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

استخدم `agents.defaults.cliBackends.claude-cli.command` فقط عندما لا يكون ملف `claude`
الثنائي موجودًا بالفعل على `PATH`.

## الجلسات

- إذا كانت واجهة CLI تدعم الجلسات، فعيّن `sessionArg` (مثل `--session-id`) أو
  `sessionArgs` (العنصر النائب `{sessionId}`) عندما يلزم إدراج المعرّف
  في أعلام متعددة.
- إذا كانت واجهة CLI تستخدم **أمرًا فرعيًا للاستئناف** مع أعلام مختلفة، فعيّن
  `resumeArgs` (يستبدل `args` عند الاستئناف) واختياريًا `resumeOutput`
  (لعمليات الاستئناف غير JSON).
- `sessionMode`:
  - `always`: أرسل دائمًا معرّف جلسة (UUID جديد إذا لم يكن مخزنًا).
  - `existing`: أرسل معرّف جلسة فقط إذا كان مخزنًا من قبل.
  - `none`: لا ترسل معرّف جلسة أبدًا.
- يستخدم `claude-cli` افتراضيًا `liveSession: "claude-stdio"`، و`output: "jsonl"`،
  و`input: "stdin"` بحيث تعيد المتابعات استخدام عملية Claude النشطة أثناء
  نشاطها. أصبح stdio الدافئ هو الافتراضي الآن، بما في ذلك للإعدادات المخصصة
  التي تحذف حقول النقل. إذا أُعيد تشغيل Gateway أو خرجت العملية الخاملة،
  يستأنف OpenClaw من معرّف جلسة Claude المخزن. يتم التحقق من معرّفات الجلسات
  المخزنة مقابل نص مشروع موجود وقابل للقراءة قبل
  الاستئناف، لذلك تُمسح الارتباطات الوهمية باستخدام `reason=transcript-missing`
  بدلًا من بدء جلسة Claude CLI جديدة بصمت ضمن `--resume`.
- جلسات CLI المخزنة هي استمرارية مملوكة للموفّر. لا يقطعها إعادة ضبط الجلسة اليومية
  الضمنية؛ لا تزال سياسات `/reset` و`session.reset` الصريحة
  تفعل ذلك.

ملاحظات التسلسل:

- يحافظ `serialize: true` على ترتيب عمليات التشغيل في المسار نفسه.
- معظم واجهات CLI تسلسل على مسار موفّر واحد.
- يتخلى OpenClaw عن إعادة استخدام جلسة CLI المخزنة عندما تتغير هوية المصادقة المحددة،
  بما في ذلك تغيّر معرّف ملف تعريف المصادقة، أو مفتاح API ثابت، أو رمز ثابت، أو هوية
  حساب OAuth عندما تكشف واجهة CLI واحدة. لا يقطع تدوير رموز وصول OAuth وتحديثها
  جلسة CLI المخزنة. إذا لم تكشف واجهة CLI عن معرّف حساب OAuth
  ثابت، يترك OpenClaw لتلك الواجهة فرض أذونات الاستئناف.

## تمهيد احتياطي من جلسات claude-cli

عندما تفشل محاولة `claude-cli` وتنتقل إلى مرشح غير CLI في
[`agents.defaults.model.fallbacks`](/ar/concepts/model-failover)، يزرع OpenClaw
المحاولة التالية بتمهيد سياقي مستخلص من سجل JSONL المحلي الخاص بـ Claude Code
في `~/.claude/projects/`. من دون هذه البذرة، سيبدأ الموفّر الاحتياطي
باردًا لأن سجل جلسة OpenClaw نفسه فارغ
لتشغيلات `claude-cli`.

- يفضل التمهيد أحدث ملخص `/compact` أو علامة `compact_boundary`،
  ثم يلحق أحدث المتابعات بعد الحد حتى ميزانية أحرف
  محددة. تُحذف المتابعات السابقة للحد لأن الملخص يمثّلها بالفعل.
- تُدمج كتل الأدوات إلى تلميحات مضغوطة `(tool call: name)` و
  `(tool result: …)` للحفاظ على ميزانية الموجّه بدقة. يُوسم الملخص
  بـ `(truncated)` إذا تجاوز الحد.
- تعتمد احتياطيات `claude-cli` إلى `claude-cli` للموفّر نفسه على
  `--resume` الخاص بـ Claude وتتخطى التمهيد.
- تعيد البذرة استخدام تحقق مسار ملف جلسة Claude الحالي، لذلك
  لا يمكن قراءة مسارات عشوائية.

## الصور (تمرير مباشر)

إذا كانت واجهة CLI لديك تقبل مسارات الصور، فعيّن `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيكتب OpenClaw صور base64 إلى ملفات مؤقتة. إذا تم تعيين `imageArg`، فستُمرر تلك
المسارات كوسائط CLI. إذا كان `imageArg` مفقودًا، يلحق OpenClaw
مسارات الملفات بالموجّه (حقن المسار)، وهذا يكفي لواجهات CLI التي تحمّل تلقائيًا
الملفات المحلية من المسارات العادية.

## المدخلات / المخرجات

- يحاول `output: "json"` (الافتراضي) تحليل JSON واستخراج النص + معرّف الجلسة.
- بالنسبة إلى مخرجات JSON في Gemini CLI، يقرأ OpenClaw نص الرد من `response` و
  الاستخدام من `stats` عندما يكون `usage` مفقودًا أو فارغًا.
- يحلل `output: "jsonl"` تدفقات JSONL (مثل Codex CLI `--json`) ويستخرج رسالة الوكيل النهائية بالإضافة إلى معرّفات الجلسة
  عند وجودها.
- يتعامل `output: "text"` مع stdout على أنه الاستجابة النهائية.

أوضاع الإدخال:

- يمرر `input: "arg"` (الافتراضي) الموجّه كآخر وسيطة CLI.
- يرسل `input: "stdin"` الموجّه عبر stdin.
- إذا كان الموجّه طويلًا جدًا وتم تعيين `maxPromptArgChars`، فسيُستخدم stdin.

## الافتراضيات (مملوكة للـ Plugin)

يسجل Plugin OpenAI المضمّن أيضًا افتراضيًا لـ `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

يسجل Plugin Google المضمّن أيضًا افتراضيًا لـ `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

المتطلب السابق: يجب تثبيت Gemini CLI المحلي وإتاحته كـ
`gemini` على `PATH` (`brew install gemini-cli` أو
`npm install -g @google/gemini-cli`).

ملاحظات JSON في Gemini CLI:

- يُقرأ نص الرد من حقل JSON `response`.
- يعود الاستخدام إلى `stats` عندما يكون `usage` غائبًا أو فارغًا.
- يُوحّد `stats.cached` إلى `cacheRead` في OpenClaw.
- إذا كان `stats.input` مفقودًا، يشتق OpenClaw رموز الإدخال من
  `stats.input_tokens - stats.cached`.

تجاوز فقط عند الحاجة (الشائع: مسار `command` مطلق).

## الافتراضيات المملوكة للـ Plugin

أصبحت افتراضيات خلفية CLI الآن جزءًا من سطح Plugin:

- تسجلها Plugins باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالخلفية بادئة الموفّر في مراجع النماذج.
- لا تزال إعدادات المستخدم في `agents.defaults.cliBackends.<id>` تتجاوز الافتراضي الخاص بالـ Plugin.
- يبقى تنظيف الإعدادات الخاص بالخلفية مملوكًا للـ Plugin عبر
  خطاف `normalizeConfig` الاختياري.

يمكن لـ Plugins التي تحتاج إلى حشوات توافق صغيرة للمطالبات/الرسائل أن تعلن
تحويلات نصية ثنائية الاتجاه دون استبدال موفّر أو خلفية CLI:

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
كتابة دلتا المساعد المتدفقة والنص النهائي المحلّل قبل أن يعالج OpenClaw
علامات التحكم الخاصة به وتسليم القناة.

بالنسبة إلى CLIs التي تصدر JSONL متوافقًا مع Claude Code stream-json، عيّن
`jsonlDialect: "claude-stream-json"` في تكوين تلك الخلفية.

## تجميع تراكبات MCP

لا تتلقى خلفيات CLI استدعاءات أدوات OpenClaw مباشرة، لكن يمكن للخلفية أن
تختار تراكب تكوين MCP مُولّدًا باستخدام `bundleMcp: true`.

السلوك المضمّن الحالي:

- `claude-cli`: ملف تكوين MCP صارم مُولّد
- `codex-cli`: تجاوزات تكوين مضمنة لـ `mcp_servers`؛ يُعلَّم خادم
  OpenClaw loopback المُولّد بوضع موافقة الأدوات لكل خادم الخاص بـ Codex
  حتى لا تتوقف استدعاءات MCP بسبب مطالبات الموافقة المحلية
- `google-gemini-cli`: ملف إعدادات نظام Gemini مُولّد

عند تمكين تجميع MCP، يقوم OpenClaw بما يلي:

- يشغّل خادم MCP عبر HTTP loopback يعرّض أدوات Gateway لعملية CLI
- يصادق على الجسر باستخدام رمز مميز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يحصر وصول الأدوات في الجلسة والحساب وسياق القناة الحالية
- يحمّل خوادم bundle-MCP الممكّنة لمساحة العمل الحالية
- يدمجها مع أي شكل موجود لتكوين/إعدادات MCP الخلفية
- يعيد كتابة تكوين التشغيل باستخدام وضع التكامل المملوك للخلفية من الامتداد المالك

إذا لم تكن هناك خوادم MCP ممكّنة، فسيظل OpenClaw يحقن تكوينًا صارمًا عندما
تختار خلفية ما تجميع MCP حتى تبقى عمليات التشغيل في الخلفية معزولة.

تُخزّن أزمنة تشغيل MCP المضمّنة والمقيّدة بنطاق الجلسة مؤقتًا لإعادة استخدامها داخل الجلسة، ثم
تُزال بعد `mcp.sessionIdleTtlMs` مللي ثانية من وقت الخمول (الافتراضي 10
دقائق؛ اضبط `0` للتعطيل). تنظّف عمليات التشغيل المضمنة لمرة واحدة مثل تحقيقات المصادقة،
وتوليد الـ slug، وطلب استرجاع Active Memory عند نهاية التشغيل حتى لا تستمر
عمليات stdio الفرعية وتدفقات Streamable HTTP/SSE بعد انتهاء التشغيل.

## القيود

- **لا توجد استدعاءات مباشرة لأدوات OpenClaw.** لا يحقن OpenClaw استدعاءات الأدوات في
  بروتوكول خلفية CLI. لا ترى الخلفيات أدوات Gateway إلا عندما تختار
  `bundleMcp: true`.
- **البث خاص بالخلفية.** بعض الخلفيات تبث JSONL؛ بينما تخزّن أخرى
  حتى الخروج.
- **المخرجات المهيكلة** تعتمد على تنسيق JSON الخاص بـ CLI.
- **جلسات Codex CLI** تُستأنف عبر إخراج نصي (بدون JSONL)، وهو أقل
  هيكلة من تشغيل `--json` الأولي. تظل جلسات OpenClaw تعمل
  بشكل طبيعي.

## استكشاف الأخطاء وإصلاحها

- **CLI غير موجود**: عيّن `command` إلى مسار كامل.
- **اسم النموذج خاطئ**: استخدم `modelAliases` لتعيين `provider/model` → نموذج CLI.
- **لا توجد استمرارية للجلسة**: تأكد من تعيين `sessionArg` وأن `sessionMode` ليس
  `none` (لا يستطيع Codex CLI حاليًا الاستئناف مع إخراج JSON).
- **تم تجاهل الصور**: عيّن `imageArg` (وتحقق من أن CLI يدعم مسارات الملفات).

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [النماذج المحلية](/ar/gateway/local-models)
