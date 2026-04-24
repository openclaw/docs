---
read_when:
    - تريد رجوعًا موثوقًا عندما تفشل مزوّدات API
    - أنت تشغّل Codex CLI أو غيره من واجهات AI CLI المحلية وتريد إعادة استخدامها
    - تريد فهم جسر MCP loopback للوصول إلى أدوات الواجهة الخلفية لـ CLI
summary: 'الواجهات الخلفية لـ CLI: رجوع محلي إلى AI CLI مع جسر أدوات MCP اختياري'
title: الواجهات الخلفية لـ CLI
x-i18n:
    generated_at: "2026-04-24T07:40:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# الواجهات الخلفية لـ CLI (بيئة تشغيل الرجوع)

يمكن لـ OpenClaw تشغيل **واجهات AI CLI محلية** كـ **رجوع نصي فقط** عندما تتعطل مزوّدات API،
أو تُفرض عليها حدود المعدل، أو تسيء التصرف مؤقتًا. وهذا متحفظ عمدًا:

- **لا يتم حقن أدوات OpenClaw مباشرة**، لكن الواجهات الخلفية التي تملك `bundleMcp: true`
  يمكنها تلقي أدوات gateway عبر جسر MCP loopback.
- **بث JSONL** لواجهات CLI التي تدعمه.
- **الجلسات مدعومة** (بحيث تبقى الأدوار اللاحقة متماسكة).
- **يمكن تمرير الصور** إذا كانت واجهة CLI تقبل مسارات الصور.

صُمم هذا ليكون **شبكة أمان** بدلًا من مسار أساسي. استخدمه عندما
تريد ردودًا نصية «تعمل دائمًا» من دون الاعتماد على APIs خارجية.

إذا كنت تريد بيئة harness كاملة مع عناصر تحكم جلسات ACP، والمهام الخلفية،
وربط الخيوط/المحادثات، وجلسات برمجة خارجية دائمة، فاستخدم
[ACP Agents](/ar/tools/acp-agents) بدلًا من ذلك. فالواجهات الخلفية لـ CLI ليست ACP.

## بدء سريع مناسب للمبتدئين

يمكنك استخدام Codex CLI **من دون أي إعداد** (يسجّل
Plugin OpenAI المضمن واجهة خلفية افتراضية):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

إذا كان Gateway لديك يعمل تحت launchd/systemd وكان PATH محدودًا، فأضف فقط
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

هذا كل شيء. لا مفاتيح، ولا إعدادات مصادقة إضافية مطلوبة خارج ما يحتاجه CLI نفسه.

إذا كنت تستخدم واجهة CLI خلفية مضمنة كـ **مزوّد الرسائل الأساسي** على
مضيف gateway، فإن OpenClaw يحمّل الآن تلقائيًا Plugin المضمن المالك عندما تشير إعداداتك
صراحةً إلى تلك الواجهة الخلفية في مرجع نموذج أو تحت
`agents.defaults.cliBackends`.

## استخدامها كرجوع

أضف واجهة CLI خلفية إلى قائمة الرجوع لديك بحيث لا تعمل إلا عندما تفشل النماذج الأساسية:

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

- إذا كنت تستخدم `agents.defaults.models` (قائمة سماح)، فيجب أن تضمّن نماذج واجهتك الخلفية لـ CLI هناك أيضًا.
- إذا فشل المزوّد الأساسي (المصادقة، وحدود المعدل، والمهلات)، فسيحاول OpenClaw
  الواجهة الخلفية لـ CLI بعد ذلك.

## نظرة عامة على الإعدادات

توجد جميع الواجهات الخلفية لـ CLI تحت:

```
agents.defaults.cliBackends
```

يكون كل إدخال مرتبطًا بـ **معرّف مزوّد** (مثل `codex-cli` أو `my-cli`).
ويصبح معرّف المزوّد هو الجانب الأيسر من مرجع النموذج لديك:

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
          // يمكن لواجهات CLI على نمط Codex الإشارة إلى ملف مطالبة بدلًا من ذلك:
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

1. **يختار واجهة خلفية** بناءً على بادئة المزوّد (`codex-cli/...`).
2. **يبني system prompt** باستخدام مطالبة OpenClaw نفسها + سياق مساحة العمل.
3. **ينفذ CLI** باستخدام معرّف جلسة (إذا كان مدعومًا) بحيث يبقى السجل متسقًا.
   وتحافظ الواجهة الخلفية المضمنة `claude-cli` على عملية Claude stdio حية لكل
   جلسة OpenClaw وترسل الأدوار اللاحقة عبر stdin من نوع stream-json.
4. **يحلل المخرجات** (`JSON` أو نص عادي) ويعيد النص النهائي.
5. **يحفظ معرّفات الجلسات** لكل واجهة خلفية، بحيث تعيد الأدوار اللاحقة استخدام جلسة CLI نفسها.

<Note>
أصبحت الواجهة الخلفية المضمنة `claude-cli` الخاصة بـ Anthropic مدعومة مرة أخرى. وقد أخبرنا
فريق Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع
استخدام `claude -p` على أنه مسموح لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تمرر الواجهة الخلفية المضمنة `codex-cli` الخاصة بـ OpenAI system prompt الخاص بـ OpenClaw عبر
تجاوز إعداد `model_instructions_file` في Codex (`-c
model_instructions_file="..."`). لا يكشف Codex عن علم
`--append-system-prompt` على نمط Claude، لذلك يكتب OpenClaw المطالبة المجمعة إلى
ملف مؤقت لكل جلسة Codex CLI جديدة.

تتلقى الواجهة الخلفية المضمنة `claude-cli` الخاصة بـ Anthropic لقطة Skills الخاصة بـ OpenClaw
بطريقتين: كتالوج Skills المضغوط الخاص بـ OpenClaw في system prompt الملحق، و
Plugin Claude Code مؤقت يُمرَّر باستخدام `--plugin-dir`. ولا يحتوي الـ Plugin
إلا على Skills المؤهلة لذلك الوكيل/الجلسة، بحيث يرى محلل Skills الأصلي في Claude Code
المجموعة المصفاة نفسها التي كان OpenClaw سيعلنها لولا ذلك في
المطالبة. وما تزال تجاوزات البيئة/مفاتيح API الخاصة بـ Skill تُطبَّق بواسطة OpenClaw على
بيئة عملية child لهذا التشغيل.

يمتلك Claude CLI أيضًا وضع أذونات غير تفاعلي خاصًا به. ويعيّن OpenClaw هذا
إلى سياسة exec الحالية بدلًا من إضافة إعداد خاص بـ Claude: عندما تكون
سياسة exec المطلوبة الفعالة هي YOLO (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، يضيف OpenClaw القيمة `--permission-mode bypassPermissions`.
وتتجاوز إعدادات `agents.list[].tools.exec` لكل وكيل الإعداد العام `tools.exec` لذلك
الوكيل. ولإجبار Claude على وضع مختلف، اضبط وسائط الواجهة الخلفية الخام الصريحة
مثل `--permission-mode default` أو `--permission-mode acceptEdits` تحت
`agents.defaults.cliBackends.claude-cli.args` و`resumeArgs` المطابقة.

قبل أن يتمكن OpenClaw من استخدام الواجهة الخلفية المضمنة `claude-cli`، يجب أن يكون Claude Code نفسه
قد سجّل الدخول بالفعل على المضيف نفسه:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

استخدم `agents.defaults.cliBackends.claude-cli.command` فقط عندما لا يكون الملف التنفيذي `claude`
موجودًا مسبقًا على `PATH`.

## الجلسات

- إذا كانت واجهة CLI تدعم الجلسات، فاضبط `sessionArg` (مثل `--session-id`) أو
  `sessionArgs` (العنصر النائب `{sessionId}`) عندما يلزم إدراج المعرّف
  في عدة أعلام.
- إذا كانت واجهة CLI تستخدم **أمرًا فرعيًا للاستئناف** مع أعلام مختلفة، فاضبط
  `resumeArgs` (ويحل محل `args` عند الاستئناف) واختياريًا `resumeOutput`
  (للاستئنافات غير المعتمدة على JSON).
- `sessionMode`:
  - `always`: أرسل دائمًا معرّف جلسة (UUID جديد إذا لم يكن هناك معرّف مخزّن).
  - `existing`: أرسل معرّف جلسة فقط إذا كان قد خُزِّن من قبل.
  - `none`: لا ترسل مطلقًا معرّف جلسة.
- تستخدم `claude-cli` افتراضيًا `liveSession: "claude-stdio"` و`output: "jsonl"`،
  و`input: "stdin"` بحيث تعيد الأدوار اللاحقة استخدام عملية Claude الحية بينما
  تظل نشطة. ويُعد stdio الدافئ هو الافتراضي الآن، بما في ذلك للإعدادات المخصصة
  التي تحذف حقول النقل. وإذا أُعيد تشغيل Gateway أو خرجت العملية الخاملة،
  يستأنف OpenClaw من معرّف جلسة Claude المخزّن. ويتم التحقق من معرّفات الجلسات
  المخزّنة مقابل نص مفرغ موجود وقابل للقراءة للمشروع قبل
  الاستئناف، بحيث تُمسح الارتباطات الوهمية مع `reason=transcript-missing`
  بدلًا من بدء جلسة Claude CLI جديدة بصمت تحت `--resume`.
- تعد جلسات CLI المخزنة استمرارية مملوكة للمزوّد. ولا يؤدي
  إعادة التعيين اليومية الضمنية للجلسة إلى قطعها؛ بينما يؤدي `/reset` وسياسات `session.reset`
  الصريحة إلى ذلك.

ملاحظات التسلسل:

- يحافظ `serialize: true` على ترتيب التشغيلات في المسار نفسه.
- تسلسِل معظم واجهات CLI التشغيلات على مسار مزوّد واحد.
- يسقط OpenClaw إعادة استخدام جلسات CLI المخزنة عندما تتغير هوية المصادقة المحددة،
  بما في ذلك تغيّر معرّف ملف تعريف المصادقة، أو مفتاح API ثابت، أو رمز مميز ثابت، أو هوية
  حساب OAuth عندما تكشفها واجهة CLI. أما تدوير رموز الوصول والتحديث في OAuth
  فلا يقطع جلسة CLI المخزنة. وإذا لم تكشف واجهة CLI عن معرّف حساب OAuth ثابت،
  فيسمح OpenClaw لتلك الواجهة بفرض أذونات الاستئناف.

## الصور (تمرير مباشر)

إذا كانت واجهة CLI تقبل مسارات الصور، فاضبط `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيكتب OpenClaw الصور المشفرة base64 إلى ملفات مؤقتة. وإذا كان `imageArg` مضبوطًا،
فستُمرر هذه المسارات كوسائط CLI. وإذا كان `imageArg` مفقودًا، فسيضيف OpenClaw
مسارات الملفات إلى المطالبة (حقن المسار)، وهو ما يكفي لواجهات CLI التي
تحمّل الملفات المحلية تلقائيًا من المسارات العادية.

## المدخلات / المخرجات

- يحاول `output: "json"` (الافتراضي) تحليل JSON واستخراج النص + معرّف الجلسة.
- بالنسبة إلى مخرجات Gemini CLI بصيغة JSON، يقرأ OpenClaw نص الرد من `response` و
  الاستخدام من `stats` عندما تكون `usage` مفقودة أو فارغة.
- يحلل `output: "jsonl"` تدفقات JSONL (على سبيل المثال Codex CLI ‏`--json`) ويستخرج رسالة الوكيل النهائية بالإضافة إلى معرّفات الجلسة
  عند وجودها.
- يعامل `output: "text"` قيمة stdout على أنها الاستجابة النهائية.

أوضاع الإدخال:

- يمرر `input: "arg"` (الافتراضي) المطالبة كآخر وسيطة CLI.
- يرسل `input: "stdin"` المطالبة عبر stdin.
- إذا كانت المطالبة طويلة جدًا وكان `maxPromptArgChars` مضبوطًا، فسيُستخدم stdin.

## القيم الافتراضية (مملوكة للـ Plugin)

يسجّل Plugin OpenAI المضمن أيضًا قيمة افتراضية لـ `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

يسجّل Plugin Google المضمن أيضًا قيمة افتراضية لـ `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

المتطلب المسبق: يجب أن يكون Gemini CLI المحلي مثبتًا ومتاحًا باسم
`gemini` على `PATH` (`brew install gemini-cli` أو
`npm install -g @google/gemini-cli`).

ملاحظات JSON الخاصة بـ Gemini CLI:

- يُقرأ نص الرد من حقل JSON ‏`response`.
- يعود الاستخدام إلى `stats` عندما تكون `usage` غائبة أو فارغة.
- تُطبّع `stats.cached` إلى OpenClaw ‏`cacheRead`.
- إذا كانت `stats.input` مفقودة، فإن OpenClaw يشتق رموز الإدخال من
  `stats.input_tokens - stats.cached`.

قم بالتجاوز فقط عند الحاجة (الشائع: مسار `command` مطلق).

## القيم الافتراضية المملوكة للـ Plugin

أصبحت القيم الافتراضية للواجهات الخلفية لـ CLI الآن جزءًا من سطح Plugin:

- تسجلها Plugins بواسطة `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالواجهة الخلفية هو بادئة المزوّد في مراجع النماذج.
- ما يزال إعداد المستخدم في `agents.defaults.cliBackends.<id>` يتجاوز القيمة الافتراضية للـ Plugin.
- يبقى تنظيف الإعدادات الخاصة بالواجهة الخلفية مملوكًا للـ Plugin عبر
  الخطاف الاختياري `normalizeConfig`.

يمكن للـ Plugins التي تحتاج إلى طبقات توافق صغيرة للمطالبة/الرسالة أن تعلن
تحويلات نصية ثنائية الاتجاه من دون استبدال مزوّد أو واجهة خلفية لـ CLI:

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

يعيد `input` كتابة system prompt ومطالبة المستخدم الممررتين إلى CLI. ويعيد
`output` كتابة فروق assistant المبثوثة والنص النهائي المحلل قبل أن يعالج OpenClaw
علامات التحكم الخاصة به وتسليم القناة.

بالنسبة إلى واجهات CLI التي تصدر JSONL متوافقًا مع Claude Code stream-json، اضبط
`jsonlDialect: "claude-stream-json"` على إعداد تلك الواجهة الخلفية.

## طبقات Bundle MCP الإضافية

لا تتلقى الواجهات الخلفية لـ CLI **استدعاءات أدوات OpenClaw مباشرة**، لكن يمكن لواجهة خلفية
الاشتراك في طبقة MCP إضافية مولدة باستخدام `bundleMcp: true`.

السلوك المضمن الحالي:

- `claude-cli`: ملف إعداد MCP صارم مُولَّد
- `codex-cli`: تجاوزات إعدادات مضمنة لـ `mcp_servers`؛ ويتم تمييز
  خادم OpenClaw loopback المُولَّد بوضع موافقة الأدوات لكل خادم الخاص بـ Codex
  حتى لا تتوقف استدعاءات MCP عند مطالبات الموافقة المحلية
- `google-gemini-cli`: ملف إعدادات نظام Gemini مُولَّد

عند تفعيل Bundle MCP، يقوم OpenClaw بما يلي:

- يشغّل خادم MCP عبر HTTP من نوع loopback يكشف أدوات gateway لعملية CLI
- يصادق الجسر باستخدام رمز مميز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يقيّد الوصول إلى الأدوات على سياق الجلسة والحساب والقناة الحالي
- يحمّل خوادم Bundle MCP المفعّلة لمساحة العمل الحالية
- يدمجها مع أي شكل إعداد/إعدادات MCP موجود بالفعل في الواجهة الخلفية
- يعيد كتابة إعداد التشغيل باستخدام وضع التكامل المملوك للواجهة الخلفية من الامتداد المالك

إذا لم تكن أي خوادم MCP مفعلة، فما يزال OpenClaw يحقن إعدادًا صارمًا عندما
تشترك واجهة خلفية في Bundle MCP بحيث تبقى التشغيلات الخلفية معزولة.

## القيود

- **لا توجد استدعاءات مباشرة لأدوات OpenClaw.** لا يحقن OpenClaw استدعاءات الأدوات داخل
  بروتوكول الواجهة الخلفية لـ CLI. ولا ترى الواجهات الخلفية أدوات gateway إلا عندما تشترك في
  `bundleMcp: true`.
- **البث خاص بكل واجهة خلفية.** تبث بعض الواجهات الخلفية JSONL؛ بينما تقوم أخرى بالتخزين المؤقت
  حتى الخروج.
- **المخرجات المنظمة** تعتمد على تنسيق JSON الخاص بواجهة CLI.
- **تستأنف جلسات Codex CLI** عبر مخرجات نصية (وليس JSONL)، وهو ما يكون أقل
  تنظيمًا من تشغيل `--json` الأولي. وما تزال جلسات OpenClaw تعمل بشكل
  طبيعي.

## استكشاف الأخطاء وإصلاحها

- **تعذر العثور على CLI**: اضبط `command` على مسار كامل.
- **اسم نموذج غير صحيح**: استخدم `modelAliases` لتعيين `provider/model` → نموذج CLI.
- **لا يوجد استمرارية للجلسة**: تأكد من ضبط `sessionArg` وأن `sessionMode` ليست
  `none` (لا يستطيع Codex CLI حاليًا الاستئناف مع مخرجات JSON).
- **يتم تجاهل الصور**: اضبط `imageArg` (وتحقق من أن CLI يدعم مسارات الملفات).

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [النماذج المحلية](/ar/gateway/local-models)
