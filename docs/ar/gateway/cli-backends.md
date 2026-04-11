---
read_when:
    - تريد خيارًا احتياطيًا موثوقًا به عندما يتعطل موفرو API
    - أنت تشغّل Codex CLI أو واجهات CLI محلية أخرى للذكاء الاصطناعي وتريد إعادة استخدامها
    - تريد فهم جسر MCP عبر local loopback للوصول إلى أدوات الواجهة الخلفية لـ CLI
summary: 'واجهات CLI الخلفية: تراجع CLI للذكاء الاصطناعي المحلي مع جسر أداة MCP اختياري'
title: واجهات CLI الخلفية
x-i18n:
    generated_at: "2026-04-11T02:44:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d108dbea043c260a80d15497639298f71a6b4d800f68d7b39bc129f7667ca608
    source_path: gateway/cli-backends.md
    workflow: 15
---

# واجهات CLI الخلفية (بيئة تشغيل احتياطية)

يمكن لـ OpenClaw تشغيل **واجهات CLI محلية للذكاء الاصطناعي** كخيار **احتياطي نصّي فقط** عندما يتعطل موفرو API،
أو يتم تقييدهم بالمعدل، أو يسيئون التصرف مؤقتًا. هذا النهج متحفّظ عمدًا:

- **لا يتم حقن أدوات OpenClaw مباشرةً**، لكن الواجهات الخلفية التي تحتوي على `bundleMcp: true`
  يمكنها تلقي أدوات البوابة عبر جسر MCP عبر local loopback.
- **بث JSONL** لواجهات CLI التي تدعمه.
- **الجلسات مدعومة** (بحيث تظل الجولات اللاحقة مترابطة).
- **يمكن تمرير الصور** إذا كانت واجهة CLI تقبل مسارات الصور.

هذا مصمم ليكون **شبكة أمان** وليس مسارًا أساسيًا. استخدمه عندما
تريد استجابات نصية من نوع "يعمل دائمًا" من دون الاعتماد على واجهات API خارجية.

إذا كنت تريد بيئة تشغيل كاملة مع عناصر تحكم جلسات ACP، والمهام في الخلفية،
وربط السلسلة/المحادثة، وجلسات برمجة خارجية دائمة، فاستخدم
[وكلاء ACP](/ar/tools/acp-agents) بدلًا من ذلك. الواجهات الخلفية لـ CLI ليست ACP.

## بدء سريع مناسب للمبتدئين

يمكنك استخدام Codex CLI **من دون أي إعداد** (تقوم إضافة OpenAI المضمّنة
بتسجيل واجهة خلفية افتراضية):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

إذا كانت بوابتك تعمل تحت launchd/systemd وكان PATH محدودًا، فأضف فقط
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

هذا كل شيء. لا حاجة إلى مفاتيح أو إعدادات مصادقة إضافية تتجاوز ما تتطلبه واجهة CLI نفسها.

إذا كنت تستخدم واجهة CLI خلفية مضمّنة باعتبارها **موفر الرسائل الأساسي** على
مضيف البوابة، فإن OpenClaw يقوم الآن بتحميل الإضافة المضمّنة المالكة تلقائيًا عندما يشير إعدادك
صراحةً إلى تلك الواجهة الخلفية في مرجع نموذج أو تحت
`agents.defaults.cliBackends`.

## استخدامها كخيار احتياطي

أضف واجهة CLI خلفية إلى قائمة الخيارات الاحتياطية بحيث تعمل فقط عندما تفشل النماذج الأساسية:

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

- إذا كنت تستخدم `agents.defaults.models` (قائمة السماح)، فيجب أن تُدرج فيها نماذج واجهة CLI الخلفية أيضًا.
- إذا فشل الموفر الأساسي (المصادقة، حدود المعدل، المهلات)، فسيحاول OpenClaw
  استخدام واجهة CLI الخلفية بعد ذلك.

## نظرة عامة على الإعداد

توجد كل الواجهات الخلفية لـ CLI تحت:

```
agents.defaults.cliBackends
```

كل إدخال يُفتاح بواسطة **معرف موفر** (مثل `codex-cli` أو `my-cli`).
ويصبح معرف الموفّر هو الجزء الأيسر من مرجع النموذج:

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
          // يمكن لواجهات CLI بأسلوب Codex الإشارة إلى ملف مطالبة بدلًا من ذلك:
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

1. **يختار واجهة خلفية** استنادًا إلى بادئة الموفّر (`codex-cli/...`).
2. **يبني مطالبة نظام** باستخدام مطالبة OpenClaw نفسها + سياق مساحة العمل.
3. **يشغّل واجهة CLI** مع معرّف جلسة (إذا كانت مدعومة) بحيث يظل السجل متسقًا.
4. **يحلل المخرجات** (JSON أو نص عادي) ويعيد النص النهائي.
5. **يحفظ معرّفات الجلسات** لكل واجهة خلفية، بحيث تعيد الجولات اللاحقة استخدام جلسة CLI نفسها.

<Note>
أصبحت الواجهة الخلفية المضمّنة `claude-cli` الخاصة بـ Anthropic مدعومة مرة أخرى. أخبرنا
موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع استخدام
`claude -p` على أنه معتمد لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تمرّر الواجهة الخلفية المضمّنة `codex-cli` الخاصة بـ OpenAI مطالبة نظام OpenClaw
عبر تجاوز إعداد `model_instructions_file` في Codex (`-c
model_instructions_file="..."`). لا يوفّر Codex علامة
`--append-system-prompt` على طريقة Claude، لذلك يكتب OpenClaw المطالبة المجمّعة إلى
ملف مؤقت لكل جلسة Codex CLI جديدة.

تتلقى الواجهة الخلفية المضمّنة `claude-cli` الخاصة بـ Anthropic لقطة Skills الخاصة بـ OpenClaw
بطريقتين: فهرس Skills المضغوط الخاص بـ OpenClaw في مطالبة النظام الملحقة، و
إضافة Claude Code مؤقتة يتم تمريرها باستخدام `--plugin-dir`. تحتوي الإضافة
فقط على Skills المؤهلة لذلك الوكيل/الجلسة، بحيث يرى محلل Skills الأصلي في Claude Code
المجموعة المصفّاة نفسها التي كان OpenClaw سيعلنها بخلاف ذلك في
المطالبة. ولا يزال OpenClaw يطبّق تجاوزات متغيرات البيئة/مفاتيح API الخاصة بـ Skills على
بيئة عملية الابن أثناء التشغيل.

## الجلسات

- إذا كانت واجهة CLI تدعم الجلسات، فاضبط `sessionArg` (مثل `--session-id`) أو
  `sessionArgs` (العنصر النائب `{sessionId}`) عندما يلزم إدراج المعرّف
  في عدة علامات.
- إذا كانت واجهة CLI تستخدم **أمرًا فرعيًا للاستئناف** مع علامات مختلفة، فاضبط
  `resumeArgs` (يستبدل `args` عند الاستئناف) ويمكنك اختياريًا ضبط `resumeOutput`
  (لحالات الاستئناف غير JSON).
- `sessionMode`:
  - `always`: أرسل دائمًا معرّف جلسة (UUID جديد إذا لم يكن هناك معرّف مخزّن).
  - `existing`: أرسل معرّف جلسة فقط إذا كان مخزنًا من قبل.
  - `none`: لا ترسل معرّف جلسة أبدًا.

ملاحظات حول التسلسل:

- يحافظ `serialize: true` على ترتيب عمليات التشغيل ضمن المسار نفسه.
- تقوم معظم واجهات CLI بالتسلسل على مسار موفّر واحد.
- يسقط OpenClaw إعادة استخدام جلسة CLI المخزنة عندما تتغير حالة مصادقة الواجهة الخلفية، بما في ذلك إعادة تسجيل الدخول، أو تدوير الرموز، أو تغيّر بيانات اعتماد ملف تعريف المصادقة.

## الصور (تمرير مباشر)

إذا كانت واجهة CLI الخاصة بك تقبل مسارات الصور، فاضبط `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيكتب OpenClaw الصور المشفرة بـ base64 إلى ملفات مؤقتة. إذا تم تعيين `imageArg`، فسيتم
تمرير تلك المسارات كوسائط CLI. وإذا كان `imageArg` غير موجود، فسيقوم OpenClaw بإلحاق
مسارات الملفات بالمطالبة (حقن المسار)، وهذا يكفي لواجهات CLI التي
تُحمّل الملفات المحلية تلقائيًا من المسارات النصية العادية.

## المدخلات / المخرجات

- يحاول `output: "json"` (الافتراضي) تحليل JSON واستخراج النص + معرّف الجلسة.
- بالنسبة إلى مخرجات JSON الخاصة بـ Gemini CLI، يقرأ OpenClaw نص الرد من `response` و
  معلومات الاستخدام من `stats` عندما يكون `usage` مفقودًا أو فارغًا.
- يقوم `output: "jsonl"` بتحليل تدفقات JSONL (مثل Codex CLI `--json`) واستخراج رسالة الوكيل النهائية بالإضافة إلى معرّفات الجلسة
  عند وجودها.
- يتعامل `output: "text"` مع stdout على أنه الاستجابة النهائية.

أوضاع الإدخال:

- يمرّر `input: "arg"` (الافتراضي) المطالبة باعتبارها آخر وسيطة CLI.
- يرسل `input: "stdin"` المطالبة عبر stdin.
- إذا كانت المطالبة طويلة جدًا وتم تعيين `maxPromptArgChars`، فسيتم استخدام stdin.

## القيم الافتراضية (تملكها الإضافة)

تقوم إضافة OpenAI المضمّنة أيضًا بتسجيل قيمة افتراضية لـ `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

كما تسجّل إضافة Google المضمّنة أيضًا قيمة افتراضية لـ `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

المتطلب المسبق: يجب أن تكون Gemini CLI المحلية مثبّتة ومتاحة باسم
`gemini` على `PATH` (`brew install gemini-cli` أو
`npm install -g @google/gemini-cli`).

ملاحظات حول JSON في Gemini CLI:

- يُقرأ نص الرد من الحقل `response` في JSON.
- يعود الاستخدام إلى `stats` عندما يكون `usage` غائبًا أو فارغًا.
- تتم تسوية `stats.cached` إلى `cacheRead` في OpenClaw.
- إذا كان `stats.input` مفقودًا، يستنتج OpenClaw رموز الإدخال من
  `stats.input_tokens - stats.cached`.

لا تُجرِ أي تجاوزات إلا عند الحاجة (الشائع: مسار `command` مطلق).

## القيم الافتراضية المملوكة للإضافة

أصبحت القيم الافتراضية للواجهات الخلفية لـ CLI الآن جزءًا من سطح الإضافة:

- تسجلها الإضافات باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالواجهة الخلفية هو بادئة الموفّر في مراجع النماذج.
- يظل إعداد المستخدم في `agents.defaults.cliBackends.<id>` متقدّمًا على القيمة الافتراضية للإضافة.
- تظل عملية تنظيف الإعدادات الخاصة بالواجهة الخلفية مملوكة للإضافة عبر
  الخطاف الاختياري `normalizeConfig`.

يمكن للإضافات التي تحتاج إلى تكييفات صغيرة لتوافق المطالبات/الرسائل أن تعلن
تحويلات نصية ثنائية الاتجاه من دون استبدال موفّر أو واجهة CLI خلفية:

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

يعيد `input` كتابة مطالبة النظام ومطالبة المستخدم الممرّرتين إلى واجهة CLI. ويعيد
`output` كتابة دلتا البث الخاصة بالمساعد والنص النهائي الذي تم تحليله قبل أن يتعامل OpenClaw
مع علامات التحكم الخاصة به وتسليم القناة.

بالنسبة إلى واجهات CLI التي تُصدر JSONL متوافقًا مع stream-json الخاص بـ Claude Code، اضبط
`jsonlDialect: "claude-stream-json"` في إعداد تلك الواجهة الخلفية.

## تراكبات MCP المضمّنة

لا تتلقى الواجهات الخلفية لـ CLI **استدعاءات أدوات OpenClaw مباشرةً**، لكن يمكن لواجهة خلفية
الاشتراك في تراكب إعداد MCP مولّد باستخدام `bundleMcp: true`.

السلوك المضمّن الحالي:

- `claude-cli`: ملف إعداد MCP صارم مولّد
- `codex-cli`: تجاوزات إعدادات مضمّنة لـ `mcp_servers`
- `google-gemini-cli`: ملف إعدادات نظام Gemini مولّد

عند تفعيل bundle MCP، يقوم OpenClaw بما يلي:

- يشغّل خادم HTTP MCP عبر loopback يعرّض أدوات البوابة لعملية CLI
- يصادق الجسر باستخدام رمز مميز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يقيّد الوصول إلى الأدوات بحسب الجلسة الحالية، والحساب، وسياق القناة
- يحمّل خوادم bundle-MCP المفعّلة لمساحة العمل الحالية
- يدمجها مع أي شكل موجود مسبقًا لإعدادات/تكوين MCP في الواجهة الخلفية
- يعيد كتابة إعداد التشغيل باستخدام وضع التكامل المملوك للواجهة الخلفية من الامتداد المالك

إذا لم تكن هناك خوادم MCP مفعّلة، فإن OpenClaw يظل يحقن إعدادًا صارمًا عندما
تشترك واجهة خلفية في bundle MCP بحيث تظل عمليات الخلفية معزولة.

## القيود

- **لا توجد استدعاءات مباشرة لأدوات OpenClaw.** لا يحقن OpenClaw استدعاءات الأدوات في
  بروتوكول الواجهة الخلفية لـ CLI. لا ترى الواجهات الخلفية أدوات البوابة إلا عندما تشترك في
  `bundleMcp: true`.
- **البث خاص بالواجهة الخلفية.** بعض الواجهات الخلفية تبث JSONL؛ وأخرى تقوم بالتخزين المؤقت
  حتى الخروج.
- **المخرجات المهيكلة** تعتمد على تنسيق JSON الخاص بواجهة CLI.
- **جلسات Codex CLI** تُستأنف عبر مخرجات نصية (من دون JSONL)، وهو ما يكون أقل
  تنظيمًا من تشغيل `--json` الأولي. ومع ذلك، تظل جلسات OpenClaw تعمل
  بشكل طبيعي.

## استكشاف الأخطاء وإصلاحها

- **لم يتم العثور على CLI**: اضبط `command` على مسار كامل.
- **اسم نموذج غير صحيح**: استخدم `modelAliases` لربط `provider/model` ← نموذج CLI.
- **لا يوجد استمرارية للجلسة**: تأكد من تعيين `sessionArg` وأن `sessionMode` ليس
  `none` (لا يستطيع Codex CLI حاليًا الاستئناف مع مخرجات JSON).
- **تم تجاهل الصور**: اضبط `imageArg` (وتحقق من أن واجهة CLI تدعم مسارات الملفات).
