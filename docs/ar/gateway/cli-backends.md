---
read_when:
    - تريد بديلًا موثوقًا عندما تفشل موفرو API
    - أنت تشغّل Codex CLI أو غيره من واجهات CLI المحلية للذكاء الاصطناعي وتريد إعادة استخدامها
    - تريد فهم جسر MCP عبر local loopback للوصول إلى أدوات الواجهة الخلفية لـ CLI
summary: 'واجهات CLI الخلفية: بديل CLI للذكاء الاصطناعي المحلي مع جسر أداة MCP اختياري'
title: واجهات CLI الخلفية
x-i18n:
    generated_at: "2026-04-23T14:55:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff7458d18b8a5b716930579241177917fd3edffcf7f6e211c7d570cf76519316
    source_path: gateway/cli-backends.md
    workflow: 15
---

# واجهات CLI الخلفية (بيئة تشغيل احتياطية)

يمكن لـ OpenClaw تشغيل **واجهات CLI محلية للذكاء الاصطناعي** كخيار **احتياطي نصّي فقط** عندما تتعطل موفرو API،
أو تُفرض حدود معدل عليها، أو تتصرف بشكل غير سليم مؤقتًا. هذا النهج متحفظ عمدًا:

- **لا يتم حقن أدوات OpenClaw مباشرةً**، لكن الواجهات الخلفية التي تحتوي على `bundleMcp: true`
  يمكنها تلقّي أدوات Gateway عبر جسر MCP حلقي.
- **بث JSONL** لواجهات CLI التي تدعم ذلك.
- **الجلسات مدعومة** (بحيث تظل الرسائل اللاحقة مترابطة).
- **يمكن تمرير الصور** إذا كانت واجهة CLI تقبل مسارات الصور.

هذا مصمم ليكون **شبكة أمان** أكثر من كونه مسارًا أساسيًا. استخدمه عندما
تريد استجابات نصية “تعمل دائمًا” من دون الاعتماد على واجهات API خارجية.

إذا كنت تريد بيئة تشغيل كاملة مع عناصر تحكم جلسات ACP، والمهام الخلفية،
وربط الخيوط/المحادثات، وجلسات ترميز خارجية دائمة، فاستخدم
[عوامل ACP](/ar/tools/acp-agents) بدلًا من ذلك. واجهات CLI الخلفية ليست ACP.

## بداية سريعة مناسبة للمبتدئين

يمكنك استخدام Codex CLI **من دون أي إعداد** (إذ يسجّل OpenAI Plugin
المضمّن واجهة خلفية افتراضية):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

إذا كان Gateway يعمل تحت launchd/systemd وكانت قيمة PATH محدودة، فأضف فقط
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

إذا كنت تستخدم واجهة CLI خلفية مضمّنة بصفتها **موفر الرسائل الأساسي** على
مضيف Gateway، فإن OpenClaw الآن يحمّل Plugin المضمّن المالك تلقائيًا عندما
يشير إعدادك صراحةً إلى تلك الواجهة الخلفية في مرجع نموذج أو تحت
`agents.defaults.cliBackends`.

## استخدامه كخيار احتياطي

أضف واجهة CLI خلفية إلى قائمة البدائل لديك لكي لا تعمل إلا عندما تفشل النماذج الأساسية:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

ملاحظات:

- إذا كنت تستخدم `agents.defaults.models` (قائمة السماح)، فيجب أن تضمّن نماذج واجهة CLI الخلفية هناك أيضًا.
- إذا فشل الموفر الأساسي (المصادقة، حدود المعدل، المهلات)، فسيحاول OpenClaw
  استخدام واجهة CLI الخلفية بعده.

## نظرة عامة على الإعداد

توجد كل واجهات CLI الخلفية تحت:

```
agents.defaults.cliBackends
```

يكون كل إدخال مقيّدًا بواسطة **معرّف موفر** (مثل `codex-cli` أو `my-cli`).
ويصبح معرّف الموفر هو الجزء الأيسر من مرجع النموذج لديك:

```
<provider>/<model>
```

### مثال على الإعداد

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
          // يمكن لواجهات CLI بنمط Codex الإشارة إلى ملف prompt بدلًا من ذلك:
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

1. **يحدّد واجهة خلفية** استنادًا إلى بادئة الموفر (`codex-cli/...`).
2. **يبني system prompt** باستخدام prompt نفسه من OpenClaw + سياق مساحة العمل.
3. **ينفّذ CLI** باستخدام معرّف جلسة (إذا كان مدعومًا) بحيث يظل السجل متسقًا.
   تحافظ الواجهة الخلفية المضمّنة `claude-cli` على عملية Claude stdio قيد التشغيل لكل
   جلسة OpenClaw وترسل الرسائل اللاحقة عبر stream-json stdin.
4. **يحلّل المخرجات** (JSON أو نص عادي) ويعيد النص النهائي.
5. **يحفظ معرّفات الجلسات** لكل واجهة خلفية، بحيث تعيد الرسائل اللاحقة استخدام جلسة CLI نفسها.

<Note>
أصبحت الواجهة الخلفية المضمّنة `claude-cli` من Anthropic مدعومة مرة أخرى. أخبرنا
موظفو Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح مجددًا، لذلك يعامل OpenClaw
استخدام `claude -p` على أنه معتمد لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تمرر الواجهة الخلفية المضمّنة `codex-cli` من OpenAI system prompt الخاص بـ OpenClaw عبر
تجاوز إعداد `model_instructions_file` في Codex (`-c
model_instructions_file="..."`). لا يوفّر Codex علامة
`--append-system-prompt` على نمط Claude، لذا يكتب OpenClaw prompt المجمّع إلى
ملف مؤقت لكل جلسة Codex CLI جديدة.

تتلقى الواجهة الخلفية المضمّنة `claude-cli` من Anthropic لقطة Skills الخاصة بـ OpenClaw
بطريقتين: فهرس Skills المضغوط الخاص بـ OpenClaw ضمن system prompt المُلحق، و
Claude Code Plugin مؤقت يُمرَّر مع `--plugin-dir`. يحتوي Plugin
فقط على Skills المؤهلة لذلك العامل/تلك الجلسة، بحيث يرى محلّل Skills الأصلي في Claude Code
المجموعة المصفّاة نفسها التي كان OpenClaw سيعلنها في prompt بطريقة أخرى.
ولا يزال OpenClaw يطبّق تجاوزات متغيرات البيئة/مفاتيح API الخاصة بـ Skills على بيئة العملية الفرعية أثناء التشغيل.

قبل أن يتمكن OpenClaw من استخدام الواجهة الخلفية المضمّنة `claude-cli`، يجب أن يكون Claude Code نفسه
قد سجّل الدخول بالفعل على المضيف نفسه:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

استخدم `agents.defaults.cliBackends.claude-cli.command` فقط عندما لا يكون ملف
`claude` التنفيذي موجودًا أصلًا على `PATH`.

## الجلسات

- إذا كانت واجهة CLI تدعم الجلسات، فعيّن `sessionArg` (مثل `--session-id`) أو
  `sessionArgs` (العنصر النائب `{sessionId}`) عندما يلزم إدراج المعرّف
  في عدة علامات.
- إذا كانت واجهة CLI تستخدم **أمرًا فرعيًا للاستئناف** بعلامات مختلفة، فعيّن
  `resumeArgs` (يستبدل `args` عند الاستئناف) واختياريًا `resumeOutput`
  (لعمليات الاستئناف غير المعتمدة على JSON).
- `sessionMode`:
  - `always`: يرسل دائمًا معرّف جلسة (UUID جديد إذا لم يكن هناك معرّف محفوظ).
  - `existing`: يرسل معرّف جلسة فقط إذا كان قد تم حفظه مسبقًا.
  - `none`: لا يرسل معرّف جلسة أبدًا.
- يستخدم `claude-cli` افتراضيًا `liveSession: "claude-stdio"` و`output: "jsonl"`
  و`input: "stdin"` بحيث تعيد الرسائل اللاحقة استخدام عملية Claude الحية بينما
  تظل نشطة. أصبح stdio الدافئ هو الافتراضي الآن، بما في ذلك للإعدادات المخصصة
  التي تُهمل حقول النقل. إذا أُعيد تشغيل Gateway أو خرجت العملية الخاملة،
  يستأنف OpenClaw من معرّف جلسة Claude المخزّن. ويجري التحقق من معرّفات الجلسات
  المخزّنة مقابل transcript مشروع موجود وقابل للقراءة قبل
  الاستئناف، بحيث تُزال الارتباطات الوهمية مع `reason=transcript-missing`
  بدلًا من بدء جلسة Claude CLI جديدة بصمت تحت `--resume`.
- جلسات CLI المخزّنة هي استمرارية مملوكة للموفر. إعادة تعيين الجلسة اليومية
  الضمنية لا تقطعها؛ لكن `/reset` وسياسات `session.reset` الصريحة يفعلان ذلك.

ملاحظات التسلسل:

- يجعل `serialize: true` التشغيلات في المسار نفسه مرتبة.
- معظم واجهات CLI تسلسل التنفيذ على مسار موفر واحد.
- يسقط OpenClaw إعادة استخدام جلسة CLI المخزّنة عندما تتغير هوية المصادقة المحددة،
  بما في ذلك تغيّر معرّف ملف تعريف المصادقة، أو مفتاح API الثابت، أو الرمز الثابت،
  أو هوية حساب OAuth عندما تكشفها واجهة CLI. أما تدوير
  رمز الوصول أو رمز التحديث في OAuth فلا يقطع جلسة CLI المخزّنة. وإذا لم تكشف
  واجهة CLI عن معرّف حساب OAuth ثابت، فيترك OpenClaw لتلك الواجهة فرض أذونات الاستئناف.

## الصور (تمرير مباشر)

إذا كانت واجهة CLI لديك تقبل مسارات الصور، فعيّن `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيكتب OpenClaw الصور المرمّزة base64 إلى ملفات مؤقتة. إذا تم تعيين `imageArg`، فستمرَّر هذه
المسارات كوسائط CLI. وإذا كان `imageArg` غير موجود، فسيُلحق OpenClaw
مسارات الملفات بـ prompt (حقن المسار)، وهذا يكفي لواجهات CLI التي تحمّل
الملفات المحلية تلقائيًا من المسارات النصية العادية.

## المدخلات / المخرجات

- يحاول `output: "json"` (الافتراضي) تحليل JSON واستخراج النص + معرّف الجلسة.
- بالنسبة إلى مخرجات JSON في Gemini CLI، يقرأ OpenClaw نص الرد من `response` و
  بيانات الاستخدام من `stats` عندما تكون `usage` مفقودة أو فارغة.
- يحلل `output: "jsonl"` تدفقات JSONL (مثل Codex CLI `--json`) ويستخرج رسالة العامل النهائية بالإضافة إلى
  معرّفات الجلسة عند وجودها.
- يتعامل `output: "text"` مع stdout بوصفه الاستجابة النهائية.

أوضاع الإدخال:

- يمرّر `input: "arg"` (الافتراضي) prompt باعتباره آخر وسيط CLI.
- يرسل `input: "stdin"` prompt عبر stdin.
- إذا كان prompt طويلًا جدًا وتم تعيين `maxPromptArgChars`، فسيُستخدم stdin.

## الإعدادات الافتراضية (مملوكة للـ Plugin)

يسجّل OpenAI Plugin المضمّن أيضًا إعدادًا افتراضيًا لـ `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

يسجّل Google Plugin المضمّن أيضًا إعدادًا افتراضيًا لـ `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

المتطلب الأساسي: يجب أن تكون Gemini CLI المحلية مثبّتة ومتاحة باسم
`gemini` على `PATH` (`brew install gemini-cli` أو
`npm install -g @google/gemini-cli`).

ملاحظات JSON الخاصة بـ Gemini CLI:

- يُقرأ نص الرد من الحقل JSON `response`.
- يعود الاستخدام إلى `stats` عندما تكون `usage` غائبة أو فارغة.
- يُطبّع `stats.cached` إلى OpenClaw `cacheRead`.
- إذا كانت `stats.input` مفقودة، فيشتق OpenClaw رموز الإدخال من
  `stats.input_tokens - stats.cached`.

قم بالتجاوز فقط عند الحاجة (الأمر الشائع: مسار `command` مطلق).

## الإعدادات الافتراضية المملوكة للـ Plugin

أصبحت الإعدادات الافتراضية لواجهات CLI الخلفية الآن جزءًا من سطح Plugin:

- تسجّلها Plugins باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالواجهة الخلفية هو بادئة الموفر في مراجع النماذج.
- يظل إعداد المستخدم في `agents.defaults.cliBackends.<id>` يتجاوز الإعداد الافتراضي للـ Plugin.
- يظل تنظيف الإعدادات الخاصة بالواجهة الخلفية مملوكًا للـ Plugin عبر
  خطاف `normalizeConfig` الاختياري.

يمكن لـ Plugins التي تحتاج إلى مواءمات طفيفة جدًا لتوافق prompt/الرسائل أن تعلن
تحويلات نصية ثنائية الاتجاه من دون استبدال موفر أو واجهة CLI خلفية:

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

يعيد `input` كتابة system prompt وprompt المستخدم الممرَّرين إلى واجهة CLI. ويعيد
`output` كتابة الدفقات الجزئية للمساعد والنص النهائي المحلَّل قبل أن يتعامل OpenClaw مع
علامات التحكم الخاصة به وتسليم القناة.

بالنسبة إلى واجهات CLI التي تصدر JSONL متوافقًا مع stream-json الخاص بـ Claude Code، عيّن
`jsonlDialect: "claude-stream-json"` في إعداد تلك الواجهة الخلفية.

## تراكبات Bundle MCP

لا تتلقى واجهات CLI الخلفية **استدعاءات أدوات OpenClaw مباشرةً**، لكن يمكن لواجهة خلفية
أن تشترك في تراكب إعداد MCP مُولَّد عبر `bundleMcp: true`.

السلوك المضمّن الحالي:

- `claude-cli`: ملف إعداد MCP صارم مُولَّد
- `codex-cli`: تجاوزات إعدادات مضمنة لـ `mcp_servers`
- `google-gemini-cli`: ملف إعدادات نظام Gemini مُولَّد

عند تفعيل bundle MCP، يقوم OpenClaw بما يلي:

- يشغّل خادم HTTP MCP حلقيًا يعرّض أدوات Gateway لعملية CLI
- يصادق الجسر باستخدام رمز مميز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يقيّد الوصول إلى الأدوات وفق الجلسة الحالية، والحساب، وسياق القناة
- يحمّل خوادم bundle-MCP المفعّلة لمساحة العمل الحالية
- يدمجها مع أي شكل إعداد/ضبط MCP موجود للواجهة الخلفية
- يعيد كتابة إعداد التشغيل باستخدام وضع التكامل المملوك للواجهة الخلفية من الامتداد المالك

إذا لم تكن أي خوادم MCP مفعّلة، فسيظل OpenClaw يحقن إعدادًا صارمًا عندما
تشترك واجهة خلفية في bundle MCP بحيث تظل التشغيلات الخلفية معزولة.

## القيود

- **لا توجد استدعاءات مباشرة لأدوات OpenClaw.** لا يحقن OpenClaw استدعاءات الأدوات في
  بروتوكول الواجهة الخلفية لـ CLI. ولا ترى الواجهات الخلفية أدوات Gateway إلا عندما تشترك في
  `bundleMcp: true`.
- **البث خاص بالواجهة الخلفية.** بعض الواجهات الخلفية تبث JSONL؛ بينما يقوم بعضها الآخر بالتخزين المؤقت
  حتى الخروج.
- **المخرجات المنظَّمة** تعتمد على تنسيق JSON الخاص بواجهة CLI.
- **جلسات Codex CLI** تستأنف عبر مخرجات نصية (من دون JSONL)، وهو ما يكون أقل
  تنظيمًا من تشغيل `--json` الأولي. ولا تزال جلسات OpenClaw تعمل
  بشكل طبيعي.

## استكشاف الأخطاء وإصلاحها

- **لم يتم العثور على CLI**: عيّن `command` إلى مسار كامل.
- **اسم نموذج غير صحيح**: استخدم `modelAliases` لربط `provider/model` ← نموذج CLI.
- **لا يوجد استمرارية للجلسة**: تأكد من تعيين `sessionArg` وأن `sessionMode` ليس
  `none` (لا يمكن لـ Codex CLI حاليًا الاستئناف باستخدام مخرجات JSON).
- **تم تجاهل الصور**: عيّن `imageArg` (وتحقق من أن واجهة CLI تدعم مسارات الملفات).
